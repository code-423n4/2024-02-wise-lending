// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./DeclarationsFeeManager.sol";
import "../TransferHub/TransferHelper.sol";

abstract contract FeeManagerHelper is DeclarationsFeeManager, TransferHelper {

    /**
     * @dev Internal update function which adds latest aquired token from borrow rate
     * for all borrow tokens of the position. Idnetical implementation like in wiseSecurity
     * or wiseLending.
     */
    function _prepareBorrows(
        uint256 _nftId
    )
        internal
    {
        uint256 i;
        uint256 l = WISE_LENDING.getPositionBorrowTokenLength(
            _nftId
        );

        while (i < l) {

            address currentAddress = WISE_LENDING.getPositionBorrowTokenByIndex(
                _nftId,
                i
            );

            WISE_LENDING.syncManually(
                currentAddress
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Internal update function which adds latest aquired token from borrow rate
     * for all collateral tokens of the position. Idnetical implementation like in wiseSecurity
     * or wiseLending.
     */
    function _prepareCollaterals(
        uint256 _nftId
    )
        internal
    {
        uint256 i;
        uint256 l = WISE_LENDING.getPositionLendingTokenLength(
            _nftId
        );

        while (i < l) {

            address currentAddress = WISE_LENDING.getPositionLendingTokenByIndex(
                _nftId,
                i
            );

            WISE_LENDING.syncManually(
                currentAddress
            );

            unchecked {
                ++i;
            }
        }
    }

    /**
     * @dev Internal set function for adjusting bad debt amount of a position.
     */
    function _setBadDebtPosition(
        uint256 _nftId,
        uint256 _amount
    )
        internal
    {
        badDebtPosition[_nftId] = _amount;
    }

    /**
     * @dev Internal increase function for global bad debt amount.
     */
    function _increaseTotalBadDebt(
        uint256 _amount
    )
        internal
    {
        totalBadDebtETH += _amount;

        emit TotalBadDebtIncreased(
            _amount,
            block.timestamp
        );
    }

    /**
     * @dev Internal decrease function for global bad debt amount.
     */
    function _decreaseTotalBadDebt(
        uint256 _amount
    )
        internal
    {
        totalBadDebtETH -= _amount;

        emit TotalBadDebtDecreased(
            _amount,
            block.timestamp
        );
    }

    /**
     * @dev Internal erease function to delete bad debt amount of a postion.
     */
    function _eraseBadDebtUser(
        uint256 _nftId
    )
        internal
    {
        delete badDebtPosition[_nftId];
    }

    /**
     * @dev Internal function updating bad debt amount of a position and global one (in ETH).
     * Compares totalBorrow and totalCollateral of the postion in ETH and adjustes bad debt
     * variables. Pseudo pool amounts needed to be updated before this function is called.
     */
    function _updateUserBadDebt(
        uint256 _nftId
    )
        internal
    {
        uint256 currentBorrowETH = WISE_SECURITY.overallETHBorrowHeartbeat(
            _nftId
        );

        uint256 currentCollateralBareETH = WISE_SECURITY.overallETHCollateralsBare(
            _nftId
        );

        uint256 currentBadDebt = badDebtPosition[
            _nftId
        ];

        if (currentBorrowETH < currentCollateralBareETH) {

            _eraseBadDebtUser(
                _nftId
            );

            _decreaseTotalBadDebt(
                currentBadDebt
            );

            emit UpdateBadDebtPosition(
                _nftId,
                0,
                block.timestamp
            );

            return;
        }

        unchecked {
            uint256 newBadDebt = currentBorrowETH
                - currentCollateralBareETH;

            _setBadDebtPosition(
                _nftId,
                newBadDebt
            );

            newBadDebt > currentBadDebt
                ? _increaseTotalBadDebt(newBadDebt - currentBadDebt)
                : _decreaseTotalBadDebt(currentBadDebt - newBadDebt);

            emit UpdateBadDebtPosition(
                _nftId,
                newBadDebt,
                block.timestamp
            );
        }
    }

    /**
     * @dev Internal increase function for tracking gathered fee token. No need for
     * balanceOf() checks.
     */
    function _increaseFeeTokens(
        address _feeToken,
        uint256 _amount
    )
        internal
    {
        feeTokens[_feeToken] += _amount;
    }

    /**
     * @dev Internal decrease function for tracking gathered fee token. No need for
     * balanceOf() checks.
     */
    function _decreaseFeeTokens(
        address _feeToken,
        uint256 _amount
    )
        internal
    {
        feeTokens[_feeToken] -= _amount;
    }

    /**
     * @dev Internal function to set benefical mapping for a certain token.
     */
    function _setAllowedTokens(
        address _user,
        address _feeToken,
        bool _state
    )
        internal
    {
        allowedTokens[_user][_feeToken] = _state;
    }

    function _setAaveFlag(
        address _poolToken,
        address _underlyingToken
    )
        internal
    {
        isAaveToken[_poolToken] = true;
        underlyingToken[_poolToken] = _underlyingToken;
    }

    /**
     * @dev Internal function calculating receive amount for the caller.
     * paybackIncentive is set to 5E16 => 5% incentive for paying back bad debt.
     */
    function getReceivingToken(
        address _paybackToken,
        address _receivingToken,
        uint256 _paybackAmount
    )
        public
        view
        returns (uint256 receivingAmount)
    {
        uint256 increasedAmount = _paybackAmount
            * (PRECISION_FACTOR_E18 + paybackIncentive)
            / PRECISION_FACTOR_E18;

        return ORACLE_HUB.getTokensFromETH(
            _receivingToken,
            ORACLE_HUB.getTokensInETH(
                _paybackToken,
                increasedAmount
            )
        );
    }

    /**
     * @dev Updates bad debt of a postion. Combines preparation of all
     * collaterals and borrows for passed _nftId with _updateUserBadDebt().
     */
    function updatePositionCurrentBadDebt(
        uint256 _nftId
    )
        public
    {
        _prepareCollaterals(
            _nftId
        );

        _prepareBorrows(
            _nftId
        );

        _updateUserBadDebt(
            _nftId
        );
    }

    /**
     * @dev Internal function for distributing incentives to incentiveOwnerA
     * and incentiveOwnerB.
     */
    function _distributeIncentives(
        uint256 _amount,
        address _poolToken,
        address _underlyingToken
    )
        internal
        returns (uint256)
    {
        uint256 reduceAmount;

        if (incentiveUSD[incentiveOwnerA] > 0) {

            reduceAmount += _gatherIncentives(
                _poolToken,
                _underlyingToken,
                incentiveOwnerA,
                _amount
            );
        }

        if (incentiveUSD[incentiveOwnerB] > 0) {

            reduceAmount += _gatherIncentives(
                _poolToken,
                _underlyingToken,
                incentiveOwnerB,
                _amount
            );
        }

        return _amount - reduceAmount;
    }

    /**
     * @dev Internal function computing the incentive amount for an incentiveOwner
     * depending of the amount per fee token. Reduces the open incentive amount for
     * the owner.
     */
    function _gatherIncentives(
        address _poolToken,
        address _underlyingToken,
        address _incentiveOwner,
        uint256 _amount
    )
        internal
        returns (uint256)
    {
        uint256 incentiveAmount = _amount
            * INCENTIVE_PORTION
            / WISE_LENDING.globalPoolData(_poolToken).poolFee;

        uint256 usdEquivalent = ORACLE_HUB.getTokensPriceInUSD(
            _poolToken,
            incentiveAmount
        );

        uint256 reduceUSD = usdEquivalent < incentiveUSD[_incentiveOwner]
            ? usdEquivalent
            : incentiveUSD[_incentiveOwner];

        if (reduceUSD == usdEquivalent) {

            incentiveUSD[_incentiveOwner] -= usdEquivalent;

            gatheredIncentiveToken
                [_incentiveOwner]
                [_underlyingToken] += incentiveAmount;

            return incentiveAmount;
        }

        incentiveAmount = ORACLE_HUB.getTokensPriceFromUSD(
            _poolToken,
            reduceUSD
        );

        delete incentiveUSD[
            _incentiveOwner
        ];

        gatheredIncentiveToken
            [_incentiveOwner]
            [_underlyingToken] += incentiveAmount;

        return incentiveAmount;
    }

    /**
     * @dev Internal function checking if the
     * passed value is smaller 100% and bigger 1%.
     */
    function _checkValue(
        uint256 _value
    )
        internal
        pure
    {
        if (_value < PRECISION_FACTOR_E16) {
            revert TooLowValue();
        }

        if (_value > PRECISION_FACTOR_E18) {
            revert TooHighValue();
        }
    }
}
