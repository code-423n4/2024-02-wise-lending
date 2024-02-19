// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "../../InterfaceHub/IPendle.sol";
import "../../InterfaceHub/IOraclePendle.sol";
import "../../InterfaceHub/IERC20.sol";
import "forge-std/Test.sol";

//forge test --match-test testOracleSlot -vv --fork-url https://mainnet.infura.io/v3/121c74e81cc249fb82a35814aeae26d7

contract OracleSlotTest is Test {

    IOraclePendle public oraclePendleInstance;
    IPendleSy public pendleSyInstanceCrvUsd;
    IPendleYt public pendleYtInstanceCrvUsd;
    IPendleRouterStatic public routerstaticInstance;
    IERC20 public crvUsdInstance;
    IERC20 public crvUsdPtInstance;
    IERC20 public crvUsdSyInstance;
    IPendleMarket public crvUsdMarketInstance;

    address crvUsdPtWhale = 0x577eBC5De943e35cdf9ECb5BbE1f7D7CB6c7C647;
    address crvUsdWhale = 0xA920De414eA4Ab66b97dA1bFE9e6EcA7d4219635;
    address pendlePtOracleEthMain = 0xbbd487268A295531d299c125F3e5f749884A3e30;
    address crvUsdMarket = 0xC9beCdbC62efb867cB52222b34c187fB170379C6;
    address crvUsdPt = 0xB87511364014C088e30f872EfC4a00D7efB843AC;
    address crvUsdAddresse = 0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E;
    address crvUsdSy = 0xE05082B184a34668CD8A904D85FA815802BBb04c;
    address crvUsdYtAddress = 0xED97f94dd94255637A054098604E0201C442a3FD;
    address rotuerStaticAddress = 0x263833d47eA3fA4a30f269323aba6a107f9eB14C;

    uint256 BLOCK_TO_USE = 18711974;

    function setUp()
        public
    {
        vm.rollFork(
            BLOCK_TO_USE
        );

        oraclePendleInstance = IOraclePendle(
            pendlePtOracleEthMain
        );

        pendleSyInstanceCrvUsd = IPendleSy(
            crvUsdSy
        );

        pendleYtInstanceCrvUsd = IPendleYt(
            crvUsdYtAddress
        );

        routerstaticInstance = IPendleRouterStatic(
            rotuerStaticAddress
        );

        crvUsdInstance = IERC20(
            crvUsdAddresse
        );

        crvUsdMarketInstance = IPendleMarket(
            crvUsdMarket
        );

        crvUsdPtInstance = IERC20(
            crvUsdPt
        );

        crvUsdSyInstance = IERC20(
            crvUsdSy
        );
    }

    function testOracleSlot()
        public
    {
        uint256 cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 1
            }
        );

        console.log("pt to AssetRatio: ", cashPrice);

        (
            bool increaseCardinalityRequired,
            uint16 cardinalityRequired,
            bool oldestObservationSatisfied
        ) =
            oraclePendleInstance.getOracleState(
                {
                    market: crvUsdMarket,
                    duration: 30
                }
            );

        assertGt(
            cardinalityRequired,
            1
        );

        assertEq(
            increaseCardinalityRequired,
            true
        );

        MarketStorage memory marketStorage = crvUsdMarketInstance._storage();

        crvUsdMarketInstance.increaseObservationsCardinalityNext(
            cardinalityRequired
        );

        marketStorage = crvUsdMarketInstance._storage();

        assertEq(
            marketStorage.observationCardinalityNext,
            cardinalityRequired
        );

        (
            increaseCardinalityRequired,
            cardinalityRequired,
            oldestObservationSatisfied
        ) =
            oraclePendleInstance.getOracleState(
                {
                    market: crvUsdMarket,
                    duration: 30
                }
            );

        assertEq(
            increaseCardinalityRequired,
            false
        );

        assertEq(
            oldestObservationSatisfied,
            true
        );

        vm.startPrank(
            crvUsdWhale
        );

        uint256 currentCrvUsdBal = crvUsdInstance.balanceOf(
            crvUsdWhale
        );

        crvUsdInstance.approve(
            address(pendleSyInstanceCrvUsd),
            currentCrvUsdBal
        );

        pendleSyInstanceCrvUsd.deposit(
            crvUsdPtWhale,
            crvUsdAddresse,
            currentCrvUsdBal,
            0
        );

        vm.stopPrank();

        vm.startPrank(
            crvUsdPtWhale
        );

        crvUsdSyInstance.transfer(
            crvUsdYtAddress,
            crvUsdSyInstance.balanceOf(
                crvUsdPtWhale
            )
        );

        pendleYtInstanceCrvUsd.mintPY(
            crvUsdPtWhale,
            crvUsdPtWhale
        );

        uint256 totalBalanceWhale = crvUsdPtInstance.balanceOf(
            crvUsdPtWhale
        );

        crvUsdPtInstance.transfer(
            crvUsdMarket,
            totalBalanceWhale
        );

        _makeNewObservationSwapLoop(
            {
                _numOfSwaps: 10,
                _blockAddition: 1
            }
        );

        (
            increaseCardinalityRequired,
            cardinalityRequired,
            oldestObservationSatisfied
        ) =
            oraclePendleInstance.getOracleState(
                {
                    market: crvUsdMarket,
                    duration: 30
                }
            );

        assertEq(
            oldestObservationSatisfied,
            false
        );

        _makeNewObservationSwapLoop(
            {
                _numOfSwaps: 10,
                _blockAddition: 13
            }
        );

        marketStorage = crvUsdMarketInstance._storage();

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 1
            }
        );

        console.log("cashPrice duration 1 ", cashPrice);

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 10
            }
        );

        console.log("cashPrice duration 10 ", cashPrice);

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 30
            }
        );

        console.log("cashPrice duration 30 ", cashPrice);

        uint256[] memory denominators = new uint256[](4);
        denominators[0] = 57;
        denominators[1] = 1030;
        denominators[2] = 26027;
        denominators[3] = 666000;

        for (uint256 i = 0; i < denominators.length; i++) {
            _changePriceThroughSwap(
                totalBalanceWhale,
                denominators[i]
            );
        }

        assertGt(
            1000 * crvUsdSyInstance.balanceOf(
                crvUsdMarket
            ),
            crvUsdPtInstance.balanceOf(
                crvUsdMarket
            )
        );

        (
            ,
            ,
            ,
            uint256 exchangeRateAfter
        ) = routerstaticInstance.swapExactPtForSyStatic(
            crvUsdMarket,
            1 ether
        );

        console.log(exchangeRateAfter,"exchangeRateAfter");

        assertGt(
            exchangeRateAfter,
            0.9 ether
        );

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 1
            }
        );

        console.log("cashPrice after change: duration 1 ", cashPrice);

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 10
            }
        );

        console.log("cashPrice after change: duration 10 ", cashPrice);

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 30
            }
        );

        console.log("cashPrice after change: duration 30 ", cashPrice);

        vm.warp(
            block.timestamp
                + 6000
        );

        vm.roll(
            block.number
                + 1
        );

       _makeNewObservationSwapLoop(
            {
                _numOfSwaps: 2,
                _blockAddition: 1
            }
        );

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 6003
            }
        );

        console.log("cashPrice after change: should be lower", cashPrice);

        _makeNewObservationSwapLoop(
            {
                _numOfSwaps: 1,
                _blockAddition: 60
            }
        );

        cashPrice = oraclePendleInstance.getPtToAssetRate(
            {
                market: crvUsdMarket,
                duration: 30
            }
        );

        console.log("cashPrice after change: should be even lower", cashPrice);
    }

    function _makeNewObservationSwapLoop(
        uint256 _numOfSwaps,
        uint256 _blockAddition
    )
        internal
    {
        for (uint256 i = 0; i < _numOfSwaps; i++) {
            _makeNewObservationSwap(
                _blockAddition
            );
        }
    }

    function _makeNewObservationSwap(
        uint256 _blockAddition
    )
        internal
    {
        crvUsdMarketInstance.swapExactPtForSy(
            {
                receiver: crvUsdPtWhale,
                exactPtIn: 100_000_000,
                data: new bytes(0)
            }
        );

        vm.warp(
            block.timestamp
                + _blockAddition
        );

        vm.roll(
            block.number
                + 1
        );
    }

    function _changePriceThroughSwap(
        uint256 _totalBal,
        uint256 _denominator
    )
        internal
    {
        crvUsdMarketInstance.swapExactPtForSy(
            {
                receiver: crvUsdPtWhale,
                exactPtIn: _totalBal
                    / _denominator,
                data: new bytes(0)
            }
        );
    }
}