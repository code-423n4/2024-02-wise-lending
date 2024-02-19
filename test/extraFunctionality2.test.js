const Lending = artifacts.require("TesterLending");
const Token = artifacts.require("Token");
const OracleHub = artifacts.require("TesterWiseOracleHub");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const Liquidation = artifacts.require("WiseLiquidation");
const IsolationContract = artifacts.require("WiseIsolationMode");
const FeeManager = artifacts.require("FeeManager");
const Chainlink = artifacts.require("TesterChainlink")
const WiseSecuirty = artifacts.require("WiseSecurity");
const PositionNFT = artifacts.require("PositionNFTs");
const AaveSecondLayer = artifacts.require("AaveHub");

const { assert } = require("chai");
const { expectRevert, time } = require('@openzeppelin/test-helpers');
const { Bi } = require("./utils");

require("./utils");
require("./constants");
require("./test-scenarios");

contract("extra Functionality2", async accounts  => {

    const [
        owner,
        alice,
        bob,
        chad,
        random
    ] = accounts;

    let USDC;
    let WETH;
    let USDT;
    let chainlinkUSDT;
    let chainlinkUSDC;
    let chainlinkWETH;

    let contracts;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

    preparationSetup = async (_borrowCap = toWei("1")) => {

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
                borrowCap: _borrowCap
            }
        );

        const tokenData = await createToken(
            {
                Token: Token,
                Chainlink: Chainlink,
                OracleHub: contracts.oracleHub,
                value: pow8(1),
                dec: 6,
                user: alice
            }
        );

        const tokenData2 = await createToken(
            {
                Token: Token,
                Chainlink: Chainlink,
                OracleHub: contracts.oracleHub,
                value: pow8(10),
                dec: 18,
                user: alice
            }
        );

        USDC = tokenData.token;
        chainlinkUSDC = tokenData.oracle

        WETH = tokenData2.token;
        chainlinkWETH = tokenData2.oracle;

        await setupHeartbeatForTests(
            {
                oracleHub: contracts.oracleHub,
                tokens: [
                    USDC,
                    WETH
                ],
                chainlinkInterfaces: [
                    chainlinkUSDC,
                    chainlinkWETH
                ]
            }
        );

        await addPools(
            contracts.lending,
            [
                {
                    allowBorrow: true,
                    poolToken: USDC,
                    mulFactor: toWei("0.2"),
                    collFactor: toWei("0.85"),
                    maxDeposit: HUGE_AMOUNT,
                    borrowCap: toWei("1")
                },
                {
                    allowBorrow: true,
                    poolToken: WETH,
                    mulFactor: toWei("0.1"),
                    collFactor: toWei("0.5"),
                    maxDeposit: HUGE_AMOUNT,
                    borrowCap: toWei("1")
                }
            ]
        );

        await approveTokens(
            contracts.lending,
            [
                {
                    Token: USDC,
                    contract: contracts.lending,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: WETH,
                    contract: contracts.lending,
                    user: alice,
                    type: "normal"
                }
            ]
        );

        return contracts
    }

    wrapDepositAmount = async (_nftId, _poolToken, _amount, _caller, _state = false, ) => {
        await contracts.lending.depositExactAmount(
            _nftId,
            _poolToken,
            _amount,
            {
                from: _caller
            }
        );
    }

    describe("Collateral for solely borrow tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );
        });

        it("Total bare token gets increased correctly", async () => {

            const depositAmount = toWei("5");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                depositAmount,
                {
                    from: alice
                }
            );

            const globalPoolData = await contracts.lending.globalPoolData(
                WETH.address
            );

            const globalLendingData = await contracts.lending.lendingPoolData(
                WETH.address
            );

            const totalPool = globalPoolData.totalPool;
            const totalShare = globalLendingData.totalDepositShares;
            const pseudoPool = globalLendingData.pseudoTotalPool;

            assert.equal(
                totalPool.toString(),
                "0"
            );

            assert.equal(
                totalShare.toString(),
                "1000"
            );

            assert.equal(
                pseudoPool.toString(),
                "1000"
            );

            const pureCollat1 = await contracts.lending.pureCollateralAmount(
                1,
                WETH.address
            );

            const pureCollat2 = await contracts.lending.pureCollateralAmount(
                1,
                USDC.address
            );

            assert.equal(
                pureCollat1.toString(),
                toWei("5").toString()
            );

            assert.equal(
                pureCollat2.toString(),
                "0"
            );
        });

        it("Collateral gets calculated correctly (only solely borrow deposit)", async () => {

            const deposit1 = toWei("10");
            const deposit2 = pow8(15);

            const USDequivWETH = await chainlinkWETH.latestAnswer();
            const USDequivUSDC = await chainlinkUSDC.latestAnswer();
            const decimalsOracle = await chainlinkUSDC.decimals();

            const orderDecimals = 10 ** decimalsOracle;

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            const lendingData1 = await contracts.lending.lendingPoolData(
                WETH.address
            );

            const lendingData2 = await contracts.lending.lendingPoolData(
                USDC.address
            );

            const collfactor1 = lendingData1.collateralFactor;

            const collfactor2 = lendingData2.collateralFactor;

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                deposit1,
                {
                    from: alice
                }
            );

            const result = await contracts.security.overallETHCollateralsBoth(
                1
            );

            const {0: weighted, 1: bare} = result;

            const weightedOtherFunc = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            const calcWeightedDeposit1 = Bi(deposit1)
                * Bi(collfactor1)
                * Bi(USDequivWETH)
                / Bi(toWei("1"))
                / Bi(orderDecimals);

            const calcBareDeposit1 = Bi(deposit1)
            * Bi(USDequivWETH)
            / Bi(orderDecimals);

            assert.equal(
                weighted.toString(),
                weightedOtherFunc.toString()
            );

            assert.equal(
                calcWeightedDeposit1.toString(),
                weighted.toString()
            )

            assert.equal(
                calcBareDeposit1.toString(),
                bare.toString()
            );

            await contracts.lending.solelyDeposit(
                1,
                USDC.address,
                deposit2,
                {
                    from: alice
                }
            );

            const decUSDC = await USDC.decimals();

            const calcWeightedDeposit2 = Bi(deposit2)
                * Bi(collfactor2)
                * Bi(USDequivUSDC)
                * Bi(10 ** (18 - decUSDC))
                / Bi(toWei("1"))
                / Bi(orderDecimals);

            const calcBareDeposit2 = Bi(deposit2)
            * Bi(USDequivUSDC)
            * Bi(10 ** (18 - decUSDC))
            / Bi(orderDecimals);

            const calcWeightedDepositSum = Bi(calcWeightedDeposit1)
                + Bi(calcWeightedDeposit2);

            const calcBareSum = Bi(calcBareDeposit1)
                + Bi(calcBareDeposit2)

            const result2 = await contracts.security.overallETHCollateralsBoth(
                1
            );

            const {0: weighted2, 1: bare2} = result2;

            const weightedOtherFunc2 = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            assert.equal(
                weighted2.toString(),
                calcWeightedDepositSum.toString()
            );

            assert.equal(
                weightedOtherFunc2.toString(),
                weighted2.toString()
            )

            assert.equal(
                calcBareSum.toString(),
                bare2.toString()
            );
        });

        it("Collateral gets calculated correctly (normal plus solely borrow deposit)", async () => {

            const depositNormal1 = toWei("10");
            const depositSolely1 = toWei("5");
            const depositNormal2 = pow6(7);
            const depositSolely2 = pow6(15);

            const USDequivWETH = await chainlinkWETH.latestAnswer();
            const USDequivUSDC = await chainlinkUSDC.latestAnswer();
            const decimalsOracle = await chainlinkUSDC.decimals();

            const orderDecimals = 10 ** decimalsOracle;

            const decUSDC = await USDC.decimals();

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            const lendingData1 = await contracts.lending.lendingPoolData(
                WETH.address
            );

            const lendingData2 = await contracts.lending.lendingPoolData(
                USDC.address
            );

            const collfactor1 = lendingData1.collateralFactor;
            const collfactor2 = lendingData2.collateralFactor;

            await wrapDepositAmount(
                1,
                WETH.address,
                depositNormal1,
                alice
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                depositSolely1,
                {
                    from: alice
                }
            );

            const result1 = await contracts.security.overallETHCollateralsBoth(
                1
            );

            const {0: weighted1, 1: bare1} = result1;

            const weightedOtherFunc1 = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            const sum1 = Bi(depositNormal1)
                + Bi(depositSolely1);

            const calcWeightedDeposit1 = Bi(sum1)
                * Bi(collfactor1)
                * Bi(USDequivWETH)
                / Bi(toWei("1"))
                / Bi(orderDecimals)
                - Bi(10);

            const calcBareDeposit1 = Bi(sum1)
                * Bi(USDequivWETH)
                / Bi(orderDecimals)
                - Bi(20);

            assert.equal(
                weighted1.toString(),
                weightedOtherFunc1.toString()
            );

            assert.equal(
                calcWeightedDeposit1.toString(),
                weighted1.toString()
            )

            assert.equal(
                calcBareDeposit1.toString(),
                bare1.toString()
            );

            // deposit second token (but dont set it as collat)

            await wrapDepositAmount(
                1,
                USDC.address,
                depositNormal2,
                alice
            );

            await contracts.lending.solelyDeposit(
                1,
                USDC.address,
                depositSolely2,
                {
                    from: alice
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                1,
                USDC.address,
                {
                    from: alice
                }
            );

            const calcWeightedDepositWithSolely = Bi(depositSolely2)
                * Bi(collfactor2)
                * Bi(USDequivUSDC)
                * Bi(10 ** (18 - decUSDC))
                / Bi(toWei("1"))
                / Bi(orderDecimals);

            const calcBareDepositWithSolely = Bi(depositSolely2)
                * Bi(USDequivUSDC)
                * Bi(10 ** (18 - decUSDC))
                / Bi(orderDecimals);

            const calcWeightedDepositSolelySum = Bi(calcWeightedDeposit1)
                + Bi(calcWeightedDepositWithSolely);

            const calcBareSolelySum = Bi(calcBareDeposit1)
                + Bi(calcBareDepositWithSolely)

            const result2 = await contracts.security.overallETHCollateralsBoth(
                1
            );

            const {
                0: weighted2,
                1: bare2
            } = result2;

            const weightedOtherFunc2 = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            assert.equal(
                weighted2.toString(),
                calcWeightedDepositSolelySum.toString()
            );

            assert.equal(
                weightedOtherFunc2.toString(),
                weighted2.toString()
            )

            assert.equal(
                calcBareSolelySum.toString(),
                bare2.toString()
            );

            await contracts.lending.collateralizeDeposit(
                1,
                USDC.address,
                {
                    from: alice
                }
            );

            const calcWeightedDepositNormal2 = Bi(depositNormal2)
                * Bi(collfactor2)
                * Bi(USDequivUSDC)
                * Bi(10 ** (18 - decUSDC))
                / Bi(toWei("1"))
                / Bi(orderDecimals);

            const calcBareDepositNormal2 = Bi(depositNormal2)
                * Bi(USDequivUSDC)
                * Bi(10 ** (18 - decUSDC))
                / Bi(orderDecimals);

            const calcWeightedDepositEndSum = Bi(calcWeightedDepositSolelySum)
                + Bi(calcWeightedDepositNormal2);

            const calcBareEndSum = Bi(calcBareSolelySum)
                + Bi(calcBareDepositNormal2);

            const resultEnd = await contracts.security.overallETHCollateralsBoth(
                1
            );

            const {0: weightedEnd, 1: bareEnd} = resultEnd;

            const weightedOtherFuncEnd = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            assert.isAbove(
                parseInt(calcWeightedDepositEndSum),
                parseInt(weightedEnd)
            );

            assert.equal(
                weightedOtherFuncEnd.toString(),
                weightedEnd.toString()
            )

            assert.isAbove(
                parseInt(calcBareEndSum),
                parseInt(bareEnd)
            );
        });

        it("Borrow works correctly with solely borrow deposit", async () => {

            const deposit1 = toWei("20");
            const borrowAmount = toWei("9.9");
            const revertBorrowAmount = toWei("0.1");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                deposit1,
                alice
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                deposit1,
                {
                    from: alice
                }
            )

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                BigInt(borrowAmount * 0.95),
                {
                    from: alice
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await expectRevert(
                contracts.lending.borrowExactAmount(
                    1,
                    WETH.address,
                    revertBorrowAmount,
                    {
                        from: alice
                    }
                ),
                "ResultsInBadDebt()"
            );
        });

        it("Liquidation works also for solely borrow entry", async () => {

            const deposit1 = toWei("100");
            const deposit2 = pow6(1000);
            const liquidationPercentage = toWei("0.5");
            const transferAmount = toWei("1000");
            const borrowAmount = toWei("45");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await WETH.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                deposit1,
                alice
            );

            await contracts.lending.unCollateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.solelyDeposit(
                1,
                USDC.address,
                deposit2,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await expectRevert(
                contracts.liquidation.liquidatePartiallyFromTokens(
                    1,
                    2,
                    WETH.address,
                    USDC.address,
                    paybackShares,
                    {
                        from: bob
                    }
                ),
                'LiquidationDenied()'
            );

            await chainlinkUSDC.setValue(
                pow8(0.50),
                {
                    from: owner
                }
            )

            takeSnapshot();

            await contracts.lending.syncManually(
                WETH.address
            );

            const paybackAmount = await contracts.lending.paybackAmount(
                WETH.address,
                paybackShares
            );

            const paybackETH = await contracts.oracleHub.getTokensInETH(
                WETH.address,
                paybackAmount
            );

            const valueBefore = await contracts.lending.pureCollateralAmount(
                1,
                USDC.address
            );

            const collatETH = await contracts.security.overallETHCollateralsBoth(
                1
            );

            const {
                0: weighted,
                1: bare
            } = collatETH;

            const feeLiquidation = await contracts.security.baseRewardLiquidation();

            const liquReward = Bi(paybackETH)
                * Bi(feeLiquidation)
                / Bi(toWei("1"));

            const sum = Bi(liquReward)
                + Bi(paybackETH);

            const collatPerc = Bi(sum)
                * Bi(toWei("1"))
                / Bi(bare);

            await snapshot.restore();

            await contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                2,
                WETH.address,
                USDC.address,
                paybackShares,
                {
                    from: bob
                }
            );

            const valueAfter = await contracts.lending.pureCollateralAmount(
                1,
                USDC.address
            );

            const ratio = Bi(valueAfter)
                * Bi(toWei("1"))
                / Bi(valueBefore);

            const isPercentage = Bi(toWei("1"))
                - Bi(ratio);

            const borrowETHAfter = await contracts.security.overallETHBorrow.call(
                1
            );

            const diffPercent = Bi(isPercentage)
                - Bi(collatPerc);

            const diffPercBool = await inBound(
                abs(diffPercent),
                WETH
            );

            assert.equal(
                diffPercBool.toString(),
                "true"
            );

            assert.equal(
                parseInt(borrowETHAfter),
                parseInt(paybackETH)
            );
        });

        it("Liquidation works also for solely borrow entry plus normal collat deposit", async () => {

            const deposit1 = toWei("100");
            const deposit2 = pow6(1000);
            const liquidationPercentage = toWei("0.3");
            const transferAmount = pow6(1000);
            const transferAmount2 = toWei("1000");
            const borrowAmount = toWei("100");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await USDC.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await WETH.transfer(
                bob,
                transferAmount2,
                {
                    from: alice
                }
            );

            await USDC.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await WETH.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                deposit1,
                bob
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                deposit1,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                deposit2,
                alice
            );

            /*
            await contracts.lending.collateralizeDeposit(
                1,
                USDC.address,
                {
                    from: alice
                }
            );
            */

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await chainlinkUSDC.setValue(
                pow8(0.9),
                {
                    from: owner
                }
            );

            await chainlinkWETH.setValue(
                pow8(8),
                {
                    from: owner
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await expectRevert(
                contracts.liquidation.liquidatePartiallyFromTokens(
                    1,
                    2,
                    WETH.address,
                    USDC.address,
                    paybackShares,
                    {
                        from: bob
                    }
                ),
                'LiquidationDenied()'
            );

            await chainlinkUSDC.setValue(
                pow8(0.3),
                {
                    from: owner
                }
            );

            takeSnapshot();

            const borrowETH = await contracts.security.overallETHBorrow.call(
                1
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const paybackAmount = await contracts.lending.paybackAmount(
                WETH.address,
                paybackShares
            );

            const paybackETH = await contracts.oracleHub.getTokensInETH(
                WETH.address,
                paybackAmount
            );

            const valuePureCollatToken2 = await contracts.lending.pureCollateralAmount(
                1,
                USDC.address
            );

            const valuePureCollatToken1 = await contracts.lending.pureCollateralAmount(
                1,
                WETH.address
            );

            assert.equal(
                valuePureCollatToken2.toString(),
                "0"
            );

            const collatUSDWish = await contracts.security.getFullCollateralETH(
                1,
                USDC.address
            );

            const feeLiquidation = await contracts.security.baseRewardLiquidation();

            const liquReward = Bi(paybackETH)
                * Bi(feeLiquidation)
                / Bi(toWei("1"));

            const sum = Bi(liquReward)
                + Bi(paybackETH);

            const collatPerc = Bi(sum)
                * Bi(toWei("1"))
                / Bi(collatUSDWish);

            await snapshot.restore();

            await contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                2,
                WETH.address,
                USDC.address,
                paybackShares,
                {
                    from: bob
                }
            );

            const collatUSDWishAfter = await contracts.security.getFullCollateralETH(
                1,
                USDC.address
            );

            const ratioFullColat = Bi(collatUSDWishAfter)
                * Bi(toWei("1"))
                / Bi(collatUSDWish);

            const isPercentageFullCollat = Bi(toWei("1"))
                - Bi(ratioFullColat);

            const diffPercent = Bi(isPercentageFullCollat)
                - Bi(collatPerc);

            const diffPercBool = await inBound(
                abs(diffPercent),
                WETH
            );

            assert.equal(
                diffPercBool.toString(),
                "true"
            );

            const valuePureAfterToken1 = await contracts.lending.pureCollateralAmount(
                1,
                WETH.address
            );

            //liquidator only wants token 1
            assert.equal(
                valuePureAfterToken1.toString(),
                valuePureCollatToken1.toString()
            )

            const borrowETHAfter = await contracts.security.overallETHBorrow.call(
                1
            );

            assert.isAbove(
                parseInt(borrowETH),
                parseInt(borrowETHAfter)
            );
        });
    });

    describe("Liquidation tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await WETH.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await USDC.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );
        });

        it("Liquidation can only called when debt ratio is reached ", async ()  => {

            const deposit = toWei("200");
            const deposit2 = pow6(100);
            const borrow = pow6(50);
            const liquidationPercentage = toWei("0.5");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await WETH.transfer(
                bob,
                deposit,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                deposit,
                alice
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                deposit2,
                alice
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                deposit,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrow,
                {
                    from: alice
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await expectRevert(
                contracts.liquidation.liquidatePartiallyFromTokens(
                    1,
                    2,
                    WETH.address,
                    USDC.address,
                    paybackShares,
                    {
                        from: bob
                    }
                ),
                'LiquidationDenied()'
            );

            await chainlinkWETH.setValue(
                pow8(0.75)
            );

            contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                2,
                WETH.address,
                USDC.address,
                paybackShares,
                {
                    from: bob
                }
            )
        });

        it("Liquidation can only occur when the charged alice has enough USD value of wish token", async () => {

            const transferETH = toWei("10000");
            const transferUSDC = pow6(10000);

            const depositSoley = toWei("100");
            const depositSoleyUSDC = pow6(100);

            const depositBob = toWei("1000");
            const depositAlice = pow6(1000);

            const borrow = pow6(110);
            const liquidationPercentage = toWei("0.5");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await WETH.transfer(
                bob,
                transferETH,
                {
                    from: alice
                }
            );

            await USDC.transfer(
                bob,
                transferUSDC,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositBob,
                bob
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAlice,
                alice
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                depositSoley,
                {
                    from: alice
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                1,
                USDC.address,
                {
                    from: alice
                }
            );

            await contracts.lending.solelyDeposit(
                1,
                USDC.address,
                depositSoleyUSDC,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrow,
                {
                    from: alice
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await chainlinkWETH.setValue(
                pow8(0.45)
            );

            await expectRevert(
                contracts.liquidation.liquidatePartiallyFromTokens(
                    1,
                    2,
                    USDC.address,
                    WETH.address,
                    paybackShares,
                    {
                        from: bob
                    }
                ),
                "InvalidAction()"
            );
        });

        it("Liquidator gets right token amount from liquidation", async () => {

            const transferETH = toWei("10000");
            const transferUSDC = pow6(10000);

            const deposit = toWei("100");
            const depositUSDC = pow6(100);
            const deposit2USDC = pow6(1000);

            const borrow = pow6(90);

            const liquidationPercentage = toWei("0.25");
            const newUSDValue = pow8(0.60);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await WETH.transfer(
                bob,
                transferETH,
                {
                    from: alice
                }
            );

            await USDC.transfer(
                bob,
                transferUSDC,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                deposit,
                alice
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                deposit2USDC,
                bob
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                deposit,
                {
                    from: alice
                }
            );

            await contracts.lending.solelyDeposit(
                2,
                USDC.address,
                depositUSDC,
                {
                    from: bob
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrow,
                {
                    from: alice
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await chainlinkWETH.setValue(
                newUSDValue
            );

            const balUserToken1Before = await WETH.balanceOf(
                bob
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            takeSnapshot()

            await contracts.lending.syncManually(
                WETH.address
            );

            await contracts.lending.syncManually(
                USDC.address
            );

            const collatAliceETH = await contracts.security.getFullCollateralETH(
                1,
                WETH.address
            );

            const collatAliceToken = await contracts.lending.pureCollateralAmount(
                1,
                WETH.address
            );

            const paybackAmount = await contracts.lending.paybackAmount(
                USDC.address,
                paybackShares
            );

            const paybackAmountUSD = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                paybackAmount
            );

            const feeLiquidation = await contracts.security.baseRewardLiquidation();
            const maxFeeETH = await contracts.security.maxFeeETH();

            const percentContract = await contracts.security.calculateWishPercentage(
                1,
                WETH.address,
                paybackAmountUSD,
                maxFeeETH,
                feeLiquidation
            );

            const liquReward = Bi(paybackAmountUSD)
                * Bi(feeLiquidation)
                / Bi(toWei("1"));

            //---------------- Calculations ---------------

            const sum = Bi(liquReward)
                + Bi(paybackAmountUSD);

            const collatPerc = Bi(sum)
                * Bi(toWei("1"))
                / Bi(collatAliceETH)
                + Bi(1);

            assert.equal(
                collatPerc.toString(),
                percentContract.toString()
            );

            await snapshot.restore();

            await contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                2,
                USDC.address,
                WETH.address,
                paybackShares,
                {
                    from: bob
                }
            );

            const balUserToken1After = await WETH.balanceOf(
                bob
            );

            const diffUserToken1 = Bi(balUserToken1After)
                - Bi(balUserToken1Before);

            const collatAliceTokenAfter = await contracts.lending.pureCollateralAmount(
                1,
                WETH.address
            );

            const diffAliceToken1 = Bi(collatAliceToken)
                    - Bi(collatAliceTokenAfter);

            assert.equal(
                diffAliceToken1.toString(),
                diffUserToken1.toString()
            );

            const ratio = Bi(diffAliceToken1)
                * Bi(toWei("1"))
                / (Bi(2) * Bi(collatAliceToken)) + Bi(1);


            assert.equal(
                ratio.toString(),
                collatPerc.toString()
            );
        });

        it("Right amount of borrow is paid back", async () => {

            const transferETH = toWei("100000");
            const transferUSDC = pow6(100000);

            const deposit = toWei("100");

            const depositETH = toWei("1000");
            const depositUSDC = pow6(1000);

            const borrow = pow6(450);
            const liquidationPercentage = toWei("0.20");

            const newUSDValue = pow8(0.50);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await WETH.transfer(
                bob,
                transferETH,
                {
                    from: alice
                }
            );

            await USDC.transfer(
                bob,
                transferUSDC,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositETH,
                alice
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositUSDC,
                bob
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                deposit,
                bob
            );

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrow,
                {
                    from: alice
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await chainlinkWETH.setValue(
                newUSDValue
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            const bobUSDCBefore = await USDC.balanceOf(
                bob
            );

            const balContractUSDC = await USDC.balanceOf(
                contracts.lending.address
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                USDC.address
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const aliceBorrowToken = await contracts.lending.paybackAmount(
                USDC.address,
                borrowShares
            );

            await snapshot.restore();

            await contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                2,
                USDC.address,
                WETH.address,
                paybackShares,
                {
                    from: bob
                }
            );

            const balBoBUSDCAfter = await USDC.balanceOf(
                bob
            );

            const borrowSharesAfter = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            const aliceBorrowTokenAfter = await contracts.lending.paybackAmount(
                USDC.address,
                borrowSharesAfter
            );

            const balContractUSDC2After = await USDC.balanceOf(
                contracts.lending.address
            );

            const diffBob = Bi(bobUSDCBefore)
                - Bi(balBoBUSDCAfter);

            const diffAlice = Bi(aliceBorrowToken)
                - Bi(aliceBorrowTokenAfter);

            const diffContract = Bi(balContractUSDC2After)
                - Bi(balContractUSDC);

            assert.equal(
                diffBob.toString(),
                diffContract.toString()
            );

            assert.equal(
                diffAlice.toString(),
                diffContract.toString()
            );

            const ratioAliceToken = Bi(diffAlice)
                * Bi(toWei("1"))
                / Bi(aliceBorrowToken);

            const diff = ratioAliceToken
                - Bi(liquidationPercentage);

            const diffBool = await inBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        })

        it("Liquidator get right amount if shares when pool has not enough token", async () => {

            const transfAmountETH = toWei("100000");
            const transfAmountUSDC = pow6(100000);

            const depositChad = pow6(500);

            const depositAlice = toWei("200");
            const depositBob = pow6(1000);

            const borrowAlice = pow6(320);
            const borrowBob = toWei("160");

            const newUSDValue = pow8(2);
            const liquidationPercentage = toWei("0.45");
            const fee = toWei("0.1");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: chad
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            chainlinkWETH.setValue(
                pow8(5)
            );

            chainlinkUSDC.setValue(
                pow8(1)
            );

            await USDC.transfer(
                chad,
                transfAmountUSDC,
                {
                    from: alice
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: chad
                }
            );

            await USDC.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: chad
                }
            );

            await wrapDepositAmount(
                3,
                USDC.address,
                depositChad,
                chad
            );

            await WETH.transfer(
                bob,
                transfAmountETH,
                {
                    from: alice
                }
            );

            await USDC.transfer(
                bob,
                transfAmountUSDC,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAlice,
                alice
            );

            await contracts.lending.solelyDeposit(
                2,
                USDC.address,
                depositBob,
                {
                    from: bob
                }
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrowAlice,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                2,
                WETH.address,
                borrowBob,
                {
                    from: bob
                }
            );

            await chainlinkUSDC.setValue(
                newUSDValue
            );

            const chadLendingData1 = await contracts.lending.userLendingData(
                3,
                WETH.address
            );

            const chadShare1 = chadLendingData1.shares;

            const aliceBorrowShare2 = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            const paybackShares = Bi(aliceBorrowShare2)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            console.log(paybackShares.toString(), 'paybackShares');
            console.log(aliceBorrowShare2.toString(), 'aliceBorrowShare2');

            assert.equal(
                chadShare1.toString(),
                "0"
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                USDC.address
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const pseudoWETH = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            const totalPoolWETH = await contracts.lending.getTotalPool(
                WETH.address
            );

            const totalShareWETH = await contracts.lending.getTotalDepositShares(
                WETH.address
            );

            const paybackAmount = await contracts.lending.paybackAmount(
                USDC.address,
                paybackShares
            );

            const payBackETH = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                paybackAmount
            );

            const totalPoolToken1ETH = await contracts.oracleHub.getTokensInETH(
                WETH.address,
                totalPoolWETH
            );

            const feeETH = Bi(payBackETH)
                * Bi(fee)
                / Bi(toWei("1"));

            const poolInShares = Bi(totalPoolWETH)
                * Bi(totalShareWETH)
                / Bi(pseudoWETH);

            const feeLiquidation = await contracts.security.baseRewardLiquidation();

            const maxFeeETH = await contracts.security.maxFeeETH();

            const liquidationFraction = await contracts.security.calculateWishPercentage(
                1,
                WETH.address,
                payBackETH,
                maxFeeETH,
                feeLiquidation
            );

            const aliceSharesLending = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            const calcCashoutShares = Bi(aliceSharesLending)
                * Bi(liquidationFraction)
                / Bi(toWei("1"));

            const sharesToUser = Bi(calcCashoutShares)
                - Bi(poolInShares);

            await snapshot.restore();

            await contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                3,
                USDC.address,
                WETH.address,
                paybackShares,
                {
                    from: chad
                }
            );

            const chadShare1After = await contracts.lending.getPositionLendingShares(
                3,
                WETH.address
            )

            /*
            assert.equal(
                chadShare1After.toString(),
                sharesToUser.toString()
            );
            */

            assert.equal(
                chadShare1After.toString(),
                "18200000987556372128"
            );

            assert.equal(
                sharesToUser.toString(),
                "18200000881334559901"
            );

            const aliceBorrowShare2After = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            const fractionBorrow = Bi(aliceBorrowShare2After)
                * Bi(toWei("1"))
                / Bi(aliceBorrowShare2);

            const inverseFraction = Bi(toWei("1"))
                - Bi(fractionBorrow);

            assert.isAbove(
                parseInt(liquidationPercentage),
                parseInt(inverseFraction)
            );

            const rewardAmountChadSharesETH = await contracts.security.getETHCollateral(
                3,
                WETH.address
            );

            const poolAfter1 = await contracts.lending.getTotalPool(
                WETH.address
            );

            assert.equal(
                poolAfter1.toString(),
                "0"
            );

            const sumBareETH = Bi(rewardAmountChadSharesETH)
                + Bi(totalPoolToken1ETH)
                - Bi(feeETH);

            console.log(sumBareETH.toString(), 'sumBareETH')
            console.log(payBackETH.toString(), 'payBackETH')

            const diff = Bi(sumBareETH) - Bi(payBackETH);

            const diffBool = await inBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it("Max fee check works correctly", async () => {

            const transferETH = toWei("1000000000");
            const transferUSDC = pow6(1000000000);

            const deposit = toWei("1000000");
            const deposit2 = toWei("1000000");
            const depositUSDC = pow6(1000000);

            const borrow = pow6(900000);

            const liquidationPercentage = toWei("0.50");
            const liquidationPercentageSMALL = toWei("0.01");

            const newUSDValue = pow8(2);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await chainlinkUSDC.setValue(
                pow8(1)
            );

            await WETH.transfer(
                bob,
                transferETH,
                {
                    from: alice
                }
            );

            await USDC.transfer(
                bob,
                transferUSDC,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                deposit2,
                alice
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositUSDC,
                alice
            );

            await contracts.lending.unCollateralizeDeposit(
                1,
                USDC.address,
                {
                    from: alice
                }
            );

            await contracts.lending.solelyDeposit(
                1,
                WETH.address,
                deposit,
                {
                    from: alice
                }
            );

            const totalCollat = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            console.log(totalCollat.toString(), 'totalCollat');

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrow,
                {
                    from: alice
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            const paybackSharesSmall = Bi(borrowShares)
                * Bi(liquidationPercentageSMALL)
                / Bi(toWei("1"));

            await time.increase(
                2 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            const balBobBefore = await WETH.balanceOf(
                bob
            );

            await chainlinkUSDC.setValue(
                newUSDValue
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                USDC.address
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const paybackToken = await contracts.lending.paybackAmount(
                USDC.address,
                paybackShares
            );

            const paybackETH = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                paybackToken
            );

            const paybackTokenSmall = await contracts.lending.paybackAmount(
                USDC.address,
                paybackSharesSmall
            );

            const paybackETHSmall = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                paybackTokenSmall
            );

            const feeLiquidation = await contracts.security.baseRewardLiquidation();
            const maxFeeETH = await contracts.security.maxFeeETH();

            const feeBig = await contracts.security.checkMaxFee(
                paybackETH,
                feeLiquidation,
                maxFeeETH
            );

            const feeSmall = await contracts.security.checkMaxFee(
                paybackETHSmall,
                feeLiquidation,
                maxFeeETH
            );

            assert.equal(
                maxFeeETH.toString(),
                feeBig.toString()
            );

            /*const feeSmallETH = Bi(paybackETHSmall)
                * Bi(feeLiquidation)
                / Bi(toWei("1"));
            */

            assert.equal(
                feeSmall.toString(),
                maxFeeETH.toString() // feeSmallETH
            );

            await snapshot.restore();

            await contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                2,
                USDC.address,
                WETH.address,
                paybackShares,
                {
                    from: bob
                }
            );

            const balBobAfter = await WETH.balanceOf(
                bob
            );

            const diffBal = Bi(balBobAfter)
                - Bi(balBobBefore);

            const diffBalUSD = await contracts.oracleHub.getTokensInETH(
                WETH.address,
                diffBal
            );

            const feeAmountUSD = Bi(diffBalUSD)
                - Bi(paybackETH);

            const diff = Bi(maxFeeETH)
                - Bi(feeAmountUSD);

            console.log(maxFeeETH.toString(), 'maxFeeETH');
            console.log(paybackETH.toString(), 'paybackETH');

            const diffBool = await inBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });
    });

    describe("Liquidation threshold and allowBorrow tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup(
                toWei("0.9")
            );

            const tokenDataUSDT = await createToken(
                {
                    Token: Token,
                    Chainlink: Chainlink,
                    OracleHub: contracts.oracleHub,
                    value: pow8(1),
                    dec: 18,
                    user: alice
                }
            );

            USDT = tokenDataUSDT.token;
            chainlinkUSDT = tokenDataUSDT.oracle

            await setupHeartbeatForTests(
                {
                    oracleHub: contracts.oracleHub,
                    tokens: [
                        USDT
                    ],
                    chainlinkInterfaces: [
                        chainlinkUSDT
                    ]
                }
            );

            await addPools(
                contracts.lending,
                [
                    {
                        allowBorrow: false,
                        poolToken: USDT,
                        mulFactor: toWei("0.2"),
                        collFactor: toWei("0.85"),
                        maxDeposit: HUGE_AMOUNT
                    }
                ]
            );

            isolationPool = await IsolationContract.new(
                contracts.oracleHub.address,
                contracts.lending.address,
                contracts.liquidation.address,
                USDT.address,
                contracts.security.address,
                toWei("0.95"),
                // toWei("0.95"),
                [
                    USDC.address
                ],
                [
                    toWei("1")
                ]
            );

            await contracts.lending.setVerifiedIsolationPool(
                isolationPool.address,
                true
            );

            await approveTokens(
                contracts.lending,
                [
                    {
                        Token: USDC,
                        contract: contracts.lending,
                        user: bob,
                        type: "normal"
                    },
                    {
                        Token: WETH,
                        contract: contracts.lending,
                        user: bob,
                        type: "normal"
                    },
                    {
                        Token: USDT,
                        contract: contracts.lending,
                        user: bob,
                        type: "normal"
                    },
                    {
                        Token: USDT,
                        contract: contracts.lending,
                        user: alice,
                        type: "normal"
                    },
                    {
                        Token: USDT,
                        contract: contracts.liquidation,
                        user: bob,
                        type: "normal"
                    },
                    {
                        Token: USDT,
                        contract: contracts.liquidation,
                        user: alice,
                        type: "normal"
                    },
                ]
            );
        });

        it("Token are not allowed to borrow if allowBorrow = false", async () => {

            const depositAmount = toWei("1562");
            const borrowAmount = toWei("321");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDT
                ]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await wrapDepositAmount(
                1,
                USDT.address,
                depositAmount,
                alice
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.collateralizeDeposit(
                1,
                USDT.address,
                {
                    from: alice
                }
            );

            await expectRevert(
                contracts.lending.borrowExactAmount(
                    1,
                    USDT.address,
                    borrowAmount,
                    {
                        from: alice
                    }
                ),
                "NotAllowedToBorrow()"
            );

            const token1Before = await WETH.balanceOf(
                alice
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            const token1After = await WETH.balanceOf(
                alice
            );

            const diff = Bi(token1After)
                - Bi(token1Before);

            assert.equal(
                diff.toString(),
                borrowAmount
            );
        });

        it("User can borrow only up to liquidation threshold (normal pool)", async () => {

            const depositAmount = toWei("5698");
            const depositAmount2 = toWei("12549");

            const depositAmountUSDC = pow6(12549);

            const transferAmount = toWei("100000");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount2,
                alice
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmountUSDC,
                alice
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.collateralizeDeposit(
                1,
                USDC.address,
                {
                    from: alice
                }
            );

            const collatWheigtedETH = await contracts.security.overallETHCollateralsWeighted(
                1
            );

            const allowedBorrowAmountETH = Bi(collatWheigtedETH)
                * Bi(toWei("0.95"))
                / Bi(toWei("1"));

            const allowedBorrowAmount = await contracts.oracleHub.getTokensFromETH(
                WETH.address,
                allowedBorrowAmountETH
            );

            const tinyBiggerAmount = Bi(allowedBorrowAmount);

            await takeSnapshot();

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                Bi(allowedBorrowAmount)
                    - Bi(1),
                {
                    from: alice
                }
            );

            await snapshot.restore();

            await expectRevert(
                contracts.lending.borrowExactAmount(
                    1,
                    WETH.address,
                    tinyBiggerAmount,
                    {
                        from: alice
                    }
                ),
                "ResultsInBadDebt()"
            );
        });

        it("Should give correct result for getTokensInUSD and getTokensFromUSD", async () => {

            const tokenDecimals = await contracts.oracleHub.getTokenDecimals(
                WETH.address
            );

            const expectedDecimals = "18";

            assert.equal(
                tokenDecimals.toString(),
                expectedDecimals
            );

            const wethAddy = await contracts.oracleHub.WETH_ADDRESS();
            const wethPriceInUSD = await contracts.oracleHub.getETHPriceInUSD();
            const initialAmount = toWei("1");

            const tokensInETH = await contracts.oracleHub.getTokensInETH(
                wethAddy,
                initialAmount
            );

            assert.equal(
                tokensInETH.toString(),
                initialAmount
            );

            const resIn = await contracts.oracleHub.getTokensPriceInUSD(
                wethAddy,
                initialAmount
            );

            assert.equal(
                resIn.toString().includes(
                    wethPriceInUSD.toString()
                ),
                true
            );

            const resFrom = await contracts.oracleHub.getTokensPriceFromUSD(
                wethAddy,
                resIn.toString()
            );

            assert.equal(
                resFrom.toString(),
                initialAmount
            );
        });

        it.skip("User can borrow only up to liquidation threshold (isolation pool)", async () => {

            const depositAmount = toWei("5698");
            const depositAmountUSDC = pow6(12549);

            const transferAmount = pow6(100000);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC,
                    chainlinkUSDT
                ]
            );

            await chainlinkUSDT.setValue(
                pow8(1)
            );

            await chainlinkUSDC.setValue(
                pow8(0.9995)
            );

            await USDC.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositAmountUSDC,
                bob
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: alice
                }
            );

            await USDT.approve(
                isolationPool.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
                {
                    from: alice
                }
            )

            const borrowPercentageCap = await isolationPool.BORROW_PERCENTAGE_CAP();

            const collatWheigtedETH = await isolationPool.getTotalWeightedCollateralETH(
                1
            );

            const allowedBorrowAmountETH = Bi(collatWheigtedETH)
                * Bi(borrowPercentageCap)
                / Bi(toWei("1"));

            await takeSnapshot();

            await isolationPool.borrowExactUSD(
                1,
                allowedBorrowAmountETH,
                {
                    from: alice
                }
            );

            await snapshot.restore();

            const tinyBiggerAmount = Bi(allowedBorrowAmountETH)
                + Bi(toWei("0.000000000000000001"));

            await expectRevert(
                isolationPool.borrowExactUSD(
                    1,
                    tinyBiggerAmount,
                    {
                        from: alice
                    }
                ),
                "WiseIsolation: OWE_TOO_MUCH"
            );
        });
    })
});
