// SPDX-License-Identifier: -- WISE --

pragma solidity =0.8.24;

import "forge-std/Test.sol";

import "./PendlePowerFarmControllerTester.sol";

import "./../../PowerFarms/PowerFarmNFTs/PowerFarmNFTs.sol";
import "./../../PowerFarms/PendlePowerFarm/PendlePowerManager.sol";
import "./../../PowerFarms/PendlePowerFarmController/PendlePowerFarmToken.sol";
import "./../../PowerFarms/PendlePowerFarmController/PendlePowerFarmTokenFactory.sol";

import "./../../TestInterfaces/ICustomOracle.sol";
import "./../../InterfaceHub/IWiseLending.sol";
import "./../../InterfaceHub/IWETH.sol";
import "./../../InterfaceHub/IPositionNFTs.sol";
import "./../../InterfaceHub/IWiseSecurity.sol";
import "./../../InterfaceHub/IAaveHub.sol";

import "./../../DerivativeOracles/PendleTokenCustomOracle.sol";
import "./../../DerivativeOracles/PendleLpOracle.sol";
import "./../../DerivativeOracles/PendleChildLpOracle.sol";
import "./../../DerivativeOracles/CurveUsdEthOracle.sol";

import "./../../WiseOracleHub/WiseOracleHub.sol";
import "./../../WiseLending.sol";

import "./ContractLibrary.sol";

