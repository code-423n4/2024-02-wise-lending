// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

/**
 * @author René Hochmuth
 * @author Christoph Krpoun
 * @author Vitally Marinchenko
 */

import "./PoolManager.sol";

/**
 * @dev WISE lending is an automated lending platform on which users can collateralize
 * their assets and borrow tokens against them.
 *
 * Users need to pay borrow rates for debt tokens, which are reflected in a borrow APY for
 * each asset type (pool). This borrow rate is variable over time and determined through the
 * utilization of the pool. The bounding curve is a family of different bonding curves adjusted
 * automatically by LASA (Lending Automated Scaling Algorithm). For more information, see:
 * [https://wisesoft.gitbook.io/wise/wise-lending-protocol/lasa-ai]
 *
 * In addition to normal deposit, withdraw, borrow, and payback functions, there are other
 * interacting modes:
 *
 * - Solely deposit and withdraw allows the user to keep their funds private, enabling
 *    them to withdraw even when the pools are borrowed empty.
 *
 * - Aave pools  allow for maximal capital efficiency by earning aave supply APY for not
 *   borrowed funds.
 *
 * - Special curve pools nside beefy farms can be used as collateral, opening up new usage
 *   possibilities for these asset types.
 *
 * - Users can pay back their borrow with lending shares of the same asset type, making it
 *   easier to manage their positions.
 *
 * - Users save their collaterals and borrows inside a position NFT, making it possible
 *   to trade their whole positions or use them in second-layer contracts
 *   (e.g., spot trading with PTP NFT trading platforms).
 */

