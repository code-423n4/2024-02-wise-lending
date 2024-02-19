// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import {CommonBase} from "forge-std/Base.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";

import "./Tests/TesterLending.t.sol";
import "./InterfaceHub/IPositionNFTs.sol";
import "./../contracts/InterfaceHub/IERC20.sol";
import "forge-std/console.sol";

interface ISelf {
    function wrapSolelyDepositETH(
        uint256 _nftUsed
    )
        external
        payable
        returns (uint256);

    function wrapSolelyDepositToken(
        uint256 _nftUsed,
        address _poolAddress,
        uint256 _amount
    )
        external
        returns (uint256);

    function wrapSolelyWithdrawToken(
        uint256 _nftUsed,
        address _poolAddress,
        uint256 _amount
    )
        external
        returns (uint256);

    function wrapSolelyWithdrawETH(
        uint256 _nftUsed,
        uint256 _amount
    )
        external
        returns (uint256);

    function cashoutWrapper(
        uint256 _nftId,
        address _poolAddress
    )
        external
        returns (uint256);

    function empty(
        uint256 _nftId,
        address _poolAddress
    )
        external
        view
        returns (uint256);

    function emptyEthBorrow(
        uint256,
        uint256
    )
        external
        returns (uint256);

    function emptyBorrowPayBack(
        uint256,
        address,
        uint256
    )
        external
        returns (uint256);

    function emptyEthPayback(
        uint256
    )
        external
        payable
        returns (uint256);
}

