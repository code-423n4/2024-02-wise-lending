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
const { expectRevert, time } = require('@openzeppelin/test-helpers');

const userA = "0xf69A0e276664997357BF987df83f32a1a3F80944";
const userB = "0x8f741ea9C9ba34B5B8Afc08891bDf53faf4B3FE7";

require("./utils");
require("./constants");
require("./test-scenarios");

contract("Incentive tests", async accounts => {

    const [owner, alice, bob, chad] = accounts;

    let contracts;

    let WETH;
    let USDC;
    let chainlinkUSDC;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

    preparationSetup = async (_poolDats) => {

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

        const tokenData2 = await createToken(
            {
                Token: Token,
                Chainlink: Chainlink,
                OracleHub: contracts.oracleHub,
                value: pow8(13),
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
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: WETH,
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
                },
                {
                    Token: WETH,
                    contract: contracts.lending,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: WETH,
                    contract: contracts.lending,
                    user: bob,
                    type: "normal"
                },
                {
                    Token: USDC,
                    contract: contracts.lending,
                    user: bob,
                    type: "normal"
                }
            ]
        );

        return contracts
    }

    describe("Incentive tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

            await helpers.impersonateAccount(
                userA
            );

            await helpers.impersonateAccount(
                userB
            );

            await web3.eth.sendTransaction({
                from: owner,
                to: userA,
                value: toWei("100")
            });

            await web3.eth.sendTransaction({
                from: owner,
                to: userB,
                value: toWei("100")
            });
        });

        it("Incentive Address can only changed by owner", async () => {

            const startValueA = toWei("98000");
            const startValueB = toWei("106500");

            await expectRevert(
                contracts.feeManager.changeIncentiveUSDA(
                    bob,
                    {
                        from: userB
                    }
                ),
                "NotAllowed()"
            );

            await expectRevert(
                contracts.feeManager.changeIncentiveUSDB(
                    bob,
                    {
                        from: userA
                    }
                ),
                "NotAllowed()"
            );

            await expectRevert(
                contracts.feeManager.changeIncentiveUSDA(
                    bob,
                    {
                        from: alice
                    }
                ),
                "NotAllowed()"
            );

            const incentiveA = await contracts.feeManager.incentiveUSD(
                userA
            );

            const incentiveB = await contracts.feeManager.incentiveUSD(
                userB
            );

            assert.equal(
                incentiveA.toString(),
                startValueA.toString()
            );

            assert.equal(
                incentiveB.toString(),
                startValueB.toString()
            );

            await contracts.feeManager.changeIncentiveUSDA(
                alice,
                {
                    from: userA
                }
            );

            const incentiveANew = await contracts.feeManager.incentiveUSD(
                alice
            );

            const newOwnerA = await contracts.feeManager.incentiveOwnerA();

            assert.equal(
                newOwnerA,
                alice
            );

            assert.equal(
                incentiveANew.toString(),
                startValueA.toString()
            );

            await contracts.feeManager.changeIncentiveUSDB(
                bob,
                {
                    from: userB
                }
            );

            const incentiveBNew = await contracts.feeManager.incentiveUSD(
                bob
            );

            const newOwnerB = await contracts.feeManager.incentiveOwnerB();

            assert.equal(
                newOwnerB,
                bob
            );

            assert.equal(
                incentiveBNew.toString(),
                startValueB.toString()
            );
        });

        it("Incentive can only be increased", async () => {

            const increaseValue = toWei("17");
            const increaseValue2 = toWei("33");

            const incentiveETHA = await contracts.feeManager.incentiveUSD(
                userA
            );

            await contracts.feeManager.increaseIncentiveA(
                increaseValue,
                {
                    from: owner
                }
            );

            const incentiveETHAafter = await contracts.feeManager.incentiveUSD(
                userA
            );

            const diff = Bi(incentiveETHA)
                - Bi(incentiveETHAafter);

            assert.equal(
                abs(diff).toString(),
                increaseValue.toString()
            );

            assert.isAbove(
                parseInt(incentiveETHAafter),
                parseInt(incentiveETHA)
            );

            const incentiveETHB = await contracts.feeManager.incentiveUSD(
                userB
            );

            await contracts.feeManager.increaseIncentiveB(
                increaseValue2,
                {
                    from: owner
                }
            );

            const incentiveETHBafter = await contracts.feeManager.incentiveUSD(
                userB
            );

            const diff2 = Bi(incentiveETHB)
                - Bi(incentiveETHBafter);

            assert.equal(
                abs(diff2).toString(),
                increaseValue2.toString()
            );

            assert.isAbove(
                parseInt(incentiveETHBafter),
                parseInt(incentiveETHB)
            );
        });

        it("Incentive get calculated and accounted correctly", async () => {

            const depositAmount1 = toWei("10000");
            const depositAmount2 = pow6("100000");

            const borrowAmount1 = pow6("80000");
            const borrowAmount2 = toWei("8000");

            await contracts.feeManager.setPoolFee(
                WETH.address,
                toWei("0.5")
            );

            await contracts.feeManager.setPoolFee(
                USDC.address,
                toWei("0.1")
            );

            await chainlinkWETH.setValue(
                pow8(10)
            );

            await chainlinkUSDC.setValue(
                pow8(1)
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            const aliceBalance = await WETH.balanceOf(
                alice
            );

            const aliceApproved = await WETH.allowance(
                alice,
                contracts.lending.address
            );

            // console.log(aliceBalance.toString(), 'aliceBalance');
            // console.log(aliceApproved.toString(), 'aliceApproved');
            // console.log(depositAmount1.toString(), 'depositAmount1');

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                1,
                WETH.address,
                depositAmount1,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                1,
                USDC.address,
                depositAmount2,
                {
                    from: alice
                }
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

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrowAmount1,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount2,
                {
                    from: alice
                }
            );

            await time.increase(
                10 * SECONDS_IN_DAY
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            await contracts.lending.syncManually(
                USDC.address
            );

            const startValueIncentiveA = await contracts.feeManager.incentiveUSD(
                userA
            );

            const startValueIncentiveB = await contracts.feeManager.incentiveUSD(
                userB
            );

            await contracts.feeManager.claimWiseFeesBulk();

            const balWETH = await WETH.balanceOf(
                contracts.feeManager.address
            );

            const balUSDC = await USDC.balanceOf(
                contracts.feeManager.address
            );

            const baseIncentive = await contracts.feeManager.INCENTIVE_PORTION();

            const poolDataWETH = await contracts.lending.globalPoolData(
                WETH.address
            );

            const feePoolWETH = poolDataWETH.poolFee;

            const poolDataUSDC = await contracts.lending.globalPoolData(
                USDC.address
            );

            const feePoolUSDC = poolDataUSDC.poolFee;

            const portionWETH = Bi(balWETH)
                * Bi(baseIncentive)
                / Bi(feePoolWETH);

            const portionUserAusdc = await contracts.feeManager.gatheredIncentiveToken(
                userA,
                USDC.address
            );

            const portionUserAweth = await contracts.feeManager.gatheredIncentiveToken(
                userA,
                WETH.address
            );

            const portionUserBusdc = await contracts.feeManager.gatheredIncentiveToken(
                userB,
                USDC.address
            );

            const portionUserBweth = await contracts.feeManager.gatheredIncentiveToken(
                userB,
                WETH.address
            );

            assert.equal(
                portionUserBusdc.toString(),
                portionUserAusdc.toString()
            );

            assert.equal(
                portionUserAweth.toString(),
                portionUserBweth.toString()
            );

            const portionUSDC = Bi(balUSDC)
                * Bi(baseIncentive)
                / Bi(feePoolUSDC);

            assert.equal(
                portionUserBusdc.toString(),
                // "10000000"
                portionUSDC.toString()
            );

            assert.equal(
                portionUserBweth.toString(),
                portionWETH.toString()
            );

            const usdEquivIncentivesUSDC = await contracts.oracleHub.getTokensPriceInUSD(
                USDC.address,
                portionUserAusdc
            );

            const usdEquivIncentivesWETH = await contracts.oracleHub.getTokensPriceInUSD(
                WETH.address,
                portionUserAweth
            );

            const usdEquivIncentiv = Bi(usdEquivIncentivesUSDC)
                + Bi(usdEquivIncentivesWETH);

            const openIncentiveA = await contracts.feeManager.incentiveUSD(
                userA
            );

            const openIncentiveB = await contracts.feeManager.incentiveUSD(
                userB
            );

            /*
            assert.equal(
                parseInt(openIncentiveB),
                parseInt(openIncentiveA)
            );
            */

            assert.isAbove(
                parseInt(openIncentiveB),
                parseInt(openIncentiveA)
            );

            const diffA = Bi(startValueIncentiveA)
                - Bi(usdEquivIncentiv);

            const diffB = Bi(startValueIncentiveB)
                - Bi(usdEquivIncentiv);

            assert.equal(
                diffA.toString(),
                openIncentiveA.toString()
            );

            assert.equal(
                diffB.toString(),
                openIncentiveB.toString()
            );
        });

        it("Only max USD equiv gets distributed for incentives", async () => {

            const depositAmount = toWei("1000000");
            const borrowAmount = toWei("800000");

            await contracts.feeManager.setPoolFee(
                WETH.address,
                toWei("0.5")
            );

            await chainlinkWETH.setValue(
                pow8(1000)
            );

            const initalIncentiveUSD = await contracts.feeManager.incentiveUSD(
                userA
            );

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

            // const aliceBalance = await

            await contracts.lending.depositExactAmount(
                1,
                WETH.address,
                depositAmount,
                {
                    from: alice
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
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                60 * SECONDS_IN_DAY
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            await contracts.feeManager.claimWiseFeesBulk();

            const restIncentiveUSDA = await contracts.feeManager.incentiveUSD(
                userA
            );

            const restIncentiveUSDB = await contracts.feeManager.incentiveUSD(
                userB
            );

            assert.equal(
                restIncentiveUSDA.toString(),
                restIncentiveUSDB.toString()
            );

            assert.equal(
                restIncentiveUSDA.toString(),
                "0"
            );

            const gatheredToken = await contracts.feeManager.gatheredIncentiveToken(
                userA,
                WETH.address
            );

            const usdEquiv = await contracts.oracleHub.getTokensPriceInUSD(
                WETH.address,
                gatheredToken
            );

            const relDiff = Bi(initalIncentiveUSD)
                * Bi(toWei("1"))
                / Bi(usdEquiv)
                - Bi(toWei("1"));

            assert.isAbove(
                parseInt(10),
                parseInt(relDiff)
            );
        });

        it("Incentive claiming works correctly", async () => {

            const depositAmount1 = toWei("12596");
            const depositAmount2 = pow6("425896");

            const borrowAmount1 = pow6("96548");
            const borrowAmount2 = toWei("8000");

            await contracts.feeManager.setPoolFee(
                WETH.address,
                toWei("0.5")
            );

            await contracts.feeManager.setPoolFee(
                USDC.address,
                toWei("0.5")
            );

            await chainlinkWETH.setValue(
                pow8(20)
            );

            await chainlinkUSDC.setValue(
                pow8(1)
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.lending.depositExactAmount(
                1,
                WETH.address,
                depositAmount1,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                1,
                USDC.address,
                depositAmount2,
                {
                    from: alice
                }
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

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrowAmount1,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount2,
                {
                    from: alice
                }
            );

            await time.increase(
                17 * SECONDS_IN_DAY
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            await contracts.lending.syncManually(
                USDC.address
            );

            await contracts.feeManager.claimWiseFeesBulk();

            const gatheredUSDC = await contracts.feeManager.gatheredIncentiveToken(
                userA,
                USDC.address
            );

            const gatheredWETH = await contracts.feeManager.gatheredIncentiveToken(
                userA,
                WETH.address
            );

            const balAusdc = await USDC.balanceOf(
                userA
            );

            const baldAweth = await WETH.balanceOf(
                userA
            );

            const balBusdc = await USDC.balanceOf(
                userB
            );

            const baldBweth = await WETH.balanceOf(
                userB
            );

            await contracts.feeManager.claimIncentivesBulk(
                {
                    from: userA
                }
            );

            const balAusdcAfter = await USDC.balanceOf(
                userA
            );

            const baldAwethAfter = await WETH.balanceOf(
                userA
            );

            const diffAusdc = Bi(balAusdcAfter)
                - Bi(balAusdc);

            const diffAweth = Bi(baldAwethAfter)
                - Bi(baldAweth);

            assert.equal(
                diffAusdc.toString(),
                gatheredUSDC.toString()
            );

            assert.equal(
                diffAweth.toString(),
                gatheredWETH.toString()
            );

            const gatheredUSDCEnd = await contracts.feeManager.gatheredIncentiveToken(
                userA,
                USDC.address
            );

            const gatheredWETHEnd = await contracts.feeManager.gatheredIncentiveToken(
                userA,
                WETH.address
            );

            assert.equal(
                gatheredUSDCEnd.toString(),
                "0"
            );

            assert.equal(
                gatheredWETHEnd.toString(),
                "0"
            );

            await contracts.feeManager.claimIncentivesBulk(
                {
                    from: userB
                }
            );

            const balBusdcAfter = await USDC.balanceOf(
                userB
            );

            const baldBwethAfter = await WETH.balanceOf(
                userB
            );

            const diffBusdc = Bi(balBusdcAfter)
                - Bi(balBusdc);

            const diffBweth = Bi(baldBwethAfter)
                - Bi(baldBweth);

            assert.equal(
                diffBusdc.toString(),
                gatheredUSDC.toString()
            );

            assert.equal(
                diffBweth.toString(),
                gatheredWETH.toString()
            );

            const gatheredUSDCEndB = await contracts.feeManager.gatheredIncentiveToken(
                userB,
                USDC.address
            );

            const gatheredWETHEndB = await contracts.feeManager.gatheredIncentiveToken(
                userB,
                WETH.address
            );

            assert.equal(
                gatheredUSDCEndB.toString(),
                "0"
            );

            assert.equal(
                gatheredWETHEndB.toString(),
                "0"
            );
        });
    });
});