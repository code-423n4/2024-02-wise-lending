const WstETHOracle = artifacts.require("WstETHOracle");
const MooDerivativeOracle = artifacts.require("MooOracleCurve");
const WBTCOracle = artifacts.require("WBTCOracle");

const OracleHub = artifacts.require("TesterWiseOracleHub");
const Liquidation = artifacts.require("WiseLiquidation");
const FeeManager = artifacts.require("FeeManager");
const WiseSecuirty = artifacts.require("WiseSecurity");
const PositionNFT = artifacts.require("PositionNFTs");
const Lending = artifacts.require("TesterLending");
const AaveSecondLayer = artifacts.require("AaveHub");
const CurvePool = artifacts.require("ICurve");

const helpers = require("@nomicfoundation/hardhat-network-helpers");

const Token = artifacts.require("Token");
const IWETH = artifacts.require("IWETH")

const TriCryptoPool = artifacts.require("ITriCrypto");
const Moo = artifacts.require("IMooTokenVault");

const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');

require("./utils");
require("./test-scenarios");
require("./constants.js");


// const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');

const BTC_FEED_ADDRESS = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
const WBTC_FEED_ADDRESS = "0xfdFD9C85aD200c506Cf9e21F1FD8dd01932FBB23";

const WST_ETH_ADDRESS = "0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0";
const ST_ETH_FEED = "0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8"

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const WBTC_ADDRESS = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const MIM_ADDRESS = "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

const TRI_USDC_POOL = "0x7F86Bf177Dd4F3494b841a37e810A34dD56c829B"; // Combined with Lp token!
const TRI_USDT_POOL = "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46";
const TRI_USDT_LP = "0xc4AD29ba4B3c580e6D59105FFf484999997675Ff";

const CURVE_POOL_ADDRESS_MIM = "0x5a6a4d54456819380173272a5e8e9b9904bdf41b";
const CURVE_META_POOL_ADDRESS = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";

const CURVE_META_LP_TOKEN_ADD = "0x6c3f90f043a72fa612cbac8115ee7e52bde6e490";
const MIM3CRV_WRAPPER_ADD = "0xA79828DF1850E8a3A3064576f380D90aECDD3359";

const MOO_TRI_USDC = "0xD1BeaD7CadcCC6b6a715A6272c39F1EC54F6EC99";
const MOO_TRI_USDT = "0xe50e2fe90745A8510491F89113959a1EF01AD400";
const MOO_MIM3CRV_ADD = "0xd5bAd7c89028B3F7094e40DcCe83D4e6b3Fd9AA4";

const FEED_USDC = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
const FEED_USDT = "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D";
const FEED_WETH = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419";
const FEED_WBTC = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c";
const FEED_DAI = "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
const FEED_MIM = "0x7A364e8770418566e3eb2001A96116E6138Eb32F";

const MEGA_WHALE = "0x55FE002aefF02F77364de339a1292923A15844B8";
const USDT_WHALE = "0x641AD78BAca220C5BD28b51Ce8e0F495e85Fe689";

const BOUND = 120;

const UNI_FACTORY = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

