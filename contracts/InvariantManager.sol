// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import {CommonBase} from "forge-std/Base.sol";
import {StdCheats} from "forge-std/StdCheats.sol";
import {StdUtils} from "forge-std/StdUtils.sol";

import "./InvariantUser.sol";
import "./InvariantHandler.sol";

interface Tester {
    function spendTime(
        uint256 _amount
    )
        external;
}

contract InvariantManager is CommonBase, StdCheats, StdUtils {
    InvariantUser public invariantUserInstance;
    InvariantHandler public invariantHandlerInstance;
    Tester public testerInstance;

    constructor (
        address _invariantUserAddress,
        address _invariantHandlerAddress
    )
    {
        invariantUserInstance = InvariantUser(
            payable(_invariantUserAddress)
        );

        invariantHandlerInstance = InvariantHandler(
            payable(_invariantHandlerAddress)
        );
    }

    function setTester(
        address _testerAddress
    )
        public
    {
        testerInstance = Tester(
            payable(_testerAddress)
        );
    }

    function depositWithdrawLoopExactAmount(
        uint256 _amount
    )
        public
    {
        invariantHandlerInstance.depositWithdrawLoopExactAmount(
            _amount
        );
    }

    function depositWithdrawLoopTokenExactAmount(
        uint256 _amount
    )
        public
    {
        invariantHandlerInstance.depositWithdrawLoopTokenExactAmount(
            _amount
        );
    }

    function depositWithdrawLoopSolely(
        uint256 _amount
    )
        public
    {
        invariantHandlerInstance.depositWithdrawLoopSolely(
            _amount
        );
    }

    function depositWithdrawLoopSolelyToken(
        uint256 _amount
    )
        public
    {
        invariantHandlerInstance.depositWithdrawLoopSolelyToken(
            _amount
        );
    }

    function depositWithdrawLoopShares(
        uint256 _amount
    )
        public
    {
        invariantHandlerInstance.depositWithdrawLoopShares(
            _amount
        );
    }

    function depositWithdrawLoopSharesToken(
        uint256 _amount
    )
        public
    {
        invariantHandlerInstance.depositWithdrawLoopSharesToken(
            _amount
        );
    }

    function donate(
        uint256 _amount,
        uint256 _tokenIndex
    )
        public
    {
        invariantUserInstance.donate(
            _amount,
            _tokenIndex
        );
    }

    function solelyWithdrawETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.solelyWithdrawETH(
            _nftId,
            _amount
        );
    }

     function solelyWithdraw(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.solelyWithdraw(
            _nftId,
            _tokenIndex,
            _amount
        );
    }

    function solelyDepositETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.solelyDepositETH(
            _nftId,
            _amount
        );
    }

    function solelyDeposit(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.solelyDeposit(
            _nftId,
            _tokenIndex,
            _amount
        );
    }

    function borrowExactAmount(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.borrowExactAmount(
            _nftId,
            _tokenIndex,
            _amount
        );

    }

    function depositExactAmount(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.depositExactAmount(
            _nftId,
            _tokenIndex,
            _amount
        );
    }

    function withdrawExactAmount(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.withdrawExactAmount(
            _nftId,
            _tokenIndex,
            _amount
        );
    }

    function withdrawExactShares(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.withdrawExactShares(
            _nftId,
            _tokenIndex,
            _amount
        );
    }

    function withdrawExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.withdrawExactAmountETH(
            _nftId,
            _amount
        );
    }

    function withdrawExactSharesETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.withdrawExactSharesETH(
            _nftId,
            _amount
        );
    }

    function depositExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.depositExactAmountETH(
            _nftId,
            _amount
        );
    }

    function paybackExactAmount(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.paybackExactAmount(
            _nftId,
            _tokenIndex,
            _amount
        );
    }

    function paybackExactShares(
        uint256 _nftId,
        uint256 _tokenIndex,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.paybackExactShares(
            _nftId,
            _tokenIndex,
            _amount
        );
    }

    function paybackExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.paybackExactAmountETH(
            _nftId,
            _amount
        );
    }
/*
    function spendTime(
        uint256 _amount
    )
        public
    {

        _amount = bound(
            _amount,
            0,
            1
        );
        testerInstance.spendTime(
            _amount
        );
        return;
    }*/

    function uncollateralizeDeposit(
        uint256 _nftId,
        uint256 _tokenIndex
    )
        public
    {
        invariantUserInstance.uncollateralizeDeposit(
            _nftId,
            _tokenIndex
        );
    }

    function borrowExactAmountETH(
        uint256 _nftId,
        uint256 _amount
    )
        public
    {
        invariantUserInstance.borrowExactAmountETH(
            _nftId,
            _amount
        );
    }

    function borrowPayBackLoop(
        uint256 _amount
    )
        public
    {
        invariantHandlerInstance.borrowPayBackLoop(
            _amount
        );
    }

}
