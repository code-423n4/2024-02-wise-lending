// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../InterfaceHub/IAave.sol";
import "../InterfaceHub/IERC20.sol";
import "../InterfaceHub/IWiseLending.sol";
import "../InterfaceHub/IFeeManager.sol";
import "../InterfaceHub/IWiseSecurity.sol";
import "../InterfaceHub/IPositionNFTs.sol";
import "../InterfaceHub/IWiseOracleHub.sol";

import "../OwnableMaster.sol";
import "./FeeManagerEvents.sol";

error NotWiseLiquidation();
error AlreadySet();
error ExistingBadDebt();
error NotWiseLending();
error NotIncentiveMaster();
error PoolAlreadyAdded();
error TooHighValue();
error TooLowValue();
error NotAllowed();
error PoolNotPresent();
error ZeroAddress();
error NoIncentive();
error Reentered();
error PoolNotActive();

contract DeclarationsFeeManager is FeeManagerEvents, OwnableMaster {

    constructor(
        address _master,
        address _aaveAddress,
        address _wiseLendingAddress,
        address _oracleHubAddress,
        address _wiseSecurityAddress,
        address _positionNFTAddress
    )
        OwnableMaster(
            _master
        )
    {
        if (_aaveAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        if (_wiseLendingAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        if (_oracleHubAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        if (_wiseSecurityAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        if (_positionNFTAddress == ZERO_ADDRESS) {
            revert NoValue();
        }

        WISE_LENDING = IWiseLending(
            _wiseLendingAddress
        );

        AAVE = IAave(
            _aaveAddress
        );

        ORACLE_HUB = IWiseOracleHub(
            _oracleHubAddress
        );

        WISE_SECURITY = IWiseSecurity(
            _wiseSecurityAddress
        );

        POSITION_NFTS = IPositionNFTs(
            _positionNFTAddress
        );

        FEE_MANAGER_NFT = POSITION_NFTS.FEE_MANAGER_NFT();

        incentiveMaster = _master;
        paybackIncentive = 5 * PRECISION_FACTOR_E16;

        incentiveOwnerA = 0xf69A0e276664997357BF987df83f32a1a3F80944;
        incentiveOwnerB = 0x8f741ea9C9ba34B5B8Afc08891bDf53faf4B3FE7;

        incentiveUSD[incentiveOwnerA] = 98000 * PRECISION_FACTOR_E18;
        incentiveUSD[incentiveOwnerB] = 106500 * PRECISION_FACTOR_E18;
    }

    // ---- Interfaces ----

    // Interface aave V3 contract
    IAave public immutable AAVE;

    // Interface wiseLending contract
    IWiseLending public immutable WISE_LENDING;

    // Interface position NFT contract
    IPositionNFTs public immutable POSITION_NFTS;

    // Interface wiseSecurity contract
    IWiseSecurity public immutable WISE_SECURITY;

    // Interface wise oracleHub contract
    IWiseOracleHub public immutable ORACLE_HUB;

    // ---- Variables ----

    // Global total bad debt variable
    uint256 public totalBadDebtETH;

    // Incentive percentage for paying back bad debt
    uint256 public paybackIncentive;

    // Array of pool tokens in wiseLending
    address[] public poolTokenAddresses;

    // Address of incentive master
    address public incentiveMaster;

    // Proposed incentive master (for changing)
    address public proposedIncentiveMaster;

    // Address of incentive owner A
    address public incentiveOwnerA;

    // Address of incentive owner B
    address public incentiveOwnerB;

    // ---- Mappings ----

    // Bad debt of a specific position
    mapping(uint256 => uint256) public badDebtPosition;

    // Amount of fee token inside feeManager
    mapping(address => uint256) public feeTokens;

    // Open incetive amount for incentiveOwner in ETH
    mapping(address => uint256) public incentiveUSD;

    // Flag that specific token is already added
    mapping(address => bool) public poolTokenAdded;

    // Flag for token being aToken
    mapping(address => bool) public isAaveToken;

    // Getting underlying token of aave aToken
    mapping(address => address) public underlyingToken;

    // Showing which token are allowed to claim for beneficial address
    mapping(address => mapping(address => bool)) public allowedTokens;

    // Gives claimable token amount for incentiveOwner per token
    mapping(address => mapping(address => uint256)) public gatheredIncentiveToken;

    // Position NFT id of the feeManager
    uint256 public immutable FEE_MANAGER_NFT;

    // Precision factors for computations
    uint256 internal constant PRECISION_FACTOR_E15 = 1E15;
    uint256 internal constant PRECISION_FACTOR_E16 = 1E16;
    uint256 internal constant PRECISION_FACTOR_E18 = 1E18;

    // Base portion from gathered fees for incentiveOwners (0.5%)
    uint256 public constant INCENTIVE_PORTION = 5 * PRECISION_FACTOR_E15;

    // ---- Modifier ----

    modifier onlyWiseSecurity() {
        _onlyWiseSecurity();
        _;
    }

    modifier onlyWiseLending() {
        _onlyWiseLending();
        _;
    }

    modifier onlyIncentiveMaster() {
        _onlyIncentiveMaster();
        _;
    }

    function _onlyIncentiveMaster()
        private
        view
    {
        if (msg.sender == incentiveMaster) {
            return;
        }

        revert NotIncentiveMaster();
    }

    function _onlyWiseSecurity()
        private
        view
    {
        if (msg.sender == address(WISE_SECURITY)) {
            return;
        }

        revert NotWiseLiquidation();
    }

    function _onlyWiseLending()
        private
        view
    {
        if (msg.sender == address(WISE_LENDING)) {
            return;
        }

        revert NotWiseLending();
    }
}
