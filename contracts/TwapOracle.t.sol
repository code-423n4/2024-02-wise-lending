// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "forge-std/Test.sol";
import "./WiseLendingBaseDeployment.t.sol";

contract TwapOracleTest is BaseDeploymentTest {

    // Tokens
    address constant DAI = 0x6B175474E89094C44Da98b954EedeAC495271d0F;
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // Pricing Feeds (Chainlink)
    address constant DAI_ETH_FEED = 0x773616E4d11A78F511299002da57A0a94577F1f4;
    address constant USDC_ETH_FEED = 0x986b5E1e1755e3C2440e960477f25201B0a8bbD4;

    // Uniswap Pools (V3)
    address constant USDC_ETH_UNI_POOL = 0x88e6A0c2dDD26FEEb64F039a2c41296FcB3f5640;
    address constant USDC_DAI_UNI_POOL = 0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168;

    // Fees
    uint24 constant UNI_FEE_USDC_WETH = 500;
    uint24 constant UNI_FEE_DAI_USDC = 100;
    uint24 constant FAKE_FEE_UNI = 200;

    uint256 NEWEST_BLOCK = 18698414;

    address NEWEST_DEPLOYED_ORACLE_HUB = 0xf8A8EAe0206D36B9ac87Eaa9A229047085aF0178;

    function testTwap()
        public
    {
        _setupUSDC(false);

        uint256 chainlinkResponse = ORACLE_HUB_INSTANCE.latestResolver(
            USDC
        );

        uint256 response = ORACLE_HUB_INSTANCE.latestResolverTwap(
            USDC
        );

        console.log("chainlinkResponse: %s", chainlinkResponse);
        console.log("TwapResponse: %s", response);

        uint256 latestResolver = ORACLE_HUB_INSTANCE.latestResolver(USDC);

        console.log("latestResolver: %s", latestResolver);

        ORACLE_HUB_INSTANCE.setAllowedDifference(
            0
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                OraclesDeviate.selector
            )
        );

        ORACLE_HUB_INSTANCE.latestResolver(
            USDC
        );

        vm.expectRevert(
            TwapOracleAlreadySet.selector
        );

        ORACLE_HUB_INSTANCE.addTwapOracleDerivative(
            USDC,
            DAI,
            [
                USDC_DAI_UNI_POOL,
                USDC_ETH_UNI_POOL
            ],
            [
                DAI,
                USDC
            ],
            [
                USDC,
                WETH
            ],
            [
                UNI_FEE_DAI_USDC,
                UNI_FEE_USDC_WETH
            ]
        );

        vm.expectRevert(
            TwapOracleAlreadySet.selector
        );

        ORACLE_HUB_INSTANCE.addTwapOracle(
            USDC,
            USDC_ETH_UNI_POOL,
            USDC,
            WETH,
            UNI_FEE_USDC_WETH
        );
    }

    function testDerivativeTwap()
        public
    {
        _setupUSDC(false);

        vm.expectRevert(
            ChainLinkOracleNotSet.selector
        );

        ORACLE_HUB_INSTANCE.addTwapOracleDerivative(
            DAI,
            USDC,
            [
                USDC_ETH_UNI_POOL,
                USDC_DAI_UNI_POOL
            ],
            [
                USDC,
                DAI
            ],
            [
                WETH,
                USDC
            ],
            [
                UNI_FEE_USDC_WETH,
                UNI_FEE_DAI_USDC
            ]
        );

        ORACLE_HUB_INSTANCE.addOracle(
            DAI,
            IPriceFeed(DAI_ETH_FEED),
            new address[](0)
        );

        ORACLE_HUB_INSTANCE.recalibrate(
            DAI
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                PoolAddressMismatch.selector
            )
        );

        ORACLE_HUB_INSTANCE.addTwapOracleDerivative(
            DAI,
            USDC,
            [
                USDC_ETH_UNI_POOL,
                USDC_ETH_UNI_POOL
            ],
            [
                USDC,
                DAI
            ],
            [
                WETH,
                USDC
            ],
            [
                UNI_FEE_USDC_WETH,
                UNI_FEE_DAI_USDC
            ]
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                PoolDoesNotExist.selector
            )
        );

        ORACLE_HUB_INSTANCE.addTwapOracleDerivative(
            DAI,
            USDC,
            [
                USDC_ETH_UNI_POOL,
                USDC_DAI_UNI_POOL
            ],
            [
                USDC,
                DAI
            ],
            [
                WETH,
                USDC
            ],
            [
                FAKE_FEE_UNI,
                UNI_FEE_DAI_USDC
            ]
        );

        vm.expectRevert(
            abi.encodeWithSelector(
                PoolDoesNotExist.selector
            )
        );

        ORACLE_HUB_INSTANCE.addTwapOracleDerivative(
            DAI,
            USDC,
            [
                USDC_ETH_UNI_POOL,
                USDC_DAI_UNI_POOL
            ],
            [
                USDC,
                DAI
            ],
            [
                WETH,
                USDC
            ],
            [
                UNI_FEE_USDC_WETH,
                FAKE_FEE_UNI
            ]
        );

        ORACLE_HUB_INSTANCE.addTwapOracleDerivative(
            DAI,
            USDC,
            [
                USDC_ETH_UNI_POOL,
                USDC_DAI_UNI_POOL
            ],
            [
                USDC,
                DAI
            ],
            [
                WETH,
                USDC
            ],
            [
                UNI_FEE_USDC_WETH,
                UNI_FEE_DAI_USDC
            ]
        );

        uint256 responseDAITwapDerivative = ORACLE_HUB_INSTANCE.latestResolverTwap(
            DAI
        );

        uint256 responseDAIChainlink = ORACLE_HUB_INSTANCE.latestResolver(
            DAI
        );

        console.log("responseDAI: %s", responseDAITwapDerivative);
        console.log("responseDAIChainlink: %s", responseDAIChainlink);
    }

    function _setupUSDC(
        bool _useDeployed
    )
        internal
    {
        if (_useDeployed) {
            _useBlock(
                NEWEST_BLOCK
            );
            vm.startPrank(WISE_DEPLOYER);
        } else {
            _useBlock(
                NEW_BLOCK
            );
        }

        address WETH_ADDRESS = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
        address ETH_PRICE_FEED = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
        address UNISWAP_V3_FACTORY = 0x1F98431c8aD98523631AE4a59f267346ea31F984;

        if (_useDeployed) {
            ORACLE_HUB_INSTANCE = TesterWiseOracleHub(
                NEWEST_DEPLOYED_ORACLE_HUB
            );
        } else {
            ORACLE_HUB_INSTANCE = new TesterWiseOracleHub(
                WETH_ADDRESS,
                ETH_PRICE_FEED,
                UNISWAP_V3_FACTORY
            );

            ORACLE_HUB_INSTANCE.addOracle(
                USDC,
                IPriceFeed(USDC_ETH_FEED),
                new address[](0)
            );

            ORACLE_HUB_INSTANCE.recalibrate(
                USDC
            );


            ORACLE_HUB_INSTANCE.addTwapOracle(
                USDC,
                USDC_ETH_UNI_POOL,
                USDC,
                ORACLE_HUB_INSTANCE.WETH_ADDRESS(),
                UNI_FEE_USDC_WETH
            );
        }
    }

    function testNewest()
        public
    {
        /*   ORACLE_HUB_INSTANCE.addOracle(
            DAI,
            IPriceFeed(DAI_ETH_FEED),
            new address[](0)
        );

        ORACLE_HUB_INSTANCE.recalibrate(
            DAI
        );*/

        _setupUSDC(true);

        uint256 respiosne1 = ORACLE_HUB_INSTANCE.latestResolver(
            USDC
        );

        uint256 response2 = ORACLE_HUB_INSTANCE.latestResolverTwap(
            USDC
        );

        console.log("respiosne1: %s", respiosne1);
        console.log("response2: %s", response2);
    }
}
