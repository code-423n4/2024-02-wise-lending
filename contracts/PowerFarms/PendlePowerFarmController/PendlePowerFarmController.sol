// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./PendlePowerFarmTokenFactory.sol";
import "./PendlePowerFarmControllerHelper.sol";

contract PendlePowerFarmController is PendlePowerFarmControllerHelper {

    PendlePowerFarmTokenFactory public immutable PENDLE_POWER_FARM_TOKEN_FACTORY;

    constructor(
        address _vePendle,
        address _pendleToken,
        address _voterContract,
        address _voterRewardsClaimerAddress,
        address _wiseOracleHub
    )
        PendlePowerFarmControllerBase(
            _vePendle,
            _pendleToken,
            _voterContract,
            _voterRewardsClaimerAddress,
            _wiseOracleHub
        )
    {
        PENDLE_POWER_FARM_TOKEN_FACTORY = new PendlePowerFarmTokenFactory(
            address(this)
        );
    }

    function withdrawLp(
        address _pendleMarket,
        address _to,
        uint256 _amount
    )
        external
        onlyChildContract(_pendleMarket)
    {
        _safeTransfer(
            _pendleMarket,
            _to,
            _amount
        );

        emit WithdrawLp(
            _pendleMarket,
            _to,
            _amount
        );
    }

    function exchangeRewardsForCompoundingWithIncentive(
        address _pendleMarket,
        address _rewardToken,
        uint256 _rewardAmount
    )
        external
        syncSupply(_pendleMarket)
        returns (uint256)
    {
        CompoundStruct memory childInfo = pendleChildCompoundInfo[
            _pendleMarket
        ];

        uint256 index = _findIndex(
            childInfo.rewardTokens,
            _rewardToken
        );

        if (childInfo.reservedForCompound[index] < _rewardAmount) {
            revert NotEnoughCompound();
        }

        uint256 sendingAmount = _getAmountToSend(
            _pendleMarket,
            _getTokensInETH(
                _rewardToken,
                _rewardAmount
            )
        );

        childInfo.reservedForCompound[index] -= _rewardAmount;
        pendleChildCompoundInfo[_pendleMarket] = childInfo;

        _safeTransferFrom(
            _pendleMarket,
            msg.sender,
            address(this),
            sendingAmount
        );

        IPendlePowerFarmToken(pendleChildAddress[_pendleMarket]).addCompoundRewards(
            sendingAmount
        );

        _safeTransfer(
            childInfo.rewardTokens[index],
            msg.sender,
            _rewardAmount
        );

        emit ExchangeRewardsForCompounding(
            _pendleMarket,
            _rewardToken,
            _rewardAmount,
            sendingAmount
        );

        return sendingAmount;
    }

    function exchangeLpFeesForPendleWithIncentive(
        address _pendleMarket,
        uint256 _pendleChildShares
    )
        external
        syncSupply(_pendleMarket)
        returns (
            uint256,
            uint256
        )
    {
        if (_pendleChildShares == 0) {
            revert ZeroShares();
        }

        address pendleChild = pendleChildAddress[
            _pendleMarket
        ];

        uint256 tokenAmountSend = _getAmountToSend(
            PENDLE_TOKEN_ADDRESS,
            _getTokensInETH(
                pendleChild,
                _pendleChildShares
            )
        );

        reservedPendleForLocking += tokenAmountSend;

        _safeTransferFrom(
            PENDLE_TOKEN_ADDRESS,
            msg.sender,
            address(this),
            tokenAmountSend
        );

        uint256 withdrawnAmount = IPendlePowerFarmToken(pendleChild).withdrawExactShares(
            _pendleChildShares
        );

        _safeTransfer(
            _pendleMarket,
            msg.sender,
            withdrawnAmount
        );

        emit ExchangeLpFeesForPendle(
            _pendleMarket,
            _pendleChildShares,
            tokenAmountSend,
            withdrawnAmount
        );

        return(
            tokenAmountSend,
            withdrawnAmount
        );
    }

    function skim(
        address _pendleMarket
    )
        external
        returns (uint256)
    {
        address childMarket = pendleChildAddress[
            _pendleMarket
        ];

        if (childMarket == ZERO_ADDRESS) {
            revert WrongAddress();
        }

        uint256 balance = IPendleMarket(_pendleMarket).balanceOf(
            address(this)
        );

        uint256 totalAssets = IPendlePowerFarmToken(
            childMarket
        ).totalLpAssets();

        if (balance < totalAssets + 1) {
            revert NothingToSkim();
        }

        uint256 difference = balance
            - totalAssets
            + 1;

        _safeTransfer(
            _pendleMarket,
            master,
            difference
        );

        return difference;
    }

    function addPendleMarket(
        address _pendleMarket,
        string memory _tokenName,
        string memory _symbolName,
        uint16 _maxCardinality
    )
        external
        onlyMaster
    {
        if (pendleChildAddress[_pendleMarket] > ZERO_ADDRESS) {
            revert AlreadySet();
        }

        address pendleChild = PENDLE_POWER_FARM_TOKEN_FACTORY.deploy(
            _pendleMarket,
            _tokenName,
            _symbolName,
            _maxCardinality
        );

        pendleChildAddress[_pendleMarket] = pendleChild;

        _setRewardTokens(
            _pendleMarket,
            _getRewardTokens(
                _pendleMarket
            )
        );

        CompoundStruct storage childInfo = pendleChildCompoundInfo[
            _pendleMarket
        ];

        uint256 rewardTokensLength = childInfo
            .rewardTokens
            .length;

        childInfo.lastIndex = new uint128[](
            rewardTokensLength
        );

        childInfo.reservedForCompound = new uint256[](
            rewardTokensLength
        );

        uint256 i;

        while (i < rewardTokensLength) {

            address token = childInfo.rewardTokens[i];

            childInfo.lastIndex[i] = _getUserRewardIndex(
                _pendleMarket,
                token,
                address(this)
            );

            childInfo.reservedForCompound[i] = 0;

            _checkFeed(
                token
            );

            unchecked {
                ++i;
            }
        }

        _checkFeed(
            _pendleMarket
        );

        activePendleMarkets.push(
            _pendleMarket
        );

        emit AddPendleMarket(
            _pendleMarket,
            pendleChild
        );
    }

    function updateRewardTokens(
        address _pendleMarket
    )
        external
        onlyChildContract(_pendleMarket)
        returns (bool)
    {
        address[] memory rewardTokens = _getRewardTokens(
            _pendleMarket
        );

        if (_compareHashes(_pendleMarket, rewardTokens) == true) {
            return false;
        }

        _setRewardTokens(
            _pendleMarket,
            rewardTokens
        );

        emit UpdateRewardTokens(
            _pendleMarket,
            rewardTokens
        );

        return true;
    }

    function changeExchangeIncentive(
        uint256 _newExchangeIncentive
    )
        external
        onlyMaster
    {
        exchangeIncentive = _newExchangeIncentive;

        emit ChangeExchangeIncentive(
            _newExchangeIncentive
        );
    }

    function changeMintFee(
        address _pendleMarket,
        uint256 _newFee
    )
        external
        onlyMaster
    {
        address child = pendleChildAddress[
            _pendleMarket
        ];

        if (child == ZERO_ADDRESS) {
            revert WrongAddress();
        }

        IPendlePowerFarmToken(
            child
        ).changeMintFee(
            _newFee
        );

        emit ChangeMintFee(
            _pendleMarket,
            _newFee
        );
    }

    /**
     * @dev Can also be used to extend existing lock.
     */
    function lockPendle(
        uint256 _amount,
        uint128 _weeks,
        bool _fromInside,
        bool _sameExpiry
    )
        external
        onlyMaster
        returns (uint256 newVeBalance)
    {
        syncAllSupply();

        uint256 currentExpiry = _getExpiry();

        uint128 expiry = _sameExpiry
            ? uint128(currentExpiry)
            : _calcExpiry(
                _weeks
            );

        if (uint256(expiry) < currentExpiry) {
            revert LockTimeTooShort();
        }

        if (_amount > 0) {

            _safeApprove(
                PENDLE_TOKEN_ADDRESS,
                VE_PENDLE_CONTRACT_ADDRESS,
                _amount
            );

            if (_fromInside == false) {
                _safeTransferFrom(
                    PENDLE_TOKEN_ADDRESS,
                    msg.sender,
                    address(this),
                    _amount
                );
            }
        }

        newVeBalance = PENDLE_LOCK.increaseLockPosition(
            uint128(_amount),
            expiry
        );

        syncAllSupply();

        if (_fromInside == false) {
            return newVeBalance;
        }

        if (_amount > 0) {
            reservedPendleForLocking -= _amount;
        }

        emit LockPendle(
            _amount,
            expiry,
            newVeBalance,
            _fromInside,
            _sameExpiry,
            block.timestamp
        );
    }

    function claimArb(
        uint256 _accrued,
        bytes32[] calldata _proof
    )
        external
        onlyArbitrum
    {
        ARB_REWARDS.claim(
            master,
            _accrued,
            _proof
        );

        emit ClaimArb(
            _accrued,
            _proof,
            block.timestamp
        );
    }

    function withdrawLock()
        external
        onlyMaster
        returns (uint256 amount)
    {
        if (IS_ETH_MAIN == false) {

            amount = reservedPendleForLocking;
            reservedPendleForLocking = 0;

            _safeTransfer(
                PENDLE_TOKEN_ADDRESS,
                master,
                amount
            );

            emit WithdrawLock(
                amount,
                block.timestamp
            );

            return amount;
        }

        if (_getExpiry() > block.timestamp) {
            revert NotExpired();
        }

        syncAllSupply();

        amount = PENDLE_LOCK.withdraw();

        _safeTransfer(
            PENDLE_TOKEN_ADDRESS,
            master,
            amount
        );

        syncAllSupply();

        emit WithdrawLock(
            amount,
            block.timestamp
        );
    }

    function increaseReservedForCompound(
        address _pendleMarket,
        uint256[] calldata _amounts
    )
        external
        onlyChildContract(_pendleMarket)
    {
        CompoundStruct memory childInfo = pendleChildCompoundInfo[
            _pendleMarket
        ];

        uint256 i;
        uint256 length = childInfo.rewardTokens.length;

        while (i < length) {
            childInfo.reservedForCompound[i] += _amounts[i];
            unchecked {
                ++i;
            }
        }

        pendleChildCompoundInfo[_pendleMarket] = childInfo;

        emit IncreaseReservedForCompound(
            _pendleMarket,
            _amounts
        );
    }

    function overWriteIndex(
        address _pendleMarket,
        uint256 _tokenIndex
    )
        public
        onlyChildContract(_pendleMarket)
    {
        CompoundStruct storage childInfo = pendleChildCompoundInfo[
            _pendleMarket
        ];

        childInfo.lastIndex[_tokenIndex] = _getUserRewardIndex(
            _pendleMarket,
            childInfo.rewardTokens[_tokenIndex],
            address(this)
        );
    }

    function overWriteIndexAll(
        address _pendleMarket
    )
        external
        onlyChildContract(_pendleMarket)
    {
        uint256 i;
        uint256 length = pendleChildCompoundInfo[
            _pendleMarket
        ].rewardTokens.length;

        while (i < length) {
            overWriteIndex(
                _pendleMarket,
                i
            );
            unchecked {
                ++i;
            }
        }
    }

    function overWriteAmounts(
        address _pendleMarket
    )
        external
        onlyChildContract(_pendleMarket)
    {
        CompoundStruct storage childInfo = pendleChildCompoundInfo[
            _pendleMarket
        ];

        childInfo.reservedForCompound = new uint256[](
            childInfo.rewardTokens.length
        );
    }

    function claimVoteRewards(
        uint256 _amount,
        bytes32[] calldata _merkleProof
    )
        external
    {
        PENDLE_VOTE_REWARDS.claimRetail(
            address(this),
            _amount,
            _merkleProof
        );

        emit ClaimVoteRewards(
            _amount,
            _merkleProof,
            block.timestamp
        );
    }

    function forwardETH(
        address _to,
        uint256 _amount
    )
        external
        onlyMaster
    {
        payable(_to).transfer(
            _amount
        );
    }

    function vote(
        address[] calldata _pools,
        uint64[] calldata _weights
    )
        external
        onlyMaster
    {
        if (_weights.length != _pools.length) {
            revert InvalidLength();
        }

        uint256 i;
        uint256 len = _weights.length;

        uint256 weightSum;

        while (i < len) {
            unchecked {
                weightSum += _weights[i];
                ++i;
            }
        }

        if (weightSum > PRECISION_FACTOR_E18) {
            revert InvalidWeightSum();
        }

        PENDLE_VOTER.vote(
            _pools,
            _weights
        );
    }
}