contract("Derivative Oracle tests", async accounts => {

    const [owner,alice] = accounts;

    let MIM;
    let DAI;
    let USDC;
    let WETH;
    let MOO_USDT;
    let MOO_USDC;
    let MOO_MIM3CRV;
    let TRI_POOL_USDT;
    let TRI_LP_USDT;
    let TRI_POOL_USDC;
    let MIM3CRV_POOL;
    let MIM3CRV_WRAPPER;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

    setUpContractsAndOracle = async () => {

        const contracts = await setUpContracts(
            {
                OracleHub: OracleHub,
                Lending: Lending,
                Liquidation: Liquidation,
                FeeManager: FeeManager,
                WiseSecurity: WiseSecuirty,
                PositionNFT: PositionNFT,
                AaveHub: AaveSecondLayer,
                owner: owner,
                gouvernance: owner,
                borrowCap: toWei("1")
            }
        );

        await contracts.oracleHub.addOracleBulk(
            [
                WETH_ADDRESS,
                WBTC_ADDRESS,
                USDC_ADDRESS,
                USDT_ADDRESS,
                MIM_ADDRESS,
                DAI_ADDRESS
            ],
            [
                FEED_WETH,
                FEED_WBTC,
                FEED_USDC,
                FEED_USDT,
                FEED_MIM,
                FEED_DAI
            ],
            [
                [], [], [], [], [], []
            ]
        );

        await contracts.oracleHub.recalibrateBulk(
            [
                WETH_ADDRESS,
                WBTC_ADDRESS,
                USDC_ADDRESS,
                USDT_ADDRESS,
                MIM_ADDRESS,
                DAI_ADDRESS
            ]
        );

        return contracts;
    }

    setUpTriCryptoUSDTOracle = async (_oracleHub) => {

        const deviation = toWei("300");

        const curveInterfaces = {
            curvePool: TRI_USDT_POOL,
            curveLPToken: TRI_USDT_LP,
            curveSecondLayerPool: ZERO_ADDRESS,
            curveSecondLayerToken: ZERO_ADDRESS
        }

        const virtualTokenETHT = [
            USDT_ADDRESS,
            WBTC_ADDRESS,
            WETH_ADDRESS
        ];

        const oracleTriUSDT = await MooDerivativeOracle.new(
            curveInterfaces,
            MOO_TRI_USDT,
            virtualTokenETHT,
            deviation,
            3,
            0,
            _oracleHub.address
        );

        await _oracleHub.addOracle(
            MOO_TRI_USDT,
            oracleTriUSDT.address,
            virtualTokenETHT
        );
    }

    setUpTriCryptoUSDCOracle = async (_oracleHub) => {

        const deviation = toWei("300");

        const curveInterfaces = {
            curvePool: TRI_USDC_POOL,
            curveLPToken: TRI_USDC_POOL,
            curveSecondLayerPool: ZERO_ADDRESS,
            curveSecondLayerToken: ZERO_ADDRESS
        }

        const virtualTokenETHC = [
            USDC_ADDRESS,
            WBTC_ADDRESS,
            WETH_ADDRESS
        ];

        const oracleTriUSDC = await MooDerivativeOracle.new(
            curveInterfaces,
            MOO_TRI_USDC,
            virtualTokenETHC,
            deviation,
            3,
            0,
            _oracleHub.address
        );

        await _oracleHub.addOracle(
            MOO_TRI_USDC,
            oracleTriUSDC.address,
            virtualTokenETHC
        );
    }

    setUpMim3CrvOracle = async (_oracleHub) => {

        const deviation = toWei("300");

        const CurveInterfaces = {
            curvePool: CURVE_POOL_ADDRESS_MIM,
            curveLPToken: CURVE_POOL_ADDRESS_MIM,
            curveSecondLayerPool: CURVE_META_POOL_ADDRESS,
            curveSecondLayerToken: CURVE_META_LP_TOKEN_ADD
        }

        const virtualTokenMIM = [
            MIM_ADDRESS,
            DAI_ADDRESS,
            USDC_ADDRESS,
            USDT_ADDRESS
        ];

        const oracleMim3Crv = await MooDerivativeOracle.new(
            CurveInterfaces,
            MOO_MIM3CRV_ADD,
            virtualTokenMIM,
            deviation,
            2,
            3,
            _oracleHub.address
        );

        await _oracleHub.addOracle(
            MOO_MIM3CRV_ADD,
            oracleMim3Crv.address,
            virtualTokenMIM
        );

        return oracleMim3Crv;
    }

    swapBytesTriPool = (_from, _to, _swapSize) => {
        return web3.eth.abi.encodeFunctionCall(
            {
                name: 'exchange',
                type: 'function',
                inputs: [
                    {
                        type: 'uint256',
                        name: 'i'
                    },
                    {
                        type: 'uint256',
                        name: 'j'
                    },
                    {
                        type: 'uint256',
                        name: 'dx'
                    },
                    {
                        type: 'uint256',
                        name: 'min_dy'
                    },
                    {
                        type: 'bool',
                        name: 'use_eth'
                    }
                ]
            },
            [_from.toString(), _to.toString(), _swapSize.toString(), "0", false]
        );
        // 100000000000 per security swap allows 10^7 swaps when security is filled with 1 ETH
    }

    swapBytesMimPool = (_from, _to, _fromM, _toM, _swapSize, _swapSizeM) => {
        const exchangeBytes = web3.eth.abi.encodeFunctionCall(
            {
                name: 'exchange',
                type: 'function',
                inputs: [
                    {
                        type: 'int128',
                        name: 'i'
                    },
                    {
                        type: 'int128',
                        name: 'j'
                    },
                    {
                        type: 'uint256',
                        name: 'dx'
                    },
                    {
                        type: 'uint256',
                        name: 'min_dy'
                    }
                ]
            },
            [_from.toString(), _to.toString(), _swapSize.toString(), "0"]
        );

        const exchangeMetaBytes = web3.eth.abi.encodeFunctionCall(
            {
                name: 'exchange',
                type: 'function',
                inputs: [
                    {
                        type: 'int128',
                        name: 'i'
                    },
                    {
                        type: 'int128',
                        name: 'j'
                    },
                    {
                        type: 'uint256',
                        name: 'dx'
                    },
                    {
                        type: 'uint256',
                        name: 'min_dy'
                    }
                ]
            },
            [_fromM.toString(), _toM.toString(), _swapSizeM.toString(), "0"]
        );

        return {
            normal: exchangeBytes,
            meta: exchangeMetaBytes
        }
    }

    decodeParameters = (_data) => {

        const slicedData = ethers.utils.hexDataSlice(
            _data,
            4
        );

        return web3.eth.abi.decodeParameters(
            [
                'uint256',
                'uint256',
                'uint256',
                'uint256',
                'bool'

            ],
            slicedData
        );
    }

    describe("Onchain WBTC oracle tests", () => {

        it("WBTC oracle gives reasonable WETH value", async () => {

            const wbtcOracle = await WBTCOracle.new(
                BTC_FEED_ADDRESS,
                WBTC_FEED_ADDRESS
            );

            const ethValue = await wbtcOracle.latestAnswer();

            debug("ethValue", ethValue);
        });
    });

    describe("Onchain WstETH oracle tests", () => {

        it("WstETH oracle gives reasonable value for price and heartbeat", async () => {

            const heartBeatChainlink = 3600;
            const amount = toWei("15");
            const oracleHub = await OracleHub.new(
                WETH_ADDRESS,
                FEED_WETH,
                UNI_FACTORY
            );

            const wStETHOracle = await WstETHOracle.new(
                WST_ETH_ADDRESS,
                ST_ETH_FEED
            );

            const value = await wStETHOracle.latestAnswer();

            assert.isAbove(
                parseInt(value),
                parseInt(0)
            );

            await oracleHub.addOracle(
                WST_ETH_ADDRESS,
                wStETHOracle.address,
                []
            );

            await oracleHub.recalibrate(
                WST_ETH_ADDRESS
            );

            const heartbeat = await oracleHub.heartBeat(
                WST_ETH_ADDRESS
            );

            const diff = Bi(heartbeat)
                - Bi(heartBeatChainlink);

            const diffBool = abs(diff) < BOUND;

            assert.equal(
                diffBool.toString(),
                "true"
            );

            const tokenETH = await oracleHub.getTokensInETH(
                WST_ETH_ADDRESS,
                amount
            );

            assert.isAbove(
                parseInt(tokenETH),
                parseInt(0)
            );

            const answerTwo = await wStETHOracle.latestRoundData();

            assert.equal(
                answerTwo[1].toString(),
                value.toString()
            );
        });
    });

    describe.skip("Onchain TriCrypto oracle tests", () => { // REASON FOR SKIP: STILL EXPECTS USD VALUES

        it("TriCryptoUSDC oracle gives reasonable value for price", async () => {

            const deviation = toWei("300");
            const originalPriceRefValueUsd = toWei("50000");
            const oracleHub = await OracleHub.new(
                WETH_ADDRESS,
                FEED_WETH,
                UNI_FACTORY
            );

            await oracleHub.addOracleBulk(
                [
                    WETH_ADDRESS,
                    WBTC_ADDRESS,
                    USDC_ADDRESS,
                    USDT_ADDRESS
                ],
                [
                    FEED_WETH,
                    FEED_WBTC,
                    FEED_USDC,
                    FEED_USDT
                ],
                [
                    [], [], [], []
                ]
            );

            const curveInterfaces = {
                curvePool: TRI_USDC_POOL,
                curveLPToken: TRI_USDC_POOL,
                curveSecondLayerPool: ZERO_ADDRESS,
                curveSecondLayerToken: ZERO_ADDRESS
            }

            const virtualTokenETHC = [
                USDC_ADDRESS,
                WBTC_ADDRESS,
                WETH_ADDRESS
            ];

            const oracleTriUSDC = await MooDerivativeOracle.new(
                curveInterfaces,
                MOO_TRI_USDC,
                virtualTokenETHC,
                deviation,
                3,
                0,
                oracleHub.address
            );

            await oracleHub.addOracle(
                MOO_TRI_USDC,
                oracleTriUSDC.address,
                virtualTokenETHC
            );

            await oracleHub.recalibrateBulk(
                virtualTokenETHC
            );

            const answer = await oracleHub.latestResolver(
                MOO_TRI_USDC
            );

            assert.isAbove(
                parseInt(answer),
                parseInt(0)
            );

            debug("answer",answer);

            const newPriceRefValueUsd = toWei("1");
            const newDeviationTolerance = toWei("0.001");

            await expectRevert(
                oracleTriUSDC.changeLowLiquidityCheckVariables(
                    newPriceRefValueUsd,
                    newDeviationTolerance,
                    {
                        from: alice
                    }
                ),
                "NotMaster()"
            );

            await oracleTriUSDC.changeLowLiquidityCheckVariables(
                newPriceRefValueUsd,
                newDeviationTolerance
            );

            const checkedPriceRefValueUSD = await oracleTriUSDC.priceRefValueUsd();
            const checkedDeviationTolerance = await oracleTriUSDC.deviationTolerance();

            assert.equal(
                checkedPriceRefValueUSD.toString(),
                newPriceRefValueUsd.toString()
            );

            assert.equal(
                checkedDeviationTolerance.toString(),
                newDeviationTolerance.toString()
            );

            await expectRevert.unspecified(
                oracleHub.latestResolver(
                    MOO_TRI_USDT
                )
            );

            await expectRevert.unspecified(
                oracleTriUSDC.latestRoundData()
            );

            await oracleTriUSDC.changeLowLiquidityCheckVariables(
                originalPriceRefValueUsd,
                deviation
            );

            await oracleHub.latestResolver(
                MOO_TRI_USDC
            );

            await oracleTriUSDC.latestRoundData();
        });

        it("TriCryptoUSDT oracle gives reasonable value for price", async () => {

            const deviation = toWei("250");
            const oracleHub = await OracleHub.new(
                WETH_ADDRESS,
                FEED_WETH,
                UNI_FACTORY
            );

            const originalPriceRefValueUsd = toWei("50000");

            await oracleHub.addOracleBulk(
                [
                    WETH_ADDRESS,
                    WBTC_ADDRESS,
                    USDC_ADDRESS,
                    USDT_ADDRESS
                ],
                [
                    FEED_WETH,
                    FEED_WBTC,
                    FEED_USDC,
                    FEED_USDT
                ],
                [
                    [],
                    [],
                    [],
                    []
                ]
            );

            const curveInterfaces = {
                curvePool: TRI_USDT_POOL,
                curveLPToken: TRI_USDT_LP,
                curveSecondLayerPool: ZERO_ADDRESS,
                curveSecondLayerToken: ZERO_ADDRESS
            }

            const virtualTokenETHT = [
                USDT_ADDRESS,
                WBTC_ADDRESS,
                WETH_ADDRESS
            ];

            const oracleTriUSDT = await MooDerivativeOracle.new(
                curveInterfaces,
                MOO_TRI_USDT,
                virtualTokenETHT,
                deviation,
                3,
                0,
                oracleHub.address
            );

            await oracleHub.addOracle(
                MOO_TRI_USDT,
                oracleTriUSDT.address,
                virtualTokenETHT
            );

            await oracleHub.recalibrateBulk(
                virtualTokenETHT
            );

            const answer = await oracleHub.latestResolver(
                MOO_TRI_USDT
            );

            assert.isAbove(
                parseInt(answer),
                parseInt(0)
            );

            debug("answer",answer);

            const newPriceRefValueUsd = toWei("1");
            const newDeviationTolerance = toWei("0.001");

            await expectRevert(
                    oracleTriUSDT.changeLowLiquidityCheckVariables(
                        newPriceRefValueUsd,
                        newDeviationTolerance,
                        {
                            from: alice
                        }
                    ),
                    "NotMaster()"
            );

            await oracleTriUSDT.changeLowLiquidityCheckVariables(
                newPriceRefValueUsd,
                newDeviationTolerance
            );

            const checkedPriceRefValueUSD = await oracleTriUSDT.priceRefValueUsd();
            const checkedDeviationTolerance = await oracleTriUSDT.deviationTolerance();

            assert.equal(
                checkedPriceRefValueUSD.toString(),
                newPriceRefValueUsd.toString()
            );

            assert.equal(
                checkedDeviationTolerance.toString(),
                newDeviationTolerance.toString()
            );

            await expectRevert.unspecified(
                oracleHub.latestResolver(
                    MOO_TRI_USDT
                )
            );

            await expectRevert.unspecified(
                oracleTriUSDT.latestRoundData()
            );

            await oracleTriUSDT.changeLowLiquidityCheckVariables(
                originalPriceRefValueUsd,
                deviation
            );

            await oracleHub.latestResolver(
                MOO_TRI_USDT
            );

            await oracleTriUSDT.latestRoundData();

        });
    });

    describe.skip("CurveSecurity swap tests", () => { // REASON FOR SKIP: STILL EXPECTS USD VALUES

        beforeEach(async () => {

            MOO_USDT = await Moo.at(
                MOO_TRI_USDT
            );

            MOO_USDC = await Moo.at(
                MOO_TRI_USDC
            );

            MOO_MIM3CRV = await Moo.at(
                MOO_MIM3CRV_ADD
            );

            WETH = await IWETH.at(
                WETH_ADDRESS
            );

            MIM = await Token.at(
                MIM_ADDRESS
            );

            USDC = await Token.at(
                USDC_ADDRESS
            );

            USDT = await Token.at(
                USDT_ADDRESS
            );

            DAI = await Token.at(
                DAI_ADDRESS
            );

            TRI_POOL_USDT = await TriCryptoPool.at(
                TRI_USDT_POOL
            )

            TRI_LP_USDT = await Token.at(
                TRI_USDT_LP
            );

            TRI_POOL_USDC = await TriCryptoPool.at(
                TRI_USDC_POOL
            );

            MIM3CRV_POOL = await CurvePool.at(
                CURVE_POOL_ADDRESS_MIM
            );

            MIM3CRV_WRAPPER = await CurvePool.at(
                MIM3CRV_WRAPPER_ADD
            );

            await getTokenFromWhale(
                {
                    Token: Token,
                    Helpers: helpers,
                    Web3: web3,
                    Ethers: ethers,
                    whaleAddress: MEGA_WHALE,
                    user: owner,
                    tokenAddress: USDC
                }
            );

            await WETH.approve(
                TRI_POOL_USDT.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await WETH.approve(
                TRI_POOL_USDC.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await TRI_LP_USDT.approve(
                MOO_USDT.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await TRI_POOL_USDC.approve(
                MOO_USDC.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await USDC.approve(
                MIM3CRV_WRAPPER_ADD,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await MIM3CRV_POOL.approve(
                MOO_MIM3CRV.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );
        });

        it("Curve Tri USDT creation and security swap works correctly", async () => {

            const swapSize = 5;

            const swapBytes = swapBytesTriPool(
                0,
                2,
                swapSize
            );

            const contracts = await setUpContractsAndOracle();

            await setUpTriCryptoUSDTOracle(
                contracts.oracleHub
            );

            const securityStruct = {
                curvePoolTokenIndexFrom: 0,
                curvePoolTokenIndexTo: 2,
                curveMetaPoolTokenIndexFrom: 0,
                curveMetaPoolTokenIndexTo: 0
            };

            const securityStructData = {
                curvePool: TRI_USDT_POOL, // 0xD51a44d3FaE010294C616388b506AcdA1bfAAE46
                curveMetaPool: ZERO_ADDRESS, // 0x0000000000000000000000000000000000000000
                swapBytesPool: swapBytes, // 0x394747c500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000500000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000
                swapBytesMeta: []
            }

            await contracts.lending.createCurvePool(
                {
                    allowBorrow: false,
                    poolToken: MOO_TRI_USDT, // 0xe50e2fe90745A8510491F89113959a1EF01AD400
                    poolMulFactor: toWei("1"), // 1000000000000000000
                    poolCollFactor: toWei("0.6"), // for mainnet: 0.73 (730000000000000000)
                    maxDepositAmount: HUGE_AMOUNT // 120000000000000000000000
                },
                {
                    curveSecuritySwapsToken: securityStruct,
                    curveSecuritySwapsData: securityStructData
                }
            );

            await getTokenFromWhale(
                {
                    Token: Token,
                    Helpers: helpers,
                    Web3: web3,
                    Ethers: ethers,
                    whaleAddress: USDT_WHALE,
                    user: owner,
                    tokenAddress: USDT
                }
            );

            const USDT_TRANSFER_AMOUNT = 10000;

            await USDT.transfer(
                contracts.security.address,
                USDT_TRANSFER_AMOUNT
            );

            await USDT.approve(
                TRI_POOL_USDT.address,
                toWei("100")
            );

            await TRI_POOL_USDT.add_liquidity(
                [
                    USDT_TRANSFER_AMOUNT,
                    0,
                    0,
                ],
                0,
                {
                    from: owner
                }
            );

            await MOO_USDT.depositAll();

            const balMoo = await MOO_USDT.balanceOf(
                owner
            );

            await MOO_USDT.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            const balContractBefore = await USDT.balanceOf(
                contracts.security.address
            );

            await contracts.lending.depositExactAmountMint(
                MOO_USDT.address,
                balMoo
            );

            const balContractAfter = await USDT.balanceOf(
                contracts.security.address
            );

            const diff = Bi(balContractBefore)
                - Bi(balContractAfter);

            assert.equal(
                diff.toString(),
                swapSize.toString()
            );

            await contracts.nft.mintPosition();

            const nftOwner = await contracts.nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            // how to check if owner has NFT even if its reserved
            // ownersNFTS = [0,1,2] [1,2] [0]
            /*const ownersNFTS = await contracts.nft.walletOfOwner(
                owner
            );

            //
            const hasNFTId0 = ownersNFTS.includes(
                0
            );

            assert.equal(
                hasNFTId0,
                true
            );
            */

            const collatETH = await contracts.security.overallETHCollateralsWeighted(
                nftOwner
            );

            assert.isAbove(
                parseInt(collatETH),
                parseInt(0)
            );
        });

        it("Curve Tri USDC creation and security swap works correctly", async () => {

            const swapSize = 5;

            const swapBytes = swapBytesTriPool(
                0,
                2,
                swapSize
            );

            const contracts = await setUpContractsAndOracle();

            await setUpTriCryptoUSDCOracle(
                contracts.oracleHub
            );

            const securityStruct = {
                curvePoolTokenIndexFrom: 0,
                curvePoolTokenIndexTo: 2,
                curveMetaPoolTokenIndexFrom: 0,
                curveMetaPoolTokenIndexTo: 0
            };

            const securityStructData = {
                curvePool: TRI_USDC_POOL,
                curveMetaPool: ZERO_ADDRESS,
                swapBytesPool: swapBytes,
                swapBytesMeta: []
            }

            await contracts.lending.createCurvePool(
                {
                    allowBorrow: false,
                    poolToken: MOO_TRI_USDC,
                    poolMulFactor: toWei("1"),
                    poolCollFactor: toWei("0.6"),
                    maxDepositAmount: HUGE_AMOUNT
                },
                {
                    curveSecuritySwapsData: securityStructData,
                    curveSecuritySwapsToken: securityStruct
                }
            );

            const USDC_TRANSFER_AMOUNT = 10000;

            await USDC.approve(
                TRI_POOL_USDC.address,
                toWei("100")
            );

            await TRI_POOL_USDC.add_liquidity(
                [
                    USDC_TRANSFER_AMOUNT,
                    0,
                    0
                ],
                0,
                {
                    from: owner
                }
            );

            await USDC.transfer(
                contracts.security.address,
                USDC_TRANSFER_AMOUNT
            );

            await MOO_USDC.depositAll();

            const balMoo = await MOO_USDC.balanceOf(
                owner
            );

            await MOO_USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            const balContractBefore = await USDC.balanceOf(
                contracts.security.address
            );

            await contracts.lending.depositExactAmountMint(
                MOO_USDC.address,
                balMoo
            );

            const balContractAfter = await USDC.balanceOf(
                contracts.security.address
            );

            const diff = Bi(balContractBefore)
                - Bi(balContractAfter);

            assert.equal(
                diff.toString(),
                swapSize.toString()
            );

            await contracts.nft.mintPosition();

            const nftOwner = await contracts.nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            const collatETH = await contracts.security.overallETHCollateralsWeighted(
                nftOwner
            );

            assert.isAbove(
                parseInt(collatETH),
                parseInt(0)
            );
        });

        it("Curve Mim3Crv creation and security swap works correctly", async () => {

            const depositAmount = pow6(1000);
            const securitySwapAmount = pow6(50);

            const swapSize = 5;

            const liquIndexMIM = 0;
            const liquIndex3Crv = 1;
            const liquIndexDAI3Crv = 0;
            const liquIndexUSDC3Crv = 2;

            const hexData = swapBytesMimPool(
                liquIndexMIM,
                liquIndex3Crv,
                liquIndexDAI3Crv,
                liquIndexUSDC3Crv,
                swapSize,
                swapSize
            );

            const swapBytes = hexData.normal;
            const swapMetaBytes = hexData.meta;

            const contracts = await setUpContractsAndOracle();

            const mimOracle = await setUpMim3CrvOracle(
                contracts.oracleHub
            );

            const securityStruct = {
                curvePoolTokenIndexFrom: liquIndexMIM,              // MIM
                curvePoolTokenIndexTo: liquIndex3Crv,               // 3Crv LP
                curveMetaPoolTokenIndexFrom: liquIndexDAI3Crv,      // DAI inside 3Crv
                curveMetaPoolTokenIndexTo: liquIndexUSDC3Crv        // USDT inside 3Crv
            };

            const securityStructData = {
                curvePool: CURVE_POOL_ADDRESS_MIM,
                curveMetaPool: CURVE_META_POOL_ADDRESS,
                swapBytesPool: swapBytes,
                swapBytesMeta: swapMetaBytes
            }

            await contracts.lending.createCurvePool(
                {
                    allowBorrow: true,
                    poolToken: MOO_MIM3CRV_ADD,
                    poolMulFactor: toWei("1"),
                    poolCollFactor: toWei("0.6"),
                    maxDepositAmount: HUGE_AMOUNT
                },
                {
                    curveSecuritySwapsData: securityStructData,
                    curveSecuritySwapsToken: securityStruct
                }
            );

            await USDC.approve(
                MIM3CRV_POOL.address,
                HUGE_AMOUNT
            );

            const swapIndexMIM = 0;
            const swapIndexDAI = 1;
            const swapIndexUSDC = 2;

            await MIM3CRV_POOL.exchange_underlying(
                swapIndexUSDC,
                swapIndexMIM,
                securitySwapAmount,
                0
            );

            await MIM3CRV_POOL.exchange_underlying(
                swapIndexUSDC,
                swapIndexDAI,
                securitySwapAmount,
                0
            );

            const balMim = await MIM.balanceOf(
                owner
            );

            const balDai = await DAI.balanceOf(
                owner
            );

            await DAI.transfer(
                contracts.security.address,
                balDai,
                {
                    from: owner
                }
            );

            await MIM.transfer(
                contracts.security.address,
                balMim,
                {
                    from: owner
                }
            );

            await MIM3CRV_WRAPPER.add_liquidity(
                CURVE_POOL_ADDRESS_MIM,
                [
                    0,
                    0,
                    depositAmount,
                    0
                ],
                0
            );

            await MOO_MIM3CRV.depositAll();

            const balMoo = await MOO_MIM3CRV.balanceOf(
                owner
            );

            await MOO_MIM3CRV.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            const balMimBefore = await MIM.balanceOf(
                contracts.security.address
            );

            const balDaiBefore = await DAI.balanceOf(
                contracts.security.address
            );

            await contracts.lending.depositExactAmountMint(
                MOO_MIM3CRV.address,
                balMoo,
                {
                    from: owner
                }
            );

            const balMimAfter = await MIM.balanceOf(
                contracts.security.address
            );

            const balDaiAfter = await DAI.balanceOf(
                contracts.security.address
            );

            const diffMim = Bi(balMimBefore)
                - Bi(balMimAfter);

            const diffDai = Bi(balDaiBefore)
                - Bi(balDaiAfter);

            assert.equal(
                diffMim.toString(),
                swapSize.toString(),
            );

            assert.equal(
                diffDai.toString(),
                swapSize.toString(),
            );

            await contracts.nft.mintPosition();

            const nftOwner = await contracts.nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            const collatETH = await contracts.security.overallETHCollateralsWeighted(
                nftOwner
            );

            assert.isAbove(
                parseInt(collatETH),
                parseInt(0)
            );

            const newPriceRefValueUsd = toWei("1");
            const newDeviationTolerance = toWei("0.00001");

            await expectRevert(
                mimOracle.changeLowLiquidityCheckVariables(
                    newPriceRefValueUsd,
                    newDeviationTolerance,
                    {
                        from: alice
                    }
                ),
                "NotMaster()"
            );

            await mimOracle.changeLowLiquidityCheckVariables(
                newPriceRefValueUsd,
                newDeviationTolerance
            );

            const checkedPriceRefValueUSD = await mimOracle.priceRefValueUsd();
            const checkedDeviationTolerance = await mimOracle.deviationTolerance();

            assert.equal(
                checkedPriceRefValueUSD.toString(),
                newPriceRefValueUsd.toString()
            );

            assert.equal(
                checkedDeviationTolerance.toString(),
                newDeviationTolerance.toString()
            );

            await expectRevert.unspecified(
                contracts.oracleHub.latestResolver(
                    MOO_MIM3CRV.address
                )
            );

            await expectRevert.unspecified(
                mimOracle.latestRoundData()
            );

            const originalPriceRefValueUsd = toWei("50000");
            const deviation = toWei("300");

            await mimOracle.changeLowLiquidityCheckVariables(
                originalPriceRefValueUsd,
                deviation
            );

            await contracts.oracleHub.latestResolver(
                MOO_MIM3CRV.address
            );

            await mimOracle.latestRoundData();
        });

        it("Both pools (Mim and Tri) exists parallel and all security swaps are working", async () => {

            const depositAmount = pow6(1000);
            const securitySwapAmount = pow6(50);

            const swapSizeMim = 5;
            const swapSizeTri = 100000000000;

            const liquIndexWETH = 2;
            const liquIndexUSDC = 0;

            const liquIndexMIM = 0;
            const liquIndex3Crv = 1;
            const liquIndexDAI3Crv = 0;
            const liquIndexUSDC3Crv = 2;

            const swapBytesTri = swapBytesTriPool(
                liquIndexWETH,
                liquIndexUSDC,
                swapSizeTri
            );

            const hexData = swapBytesMimPool(
                liquIndexMIM,
                liquIndex3Crv,
                liquIndexDAI3Crv,
                liquIndexUSDC3Crv,
                swapSizeMim,
                swapSizeMim
            );

            const swapBytesMim = hexData.normal;
            const swapMetaBytesMim = hexData.meta;

            const contracts = await setUpContractsAndOracle();

            await setUpTriCryptoUSDCOracle(
                contracts.oracleHub
            );

            await setUpMim3CrvOracle(
                contracts.oracleHub
            );

            const securityStructTri = {
                curvePoolTokenIndexFrom: liquIndexWETH,
                curvePoolTokenIndexTo: liquIndexUSDC,
                curveMetaPoolTokenIndexFrom: 0,
                curveMetaPoolTokenIndexTo: 0
            };

            const securityStructDataTri = {
                curvePool: TRI_USDC_POOL,
                curveMetaPool: ZERO_ADDRESS,
                swapBytesPool: swapBytesTri,
                swapBytesMeta: []
            }

            const securityStructMim = {
                curvePoolTokenIndexFrom: liquIndexMIM,              // MIM
                curvePoolTokenIndexTo: liquIndex3Crv,               // 3Crv LP
                curveMetaPoolTokenIndexFrom: liquIndexDAI3Crv,      // DAI inside 3Crv
                curveMetaPoolTokenIndexTo: liquIndexUSDC3Crv        // USDT inside 3Crv
            };

            const securityStructDataMim = {
                curvePool: CURVE_POOL_ADDRESS_MIM,
                curveMetaPool: CURVE_META_POOL_ADDRESS,
                swapBytesPool: swapBytesMim,
                swapBytesMeta: swapMetaBytesMim
            }

            await contracts.lending.createCurvePool(
                {
                    allowBorrow: false,
                    poolToken: MOO_TRI_USDC,
                    poolMulFactor: toWei("1"),
                    poolCollFactor: toWei("0.6"),
                    maxDepositAmount: HUGE_AMOUNT
                },
                {
                    curveSecuritySwapsData: securityStructDataTri,
                    curveSecuritySwapsToken: securityStructTri
                }
            );

            await contracts.lending.createCurvePool(
                {
                    allowBorrow: true,
                    poolToken: MOO_MIM3CRV_ADD,
                    poolMulFactor: toWei("1"),
                    poolCollFactor: toWei("0.6"),
                    maxDepositAmount: HUGE_AMOUNT
                },
                {
                    curveSecuritySwapsData: securityStructDataMim,
                    curveSecuritySwapsToken: securityStructMim
                }
            );

            await WETH.deposit(
                {
                    value: toWei("1"),
                    from: owner
                }
            );

            const bal = await WETH.balanceOf(
                owner
            );

            await WETH.transfer(
                contracts.security.address,
                bal,
                {
                    from: owner
                }
            );

            await WETH.deposit(
                {
                    value: toWei("10"),
                    from: owner
                }
            );

            await TRI_POOL_USDC.add_liquidity(
                [
                    0,
                    0,
                    toWei("10")
                ],
                0,
                {
                    from: owner
                }
            );

            await USDC.approve(
                MIM3CRV_POOL.address,
                HUGE_AMOUNT
            );

            const swapIndexMIM = 0;
            const swapIndexDAI = 1;
            const swapIndexUSDC = 2;

            await MIM3CRV_POOL.exchange_underlying(
                swapIndexUSDC,
                swapIndexMIM,
                securitySwapAmount,
                0
            );

            await MIM3CRV_POOL.exchange_underlying(
                swapIndexUSDC,
                swapIndexDAI,
                securitySwapAmount,
                0
            );

            const balMim = await MIM.balanceOf(
                owner
            );

            const balDai = await DAI.balanceOf(
                owner
            );

            await DAI.transfer(
                contracts.security.address,
                balDai,
                {
                    from: owner
                }
            );

            await MIM.transfer(
                contracts.security.address,
                balMim,
                {
                    from: owner
                }
            );

            await MIM3CRV_WRAPPER.add_liquidity(
                CURVE_POOL_ADDRESS_MIM,
                [
                    0,
                    0,
                    depositAmount,
                    0
                ],
                0
            );

            await MOO_USDC.depositAll();

            await MOO_USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await MOO_MIM3CRV.depositAll();

            await MOO_MIM3CRV.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            const balMooTri = await MOO_USDC.balanceOf(
                owner
            );

            const balMooMim = await MOO_MIM3CRV.balanceOf(
                owner
            );

            const balMimBefore = await MIM.balanceOf(
                contracts.security.address
            );

            const balDaiBefore = await DAI.balanceOf(
                contracts.security.address
            );

            const balWethBefore = await WETH.balanceOf(
                contracts.security.address
            );

            await contracts.lending.depositExactAmountMint(
                MOO_USDC.address,
                balMooTri
            );

            await contracts.nft.mintPosition();

            await contracts.lending.depositExactAmountMint(
                MOO_MIM3CRV.address,
                balMooMim,
                {
                    from: owner
                }
            );

            await contracts.nft.mintPosition();

            const balWethAfter = await WETH.balanceOf(
                contracts.security.address
            );

            const balMimAfter = await MIM.balanceOf(
                contracts.security.address
            );

            const balDaiAfter = await DAI.balanceOf(
                contracts.security.address
            );

            const diffMim = Bi(balMimBefore)
                - Bi(balMimAfter);

            const diffDai = Bi(balDaiBefore)
                - Bi(balDaiAfter);

            const diffWeth = Bi(balWethBefore)
                - Bi(balWethAfter);

            assert.equal(
                diffWeth.toString(),
                swapSizeTri.toString()
            );

            assert.equal(
                diffMim.toString(),
                swapSizeMim.toString(),
            );

            assert.equal(
                diffDai.toString(),
                swapSizeMim.toString(),
            );

            const nftOwner = await contracts.nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            const nftOwner2 = await contracts.nft.tokenOfOwnerByIndex(
                owner,
                1
            );

            const collatETH = await contracts.security.overallETHCollateralsWeighted(
                nftOwner
            );

            assert.isAbove(
                parseInt(collatETH),
                parseInt(0)
            );

            const collatETH2 = await contracts.security.overallETHCollateralsWeighted(
                nftOwner2
            );

            assert.isAbove(
                parseInt(collatETH2),
                parseInt(0)
            );
        });
    });
});
