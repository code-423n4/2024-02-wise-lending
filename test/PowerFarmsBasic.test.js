const CurvePool = artifacts.require("ICurve");
const Moo = artifacts.require("IMooTokenVault");
const MooOracle = artifacts.require("MooOracleCurve");
const SynergeticLp = artifacts.require("SyntheticLp");
const PowerFarm = artifacts.require("CurvePowerFarm");

const WiseSecurity = artifacts.require("WiseSecurity");
const Lending = artifacts.require("TesterLending");
const Token = artifacts.require("Token");
const OracleHub = artifacts.require("TesterWiseOracleHub");
const Liquidation = artifacts.require("WiseLiquidation");
const FeeManager = artifacts.require("FeeManager");
const PositionNFT = artifacts.require("PositionNFTs");
const AaveSecondLayer = artifacts.require("AaveHub");

const helpers = require("@nomicfoundation/hardhat-network-helpers");

const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');

require("./utils");
require("./test-scenarios");
require("./constants.js");

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const MIM_ADDRESS = "0x99D8a9C45b2ecA8864373A26D1459e3Dff1e17F3";
const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const FRAX_ADDRESS = "0x853d955aCEf822Db058eb8505911ED77F175b99e";

const MIM_PRICE_FEED_ADD = "0x7A364e8770418566e3eb2001A96116E6138Eb32F";
const USDT_PRICE_FEED_ADD = "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D";
const DAI_PRICE_FEED_ADD = "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9";
const USDC_PRICE_FEED_ADD = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
const FRAX_PRICE_FEE_ADD = "0xb9e1e3a9feff48998e45fa90847ed4d467e8bcfd"

//const AAVE_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
// const AAVE_ADDRESS_V2 = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";
const AAVE_USDC_ADDRESS = "0xBcca60bB61934080951369a648Fb03DF4F96263C"
//const AAVE_USDC_ADDRESS_V3 = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c";
// const AAVE_WETH_ADDRESS = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";

const CURVE_META_POOL_ADDRESS = "0xbEbc44782C7dB0a1A60Cb6fe97d0b483032FF1C7";
// const CURVE_META_POOL_WRAPPER_ADD = "0xA79828DF1850E8a3A3064576f380D90aECDD3359";
const CURVE_POOL_ADDRESS_MIM = "0x5a6a4d54456819380173272a5e8e9b9904bdf41b";

// const CURVE_POOL_FRAX_ADD = "0xdcef968d416a41cdac0ed8702fac8128a64241a2";
// const CURVE_LP_TOKEN_FRAX_ADD ="0x3175df0976dfa876431c2e9ee6bc45b65d3473cc";

const CURVE_META_LP_TOKEN_ADD = "0x6c3f90f043a72fa612cbac8115ee7e52bde6e490";

// const MOO_ADDRESS = "0x4fc424a840B5fB1BAf195963eC3737904440df1D";
const MOO_MIM_ADD = "0xd5bAd7c89028B3F7094e40DcCe83D4e6b3Fd9AA4"

const MEGA_WHALE = "0x55FE002aefF02F77364de339a1292923A15844B8";
// const MIM_WHALE = "0xDF2C270f610Dc35d8fFDA5B453E74db5471E126B";

