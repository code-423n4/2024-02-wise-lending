// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./PendlePowerFarmControllerBase.sol";

abstract contract PendlePowerFarmControllerHelper is PendlePowerFarmControllerBase {

    function _findIndex(
        address[] memory _array,
        address _value
    )
        internal
        pure
        returns (uint256)
    {
        uint256 i;
        uint256 len = _array.length;

        while (i < len) {
            if (_array[i] == _value) {
                return i;
            }
            unchecked {
                ++i;
            }
        }

        revert NotFound();
    }

    function _calcExpiry(
        uint128 _weeks
    )
        internal
        view
        returns (uint128)
    {
        uint128 startTime = uint128((block.timestamp / WEEK)
            * WEEK);

        return startTime + (_weeks * WEEK);
    }

    function _getExpiry()
        internal
        view
        returns (uint256)
    {
        return _getPositionData(address(this)).expiry;
    }

    function _getLockAmount()
        internal
        view
        returns (uint256)
    {
        return _getPositionData(address(this)).amount;
    }

    function _getPositionData(
        address _user
    )
        private
        view
        returns (LockedPosition memory)
    {
        return PENDLE_LOCK.positionData(
            _user
        );
    }

    function _getAmountToSend(
        address _tokenAddress,
        uint256 _rewardValue
    )
        internal
        view
        returns (uint256)
    {
        uint256 sendingValue = _rewardValue
            * (PRECISION_FACTOR_E6 - exchangeIncentive)
            / PRECISION_FACTOR_E6;

        if (sendingValue < PRECISION_FACTOR_E10) {
            revert ValueTooSmall();
        }

        return _getTokensFromETH(
            _tokenAddress,
            sendingValue
        );
    }

    function pendleChildCompoundInfoReservedForCompound(
        address _pendleMarket
    )
        external
        view
        returns (uint256[] memory)
    {
        return pendleChildCompoundInfo[_pendleMarket].reservedForCompound;
    }

    function pendleChildCompoundInfoLastIndex(
        address _pendleMarket
    )
        external
        view
        returns (uint128[] memory)
    {
        return pendleChildCompoundInfo[_pendleMarket].lastIndex;
    }

    function pendleChildCompoundInfoRewardTokens(
        address _pendleMarket
    )
        external
        view
        returns (address[] memory)
    {
        return pendleChildCompoundInfo[_pendleMarket].rewardTokens;
    }

    function activePendleMarketsLength()
        external
        view
        returns (uint256)
    {
        return activePendleMarkets.length;
    }

    function _checkFeed(
        address token
    )
        internal
        view
    {
        if (ORACLE_HUB.priceFeed(token) == ZERO_ADDRESS) {
            revert WrongAddress();
        }
    }

    function _getRewardTokens(
        address _pendleMarket
    )
        internal
        view
        returns (address[] memory)
    {
        return IPendleMarket(
            _pendleMarket
        ).getRewardTokens();
    }

    function _getUserReward(
        address _pendleMarket,
        address _rewardToken,
        address _user
    )
        internal
        view
        returns (UserReward memory)
    {
        return IPendleMarket(
            _pendleMarket
        ).userReward(
            _rewardToken,
            _user
        );
    }

    function _getUserRewardIndex(
        address _pendleMarket,
        address _rewardToken,
        address _user
    )
        internal
        view
        returns (uint128)
    {
        return _getUserReward(
            _pendleMarket,
            _rewardToken,
            _user
        ).index;
    }

    function _getTokensInETH(
        address _tokenAddress,
        uint256 _tokenAmount
    )
        internal
        view
        returns (uint256)
    {
        return ORACLE_HUB.getTokensInETH(
            _tokenAddress,
            _tokenAmount
        );
    }

    function _getTokensFromETH(
        address _tokenAddress,
        uint256 _ethValue
    )
        internal
        view
        returns (uint256)
    {
        return ORACLE_HUB.getTokensFromETH(
            _tokenAddress,
            _ethValue
        );
    }

    function _compareHashes(
        address _pendleMarket,
        address[] memory rewardTokensToCompare
    )
        internal
        view
        returns (bool)
    {
        return keccak256(
            abi.encode(
                rewardTokensToCompare
            )
        ) == keccak256(
            abi.encode(
                pendleChildCompoundInfo[_pendleMarket].rewardTokens
            )
        );
    }

    function _setRewardTokens(
        address _pendleMarket,
        address[] memory _rewardTokens
    )
        internal
    {
        pendleChildCompoundInfo[_pendleMarket].rewardTokens = _rewardTokens;
    }

    function getExpiry()
        external
        view
        returns (uint256)
    {
        return _getExpiry();
    }

    function getLockAmount()
        external
        view
        returns (uint256)
    {
        return _getLockAmount();
    }
}
