// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../../OwnableMaster.sol";

import "../../TransferHub/TransferHelper.sol";
import "../../TransferHub/ApprovalHelper.sol";

import "../../InterfaceHub/IPendle.sol";
import "../../InterfaceHub/IArbRewardsClaimer.sol";
import "../../InterfaceHub/IWiseOracleHub.sol";
import "../../InterfaceHub/IPendlePowerFarmToken.sol";
import "../../InterfaceHub/IPendlePowerFarmTokenFactory.sol";

error NotAllowed();
error AlreadySet();
error NotExpired();
error LockTimeTooShort();
error ZeroShares();
error ValueTooSmall();
error InvalidLength();
error InvalidWeightSum();
error WrongAddress();
error NothingToSkim();
error NotFound();
error NotEnoughCompound();
error NotArbitrum();

contract PendlePowerFarmControllerBase is
    OwnableMaster,
    TransferHelper,
    ApprovalHelper
{
    struct CompoundStruct {
        uint256[] reservedForCompound;
        uint128[] lastIndex;
        address[] rewardTokens;
    }

    address internal immutable PENDLE_TOKEN_ADDRESS;

    address internal immutable VOTER_CONTRACT_ADDRESS;
    address internal immutable VOTER_REWARDS_CLAIMER_ADDRESS;

    address internal immutable WISE_ORACLE_HUB_ADDRESS;
    address internal immutable VE_PENDLE_CONTRACT_ADDRESS;

    uint256 internal constant PRECISION_FACTOR_E6 = 1E6;
    uint256 internal constant PRECISION_FACTOR_E10 = 1E10;
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;

    uint256 internal constant MAINNET_CHAIN_ID = 1;
    uint256 internal constant ARBITRUM_CHAIN_ID = 42161;

    uint256 public reservedPendleForLocking;

    mapping(address => address) public pendleChildAddress;
    mapping(address => CompoundStruct) pendleChildCompoundInfo;

    address[] public activePendleMarkets;

    bool immutable IS_ETH_MAIN;

    uint128 internal constant WEEK = 7 days;
    uint256 public exchangeIncentive;

    IPendleLock immutable public PENDLE_LOCK;
    IPendleVoter immutable public PENDLE_VOTER;
    IPendleVoteRewards immutable public PENDLE_VOTE_REWARDS;

    IArbRewardsClaimer public ARB_REWARDS;

    address internal constant ARB_REWARDS_ADDRESS = 0x23a102e78D1FF1645a3666691495174764a5FCAF;
    address internal constant ARB_TOKEN_ADDRESS = 0x912CE59144191C1204E64559FE8253a0e49E6548;

    IWiseOracleHub immutable internal ORACLE_HUB;

    constructor(
        address _vePendle,
        address _pendleToken,
        address _voterContract,
        address _voterRewardsClaimerAddress,
        address _wiseOracleHub
    )
        OwnableMaster(
            msg.sender
        )
    {
        IS_ETH_MAIN = block.chainid == MAINNET_CHAIN_ID
            ? true
            : false;

        PENDLE_TOKEN_ADDRESS = _pendleToken;

        VOTER_CONTRACT_ADDRESS = _voterContract;
        VOTER_REWARDS_CLAIMER_ADDRESS = _voterRewardsClaimerAddress;

        WISE_ORACLE_HUB_ADDRESS = _wiseOracleHub;
        VE_PENDLE_CONTRACT_ADDRESS = _vePendle;

        PENDLE_LOCK = IPendleLock(
            _vePendle
        );

        PENDLE_VOTER = IPendleVoter(
            _voterContract
        );

        PENDLE_VOTE_REWARDS = IPendleVoteRewards(
            _voterRewardsClaimerAddress
        );

        ORACLE_HUB = IWiseOracleHub(
            _wiseOracleHub
        );

        ARB_REWARDS = IArbRewardsClaimer(
            ARB_REWARDS_ADDRESS
        );

        exchangeIncentive = 50000;
    }

    receive()
        external
        payable
    {
        emit ETHReceived(
            msg.value,
            msg.sender
        );
    }

    event ETHReceived(
        uint256 _amount,
        address _sender
    );

    event ChangeExchangeIncentive(
        uint256 _newExchangeIncentive
    );

    event WithdrawLp(
        address indexed _pendleMarket,
        address indexed _to,
        uint256 _amount
    );

    event ExchangeRewardsForCompounding(
        address indexed _pendleMarket,
        address indexed _rewardToken,
        uint256 _rewardAmount,
        uint256 _sendingAmount
    );

    event ExchangeLpFeesForPendle(
        address indexed _pendleMarket,
        uint256 _pendleChildShares,
        uint256 _tokenAmountSend,
        uint256 _withdrawnAmount
    );

    event AddPendleMarket(
        address indexed _pendleMarket,
        address indexed _pendleChildAddress
    );

    event UpdateRewardTokens(
        address indexed _pendleMarket,
        address[] _rewardTokens
    );

    event ChangeMintFee(
        address indexed _pendleMarket,
        uint256 _newFee
    );

    event LockPendle(
        uint256 _amount,
        uint128 _expiry,
        uint256 _newVeBalance,
        bool _fromInside,
        bool _sameExpiry,
        uint256 _timestamp
    );

    event ClaimArb(
        uint256 _accrued,
        bytes32[] _proof,
        uint256 _timestamp
    );

    event IncreaseReservedForCompound(
        address indexed _pendleMarket,
        uint256[] _amounts
    );

    event ClaimVoteRewards(
        uint256 _amount,
        bytes32[] _merkleProof,
        uint256 _timestamp
    );

    event WithdrawLock(
        uint256 _amount,
        uint256 _timestamp
    );

    modifier syncSupply(
        address _pendleMarket
    )
    {
        _syncSupply(
            _pendleMarket
        );
        _;
    }

    modifier onlyChildContract(
        address _pendleMarket
    )
    {
        _onlyChildContract(
            _pendleMarket
        );
        _;
    }

    modifier onlyArbitrum()
    {
        _onlyArbitrum();
        _;
    }

    function _onlyArbitrum()
        private
        view
    {
        if (block.chainid != ARBITRUM_CHAIN_ID) {
            revert NotArbitrum();
        }
    }

    function _onlyChildContract(
        address _pendleMarket
    )
        private
        view
    {
        if (msg.sender != pendleChildAddress[_pendleMarket]) {
            revert NotAllowed();
        }
    }

    function _syncSupply(
        address _pendleMarket
    )
        internal
    {
        address child = pendleChildAddress[
            _pendleMarket
        ];

        if (child == ZERO_ADDRESS) {
            revert WrongAddress();
        }

        IPendlePowerFarmToken(child).manualSync();
    }

    function syncAllSupply()
        public
    {
        uint256 i;
        uint256 length = activePendleMarkets.length;

        while (i < length) {
            _syncSupply(
                activePendleMarkets[i]
            );
            unchecked {
                ++i;
            }
        }
    }
}