contract("PowerFarm tests #1", async (accounts) => {

    const [
        owner,
        alice,
        // bob,
        // pepe
    ] = accounts;

    // let startBlock;
    let deviation;

    let contracts;
    let powerFarm;

    let USDC;
    let DAI;

    // let USDT;
    let MIM;
    // let WETH;
    // let CurveLP;
    let MooMim;

    let nft;

    let security;
    let securityAddress;

    let lending;
    let lendingAddress;

    let oracleHub;
    let oracleHubAddress;

    let underlyingCurvePool;

    preparationContracts = async () => {

        const contracts = await setUpContracts(
            {
                OracleHub: OracleHub,
                Lending: Lending,
                Liquidation: Liquidation,
                FeeManager: FeeManager,
                WiseSecurity: WiseSecurity,
                PositionNFT: PositionNFT,
                AaveHub: AaveSecondLayer,
                owner: owner,
                gouvernance: owner,
                borrowCap: toWei("1")
            }
        );

        oracleHub = contracts.oracleHub;
        oracleHubAddress = oracleHub.address;

        nft = contracts.nft;
        lending = contracts.lending;
        lendingAddress = lending.address;

        security = contracts.security;
        securityAddress = security.address;

        const powerFarm = await PowerFarm.new(
            lendingAddress
        );

        await lending.setVerifiedIsolationPool(
            powerFarm.address,
            true
        );

        await oracleHub.addOracleBulk(
            [
                AAVE_USDC_ADDRESS,
                MIM_ADDRESS,
                USDT_ADDRESS,
                DAI_ADDRESS,
                USDC_ADDRESS,
                FRAX_ADDRESS
            ],
            [
                USDC_PRICE_FEED_ADD,
                MIM_PRICE_FEED_ADD,
                USDT_PRICE_FEED_ADD,
                DAI_PRICE_FEED_ADD,
                USDC_PRICE_FEED_ADD,
                FRAX_PRICE_FEE_ADD
            ],
            [
                [], [], [], [], [], []
            ]
        );

        await oracleHub.recalibrateBulk(
            [
                MIM_ADDRESS,
                USDT_ADDRESS,
                DAI_ADDRESS,
                USDC_ADDRESS,
                FRAX_ADDRESS
            ]
        );

        return {
            contracts,
            powerFarm
        };
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

    setUpPowerFarm = async () => {

        const securitySwapAmount = pow6(100);

        const liquIndexMIM = 0;
        const liquIndex3Crv = 1;
        const liquIndexDAI3Crv = 0;
        const liquIndexUSDC3Crv = 2;

        const swapSizeMim = 5;

        const CurveInterfaces = {
            curvePool: CURVE_POOL_ADDRESS_MIM,
            curveLPToken: CURVE_POOL_ADDRESS_MIM,
            curveSecondLayerPool: CURVE_META_POOL_ADDRESS,
            curveSecondLayerToken: CURVE_META_LP_TOKEN_ADD
        }

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

        const mooOracle = await MooOracle.new(
            CurveInterfaces,
            MOO_MIM_ADD,
            [
                MIM_ADDRESS,
                DAI_ADDRESS,
                USDC_ADDRESS,
                USDT_ADDRESS
            ],
            deviation,
            18,
            2,
            3,
            oracleHubAddress
        );

        const synteticLp = await SynergeticLp.new(
            18,
            MOO_MIM_ADD
        );

        const underlyingTokens = [
            MIM_ADDRESS,
            DAI_ADDRESS,
            USDC_ADDRESS,
            USDT_ADDRESS
        ];

        const securityStructToken = {
            curvePoolTokenIndexFrom: liquIndexMIM,
            curvePoolTokenIndexTo: liquIndex3Crv,
            curveMetaPoolTokenIndexFrom: liquIndexDAI3Crv,
            curveMetaPoolTokenIndexTo: liquIndexUSDC3Crv,
        };

        const securityStructData = {
            curvePool: CURVE_POOL_ADDRESS_MIM,
            curveMetaPool: CURVE_META_POOL_ADDRESS,
            swapBytesPool: swapBytesMim,
            swapBytesMeta: swapMetaBytesMim
        }

        await lending.createCurvePool(
            {
                allowBorrow: false,
                poolToken: synteticLp.address,
                poolMulFactor: toWei("1"),
                poolCollFactor: toWei("0.6"),
                maxDepositAmount: HUGE_AMOUNT
            },
            {
                curveSecuritySwapsToken: securityStructToken,
                curveSecuritySwapsData: securityStructData
            }
        );

        await USDC.approve(
            underlyingCurvePool.address,
            HUGE_AMOUNT
        );

        await underlyingCurvePool.exchange_underlying(
            2,
            0,
            securitySwapAmount,
            0
        );

        await underlyingCurvePool.exchange_underlying(
            2,
            1,
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
            securityAddress,
            balDai,
            {
                from: owner
            }
        );

        await MIM.transfer(
            securityAddress,
            balMim,
            {
                from: owner
            }
        );

        await addPools(
            lending,
            [
                {
                    allowBorrow: true,
                    poolToken: DAI,
                    mulFactor: toWei("0.1"),
                    collFactor: toWei("0.80"),
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: USDC,
                    mulFactor: toWei("0.1"),
                    collFactor: toWei("0.80"),
                    maxDeposit: HUGE_AMOUNT
                }
            ]
        );

        await oracleHub.addOracleBulk(
            [
                synteticLp.address,
                MOO_MIM_ADD
            ],
            [
                mooOracle.address,
                mooOracle.address
            ]
        );

        await oracleHub.setHeartBeatBulk(
            [
                MIM_ADDRESS,
                USDT_ADDRESS,
                DAI_ADDRESS,
                USDC_ADDRESS
            ],
            [
                HUGE_AMOUNT,
                HUGE_AMOUNT,
                HUGE_AMOUNT,
                HUGE_AMOUNT
            ],
            [
                [], [], [], []

            ]
        );

        await powerFarm.createNewPowerFarm(
            toWei("0.95"),
            [
                toWei("1")
            ],
            [
                USDC.address
            ],
            underlyingTokens,
            CURVE_POOL_ADDRESS_MIM,
            CURVE_POOL_ADDRESS_MIM,
            MOO_MIM_ADD,
            synteticLp.address,
            4,
            false
        );

        const counter = await powerFarm.poolCounter();

        assert.equal(
            counter.toString(),
            "1"
        );

        return {
            synteticLp,
            mooOracle
        };
    }

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

    before(async () => {

        startBlock = (
            await getBlockInfo()
        ).blockNumber;


        USDC = await Token.at(
            USDC_ADDRESS
        );

        DAI = await Token.at(
            DAI_ADDRESS
        );

        USDT = await Token.at(
            USDT_ADDRESS
        );

        MIM = await Token.at(
            MIM_ADDRESS
        );

        WETH = await Token.at(
            WETH_ADDRESS
        );

        CurveLP = await Token.at(
            CURVE_POOL_ADDRESS_MIM
        );

        MooMim = await Moo.at(
            MOO_MIM_ADD
        );

        underlyingCurvePool = await CurvePool.at(
            CURVE_POOL_ADDRESS_MIM
        );

        deviation = BN(
            375 * Math.pow(
                10,
                8
            )
        );

        const data = await preparationContracts();

        contracts = data.contracts;
        powerFarm = data.powerFarm;

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

        await takeSnapshot();
    });

    describe("Basic power farm tests", () => {

        // @TODO: this is very vague description, should briefly point out
        // what it should do, what is expected, or how should the set up work
        it("Deploying all necessary contracts and creating a MiMCrv3 power farms works as expected", async () => {

            const securitySwapAmount = pow6(100);
            const depositAmount = pow6(10000);

            const liquIndexMIM = 0;
            const liquIndex3Crv = 1;
            const liquIndexDAI3Crv = 0;
            const liquIndexUSDC3Crv = 2;

            const swapSizeMim = 5;

            const CurveInterfaces = {
                curvePool: CURVE_POOL_ADDRESS_MIM,
                curveLPToken: CURVE_POOL_ADDRESS_MIM,
                curveSecondLayerPool: CURVE_META_POOL_ADDRESS,
                curveSecondLayerToken: CURVE_META_LP_TOKEN_ADD
            }

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

            const mooOracle = await MooOracle.new(
                CurveInterfaces,
                MOO_MIM_ADD,
                [
                    MIM_ADDRESS,
                    DAI_ADDRESS,
                    USDC_ADDRESS,
                    USDT_ADDRESS
                ],
                deviation,
                18,
                2,
                3,
                oracleHubAddress
            );

            const synteticLp = await SynergeticLp.new(
                18,
                MOO_MIM_ADD
            );

            const underlyingTokens = [
                MIM_ADDRESS,
                DAI_ADDRESS,
                USDC_ADDRESS,
                USDT_ADDRESS
            ];

            const securityStructToken = {
                curvePoolTokenIndexFrom: 0,
                curvePoolTokenIndexTo: 1,
                curveMetaPoolTokenIndexFrom: 0,
                curveMetaPoolTokenIndexTo: 2,
            };

            const securityStructData = {
                curvePool: CURVE_POOL_ADDRESS_MIM,
                curveMetaPool: CURVE_META_POOL_ADDRESS,
                swapBytesPool: swapBytesMim,
                swapBytesMeta: swapMetaBytesMim
            }

            await lending.createPool(
                {
                    allowBorrow: false,
                    poolToken: synteticLp.address,
                    curveSecuritySwapsToken: securityStructToken,
                    curveSecuritySwapsData: securityStructData,
                    poolMulFactor: toWei("1"),
                    poolCollFactor: toWei("0.6"),
                    maxDepositAmount: HUGE_AMOUNT
                }
            );

            await USDC.approve(
                underlyingCurvePool.address,
                HUGE_AMOUNT
            );

            await underlyingCurvePool.exchange_underlying(
                2,
                0,
                securitySwapAmount,
                0
            );

            await underlyingCurvePool.exchange_underlying(
                2,
                1,
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
                securityAddress,
                balDai,
                {
                    from: owner
                }
            );

            await MIM.transfer(
                securityAddress,
                balMim,
                {
                    from: owner
                }
            );

            await addPools(
                lending,
                [
                    {
                        allowBorrow: true,
                        poolToken: DAI,
                        mulFactor: toWei("0.1"),
                        collFactor: toWei("0.80"),
                        maxDeposit: HUGE_AMOUNT
                    },
                    {
                        allowBorrow: true,
                        poolToken: USDC,
                        mulFactor: toWei("0.1"),
                        collFactor: toWei("0.80"),
                        maxDeposit: HUGE_AMOUNT
                    }
                ]
            );

            await oracleHub.addOracleBulk(
                [
                    synteticLp.address,
                    MOO_MIM_ADD
                ],
                [
                    mooOracle.address,
                    mooOracle.address
                ]
            );

            await oracleHub.setHeartBeatBulk(
                [
                    MIM_ADDRESS,
                    USDT_ADDRESS,
                    DAI_ADDRESS,
                    USDC_ADDRESS
                ],
                [
                    HUGE_AMOUNT,
                    HUGE_AMOUNT,
                    HUGE_AMOUNT,
                    HUGE_AMOUNT
                ],
                [
                    [], [], [], []
                ]
            );

            await powerFarm.createNewPowerFarm(
                toWei("0.95"),
                [
                    toWei("1")
                ],
                [
                    USDC.address
                ],
                underlyingTokens,
                CURVE_POOL_ADDRESS_MIM,
                CURVE_POOL_ADDRESS_MIM,
                MOO_MIM_ADD,
                synteticLp.address,
                4,
                false
            );

            const counter = await powerFarm.poolCounter();

            assert.equal(
                counter.toString(),
                "1"
            );

            await nft.mintPosition(
                {
                    from: owner
                }
            );

            nftIDOwner = await nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            await USDC.approve(
                powerFarm.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            // amounts order coressponds to order of underlyin token set during powerFarm creation!!!
            await expectRevert.unspecified(
                powerFarm.depositExactToken_4Pool(
                    nftIDOwner,
                    [
                        0,              //MIM
                        0,              //DAI
                        depositAmount,  //USDC
                        0               //USDT
                    ],
                    0,
                    true,
                    {
                        from: owner
                    }
                )
            );

            await powerFarm.registrationFarm(
                nftIDOwner,
                counter,
                {
                    from: owner
                }
            );

            await expectRevert(
                lending.depositExactAmount(
                    nftIDOwner,
                    synteticLp.address,
                    depositAmount,
                    true,
                    {
                        from: owner
                    }
                ),
                'PositionLocked()'
            );

            await powerFarm.depositExactToken_4Pool(
                nftIDOwner,
                [
                    0,              //MIM
                    0,              //DAI
                    depositAmount,  //USDC
                    0               //USDT
                ],
                0,
                true,
                {
                    from: owner
                }
            );

            const balSyntetic = await MooMim.balanceOf(
                synteticLp.address
            );

            const collatPosition = await powerFarm.getTotalWeightedCollateralUSD(
                nftIDOwner
            );

            assert.isAbove(
                parseInt(collatPosition),
                parseInt(0)
            );

            assert.isAbove(
                parseInt(balSyntetic),
                parseInt(0)
            );

            await restoreSnapshot();
        });

        // @TODO: this is very vague description, should briefly point out
        // what it should do, what is expected, or how should the Withdraw work
        // For example: it("should be able to withdraw same amount as deposited")
        // based on that the test should be around checking that scenario
        it("Should be able to deposit into power farm and withdraw whole amount in moo token again", async () => {

            const depositAmount = pow6(10000);

            const data = await setUpPowerFarm();

            const synteticLp = data.synteticLp;

            await USDC.approve(
                powerFarm.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await powerFarm.openPositionWithUnderlyingMint(
                1,
                0,
                [
                    0,              //MIM
                    0,              //DAI
                    depositAmount,  //USDC
                    0               //USDT
                ]
            );

            const nftIDOwner = await nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            const bal = await security.getPositionLendingAmount(
                nftIDOwner,
                synteticLp.address
            );

            await lending.approve(
                powerFarm.address,
                synteticLp.address,
                HUGE_AMOUNT
            );

            const balUser = await MooMim.balanceOf(
                owner
            );

            await powerFarm.withdrawExactAmount(
                nftIDOwner,
                bal,
                {
                    from: owner
                }
            );

            const balAfter = await security.getPositionLendingAmount(
                nftIDOwner,
                synteticLp.address
            );

            assert.equal(
                balAfter.toString(),
                "0"
            );

            const balUserAfter = await MooMim.balanceOf(
                owner
            );

            const diffUser = Bi(balUserAfter)
                - Bi(balUser)

            assert.equal(
                diffUser.toString(),
                bal.toString()
            );

            await restoreSnapshot();
        });

        // @TODO: this is very vague description, should briefly point out
        // what it should do, what is expected, or how should the Withdraw work
        // For example: it("should be able to withdraw same amount as deposited")
        // based on that the test should be around checking that scenario
        it("Should be able to deposit into power farm and withdraw whole amount in one underlying token again", async () => {

            const depositAmount = pow6(25000);

            const data = await setUpPowerFarm();

            const synteticLp = data.synteticLp;

            await USDC.approve(
                powerFarm.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await powerFarm.openPositionWithUnderlyingMint(
                1,
                0,
                [
                    0,              //MIM
                    0,              //DAI
                    depositAmount,  //USDC
                    0               //USDT
                ]
            );

            const nftIDOwner = await nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            const bal = await security.getPositionLendingAmount(
                nftIDOwner,
                synteticLp.address
            );

            await lending.approveWithdraw(
                nftIDOwner,
                powerFarm.address,
                synteticLp.address,
                HUGE_AMOUNT
            );

            const halfBal = Bi(bal)
                / Bi(2);

            await powerFarm.withdrawExactToken_4Pool(
                nftIDOwner,
                halfBal,
                0,
                0
            );

            await powerFarm.withdrawExactToken_4Pool(
                nftIDOwner,
                halfBal,
                0,
                1
            );

            const balContract = await security.getPositionLendingAmount(
                nftIDOwner,
                synteticLp.address
            );

            assert.isAbove(
                parseInt(2),
                parseInt(balContract)
            );

            await restoreSnapshot();
        });

        it("Reentrency swap works correctly", async () => {

            const depositAmount = pow6(8000);
            const tinyWithdraw = toWei("1");

            const data = await setUpPowerFarm();

            const synteticLp = data.synteticLp;

            await USDC.approve(
                powerFarm.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await powerFarm.openPositionWithUnderlyingMint(
                1,
                0,
                [
                    0,              //MIM
                    0,              //DAI
                    depositAmount,  //USDC
                    0               //USDT
                ]
            );

            const nftIDOwner = await nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            await lending.approveWithdraw(
                nftIDOwner,
                powerFarm.address,
                synteticLp.address,
                HUGE_AMOUNT
            );

            const blaDaiSecurity = await DAI.balanceOf(
                securityAddress
            );

            const baldMimSecurity = await MIM.balanceOf(
                securityAddress
            );

            await powerFarm.withdrawExactAmount(
                nftIDOwner,
                tinyWithdraw,
                {
                    from: owner
                }
            );

            const blaDaiSecurityAfter = await DAI.balanceOf(
                securityAddress
            );

            const baldMimSecurityAfter = await MIM.balanceOf(
                securityAddress
            );

            const diffMim = Bi(baldMimSecurity)
                - Bi(baldMimSecurityAfter);

            const diffDai = Bi(blaDaiSecurity)
                - Bi(blaDaiSecurityAfter);

            assert.equal(
                diffDai.toString(),
                "10"
            );

            assert.equal(
                diffMim.toString(),
                "10"
            );

            await restoreSnapshot();
        });

        it("User can borrow defined token of power farm using both modes (debtratio and exactAmount)", async () => {

            const depositAmount = pow6(25000);
            const borrowAmount = pow6(10000);

            await setUpPowerFarm();

            await nft.mintPosition(
                {
                    from: alice
                }
            )

            const nftIDAlice = await nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await USDC.approve(
                powerFarm.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await USDC.approve(
                lendingAddress,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await lending.depositExactAmount(
                nftIDAlice,
                USDC.address,
                depositAmount,
                {
                    from: owner
                }
            );

            await powerFarm.openPositionWithUnderlyingMint(
                1,
                0,
                [
                    0,              // MIM
                    0,              // DAI
                    depositAmount,  // USDC
                    0               // USDT
                ]
            );

            const nftIDOwner = await nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            await lending.approve(
                nftIDOwner,
                powerFarm.address,
                USDC.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            const balUSDCBefore = await USDC.balanceOf(
                owner
            );

            await powerFarm.borrowExactAmount(
                nftIDOwner,
                0,          // if there is only one token alway zero!
                borrowAmount,
                {
                    from: owner
                }
            );

            const balUSDCAfter = await USDC.balanceOf(
                owner
            );

            const diffUSDC = Bi(balUSDCAfter)
                - Bi(balUSDCBefore);

            assert.equal(
                diffUSDC.toString(),
                borrowAmount.toString()
            );

            const debtratio = await powerFarm.getLiveDebtRatio(
                nftIDOwner
            );

            assert.isAbove(
                parseInt(debtratio),
                parseInt(0)
            );

            await powerFarm.borrowExactDebtRatio(
                nftIDOwner,
                toWei("0.94"),
                {
                    from: owner
                }
            );

            await restoreSnapshot();
        });

        // @TODO: this is very vague description, should briefly point out
        // what it should do, what is expected, or how should the Payback work
        // For example: it("should allow user to payback borrowed amount")
        // For example: it("should allow user to payback borrowed amount including interest")
        // based on that the test should be around checking that decription scenario
        it("Should be able to use payback on borrowed funds of the power farm (paybackAll and exact)", async () => {

            const depositAmount = pow6(100000);
            const borrowAmount = pow6(10000);
            const paybackAmount = pow6(4528)

            await setUpPowerFarm();

            await nft.mintPosition(
                {
                    from: alice
                }
            )

            const nftIDAlice = await nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await USDC.approve(
                powerFarm.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await USDC.approve(

                lendingAddress,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await lending.depositExactAmount(
                nftIDAlice,
                USDC.address,
                depositAmount,
                {
                    from: owner
                }
            );

            await powerFarm.openPositionWithUnderlyingMint(
                1,
                0,
                [
                    0,              // MIM
                    0,              // DAI
                    depositAmount,  // USDC
                    0               // USDT
                ]
            );

            const nftIDOwner = await nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            await lending.approve(
                nftIDOwner,
                powerFarm.address,
                USDC.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await powerFarm.borrowExactAmount(
                nftIDOwner,
                0,          // if there is only one token alway zero!
                borrowAmount,
                {
                    from: owner
                }
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            const totalPool = await lending.getTotalPool(
                USDC.address
            );

            const bal = await USDC.balanceOf(
                owner
            );

            const debtratio = await powerFarm.getLiveDebtRatio(
                nftIDOwner
            );

            await powerFarm.paybackExactAmount(
                nftIDOwner,
                0,
                paybackAmount,
                {
                    from: owner
                }
            );

            const debtratioAfter = await powerFarm.getLiveDebtRatio(
                nftIDOwner
            );

            const totalPoolAfter = await lending.getTotalPool(
                USDC.address
            );

            const balAfter = await USDC.balanceOf(
                owner
            );

            const diffPool = Bi(totalPoolAfter)
                - Bi(totalPool);

            const diffUser = Bi(bal)
                - Bi(balAfter);

            assert.equal(
                diffPool.toString(),
                diffUser.toString()
            );

            assert.equal(
                diffUser.toString(),
                paybackAmount.toString()
            );

            assert.isAbove(
                parseInt(debtratio),
                parseInt(debtratioAfter)
            );

            await powerFarm.paybackAll(
                nftIDOwner,
                {
                    from: owner
                }
            );

            const borrowShares = await lending.getPositionBorrowShares(
                nftIDOwner,
                USDC.address
            );

            const borrowAmountRest = await security.getPositionBorrowAmount(
                nftIDOwner,
                USDC.address
            );

            const debtratioEnd = await powerFarm.getLiveDebtRatio(
                nftIDOwner
            );

            assert.equal(
                borrowShares.toString(),
                borrowAmountRest.toString()
            );

            assert.equal(
                borrowAmountRest.toString(),
                debtratioEnd.toString()
            );

            assert.equal(
                debtratioEnd.toString(),
                "0"
            );

            await restoreSnapshot();
        });
    });
})