contract PendlePowerFarmControllerBaseTest is Test, ContractLibrary {

    PendleControllerTester public controllerTester;
    WiseLending public wiseLendingInstance;
    WiseOracleHub public wiseOracleHubInstance;
    PendleTokenCustomOracle public pendleTokenOracleInstance;
    PendleLpOracle public pendleLpOracleInstance;
    IPendleLock public pendleLockInstance;
    PendleChildLpOracle public pendleChildLpOracleInstance;
    CurveUsdEthOracle public curveUsdEthOracleInstance;
    PendlePowerManager public powerFarmManagerInstance;
    PowerFarmNFTs public powerFarmNftsInstance;
    IWETH public wethInstance;
    IWiseSecurity public wiseSecurityInstance;
    IPositionNFTs public positionNftsInstance;
    IAaveHub public aaveHubInstance;
    PendlePowerFarmTokenFactory public pendlePowerFarmTokenFactory;

    uint256 chainId;

    struct TokenData {
        IERC20 tokenReceived;
        IPendlePowerFarmToken derivativeToken;
        uint256 reservedForCompound;
        uint256 cashBalControllerBefore;
        uint256 cashBalUserBefore;
        uint256 balanceLpsBefore;
        uint256 tokensSentAmount;
    }

    struct BalanceData {
        uint256 cashBalControllerBefore;
        uint256 cashBalUserBefore;
        uint256 cashBalControllerAfter;
        uint256 cashBalUserAfter;
        uint256 difference;
        uint256 valueSent;
    }

    struct Addresses {
        address wiseSecurity;
        address wiseLending;
        address aaveHub;
        address aave;
        address nft;
        address oracleHub;
        address weth;
        address aweth;
        address wstEth;
        address stEth;
        address dex;
        address pendleTokenAddress;
        address PendleMarketStEth;
        address entryAssetPendleMarketStEth;
        address PendleMarketStEthSy;
        address vePendle;
        address voterContract;
        address voterRewardsClaimer;
        address pendleLock;
        address pendleRouterStatic;
        address pendleRouter;
        address pendlePtOracle;
    }

    struct UniPoolProperties {
        address token0;
        address token1;
        address poolAddress;
        address factory;
        uint24 fee;
        uint8 decimals;
    }

    mapping (uint256 => Addresses) AddressesMap;
    mapping (uint256 => UniPoolProperties) UniPoolPropertiesMap;

    uint256 NEWEST_BLOCK = 18934553;
    uint32 duration = 1; // FOR MAINNET USE 30 MIN !
    address ZERO_ADDRESS = address(0);
    address randomUser = 0xF13c89b0fBe2e8bfCd54F068568DAF6518D0Bb7E;
    uint256 exitSpread = 1.002 ether;
    uint256 entrySpread = 1.005 ether;
    uint256 constant ARB_BLOCK = 173637332;

    uint256 ARB_CHAIN_ID = 42161;
    uint256 ETH_CHAIN_ID = 1;

    function setUp()
        public
    {

    }

    function _setProperties()
        internal
    {
        chainId = block.chainid;
        if (chainId == 1) {
            wiseLendingInstance = WiseLending(
                payable(WISE_LENDING)
            );

            AddressesMap[chainId] = Addresses(
                address(wiseLendingInstance.WISE_SECURITY()),
                WISE_LENDING,
                AAVE_HUB,
                IAaveHub(AAVE_HUB).AAVE_ADDRESS(),
                address(wiseLendingInstance.POSITION_NFT()),
                WISE_ORACLE_HUB,
                wiseLendingInstance.WETH_ADDRESS(),
                AWETH,
                address(0),
                address(0),
                CURVE_POOL_STETH_ETH,
                PENDLE_TOKEN,
                ST_ETH_PENDLE_25DEC_2025,
                WETH,
                PENDLE_SY_ST_ETH_PENDLE_25DEC_2025,
                VE_PENDLE_CONTRACT,
                VOTER_CONTRACT,
                VOTER_REWARDS_CLAIMER_ADDRESS,
                PENDLE_LOCK,
                PENDLE_ROUTER_STATIC,
                PENDLE_ROUTER_ADDRESS,
                PENDLE_PT_ORACLE
            );

            UniPoolPropertiesMap[chainId] = UniPoolProperties(
                PENDLE_UNI_POOL_TOKEN0_ADDRESS,
                PENDLE_UNI_POOL_TOKEN1_ADDRESS,
                PENDLE_UNI_POOL_ADDRESS,
                UNI_V3_FACTORY,
                UNI_V3_FEE_PENDLE_UNI_POOL,
                DECIMALS_PENDLE_CUSTOM_ORACLE
            );
        }

        if (chainId == 42161) {
            wiseLendingInstance = WiseLending(
                payable(ARB_WISE_LENDING_ADD)
            );

            AddressesMap[chainId] = Addresses(
                address(wiseLendingInstance.WISE_SECURITY()),
                ARB_WISE_LENDING_ADD,
                ARB_AAVE_HUB_ADD,
                IAaveHub(ARB_AAVE_HUB_ADD).AAVE_ADDRESS(),
                address(wiseLendingInstance.POSITION_NFT()),
                ARB_WISE_ORACLE_ADD,
                wiseLendingInstance.WETH_ADDRESS(),
                ARB_AWETH,
                ARB_WSTETH,
                address(0),
                ARB_UNISWAP_V3_ROUTER,
                ARB_PENDLE,
                ARB_MARKET,
                ARB_WSTETH,
                ARB_MARKET_SY,
                address(0),
                address(0),
                address(0),
                address(0),
                ARB_ROUTER_STATIC,
                ARB_ROUTER,
                ARB_PT_ORACLE
            );

            UniPoolPropertiesMap[chainId] = UniPoolProperties(
                ARB_PENDLE_UNI_POOL_TOKEN0_ADDRESS,
                ARB_PENDLE_UNI_POOL_TOKEN1_ADDRESS,
                ARB_PENDLE_UNI_POOL_ADDRESS,
                ARB_UNI_V3_FACTORY,
                ARB_UNI_V3_FEE_PENDLE_UNI_POOL,
                ARB_DECIMALS_PENDLE_CUSTOM_ORACLE
            );
        }
    }

    modifier normalSetup(
        bool _isEthMain
    )
    {
        _decideChain(
            _isEthMain
        );
        _setUp(
            false
        );
        _;
    }

    modifier cheatSetup(
        bool _isEthMain
    )
    {
        _decideChain(
            _isEthMain
        );
        _setUp(
            true
        );
        _;
    }

    function _decideChain(
        bool _isEthMain
    )
        internal
    {
        if (_isEthMain == true) {
            _useEthOld();
        } else {
            _useArb();
        }
    }

    function _useArb()
        internal
    {
        vm.createSelectFork(
            vm.rpcUrl("arbitrum")
        );

        vm.rollFork(
            ARB_BLOCK
        );
    }

    function _useEthOld()
        internal
    {
        vm.createSelectFork(
            vm.rpcUrl("mainnet")
        );

        vm.rollFork(
            NEWEST_BLOCK
        );
    }

    function _setUp(
        bool _heartBeatCheat
    )
        private
    {
        _setProperties();

        pendleLockInstance = IPendleLock(
            AddressesMap[chainId].pendleLock
        );

        wethInstance = IWETH(
            AddressesMap[chainId].weth
        );

        wiseOracleHubInstance = WiseOracleHub(
            AddressesMap[chainId].oracleHub
        );

        aaveHubInstance = IAaveHub(
            AddressesMap[chainId].aaveHub
        );

        vm.startPrank(
            wiseLendingInstance.master()
        );

        controllerTester = new PendleControllerTester(
            AddressesMap[chainId].vePendle,
            AddressesMap[chainId].pendleTokenAddress,
            AddressesMap[chainId].voterContract,
            AddressesMap[chainId].voterRewardsClaimer,
            AddressesMap[chainId].oracleHub
        );

        pendlePowerFarmTokenFactory = controllerTester.PENDLE_POWER_FARM_TOKEN_FACTORY();

        PoolManager.CreatePool memory params = PoolManager.CreatePool(
            {
                allowBorrow: true,
                poolToken: AddressesMap[chainId].aweth,
                poolMulFactor: 17500000000000000,
                poolCollFactor: 805000000000000000,
                maxDepositAmount: 1800000000000000000000000
            }
        );

        wiseLendingInstance.createPool(
            params
        );

        IAaveHub(AddressesMap[chainId].aaveHub).setAaveTokenAddress(
            AddressesMap[chainId].weth,
            AddressesMap[chainId].aweth
        );

        if (block.chainid == ETH_CHAIN_ID) {
            wiseOracleHubInstance.addOracle(
                AddressesMap[chainId].aweth,
                wiseOracleHubInstance.priceFeed(AddressesMap[chainId].weth),
                new address[](0)
            );

            wiseOracleHubInstance.recalibrate(
                AddressesMap[chainId].aweth
            );
        }

        if (block.chainid == ARB_CHAIN_ID) {
            params = PoolManager.CreatePool(
                {
                    allowBorrow: true,
                    poolToken: AddressesMap[chainId].weth,
                    poolMulFactor: 17500000000000000,
                    poolCollFactor: 805000000000000000,
                    maxDepositAmount: 1800000000000000000000000
                }
            );

            wiseLendingInstance.createPool(
                params
            );

            params = PoolManager.CreatePool(
                {
                    allowBorrow: true,
                    poolToken: AddressesMap[chainId].wstEth,
                    poolMulFactor: 17500000000000000,
                    poolCollFactor: 805000000000000000,
                    maxDepositAmount: 1800000000000000000000000
                }
            );

            wiseLendingInstance.createPool(
                params
            );

            address wstethOracleArb = 0xb523AE262D20A936BC152e6023996e46FDC2A95D;

            wiseOracleHubInstance.addOracle(
                AddressesMap[chainId].wstEth,
                IPriceFeed(wstethOracleArb),
                new address[](0)
            );

            address wethOracleArb = 0x30009467FB70291Ce58d144718717E8fc9C0b3a8;

            wiseOracleHubInstance.addOracle(
                AddressesMap[chainId].weth,
                IPriceFeed(wethOracleArb),
                new address[](0)
            );

            address awethOracleArb = 0x30009467FB70291Ce58d144718717E8fc9C0b3a8;

            wiseOracleHubInstance.addOracle(
                AddressesMap[chainId].aweth,
                IPriceFeed(awethOracleArb),
                new address[](0)
            );

            address[] memory tokenAddresses = new address[](3);

            tokenAddresses[0] = AddressesMap[chainId].weth;
            tokenAddresses[1] = AddressesMap[chainId].aweth;
            tokenAddresses[2] = AddressesMap[chainId].wstEth;

            wiseOracleHubInstance.recalibrateBulk(
                tokenAddresses
            );

            deal(
                address(1),
                4000000001 ether
            );

            vm.startPrank(
                address(1)
            );

            wiseLendingInstance.depositExactAmountETH{
                value: 100 ether
            }(0);

            aaveHubInstance.depositExactAmountETH{
                value: 100 ether
            }(0);

            vm.stopPrank();
            vm.startPrank(
                wiseLendingInstance.master()
            );
        }

        _addPendleTokenOracle();

        _addPendleMarketOracle(
            AddressesMap[chainId].PendleMarketStEth,
            address(wiseOracleHubInstance.priceFeed(AddressesMap[chainId].weth)),
            AddressesMap[chainId].weth,
            2 ether,
            3 ether
        );

        IPendlePowerFarmToken derivativeToken = _addPendleMarket(
            AddressesMap[chainId].PendleMarketStEth,
            "name",
            "symbol",
            MAX_CARDINALITY
        );

        pendleChildLpOracleInstance = new PendleChildLpOracle(
            address(pendleLpOracleInstance),
            address(derivativeToken)
        );

        address[] memory underlyingTokens = new address[](1);
        underlyingTokens[0] = AddressesMap[chainId].weth;

        wiseOracleHubInstance.addOracle(
            address(derivativeToken),
            IPriceFeed(address(pendleChildLpOracleInstance)),
            underlyingTokens
        );

        address[] memory underlyingTokensCurrent = _heartBeatCheat == true
            ? new address[](1)
            : new address[](0);

        if (_heartBeatCheat == true) {
            underlyingTokensCurrent[0] = AddressesMap[chainId].weth;
        }

        if (block.chainid == ETH_CHAIN_ID) {

            wiseOracleHubInstance.addOracle(
                CRV_TOKEN_ADDRESS,
                IPriceFeed(CRV_ETH_FEED),
                underlyingTokensCurrent
            );

            if (_heartBeatCheat == false) {
                wiseOracleHubInstance.recalibrate(
                    CRV_TOKEN_ADDRESS
                );
            }

            curveUsdEthOracleInstance = new CurveUsdEthOracle(
                IPriceFeed(ETH_USD_FEED),
                IPriceFeed(CRVUSD_USD_FEED)
            );

            wiseOracleHubInstance.addOracle(
                CRVUSD_TOKEN_ADDRESS,
                IPriceFeed(address(curveUsdEthOracleInstance)),
                new address[](0)
            );

            wiseOracleHubInstance.recalibrate(
                CRVUSD_TOKEN_ADDRESS
            );

            wiseOracleHubInstance.addTwapOracle(
                CRV_TOKEN_ADDRESS,
                CRV_UNI_POOL_ADDRESS,
                CRV_UNI_POOL_TOKEN0_ADDRESS,
                CRV_UNI_POOL_TOKEN1_ADDRESS,
                UNI_V3_FEE_CRV_UNI_POOL
            );

            wiseOracleHubInstance.addTwapOracleDerivative(
                CRVUSD_TOKEN_ADDRESS,
                CRVUSD_UNI_POOL_TOKEN0_ADDRESS,
                [
                    ETH_USDC_UNI_POOL_ADDRESS,
                    CRVUSD_UNI_POOL_ADDRESS
                ],
                [
                    ETH_USDC_UNI_POOL_TOKEN0_ADDRESS,
                    CRVUSD_UNI_POOL_TOKEN0_ADDRESS
                ],
                [
                    ETH_USDC_UNI_POOL_TOKEN1_ADDRESS,
                    CRVUSD_UNI_POOL_TOKEN1_ADDRESS
                ],
                [
                    UNI_V3_FEE_ETH_USDC_UNI_POOL,
                    UNI_V3_FEE_CRVUSD_UNI_POOL
                ]
            );

            address underlyingFeed = _heartBeatCheat == true
                ? AddressesMap[chainId].weth
                : CRVUSD_TOKEN_ADDRESS;

            _addPendleMarketOracle(
                CRVUSD_PENDLE_28MAR_2024,
                address(curveUsdEthOracleInstance),
                underlyingFeed,
                0.0008 ether,
                0.0016 ether
            );

            derivativeToken = _addPendleMarket(
                CRVUSD_PENDLE_28MAR_2024,
                "name",
                "symbol",
                MAX_CARDINALITY
            );

            pendleChildLpOracleInstance = new PendleChildLpOracle(
                address(pendleLpOracleInstance),
                address(derivativeToken)
            );

            underlyingTokens = new address[](1);
            underlyingTokens[0] = underlyingFeed;

            wiseOracleHubInstance.addOracle(
                address(derivativeToken),
                IPriceFeed(address(pendleChildLpOracleInstance)),
                underlyingTokens
            );

            PoolManager.CreatePool[] memory createPoolArray = new PoolManager.CreatePool[](3);

            createPoolArray[0] = PoolManager.CreatePool(
                {
                    allowBorrow: true,
                    poolToken: CRVUSD_TOKEN_ADDRESS,
                    poolMulFactor: 17500000000000000,
                    poolCollFactor: 740000000000000000,
                    maxDepositAmount: 2000000000000000000000000
                }
            );

            createPoolArray[1] = PoolManager.CreatePool(
                {
                    allowBorrow: false,
                    poolToken: controllerTester.pendleChildAddress(
                        AddressesMap[chainId].PendleMarketStEth
                    ),
                    poolMulFactor: 17500000000000000,
                    poolCollFactor: 740000000000000000,
                    maxDepositAmount: 2000000000000000000000000
                }
            );

            createPoolArray[2] = PoolManager.CreatePool(
                {
                    allowBorrow: false,
                    poolToken: controllerTester.pendleChildAddress(
                        CRVUSD_PENDLE_28MAR_2024
                    ),
                    poolMulFactor: 17500000000000000,
                    poolCollFactor: 740000000000000000,
                    maxDepositAmount: 2000000000000000000000000
                }
            );

            for (uint256 i = 0; i < createPoolArray.length; i++) {
                wiseLendingInstance.createPool(
                    createPoolArray[i]
                );
            }

        }

        if (block.chainid == ARB_CHAIN_ID) {
            params = PoolManager.CreatePool(
                {
                    allowBorrow: false,
                    poolToken: controllerTester.pendleChildAddress(
                        AddressesMap[chainId].PendleMarketStEth
                    ),
                    poolMulFactor: 17500000000000000,
                    poolCollFactor: 740000000000000000,
                    maxDepositAmount: 2000000000000000000000000
                }
            );

            wiseLendingInstance.createPool(
                params
            );
        }

        powerFarmNftsInstance = new PowerFarmNFTs(
            "",
            ""
        );

        powerFarmManagerInstance = new PendlePowerManager(
            address(wiseLendingInstance),
            controllerTester.pendleChildAddress(
                    AddressesMap[chainId].PendleMarketStEth
            ),
            AddressesMap[chainId].pendleRouter,
            AddressesMap[chainId].entryAssetPendleMarketStEth,
            AddressesMap[chainId].PendleMarketStEthSy,
            AddressesMap[chainId].PendleMarketStEth,
            AddressesMap[chainId].pendleRouterStatic,
            AddressesMap[chainId].dex,
            950000000000000000,
            address(powerFarmNftsInstance)
        );

        wiseLendingInstance.setVerifiedIsolationPool(
            address(powerFarmManagerInstance),
            true
        );

        vm.stopPrank();

        if (block.chainid == ETH_CHAIN_ID) {
             address wethWhaleEthMain = 0x8EB8a3b98659Cce290402893d0123abb75E3ab28;

            vm.startPrank(
                wethWhaleEthMain
            );

            wethInstance.transfer(
                wiseLendingInstance.master(),
                1000 ether
            );

            vm.stopPrank();
        }

        if (block.chainid == ARB_CHAIN_ID) {
            address wethWhaleArbMain = 0x3e0199792Ce69DC29A0a36146bFa68bd7C8D6633;

            vm.startPrank(
                wethWhaleArbMain
            );

            wethInstance.transfer(
                wiseLendingInstance.master(),
                1000 ether
            );

            vm.stopPrank();
        }

        vm.startPrank(
            wiseLendingInstance.master()
        );

        IERC20(AddressesMap[chainId].weth).approve(
            address(powerFarmManagerInstance),
            1000000 ether
        );

        wiseSecurityInstance = IWiseSecurity(
            wiseLendingInstance.WISE_SECURITY()
        );

        positionNftsInstance = IPositionNFTs(
            wiseLendingInstance.POSITION_NFT()
        );
    }

    function _setOracleData(
        ICustomOracle _oracle
    )
        internal
    {
        for (uint80 i = 0; i < 4; i++) {
            _oracle.setRoundData(
                i,
                i
            );
        }

        _oracle.setRoundData(
            4,
            38597363079105398474523661669562635951089994888546854679819194669304376546645
        );

        _oracle.setRoundData(
            5,
            57896044618658097711785492504343953926634992332820282019728792003956564819967
        );

        _oracle.setRoundData(
            6,
            115792089237316195423570985008687907853269984665640564039457584007913129639935
        );

        _oracle.setLastUpdateGlobal(
            block.timestamp
        );

        _oracle.setGlobalAggregatorRoundId(
            6
        );
    }

    function _addPendleMarketOracle(
        address _market,
        address _feedAddress,
        address _underlyingFeed,
        uint256 _expectedMinValueOracle,
        uint256 _expectedMaxValueOracle
    )
        internal
    {
        pendleLpOracleInstance = new PendleLpOracle(
            _market,
            IPriceFeed(_feedAddress),
            IOraclePendle(address(AddressesMap[chainId].pendlePtOracle)),
            "name",
            duration
        );

        IPendleMarket(_market).increaseObservationsCardinalityNext(
            MAX_CARDINALITY
                / 10
        );

        address[] memory underlyingTokens = new address[](1);
        underlyingTokens[0] = _underlyingFeed;

        wiseOracleHubInstance.addOracle(
            _market,
            IPriceFeed(address(pendleLpOracleInstance)),
            underlyingTokens
        );

        assertEq(
            address(wiseOracleHubInstance.priceFeed(_market)),
            address(pendleLpOracleInstance),
            "price feed is not pendle lp oracle"
        );

        uint256 latestResolver = wiseOracleHubInstance.latestResolver(
            _market
        );

        assertGt(
            latestResolver,
            _expectedMinValueOracle,
            "latest resolver is not greater than expected min value"
        );

        assertGt(
            _expectedMaxValueOracle,
            latestResolver,
            "latest resolver is not less than expected max value"
        );
    }

    function _addPendleTokenOracle()
        internal
    {
        pendleTokenOracleInstance = new PendleTokenCustomOracle(
            AddressesMap[chainId].pendleTokenAddress,
            UniPoolPropertiesMap[chainId].poolAddress,
            UniPoolPropertiesMap[chainId].token0,
            UniPoolPropertiesMap[chainId].token1,
            AddressesMap[chainId].weth,
            UniPoolPropertiesMap[chainId].factory,
            UniPoolPropertiesMap[chainId].fee,
            UniPoolPropertiesMap[chainId].decimals
        );

        _setOracleData(
            ICustomOracle(
                address(
                    pendleTokenOracleInstance
                )
            )
        );

        wiseOracleHubInstance.addOracle(
            AddressesMap[chainId].pendleTokenAddress,
            IPriceFeed(address(pendleTokenOracleInstance)),
            new address[](0)
        );

        wiseOracleHubInstance.recalibrate(
            AddressesMap[chainId].pendleTokenAddress
        );

        pendleTokenOracleInstance.renounceOwnership();

        uint256 latestResolver = wiseOracleHubInstance.latestResolver(
            AddressesMap[chainId].pendleTokenAddress
        );

        wiseOracleHubInstance.addTwapOracle(
            AddressesMap[chainId].pendleTokenAddress,
            UniPoolPropertiesMap[chainId].poolAddress,
            UniPoolPropertiesMap[chainId].token0,
            UniPoolPropertiesMap[chainId].token1,
            UniPoolPropertiesMap[chainId].fee
        );

        uint256 latestResolverTwap = wiseOracleHubInstance.latestResolverTwap(
            AddressesMap[chainId].pendleTokenAddress
        );

        assertApproxEqRel(
            latestResolver,
            latestResolverTwap,
            NINTY_FOUR,
            "latest resolver and twap resolver are not approximately equal"
        );
    }

    function _addPendleMarket(
        address _market,
        string memory _name,
        string memory _symbol,
        uint16 _maxCardinality
    )
        internal
        returns (
            IPendlePowerFarmToken
        )
    {
        vm.stopPrank();

        vm.startPrank(
            randomUser
        );

        vm.expectRevert(
            NotMaster.selector
        );

        controllerTester.addPendleMarket(
            _market,
            _name,
            _symbol,
            _maxCardinality
        );

        vm.stopPrank();

        vm.startPrank(
            wiseLendingInstance.master()
        );

        controllerTester.addPendleMarket(
            _market,
            _name,
            _symbol,
            _maxCardinality
        );

        vm.expectRevert(
            AlreadySet.selector
        );

        controllerTester.addPendleMarket(
            _market,
            _name,
            _symbol,
            _maxCardinality
        );

        uint256[] memory compoundArray = controllerTester.pendleChildCompoundInfoReservedForCompound(
            _market
        );

        uint128[] memory lastIndexArray = controllerTester.pendleChildCompoundInfoLastIndex(
            _market
        );

        address[] memory rewardTokensArray = controllerTester.pendleChildCompoundInfoRewardTokens(
            _market
        );

        for (uint256 i = 0; i < compoundArray.length; i++) {

            assertEq(
                compoundArray[i],
                0,
                "compound array is not zero"
            );

            assertEq(
                lastIndexArray[i],
                0,
                "last index is not zero"
            );

            assertNotEq(
                rewardTokensArray[i],
                ZERO_ADDRESS,
                "reward token is zero address"
            );
        }

        for (uint256 i = 0; i < controllerTester.activePendleMarketsLength(); i++) {

            assertNotEq(
                controllerTester.activePendleMarkets(i),
                ZERO_ADDRESS,
                "active pendle market is zero address"
            );
        }

        assertEq(
            controllerTester.activePendleMarkets(controllerTester.activePendleMarketsLength() - 1),
            _market,
            "active pendle market is not the same"
        );

        vm.expectRevert(
            NotAllowed.selector
        );

        controllerTester.overWriteAmounts(
            _market
        );

        vm.expectRevert(
            NotAllowed.selector
        );

        controllerTester.overWriteIndexAll(
            _market
        );

        vm.expectRevert(
            NotAllowed.selector
        );

        controllerTester.updateRewardTokens(
            _market
        );

        return IPendlePowerFarmToken(
            controllerTester.pendleChildAddress(_market)
        );
    }

    function testShouldMintDerivativeTokens()
        public
        normalSetup(true)
    {
        (
            IERC20 tokenReceived,
            IPendlePowerFarmToken derivativeToken,
            uint256 depositAmount
        ) = _simpleDeposit(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            IERC20 tokenReceivedB,
            IPendlePowerFarmToken derivativeTokenB,
            uint256 depositAmountB
        ) = _simpleDeposit(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        assertGt(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            ),
            0,
            "Should have some derivative tokens"
        );

        assertGt(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            ),
            0,
            "Should have some derivative tokens B"
        );

        assertEq(
            tokenReceived.balanceOf(
                address(controllerTester)
            ),
            depositAmount,
            "Should have received the correct amount of tokens"
        );

        assertEq(
            tokenReceivedB.balanceOf(
                address(controllerTester)
            ),
            depositAmountB,
            "Should have received the correct amount of tokens B"
        );
    }

    function testShouldNotBeAbleToCallClaimArbOnEthMain()
        normalSetup(true)
        public
    {
        vm.expectRevert(
            NotArbitrum.selector
        );

        uint256 accrued = 1;

        bytes32[] memory emptyBytes = new bytes32[](2);

        controllerTester.claimArb(
            accrued,
            emptyBytes
        );
    }

    function testShouldBeAbleToWithdrawTokens()
        normalSetup(true)
        public
    {
        (
            IERC20 tokenReceived,
            IPendlePowerFarmToken derivativeToken,
        ) = _simpleDeposit(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            IERC20 tokenReceivedB,
            IPendlePowerFarmToken derivativeTokenB,
        ) = _simpleDeposit(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 tokenBalance = tokenReceived.balanceOf(
            address(controllerTester)
        );

        uint256 tokenBalanceB = tokenReceivedB.balanceOf(
            address(controllerTester)
        );

        vm.expectRevert(
            NotEnoughShares.selector
        );

        derivativeToken.withdrawExactAmount(
            tokenBalance
        );

        vm.expectRevert(
            NotEnoughShares.selector
        );

        derivativeTokenB.withdrawExactAmount(
            tokenBalanceB
        );

        uint256 maxWithdrawable = derivativeToken.previewAmountWithdrawShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            ),
            derivativeToken.previewUnderlyingLpAssets()
        );

        uint256 maxWithdrawableB = derivativeTokenB.previewAmountWithdrawShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            ),
            derivativeTokenB.previewUnderlyingLpAssets()
        );

        vm.expectRevert(
            NotEnoughShares.selector
        );

        derivativeToken.withdrawExactAmount(
            maxWithdrawable
                + 1
        );

        vm.expectRevert(
            NotEnoughShares.selector
        );

        derivativeTokenB.withdrawExactAmount(
            maxWithdrawableB
                + 1
        );

        derivativeToken.withdrawExactAmount(
            maxWithdrawable
        );

        derivativeTokenB.withdrawExactAmount(
            maxWithdrawableB
        );
    }

    function testShouldBeAbleToWithdrawTokensExactShares()
        public
        normalSetup(true)
    {
        (
            IERC20 tokenReceived,
            IPendlePowerFarmToken derivativeToken,
        ) = _simpleDeposit(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            IERC20 tokenReceivedB,
            IPendlePowerFarmToken derivativeTokenB,
        ) = _simpleDeposit(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 tokenBalance = tokenReceived.balanceOf(
            address(controllerTester)
        );

        uint256 tokenBalanceB = tokenReceivedB.balanceOf(
            address(controllerTester)
        );

        uint256 amount = derivativeToken.withdrawExactShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            )
        );

        uint256 amountB = derivativeTokenB.withdrawExactShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            )
        );

        assertGt(
            tokenBalance,
            amount
        );

        assertEq(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            ),
            0
        );

        assertGt(
            tokenBalanceB,
            amountB
        );

        assertEq(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            ),
            0
        );
    }

    function testExternalClaimShouldBeAccountedForExactly()
        public
        normalSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken,
        ) = _simpleDeposit(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB,
        ) = _simpleDeposit(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        _simpleForwardTime();

        IPendleMarket(AddressesMap[chainId].PendleMarketStEth).redeemRewards(
            address(controllerTester)
        );

        IPendleMarket(CRVUSD_PENDLE_28MAR_2024).redeemRewards(
            address(controllerTester)
        );

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        uint256 calculatedA = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        uint256 calculatedB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        uint256 calculatedC = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[1];

        uint256 actualPendle = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        uint256 actualCurve = _balanceOf(
            CRV_TOKEN_ADDRESS,
            address(controllerTester)
        );

        assertEq(
            calculatedA + calculatedC,
            actualPendle,
            "calculated is equal to actual"
        );

        assertEq(
            calculatedB,
            actualCurve,
            "calculatedB is equal to actual2"
        );
    }

    /**
     * @dev This test is to check that the rewards should be accounted for
     * exactly when the user claims the rewards and then deposits the same amount of
     * tokens back into the derivative token.. in other words:
     * testRewardsShouldBeAccountedForWronglyIncludingVeBalanceInsideClaimWithDonate
     */
    function testClaimWithDonateRewards()
        public
        normalSetup(true)
    {
        (
            IERC20 tokenReceived,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            IERC20 tokenReceivedB,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        derivativeToken.depositExactAmount(
            1 ether
        );

        derivativeTokenB.depositExactAmount(
            1 ether
        );

        _simpleForwardTime();

        tokenReceived.transfer(
            address(controllerTester),
            tokenReceived.balanceOf(
                wiseLendingInstance.master()
            ) / 10
        );

        tokenReceivedB.transfer(
            address(controllerTester),
            tokenReceivedB.balanceOf(
                wiseLendingInstance.master()
            ) / 10
        );

        derivativeToken.depositExactAmount(
            1 ether
        );

        derivativeTokenB.depositExactAmount(
            1 ether
        );

        _simpleIndexCheckMulti();

        uint256 cashBalance = IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(
            address(controllerTester)
        );

        uint256 cashBalanceCurve = IERC20(CRV_TOKEN_ADDRESS).balanceOf(
            address(controllerTester)
        );

        uint256 cashReserved = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        uint256 cashReservedB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[1];

        uint256 cashreservedCrv = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        assertGt(
            cashBalance,
            cashReserved + cashReservedB,
            "cashBalance is greater than cashReserved + cashReservedB"
        );

        assertGt(
            cashBalanceCurve,
            cashreservedCrv,
            "cashBalanceCurve is greater than cashreservedCrv"
        );
    }

    /**
     * @dev This test is to check that the rewards accounting
     * is not destabilized when the lock is extended.
     */
    function testDestabilization()
        public
        normalSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        derivativeToken.depositExactAmount(
            1 ether
        );

        derivativeTokenB.depositExactAmount(
            1 ether
        );

        _simpleForwardTime();

        LockedPosition memory positionData = pendleLockInstance.positionData(
            address(controllerTester)
        );

        uint128 oldExpiry = positionData.expiry;

        uint256 lockAmount = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            wiseLendingInstance.master()
        );

        controllerTester.lockPendle(
            {
                _amount: lockAmount,
                _weeks: 52,
                _fromInside: false,
                _sameExpiry: true
            }
        );

        positionData = pendleLockInstance.positionData(
            address(controllerTester)
        );

        uint128 newExpiry = positionData.expiry;

        assertEq(
            oldExpiry,
            newExpiry,
            "oldExpiry is equal to newExpiry"
        );

        _simpleIndexCheckMulti();

        derivativeToken.depositExactAmount(
            1 ether
        );

        _simpleIndexCheckMulti();

        uint256 cashBalance = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        uint256 cashBalanceCurve = _balanceOf(
            CRV_TOKEN_ADDRESS,
            address(controllerTester)
        );

        uint256 cashReserved = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        uint256 cashReservedB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[1];

        uint256 cashReserveCurve = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        assertGt(
            cashBalance,
            cashReserved + cashReservedB,
            "cashBalance is greater than cashReserved + cashReservedB"
        );

        assertGt(
            cashBalanceCurve,
            cashReserveCurve,
            "cashBalanceCurve is greater than cashReserveCurve"
        );
    }

    /**
     * @dev This test is to check that the rewards should be accounted for
     * almost exactly including the veBalance inside claim with donate
     * test-Rewards-Should-Be-Accounted-For-Almost-Exactly-Including-VeBalance-Inside-ClaimWithDonate
     */
    function testRewardsShouldBeAccountedForAlmostExactlyIncludingVeBalanceInsideClaimWithDonate()
        public
        normalSetup(true)
    {
        (
            IERC20 tokenReceived,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            IERC20 tokenReceivedB,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        _simpleForwardTime();

        vm.expectRevert(
            NothingToSkim.selector
        );

        controllerTester.skim(
            AddressesMap[chainId].PendleMarketStEth
        );

        vm.expectRevert(
            NothingToSkim.selector
        );

        controllerTester.skim(
            CRVUSD_PENDLE_28MAR_2024
        );

        vm.expectRevert(
            WrongAddress.selector
        );

        controllerTester.skim(
            PENDLE_WHALE
        );

        vm.expectRevert(
            WrongAddress.selector
        );

        controllerTester.skim(
            crvUsdMar2024LP_WHALE
        );

        tokenReceived.transfer(
            address(controllerTester),
            tokenReceived.balanceOf(
                wiseLendingInstance.master()
            ) / 10
        );

        tokenReceivedB.transfer(
            address(controllerTester),
            tokenReceivedB.balanceOf(
                wiseLendingInstance.master()
            ) / 10
        );

        controllerTester.skim(
            AddressesMap[chainId].PendleMarketStEth
        );

        controllerTester.skim(
            CRVUSD_PENDLE_28MAR_2024
        );

        vm.expectRevert(
            NothingToSkim.selector
        );

        controllerTester.skim(
            AddressesMap[chainId].PendleMarketStEth
        );

        vm.expectRevert(
            NothingToSkim.selector
        );

        controllerTester.skim(
            CRVUSD_PENDLE_28MAR_2024
        );

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        _simpleIndexCheckMulti();

        uint256 cashBalance = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        uint256 cashBalanceCurve = _balanceOf(
            CRV_TOKEN_ADDRESS,
            address(controllerTester)
        );

        console.log(cashBalanceCurve, 'cashBalanceCurve');

        uint256 cashReserved = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        console.log(cashReserved, 'cashReserved');

        uint256 cashReserveCurve = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        console.log(cashReserveCurve, 'cashReserveCurve');

        uint256 cashReservedB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[1];

        console.log(cashReservedB, 'cashReservedB');

        assertGt(
            cashBalance,
            cashReserved + cashReservedB,
            "cashBalance is greater than sum of cashReserved and cashReservedB"
        );

        assertGt(
            cashBalanceCurve,
            cashReserveCurve,
            "cashBalanceCurve is greater than cashReserveCurve"
        );

        assertApproxEqRel(
            cashBalance,
            cashReserved + cashReservedB,
            NINTY_NINE_POINT_NINE,
            "cashBalance is approximately equal to sum of cashReserved and cashReservedB"
        );

        assertApproxEqRel(
            cashBalanceCurve,
            cashReserveCurve,
            NINTY_NINE_POINT_NINE,
            "cashBalanceCurve is approximately equal to cashReserveCurve"
        );
    }

    function testShouldBeAbleToCompoundWithProfit()
        public
        cheatSetup(true)
    {
        TokenData memory tokenDataA;
        TokenData memory tokenDataB;
        TokenData memory tokenDataC;

        (
            tokenDataA.tokenReceived,
            tokenDataA.derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            tokenDataB.tokenReceived,
            tokenDataB.derivativeToken
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        tokenDataA.derivativeToken.depositExactAmount(
            1 ether
        );

        tokenDataB.derivativeToken.depositExactAmount(
            1 ether
        );

        _simpleForwardTime();

        tokenDataA.derivativeToken.depositExactAmount(
            1 ether
        );

        tokenDataB.derivativeToken.depositExactAmount(
            1 ether
        );

        _getMaxPendleTokens();
        _getMaxCrvTokens();

        tokenDataA.reservedForCompound = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        tokenDataB.reservedForCompound = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[1];

        tokenDataC.reservedForCompound = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        BalanceData memory balanceDataA;
        BalanceData memory balanceDataB;
        BalanceData memory balanceDataC;

        balanceDataA.cashBalControllerBefore = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        balanceDataB.cashBalControllerBefore = _balanceOf(
            CRV_TOKEN_ADDRESS,
            address(controllerTester)
        );

        balanceDataA.cashBalUserBefore = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            wiseLendingInstance.master()
        );

        balanceDataB.cashBalUserBefore = _balanceOf(
            CRV_TOKEN_ADDRESS,
            wiseLendingInstance.master()
        );

        tokenDataA.tokenReceived.approve(
            address(controllerTester),
            type(uint256).max
        );

        tokenDataB.tokenReceived.approve(
            address(controllerTester),
            type(uint256).max
        );

        tokenDataA.balanceLpsBefore = tokenDataA.tokenReceived.balanceOf(
            wiseLendingInstance.master()
        );

        tokenDataB.balanceLpsBefore = tokenDataB.tokenReceived.balanceOf(
            wiseLendingInstance.master()
        );

        tokenDataA.tokensSentAmount = controllerTester.exchangeRewardsForCompoundingWithIncentive(
            AddressesMap[chainId].PendleMarketStEth,
            AddressesMap[chainId].pendleTokenAddress,
            tokenDataA.reservedForCompound
        );

        vm.expectRevert(
            NotEnoughCompound.selector
        );

        tokenDataB.tokensSentAmount = controllerTester.exchangeRewardsForCompoundingWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            CRV_TOKEN_ADDRESS,
            tokenDataB.reservedForCompound
        );

        tokenDataB.tokensSentAmount = controllerTester.exchangeRewardsForCompoundingWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            CRV_TOKEN_ADDRESS,
            tokenDataC.reservedForCompound
        );

        uint256 tokensSentAmountC = controllerTester.exchangeRewardsForCompoundingWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            AddressesMap[chainId].pendleTokenAddress,
            tokenDataB.reservedForCompound
        );

        uint256 balanceLpsNowA = tokenDataA.tokenReceived.balanceOf(wiseLendingInstance.master());
        uint256 balanceLpsNowB = tokenDataB.tokenReceived.balanceOf(wiseLendingInstance.master());

        assertEq(
            tokenDataA.balanceLpsBefore
                - balanceLpsNowA,
            tokenDataA.tokensSentAmount
        );

        assertEq(
            tokenDataB.balanceLpsBefore
                - balanceLpsNowB,
            tokenDataB.tokensSentAmount
                + tokensSentAmountC
        );

        balanceDataA.valueSent = wiseOracleHubInstance.getTokensInETH(
            AddressesMap[chainId].PendleMarketStEth,
            tokenDataA.tokensSentAmount
        );

        balanceDataB.valueSent = wiseOracleHubInstance.getTokensInETH(
            CRVUSD_PENDLE_28MAR_2024,
            tokenDataB.tokensSentAmount + tokensSentAmountC
        );

        balanceDataC.valueSent = wiseOracleHubInstance.getTokensInETH(
            CRVUSD_PENDLE_28MAR_2024,
            tokenDataB.tokensSentAmount
        );

        balanceDataA.cashBalControllerAfter = IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(address(controllerTester));
        balanceDataB.cashBalControllerAfter = IERC20(CRV_TOKEN_ADDRESS).balanceOf(address(controllerTester));

        balanceDataA.cashBalUserAfter = IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(wiseLendingInstance.master());
        balanceDataB.cashBalUserAfter = IERC20(CRV_TOKEN_ADDRESS).balanceOf(wiseLendingInstance.master());

        assertGt(
            balanceDataA.cashBalControllerBefore,
            balanceDataA.cashBalControllerAfter,
            "balanceDataA.cashBalControllerBefore is greater than balanceDataA.cashBalControllerAfter"
        );

        assertGt(
            balanceDataB.cashBalControllerBefore,
            balanceDataB.cashBalControllerAfter
        );

        assertGt(
            balanceDataA.cashBalUserAfter,
            balanceDataA.cashBalUserBefore
        );

        assertGt(
            balanceDataB.cashBalUserAfter,
            balanceDataB.cashBalUserBefore
        );

        balanceDataA.difference = balanceDataA.cashBalUserAfter
            - balanceDataA.cashBalUserBefore;

        balanceDataB.difference = balanceDataB.cashBalUserAfter
            - balanceDataB.cashBalUserBefore;

        assertEq(
            balanceDataA.difference,
            balanceDataA.cashBalControllerBefore
                - balanceDataA.cashBalControllerAfter
        );

        assertEq(
            balanceDataB.difference,
            balanceDataB.cashBalControllerBefore
                - balanceDataB.cashBalControllerAfter
        );

        assertGt(
            wiseOracleHubInstance.getTokensInETH(AddressesMap[chainId].pendleTokenAddress, balanceDataA.difference),
            balanceDataA.valueSent+balanceDataB.valueSent-balanceDataC.valueSent
        );

        assertGt(
            wiseOracleHubInstance.getTokensInETH(CRV_TOKEN_ADDRESS, balanceDataB.difference),
            balanceDataC.valueSent,
            "wiseOracleHubInstance.getTokensInETH(CRV_TOKEN_ADDRESS, balanceDataB.difference) is greater than balanceDataC.valueSent"
        );

        assertApproxEqRel(
            balanceDataA.valueSent+balanceDataB.valueSent-balanceDataC.valueSent,
            wiseOracleHubInstance.getTokensInETH(AddressesMap[chainId].pendleTokenAddress, balanceDataA.difference),
            NINTY_FOUR
        );

        assertApproxEqRel(
            balanceDataC.valueSent,
            wiseOracleHubInstance.getTokensInETH(CRV_TOKEN_ADDRESS, balanceDataB.difference),
            NINTY_FOUR
        );

        assertEq(
            tokenDataA.reservedForCompound + tokenDataB.reservedForCompound,
            balanceDataA.difference,
            "reservedForCompoundA + reservedForCompoundB is equal to difference"
        );

        assertEq(
            tokenDataC.reservedForCompound,
            balanceDataB.difference,
            "reservedForCompoundC is equal to differenceB"
        );

        assertGt(
            tokenDataA.derivativeToken.totalLpAssets(),
            tokenDataA.derivativeToken.underlyingLpAssetsCurrent()
        );

        assertGt(
            tokenDataB.derivativeToken.totalLpAssets(),
            tokenDataB.derivativeToken.underlyingLpAssetsCurrent()
        );

        vm.warp(
            block.timestamp + 8 days
        );

        vm.roll(
            block.number + 100
        );

        tokenDataA.derivativeToken.depositExactAmount(
            0.00001 ether
        );

        tokenDataB.derivativeToken.depositExactAmount(
            0.00001 ether
        );

        assertEq(
            tokenDataA.derivativeToken.totalLpAssets(),
            tokenDataA.derivativeToken.underlyingLpAssetsCurrent(),
            "tokenDataA.derivativeToken.totalLpAssets() is equal to tokenDataA.derivativeToken.underlyingLpAssetsCurrent()"
        );

        assertEq(
            tokenDataB.derivativeToken.totalLpAssets(),
            tokenDataB.derivativeToken.underlyingLpAssetsCurrent(),
            "tokenDataB.derivativeToken.totalLpAssets() is equal to tokenDataB.derivativeToken.underlyingLpAssetsCurrent()"
        );

        assertApproxEqRel(
            tokenDataA.tokensSentAmount,
            tokenDataA.derivativeToken.totalLpAssets() - tokenDataA.derivativeToken.totalSupply(),
            NINTY_NINE_POINT_NINE,
            "tokenDataA.tokensSentAmount is approximately equal to tokenDataA.derivativeToken.totalLpAssets() - tokenDataA.derivativeToken.totalSupply()"
        );

        assertApproxEqRel(
            tokenDataB.tokensSentAmount + tokensSentAmountC,
            tokenDataB.derivativeToken.totalLpAssets() - tokenDataB.derivativeToken.totalSupply(),
            NINTY_NINE_POINT_NINE,
            "tokenDataB.tokensSentAmount + tokensSentAmountC is approximately equal to tokenDataB.derivativeToken.totalLpAssets() - tokenDataB.derivativeToken.totalSupply()"
        );

        _simpleIndexCheckMulti();
    }

    function testCardinalityIncreaseHappensUntilMaxIsReached()
        public
        cheatSetup(true)
    {
        MarketStorage memory marketStorage = IPendleMarket(
            AddressesMap[chainId].PendleMarketStEth
        )._storage();

        MarketStorage memory marketStorageB = IPendleMarket(
            CRVUSD_PENDLE_28MAR_2024
        )._storage();

        uint16 cashedCardinalityNext = marketStorage.observationCardinalityNext;
        uint16 cashedCardinalityNextB = marketStorageB.observationCardinalityNext;

        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        marketStorage = IPendleMarket(
            AddressesMap[chainId].PendleMarketStEth
        )._storage();

        marketStorageB = IPendleMarket(
            CRVUSD_PENDLE_28MAR_2024
        )._storage();

        assertGt(
            marketStorage.observationCardinalityNext,
            cashedCardinalityNext,
            "observationCardinalityNext should be greater than cashedCardinalityNext"
        );

        assertGt(
            marketStorageB.observationCardinalityNext,
            cashedCardinalityNextB,
            "observationCardinalityNextB should be greater than cashedCardinalityNextB"
        );

        for (uint256 i = marketStorage.observationCardinalityNext; i < MAX_CARDINALITY; i++) {

            marketStorage = IPendleMarket(AddressesMap[chainId].PendleMarketStEth)._storage();

            uint16 cashCardinalityNext = marketStorage.observationCardinalityNext;

            derivativeToken.depositExactAmount(
                1 ether
            );

            marketStorage = IPendleMarket(AddressesMap[chainId].PendleMarketStEth)._storage();

            if (marketStorage.observationCardinalityNext < MAX_CARDINALITY) {

                assertGt(
                    marketStorage.observationCardinalityNext,
                    cashCardinalityNext,
                    "observationCardinalityNext should be greater than cashCardinalityNext"
                );
            } else {
                assertEq(
                    marketStorage.observationCardinalityNext,
                    MAX_CARDINALITY,
                    "observationCardinalityNext should be equal to MAX_CARDINALITY"
                );
            }
        }

        for (uint256 i = marketStorageB.observationCardinalityNext; i < MAX_CARDINALITY; i++) {

            marketStorage = IPendleMarket(CRVUSD_PENDLE_28MAR_2024)._storage();

            uint16 cashCardinalityNextB = marketStorageB.observationCardinalityNext;
            derivativeTokenB.depositExactAmount(
                1 ether
            );

            marketStorageB = IPendleMarket(CRVUSD_PENDLE_28MAR_2024)._storage();

            if (marketStorageB.observationCardinalityNext < MAX_CARDINALITY) {

                assertGt(
                    marketStorageB.observationCardinalityNext,
                    cashCardinalityNextB,
                    "observationCardinalityNextB should be greater than cashCardinalityNextB"
                );
            } else {

                assertEq(
                    marketStorageB.observationCardinalityNext,
                    MAX_CARDINALITY,
                    "observationCardinalityNextB should be equal to MAX_CARDINALITY"
                );
            }
        }
    }

    function testLockFromInsideShouldWork()
        public
        cheatSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        IERC20(AddressesMap[chainId].pendleTokenAddress).approve(
            address(controllerTester),
            type(uint256).max
        );

        uint256 feeShares = derivativeToken.balanceOf(
            address(controllerTester)
        );

        assertEq(
            controllerTester.reservedPendleForLocking(),
            0,
            "reservedPendleForLocking should be zero"
        );

        controllerTester.exchangeLpFeesForPendleWithIncentive(
            AddressesMap[chainId].PendleMarketStEth,
            feeShares
        );

        uint256 feeSharesB = derivativeTokenB.balanceOf(
            address(controllerTester)
        );

        controllerTester.exchangeLpFeesForPendleWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            feeSharesB
        );

        uint256 veBalanceBefore = _balanceOf(
            AddressesMap[chainId].vePendle,
            address(controllerTester)
        );

        uint256 cashedReservedForLocking = controllerTester.reservedPendleForLocking();

        controllerTester.lockPendle(
            {
                _amount: cashedReservedForLocking,
                _weeks: 1,
                _fromInside: true,
                _sameExpiry: true
            }
        );

        uint256 veBalanceAfter = _balanceOf(
            AddressesMap[chainId].vePendle,
            address(controllerTester)
        );

        assertGt(
            veBalanceAfter,
            veBalanceBefore,
            "veBalanceAfter should be greater than veBalanceBefore"
        );

        assertEq(
            controllerTester.reservedPendleForLocking(),
            0,
            "reservedPendleForLocking should be zero"
        );

        uint256 marketA = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        assertGt(
            marketA,
            0,
            "marketA should be greater than zero"
        );

        uint256 marketB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        assertGt(
            marketB,
            0,
            "marketB should be greater than zero"
        );

        uint256 balancePendleNow = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        assertGt(
            balancePendleNow,
            0,
            "balancePendleNow should be greater than zero"
        );

        marketA = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        marketB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[1];

        assertApproxEqRel(
            marketA + marketB,
            balancePendleNow,
            NINTY_NINE_POINT_NINE,
            "sum of marketA and marketB is approximately equal to balancePendleNow"
        );
    }

    function testWithdrawLockShouldWork()
        public
        cheatSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        IERC20(AddressesMap[chainId].pendleTokenAddress).approve(
            address(controllerTester),
            type(uint256).max
        );

        uint256 feeShares = derivativeToken.balanceOf(
            address(controllerTester)
        );

        uint256 feeSharesB = derivativeTokenB.balanceOf(
            address(controllerTester)
        );

        assertEq(
            controllerTester.reservedPendleForLocking(),
            0,
            "reservedPendleForLocking should be zero"
        );

        (
            uint256 amountSent
            ,
        ) = controllerTester.exchangeLpFeesForPendleWithIncentive(
            AddressesMap[chainId].PendleMarketStEth,
            feeShares
        );

        (
            uint256 amountSentB
            ,
        ) = controllerTester.exchangeLpFeesForPendleWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            feeSharesB
        );

        assertGt(
            amountSent,
            0,
            "amountSent should be greater than zero"
        );

        assertGt(
            amountSentB,
            0,
            "amountSentB should be greater than zero"
        );

        assertEq(
            controllerTester.reservedPendleForLocking(),
            amountSent + amountSentB,
            "reservedPendleForLocking should be equal to sum of amountSent and amountSentB"
        );

        uint256 marketA = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0];

        assertGt(
            marketA,
            0,
            "AddressesMap[chainId].PendleMarketStEth should be greater than zero"
        );

        uint256 marketB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[1];

        assertGt(
            marketB,
            0,
            "CRVUSD_PENDLE_28MAR_2024 should be greater than zero"
        );

        uint256 balancePendleNow = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        assertApproxEqRel(
            controllerTester.reservedPendleForLocking()
                + marketA
                + marketB,
            balancePendleNow,
            NINTY_NINE_POINT_NINE,
            "sum of reservedPendleForLocking, marketA and marketB is approximately equal to balancePendleNow"
        );

        uint256 cashedBal = _balanceOf(
            AddressesMap[chainId].vePendle,
            address(controllerTester)
        );

        vm.warp(
            block.timestamp + 800 days
        );

        uint256 masterCashedBal = IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(
            wiseLendingInstance.master()
        );

        uint256 lockAmount = controllerTester.withdrawLock();

        assertEq(
            masterCashedBal,
            IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(
                wiseLendingInstance.master()
            )
                - lockAmount
        );

        assertGt(
            lockAmount,
            cashedBal,
            "lockAmount should be greater than cashedBal"
        );

        assertGt(
            lockAmount,
            0,
            "lockAmount should be greater than zero"
        );

        uint256 pendleBalance = _balanceOf(
            AddressesMap[chainId].vePendle,
            address(controllerTester)
        );

        assertEq(
            pendleBalance,
            0,
            "pendleBalance should be zero"
        );
    }

    function testExchangeLpFeesForPendleWithIncentive()
        public
        cheatSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        IERC20(AddressesMap[chainId].pendleTokenAddress).approve(
            address(controllerTester),
            type(uint256).max
        );

        uint256 feeShares = derivativeToken.balanceOf(
            address(controllerTester)
        );

        uint256 feeSharesB = derivativeTokenB.balanceOf(
            address(controllerTester)
        );

        assertGt(
            feeShares,
            0
        );

        assertGt(
            feeSharesB,
            0
        );

        (
            uint256 amountSent,
            uint256 receivedAmount
        ) = controllerTester.exchangeLpFeesForPendleWithIncentive(
            AddressesMap[chainId].PendleMarketStEth,
            feeShares
        );

        (
            uint256 amountSentB,
            uint256 receivedAmountB
        ) = controllerTester.exchangeLpFeesForPendleWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            feeSharesB
        );

        uint256 valueSent = wiseOracleHubInstance.getTokensInETH(
            AddressesMap[chainId].pendleTokenAddress,
            amountSent
        );

        uint256 valueSentB = wiseOracleHubInstance.getTokensInETH(
            AddressesMap[chainId].pendleTokenAddress,
            amountSentB
        );

        uint256 valueReceived = wiseOracleHubInstance.getTokensInETH(
            AddressesMap[chainId].PendleMarketStEth,
            receivedAmount
        );

        uint256 valueReceivedB = wiseOracleHubInstance.getTokensInETH(
            CRVUSD_PENDLE_28MAR_2024,
            receivedAmountB
        );

        assertGt(
            valueReceived,
            valueSent
        );

        assertGt(
            valueReceivedB,
            valueSentB
        );

        assertApproxEqRel(
            valueSent,
            valueReceived,
            NINTY_FOUR
        );

        assertApproxEqRel(
            valueSentB,
            valueReceivedB,
            NINTY_FOUR
        );
    }

    function testShouldNotBeAbleToExtractValueDuringCompoundOngoingByLooping()
        public
        cheatSetup(true)
    {
        (
            IERC20 tokenreceived,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            IERC20 tokenreceivedB,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        derivativeToken.depositExactAmount(
            1 ether
        );

        derivativeTokenB.depositExactAmount(
            1 ether
        );

        _simpleForwardTime();

        derivativeToken.depositExactAmount(
            1 ether
        );

        derivativeTokenB.depositExactAmount(
            1 ether
        );

        _getMaxPendleTokens();
        _getMaxCrvTokens();

        uint256 reservedForCompound = controllerTester.pendleChildCompoundInfoReservedForCompound(AddressesMap[chainId].PendleMarketStEth)[0];
        uint256 reservedForCompoundB = controllerTester.pendleChildCompoundInfoReservedForCompound(CRVUSD_PENDLE_28MAR_2024)[1];
        uint256 reservedForCompoundC = controllerTester.pendleChildCompoundInfoReservedForCompound(CRVUSD_PENDLE_28MAR_2024)[0];

        tokenreceived.approve(
            address(controllerTester),
            type(uint256).max
        );

        tokenreceivedB.approve(
            address(controllerTester),
            type(uint256).max
        );

        derivativeToken.withdrawExactShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            )
        );

        derivativeTokenB.withdrawExactShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            )
        );

        controllerTester.exchangeRewardsForCompoundingWithIncentive(
            AddressesMap[chainId].PendleMarketStEth,
            AddressesMap[chainId].pendleTokenAddress,
            reservedForCompound
        );

        controllerTester.exchangeRewardsForCompoundingWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            CRV_TOKEN_ADDRESS,
            reservedForCompoundC
        );

        controllerTester.exchangeRewardsForCompoundingWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            AddressesMap[chainId].pendleTokenAddress,
            reservedForCompoundB
        );

        uint256 depositAmount = 100 ether;
        uint256 depositAmountB = 210_000 ether;

        (
            uint256 receivedShares,
        ) = derivativeToken.depositExactAmount(
            depositAmount
        );

        (
            uint256 receivedSharesB,
        ) = derivativeTokenB.depositExactAmount(
            depositAmountB
        );

        vm.expectRevert(
            NotEnoughShares.selector
        );

        uint256 reducedShares = derivativeToken.withdrawExactAmount(
            depositAmount
        );

        vm.expectRevert(
            NotEnoughShares.selector
        );

        uint256 reducedSharesB = derivativeTokenB.withdrawExactAmount(
            depositAmountB
        );

        uint256 receivedAmount = derivativeToken.withdrawExactShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            )
        );

        uint256 receivedAmountB = derivativeTokenB.withdrawExactShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            )
        );

        assertGt(
            depositAmount,
            receivedAmount
        );

        assertGt(
            depositAmountB,
            receivedAmountB
        );

        assertApproxEqRel(
            depositAmount,
            receivedAmount,
            NINTY_NINE_POINT_SIX
        );

        assertApproxEqRel(
            depositAmountB,
            receivedAmountB,
            NINTY_NINE_POINT_SIX
        );

        assertEq(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            ),
            0
        );

        assertEq(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            ),
            0
        );

        (
            receivedShares,
        ) = derivativeToken.depositExactAmount(
            depositAmount
        );

        (
            receivedSharesB,
        ) = derivativeTokenB.depositExactAmount(
            depositAmountB
        );

        _simpleForwardTime();

        vm.expectRevert(
            NotEnoughShares.selector
        );

        reducedShares = derivativeToken.withdrawExactAmount(
            depositAmount
        );

        vm.expectRevert(
            NotEnoughShares.selector
        );

        reducedSharesB = derivativeTokenB.withdrawExactAmount(
            depositAmountB
        );

        receivedAmount = derivativeToken.withdrawExactShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            )
        );

        receivedAmountB = derivativeTokenB.withdrawExactShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            )
        );

        assertGt(
            depositAmount,
            receivedAmount
        );

        assertGt(
            depositAmountB,
            receivedAmountB
        );

        assertApproxEqRel(
            depositAmount,
            receivedAmount,
            NINTY_NINE_POINT_SIX
        );

        assertApproxEqRel(
            depositAmountB,
            receivedAmountB,
            NINTY_NINE_POINT_SIX
        );
    }

    function testRewardsShouldBeAccountedForAlmostExactlyIncludingVeBalanceInsideClaim()
        public
        cheatSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        _simpleForwardTime();

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        _simpleIndexCheckMulti();

        uint256 cashBalance = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        uint256 cashBalanceB = _balanceOf(
            CRV_TOKEN_ADDRESS,
            address(controllerTester)
        );

        uint256 cashReserved = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0]
            + controllerTester.pendleChildCompoundInfoReservedForCompound(
                CRVUSD_PENDLE_28MAR_2024
            )[1];

        uint256 cashReservedB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        assertGt(
            cashBalance,
            cashReserved,
            "cashBalance should be greater than cashReserved"
        );

        assertGt(
            cashBalanceB,
            cashReservedB,
            "cashBalanceB should be greater than cashReservedB"
        );

        assertApproxEqRel(
            cashBalance,
            cashReserved,
            NINTY_NINE_POINT_NINE,
            "cashBalance should be approximately equal to cashReserved"
        );

        assertApproxEqRel(
            cashBalanceB,
            cashReservedB,
            NINTY_NINE_POINT_NINE,
            "cashBalanceB should be approximately equal to cashReservedB"
        );
    }

    function testRewardsShouldBeAccountedForAlmostExactlyIncludingVeBalanceOutsideClaim()
        public
        cheatSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        IPendleMarket(AddressesMap[chainId].PendleMarketStEth).redeemRewards(
            address(controllerTester)
        );

        IPendleMarket(CRVUSD_PENDLE_28MAR_2024).redeemRewards(
            address(controllerTester)
        );

        _simpleForwardTime();

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        uint256 cashBalance = _balanceOf(
            AddressesMap[chainId].pendleTokenAddress,
            address(controllerTester)
        );

        uint256 cashBalanceB = _balanceOf(
            CRV_TOKEN_ADDRESS,
            address(controllerTester)
        );

        uint256 cashReserved = controllerTester.pendleChildCompoundInfoReservedForCompound(
            AddressesMap[chainId].PendleMarketStEth
        )[0]
            + controllerTester.pendleChildCompoundInfoReservedForCompound(
                CRVUSD_PENDLE_28MAR_2024
            )[1];

        uint256 cashReservedB = controllerTester.pendleChildCompoundInfoReservedForCompound(
            CRVUSD_PENDLE_28MAR_2024
        )[0];

        assertGt(
            cashBalance,
            cashReserved,
            "cashBalance should be greater than cashReserved"
        );

        assertGt(
            cashBalanceB,
            cashReservedB,
            "cashBalanceB should be greater than cashReservedB"
        );

        assertApproxEqRel(
            cashBalance,
            cashReserved,
            NINTY_NINE_POINT_NINE,
            "cashBalance should be approximately equal to cashReserved"
        );

        assertApproxEqRel(
            cashBalanceB,
            cashReservedB,
            NINTY_NINE_POINT_NINE,
            "cashBalanceB should be approximately equal to cashReservedB"
        );
    }

    function testRewardsAccumulateByForwardTimeAndBlock()
        public
        cheatSetup(true)
    {
        (
            ,
            IPendlePowerFarmToken derivativeToken,
        ) = _simpleDeposit(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB,
        ) = _simpleDeposit(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 maxWithdrawable = derivativeToken.previewAmountWithdrawShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            ),
            derivativeToken.previewUnderlyingLpAssets()
        );

        uint256 maxWithdrawableB = derivativeTokenB.previewAmountWithdrawShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            ),
            derivativeTokenB.previewUnderlyingLpAssets()
        );

        derivativeToken.withdrawExactAmount(
            maxWithdrawable
        );

        derivativeTokenB.withdrawExactAmount(
            maxWithdrawableB
        );

        _simpleForwardTime();

        assertEq(
            IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(
                address(controllerTester)
            ),
            0
        );

        assertEq(
            IERC20(CRV_TOKEN_ADDRESS).balanceOf(
                address(controllerTester)
            ),
            0
        );

        assertEq(
            controllerTester.pendleChildCompoundInfoReservedForCompound(
                AddressesMap[chainId].PendleMarketStEth
            )[0]
            + controllerTester.pendleChildCompoundInfoReservedForCompound(
                CRVUSD_PENDLE_28MAR_2024
            )[1],
            0
        );

        uint256 depositAmount = 1 ether;

        derivativeToken.depositExactAmount(
            depositAmount
        );

        derivativeTokenB.depositExactAmount(
            depositAmount
        );

        _simpleIndexCheckMulti();

        assertGt(
            IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(
            address(controllerTester)
            ),
            0
        );

        assertGt(
            IERC20(CRV_TOKEN_ADDRESS).balanceOf(
            address(controllerTester)
            ),
            0
        );

        assertGt(
            controllerTester.pendleChildCompoundInfoReservedForCompound(
                AddressesMap[chainId].PendleMarketStEth
            )[0]
            + controllerTester.pendleChildCompoundInfoReservedForCompound(
                CRVUSD_PENDLE_28MAR_2024
            )[1],
            0
        );

        assertGt(
            controllerTester.pendleChildCompoundInfoReservedForCompound(
                CRVUSD_PENDLE_28MAR_2024
            )[0],
            0
        );

        assertEq(
            controllerTester.pendleChildCompoundInfoReservedForCompound(
                AddressesMap[chainId].PendleMarketStEth
            )[0]
            + controllerTester.pendleChildCompoundInfoReservedForCompound(
                CRVUSD_PENDLE_28MAR_2024
            )[1],
            _balanceOf(
                AddressesMap[chainId].pendleTokenAddress,
                address(controllerTester)
            )
        );

        assertEq(
            controllerTester.pendleChildCompoundInfoReservedForCompound(
                CRVUSD_PENDLE_28MAR_2024
            )[0],
            IERC20(CRV_TOKEN_ADDRESS).balanceOf(
                address(controllerTester)
            )
        );
    }

    function testRewardIndexShouldNotChangeWhendepositOrWithdrawAndNoRewards()
        public
        cheatSetup(true)
    {
        _simpleIndexCheckMulti();

        (
            ,
            IPendlePowerFarmToken derivativeToken,
        ) = _simpleDeposit(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB,
        ) = _simpleDeposit(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        uint256 maxWithdrawable = derivativeToken.previewAmountWithdrawShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            ),
            derivativeToken.previewUnderlyingLpAssets()
        );

        uint256 maxWithdrawableB = derivativeTokenB.previewAmountWithdrawShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            ),
            derivativeTokenB.previewUnderlyingLpAssets()
        );

        derivativeToken.withdrawExactAmount(
            maxWithdrawable
        );

        derivativeTokenB.withdrawExactAmount(
            maxWithdrawableB
        );

        _simpleIndexCheckMulti();

        derivativeToken.depositExactAmount(
            maxWithdrawable
        );

        derivativeTokenB.depositExactAmount(
            maxWithdrawableB
        );

        _simpleIndexCheckMulti();

        uint256 remainingBalance = derivativeToken.balanceOf(
            wiseLendingInstance.master()
        );

        uint256 remainingBalanceB = derivativeTokenB.balanceOf(
            wiseLendingInstance.master()
        );

        IERC20(AddressesMap[chainId].PendleMarketStEth).transfer(
            stEthDec2025LP_WHALE,
            remainingBalance
        );

        IERC20(CRVUSD_PENDLE_28MAR_2024).transfer(
            crvUsdMar2024LP_WHALE,
            remainingBalanceB
        );

        _simpleIndexCheckMulti();

        vm.stopPrank();
        vm.startPrank(
            stEthDec2025LP_WHALE
        );

        IERC20(AddressesMap[chainId].PendleMarketStEth).approve(
            address(derivativeToken),
            remainingBalance
        );

        derivativeToken.depositExactAmount(
            remainingBalance
        );

        _simpleIndexCheckMulti();

        vm.stopPrank();
        vm.startPrank(
            crvUsdMar2024LP_WHALE
        );

        IERC20(CRVUSD_PENDLE_28MAR_2024).approve(
            address(derivativeTokenB),
            remainingBalanceB
        );

        derivativeTokenB.depositExactAmount(
            remainingBalanceB
        );

        _simpleIndexCheckMulti();
    }

    function testShouldWorkSmoothlyWhenExpired()
        public
        // cheatSetup(true)
    {
        // some reuse
        testShouldNotBeAbleToExtractValueDuringCompoundOngoingByLooping();

        (
            ,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        (
            ,
            IPendlePowerFarmToken derivativeTokenB
        ) = _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        vm.warp(
            block.timestamp + 8000 days
        );

        uint256 receiveAmount = derivativeToken.withdrawExactShares(
            derivativeToken.balanceOf(
                wiseLendingInstance.master()
            )
        );

        uint256 receiveAmountB = derivativeTokenB.withdrawExactShares(
            derivativeTokenB.balanceOf(
                wiseLendingInstance.master()
            )
        );

        assertGt(
            receiveAmount,
            0
        );

        assertGt(
            receiveAmountB,
            0
        );

        IERC20(AddressesMap[chainId].pendleTokenAddress).approve(
            address(controllerTester),
            type(uint256).max
        );

        uint256 feeShares = derivativeToken.balanceOf(
            address(controllerTester)
        );

        uint256 feeSharesB = derivativeTokenB.balanceOf(
            address(controllerTester)
        );

        assertGt(
            feeShares,
            0,
            "feeShares should be greater than zero"
        );

        assertGt(
            feeSharesB,
            0,
            "feeSharesB should be greater than zero"
        );

        controllerTester.exchangeLpFeesForPendleWithIncentive(
            AddressesMap[chainId].PendleMarketStEth,
            feeShares
        );

        controllerTester.exchangeLpFeesForPendleWithIncentive(
            CRVUSD_PENDLE_28MAR_2024,
            feeSharesB
        );

        assertGt(
            3,
            derivativeToken.previewUnderlyingLpAssets(),
            "previewUnderlyingLpAssets should be greater than 3"
        );

        assertGt(
            3,
            derivativeTokenB.previewUnderlyingLpAssets(),
            "previewUnderlyingLpAssetsB should be greater than 3"
        );

        assertEq(
            derivativeTokenB.totalLpAssetsToDistribute(),
            0,
            "totalLpAssetsToDistribute should be zero"
        );

        assertEq(
            derivativeToken.totalLpAssetsToDistribute(),
            0,
            "totalLpAssetsToDistribute should be zero"
        );

        assertEq(
            derivativeToken.totalSupply(),
            1,
            "totalSupply should be one"
        );

        assertEq(
            derivativeTokenB.totalSupply(),
            1,
            "totalSupply should be one"
        );

        controllerTester.withdrawLock();

        address eUsdMarket = 0x23aEfCeD9255aD3560CDaa4A10CbFe9EC230DC5A;

        vm.expectRevert(
            MarketExpired.selector
        );

        controllerTester.addPendleMarket(
            eUsdMarket,
            "name",
            "symbol",
            MAX_CARDINALITY
        );
    }

    function testFarmShouldEnterAndExitIntoTokenArb()
        public
        cheatSetup(false)
    {
        uint256 keyID = powerFarmManagerInstance.enterFarm(
            false,
            1 ether,
            15 ether,
            entrySpread
        );

        vm.stopPrank();

        vm.startPrank(
            address(1)
        );

        vm.deal(
            address(1),
            1000000000 ether
        );

        vm.expectRevert();

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );

        vm.stopPrank();

        vm.startPrank(
            wiseLendingInstance.master()
        );

        powerFarmManagerInstance.manuallyWithdrawShares(
            keyID,
            1
        );

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );

        vm.expectRevert();

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );
    }

    function _exitFarm(
        uint256 _keyID,
        uint256 _exitSpread,
        bool _isEth
    )
        internal
    {
        powerFarmManagerInstance.exitFarm(
            _keyID,
            _exitSpread,
            _isEth
        );

        vm.expectRevert();

        powerFarmManagerInstance.exitFarm(
            _keyID,
            _exitSpread,
            _isEth
        );
    }

    function _testFarmShouldEnterAndExitIntoToken()
        internal
    {
        uint256 keyID = powerFarmManagerInstance.enterFarm(
            false,
            1 ether,
            15 ether,
            entrySpread
        );

        _exitFarm(
            keyID,
            exitSpread,
            false
        );
    }

    function testFarmShouldEnterAndExitIntoToken()
        public
        cheatSetup(true)
    {
        _testFarmShouldEnterAndExitIntoToken();
    }

    function testFarmShouldEnterAndExitIntoTokenArbArb()
        public
        cheatSetup(false)
    {
        _testFarmShouldEnterAndExitIntoToken();
    }

    function _testFarmShouldEnterEthAndExitIntoEthAave()
        internal
    {
        _prepareAave();

        uint256 keyID = powerFarmManagerInstance.enterFarmETH{
            value: 1 ether
        }(true, 15 ether, entrySpread);

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            true
        );

        vm.expectRevert();

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );
    }

    function testFarmShouldEnterEthAndExitIntoEthAave()
        public
        cheatSetup(true)
    {
        _testFarmShouldEnterEthAndExitIntoEthAave();
    }

    function testFarmShouldEnterEthAndExitIntoEthAaveArb()
        public
        cheatSetup(false)
    {
        _testFarmShouldEnterEthAndExitIntoEthAave();
    }

    function _testFarmShouldEnterEthAndExitIntoAave()
        internal
    {
        _prepareAave();

        uint256 keyID = powerFarmManagerInstance.enterFarmETH{
            value: 1 ether
        }(true, 15 ether, entrySpread);

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );

        vm.expectRevert();

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );
    }

    function testFarmShouldEnterEthAndExitIntoAave()
        public
        cheatSetup(true)
    {
        _testFarmShouldEnterEthAndExitIntoAave();
    }

    function testFarmShouldEnterEthAndExitIntoAaveArb()
        public
        cheatSetup(false)
    {
        _testFarmShouldEnterEthAndExitIntoAave();
    }

    function _prepareAave()
        internal
    {
        deal(
            wiseLendingInstance.master(),
            1000000000 ether
        );

        IAaveHub(AddressesMap[chainId].aaveHub).depositExactAmountETHMint{
            value: 30 ether
        }();
    }

    function _testFarmShouldEnterAndExitIntoEthAave()
        internal
    {
         _prepareAave();

        uint256 keyID = powerFarmManagerInstance.enterFarm(
            true,
            1 ether,
            15 ether,
            entrySpread
        );

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );

        vm.expectRevert();

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            false
        );
    }

    function testFarmShouldEnterAndExitIntoEthAave()
        public
        cheatSetup(true)
    {
        _testFarmShouldEnterAndExitIntoEthAave();
    }

    function testFarmShouldEnterAndExitIntoEthAaveArb()
        public
        cheatSetup(false)
    {
        _testFarmShouldEnterAndExitIntoEthAave();
    }

    function _testFarmShouldEnterAaveAndExitIntoEthAave()
        internal
    {
        _prepareAave();

        uint256 keyID = powerFarmManagerInstance.enterFarm(
            true,
            1 ether,
            15 ether,
            entrySpread
        );

        _exitFarm(
            keyID,
            exitSpread,
            true
        );
    }

    function testFarmShouldEnterAaveAndExitIntoEthAave()
        public
        cheatSetup(true)
    {
        _testFarmShouldEnterAaveAndExitIntoEthAave();
    }

    function testFarmShouldEnterAaveAndExitIntoEthAaveArb()
        public
        cheatSetup(false)
    {
        _testFarmShouldEnterAaveAndExitIntoEthAave();
    }

    function _testFarmShouldEnterAndExitIntoEth()
        internal
    {
        uint256 keyID = powerFarmManagerInstance.enterFarm(
            false,
            1 ether,
            15 ether,
            entrySpread
        );

        uint256[] memory positionNfts = positionNftsInstance.walletOfOwner(
            address(powerFarmManagerInstance)
        );

        uint256 debtratio = powerFarmManagerInstance.getLiveDebtRatio(
            positionNfts[0]
        );

        assertGt(
            debtratio,
            0
        );

        assertGt(
            1 ether,
            debtratio
        );

        uint256 currentEthBal = wiseLendingInstance.master().balance;

        powerFarmManagerInstance.exitFarm(
            keyID,
            exitSpread,
            true
        );

        assertGt(
            wiseLendingInstance.master().balance,
            currentEthBal
        );

        debtratio = powerFarmManagerInstance.getLiveDebtRatio(
            positionNfts[0]
        );

        assertEq(
            debtratio,
            0
        );
    }

    function testFarmShouldEnterAndExitIntoEth()
        public
        cheatSetup(true)
    {
        _testFarmShouldEnterAndExitIntoEth();
    }

    function testFarmShouldEnterAndExitIntoEthArb()
        public
        cheatSetup(false)
    {
        _testFarmShouldEnterAndExitIntoEth();
    }

    function testMasterShouldbeAbleToChangeMintFee()
        cheatSetup(true)
        public
    {
        vm.stopPrank();
        vm.startPrank(
            randomUser
        );

        vm.expectRevert(
            NotMaster.selector
        );

        controllerTester.changeMintFee(
            AddressesMap[chainId].PendleMarketStEth,
            100
        );

        vm.expectRevert(
            NotMaster.selector
        );

        controllerTester.changeMintFee(
            ContractLibrary.CRVUSD_PENDLE_28MAR_2024,
            100
        );

        vm.stopPrank();
        vm.startPrank(
            wiseLendingInstance.master()
        );

        controllerTester.changeMintFee(
            AddressesMap[chainId].PendleMarketStEth,
            4000
        );

        controllerTester.changeMintFee(
            ContractLibrary.CRVUSD_PENDLE_28MAR_2024,
            4000
        );

        vm.expectRevert(
            WrongAddress.selector
        );

        controllerTester.changeMintFee(
            address(0),
            4000
        );
    }

    function testMintFeeMaximumShouldBeRespected()
        cheatSetup(true)
        public
    {
        vm.expectRevert(
            FeeTooHigh.selector
        );

        controllerTester.changeMintFee(
            AddressesMap[chainId].PendleMarketStEth,
            40001
        );

        vm.expectRevert(
            FeeTooHigh.selector
        );

        controllerTester.changeMintFee(
            ContractLibrary.CRVUSD_PENDLE_28MAR_2024,
            40000
        );
    }

    function testSyncAllSupplyShouldWorkEvenAfterExpiry()
        cheatSetup(true)
        public
    {
        _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        _prepareSimpleRewardsCheck(
            CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        vm.warp(
            block.timestamp + 8000 days
        );

        controllerTester.syncAllSupply();
    }

    function changingRewardTokensDoesntInterruptNormalUsage()
        cheatSetup(true)
        public
    {
        address[] memory newRewardArraySteth = new address[](1);
        newRewardArraySteth[0] = ContractLibrary.CRV_TOKEN_ADDRESS;
        address[] memory newRewardArrayCrvUsd = new address[](1);
        newRewardArrayCrvUsd[0] = AddressesMap[chainId].pendleTokenAddress;

        controllerTester.changeRewardTokenData(
            AddressesMap[chainId].PendleMarketStEth,
            newRewardArraySteth
        );

        controllerTester.changeRewardTokenData(
            ContractLibrary.CRVUSD_PENDLE_28MAR_2024,
            newRewardArrayCrvUsd
        );

        _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        _prepareSimpleRewardsCheck(
            ContractLibrary.CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        _simpleForwardTime();

        controllerTester.syncAllSupply();

        IPendleMarket(AddressesMap[chainId].PendleMarketStEth).redeemRewards(
            address(controllerTester)
        );

        IPendleMarket(ContractLibrary.CRVUSD_PENDLE_28MAR_2024).redeemRewards(
            address(controllerTester)
        );

        _prepareSimpleRewardsCheck(
            AddressesMap[chainId].PendleMarketStEth,
            stEthDec2025LP_WHALE
        );

        _prepareSimpleRewardsCheck(
            ContractLibrary.CRVUSD_PENDLE_28MAR_2024,
            crvUsdMar2024LP_WHALE
        );

        _simpleForwardTime();
        controllerTester.syncAllSupply();

        _simpleIndexCheckMulti();

        vm.warp(
            block.timestamp + 8000 days
        );

        controllerTester.syncAllSupply();

        _simpleIndexCheckMulti();
    }

    function _simpleForwardTime()
        internal
    {
        vm.warp(
            block.timestamp + 1 days
        );

        vm.roll(
            block.number + 100
        );
    }

    function _prepareSimpleRewardsCheck(
        address _market,
        address _whale
    )
        internal
        returns (
            IERC20,
            IPendlePowerFarmToken
        )
    {
        _getMaxPendleTokens();

        uint256 lockAmount = 1000 ether;

        IERC20(AddressesMap[chainId].pendleTokenAddress).approve(
            address(controllerTester),
            type(uint256).max
        );

        controllerTester.lockPendle(
            {
                _amount: lockAmount,
                _weeks: 52,
                _fromInside: false,
                _sameExpiry: false
            }
        );

        (
            IERC20 tokenReceived,
            IPendlePowerFarmToken derivativeToken,
        ) = _simpleDeposit(
            _market,
            _whale
        );

        _simpleForwardTime();

        return (
            tokenReceived,
            derivativeToken
        );
    }

    function _simpleIndexCheckMulti()
        internal
    {
        _simpleIndexCheck(
            AddressesMap[chainId].PendleMarketStEth,
            AddressesMap[chainId].pendleTokenAddress,
            0
        );

        _simpleIndexCheck(
            CRVUSD_PENDLE_28MAR_2024,
            CRV_TOKEN_ADDRESS,
            0
        );

        _simpleIndexCheck(
            CRVUSD_PENDLE_28MAR_2024,
            AddressesMap[chainId].pendleTokenAddress,
            1
        );
    }

    function _simpleIndexCheck(
        address _market,
        address _rewardToken,
        uint256 _index
    )
        internal
    {
        UserReward memory userReward = IPendleMarket(_market).userReward(
            _rewardToken,
            address(controllerTester)
        );

        uint128[] memory indexArray = controllerTester.pendleChildCompoundInfoLastIndex(
            _market
        );

        assertEq(
            userReward.accrued,
            0
        );

        assertEq(
            userReward.index,
            indexArray[_index]
        );
    }

    function _getMaxCrvTokens()
        internal
    {
        vm.stopPrank();
        vm.startPrank(
            CRV_WHALE
        );

        IERC20(CRV_TOKEN_ADDRESS).transfer(
            wiseLendingInstance.master(),
            IERC20(CRV_TOKEN_ADDRESS).balanceOf(
                CRV_WHALE
            )
        );

        vm.stopPrank();
        vm.startPrank(
            wiseLendingInstance.master()
        );
    }

    function _getMaxPendleTokens()
        internal
    {
        vm.stopPrank();
        vm.startPrank(
            PENDLE_WHALE
        );

        IERC20(AddressesMap[chainId].pendleTokenAddress).transfer(
            wiseLendingInstance.master(),
            IERC20(AddressesMap[chainId].pendleTokenAddress).balanceOf(
                PENDLE_WHALE
            )
        );

        vm.stopPrank();
        vm.startPrank(
            wiseLendingInstance.master()
        );
    }

    function _getTokensToPlayWith(
        address _market,
        address _whale
    )
        internal
        returns (
            IERC20,
            uint256
        )
    {
        vm.stopPrank();
        vm.startPrank(
            _whale
        );

        IERC20 pendleLpToken = IERC20(
            _market
        );

        pendleLpToken.transfer(
            wiseLendingInstance.master(),
            pendleLpToken.balanceOf(
                _whale
            )
        );

        vm.stopPrank();
        vm.startPrank(
            wiseLendingInstance.master()
        );

        uint256 balance = pendleLpToken.balanceOf(
            wiseLendingInstance.master()
        );

        assertGt(
            balance,
            0
        );

        return (
            pendleLpToken,
            balance
        );
    }

    function _prepareDeposit(
        address _pendleMarket,
        IERC20 _tokenReceived,
        uint256 _balanceReceived
    )
        internal
        returns (
            uint256,
            IPendlePowerFarmToken
        )
    {
        address derivativeTokenAddress = controllerTester.pendleChildAddress(
            _pendleMarket
        );

        IPendlePowerFarmToken derivativeToken = IPendlePowerFarmToken(
            derivativeTokenAddress
        );

        _tokenReceived.approve(
            derivativeTokenAddress,
            type(uint256).max
        );

        uint256 depositAmount = _balanceReceived
            / 10;

        return (
            depositAmount,
            derivativeToken
        );
    }

    function _simpleDeposit(
        address _market,
        address _whale
    )
        internal
        returns (
            IERC20,
            IPendlePowerFarmToken,
            uint256
        )
    {
        (
            IERC20 tokenReceived,
            uint256 balanceReceived
        ) = _getTokensToPlayWith(
            _market,
            _whale
        );

        (
            uint256 depositAmount,
            IPendlePowerFarmToken derivativeToken
        ) = _prepareDeposit(
            _market,
            tokenReceived,
            balanceReceived
        );

        derivativeToken.depositExactAmount(
            depositAmount
        );

        return (
            tokenReceived,
            derivativeToken,
            depositAmount
        );
    }

    function _balanceOf(
        address _token,
        address _account
    )
        internal
        view
        returns (
            uint256
        )
    {
        return IERC20(_token).balanceOf(
            _account
        );
    }
}
