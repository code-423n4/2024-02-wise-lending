// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../InterfaceHub/IPendle.sol";
import "../InterfaceHub/IOraclePendle.sol";
import "../InterfaceHub/IERC20.sol";
import "../WiseOracleHub/WiseOracleHub.sol";
import "../PositionNFTs.sol";
import "../WiseLending.sol";
import "../WiseSecurity/WiseSecurity.sol";

import "./PtOraclePure.sol";
import "forge-std/Test.sol";

contract PtOraclePureTest is Test {

    WiseLending public wiseLendingInstance;
    WiseSecurity public wiseSecurityInstance;

    address public wiseLendingAddr = 0x37e49bf3749513A02FA535F0CbC383796E8107E4;
    address public WISE_DEPLOYER = 0x641AD78BAca220C5BD28b51Ce8e0F495e85Fe689;
    address public positionNftAddr = 0x32E0A7F7C4b1A19594d25bD9b63EBA912b1a5f61;

    WiseOracleHub public oracleHubInstance;
    address public oracleHubAddr = 0xf8A8EAe0206D36B9ac87Eaa9A229047085aF0178;

    PtOraclePure public ptOraclePureInstance;
    IPendleMarket public pendleMarketInstance;
    IPriceFeed public assetFeedInstance;
    IOraclePendle public pendlePtOracleHubInstance;
    PositionNFTs public positionNftInstance;

    address public assetFeedAddress = 0x86392dC19c0b719886221c78AB11eb8Cf5c52812; // steth/eth eth main
    address public ptSteth = 0xb253Eff1104802b97aC7E3aC9FdD73AecE295a2c;
    address public pendlePtOracleEthMain = 0xbbd487268A295531d299c125F3e5f749884A3e30;
    address public pendleMarketAddress = 0x34280882267ffa6383B363E278B027Be083bBe3b; // steth expiration 2027
    address public stEth = 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84;
    address public ptStethWhale = 0x68bd61aeE5ac472468B8B5A191b9955a32DfA6ED;

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

        assetFeedInstance = IPriceFeed(
            assetFeedAddress
        );

        pendlePtOracleHubInstance = IOraclePendle(
            pendlePtOracleEthMain
        );

        positionNftInstance = PositionNFTs(
            positionNftAddr
        );

        ptOraclePureInstance = new PtOraclePure(
            {
                _pendleMarketAddress: pendleMarketAddress,
                _priceFeedChainLinkEth: assetFeedInstance,
                _oraclePendlePt: pendlePtOracleHubInstance,
                _oracleName: "test",
                _twapDuration: 1
            }
        );

        wiseSecurityInstance = WiseSecurity(
            address(wiseLendingInstance.WISE_SECURITY())
        );
    }

    function testAddPurePtWiseLending()
        public
    {
        _increaseObservationCardinality();

        vm.startPrank(WISE_DEPLOYER);

        address[] memory underlyingPtPure = new address[](1);
        underlyingPtPure[0] = stEth;

        vm.expectRevert(
            HeartBeatNotSet.selector
        );

        oracleHubInstance.chainLinkIsDead(
            ptSteth
        );

        oracleHubInstance.addOracle(
            stEth,
            IPriceFeed(assetFeedAddress),
            new address[](0)
        );

        oracleHubInstance.recalibrate(
            stEth
        );

        bool isDead = oracleHubInstance.chainLinkIsDead(
            stEth
        );

        assertEq(
            isDead,
            false,
            "isDead should be false"
        );

        oracleHubInstance.addOracle(
            ptSteth,
            IPriceFeed(address(ptOraclePureInstance)),
            underlyingPtPure
        );

        uint256 answerPtSteth = oracleHubInstance.latestResolver(
            ptSteth
        );

        uint256 answerSteth = oracleHubInstance.latestResolver(
            stEth
        );

        assertGt(
            answerSteth,
            answerPtSteth,
            "answerSteth should be greater than answerPtSteth"
        );

        uint256 poolMulFactor = 17_500_000_000_000_000;
        uint256 poolCollFactor = 805_000_000_000_000_000;
        uint256 maxDepositAmount = 180_000_000_000_000_000_000_000;

        PoolManager.CreatePool memory createPoolStruct = PoolManager.CreatePool(
            {
                allowBorrow: false,
                poolToken: ptSteth,
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
            ptStethWhale
        );

        IERC20(ptSteth).approve(
            wiseLendingAddr,
            type(uint256).max
        );

        uint256 depositAmount = 10 ether;

        uint256 nftId = positionNftInstance.getNextExpectedId();

        wiseLendingInstance.depositExactAmountMint(
            ptSteth,
            depositAmount
        );

        uint256 borrowAmount = 7 ether;

        uint256 amount = oracleHubInstance.getTokensInETH(
            ptSteth,
            depositAmount
        );

        assertGt(
            amount,
            0,
            "amount should be greater than 0"
        );

        uint256 safeLimit = wiseSecurityInstance.safeLimitPosition(
            nftId
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

        ptOraclePureInstance.latestAnswer();
        _increaseObservationCardinality();

        console.log(
            ptOraclePureInstance.latestAnswer(),
            "latestanswer in ETH"
        );

        uint256 latestAnswer = ptOraclePureInstance.latestAnswer();
        uint256 ethValueOfSteth = assetFeedInstance.latestAnswer()
            * 10 ** 18
            / 10 ** (assetFeedInstance.decimals());

        console.log(
            ethValueOfSteth,
            "ethValueOfSteth"
        );

        assertGt(
            ethValueOfSteth,
            latestAnswer,
            "ethValueOfSteth should be greater than latestAnswer"
        );

        assertGt(
            latestAnswer
            * 12
            / 10,
            ethValueOfSteth,
            "latestAnswer should be greater than ethValueOfSteth"
        );
    }

    function _increaseObservationCardinality()
        internal
    {
        pendleMarketInstance.increaseObservationsCardinalityNext(
            100
        );
    }
}
