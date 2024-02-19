const Lending = artifacts.require("TesterLending");
const Token = artifacts.require("Token");
const OracleHub = artifacts.require("TesterWiseOracleHub");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const Liquidation = artifacts.require("WiseLiquidation");
const FeeManager = artifacts.require("FeeManager");
const Chainlink = artifacts.require("TesterChainlink")
const WiseSecuirty = artifacts.require("WiseSecurity");
const PositionNFT = artifacts.require("PositionNFTs");
const AaveSecondLayer = artifacts.require("AaveHub");

const { assert } = require("chai");
const { expectRevert } = require('@openzeppelin/test-helpers');

require("./utils");
require("./constants");
require("./test-scenarios");

contract("WiseLending ScalingAlgorithm test", (accounts) => {

    [owner, alice, bob, chad] = accounts;

    let USDC;
    let WETH;
    let chainlinkUSDC;
    let chainlinkWETH;

    let contracts;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

    preparationSetup = async () => {

        const setupContracts = await setUpContracts(
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
                borrowCap: toWei("0.95")
            }
        );

        const tokenData = await createToken(
            {
                Token: Token,
                Chainlink: Chainlink,
                OracleHub: setupContracts.oracleHub,
                value: pow8(1),
                dec: 6,
                user: alice
            }
        );

        const tokenData2 = await createToken(
            {
                Token: Token,
                Chainlink: Chainlink,
                OracleHub: setupContracts.oracleHub,
                value: pow8(1),
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
                oracleHub: setupContracts.oracleHub,
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
            setupContracts.lending,
            [
                {
                    allowBorrow: true,
                    poolToken: USDC,
                    mulFactor: toWei("0.2"),
                    collFactor: toWei("0.85"),
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: WETH,
                    mulFactor: toWei("0.1"),
                    collFactor: toWei("0.5"),
                    maxDeposit: HUGE_AMOUNT
                }
            ]
        );

        await approveTokens(
            setupContracts.lending,
            [
                {
                    Token: USDC,
                    contract: setupContracts.lending,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: WETH,
                    contract: setupContracts.lending,
                    user: alice,
                    type: "normal"
                }
            ]
        );

        return setupContracts
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

    describe("getter and Setter tests", () => {

        beforeEach(async () => {
            contracts = await preparationSetup();
        });

        it("Initializing multiplication factor and setter are working as intended", async () =>{

            let borrowData1 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let multFactor1 = borrowData1.multiplicativeFactor;

            let borrowData2 = await contracts.lending.borrowRatesData(
                USDC.address
            );

            let multFactor2 = borrowData2.multiplicativeFactor;

            assert.equal(
                multFactor1.toString(),
                toWei("0.1")
            );

            assert.equal(
                multFactor2.toString(),
                toWei("0.2")
            );

        });

        it("Initializing resonanz factor is working as intended", async () => {

            const borrowData1 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            const startResonanz1 = borrowData1.pole;

            const borrowData2 = await contracts.lending.borrowRatesData(
                USDC.address
            );

            const startResonanz2 = borrowData2.pole;

            const data1 = await contracts.lending.borrowRatesData(WETH.address);
            const data2 = await contracts.lending.borrowRatesData(USDC.address);

            const minResonanz1 = data1.minPole;

            const minResonanz2 = data2.minPole;

            const maxResonanz1 = data1.maxPole;

            const maxResonanz2 = data2.maxPole;

            const testValueStart1 = (Bi(maxResonanz1) + Bi(minResonanz1))
                / Bi(2);

            const testValueStart2 = (Bi(maxResonanz2) + Bi(minResonanz2))
                / Bi(2);

            assert.equal(
                testValueStart1.toString(),
                startResonanz1.toString()
            );

            assert.equal(
                testValueStart2.toString(),
                startResonanz2.toString()
            );
        })

        it("Initializing minResonanz, maxResonazn, deltaResonanz plus getter and setter are working as intended", async () =>{

            const TEN18 = ONE_ETH;
            const NORM_FACTOR = 4838400;

            const data1 = await contracts.lending.borrowRatesData(WETH.address);
            const data2 = await contracts.lending.borrowRatesData(USDC.address);

            const minResonanz1 = data1.minPole;

            const minResonanz2 = data2.minPole;

            const maxResonanz1 = data1.maxPole;

            const maxResonanz2 = data2.maxPole;

            const borrowData1 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            const deltaResonanz1 = borrowData1.deltaPole;

            const borrowData2 = await contracts.lending.borrowRatesData(
                USDC.address
            );

            const deltaResonanz2 = borrowData2.deltaPole;

            const testValueDelta1 = (Bi(maxResonanz1) - Bi(minResonanz1))
                / Bi(NORM_FACTOR);

            const testValueDelta2 = (Bi(maxResonanz2) - Bi(minResonanz2))
                / Bi(NORM_FACTOR);

            assert.isAbove(
                parseInt(minResonanz1),
                parseInt(TEN18)
            );

            assert.isAbove(
                parseInt(minResonanz2),
                parseInt(TEN18)
            );

            assert.isAbove(
                parseInt(maxResonanz1),
                parseInt(TEN18)
            );

            assert.isAbove(
                parseInt(maxResonanz2),
                parseInt(TEN18)
            );

            assert.equal(
                testValueDelta1.toString(),
                deltaResonanz1.toString()
            );

            assert.equal(
                testValueDelta2.toString(),
                deltaResonanz2.toString()
            );
        });

        it("timeStampScaling works as intended", async () => {

            const depositAmount = toWei("1");
            const withdrawAmount = toWei("0.5");

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            const oldTimestamp1 = await contracts.lending.timestampsPoolData(
                WETH.address
            );

            await contracts.lending.withdrawExactAmount(
                1,
                WETH.address,
                withdrawAmount,
                {
                    from : alice
                }
            );

            const oldTimestamp2 = await contracts.lending.timestampsPoolData(
                WETH.address
            );

            assert.equal(
                oldTimestamp1.timeStampScaling.toString(),
                oldTimestamp2.timeStampScaling.toString()
            );

            await advanceTimeAndBlock(
                3 * SECONDS_IN_HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            const oldTimestamp3 = await contracts.lending.timestampsPoolData(
                WETH.address
            );

            assert.isAbove(
                parseInt(oldTimestamp3.timeStampScaling),
                parseInt(oldTimestamp2.timeStampScaling)
            );
        });
    });

    describe("Higher Calculation tests and Bools", () => {

        beforeEach(async () => {
            contracts = await preparationSetup();
        });

        it("calculateNewBorrowRate works as intended", async () => {

            const depositAmount = toWei("1");
            const depositAmount2 = pow6(2000);
            const borrowAmount = toWei("1");

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData = await contracts.lending.borrowPoolData(
                WETH.address
            );

            let borrowRate = borrowData.borrowRate;

            assert.equal(
                borrowRate.toString(),
                "88" // initially 0
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount2,
                alice
            );

            const borrowData2 = await contracts.lending.borrowPoolData(
                WETH.address
            );

            borrowRate = borrowData2.borrowRate;

            assert.equal(
                borrowRate.toString(),
                "44" // initially 0
            );

            await contracts.lending.collateralizeDeposit(
                1,
                USDC.address,
                {
                    from : alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from : alice
                }
            );

            const borrowData3 = await contracts.lending.borrowPoolData(
                WETH.address
            );

            borrowRate = borrowData3.borrowRate;

            assert.isAbove(
                parseInt(borrowRate),
                parseInt(0)
            );
        });

        it("newMaxValue condition and calculations work as intended", async () => {

            const transfereAmount = toWei("100");
            const depositAmount = toWei("5");

            const borrowData1 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            const value = borrowData1.pole;

            await WETH.transfer(
                bob,
                transfereAmount,
                {
                    from : alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

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

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            let algoData = await contracts.lending.algorithmData(
                WETH.address
            );

            let val1 = algoData.maxValue;

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            await advanceTimeAndBlock(
                5 * SECONDS_IN_HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            algoData = await contracts.lending.algorithmData(
                WETH.address
            );

            let val2 = algoData.maxValue;

            const borrowData2 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            const value2 = borrowData2.pole;


            assert.equal(
                value.toString(),
                value2.toString()
            );

            assert.isAbove(
                parseInt(val2),
                parseInt(val1)
            );

        });

        it("change Resonanz factor condition and calculations work as intended (no inverting)", async () => {

            const transfereAmount = toWei("100");
            const depositAmount = toWei("200");
            const depositAmount2 = toWei("50");
            const triggerBorrowAmount = toWei("0.1");
            const depositAmount3 = toWei("1");
            const borrowAmount = toWei("100");
            const fraction = toWei("0.2");
            const fraction2 = toWei("0.01");

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

            await WETH.transfer(
                bob,
                transfereAmount,
                {
                    from : alice
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount2,
                bob
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from : alice
                }
            );

            await advanceTimeAndBlock(
                30 * SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                triggerBorrowAmount,
                {
                    from : alice
                }
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData1 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole1 = borrowData1.pole;

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount3,
                bob
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from : alice
                }
            );

            const borrowData2 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole2 = borrowData2.pole;

            assert.equal(
                Pole2.toString(),
                Pole1.toString()
            );

            const borrowSharesUser1 = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            await contracts.lending.paybackExactShares(
                1,
                WETH.address,
                borrowSharesUser1,
                {
                    from : alice
                }
            );

            const user2LendingShares = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            const shareFraction = Bi(user2LendingShares)
                * Bi(fraction)
                / Bi(toWei("1"));

            await contracts.lending.withdrawExactShares(
                2,
                WETH.address,
                shareFraction,
                {
                    from : bob
                }
            );

            await advanceTimeAndBlock(
                2 * SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            const user1LendingShares = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            const shareFraction2 = Bi(user1LendingShares)
                * Bi(fraction2)
                / Bi(toWei("1"));

            await contracts.lending.withdrawExactShares(
                1,
                WETH.address,
                shareFraction2,
                {
                    from : alice
                }
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData3 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole3 = borrowData3.pole;

            assert.isAbove(
                parseInt(Pole2),
                parseInt(Pole3)
            );
        });

        it("reset Resonanz factor condition and calculations work as intended", async () => {

            const transfereAmount = toWei("100");
            const depositAmount = toWei("100");
            const depositAmount2 = toWei("50");
            const triggerBorrowAmount = toWei("1");
            const depositAmount3 = toWei("1");
            const borrowAmount = toWei("10");
            const fraction = toWei("0.1");
            const fraction2 = toWei("0.2");

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

            await WETH.transfer(
                bob,
                transfereAmount,
                {
                    from : alice
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount2,
                bob
            );

            await contracts.lending.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from : alice
                }
            );

            await advanceTimeAndBlock(
                30 * SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                triggerBorrowAmount,
                {
                    from : alice
                }
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData1 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole1 = borrowData1.pole;

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            let user1LendingShares = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            let shareFraction = Bi(user1LendingShares)
                * Bi(fraction)
                / Bi(toWei("1"));

            await contracts.lending.withdrawExactShares(
                1,
                WETH.address,
                shareFraction,
                {
                    from : alice
                }
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount3,
                bob
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData2 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole2 = borrowData2.pole;

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from : alice
                }
            );

            assert.isAbove(
                parseInt(Pole1),
                parseInt(Pole2)
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            await contracts.lending.paybackExactShares(
                1,
                WETH.address,
                borrowShares,
                {
                    from : alice
                }
            );

            const user2LendingShares = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            await contracts.lending.withdrawExactShares(
                2,
                WETH.address,
                user2LendingShares,
                {
                    from : bob
                }
            );

            await advanceTimeAndBlock(
                2 * SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            aliceLendingShares = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            shareFraction = Bi(aliceLendingShares)
                * Bi(fraction2)
                / Bi(toWei("1"));

            await contracts.lending.withdrawExactShares(
                1,
                WETH.address,
                shareFraction,
                {
                    from : alice
                }
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData3 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole3 = borrowData3.pole;

            assert.equal(
                Pole1.toString(),
                Pole3.toString()
            );
        });

        it("change Resonanz factor condition and calculations work as intended (inverting)", async () => {

            const transfereAmount = toWei("100");
            const depositAmount = toWei("100");
            const depositAmount2 = toWei("12");
            const fraction = toWei("0.23");
            const fraction2 = toWei("0.3");

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

            const borrowData1 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole1 = borrowData1.pole;

            await WETH.transfer(
                bob,
                transfereAmount,
                {
                    from : alice
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData2 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole2 = borrowData2.pole;

            assert.equal(
                Pole2.toString(),
                Pole1.toString()
            );

            let shareUserLending = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            let fractionWithdraw = Bi(shareUserLending)
                * Bi(fraction)
                / Bi(toWei("1"));

            await contracts.lending.withdrawExactShares(
                1,
                WETH.address,
                fractionWithdraw,
                {
                    from : alice
                }
            );

            await advanceTimeAndBlock(
                2 * SECONDS_IN_3HOUR
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData3 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole3 = borrowData3.pole;

            assert.isAbove(
                parseInt(Pole3),
                parseInt(Pole2)
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR / 2
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount2,
                alice
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR / 2
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData4 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole4 = borrowData4.pole;

            assert.isAbove(
                parseInt(Pole4),
                parseInt(Pole3)
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR / 2
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            shareUserLending = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            fractionWithdraw = Bi(shareUserLending)
                * Bi(fraction2)
                / Bi(toWei("1"));

            await contracts.lending.withdrawExactShares(
                2,
                WETH.address,
                fractionWithdraw,
                {
                    from : bob
                }
            );

            await advanceTimeAndBlock(
                SECONDS_IN_3HOUR
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowData5 = await contracts.lending.borrowRatesData(
                WETH.address
            );

            let Pole5 = borrowData5.pole;

            assert.isAbove(
                parseInt(Pole4),
                parseInt(Pole5)
            );
        });

        it("borrow rate gets calculated correctly and compared with hard coded values", async () => {

            const utilisation1 = "0.20";
            const pole1 = "1.01";

            const utilisation2 = "0.03";
            const pole2 = "1.0054";

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            // set hardcoded value for easier comparison
            await contracts.lending.setUtilisationTest(
                toWei(utilisation1),
                WETH.address
            );

            // set hardcoded value for easier comparision
            await contracts.lending.setPoleTest(
                toWei(pole1),
                WETH.address
            );

            // calculating new borrow rate with predefined values to check if computation is correct
            await contracts.lending.newBorrowRateTest(
                WETH.address,
            );

            // multiplicationFacor = 1E18
            const borrowData = await contracts.lending.borrowRatesData(
                WETH.address
            );

            const borrowPoolData = await contracts.lending.borrowPoolData(
                WETH.address
            )

            const mulFactor = borrowData.multiplicativeFactor;

            const borrowRate1 = borrowPoolData.borrowRate;

            const difference1 = Bi(toWei(pole1))
                - Bi(toWei(utilisation1));

            const denominator1 = Bi(difference1)
                * Bi(toWei(pole1));

            const nummerator1 = Bi(mulFactor)
                * Bi(toWei(utilisation1))
                * Bi(toWei("1"));

            const computedValue1 = Bi(nummerator1)
                / Bi(denominator1);

            // hardcoded value computed from wolfram alpha with above values
            const hardcoded1 = toWei("0.244468891333577802");

            assert.equal(
                borrowRate1.toString(),
                computedValue1.toString()
            );

            // to be sure make a second round with new values
            const borrowData2 = await contracts.lending.borrowRatesData(
                USDC.address
            );

            const mulFactor2 = borrowData2.multiplicativeFactor;

            // set hardcoded value for easier comparison
            await contracts.lending.setUtilisationTest(
                toWei(utilisation2),
                USDC.address
            );

            // set hardcoded value for easier comparision
            await contracts.lending.setPoleTest(
                toWei(pole2),
                USDC.address,
            );

            await contracts.lending.newBorrowRateTest(
                USDC.address
            );

            const borrowPoolData2 = await contracts.lending.borrowPoolData(
                USDC.address
            )

            const borrowRate2 = borrowPoolData2.borrowRate;

            const difference2 = Bi(toWei(pole2))
                - Bi(toWei(utilisation2));

            const denominator2 = Bi(difference2)
                * Bi(toWei(pole2));

            const computedValue2 = Bi(mulFactor2)
                * Bi(toWei(utilisation2))
                * Bi(toWei("1"))
                / Bi(denominator2);

            // hardcoded value computed from wolfram alpha with above values
            const hardcoded2 = toWei("0.061182838018150826");

            assert.equal(
                borrowRate2.toString(),
                computedValue2.toString()
            );
        });

        it("deposit rate gets calculated correctly and compared with hard coded values", async () => {

            const BOUND = 5;

            const utilisation1 = "0.35";
            const pole1 = "1.02";
            const pseudoToken1 = "10";
            const totalTokenDue1 = "5";

            const utilisation2 = "0.73";
            const pole2 = "1.067";
            const pseudoToken2 = "165";
            const totalTokenDue2 = "153";

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            // multiplicationFacor = 1E18

            // fee is 20% = 2E17
            const poolData = await contracts.lending.globalPoolData(
                WETH.address
            );

            const fee = poolData.poolFee;

            const difference = Bi(toWei("1"))
            - Bi(fee);

            // set hardcoded value for easier comparison
            await contracts.lending.setUtilisationTest(
                toWei(utilisation1),
                WETH.address
            );

            // set hardcoded value for easier comparision
            await contracts.lending.setPoleTest(
                toWei(pole1),
                WETH.address
            );

            // calculating new borrow rate with predefined values to check if computation is correct
            await contracts.lending.newBorrowRateTest(
                WETH.address
            );

            // 10 token inside the contract
            await contracts.lending.setPseudoTotalPoolTest(
                toWei(pseudoToken1),
                WETH.address
            );

            // 5 token borrowed
            await contracts.lending.setPseudoTotalBorrowAmountTest(
                toWei(totalTokenDue1),
                WETH.address
            );

            /*
            const depositAPYFirstScenario = await contracts.lending.getValueDepositAPY(
                WETH.address
            );
            */

            const borrowData = await contracts.lending.borrowPoolData(
                WETH.address
            );

            const borrowRate1 = borrowData.borrowRate;

            // hardcoded value computed from wolfram alpha with above values
            const depositHardcoded1 = toWei("0.020485806262803628");

            const computedValue1 = Bi(borrowRate1)
                * Bi(difference)
                * Bi(toWei(totalTokenDue1))
                / Bi(toWei(pseudoToken1))
                / Bi(toWei("1"));

            const diff = abs(
                Bi(depositHardcoded1)- Bi(computedValue1)
            );

            console.log("diff: ", diff.toString());
            console.log(BOUND.toString(),"BOUND");

            const bound = BOUND > diff;

            assert.equal(
                bound.toString(),
                "true"
            );

            // doing same calculations with different values

            // set hardcoded value for easier comparison
            await contracts.lending.setUtilisationTest(
                toWei(utilisation2),
                USDC.address
            );

            // set hardcoded value for easier comparision
            await contracts.lending.setPoleTest(
                toWei(pole2),
                USDC.address
            )

            // calculating new borrow rate with predefined values to check if computation is correct
            await contracts.lending.newBorrowRateTest(
                USDC.address,
            );

            // 10 token inside the contract
            await contracts.lending.setPseudoTotalPoolTest(
                toWei(pseudoToken2),
                USDC.address
            );

            // 5 token borrowed
            await contracts.lending.setPseudoTotalBorrowAmountTest(
                toWei(totalTokenDue2),
                USDC.address
            );

            /*
            const depositAPYSecondScenario = await contracts.lending.getValueDepositAPY(
                USDC.address
            );
            */

            const borrowData2 = await contracts.lending.borrowPoolData(
                USDC.address
            );

            const borrowRate2 = borrowData2.borrowRate;

            // hardcoded value computed from wolfram alpha with above values
            const depositHardcoded2 = toWei("1.506003611799556501");

            const computedValue2 = Bi(borrowRate2)
                * Bi(difference)
                * Bi(toWei(totalTokenDue2))
                / Bi(toWei(pseudoToken2))
                / Bi(toWei("1"));

            const diff2 = abs(
                Bi(depositHardcoded1)- Bi(computedValue1)
            );

            const bound2 = BOUND > diff2;

            assert.equal(
                bound2.toString(),
                "true"
            );
        });
    });

    describe("LASA parameter set function tests", () => {

        beforeEach(async () => {
            contracts = await preparationSetup();
        });

        it("Parameters get updated correctly after function call", async () => {

            const newMulfactor = toWei("0.5");
            const newUpperBound = toWei("3");
            const newLowerBound = toWei("1");

            const NORMALISATION_FACTOR = 4838400;

            await contracts.lending.setParamsLASA(
                WETH.address,
                newMulfactor,
                newUpperBound,
                newLowerBound,
                true,
                false
            );

            const sqrtTermMax = Bi(Math.sqrt(
                Math.pow(10,36)/4
                + newMulfactor
                * Math.pow(10,36)
                / newLowerBound
                )
            );

            const sqrtTermMin = Bi(Math.sqrt(
                Math.pow(10,36)/4
                + newMulfactor
                * Math.pow(10,36)
                / newUpperBound
                )
            );

            const newMaxPole = Bi(Math.pow(10,18)/2)
                + sqrtTermMax

            const newMinPole = Bi(Math.pow(10,18)/2)
                + sqrtTermMin

            const newDelta = (Bi(newMaxPole)
                - Bi(newMinPole)) / Bi(NORMALISATION_FACTOR);

            const startPole = (Bi(newMaxPole)
            + Bi(newMinPole)) / Bi(2);

            const borrowRateData = await contracts.lending.borrowRatesData(
                WETH.address
            );

            const algoData = await contracts.lending.algorithmData(
                WETH.address
            );

            const steppingBool = algoData.increasePole;

            assert.equal(
                steppingBool.toString(),
                "true"
            );

            const newBestPole = algoData.bestPole;

            const maxPoolContract = borrowRateData.maxPole;
            const minPoolContract = borrowRateData.minPole;
            const deltaContract = borrowRateData.deltaPole;
            const poleContract = borrowRateData.pole;

            const diffMaxPole = Bi(maxPoolContract)
                - Bi(newMaxPole);

            const diffMinPole = Bi(minPoolContract)
                - Bi(newMinPole);

            const diffDelta = Bi(newDelta)
                - Bi(deltaContract);

            const diffStart = Bi(startPole)
                - Bi(poleContract)

            const diffMaxPoleBool = await inBoundVar(
                abs(diffMaxPole),
                WETH,
                0.0000000000001
            );

            const diffBestPole = Bi(newBestPole)
                - Bi(startPole);

            const diffMinPoleBool = await inBoundVar(
                abs(diffMinPole),
                WETH,
                0.0000000000001
            );

            const diffStartBool = await inBoundVar(
                abs(diffStart),
                WETH,
                0.0000000000001
            );

            const diffDeltaBool = await inBoundVar(
                abs(diffDelta),
                WETH,
                0.0000000000001
            );

            const diffBestPoleBool = await inBoundVar(
                abs(diffBestPole),
                WETH,
                0.0000000000001
            );

            assert.equal(
                diffMaxPoleBool.toString(),
                "true"
            );

            assert.equal(
                diffMinPoleBool.toString(),
                "true"
            );

            assert.equal(
                diffDeltaBool.toString(),
                "true"
            );

            assert.equal(
                diffStartBool.toString(),
                "true"
            );

            assert.equal(
                diffBestPoleBool.toString(),
                "true"
            );
        });

        it("Lock for pool works correctly", async () => {

            const newMulfactor = toWei("0.5");
            const newUpperBound = toWei("3");
            const newLowerBound = toWei("1");

            await contracts.lending.setParamsLASA(
                USDC.address,
                newMulfactor,
                newUpperBound,
                newLowerBound,
                false,
                true
            );

            await expectRevert(
                contracts.lending.setParamsLASA(
                    USDC.address,
                    newMulfactor,
                    newUpperBound,
                    newLowerBound,
                    false,
                    false
                ),
                "InvalidAction()"
            );

            await contracts.lending.setParamsLASA(
                WETH.address,
                newMulfactor,
                newUpperBound,
                newLowerBound,
                false,
                false
            );
        });

        it("Borrow rate gets calculated with new curve after update", async () => {

            const newMulfactor = toWei("0.5");
            const newUpperBound = toWei("3");
            const newLowerBound = toWei("1");

            const depositAmount = toWei("100");

            const borrowAmount = toWei("50");

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkWETH
                ]
            );

            await contracts.lending.depositExactAmountMint(
                WETH.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.nft.setApprovalForAll(
                owner,
                true,
                {
                    from: alice
                }
            );

            // now that user reserved position, we can mint for them!
            await contracts.nft.mintPositionForUser(
                alice,
                {
                    from: owner
                }
            );

            const aliceNFT = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.borrowExactAmount(
                aliceNFT,
                WETH.address,
                BigInt(borrowAmount * 0.949),
                {
                    from: alice
                }
            );

            const borrowData = await contracts.lending.borrowPoolData(
                WETH.address
            );

            const borrowRate = borrowData.borrowRate;

            await contracts.lending.setParamsLASA(
                WETH.address,
                newMulfactor,
                newUpperBound,
                newLowerBound,
                false,
                false
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const borrowDataAfter = await contracts.lending.borrowPoolData(
                WETH.address
            );

            const borrowRateAfter = borrowDataAfter.borrowRate;

            const diffRate = Bi(borrowRate)
                - Bi(borrowRateAfter);

            assert.isAbove(
                parseInt(abs(diffRate)),
                parseInt(toWei("0.01"))
            );
        });
    });
});
