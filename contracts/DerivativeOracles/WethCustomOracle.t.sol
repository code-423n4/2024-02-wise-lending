// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "forge-std/Test.sol";
import "../WiseLending.sol";
import "../WiseOracleHub/WiseOracleHub.sol";
import "../TesterChainlink.sol";

struct CreatePool {
    bool allowBorrow;
    address poolToken;
    uint256 poolMulFactor;
    uint256 poolCollFactor;
    uint256 maxDepositAmount;
}

contract WethCustomOracleTest is Test {

    WiseOracleHub public oracleHubInstance;
    WiseLending public wiseLendingInstance;
    TesterChainlink public testerChainlinkInstance;

    address wiseLendingAddr = 0x37e49bf3749513A02FA535F0CbC383796E8107E4;
    address WISE_DEPLOYER = 0x641AD78BAca220C5BD28b51Ce8e0F495e85Fe689;
    address WISE_ORACLE = 0xf8A8EAe0206D36B9ac87Eaa9A229047085aF0178;
    address WETH_FEED = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;


    address WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;

    address ST_ETH_FEED = 0x86392dC19c0b719886221c78AB11eb8Cf5c52812;
    address USDT_ETH_FEED = 0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46;
    address WST_ETH_FEED = 0x9aB8A49677a20fc0cC694479DF4462a82B4Cc1C4;
    address WST_ETH = 0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0;

    address wethcustom = 0x7DBA84a0454289f8aB534d4c083D72e0C14a0F66;
    uint256 depositValue = 0.2 ether;
    uint256 blockNumber = 18727538;

    function setUp()
        public
    {
        vm.rollFork(
            blockNumber
        );

        wiseLendingInstance = WiseLending(
            payable(wiseLendingAddr)
        );

        oracleHubInstance = WiseOracleHub(
            WISE_ORACLE
        );

        testerChainlinkInstance = TesterChainlink(
            wethcustom
        );
    }

    function testWstEth()
        public
    {
        vm.startPrank(
            WISE_DEPLOYER
        );

        IERC20(WST_ETH).approve(
            wiseLendingAddr,
            depositValue
        );

        vm.expectRevert();

        wiseLendingInstance.depositExactAmountMint(
            WST_ETH,
            depositValue
        );

        oracleHubInstance.addOracle(
            WST_ETH,
            IPriceFeed(WST_ETH_FEED),
            new address[](0)
        );

        uint256 preview = oracleHubInstance.recalibratePreview(
            WST_ETH
        );

        console.log("preview: %s", preview);

        oracleHubInstance.recalibrate(
            WST_ETH
        );

        wiseLendingInstance.createPool(
            PoolManager.CreatePool(
                true,
                WST_ETH,
                17500000000000000,
                805000000000000000,
                600000000000000000000000
            )
        );

        wiseLendingInstance.depositExactAmountMint(
            WST_ETH,
            depositValue
        );

        uint256 latestResolver = oracleHubInstance.latestResolver(
            WST_ETH
        );

        uint256 expectedValue = 1.1 ether;
        console.log(latestResolver, 'latest resolved latestResolver');

        assertGt(
            latestResolver,
            expectedValue
        );

        uint256 getTokensInETH = oracleHubInstance.getTokensInETH(
            WST_ETH,
            depositValue
        );

        // console.log(getTokensInETH, 'getTokensInETH');
        // console.log(depositValue, 'depositValue');

        assertGt(
            getTokensInETH,
            depositValue
        );
    }

    /*
    function testQuick()
        public
    {
        vm.expectRevert();

        wiseLendingInstance.depositExactAmountETHMint{
            value: depositValue
        }();

        vm.startPrank(WISE_DEPLOYER);

        oracleHubInstance.addOracle(
            WETH,
            IPriceFeed(address(testerChainlinkInstance)),
            new address[](0)
        );

        uint256 preview = oracleHubInstance.recalibratePreview(
            WETH
        );

        console.log("preview: %s", preview);

        oracleHubInstance.recalibrate(
            WETH
        );

        wiseLendingInstance.depositExactAmountETHMint{
            value: depositValue
        }();

        uint256 value = oracleHubInstance.latestResolver(
            WETH
        );

        uint256 expectedValue = 1 ether;

        assertEq(
            value,
            expectedValue
        );

        vm.roll(block.number + 10000);
        vm.warp(block.timestamp + 100000);

        wiseLendingInstance.depositExactAmountETHMint{
            value: depositValue
        }();

        uint256 gettokensineth = oracleHubInstance.getTokensInETH(
            WETH,
            depositValue
        );

        assertEq(
            gettokensineth,
            depositValue
        );
    }
    */
}