contract InvariantHandler is CommonBase, StdCheats, StdUtils {

    TesterLending private lendingHandlerInstance;
    IPositionNFTs private nftHandlerInstance;
    ISelf private selfInstance;

    uint256 public invariantBalanceExact;
    uint256 public invariantBalanceShares;
    uint256 public invariantShares;
    uint256 public invariantBorrowTokenAmount;

    address public immutable WETH_ADDRESS;
    address public immutable USDC_ADDRESS;

    uint256 nftUsed;

    struct LoopInfo {
        uint256 cashedBalance;
        uint256 boundAmount;
        uint256 shares;
        uint256 sharesReceived;
        uint256 balanceLeftToDeposit;
        uint256 amountReceived;
        uint256 sum;
        uint256 newBal;
        uint256 maxCashoutAmount;
        uint256 borrowedShares;
        uint256 minCashOutAmount;
        bool balanceBigger;
    }

    struct Functions {
        function (uint256) external payable returns (uint256) ethDepositFunction;
        function (uint256,uint256) external returns (uint256) ethWithdrawFunction;
        function (uint256,address,uint256) external returns (uint256) tokenDepositFunction;
        function (uint256,address,uint256) external returns (uint256) tokenWithdrawFunction;
        function (uint256,address) external returns (uint256) sharesCheckFunction;
        function (uint256,address) external returns (uint256) cashoutFunction;
        function (uint256,uint256) external returns (uint256) ethBorrowFunction;
        function (uint256,address,uint256) external returns (uint256) borrowFunction;
        function (uint256) external payable returns (uint256) ethPaybackFunction;
        function (uint256,address,uint256) external returns (uint256) paybackFunction;
    }

    constructor (
        address _testerLendingAddress
    )
    {
        lendingHandlerInstance = TesterLending(
            payable(_testerLendingAddress)
        );

        nftHandlerInstance = IPositionNFTs(
            lendingHandlerInstance.POSITION_NFT()
        );

        WETH_ADDRESS = lendingHandlerInstance.WETH_ADDRESS();

        USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // ETH- MAIN

        selfInstance = ISelf(
            address(this)
        );
    }

    receive()
        external
        payable
    {}

    function borrowPayBackLoop(
        uint256 _amount
    )
        public
    {
        Functions memory functions = Functions({
            ethDepositFunction: lendingHandlerInstance.depositExactAmountETH,
            ethWithdrawFunction: lendingHandlerInstance.withdrawExactAmountETH,
            tokenDepositFunction: lendingHandlerInstance.depositExactAmount,
            tokenWithdrawFunction: lendingHandlerInstance.withdrawExactAmount,
            sharesCheckFunction: lendingHandlerInstance.getPositionLendingShares,
            cashoutFunction: selfInstance.cashoutWrapper,
            ethBorrowFunction: lendingHandlerInstance.borrowExactAmountETH,
            borrowFunction: lendingHandlerInstance.borrowExactAmount,
            ethPaybackFunction: lendingHandlerInstance.paybackExactAmountETH,
            paybackFunction: lendingHandlerInstance.paybackExactAmount
        });

        _executeBorrowPaybackLoopExactAmount(
            WETH_ADDRESS,
            _amount,
            functions
        );
    }

    function depositWithdrawLoopTokenExactAmount(
        uint256 _amount
    )
        public
    {
        Functions memory functions = Functions({
            ethDepositFunction: lendingHandlerInstance.depositExactAmountETH,
            ethWithdrawFunction: lendingHandlerInstance.withdrawExactAmountETH,
            tokenDepositFunction: lendingHandlerInstance.depositExactAmount,
            tokenWithdrawFunction: lendingHandlerInstance.withdrawExactAmount,
            sharesCheckFunction: lendingHandlerInstance.getPositionLendingShares,
            cashoutFunction: selfInstance.cashoutWrapper,
            ethBorrowFunction: selfInstance.emptyEthBorrow,
            borrowFunction: selfInstance.emptyBorrowPayBack,
            ethPaybackFunction: selfInstance.emptyEthPayback,
            paybackFunction: selfInstance.emptyBorrowPayBack
        });

        _executeDepositWithdrawLoop(
            USDC_ADDRESS,
            _amount,
            functions
        );
    }

    function depositWithdrawLoopExactAmount(
        uint256 _amount
    )
        public
    {
        Functions memory functions = Functions({
            ethDepositFunction: lendingHandlerInstance.depositExactAmountETH,
            ethWithdrawFunction: lendingHandlerInstance.withdrawExactAmountETH,
            tokenDepositFunction: lendingHandlerInstance.depositExactAmount,
            tokenWithdrawFunction: lendingHandlerInstance.withdrawExactAmount,
            sharesCheckFunction: lendingHandlerInstance.getPositionLendingShares,
            cashoutFunction: selfInstance.cashoutWrapper,
            ethBorrowFunction: selfInstance.emptyEthBorrow,
            borrowFunction: selfInstance.emptyBorrowPayBack,
            ethPaybackFunction: selfInstance.emptyEthPayback,
            paybackFunction: selfInstance.emptyBorrowPayBack
        });

        _executeDepositWithdrawLoop(
            WETH_ADDRESS,
            _amount,
            functions
        );
    }

    function depositWithdrawLoopSharesToken(
        uint256 _amount
    )
        public
    {
        Functions memory functions = Functions({
            ethDepositFunction: lendingHandlerInstance.depositExactAmountETH,
            ethWithdrawFunction: lendingHandlerInstance.withdrawExactSharesETH,
            tokenDepositFunction: lendingHandlerInstance.depositExactAmount,
            tokenWithdrawFunction: lendingHandlerInstance.withdrawExactShares,
            sharesCheckFunction: lendingHandlerInstance.getPositionLendingShares,
            cashoutFunction: selfInstance.empty,
            ethBorrowFunction: selfInstance.emptyEthBorrow,
            borrowFunction: selfInstance.emptyBorrowPayBack,
            ethPaybackFunction: selfInstance.emptyEthPayback,
            paybackFunction: selfInstance.emptyBorrowPayBack
        });

        _executeDepositWithdrawLoopShares(
            USDC_ADDRESS,
            _amount,
            functions
        );
    }

    function depositWithdrawLoopShares(
        uint256 _amount
    )
        public
    {
        Functions memory functions = Functions({
            ethDepositFunction: lendingHandlerInstance.depositExactAmountETH,
            ethWithdrawFunction: lendingHandlerInstance.withdrawExactSharesETH,
            tokenDepositFunction: lendingHandlerInstance.depositExactAmount,
            tokenWithdrawFunction: lendingHandlerInstance.withdrawExactShares,
            sharesCheckFunction: lendingHandlerInstance.getPositionLendingShares,
            cashoutFunction: selfInstance.empty,
            ethBorrowFunction: selfInstance.emptyEthBorrow,
            borrowFunction: selfInstance.emptyBorrowPayBack,
            ethPaybackFunction: selfInstance.emptyEthPayback,
            paybackFunction: selfInstance.emptyBorrowPayBack
        });

        _executeDepositWithdrawLoopShares(
            WETH_ADDRESS,
            _amount,
            functions
        );
    }

    function depositWithdrawLoopSolely(
        uint256 _amount
    )
        public
    {
        Functions memory functions = Functions({
            ethDepositFunction: selfInstance.wrapSolelyDepositETH,
            ethWithdrawFunction: selfInstance.wrapSolelyWithdrawETH,
            tokenDepositFunction: selfInstance.wrapSolelyDepositToken,
            tokenWithdrawFunction: selfInstance.wrapSolelyWithdrawToken,
            sharesCheckFunction: lendingHandlerInstance.getPureCollateralAmount,
            cashoutFunction: lendingHandlerInstance.getPureCollateralAmount,
            ethBorrowFunction: selfInstance.emptyEthBorrow,
            borrowFunction: selfInstance.emptyBorrowPayBack,
            ethPaybackFunction: selfInstance.emptyEthPayback,
            paybackFunction: selfInstance.emptyBorrowPayBack
        });

        _executeDepositWithdrawLoop(
            WETH_ADDRESS,
            _amount,
            functions
        );
    }

    function depositWithdrawLoopSolelyToken(
        uint256 _amount
    )
        public
    {
        Functions memory functions = Functions({
            ethDepositFunction: selfInstance.wrapSolelyDepositETH,
            ethWithdrawFunction: selfInstance.wrapSolelyWithdrawETH,
            tokenDepositFunction: selfInstance.wrapSolelyDepositToken,
            tokenWithdrawFunction: selfInstance.wrapSolelyWithdrawToken,
            sharesCheckFunction: lendingHandlerInstance.getPureCollateralAmount,
            cashoutFunction: lendingHandlerInstance.getPureCollateralAmount,
            ethBorrowFunction: selfInstance.emptyEthBorrow,
            borrowFunction: selfInstance.emptyBorrowPayBack,
            ethPaybackFunction: selfInstance.emptyEthPayback,
            paybackFunction: selfInstance.emptyBorrowPayBack
        });

        _executeDepositWithdrawLoop(
            USDC_ADDRESS,
            _amount,
            functions
        );
    }

    function wrapSolelyDepositETH(
        uint256 _nftUsed
    )
        external
        payable
        returns (uint256)
    {
        uint256 amountBefore = lendingHandlerInstance.getPureCollateralAmount(
            _nftUsed,
            WETH_ADDRESS
        );

        lendingHandlerInstance.solelyDepositETH{value: msg.value}(
            nftUsed
        );

        uint256 amountAfter = lendingHandlerInstance.getPureCollateralAmount(
            _nftUsed,
            WETH_ADDRESS
        );

        return amountAfter - amountBefore;
    }

    function _wrapSolelyDepositToken(
        uint256 _nftUsed,
        address _poolAddress,
        uint256 _amount
    )
        internal
        returns (uint256)
    {
        uint256 amountBefore = lendingHandlerInstance.getPureCollateralAmount(
            nftUsed,
            _poolAddress
        );

        lendingHandlerInstance.solelyDeposit(
            _nftUsed,
            _poolAddress,
            _amount
        );

        uint256 amountAfter = lendingHandlerInstance.getPureCollateralAmount(
            _nftUsed,
            _poolAddress
        );

        return amountAfter - amountBefore;
    }

    function wrapSolelyDepositToken(
        uint256 _nftUsed,
        address _poolAddress,
        uint256 _amount
    )
        external
        returns (uint256)
    {
        return _wrapSolelyDepositToken(
            _nftUsed,
            _poolAddress,
            _amount
        );
    }

    function wrapSolelyWithdrawToken(
        uint256 _nftUsed,
        address _poolAddress,
        uint256 _amount
    )
        external
        returns (uint256)
    {
        uint256 amountBefore = lendingHandlerInstance.getPureCollateralAmount(
            _nftUsed,
            _poolAddress
        );

        lendingHandlerInstance.solelyWithdraw(
            _nftUsed,
            _poolAddress,
            _amount
        );

        uint256 amountAfter = lendingHandlerInstance.getPureCollateralAmount(
            _nftUsed,
            _poolAddress
        );

        return amountBefore - amountAfter;
    }

    function wrapSolelyWithdrawETH(
        uint256 _nftUsed,
        uint256 _amount
    )
        external
        returns (uint256)
    {
        uint256 amountBefore = lendingHandlerInstance.getPureCollateralAmount(
            _nftUsed,
            WETH_ADDRESS
        );

        lendingHandlerInstance.solelyWithdrawETH(
            _nftUsed,
            _amount
        );

        uint256 amountAfter = lendingHandlerInstance.getPureCollateralAmount(
            _nftUsed,
            WETH_ADDRESS
        );

        return amountBefore - amountAfter;
    }

    function changeNft()
        public
    {
        nftUsed = nftHandlerInstance.mintPosition();
    }

    function _checkSharesActive(
        address _poolAddress
    )
        internal
        view
    {
        if (lendingHandlerInstance.getPositionLendingShares(
                nftUsed,
                _poolAddress
            ) > 0
        )
        {
            revert("Shares still active");
        }
    }

    function _fillLoopInfoStruct(
        address _poolAddress
    )
        internal
        returns (
            LoopInfo memory
        )
    {
        LoopInfo memory loopInfo;

        _checkSharesActive(
            _poolAddress
        );

        loopInfo.cashedBalance = _poolAddress == WETH_ADDRESS
            ? address(this).balance
            : IERC20(_poolAddress).balanceOf(address(this));

        lendingHandlerInstance.syncManually(
            _poolAddress
        );

        loopInfo.balanceLeftToDeposit = lendingHandlerInstance.maxDepositValueToken(_poolAddress)
            - lendingHandlerInstance.getTotalBareToken(_poolAddress)
            - lendingHandlerInstance.getPseudoTotalPool(_poolAddress);

        loopInfo.balanceBigger = loopInfo.cashedBalance > loopInfo.balanceLeftToDeposit;

        loopInfo.boundAmount = loopInfo.balanceBigger
            ? loopInfo.balanceLeftToDeposit
            : loopInfo.cashedBalance;

        loopInfo.minCashOutAmount = lendingHandlerInstance.cashoutAmount(
            {
                _poolToken: _poolAddress,
                _shares: 1
            }
        );

        return loopInfo;
    }

    function _executeDepositWithdrawLoopShares(
        address _poolAddress,
        uint256 _amount,
        Functions memory _functions
    )
        internal
    {
        (
            uint256 newAmount,
            LoopInfo memory loopInfo,
            bool depositTooSmall
        ) = _setupDeposit(
            _functions,
            _poolAddress,
            _amount
        );

        if (depositTooSmall) {
            return;
        }

        _amount = newAmount;

        loopInfo.amountReceived = _poolAddress == WETH_ADDRESS
            ? _functions.ethWithdrawFunction(
                nftUsed,
                loopInfo.shares
            )
            : _functions.tokenWithdrawFunction(
                nftUsed,
                _poolAddress,
                loopInfo.shares
            );

        loopInfo.newBal = _poolAddress == WETH_ADDRESS
            ? address(this).balance
            : IERC20(_poolAddress).balanceOf(address(this));

        invariantBalanceShares = loopInfo.newBal > loopInfo.cashedBalance
            ? invariantBalanceShares += loopInfo.newBal - loopInfo.cashedBalance
            : invariantBalanceShares -= 0;

        loopInfo.shares = _functions.sharesCheckFunction(
            nftUsed,
            _poolAddress
        );

        if (loopInfo.shares > 0) {
            invariantShares += loopInfo.shares;
        }
    }

    function _executeDepositWithdrawLoop(
        address _poolAddress,
        uint256 _amount,
        Functions memory _functions
    )
        internal
    {
        (
            uint256 newAmount,
            LoopInfo memory loopInfo,
            bool depositTooSmall
        ) = _setupDeposit(
            _functions,
            _poolAddress,
            _amount
        );

        if (depositTooSmall) {
            return;
        }

        _amount = newAmount;

        loopInfo.maxCashoutAmount = _functions.cashoutFunction(
            nftUsed,
            _poolAddress
        );

        if (loopInfo.maxCashoutAmount > _amount) {
            revert ("Max cashout amount bigger than amount");
        }

        _poolAddress == WETH_ADDRESS
            ? _functions.ethWithdrawFunction(
                nftUsed,
                loopInfo.maxCashoutAmount
            )
            : _functions.tokenWithdrawFunction(
                nftUsed,
                _poolAddress,
                loopInfo.maxCashoutAmount
            );

        loopInfo.newBal = _poolAddress == WETH_ADDRESS
            ? address(this).balance
            : IERC20(_poolAddress).balanceOf(address(this));

        invariantBalanceExact = loopInfo.newBal > loopInfo.cashedBalance
            ? invariantBalanceExact += loopInfo.newBal
                - loopInfo.cashedBalance
            : invariantBalanceExact += 0;

        loopInfo.shares = _functions.sharesCheckFunction(
            nftUsed,
            _poolAddress
        );

        if (loopInfo.shares > 0) {
            revert("Shares left");
        }
    }

    function _executeBorrowPaybackLoopExactAmount(
        address _poolAddress,
        uint256 _amount,
        Functions memory _functions
    )
        internal
    {
        (
            uint256 newAmount,
            LoopInfo memory loopInfo,
            bool depositTooSmall
        ) = _setupDeposit(
            _functions,
            _poolAddress,
            _amount
        );

        if (depositTooSmall) {
            return;
        }

        _amount = newAmount;

        (
            ,
            ,
            uint256 collateralFactor
        ) = lendingHandlerInstance.lendingPoolData(
            _poolAddress
        );

        loopInfo.maxCashoutAmount = _functions.cashoutFunction(
            nftUsed,
            _poolAddress
        );

        if (loopInfo.maxCashoutAmount > _amount) {
            revert ("Max cashout amount bigger than amount");
        }

        uint256 borrowAmount = loopInfo.maxCashoutAmount
            * collateralFactor
            / 1 ether
            * 0.9499 ether
            / 1 ether;

        bool noBorrow;

        if (borrowAmount == 0) {
            vm.expectRevert(
                ValueIsZero.selector
            );

            noBorrow = true;
        }

        loopInfo.borrowedShares = _poolAddress == WETH_ADDRESS
            ? _functions.ethBorrowFunction(
                nftUsed,
                borrowAmount
            )
            : _functions.borrowFunction(
                nftUsed,
                _poolAddress,
                borrowAmount
            );

        if (loopInfo.borrowedShares != lendingHandlerInstance.getPositionBorrowShares(nftUsed, _poolAddress)) {
            revert ("Borrowed shares wrongfully assigned");
        }

        uint256 paybackAmount = lendingHandlerInstance.paybackAmount(
            _poolAddress,
            loopInfo.borrowedShares
        );

        if (paybackAmount == 0) {

            noBorrow == true
                ? _poolAddress == WETH_ADDRESS
                    ? vm.expectRevert(ValueIsZero.selector)
                    : vm.expectRevert(ValueIsZero.selector)
                : vm.expectRevert(ValueIsZero.selector);
        }

        _poolAddress == WETH_ADDRESS
            ? _functions.ethPaybackFunction{
                value: paybackAmount
            }(
                nftUsed
            )
            : _functions.paybackFunction(
                nftUsed,
                _poolAddress,
                paybackAmount
            );

        if (paybackAmount < borrowAmount) {
            invariantBorrowTokenAmount += borrowAmount - paybackAmount;
        }

        if (loopInfo.maxCashoutAmount == 0) {
            vm.expectRevert(
                ValueIsZero.selector
            );
        }

        if (_poolAddress == WETH_ADDRESS) {

            _functions.ethWithdrawFunction(
                nftUsed,
                loopInfo.maxCashoutAmount
            );

            return;
        }

        _functions.tokenWithdrawFunction(
            nftUsed,
            _poolAddress,
            loopInfo.maxCashoutAmount
        );
    }

    function cashoutWrapper(
        uint256 _nftId,
        address _poolAddress
    )
        external
        view
        returns (uint256)
    {
        return lendingHandlerInstance.cashoutAmount(
            _poolAddress,
            lendingHandlerInstance.getPositionLendingShares(
                _nftId,
                _poolAddress
            )
        );
    }

    function _deposit(
        address _poolAddress,
        uint256 _amount,
        function (uint256) external payable returns (uint256) _ethDepositFunction,
        function (uint256,address,uint256) external returns (uint256) _tokenDepositFunction
    )
        internal
        returns (uint256)
    {
        return _poolAddress == WETH_ADDRESS
            ? _ethDepositFunction{
                value: _amount
            }(
                nftUsed
            )
            : _tokenDepositFunction(
                nftUsed,
                _poolAddress,
                _amount
            );
    }

    function _checkSharesReceived(
        uint256 _shares,
        address _poolAddress,
        function (uint256,address) external returns (uint256) _sharesCheckFunction
    )
        internal
    {
        if (_shares != _sharesCheckFunction(
                nftUsed,
                _poolAddress
            )
        )
        {
            revert("Shares wrongfully assigned");
        }
    }

    function _setupDeposit(
        Functions memory _functions,
        address _poolAddress,
        uint256 _amount
    )
        internal
        returns (
            uint256,
            LoopInfo memory,
            bool depositTooSmall
        )
    {
        LoopInfo memory loopInfo = _fillLoopInfoStruct(
            _poolAddress
        );

        if (loopInfo.minCashOutAmount > loopInfo.boundAmount) {
            return (
                _amount,
                loopInfo,
                true
            );
        }

        _amount = bound(
            _amount,
            loopInfo.minCashOutAmount,
            loopInfo.boundAmount
        );

        loopInfo.sharesReceived = _deposit(
            _poolAddress,
            _amount,
            _functions.ethDepositFunction,
            _functions.tokenDepositFunction
        );

        loopInfo.shares = _functions.sharesCheckFunction(
            nftUsed,
            _poolAddress
        );

        _checkSharesReceived(
            loopInfo.sharesReceived,
            _poolAddress,
            _functions.sharesCheckFunction
        );

        return (
            _amount,
            loopInfo,
            false
        );
    }

    event ERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes _data
    );

    function onERC721Received(
        address _operator,
        address _from,
        uint256 _tokenId,
        bytes calldata _data
    )
        external
        returns (bytes4)
    {
        emit ERC721Received(
            _operator,
            _from,
            _tokenId,
            _data
        );

        return this.onERC721Received.selector;
    }
}
