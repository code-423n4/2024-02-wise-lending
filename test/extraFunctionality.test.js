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

require("./utils");
require("./constants");
require("./test-scenarios");

contract("extra Functionality", async accounts  => {

    const [owner, alice, bob, chad, random] = accounts;

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
                borrowCap: toWei("0.95")
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
                    collFactor: toWei("0.5"),
                    maxDeposit: toWei("100000000")
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

    wrapDepositAmount = async (_nftId, _poolToken, _amount, _caller) => {
        await contracts.lending.depositExactAmount(
            _nftId,
            _poolToken,
            _amount,
            {
                from: _caller
            }
        );
    }

    describe("payback Tests", () => {

        beforeEach( async () => {
            contracts = await preparationSetup();
        });

        it("paybackExactShares works", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const smallTime = 1000;
            const transferAmount = toWei("12");

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
                smallTime
            );

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            assert.isAbove(
                parseInt(borrowShares),
                parseInt(0)
            );

            await contracts.lending.paybackExactShares(
                1,
                WETH.address,
                borrowShares,
                {
                    from: bob
                }
            );

            borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            assert.equal(
                borrowShares.toString(),
                "0"
            );
        });

        it("paybackExactShares returnValue is correct", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const smallTime = 1000;
            const transferAmount = toWei("12");

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
                smallTime
            );

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            const tokenBalanceRandomBefore = await WETH.balanceOf(
                bob
            );

            const borrowSharesUser = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            await takeSnapshot();

            const callBackValue = await contracts.lending.paybackExactShares.call(
                1,
                WETH.address,
                borrowSharesUser,
                {
                    from: bob
                }
            );

            await snapshot.restore();

            await contracts.lending.paybackExactShares(
                1,
                WETH.address,
                borrowSharesUser,
                {
                    from: bob
                }
            );

            const tokenBalanceRandomAfter = await WETH.balanceOf(
                bob
            );

            const tokenDifference = Bi(tokenBalanceRandomBefore)
                - Bi(tokenBalanceRandomAfter);

            const diff = Bi(tokenDifference) - Bi(callBackValue);

            const bool = await inBound(
                diff,
                WETH
            );

           assert.equal(
            bool.toString(),
            "true"
           );
        });

        it("paybackExactAmount returnValue is correct", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const smallTime = 1000;
            const transferAmount = toWei("12");

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
                smallTime
            );

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            const tokenBalanceRandomBefore = await WETH.balanceOf(
                bob
            );

            const borrowSharesUser = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            const borrowAmountUser = await contracts.lending.paybackAmount(
                WETH.address,
                borrowSharesUser
            );

            const callBackValue = await contracts.lending.paybackExactAmount.call(
                1,
                WETH.address,
                borrowAmountUser,
                {
                    from: bob
                }
            ).then(
                await contracts.lending.paybackExactAmount(
                    1,
                    WETH.address,
                    borrowAmountUser,
                    {
                        from: bob
                    }
                )
            );

            const tokenBalanceRandomAfter = await WETH.balanceOf(
                bob
            );

            const tokenDifference = Bi(tokenBalanceRandomBefore)
                - Bi(tokenBalanceRandomAfter);

            assert.equal(
                tokenDifference.toString(),
                borrowAmountUser.toString()
            );

            const diff = abs(
                Bi(borrowSharesUser) - Bi(callBackValue)
            );

            const bool = await inBound(
                diff,
                WETH
            );

           assert.equal(
            bool.toString(),
            "true"
           );
        });
    });

    describe("payback on behalf with lendingshares Tests", () => {

        beforeEach( async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const transferAmount = toWei("1000");
            const smallTime = 1000;

            contracts = await preparationSetup();

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
                transferAmount,
                {
                    from: alice
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
                depositAmount,
                bob
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
                smallTime
            );
        });

        it.skip("payback with lendingshares same user", async () => {

            const lendingShareToTransform = toWei("1");

            const userLendingSharesBefore = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await contracts.lending.paybackExactLendingShares(
                1,
                1,
                WETH.address,
                lendingShareToTransform,
                {
                    from: alice
                }
            );

            const userLendingSharesAfter = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            const differenceLendingSharesUser = Bi(userLendingSharesBefore)
                - Bi(userLendingSharesAfter);

            assert.equal(
                lendingShareToTransform.toString(),
                differenceLendingSharesUser.toString()
            );
        });

        it.skip("payback with lendingshares different user", async () => {

            const lendingShareToTransform = toWei("3");

            const userLendingSharesBefore = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.lending.paybackExactLendingShares(
                2,
                1,
                WETH.address,
                lendingShareToTransform,
                {
                    from: bob
                }
            );

            const userLendingSharesAfter = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            const differenceLendingSharesUser = Bi(userLendingSharesBefore)
                - Bi(userLendingSharesAfter);

            assert.equal(
                lendingShareToTransform.toString(),
                differenceLendingSharesUser.toString()
            );

        });

        it("payback borrowShares correctly cancelled and checked for borrowlimit", async () => {

            const lendingShareToTransform = toWei("6");
            const borrowAmount = toWei("23");

            await takeSnapshot();

            await contracts.lending.syncManually(
                WETH.address
            );

            const totalDepositShares = await contracts.lending.getTotalDepositShares(
                WETH.address
            );

            const totalBorrowShares = await contracts.lending.getTotalBorrowShares(
                WETH.address
            );

            const pseudoTotalPool = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            const pseudoTotalBorrowAmount = await contracts.lending.getPseudoTotalBorrowAmount(
                WETH.address
            );

            const borrowSharesToCancelCalculated = Bi(lendingShareToTransform)
                * Bi(pseudoTotalPool)
                / Bi(totalDepositShares)
                * Bi(totalBorrowShares)
                / Bi(pseudoTotalBorrowAmount);

            const borrowShareBeforeUser = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            await snapshot.restore();

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.lending.collateralizeDeposit(
                2,
                WETH.address,
                {
                    from: bob
                }
            );

            await takeSnapshot();

            await contracts.lending.borrowExactAmount(
                2,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );
        });

        it.skip("payback with lendingshares lifecycle test", async () => {

            const depositUSDC1 = pow6(60);
            const depositUSDC2 = pow6(30);
            const borrowAmount = toWei("10");

            const startDepositAmount = toWei("50");

            const paybackLendingShares = toWei("5");

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            const balWETHAlice = await WETH.balanceOf(
                alice
            );

            const balWETHBob = await WETH.balanceOf(
                bob
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                nftAlice,
                USDC.address,
                depositUSDC1,
                alice
            );

            await wrapDepositAmount(
                nftBob,
                USDC.address,
                depositUSDC2,
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

            await time.increase(
                2 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.lending.paybackExactLendingShares(
                1,
                1,
                WETH.address,
                paybackLendingShares,
                {
                    from: alice
                }
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            const totBorrowSharesAlice = await contracts.lending.getPositionBorrowShares(
                nftAlice,
                WETH.address
            );

            await contracts.lending.paybackExactShares(
                nftAlice,
                WETH.address,
                totBorrowSharesAlice,
                {
                    from: alice
                }
            );

            const totLendingSharesUSDCBoB = await contracts.lending.getPositionLendingShares(
                nftBob,
                USDC.address
            );

            const totLendingSharesUSDCAlice = await contracts.lending.getPositionLendingShares(
                nftAlice,
                USDC.address
            );

            await contracts.lending.withdrawExactShares(
                nftBob,
                USDC.address,
                totLendingSharesUSDCBoB,
                {
                    from: bob
                }
            );

            await contracts.lending.withdrawExactShares(
                nftAlice,
                USDC.address,
                totLendingSharesUSDCAlice,
                {
                    from: alice
                }
            );

            const totLendingSharesWETHBoB = await contracts.lending.getPositionLendingShares(
                nftBob,
                WETH.address
            );

            const totLendingSharesWETHAlice = await contracts.lending.getPositionLendingShares(
                nftAlice,
                WETH.address
            );

            await contracts.lending.withdrawExactShares(
                nftBob,
                WETH.address,
                totLendingSharesWETHBoB,
                {
                    from: bob
                }
            );

            await contracts.lending.withdrawExactShares(
                nftAlice,
                WETH.address,
                totLendingSharesWETHAlice,
                {
                    from: alice
                }
            );

            const balWETHAliceEND = await WETH.balanceOf(
                alice
            );

            const balWETHBobEND = await WETH.balanceOf(
                bob
            );

            const diffAlice = Bi(balWETHAliceEND)
                - Bi(balWETHAlice);

            const diffBob = Bi(balWETHBobEND)
                - Bi(balWETHBob);

            assert.isAbove(
                parseInt(diffBob),
                parseInt(startDepositAmount)
            );

            assert.isAbove(
                parseInt(startDepositAmount),
                parseInt(diffAlice)
            );

            await contracts.feeManager.claimWiseFees(
                WETH.address
            );

            const totLendingSharesEnd = await contracts.lending.getTotalDepositShares(
                WETH.address
            );

            const totPoolEnd = await contracts.lending.getTotalPool(
                WETH.address
            );

            const totLendingSharesEndUSDC = await contracts.lending.getTotalDepositShares(
                USDC.address
            );

            const totPoolEndUSDC = await contracts.lending.getTotalPool(
                USDC.address
            );

            assert.isAbove(
                parseInt(2),
                parseInt(totLendingSharesEnd)
            );

            assert.isAbove(
                parseInt(2),
                parseInt(totLendingSharesEndUSDC)
            );

            assert.equal(
                totPoolEnd.toString(),
                "0"
            );

            assert.equal(
                totPoolEndUSDC.toString(),
                "0"
            );
        });
    });

    describe("depositTokens Tests", () => {

        beforeEach(async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const smallTime = 1000;
            const transferAmount = toWei("12");

            contracts = await preparationSetup();

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
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                1,
                WETH.address,
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

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                smallTime
            );

            borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            assert.isAbove(
                parseInt(borrowShares),
                parseInt(0)
            );

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
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
                transferAmount,
                alice
            );
        });

        it("deposit works", async () => {

            const depositAmount = 1000000;

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );
        });

        it("deposit onBehalf (amount) creates equivalent shares", async () => {

            const transferAmount = toWei("12");
            const depositAmount = 1000000;

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            lendingSharesBefore = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            takeSnapshot();

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            lendingSharesAfter = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            const differenceDeposit = Bi(lendingSharesAfter)
                - Bi(lendingSharesBefore);

            await snapshot.restore();

            lendingSharesBefore = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            lendingSharesAfter = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            const differenceDepositOnBehalf = Bi(lendingSharesAfter)
                - Bi(lendingSharesBefore);

            assert.equal(
                differenceDepositOnBehalf.toString(),
                differenceDeposit.toString()
            );
        });

        it.skip("deposit onBehalf (shares) creates equivalent shares", async () => {

            const transferAmount = toWei("12");
            const depositAmount = 1000000;

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

            lendingSharesBefore = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                WETH.address
            );

            const correspondingShares = await contracts.lending.cashoutAmount(
                WETH.address,
                depositAmount
            );

            await snapshot.restore();

            takeSnapshot();

            await wrapDepositShares(
                2,
                WETH.address,
                correspondingShares,
                alice
            );

            lendingSharesAfter = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            const differenceDeposit = Bi(lendingSharesAfter)
                - Bi(lendingSharesBefore);

            await snapshot.restore();

            await wrapDepositShares(
                2,
                WETH.address,
                correspondingShares,
                bob
            );

            lendingSharesAfter = await contracts.lending.getPositionLendingShares(
                2,
                WETH.address
            );

            const differenceDepositOnBehalf = Bi(lendingSharesAfter)
                - Bi(lendingSharesBefore);

            assert.equal(
                differenceDepositOnBehalf.toString(),
                differenceDeposit.toString()
            );
        });

        it("deposit onBehalf doesnt change donators shares", async () => {

            const depositAmount = 1000000;
            const transferAmount = toWei("12");

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

            lendingSharesBefore = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            takeSnapshot();

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            lendingSharesAfter = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            const differenceDeposit = Bi(lendingSharesAfter)
                - Bi(lendingSharesBefore);

            await snapshot.restore();

            lendingSharesBefore = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            lendingSharesAfter = await contracts.lending.getPositionLendingShares(
                1,
                WETH.address
            );

            const differenceDepositOnBehalf = Bi(lendingSharesAfter)
                - Bi(lendingSharesBefore);

            assert.equal(
                differenceDepositOnBehalf.toString(),
                differenceDeposit.toString(),
                "0"
            );
        });
    });

    // DEPRECATED FUNCTIONALITY
    describe.skip("withdrawOnBehalf Tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
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
                    from: owner
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );
        });

        it.skip("Approve for withdraw works correctly", async () => {   //now double because combined approve borrow and approve withdraw

            await contracts.nft.mintPosition(
                {
                    from: chad
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

            const val = await contracts.lending.allowance(
                chad,
                WETH.address,
                bob
            );

            assert.equal(
                val.toString(),
                toWei("1").toString()
            );

            const val2 = await contracts.lending.allowance(
                bob,
                USDC.address,
                bob
            );

            assert.equal(
                val2.toString(),
                "0"
            );

            const val3 = await contracts.lending.allowance(
                chad,
                WETH.address,
                chad
            );

            assert.equal(
                val3.toString(),
                "0"
            );
        });

        it("Cant use withdrawOnBehalf without allowance", async () => {

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            const depositAmount = toWei("50");
            const withdrawAmount = toWei("15");

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawOnBehalfExactAmount(
                    1,
                    WETH.address,
                    withdrawAmount,
                    {
                        from: bob
                    }
                )
            );
        });

        it("User cant withdraw more then allowed", async () => {

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const depositAmount = toWei("100");

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawOnBehalfExactAmount(
                    1,
                    WETH.address,
                    toWei("1.01001"),
                    {
                        from: bob
                    }
                )
            );
        });

        it("Allowance for withdraw gets reduced correctly", async () => {

            const nftContract = contracts.nft;
            const lendingContract = contracts.lending;

            await nftContract.mintPosition(
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

            const allowance = toWei("7");
            const withdrawPerc = toWei("0.05");
            const depositAmount = toWei("100");

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            const shares = await lendingContract.getPositionLendingShares(
                1,
                WETH.address
            );

            const percentageShare = Bi(shares)
                * Bi(withdrawPerc)
                / Bi(toWei("1"));

            await takeSnapshot();

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            const valueWithdraw = await lendingContract.withdrawOnBehalfExactShares.call(
                1,
                WETH.address,
                percentageShare,
                {
                    from: bob
                }
            );

            await snapshot.restore();

            await lendingContract.setOnBehalf(
                bob,
                false
            );

            await expectRevert(
                lendingContract.withdrawOnBehalfExactShares(
                    1,
                    WETH.address,
                    percentageShare,
                    {
                        from: bob
                    }
                ),
                "InvalidCaller()"
            );

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            await lendingContract.withdrawOnBehalfExactShares(
                1,
                WETH.address,
                percentageShare,
                {
                    from: bob
                }
            );

            const numberToken = Bi(withdrawPerc)
                * Bi(depositAmount)
                / Bi(toWei("1"));

            assert.equal(
                numberToken.toString(),
                valueWithdraw.toString()
            );

            const calcValue = Bi(allowance)
                - Bi(valueWithdraw);

            const val = await lendingContract.allowance(
                alice,
                WETH.address,
                bob
            );

            assert.equal(
                calcValue.toString(),
                val.toString()
            );
        });

        it("User cant withdraw more with withdrawOnBehalf than dept ratio allows", async () => {

            const allowance = toWei("15");
            const percent = toWei("0.1");
            const depositAmount = toWei("100");
            const borrowAmount = toWei("46");

            const nftContract = contracts.nft;
            const lendingContract = contracts.lending;

            await nftContract.mintPosition(
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

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await lendingContract.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            await lendingContract.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            const userLendingShares = await lendingContract.getPositionLendingShares(
                1,
                WETH.address
            );

            const withdrawShares = Bi(userLendingShares)
                * Bi(percent)
                / Bi(toWei("1"));

            await expectRevert(
                lendingContract.withdrawOnBehalfExactShares(
                    1,
                    WETH.address,
                    withdrawShares,
                    {
                        from: bob
                    }
                ),
                'InvalidCaller()'
            );

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            await expectRevert(
                lendingContract.withdrawOnBehalfExactShares(
                    1,
                    WETH.address,
                    withdrawShares,
                    {
                        from: bob
                    }
                ),
                'ResultsInBadDebt()'
            );
        });

        it("Lending shares get reduced correctly with withdrawOnBehalf (or amount)", async () => {

            const allowance = toWei("50");
            const withdrawPerc = toWei("0.1");
            const depositAmount = toWei("100");

            const nftContract = contracts.nft;
            const lendingContract = contracts.lending;

            await nftContract.mintPosition(
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

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await lendingContract.collateralizeDeposit(
                1,
                WETH.address,
                {
                    from: alice
                }
            );

            const withdrawAmount = Bi(depositAmount)
                * Bi(withdrawPerc)
                / Bi(toWei("1"));

            const balAliceBefore = await WETH.balanceOf(
                bob
            );

            takeSnapshot();

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            await lendingContract.withdrawOnBehalfExactAmount(
                1,
                WETH.address,
                withdrawAmount,
                {
                    from: bob
                }
            );

            let lendingEntry = await lendingContract.userLendingData(
                1,
                WETH.address
            );

            const share1 = lendingEntry.shares;

            const calcShare = Bi(depositAmount)
                * Bi(toWei("0.9"))
                / Bi(toWei("1"));

            assert.equal(
                share1.toString(),
                calcShare.toString()
            );

            await snapshot.restore();

            const userShares = await lendingContract.getPositionLendingShares(
                1,
                WETH.address
            );

            const withdrawShares = Bi(userShares)
                * Bi(withdrawPerc)
                / Bi(toWei("1"));

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            await lendingContract.withdrawOnBehalfExactShares(
                1,
                WETH.address,
                withdrawShares,
                {
                    from: bob
                }
            );

            const balAlice = await WETH.balanceOf(
                bob
            );

            const diff = Bi(balAlice)
                - Bi(balAliceBefore);

            assert.equal(
                diff.toString(),
                withdrawAmount.toString()
            );
        });
    });

    describe("Max token amount inside a pool tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
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
                    from: owner
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );
        });

        it("Max token amount check works as intended", async () => {

            const depositAmount1 = toWei("50000000");
            const depositAmount2 = toWei("49999999");
            const depositTestAmount = toWei("2");

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
                depositAmount1,
                alice
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount2,
                alice
            );

            await expectRevert(
                wrapDepositAmount(
                    1,
                    WETH.address,
                    depositTestAmount,
                    alice
                ),
                'InvalidAction()'
            );
        })

        it("Max token amount check works as intended and interest allocated", async () => {

            const depositAmount1 = toWei("50000000");
            const depositAmount2 = toWei("49999990");
            const depositTestAmount = toWei("1");
            const borrowAmount = toWei("24000000");
            const borrowAmount2 = toWei("20000000");

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
                depositAmount1,
                alice
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
                BigInt(borrowAmount * 0.95),
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

            await time.increase(
                50 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await expectRevert(
                wrapDepositAmount(
                    1,
                    WETH.address,
                    depositTestAmount,
                    alice
                ),
                'InvalidAction()'
            );

            const pseudoBefore = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount2,
                {
                    from: alice
                }
            );

            const pseudoAfter = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            assert.isAbove(
                parseInt(pseudoAfter),
                parseInt(pseudoBefore)
            );
        });
    });

    // DEPRECATED FUNCTIONALITY
    describe.skip("BorrowOnBehalf tests", () => {

        beforeEach(async () => {

            const depositAmount = toWei("5000");

            contracts = await preparationSetup();

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

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
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
                    from: owner
                }
            );

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );
        });

        it("Approve for borrow works correctly", async () => {

            await contracts.nft.mintPosition(
                {
                    from: chad
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

            const val = await contracts.lending.allowance(
                chad,
                WETH.address,
                bob
            );

            assert.equal(
                val.toString(),
                toWei("1").toString()
            );

            const val2 = await contracts.lending.allowance(
                chad,
                USDC.address,
                bob
            );

            assert.equal(
                val2.toString(),
                "0"
            );

            const val3 = await contracts.lending.allowance(
                chad,
                WETH.address,
                chad
            );

            assert.equal(
                val3.toString(),
                "0"
            );
        });

        it("Cant use borrowOnBehalf without allowance", async () => {

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await expectRevert.unspecified(
                contracts.lending.borrowOnBehalfExactAmount(
                    1,
                    WETH.address,
                    toWei("1"),
                    {
                        from: bob
                    }
                )
            );
        });

        it("User cant borrow more then allowed", async () => {

            const depositAmount = toWei("5");
            const borrowAmount = toWei("1.0001")

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await expectRevert.unspecified(
                contracts.lending.borrowOnBehalfExactAmount(
                    1,
                    WETH.address,
                    toWei("1.0001"),
                    {
                        from: bob
                    }
                )
            );

        });

        it("Allowance gets reduced correctly", async () => {

            const allowance = toWei("7");
            const borroAmount = toWei("3.7");

            const lendingContract = contracts.lending;

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            await contracts.lending.borrowOnBehalfExactAmount(
                1,
                WETH.address,
                borroAmount,
                {
                    from: bob
                }
            );

            const calcValue = Bi(allowance)
                - Bi(borroAmount);

            const val = await lendingContract.allowance(
                alice,
                WETH.address,
                bob
            );

            assert.equal(
                calcValue.toString(),
                val.toString()
            );
        });

        it("User cant borrow more with borrowOnBehalf than dept ratio allows", async () => {

            const allowance = toWei("2600");
            const borrowAmount = toWei("2600");

            const lendingContract = contracts.lending;

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            await expectRevert(
                lendingContract.borrowOnBehalfExactAmount(
                    1,
                    WETH.address,
                    borrowAmount,
                    {
                        from: bob
                    }
                ),
                "ResultsInBadDebt()"
            );
        });

        it("Borrow shares get calculated correctly with borrowOnBehalfExactAmount", async () => {

            const lendingContract = contracts.lending

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            const borrowAmount = toWei("5");

            await expectRevert(
                lendingContract.borrowOnBehalfExactAmount(
                    1,
                    WETH.address,
                    borrowAmount,
                    {
                        from: bob
                    }
                ),
                "InvalidCaller()"
            );

            await lendingContract.setOnBehalf(
                bob,
                true
            );

            await lendingContract.borrowOnBehalfExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            let share1 = await lendingContract.getPositionBorrowShares(
                1,
                WETH.address
            );

            assert.equal(
                share1.toString(),
                borrowAmount.toString()
            );

            await time.increase(
                5 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            takeSnapshot();

            await lendingContract.syncManually(
                WETH.address
            );

            const totalShare = await lendingContract.getTotalBorrowShares(
                WETH.address
            );

            const totalBorroPseudo = await lendingContract.getPseudoTotalBorrowAmount(
                WETH.address
            );

            const product = Bi(borrowAmount)
                * Bi(totalShare);

            const calcValue = product % Bi(totalBorroPseudo) == 0
                ? product / Bi(totalBorroPseudo)
                : product / Bi(totalBorroPseudo) + Bi(1);

            await snapshot.restore();

            await lendingContract.borrowOnBehalfExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            share2 = await lendingContract.getPositionBorrowShares(
                1,
                WETH.address
            );

            const newShares = Bi(share2)
                - Bi(share1);

            assert.equal(
                newShares.toString(),
                calcValue.toString()
            );
        });

        it.skip("Borrow amount get calculated correctly with borrowOnBehalfExactShares", async () => {

            const borrowAmount = toWei("5");
            // const depositAmount = toWei("100");
            const sharesToBorrow = toWei("13");
            const lendingContract = contracts.lending;

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await lendingContract.borrowOnBehalfExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            await time.increase(
                7 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            const bobBalBefore = await WETH.balanceOf(
                bob
            );

            const totalShare = await lendingContract.getTotalBorrowShares(
                WETH.address
            );

            takeSnapshot();

            await lendingContract.syncManually(
                WETH.address
            );

            const totalBorroPseudo = await lendingContract.getPseudoTotalBorrowAmount(
                WETH.address
            );

            const calcValue = Bi(sharesToBorrow)
                * Bi(totalBorroPseudo)
                / Bi(totalShare);

            await snapshot.restore();

            await lendingContract.borrowOnBehalfExactShares(
                1,
                WETH.address,
                sharesToBorrow,
                {
                    from: bob
                }
            );

            const bobBalAfter = await WETH.balanceOf(
                bob
            );

            const diff = Bi(bobBalAfter)
                - Bi(bobBalBefore);

            assert.equal(
                diff.toString(),
                calcValue.toString()
            );
        });
    });
});
