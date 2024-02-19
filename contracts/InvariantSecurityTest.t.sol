// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "./WiseLendingBaseDeployment.t.sol";
import "./InvariantHandler.sol";
import "./InvariantUser.sol";
import "./InvariantManager.sol";

contract InvariantSecurityTest is BaseDeploymentTest {

    InvariantHandler public handler;
    InvariantUser public user;
    InvariantManager public manager;

    bool public mainnet = false;

    address public USDC_ADDRESS = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48; // ETH- MAIN

    function _setupIndividualTest()
        internal
        override
    {

        if (mainnet) {
            _mainnetWrapper();
        }else {
            _localWrapper();
        }
    }

    function _mainnetWrapper()
        private
    {
         _useBlock(
            NEW_BLOCK
        );
        _deployNewWiseLending(
            {
                _mainnetFork: true
            }
        );
        _stopStartPrank();
        _createInstances();
        _dealEtherToInstances();
        _transferUSDC();
        _approveUSDC();
        _setTargetContract();
        _setTargetSelector();
        _setHeartBeats();
        vm.allowCheatcodes(
            address(handler)
        );
    }

    function _localWrapper()
        private
    {
        _deployNewWiseLending(
            {
                _mainnetFork: false
            }
        );
        _createInstances();
        _dealEthAndWethLocal();
        _approveLocal(
            address(user)
        );
        _dealEtherToInstances();
        _setTargetContract();
        _setTargetSelectorLocal();
        _sendTokens();
        vm.allowCheatcodes(
            address(handler)
        );
        _giveFeeManagerNft();
    }

    function _sendTokens()
        internal
    {
        address[] memory tokens = new address[](9);
        tokens[0] = address(MOCK_AAVE_ATOKEN_1);
        tokens[1] = address(MOCK_AAVE_ATOKEN_2);
        tokens[2] = address(MOCK_AAVE_ATOKEN_3);
        tokens[3] = address(MOCK_AAVE_ATOKEN_4);
        tokens[4] = address(MOCK_ERC20_1);
        tokens[5] = address(MOCK_ERC20_2);
        tokens[6] = address(MOCK_ERC20_3);
        tokens[7] = address(MOCK_ERC20_4);
        tokens[8] = address(MOCK_WETH);

        vm.startPrank(
            MOCK_DEPLOYER
        );

        for (uint256 i = 0; i < tokens.length; i++) {
            IERC20(tokens[i]).transfer(
                address(user),
                IERC20(tokens[i]).balanceOf(MOCK_DEPLOYER)
            );
        }

        vm.deal(
            address(user),
            1000000000 ether
        );
    }

    function _stopStartPrank()
        internal
    {
        vm.stopPrank();
        vm.startPrank(
            BALANCER_ADDRESS
        );
    }

    function _setHeartBeats()
        internal
    {
        address[] memory addresses = new address[](2);
        addresses[0] = USDC_ADDRESS;
        addresses[1] = WETH_ADDRESS;

        uint256[] memory values = new uint256[](2);
        values[0] = type(uint256).max;
        values[1] = type(uint256).max;

        ORACLE_HUB_INSTANCE.setHeartBeatBulk(
            addresses,
            values
        );
    }

    function _createInstances()
        internal
    {

        address[] memory tokens = new address[](9);
        tokens[0] = address(MOCK_AAVE_ATOKEN_1);
        tokens[1] = address(MOCK_AAVE_ATOKEN_2);
        tokens[2] = address(MOCK_AAVE_ATOKEN_3);
        tokens[3] = address(MOCK_AAVE_ATOKEN_4);
        tokens[4] = address(MOCK_ERC20_1);
        tokens[5] = address(MOCK_ERC20_2);
        tokens[6] = address(MOCK_ERC20_3);
        tokens[7] = address(MOCK_ERC20_4);
        tokens[8] = address(MOCK_WETH);

        handler = new InvariantHandler(
            address(LENDING_INSTANCE)
        );
        user = new InvariantUser(
            address(LENDING_INSTANCE),
            address(ORACLE_HUB_INSTANCE),
            tokens
        );

        manager = new InvariantManager(
            address(user),
            address(handler)
        );

        manager.setTester(address(this));
    }

    function _dealEtherToInstances()
        internal
    {
        deal(
            address(handler),
            10000 ether
        );
        deal(
            address(user),
            10000 ether
        );
    }

    function _transferUSDC()
        internal
    {
        _transferUSDCPart(
            address(user)
        );
        _transferUSDCPart(
            address(handler)
        );
        vm.stopPrank();
    }

    function _transferUSDCPart(
        address _to
    )
        internal
    {
        IERC20(USDC_ADDRESS).transfer(
            _to,
            IERC20(USDC_ADDRESS).balanceOf(BALANCER_ADDRESS) / 2
        );
    }

    function _approveUSDC()
        internal
    {
        _approveUSDCPart(address(user));
        _approveUSDCPart(address(handler));
    }

    function _approveUSDCPart(
        address _addressApprove
    )
        internal
    {
        vm.startPrank(
            _addressApprove
        );
        IERC20(USDC_ADDRESS).approve(
            address(LENDING_INSTANCE),
            type(uint256).max
        );
        vm.stopPrank();
    }

    function _setTargetContract()
        internal
    {
        targetContract(
            address(manager)
        );
    }

    function _setTargetSelectorLocal()
        internal
    {
        bytes4[] memory selectors = new bytes4[](210);
        selectors[0] = user.depositExactAmount.selector;
        selectors[1] = user.depositExactAmount.selector;
        selectors[2] = user.depositExactAmount.selector;
        selectors[3] = user.depositExactAmountETH.selector;
        selectors[4] = user.withdrawExactAmount.selector;
        selectors[5] = user.withdrawExactAmountETH.selector;
        selectors[6] = user.withdrawExactShares.selector;
        selectors[7] = user.withdrawExactSharesETH.selector;
        selectors[8] = user.solelyDeposit.selector;
        selectors[9] = user.solelyDepositETH.selector;
        selectors[10] = user.solelyWithdraw.selector;
        selectors[11] = user.solelyWithdrawETH.selector;
        selectors[12] = user.borrowExactAmount.selector;
        selectors[13] = user.borrowExactAmount.selector;
        selectors[14] = user.borrowExactAmount.selector;
        selectors[15] = user.borrowExactAmountETH.selector;
        selectors[16] = user.paybackExactAmount.selector;
        selectors[17] = user.paybackExactAmountETH.selector;
        selectors[18] = user.paybackExactShares.selector;
        selectors[19] = user.donate.selector;
        selectors[20] = user.uncollateralizeDeposit.selector;

        for (uint i = 0; i < selectors.length / 21; i++) {
            for (uint j = 0; j < 21; j++) {
                selectors[i * 21 + j] = selectors[j];
            }
        }

        targetSelector(
            FuzzSelector(
                {
                    addr: address(manager),
                    selectors: selectors
                }
            )
        );
    }

    function _setTargetSelector() internal {
        bytes4[] memory selectors = new bytes4[](8);
        selectors[0] = handler.depositWithdrawLoopExactAmount.selector;
        selectors[1] = handler.depositWithdrawLoopShares.selector;
        selectors[2] = user.donate.selector;
        selectors[3] = handler.depositWithdrawLoopTokenExactAmount.selector;
        selectors[4] = handler.depositWithdrawLoopSharesToken.selector;
        selectors[5] = manager.depositWithdrawLoopSolely.selector;
        selectors[6] = manager.depositWithdrawLoopSolelyToken.selector;
        selectors[7] = manager.borrowPayBackLoop.selector;

        targetSelector(
            FuzzSelector(
                {
                    addr: address(manager),
                    selectors: selectors
                }
            )
        );
    }

    function testDeployLocal()
        public
    {
        _localWrapper();
    }

    function _giveFeeManagerNft()
        internal
    {
        vm.startPrank(
            address(POSITION_NFTS_INSTANCE)
        );

        POSITION_NFTS_INSTANCE.safeTransferFrom(address(POSITION_NFTS_INSTANCE), address(user), 0);
        vm.stopPrank();
    }

    function invariant_LOCAL()
        public
    {
        uint256 nftLength = POSITION_NFTS_INSTANCE.getNextExpectedId();
        uint256 highestOver;

        for (uint256 i = 0; i < nftLength; i++) {
            uint256 debtratio = SECURITY_INSTANCE.getLiveDebtRatio(i);

            if (debtratio > 1 ether)
            {
                highestOver = debtratio;
                console.log("debtratio", debtratio,i);
            }

        }

        assertEq(
            highestOver,
            0
        );
    }

    function invariant_WETH()
        internal
    {
        assertEq(
            handler.invariantBalanceExact(),
            0
        );

        assertEq(
            handler.invariantBalanceShares(),
            0
        );

        assertEq(
            handler.invariantShares(),
            0
        );

        assertEq(
            handler.invariantBorrowTokenAmount(),
            0
        );
    }
}