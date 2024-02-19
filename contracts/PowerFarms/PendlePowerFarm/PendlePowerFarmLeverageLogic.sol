// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./PendlePowerFarmMathLogic.sol";

abstract contract PendlePowerFarmLeverageLogic is
    PendlePowerFarmMathLogic,
    IFlashLoanRecipient
{
    /**
     * @dev Wrapper function preparing balancer flashloan and
     * loading data to pass into receiver.
     */
    function _executeBalancerFlashLoan(
        uint256 _nftId,
        uint256 _flashAmount,
        uint256 _initialAmount,
        uint256 _lendingShares,
        uint256 _borrowShares,
        uint256 _allowedSpread,
        bool _ethBack,
        bool _isAave
    )
        internal
    {
        IERC20[] memory tokens = new IERC20[](1);
        uint256[] memory amount = new uint256[](1);

        address flashAsset = WETH_ADDRESS;

        tokens[0] = IERC20(flashAsset);
        amount[0] = _flashAmount;

        allowEnter = true;

        BALANCER_VAULT.flashLoan(
            this,
            tokens,
            amount,
            abi.encode(
                _nftId,
                _initialAmount,
                _lendingShares,
                _borrowShares,
                _allowedSpread,
                msg.sender,
                _ethBack,
                _isAave
            )
        );
    }

    /**
     * @dev Receive function from balancer flashloan. Body
     * is called from balancer at the end of their {flashLoan()}
     * logic. Overwritten with opening flows.
     */
    function receiveFlashLoan(
        IERC20[] memory _flashloanToken,
        uint256[] memory _flashloanAmounts,
        uint256[] memory _feeAmounts,
        bytes memory _userData
    )
        external
    {
        if (allowEnter == false) {
            revert AccessDenied();
        }

        allowEnter = false;

        if (_flashloanToken.length == 0) {
            revert InvalidParam();
        }

        if (msg.sender != BALANCER_ADDRESS) {
            revert NotBalancerVault();
        }

        uint256 totalDebtBalancer = _flashloanAmounts[0]
            + _feeAmounts[0];

        (
            uint256 nftId,
            uint256 initialAmount,
            uint256 lendingShares,
            uint256 borrowShares,
            uint256 allowedSpread,
            address caller,
            bool ethBack,
            bool isAave
        ) = abi.decode(
            _userData,
            (
                uint256,
                uint256,
                uint256,
                uint256,
                uint256,
                address,
                bool,
                bool
            )
        );

        if (initialAmount > 0) {
            _logicOpenPosition(
                isAave,
                nftId,
                _flashloanAmounts[0] + initialAmount,
                totalDebtBalancer,
                allowedSpread
            );

            return;
        }

        _logicClosePosition(
            nftId,
            borrowShares,
            lendingShares,
            totalDebtBalancer,
            allowedSpread,
            caller,
            ethBack,
            isAave
        );
    }

    /**
     * @dev Closes position using balancer flashloans.
     */
    function _logicClosePosition(
        uint256 _nftId,
        uint256 _borrowShares,
        uint256 _lendingShares,
        uint256 _totalDebtBalancer,
        uint256 _allowedSpread,
        address _caller,
        bool _ethBack,
        bool _isAave
    )
        private
    {
        _paybackExactShares(
            _isAave,
            _nftId,
            _borrowShares
        );

        uint256 withdrawnLpsAmount = _withdrawPendleLPs(
            _nftId,
            _lendingShares
        );

        uint256 ethValueBefore = _getTokensInETH(
            PENDLE_CHILD,
            withdrawnLpsAmount
        );

        (
            uint256 netSyOut
            ,
        ) = PENDLE_ROUTER.removeLiquiditySingleSy(
            {
                _receiver: address(this),
                _market: address(PENDLE_MARKET),
                _netLpToRemove: withdrawnLpsAmount,
                _minSyOut: 0
            }
        );

        address tokenOut = block.chainid == 1
            ? ST_ETH_ADDRESS
            : ENTRY_ASSET;

        uint256 tokenOutAmount = PENDLE_SY.redeem(
            {
                _receiver: address(this),
                _amountSharesToRedeem: netSyOut,
                _tokenOut: tokenOut,
                _minTokenOut: 0,
                _burnFromInternalBalance: false
            }
        );

        uint256 reverseAllowedSpread = 2
            * PRECISION_FACTOR_E18
            - _allowedSpread;

        uint256 ethAmount = _getEthBack(
            tokenOutAmount,
            _getTokensInETH(
                block.chainid == 1
                    ? WETH_ADDRESS
                    : ENTRY_ASSET,
                tokenOutAmount
            )
                * reverseAllowedSpread
                / PRECISION_FACTOR_E18
        );

        uint256 ethValueAfter = _getTokensInETH(
            WETH_ADDRESS,
            ethAmount
        )
            * _allowedSpread
            / PRECISION_FACTOR_E18;

        if (ethValueAfter < ethValueBefore) {
            revert TooMuchValueLost();
        }

        if (_ethBack == true) {
            _closingRouteETH(
                ethAmount,
                _totalDebtBalancer,
                _caller
            );

            return;
        }

        _closingRouteToken(
            ethAmount,
            _totalDebtBalancer,
            _caller
        );
    }

    function _getEthBack(
        uint256 _swapAmount,
        uint256 _minOutAmount
    )
        internal
        returns (uint256)
    {
        if (block.chainid == ETH_CHAIN_ID) {
            return _swapStETHintoETH(
                _swapAmount,
                _minOutAmount
            );
        }

        if (block.chainid == ARB_CHAIN_ID) {
            uint256 wethAmount = _getTokensUniV3(
                _swapAmount,
                _minOutAmount,
                ENTRY_ASSET,
                WETH_ADDRESS
            );

            _unwrapETH(
                wethAmount
            );

            return wethAmount;
        }

        revert WrongChainId();
    }

    function _getTokensUniV3(
        uint256 _amountIn,
        uint256 _minOutAmount,
        address _tokenIn,
        address _tokenOut
    )
        internal
        returns (uint256)
    {
        return UNISWAP_V3_ROUTER.exactInputSingle(
            IUniswapV3.ExactInputSingleParams(
                {
                    tokenIn: _tokenIn,
                    tokenOut: _tokenOut,
                    fee: UNISWAP_V3_FEE,
                    recipient: address(this),
                    deadline: block.timestamp,
                    amountIn: _amountIn,
                    amountOutMinimum: _minOutAmount,
                    sqrtPriceLimitX96: 0
                }
            )
        );
    }

    /**
     * @dev Internal wrapper function for curve swap
     * of stETH into ETH.
     */
    function _swapStETHintoETH(
        uint256 _swapAmount,
        uint256 _minOutAmount
    )
        internal
        returns (uint256)
    {
        return CURVE.exchange(
            {
                fromIndex: 1,
                toIndex: 0,
                exactAmountFrom: _swapAmount,
                minReceiveAmount: _minOutAmount
            }
        );
    }

    function _withdrawPendleLPs(
        uint256 _nftId,
        uint256 _lendingShares
    )
        private
        returns (uint256 withdrawnLpsAmount)
    {
        return IPendleChild(PENDLE_CHILD).withdrawExactShares(
            WISE_LENDING.withdrawExactShares(
                _nftId,
                PENDLE_CHILD,
                _lendingShares
            )
        );
    }

    function _paybackExactShares(
        bool _isAave,
        uint256 _nftId,
        uint256 _borrowShares
    )
        internal
    {
        if (_isAave == true) {
            AAVE_HUB.paybackExactShares(
                _nftId,
                WETH_ADDRESS,
                _borrowShares
            );

            return;
        }

        WISE_LENDING.paybackExactShares(
            _nftId,
            WETH_ADDRESS,
            _borrowShares
        );
    }

    /**
     * @dev Internal wrapper function for a closing route
     * which returns {ENTRY_ASSET} to the owner in the end.
     */
    function _closingRouteToken(
        uint256 _tokenAmount,
        uint256 _totalDebtBalancer,
        address _caller
    )
        private
    {
        _wrapETH(
            _tokenAmount
        );

        _safeTransfer(
            WETH_ADDRESS,
            msg.sender,
            _totalDebtBalancer
        );

        _safeTransfer(
            WETH_ADDRESS,
            _caller,
            _tokenAmount
                - _totalDebtBalancer
        );
    }

    /**
     * @dev Internal wrapper function for a closing route
     * which returns ETH to the owner in the end.
     */
    function _closingRouteETH(
        uint256 _ethAmount,
        uint256 _totalDebtBalancer,
        address _caller
    )
        internal
    {
        _wrapETH(
            _totalDebtBalancer
        );

        _safeTransfer(
            WETH_ADDRESS,
            msg.sender,
            _totalDebtBalancer
        );

        _sendValue(
            _caller,
            _ethAmount
                - _totalDebtBalancer
        );
    }

    /**
     * @dev Internal function executing the
     * collateral deposit by converting ETH
     * into {ENTRY_ASSET}, adding it as collateral and
     * borrowing the flashloan token to pay
     * back {_totalDebtBalancer}.
     */
    function _logicOpenPosition(
        bool _isAave,
        uint256 _nftId,
        uint256 _depositAmount,
        uint256 _totalDebtBalancer,
        uint256 _allowedSpread
    )
        internal
    {
        uint256 reverseAllowedSpread = 2
            * PRECISION_FACTOR_E18
            - _allowedSpread;

        if (block.chainid == ARB_CHAIN_ID) {

            _depositAmount = _getTokensUniV3(
                _depositAmount,
                _getEthInTokens(
                        ENTRY_ASSET,
                        _depositAmount
                    )
                * reverseAllowedSpread
                / PRECISION_FACTOR_E18,
                WETH_ADDRESS,
                ENTRY_ASSET
            );
        }

        uint256 syReceived = PENDLE_SY.deposit(
            {
                _receiver: address(this),
                _tokenIn: ENTRY_ASSET,
                _amountTokenToDeposit: _depositAmount,
                _minSharesOut: PENDLE_SY.previewDeposit(
                    ENTRY_ASSET,
                    _depositAmount
                )
            }
        );

        (   ,
            uint256 netPtFromSwap,
            ,
            ,
            ,
        ) = PENDLE_ROUTER_STATIC.addLiquiditySingleSyStatic(
            address(PENDLE_MARKET),
            syReceived
        );

        (
            uint256 netLpOut
            ,
        ) = PENDLE_ROUTER.addLiquiditySingleSy(
            {
                _receiver: address(this),
                _market: address(PENDLE_MARKET),
                _netSyIn: syReceived,
                _minLpOut: 0,
                _guessPtReceivedFromSy: ApproxParams(
                    {
                        guessMin: netPtFromSwap - 100,
                        guessMax: netPtFromSwap + 100,
                        guessOffchain: 0,
                        maxIteration: 50,
                        eps: 1e15
                    }
                )
            }
        );

        uint256 ethValueBefore = _getTokensInETH(
            ENTRY_ASSET,
            _depositAmount
        );

        (
            uint256 receivedShares
            ,
        ) = IPendleChild(PENDLE_CHILD).depositExactAmount(
            netLpOut
        );

        uint256 ethValueAfter = _getTokensInETH(
            PENDLE_CHILD,
            receivedShares
        )
            * _allowedSpread
            / PRECISION_FACTOR_E18;

        if (ethValueAfter < ethValueBefore) {
            revert TooMuchValueLost();
        }

        WISE_LENDING.depositExactAmount(
            _nftId,
            PENDLE_CHILD,
            receivedShares
        );

        _borrowExactAmount(
            _isAave,
            _nftId,
            _totalDebtBalancer
        );

        if (_checkDebtRatio(_nftId) == false) {
            revert DebtRatioTooHigh();
        }

        _safeTransfer(
            WETH_ADDRESS,
            BALANCER_ADDRESS,
            _totalDebtBalancer
        );
    }

    function _borrowExactAmount(
        bool _isAave,
        uint256 _nftId,
        uint256 _totalDebtBalancer
    )
        internal
    {
        if (_isAave == true) {
            AAVE_HUB.borrowExactAmount(
                _nftId,
                WETH_ADDRESS,
                _totalDebtBalancer
            );

            return;
        }

        WISE_LENDING.borrowExactAmount(
            _nftId,
            WETH_ADDRESS,
            _totalDebtBalancer
        );
    }

    /**
     * @dev Internal function summarizing liquidation
     * checks and interface call for core liquidation
     * from wise lending.
     */
    function _coreLiquidation(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        uint256 _shareAmountToPay
    )
        internal
        returns (
            uint256 paybackAmount,
            uint256 receivingAmount
        )
    {
        if (_checkDebtRatio(_nftId) == true) {
            revert DebtRatioTooLow();
        }

        address paybackToken = isAave[_nftId] == true
            ? AAVE_WETH_ADDRESS
            : WETH_ADDRESS;

        paybackAmount = WISE_LENDING.paybackAmount(
            paybackToken,
            _shareAmountToPay
        );

        receivingAmount = WISE_LENDING.coreLiquidationIsolationPools(
            _nftId,
            _nftIdLiquidator,
            msg.sender,
            paybackToken,
            PENDLE_CHILD,
            paybackAmount,
            _shareAmountToPay
        );
    }
}