contract WiseLending is PoolManager {

    /**
     * @dev Standard receive functions forwarding
     * directly send ETH to the master address.
     */
    receive()
        external
        payable
    {
        if (msg.sender == WETH_ADDRESS) {
            return;
        }

        _sendValue(
            master,
            msg.value
        );
    }

    /**
     * @dev Checks if position is healthy
     * after all state changes are done.
     */
    modifier healthStateCheck(
        uint256 _nftId
    ) {
        _;

        _healthStateCheck(
            _nftId
        );
    }

    function _healthStateCheck(
        uint256 _nftId
    )
        private
    {
        _checkHealthState(
            _nftId,
            powerFarmCheck
        );

        if (powerFarmCheck == true) {
            powerFarmCheck = false;
        }
    }

    /**
     * @dev Runs the LASA algorithm known as
     * Lending Automated Scaling Algorithm
     * and updates pool data based on token
     */
    modifier syncPool(
        address _poolToken
    ) {
        (
            uint256 lendSharePrice,
            uint256 borrowSharePrice
        ) = _syncPoolBeforeCodeExecution(
            _poolToken
        );

        _;

        _syncPoolAfterCodeExecution(
            _poolToken,
            lendSharePrice,
            borrowSharePrice
        );
    }

    constructor(
        address _master,
        address _wiseOracleHubAddress,
        address _nftContract
    )
        WiseLendingDeclaration(
            _master,
            _wiseOracleHubAddress,
            _nftContract
        )
    {}

    function _emitFundsSolelyWithdrawn(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        private
    {
        emit FundsSolelyWithdrawn(
            _caller,
            _nftId,
            _poolToken,
            _amount,
            block.timestamp
        );
    }

    function _emitFundsSolelyDeposited(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        private
    {
        emit FundsSolelyDeposited(
            _caller,
            _nftId,
            _poolToken,
            _amount,
            block.timestamp
        );
    }

    /**
     * @dev Fetches share price of lending shares.
     */
    function _getSharePrice(
        address _poolToken
    )
        private
        view
        returns (
            uint256,
            uint256
        )
    {
        uint256 borrowSharePrice = borrowPoolData[_poolToken].pseudoTotalBorrowAmount
            * PRECISION_FACTOR_E18
            / borrowPoolData[_poolToken].totalBorrowShares;

        _validateParameter(
            MIN_BORROW_SHARE_PRICE,
            borrowSharePrice
        );

        return (
            lendingPoolData[_poolToken].pseudoTotalPool
                * PRECISION_FACTOR_E18
                / lendingPoolData[_poolToken].totalDepositShares,
            borrowSharePrice
        );
    }

    function _checkHealthState(
        uint256 _nftId,
        bool _powerFarm
    )
        internal
        view
    {
        WISE_SECURITY.checkHealthState(
            _nftId,
            _powerFarm
        );
    }

    /**
     * @dev Compares share prices before and after
     * execution. If borrow share price increased
     * or lending share price decreased, revert.
     */
    function _compareSharePrices(
        address _poolToken,
        uint256 _lendSharePriceBefore,
        uint256 _borrowSharePriceBefore
    )
        private
        view
    {
        (
            uint256 lendSharePriceAfter,
            uint256 borrowSharePriceAfter
        ) = _getSharePrice(
            _poolToken
        );

        uint256 currentSharePriceMax = _getCurrentSharePriceMax(
            _poolToken
        );

        _validateParameter(
            _lendSharePriceBefore,
            lendSharePriceAfter
        );

        _validateParameter(
            lendSharePriceAfter,
            currentSharePriceMax
        );

        _validateParameter(
            _borrowSharePriceBefore,
            currentSharePriceMax
        );

        _validateParameter(
            borrowSharePriceAfter,
            _borrowSharePriceBefore
        );
    }

    /**
    * @dev Since pool inception share price
    * increase for both lending and borrow shares
    * is capped at 500% apr max in between a transaction.
    */
    function _getCurrentSharePriceMax(
        address _poolToken
    )
        private
        view
        returns (uint256)
    {
        uint256 timeDifference = block.timestamp
            - timestampsPoolData[_poolToken].initialTimeStamp;

        return timeDifference
            * RESTRICTION_FACTOR
            + PRECISION_FACTOR_E18;
    }

    /**
     * @dev First part of pool sync updating pseudo
     * amounts. Is skipped when powerFarms or aaveHub
     * is calling the function.
     */
    function _syncPoolBeforeCodeExecution(
        address _poolToken
    )
        private
        returns (
            uint256 lendSharePrice,
            uint256 borrowSharePrice
        )
    {
        _checkReentrancy();

        _preparePool(
            _poolToken
        );

        if (_aboveThreshold(_poolToken) == true) {
            _scalingAlgorithm(
                _poolToken
            );
        }

        (
            lendSharePrice,
            borrowSharePrice
        ) = _getSharePrice(
            _poolToken
        );
    }

    /**
     * @dev Second part of pool sync updating
     * the borrow pool rate and share price.
     */
    function _syncPoolAfterCodeExecution(
        address _poolToken,
        uint256 _lendSharePriceBefore,
        uint256 _borrowSharePriceBefore
    )
        private
    {
        _newBorrowRate(
            _poolToken
        );

        _compareSharePrices(
            _poolToken,
            _lendSharePriceBefore,
            _borrowSharePriceBefore
        );
    }

    /**
     * @dev Enables _poolToken to be used as a collateral.
     */
    function collateralizeDeposit(
        uint256 _nftId,
        address _poolToken
    )
        external
        syncPool(_poolToken)
    {
        WISE_SECURITY.checksCollateralizeDeposit(
            _nftId,
            msg.sender,
            _poolToken
        );

        userLendingData[_nftId][_poolToken].unCollateralized = false;
    }

    /**
     * @dev Disables _poolToken to be used as a collateral.
     */
    function unCollateralizeDeposit(
        uint256 _nftId,
        address _poolToken
    )
        external
        syncPool(_poolToken)
    {
        _checkOwnerPosition(
            _nftId,
            msg.sender
        );

        (
            address[] memory lendTokens,
            address[] memory borrowTokens
        ) = _prepareAssociatedTokens(
            _nftId,
            _poolToken,
            ZERO_ADDRESS
        );

        userLendingData[_nftId][_poolToken].unCollateralized = true;

        WISE_SECURITY.checkUncollateralizedDeposit(
            _nftId,
            _poolToken
        );

        _curveSecurityChecks(
            lendTokens,
            borrowTokens
        );
    }

    // --------------- Deposit Functions -------------

    /**
     * @dev Allows to supply funds using ETH.
     * Without converting to WETH, use ETH directly.
     */
    function depositExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        syncPool(WETH_ADDRESS)
        returns (uint256)
    {
        return _depositExactAmountETH(
            _nftId
        );
    }

    function _depositExactAmountETH(
        uint256 _nftId
    )
        private
        returns (uint256)
    {
        uint256 shareAmount = _handleDeposit(
            msg.sender,
            _nftId,
            WETH_ADDRESS,
            msg.value
        );

        _wrapETH(
            msg.value
        );

        return shareAmount;
    }

    /**
     * @dev Allows to supply funds using ETH.
     * Without converting to WETH, use ETH directly,
     * also mints position to avoid extra transaction.
     */
    function depositExactAmountETHMint()
        external
        payable
        syncPool(WETH_ADDRESS)
        returns (uint256)
    {
        return _depositExactAmountETH(
            _reservePosition()
        );
    }

    /**
     * @dev Allows to supply _poolToken and user
     * can decide if _poolToken should be collateralized,
     * also mints position to avoid extra transaction.
     */
    function depositExactAmountMint(
        address _poolToken,
        uint256 _amount
    )
        external
        returns (uint256)
    {
        return depositExactAmount(
            _reservePosition(),
            _poolToken,
            _amount
        );
    }

    /**
     * @dev Allows to supply _poolToken and user
     * can decide if _poolToken should be collateralized.
     */
    function depositExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        public
        syncPool(_poolToken)
        returns (uint256)
    {
        uint256 shareAmount = _handleDeposit(
            msg.sender,
            _nftId,
            _poolToken,
            _amount
        );

        _safeTransferFrom(
            _poolToken,
            msg.sender,
            address(this),
            _amount
        );

        return shareAmount;
    }

    /**
     * @dev Allows to supply funds using ETH in solely mode,
     * which does not earn APY, but keeps the funds private.
     * Other users are restricted from borrowing these funds,
     * owner can always withdraw even if all funds are borrowed.
     * Also mints position to avoid extra transaction.
     */
    function solelyDepositETHMint()
        external
        payable
    {
        solelyDepositETH(
            _reservePosition()
        );
    }

    /**
     * @dev Allows to supply funds using ETH in solely mode,
     * which does not earn APY, but keeps the funds private.
     * Other users are restricted from borrowing these funds,
     * owner can always withdraw even if all funds are borrowed.
     */
    function solelyDepositETH(
        uint256 _nftId
    )
        public
        payable
        syncPool(WETH_ADDRESS)
    {
        _handleSolelyDeposit(
            msg.sender,
            _nftId,
            WETH_ADDRESS,
            msg.value
        );

        _wrapETH(
            msg.value
        );

        _emitFundsSolelyDeposited(
            msg.sender,
            _nftId,
            WETH_ADDRESS,
            msg.value
        );
    }

    /**
     * @dev Core function combining
     * supply logic with security
     * checks for solely deposit.
     */
    function _handleSolelyDeposit(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        private
    {
        _checkDeposit(
            _nftId,
            _caller,
            _poolToken,
            _amount
        );

        _increaseMappingValue(
            pureCollateralAmount,
            _nftId,
            _poolToken,
            _amount
        );

        _increaseTotalBareToken(
            _poolToken,
            _amount
        );

        _addPositionTokenData(
            _nftId,
            _poolToken,
            hashMapPositionLending,
            positionLendTokenData
        );
    }

    /**
     * @dev Allows to supply funds using ERC20 in solely mode,
     * which does not earn APY, but keeps the funds private.
     * Other users are restricted from borrowing these funds,
     * owner can always withdraw even if all funds are borrowed.
     * Also mints position to avoid extra transaction.
     */
    function solelyDepositMint(
        address _poolToken,
        uint256 _amount
    )
        external
    {
        solelyDeposit(
            _reservePosition(),
            _poolToken,
            _amount
        );
    }

    /**
     * @dev Allows to supply funds using ERC20 in solely mode,
     * which does not earn APY, but keeps the funds private.
     * Other users are restricted from borrowing these funds,
     * owner can always withdraw even if all funds are borrowed.
     */
    function solelyDeposit(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        public
        syncPool(_poolToken)
    {
        _handleSolelyDeposit(
            msg.sender,
            _nftId,
            _poolToken,
            _amount
        );

        _emitFundsSolelyDeposited(
            msg.sender,
            _nftId,
            _poolToken,
            _amount
        );

        _safeTransferFrom(
            _poolToken,
            msg.sender,
            address(this),
            _amount
        );
    }

    // --------------- Withdraw Functions -------------

    /**
     * @dev Allows to withdraw publicly
     * deposited ETH funds using exact amount.
     */
    function withdrawExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        external
        syncPool(WETH_ADDRESS)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        uint256 withdrawShares = _handleWithdrawAmount(
            {
                _caller: msg.sender,
                _nftId: _nftId,
                _poolToken: WETH_ADDRESS,
                _amount: _amount,
                _onBehalf: false
            }
        );

        _validateNonZero(
            withdrawShares
        );

        _unwrapETH(
            _amount
        );

        _sendValue(
            msg.sender,
            _amount
        );

        return withdrawShares;
    }

    /**
     * @dev Allows to withdraw publicly
     * deposited ETH funds using exact shares.
     */
    function withdrawExactSharesETH(
        uint256 _nftId,
        uint256 _shares
    )
        external
        syncPool(WETH_ADDRESS)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        uint256 withdrawAmount = _handleWithdrawShares(
            {
                _caller: msg.sender,
                _nftId: _nftId,
                _poolToken: WETH_ADDRESS,
                _shares: _shares,
                _onBehalf: false
            }
        );

        _validateNonZero(
            withdrawAmount
        );

        _unwrapETH(
            withdrawAmount
        );

        _sendValue(
            msg.sender,
            withdrawAmount
        );

        return withdrawAmount;
    }

    /**
     * @dev Allows to withdraw publicly
     * deposited ERC20 funds using exact amount.
     */
    function withdrawExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _withdrawAmount
    )
        external
        syncPool(_poolToken)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        uint256 withdrawShares = _handleWithdrawAmount(
            {
                _caller: msg.sender,
                _nftId: _nftId,
                _poolToken: _poolToken,
                _amount: _withdrawAmount,
                _onBehalf: false
            }
        );

        _validateNonZero(
            withdrawShares
        );

        _safeTransfer(
            _poolToken,
            msg.sender,
            _withdrawAmount
        );

        return withdrawShares;
    }

    /**
     * @dev Allows to withdraw privately
     * deposited ETH funds using input amount.
     */
    function solelyWithdrawETH(
        uint256 _nftId,
        uint256 _withdrawAmount
    )
        external
        syncPool(WETH_ADDRESS)
        healthStateCheck(_nftId)
    {
        _handleSolelyWithdraw(
            msg.sender,
            _nftId,
            WETH_ADDRESS,
            _withdrawAmount
        );

        _unwrapETH(
            _withdrawAmount
        );

        _sendValue(
            msg.sender,
            _withdrawAmount
        );
    }

    /**
     * @dev Allows to withdraw privately
     * deposited ERC20 funds using input amount.
     */
    function solelyWithdraw(
        uint256 _nftId,
        address _poolToken,
        uint256 _withdrawAmount
    )
        external
        syncPool(_poolToken)
        healthStateCheck(_nftId)
    {
        _handleSolelyWithdraw(
            msg.sender,
            _nftId,
            _poolToken,
            _withdrawAmount
        );

        _safeTransfer(
            _poolToken,
            msg.sender,
            _withdrawAmount
        );
    }

    /**
     * @dev Core function combining
     * withdraw logic for solely
     * withdraw with security checks.
     */
    function _coreSolelyWithdraw(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        private
    {
        (
            address[] memory lendTokens,
            address[] memory borrowTokens
        ) = _prepareAssociatedTokens(
            _nftId,
            _poolToken,
            ZERO_ADDRESS
        );

        powerFarmCheck = WISE_SECURITY.checksSolelyWithdraw(
            _nftId,
            _caller,
            _poolToken
        );

        _decreasePositionMappingValue(
            pureCollateralAmount,
            _nftId,
            _poolToken,
            _amount
        );

        _decreaseTotalBareToken(
            _poolToken,
            _amount
        );

        _removeEmptyLendingData(
            _nftId,
            _poolToken
        );

        _curveSecurityChecks(
            lendTokens,
            borrowTokens
        );
    }

    /**
     * @dev Allows to withdraw privately
     * deposited ERC20 on behalf of owner.
     * Requires approval by _nftId owner.
     */
    function withdrawOnBehalfExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _withdrawAmount
    )
        external
        onlyAaveHub
        syncPool(_poolToken)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        uint256 withdrawShares = calculateLendingShares(
            {
                _poolToken: _poolToken,
                _amount: _withdrawAmount,
                _maxSharePrice: true
            }
        );

        _coreWithdrawToken(
            {
                _caller: msg.sender,
                _nftId: _nftId,
                _poolToken: _poolToken,
                _amount: _withdrawAmount,
                _shares: withdrawShares,
                _onBehalf: true
            }
        );

        _safeTransfer(
            _poolToken,
            msg.sender,
            _withdrawAmount
        );

        return withdrawShares;
    }

    /**
     * @dev Allows to withdraw ERC20
     * funds using shares as input value
     */
    function withdrawExactShares(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        external
        syncPool(_poolToken)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        uint256 withdrawAmount = _handleWithdrawShares(
            {
                _caller: msg.sender,
                _nftId: _nftId,
                _poolToken: _poolToken,
                _shares: _shares,
                _onBehalf: false
            }
        );

        _validateNonZero(
            withdrawAmount
        );

        _safeTransfer(
            _poolToken,
            msg.sender,
            withdrawAmount
        );

        return withdrawAmount;
    }

    /**
     * @dev Withdraws ERC20 funds on behalf
     * of _nftId owner, requires approval.
     */
    function withdrawOnBehalfExactShares(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        external
        onlyAaveHub
        syncPool(_poolToken)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        uint256 withdrawAmount = _handleWithdrawShares(
            {
                _caller: msg.sender,
                _nftId: _nftId,
                _poolToken: _poolToken,
                _shares: _shares,
                _onBehalf: true
            }
        );

        _safeTransfer(
            _poolToken,
            msg.sender,
            withdrawAmount
        );

        return withdrawAmount;
    }

    // --------------- Borrow Functions -------------

    /**
     * @dev Allows to borrow ETH funds
     * Requires user to have collateral.
     */
    function borrowExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        external
        syncPool(WETH_ADDRESS)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        _checkOwnerPosition(
            _nftId,
            msg.sender
        );

        uint256 shares = _handleBorrowExactAmount({
            _nftId: _nftId,
            _poolToken: WETH_ADDRESS,
            _amount: _amount,
            _onBehalf: false
        });

        _validateNonZero(
            shares
        );

        _unwrapETH(
            _amount
        );

        _sendValue(
            msg.sender,
            _amount
        );

        return shares;
    }

    /**
     * @dev Allows to borrow ERC20 funds
     * Requires user to have collateral.
     */
    function borrowExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        syncPool(_poolToken)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        _checkOwnerPosition(
            _nftId,
            msg.sender
        );

        uint256 shares = _handleBorrowExactAmount({
            _nftId: _nftId,
            _poolToken: _poolToken,
            _amount: _amount,
            _onBehalf: false
        });

        _validateNonZero(
            shares
        );

        _safeTransfer(
            _poolToken,
            msg.sender,
            _amount
        );

        return shares;
    }

    /**
     * @dev Allows to borrow ERC20 funds
     * on behalf of _nftId owner, if approved.
     */
    function borrowOnBehalfExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        onlyAaveHub
        syncPool(_poolToken)
        healthStateCheck(_nftId)
        returns (uint256)
    {
        uint256 shares = _handleBorrowExactAmount({
            _nftId: _nftId,
            _poolToken: _poolToken,
            _amount: _amount,
            _onBehalf: true
        });

        _safeTransfer(
            _poolToken,
            msg.sender,
            _amount
        );

        return shares;
    }

    // --------------- Payback Functions ------------

    /**
     * @dev Ability to payback ETH loans
     * by providing exact payback amount.
     */
    function paybackExactAmountETH(
        uint256 _nftId
    )
        external
        payable
        syncPool(WETH_ADDRESS)
        returns (uint256)
    {
        uint256 maxBorrowShares = userBorrowShares[_nftId][WETH_ADDRESS];

        _validateNonZero(
            maxBorrowShares
        );

        uint256 maxPaybackAmount = paybackAmount(
            WETH_ADDRESS,
            maxBorrowShares
        );

        uint256 paybackShares = calculateBorrowShares(
            {
                _poolToken: WETH_ADDRESS,
                _amount: msg.value,
                _maxSharePrice: false
            }
        );

        _validateNonZero(
            paybackShares
        );

        uint256 refundAmount;
        uint256 requiredAmount = msg.value;

        if (msg.value > maxPaybackAmount) {

            unchecked {
                refundAmount = msg.value
                    - maxPaybackAmount;
            }

            requiredAmount = requiredAmount
                - refundAmount;

            paybackShares = maxBorrowShares;
        }

        _handlePayback(
            msg.sender,
            _nftId,
            WETH_ADDRESS,
            requiredAmount,
            paybackShares
        );

        _wrapETH(
            requiredAmount
        );

        if (refundAmount > 0) {
            _sendValue(
                msg.sender,
                refundAmount
            );
        }

        return paybackShares;
    }

    /**
     * @dev Ability to payback ERC20 loans
     * by providing exact payback amount.
     */
    function paybackExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        external
        syncPool(_poolToken)
        returns (uint256)
    {
        uint256 paybackShares = calculateBorrowShares(
            {
                _poolToken: _poolToken,
                _amount: _amount,
                _maxSharePrice: false
            }
        );

        _validateNonZero(
            paybackShares
        );

        _handlePayback(
            msg.sender,
            _nftId,
            _poolToken,
            _amount,
            paybackShares
        );

        _safeTransferFrom(
            _poolToken,
            msg.sender,
            address(this),
            _amount
        );

        return paybackShares;
    }

    /**
     * @dev Ability to payback ERC20 loans
     * by providing exact payback shares.
     */
    function paybackExactShares(
        uint256 _nftId,
        address _poolToken,
        uint256 _shares
    )
        external
        syncPool(_poolToken)
        returns (uint256)
    {
        uint256 repaymentAmount = paybackAmount(
            _poolToken,
            _shares
        );

        _validateNonZero(
            repaymentAmount
        );

        _handlePayback(
            msg.sender,
            _nftId,
            _poolToken,
            repaymentAmount,
            _shares
        );

        _safeTransferFrom(
            _poolToken,
            msg.sender,
            address(this),
            repaymentAmount
        );

        return repaymentAmount;
    }

    // --------------- Liquidation Functions ------------

    /**
     * @dev Function to liquidate a postion which reaches
     * a debt ratio greater than 100%. The liquidator can choose
     * token to payback and receive. (Both can differ!). The
     * amount is in shares of the payback token. The liquidator
     * gets an incentive which is calculated inside the liquidation
     * logic.
     */
    function liquidatePartiallyFromTokens(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        address _paybackToken,
        address _receiveToken,
        uint256 _shareAmountToPay
    )
        external
        syncPool(_paybackToken)
        syncPool(_receiveToken)
        returns (uint256)
    {
        CoreLiquidationStruct memory data;

        data.nftId = _nftId;
        data.nftIdLiquidator = _nftIdLiquidator;

        data.caller = msg.sender;

        data.tokenToPayback = _paybackToken;
        data.tokenToRecieve = _receiveToken;
        data.shareAmountToPay = _shareAmountToPay;

        data.maxFeeETH = WISE_SECURITY.maxFeeETH();
        data.baseRewardLiquidation = WISE_SECURITY.baseRewardLiquidation();

        (
            data.lendTokens,
            data.borrowTokens
        ) = _prepareAssociatedTokens(
            _nftId,
            _receiveToken,
            _paybackToken
        );

        data.paybackAmount = paybackAmount(
            _paybackToken,
            _shareAmountToPay
        );

        _checkPositionLocked(
            _nftId,
            msg.sender
        );

        _checkLiquidatorNft(
            _nftId,
            _nftIdLiquidator
        );

        WISE_SECURITY.checksLiquidation(
            _nftId,
            _paybackToken,
            _shareAmountToPay
        );

        return _coreLiquidation(
            data
        );
    }

    /**
     * @dev Wrapper function for liqudaiton flow
     */
    function coreLiquidationIsolationPools(
        uint256 _nftId,
        uint256 _nftIdLiquidator,
        address _caller,
        address _paybackToken,
        address _receiveToken,
        uint256 _paybackAmount,
        uint256 _shareAmountToPay
    )
        external
        syncPool(_paybackToken)
        syncPool(_receiveToken)
        returns (uint256)
    {
        CoreLiquidationStruct memory data;

        data.nftId = _nftId;
        data.nftIdLiquidator = _nftIdLiquidator;

        data.caller = _caller;

        data.paybackAmount = _paybackAmount;
        data.tokenToPayback = _paybackToken;
        data.tokenToRecieve = _receiveToken;
        data.shareAmountToPay = _shareAmountToPay;

        data.maxFeeETH = WISE_SECURITY.maxFeeFarmETH();
        data.baseRewardLiquidation = WISE_SECURITY.baseRewardLiquidationFarm();

        _validateIsolationPoolLiquidation(
            msg.sender,
            data.nftId,
            data.nftIdLiquidator
        );

        (
            data.lendTokens,
            data.borrowTokens
        ) = _prepareAssociatedTokens(
            data.nftId,
            data.tokenToRecieve,
            data.tokenToPayback
        );

        return _coreLiquidation(
            data
        );
    }

    /**
     * @dev Allows to sync pool manually
     * so that the pool is up to date.
     */
    function syncManually(
        address _poolToken
    )
        external
        syncPool(_poolToken)
    {
        address[] memory tokens = new address[](1);
        tokens[0] = _poolToken;

        _curveSecurityChecks(
            new address[](0),
            tokens
        );
    }

    /**
     * @dev Registers position _nftId
     * for isolation pool functionality
     */
    function setRegistrationIsolationPool(
        uint256 _nftId,
        bool _registerState
    )
        external
    {
        _onlyIsolationPool(
            msg.sender
        );

        _validateZero(
            WISE_SECURITY.overallETHCollateralsBare(_nftId)
        );

        _validateZero(
            WISE_SECURITY.overallETHBorrowBare(_nftId)
        );

        positionLocked[_nftId] = _registerState;
    }

    /**
    * @dev External wrapper for
    * {_corePayback} logic callable
    * by feeMananger.
    */
    function corePaybackFeeManager(
        address _poolToken,
        uint256 _nftId,
        uint256 _amount,
        uint256 _shares
    )
        external
        onlyFeeManager
        syncPool(_poolToken)
    {
        _corePayback(
            _nftId,
            _poolToken,
            _amount,
            _shares
        );
    }

    /**
     * @dev Internal function combining payback
     * logic and emit of an event.
     */
    function _handlePayback(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount,
        uint256 _shares
    )
        private
    {
        _corePayback(
            _nftId,
            _poolToken,
            _amount,
            _shares
        );

        emit FundsReturned(
            _caller,
            _poolToken,
            _nftId,
            _amount,
            _shares,
            block.timestamp
        );
    }

    function _handleWithdrawAmount(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount,
        bool _onBehalf
    )
        private
        returns (uint256 withdrawShares)
    {
        withdrawShares = _preparationsWithdraw(
            _nftId,
            msg.sender,
            _poolToken,
            _amount
        );

        _coreWithdrawToken(
            {
                _caller: _caller,
                _nftId: _nftId,
                _poolToken: _poolToken,
                _amount: _amount,
                _shares: withdrawShares,
                _onBehalf: _onBehalf
            }
        );
    }

    function _handleSolelyWithdraw(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _amount
    )
        private
    {
        _checkOwnerPosition(
            _nftId,
            _caller
        );

        _coreSolelyWithdraw(
            _caller,
            _nftId,
            _poolToken,
            _amount
        );

        _emitFundsSolelyWithdrawn(
            _caller,
            _nftId,
            _poolToken,
            _amount
        );
    }

    function _handleWithdrawShares(
        address _caller,
        uint256 _nftId,
        address _poolToken,
        uint256 _shares,
        bool _onBehalf
    )
        private
        returns (uint256)
    {
        if (_onBehalf == false) {
            _checkOwnerPosition(
                _nftId,
                _caller
            );
        }

        uint256 withdrawAmount = _cashoutAmount(
            _poolToken,
            _shares
        );

        _coreWithdrawToken(
            {
                _caller: _caller,
                _nftId: _nftId,
                _poolToken: _poolToken,
                _amount: withdrawAmount,
                _shares: _shares,
                _onBehalf: _onBehalf
            }
        );

        return withdrawAmount;
    }

    function _handleBorrowExactAmount(
        uint256 _nftId,
        address _poolToken,
        uint256 _amount,
        bool _onBehalf
    )
        private
        returns (uint256)
    {
        uint256 shares = calculateBorrowShares(
            {
                _poolToken: _poolToken,
                _amount: _amount,
                _maxSharePrice: true
            }
        );

        _coreBorrowTokens(
            {
                _caller: msg.sender,
                _nftId: _nftId,
                _poolToken: _poolToken,
                _amount: _amount,
                _shares: shares,
                _onBehalf: _onBehalf
            }
        );

        return shares;
    }

    /**
     * @dev Internal helper function for reservating a
     * position NFT id.
     */
    function _reservePosition()
        private
        returns (uint256)
    {
        return POSITION_NFT.reservePositionForUser(
            msg.sender
        );
    }
}
