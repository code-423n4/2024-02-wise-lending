// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../InterfaceHub/IPendle.sol";
import "../InterfaceHub/IOraclePendle.sol";
import "../InterfaceHub/IERC20.sol";
import "../WiseOracleHub/WiseOracleHub.sol";
import "../WiseLending.sol";
import "../PositionNFTs.sol";
import "../WiseSecurity/WiseSecurity.sol";

import "./PtOracleDerivative.sol";
import "./CurveUsdEthOracle.sol";

import "forge-std/Test.sol";

contract PtOracleDerivativeTest is Test {

    WiseLending public wiseLendingInstance;
    address public wiseLendingAddr = 0x37e49bf3749513A02FA535F0CbC383796E8107E4;
    WiseSecurity public wiseSecurityInstance;

    WiseOracleHub public oracleHubInstance;
    address public oracleHubAddr = 0xf8A8EAe0206D36B9ac87Eaa9A229047085aF0178;

    PtOracleDerivative public ptOracleDerivativeInstance;
    IPendleMarket public pendleMarketInstance;
    IPriceFeed public crvUsdFeedUsdInstance;
    IPriceFeed public ethUsdFeedInstance;
    IOraclePendle public ptOracleDerivInstanceOraclePendle;
    CurveUsdEthOracle public curveUsdEthOracleInstance;
    PositionNFTs public positionNftInstance;

    address public crvUsdFeedUsd = 0xEEf0C605546958c1f899b6fB336C20671f9cD49F;
    address public ethUsdFeed = 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419;
    address public pendlePtOracleEthMain = 0xbbd487268A295531d299c125F3e5f749884A3e30;
    address public pendleMarketAddress = 0xC9beCdbC62efb867cB52222b34c187fB170379C6;
    address public crvUsdAddress = 0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E;
    address public curveUsdPtAddress = 0xB87511364014C088e30f872EfC4a00D7efB843AC;
    address public crvPtWhale = 0x577eBC5De943e35cdf9ECb5BbE1f7D7CB6c7C647;
    address public WISE_DEPLOYER = 0x641AD78BAca220C5BD28b51Ce8e0F495e85Fe689;
    address public positionNftAddr = 0x32E0A7F7C4b1A19594d25bD9b63EBA912b1a5f61;

    uint256 public USE_BLOCK = 18726988;

    function setUp()
        public
    {
        vm.rollFork(
            USE_BLOCK
        );

        wiseLendingInstance = WiseLending(
            payable(wiseLendingAddr)
        );

        oracleHubInstance = WiseOracleHub(
            oracleHubAddr
        );

        pendleMarketInstance = IPendleMarket(
            pendleMarketAddress
        );

        crvUsdFeedUsdInstance = IPriceFeed(
            crvUsdFeedUsd
        );

        ethUsdFeedInstance = IPriceFeed(
            ethUsdFeed
        );

        ptOracleDerivInstanceOraclePendle = IOraclePendle(
            pendlePtOracleEthMain
        );

        ptOracleDerivativeInstance = new PtOracleDerivative(
            {
                _pendleMarketAddress: pendleMarketAddress,
                _priceFeedChainLinkUsd: crvUsdFeedUsdInstance,
                _priceFeedChainLinkEthUsd: ethUsdFeedInstance,
                _oraclePendlePt: ptOracleDerivInstanceOraclePendle,
                _oracleName: "test",
                _twapDuration: 1
            }
        );

        curveUsdEthOracleInstance = new CurveUsdEthOracle(
            ethUsdFeedInstance,
            crvUsdFeedUsdInstance
        );

        uint256 t = curveUsdEthOracleInstance.latestAnswer();

        console.log(t, 't------');

        wiseSecurityInstance = WiseSecurity(
            address(wiseLendingInstance.WISE_SECURITY())
        );

        positionNftInstance = PositionNFTs(
            positionNftAddr
        );
    }

    function _increaseObservationCardinality()
        internal
    {
        pendleMarketInstance.increaseObservationsCardinalityNext(
            100
        );
    }

    function testAddDerivativePtWiseLending()
        public
    {
        _increaseObservationCardinality();

        vm.startPrank(
            WISE_DEPLOYER
        );

        address[] memory underlyingPtPure = new address[](1);
        underlyingPtPure[0] = crvUsdAddress;

        vm.expectRevert(
            HeartBeatNotSet.selector
        );

        oracleHubInstance.chainLinkIsDead(
            crvUsdAddress
        );

        oracleHubInstance.addOracle(
            crvUsdAddress,
            IPriceFeed(address(curveUsdEthOracleInstance)),
            new address[](0)
        );

        oracleHubInstance.recalibrate(
            crvUsdAddress
        );

        bool isDead = oracleHubInstance.chainLinkIsDead(
            crvUsdAddress
        );

        assertEq(
            isDead,
            false,
            "isDead should be false"
        );

        oracleHubInstance.addOracle(
            curveUsdPtAddress,
            IPriceFeed(address(ptOracleDerivativeInstance)),
            underlyingPtPure
        );

        uint256 answerPt = oracleHubInstance.latestResolver(
            curveUsdPtAddress
        );

        uint256 answer = oracleHubInstance.latestResolver(
            crvUsdAddress
        );

        assertGt(
            answer,
            answerPt,
            "answer should be greater than answerPt"
        );

        console.log(answer, "answer crvUsd in eth");
        console.log(answerPt, "answer ptCrvUsd in eth");
        console.log(IPriceFeed(ethUsdFeed).latestAnswer(), "answer eth in usd");

        uint256 poolMulFactor = 25_000_000_000_000_000;
        uint256 poolCollFactor = 670_000_000_000_000_000;
        uint256 maxDepositAmount = 180_000_000_000_000_000_000_000_000;

        PoolManager.CreatePool memory createPoolStruct = PoolManager.CreatePool(
            {
                allowBorrow: false,
                poolToken: curveUsdPtAddress,
                poolMulFactor: poolMulFactor,
                poolCollFactor: poolCollFactor,
                maxDepositAmount: maxDepositAmount
            }
        );

        wiseLendingInstance.createPool(
            createPoolStruct
        );

        vm.stopPrank();

        wiseLendingInstance.depositExactAmountETHMint{
            value: 10 ether
        }();

        vm.startPrank(
            crvPtWhale
        );

        IERC20(curveUsdPtAddress).approve(
            wiseLendingAddr,
            type(uint256).max
        );

        uint256 depositAmount = 14_000 ether;
        uint256 nftId = positionNftInstance.getNextExpectedId();

        wiseLendingInstance.depositExactAmountMint(
            curveUsdPtAddress,
            depositAmount
        );

        uint256 borrowAmount = 7 ether;

        uint256 amount = oracleHubInstance.getTokensInETH(
            curveUsdPtAddress,
            depositAmount
        );

        console.log(
            amount,
            "amount in eth for ptCrvUsd 14_000 units"
        );

        assertGt(
            amount,
            0,
            "amount should be greater than 0"
        );

        uint256 safeLimit = wiseSecurityInstance.safeLimitPosition(
            nftId
        );

        console.log(
            safeLimit,
            "safeLimit"
        );

        assertGt(
            borrowAmount,
            safeLimit,
            "borrowAmount should be greater than safeLimit"
        );

        vm.expectRevert(
            NotEnoughCollateral.selector
        );

        wiseLendingInstance.borrowExactAmountETH(
            nftId,
            safeLimit + 1
        );

        wiseLendingInstance.borrowExactAmountETH(
            nftId,
            safeLimit
        );
    }

    function testPtOracleDerivative()
        public
    {
        vm.expectRevert(
            CardinalityNotSatisfied.selector
        );

        ptOracleDerivativeInstance.latestAnswer();

        pendleMarketInstance.increaseObservationsCardinalityNext(
            100
        );

        console.log(
            ptOracleDerivativeInstance.latestAnswer(),
            "latestanswer in eth"
        );

        uint256 latestAnswer = ptOracleDerivativeInstance.latestAnswer();

        uint256 ethValueOfCrvUsd = crvUsdFeedUsdInstance.latestAnswer()
            * 10 ** 18
            / 10 ** (crvUsdFeedUsdInstance.decimals())
            * 10 ** (ethUsdFeedInstance.decimals())
            / ethUsdFeedInstance.latestAnswer();

        console.log(ethValueOfCrvUsd,"ethValueOfCrvUsd");

        assertGt(
            ethValueOfCrvUsd,
            latestAnswer,
            "ethValueOfCrvUsd should be greater than latestAnswer"
        );

        assertGt(
            latestAnswer
            * 12
            / 10,
            ethValueOfCrvUsd,
            "latestAnswer should be greater than ethValueOfCrvUsd"
        );
    }
}
