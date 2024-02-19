// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./PendlePowerFarmLeverageLogic.sol";

abstract contract PendlePowerFarm is PendlePowerFarmLeverageLogic {

    /**
     * @dev External view function approximating the
     * new resulting net APY for a position setup.
     *
     * Note: Not 100% accurate because no syncPool is performed.
     */
    function getApproxNetAPY(
        uint256 _initialAmount,
        uint256 _leverage,
        uint256 _pendleChildApy
    )
        external
        view
        returns (
            uint256,
            bool
        )
    {
        return _getApproxNetAPY(
            _initialAmount,
            _leverage,
            _pendleChildApy
        );
    }

    /**
     * @dev External view function approximating the
     * new borrow amount for the pool when {_borrowAmount}
     * is borrowed.
     *
     * Note: Not 100% accurate because no syncPool is performed.
     */
    function getNewBorrowRate(
        uint256 _borrowAmount
    )
        external
        view
        returns (uint256)
    {
        return _getNewBorrowRate(
            _borrowAmount
        );
    }

    /**
     * @dev View functions returning the current
     * debt ratio of the postion with {_nftId}
     */
    function getLiveDebtRatio(
        uint256 _nftId
    )
        external
        view
        returns (uint256)
    {
        uint256 totalCollateral = getTotalWeightedCollateralETH(
            _nftId
        );

        if (totalCollateral == 0) {
            return 0;
        }

        return getPositionBorrowETH(_nftId)
            * PRECISION_FACTOR_E18
            / totalCollateral;
    }

    /**
     * @dev Liquidation function for open power farm
     * postions which have a debtratio greater than 100%.
     */
    function liquidatePartiallyFromToken(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        uint256 _shareAmountToPay
    )
        external
        updatePools
        returns (
            uint256 paybackAmount,
            uint256 receivingAmount
        )
    {
        return _coreLiquidation(
            _nftId,
            _nftIdLiquidator,
            _shareAmountToPay
        );
    }

    /**
     * @dev Manually payback function for users. Takes
     * {_paybackShares} which can be converted
     * into token with {paybackAmount()} or vice verse
     * with {calculateBorrowShares()} from wise lending
     * contract.
     */
    function _manuallyPaybackShares(
        uint256 _nftId,
        uint256 _paybackShares
    )
        internal
    {
        address poolAddress = WETH_ADDRESS;

        if (isAave[_nftId] == true) {
            poolAddress = AAVE_WETH_ADDRESS;
        }

        uint256 paybackAmount = WISE_LENDING.paybackAmount(
            poolAddress,
            _paybackShares
        );

        _safeTransferFrom(
            poolAddress,
            msg.sender,
            address(this),
            paybackAmount
        );

        WISE_LENDING.paybackExactShares(
            _nftId,
            poolAddress,
            _paybackShares
        );
    }

    /**
     * @dev Manually withdraw function for users. Takes
     * {_withdrawShares} which can be converted
     * into token with {cashoutAmount()} or vice verse
     * with {calculateLendingShares()} from wise lending
     * contract.
     */
    function _manuallyWithdrawShares(
        uint256 _nftId,
        uint256 _withdrawShares
    )
        internal
    {
        uint256 withdrawAmount = WISE_LENDING.cashoutAmount(
            PENDLE_CHILD,
            _withdrawShares
        );

        withdrawAmount = WISE_LENDING.withdrawExactShares(
            _nftId,
            PENDLE_CHILD,
            _withdrawShares
        );

        _safeTransfer(
            PENDLE_CHILD,
            msg.sender,
            withdrawAmount
        );
    }

    /**
     * @dev Internal function combining the core
     * logic for {openPosition()}.
     */
    function _openPosition(
        bool _isAave,
        uint256 _nftId,
        uint256 _initialAmount,
        uint256 _leverage,
        uint256 _allowedSpread
    )
        internal
    {
        if (_leverage > MAX_LEVERAGE) {
            revert LeverageTooHigh();
        }

        uint256 leveragedAmount = getLeverageAmount(
            _initialAmount,
            _leverage
        );

        if (_notBelowMinDepositAmount(leveragedAmount) == false) {
            revert AmountTooSmall();
        }

        _executeBalancerFlashLoan(
            {
                _nftId: _nftId,
                _flashAmount: leveragedAmount - _initialAmount,
                _initialAmount: _initialAmount,
                _lendingShares: 0,
                _borrowShares: 0,
                _allowedSpread: _allowedSpread,
                _ethBack: false,
                _isAave: _isAave
            }
        );
    }

    /**
     * @dev Internal function combining the core
     * logic for {closingPosition()}.
     *
     * Note: {_allowedSpread} passed through UI by asking user
     * the percentage of acceptable value loss by closing position.
     * Units are in ether where 100% = 1 ether -> 0% loss acceptable
     * 1.01 ether -> 1% loss acceptable and so on.
     */
    function _closingPosition(
        bool _isAave,
        uint256 _nftId,
        uint256 _allowedSpread,
        bool _ethBack
    )
        internal
    {
        uint256 borrowShares = _isAave == false
            ? _getPositionBorrowShares(
                _nftId
            )
            : _getPositionBorrowSharesAave(
                _nftId
            );

        uint256 borrowTokenAmount = _isAave == false
            ? _getPositionBorrowTokenAmount(
                _nftId
            )
            : _getPositionBorrowTokenAmountAave(
                _nftId
            );

        _executeBalancerFlashLoan(
            {
                _nftId: _nftId,
                _flashAmount: borrowTokenAmount,
                _initialAmount: 0,
                _lendingShares: _getPositionLendingShares(
                    _nftId
                ),
                _borrowShares: borrowShares,
                _allowedSpread: _allowedSpread,
                _ethBack: _ethBack,
                _isAave: _isAave
            }
        );
    }

    /**
     * @dev Makes a call to WISE_LENDING to
     * register {_nftId} for specific farm use.
     */
    function _registrationFarm(
        uint256 _nftId
    )
        internal
    {
        WISE_LENDING.setRegistrationIsolationPool(
            _nftId,
            true
        );

        emit RegistrationFarm(
            _nftId,
            block.timestamp
        );
    }
}

