const Lending = artifacts.require("TesterLending");
const Token = artifacts.require("Token");
const OracleHub = artifacts.require("TesterWiseOracleHub");
const Liquidation = artifacts.require("WiseLiquidation");
const FeeManager = artifacts.require("FeeManager");
const Chainlink = artifacts.require("TesterChainlink")
const WiseSecuirty = artifacts.require("WiseSecurity");
const PositionNFT = artifacts.require("PositionNFTs");
const AaveSecondLayer = artifacts.require("AaveHub");

const { expectRevert} = require("@openzeppelin/test-helpers");
const { assert } = require("chai");
const { Bi } = require("./utils");

require("./utils");
require("./constants");
require("./test-scenarios");

contract("WiseLending", accounts => {

    const [
        owner,
        alice,
        bob,
        // random
    ] = accounts;

    let USDC;
    let contracts;
    let chainlinkUSDC;

    preparationSetup = async () => {

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

        USDC = tokenData.token;
        chainlinkUSDC = tokenData.oracle

        await setupHeartbeatForTests(
            {
                oracleHub: contracts.oracleHub,
                tokens: [USDC],
                chainlinkInterfaces: [chainlinkUSDC]
            }
        );

        await addPools(
            contracts.lending,
            [
                {
                    allowBorrow: true,
                    poolToken: USDC,
                    mulFactor: toWei("0.1"),
                    collFactor: toWei("0.85"),
                    maxDeposit: HUGE_AMOUNT
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
                }
            ]
        );

        return contracts;
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

    describe("Test Accessors After Deployment", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();
        });

        it("getTotalPool", async () => {

            result = await contracts.lending.getTotalPool(
                USDC.address
            );

            assert.equal(result, "0");
        });

        it("getTotalDepositShares", async () => {
            result = await contracts.lending.getTotalDepositShares(
                USDC.address
            );

            assert.equal(result, "1000");
        });

        it("getPseudoTotalBorrowAmount", async () => {
            result = await contracts.lending.getPseudoTotalPool(
                USDC.address
            );

            assert.equal(result, "1000");
        });

        it("getTotalBorrowShares", async () => {
            result = await contracts.lending.getTotalBorrowShares(
                USDC.address
            );

            assert.equal(result, "1000");
        });

        it("getPseudoTotalBorrowAmount", async () => {
            result = await contracts.lending.getPseudoTotalBorrowAmount(
                USDC.address
            );

            assert.equal(result, "1000");
        });

        it("getBorrowRate", async () => {

            const borrowData = await contracts.lending.borrowPoolData(
                USDC.address
            );

            result = borrowData.borrowRate;

            assert.equal(result.toString(), "0");
        });

        it("getUtilization", async () => {

            const poolData = await contracts.lending.globalPoolData(
                USDC.address
            );

            result = poolData.utilization;

            assert.equal(result.toString(), "0");
        });

        it("check maxDepositValueToken after init", async () => {
            result = await contracts.lending.maxDepositValueToken(
                USDC.address
            );
            assert.equal(result.toString(), HUGE_AMOUNT.toString());
        });
    });

    describe("Default Pool Initialization Tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();
        });

        it("1x Default Pool Initialization", async () => {

            const pool1Data = await contracts.lending.borrowRatesData(
                USDC.address
            );

            assert.equal(
                pool1Data.multiplicativeFactor.toString(),
                toWei("0.1")
            );
        });

        it("2x Default Pools Initialization", async () => {

            const WETH = await Token.new(
                18,
                bob
            );

            await addPools(
                contracts.lending,
                [
                    {
                        allowBorrow: true,
                        poolToken: WETH,
                        mulFactor: toWei("0.2"),
                        collFactor: toWei("0.8"),
                        maxDeposit: HUGE_AMOUNT,
                        borrowCap: toWei("1")
                    }
                ]
            );

            const pool1Data = await contracts.lending.borrowRatesData(
                USDC.address
            );

            const pool2Data = await contracts.lending.borrowRatesData(
                WETH.address
            );

            assert.equal(
                pool1Data.multiplicativeFactor.toString(),
                toWei("0.1")
            );

            assert.equal(
                pool2Data.multiplicativeFactor.toString(),
                toWei("0.2")
            );
        });

        it("3x Default Pools Initialization", async () => {

            const USDT = await Token.new(
                18,
                bob
            );

            const DAI = await Token.new(
                18,
                owner
            );

            await addPools(
                contracts.lending,
                [
                    {
                        allowBorrow: true,
                        poolToken: USDT,
                        mulFactor: toWei("0.55"),
                        collFactor: toWei("0.8"),
                        maxDeposit: HUGE_AMOUNT,
                        borrowCap: toWei("1")
                    },
                    {
                        allowBorrow: true,
                        poolToken: DAI,
                        mulFactor: toWei("0.60"),
                        collFactor: toWei("0.8"),
                        maxDeposit: HUGE_AMOUNT,
                        borrowCap: toWei("1")
                    }
                ]
            );

            const pool1Data = await contracts.lending.borrowRatesData(
                USDC.address
            );

            assert.equal(
                pool1Data.multiplicativeFactor.toString(),
                toWei("0.1").toString()
            );

            const pool2Data = await contracts.lending.borrowRatesData(
                USDT.address
            );

            assert.equal(
                pool2Data.multiplicativeFactor.toString(),
                toWei("0.55").toString()
            );

            const pool3Data = await contracts.lending.borrowRatesData(
                DAI.address
            );

            assert.equal(
                pool3Data.multiplicativeFactor.toString(),
                toWei("0.60").toString()
            );
        });
    });

    describe("Struct Initialization Tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();
        });

        it("Test globalPoolData struct", async () => {

            const expectedValue = "0";

            const globalPoolData1 = await contracts.lending.globalPoolData(
                USDC.address
            );

            assert.equal(
                globalPoolData1.totalPool.toString(),
                expectedValue
            );

            assert.equal(
                globalPoolData1.utilization.toString(),
                expectedValue
            );
        });

        it("Test algorithmData struct", async () => {

            const algorithmData1 = await contracts.lending.algorithmData(USDC.address);
            const borrowRatesData1 = await contracts.lending.borrowRatesData(USDC.address);

            assert.equal(
                algorithmData1.maxValue.toString(),
                "0"
            );

            assert.equal(
                algorithmData1.previousValue.toString(),
                "0"
            );

            assert.equal(
                algorithmData1.increasePole.toString(),
                "false"
            );

            assert.equal(
                algorithmData1.bestPole.toString(),
                borrowRatesData1.pole.toString()
            );
        });

        it("Test borrowPoolData struct", async () => {

            const borrowPoolData1 = await contracts.lending.borrowPoolData(
                USDC.address
            );

            assert.equal(
                borrowPoolData1.pseudoTotalBorrowAmount.toString(),
                "1000"
            );

            assert.equal(
                borrowPoolData1.totalBorrowShares.toString(),
                "1000"
            );

            assert.equal(
                borrowPoolData1.borrowRate.toString(),
                "0"
            );
        });

        it("Test lendingPoolData struct", async () => {

            const lendingPoolData1 = await contracts.lending.lendingPoolData(
                USDC.address
            );

            assert.equal(
                lendingPoolData1.pseudoTotalPool.toString(),
                "1000"
            );

            assert.equal(
                lendingPoolData1.totalDepositShares.toString(),
                "1000"
            );

        });

        it("Test timestampsPoolData struct", async () => {

            const timestampsPoolData1 = await contracts.lending.timestampsPoolData(
                USDC.address
            );

            assert.equal(
                timestampsPoolData1.timeStamp.toString(),
                timestampsPoolData1.timeStampScaling.toString()
            );
        });
    });

    describe("Basic deposit and withdraw tests", () =>{

        beforeEach(async () => {

            contracts = await preparationSetup();
        });

        it("Deposit and withdraw", async () => {

            const depositAmount = pow6(1000);
            const depositAmount2 = pow6(100)
            const withdrawAmount = pow6(10);
            const withdrawShares = pow6(27);

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            await contracts.nft.reservePosition(
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount,
                alice
            );

            const sharesAlice = Bi(await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            )) + Bi(1);

            assert.equal(
                depositAmount.toString(),
                sharesAlice.toString()
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                pow6(1000),
                alice
            );

            const balAliceBefore = await USDC.balanceOf(
                alice
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount2,
                alice
            );

            const balAliceAfter = await USDC.balanceOf(
                alice
            );

            const diff = Bn(balAliceBefore)
                .sub(Bn(balAliceAfter))

            assert.equal(
                diff.toString(),
                depositAmount2.toString()
            );

            await contracts.lending.withdrawExactAmount(
                1,
                USDC.address,
                withdrawAmount,
                {
                    from: alice
                }
            );

            const balEndAlice = await USDC.balanceOf(
                alice
            );

            const diffEnd = Bn(balEndAlice)
                .sub(Bn(balAliceAfter));

            assert.equal(
                diffEnd.toString(),
                withdrawAmount.toString()
            );

            // const maxAmount = false;

            const tokenFromShares2 = await contracts.lending.cashoutAmount(
                USDC.address,
                withdrawShares
                // maxAmount
            )

            await contracts.lending.withdrawExactShares(
                1,
                USDC.address,
                withdrawShares,
                {
                    from: alice
                }
            );

            const balAliceEnd2 = await USDC.balanceOf(
                alice
            );

            const diffLast = Bn(balAliceEnd2)
                .sub(balEndAlice)

            assert.equal(
                tokenFromShares2.toString(),
                diffLast.toString()
            );
        });

        it("Withdraw fails when withdrawing more than deposited", async () =>{

            const depositAmount = pow6(1000);
            const tooBigWithdrawToken = pow6(1000.000001);
            const tooBigWithdrawShares = pow6(1001);

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            await contracts.nft.reservePosition(
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount,
                alice
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawExactAmount(
                    1,
                    USDC.address,
                    tooBigWithdrawToken,
                    {
                        from: alice
                    }
                ),
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawExactShares(
                    1,
                    USDC.address,
                    tooBigWithdrawShares,
                    {
                        from: alice
                    }
                ),
            );

        });

        it("Deposit wait 1000 days withdraw", async () => {

            const depositAmount = pow6(1000);
            const withdrawAmount = pow6(0.1);

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            await contracts.nft.reservePosition(
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount,
                alice
            );

            await advanceTimeAndBlock(1 * SECONDS_IN_DAY);

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            await contracts.lending.withdrawExactAmount(
                1,
                USDC.address,
                withdrawAmount,
                {
                    from: alice
                }
            );

            let alogData = await contracts.lending.borrowRatesData(
                USDC.address
            );

            await advanceTimeAndBlock(1000 * SECONDS_IN_DAY);

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            await contracts.lending.withdrawExactAmount(
                1,
                USDC.address,
                withdrawAmount,
                {
                    from: alice
                }
            );

            let alogData2 = await contracts.lending.borrowRatesData(
                USDC.address
            );

            assert.equal(
                alogData.minPole.toString(),
                alogData2.pole.toString()
            );
        });

        //DONATING IS NOW LIMITED
        it.skip("Withdraw scrapes extra tokens of same type correctly", async () => {

            const depositAmount = pow6(1000);
            const transferAmount = pow6(100);
            const withdrawShares = pow6(10);

            await USDC.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            )

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            await contracts.nft.reservePosition(
                {
                    from: bob
                }
            );

            await approveTokens(
                contracts.lending,
                [
                    {
                        Token: USDC,
                        contract: contracts.lending,
                        user: bob,
                        type: "normal"
                    }
                ]
            )

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount,
                bob
            );

            await USDC.transfer(
                contracts.lending.address,
                transferAmount,
                {
                    from: alice
                }
            )

            await advanceTimeAndBlock(
                1000 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            const totalShares = await contracts.lending.getTotalDepositShares(
                USDC.address
            );

            const pseudoPool = Bn(depositAmount)
                .add(Bn(transferAmount));

            const dividend = Bn(withdrawShares).mul(Bn(pseudoPool));
            const divisor = Bn(totalShares);
            const remainder = dividend.mod(divisor);

            const withdrawAmount = dividend.div(divisor).add(remainder.isZero() ? Bn(0) : Bn(0));

            const balBefore = await USDC.balanceOf(
                bob
            );

            await contracts.lending.withdrawExactShares(
                1,
                USDC.address,
                withdrawShares,
                {
                    from: bob
                }
            );

            const balAfter = await USDC.balanceOf(
                bob
            );

            const diff = Bn(balAfter)
                .sub(Bn(balBefore));

            assert.equal(
                diff.toString(),
                withdrawAmount.toString()
            );
        });

        it("Collateral flag can not set to false by deposit when true", async () => {

            const depositAmount = pow6(500);
            const depositAmount1 = pow6(1000);
            const depositAmount2 = pow6(1256);

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftIdAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmount(
                nftIdAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            const lendingData1 = await contracts.lending.userLendingData(
                nftIdAlice,
                USDC.address
            );

            const collatState1 = lendingData1.unCollateralized;

            assert.equal(
                collatState1.toString(),
                "false"
            );

            await contracts.lending.depositExactAmount(
                nftIdAlice,
                USDC.address,
                depositAmount1,
                {
                    from: alice
                }
            );

            const lendingData2 = await contracts.lending.userLendingData(
                nftIdAlice,
                USDC.address
            );

            const collatState2 = lendingData2.unCollateralized;

            assert.equal(
                collatState2.toString(),
                "false"
            );

            await contracts.lending.depositExactAmount(
                nftIdAlice,
                USDC.address,
                depositAmount2,
                {
                    from: alice
                }
            );

            const lendingData3 = await contracts.lending.userLendingData(
                nftIdAlice,
                USDC.address
            );

            const collatState3 = lendingData3.unCollateralized;

            assert.equal(
                collatState3.toString(),
                "false"
            );
        });
    });
});
