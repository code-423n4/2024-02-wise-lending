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
const SyntheticLp = artifacts.require("SyntheticLp");

const { assert } = require("chai");
const { expectRevert, time } = require('@openzeppelin/test-helpers');


require("./utils");
require("./constants");
require("./test-scenarios");

contract("WiseLending feeDestination", async accounts  => {

    const [owner, user, alice, bob, random] = accounts;

    let WETH;
    let USDC;
    let chainlinkUSDC;

    let LPtoken;
    let lpWrapper;

    let contracts;

    deposit = async (inputParam = {}) => {

        let balAfter;

        let token;

        for (index = 0; index < inputParam.depositTokens.length; index++) {

            token = await Token.at(inputParam.depositTokens[index]);



            await contracts.lending.depositExactAmount(
                inputParam.nftId[index],
                inputParam.depositTokens[index],
                inputParam.depositAmount[index],
                {
                    from: inputParam.user[index]
                }
            );

            await contracts.lending.collateralizeDeposit(
                inputParam.nftId[index],
                inputParam.depositTokens[index],
                {
                    from: inputParam.user[index]
                }
            );

            balAfter = await token.balanceOf(
                contracts.lending.address
            );

            assert.equal(
                inputParam.depositAmount[index].toString(),
                balAfter.toString()
            );
        }
    }

    borrow = async (inputParam = {}) => {

        let diff;
        let balAfter;
        let balBefore;
        let token;

        for (index = 0; index < inputParam.borrowTokens.length; index++) {

            token = await Token.at(inputParam.borrowTokens[index]);

            balBefore = await token.balanceOf(
                inputParam.user[index]
            );

            await contracts.lending.borrowExactAmount(
                inputParam.nftId[index],
                inputParam.borrowTokens[index],
                inputParam.borrowAmount[index],
                {
                    from: inputParam.user[index]
                }
            );

            balAfter = await token.balanceOf(
                inputParam.user[index]
            );

            diff = Bn(balAfter)
                .sub(balBefore);

            assert.equal(
                inputParam.borrowAmount[index].toString(),
                diff.toString()
            );
        }
    }

    generateFees = async (inputParam = {}) => {

        await time.increase(
            inputParam.time
        );

        for (i = 0; i < inputParam.poolTokens.length; i++) {
            await contracts.lending.syncManually(
                inputParam.poolTokens[i]
            );
        }
    }

    transferToken = async (inputParam = {}) => {

        let balBefore;
        let balAfter;
        let diff;

        let token;

        for (index = 0; index < inputParam.tokens.length; index++) {

            token = await Token.at(inputParam.tokens[index]);

            balBefore = await token.balanceOf(
                inputParam.receiver[index]
            );

            await token.transfer(
                inputParam.receiver[index],
                inputParam.amount[index],
                {
                    from: inputParam.sender[index]
                }
            );

            balAfter = await token.balanceOf(
                inputParam.receiver[index]
            );

            diff = Bn(balAfter)
                .sub(Bn(balBefore));

            assert.equal(
                diff.toString(),
                inputParam.amount[index].toString()
            );

            await token.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: inputParam.receiver[index]
                }
            );

            await token.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: inputParam.receiver[index]
                }
            );

            await token.approve(
                contracts.feeManager.address,
                HUGE_AMOUNT,
                {
                    from: inputParam.receiver[index]
                }
            );
        }
    }

    liquidate = async (inputParam = {}) => {

        const borrowShares = await contracts.lending.getPositionBorrowShares(
            inputParam.nftId,
            inputParam.paybackToken
        );

        const paybackShares = Bi(borrowShares)
            * Bi(inputParam.percent)
            / Bi(toWei("1"));


        await contracts.lending.liquidatePartiallyFromTokens(
            inputParam.nftId,
            inputParam.nftIdLiquidator,
            inputParam.paybackToken,
            inputParam.receiveToken,
            paybackShares,
            {
                from: inputParam.liquidator
            }
        );
    }

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
                },
                {
                    Token: WETH,
                    contract: contracts.lending,
                    user: bob,
                    type: "normal"
                },
                {
                    Token: WETH,
                    contract: contracts.lending,
                    user: user,
                    type: "normal"
                },
                {
                    Token: USDC,
                    contract: contracts.lending,
                    user: bob,
                    type: "normal"
                },
                {
                    Token: USDC,
                    contract: contracts.lending,
                    user: user,
                    type: "normal"
                }
            ]
        );

        return contracts
    }

    describe("Basic FeeManager tests", () => {

        beforeEach(async () => {
            contracts = await preparationSetup();
        });

        it("Only Multisig can announce new claimer", async () => {

            await expectRevert(
                contracts.feeManager.setBeneficial(
                    alice,
                    [
                        WETH.address,
                        USDC.address
                    ],
                    {
                        from: alice
                    }
                ),
                'NotMaster()'
            );

            await contracts.feeManager.setBeneficial(
                alice,
                [
                    WETH.address,
                    USDC.address
                ],
                {
                    from: owner
                }
            );

        });

        it("Only allowed user can withdraw fee token", async () => {

            const depositAmount = toWei("168");
            const borrowAmount = toWei("17");

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
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

            await deposit({
                nftId: [1],
                depositTokens: [
                    WETH.address
                ],
                depositAmount: [
                    depositAmount
                ],
                user: [
                    alice
                ]
            });

            await borrow(
                {
                    nftId: [1],
                    borrowTokens: [WETH.address],
                    borrowAmount: [borrowAmount],
                    user: [alice]
                }
            );

            await generateFees({
                time: SECONDS_IN_DAY,
                poolTokens: [WETH.address]
            });

            await contracts.feeManager.claimWiseFees(
                WETH.address
            );

            const feeTokenAmount = await contracts.feeManager.feeTokens(
                WETH.address
            );

            assert.isAbove(
                parseInt(feeTokenAmount),
                parseInt(0)
            );

            await expectRevert(
                contracts.feeManager.claimFeesBeneficial(
                    WETH.address,
                    feeTokenAmount,
                    {
                        from: alice
                    }
                ),
                'NotAllowed()'
            );

            await contracts.feeManager.setBeneficial(
                alice,
                [USDC.address],
                {
                    from: owner
                }
            );

            await contracts.feeManager.setBeneficial(
                bob,
                [WETH.address],
                {
                    from: owner
                }
            );

            await expectRevert(
                contracts.feeManager.claimFeesBeneficial(
                    WETH.address,
                    feeTokenAmount,
                    {
                        from: alice
                    }
                ),
                'NotAllowed()'
            );

            balBobBefore = await WETH.balanceOf(
                bob
            );

            await contracts.feeManager.claimFeesBeneficial(
                WETH.address,
                feeTokenAmount,
                {
                    from: bob
                }
            );

            balBobAfter = await WETH.balanceOf(
                bob
            );

            const diff = Bi(balBobAfter)
                - Bi(balBobBefore);

            assert.equal(
                diff.toString(),
                feeTokenAmount.toString()
            );

            const balContract = await contracts.feeManager.feeTokens(
                WETH.address
            );

            assert.equal(
                balContract.toString(),
                "0"
            );
        });

        it("Can't withdraw with open bad debt", async () => {

            const transferAmount = pow6(10000);
            const depositAmount1 = toWei("268");
            const depositAmount2 = pow6(5000);
            const borrowAmount = pow6(1700);
            const percent = toWei("0.7");

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

            await transferToken({
                tokens: [USDC.address],
                sender: [alice],
                receiver: [bob],
                amount: [transferAmount]
            });

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await deposit(
                {
                    nftId: [1,2],
                    depositTokens: [WETH.address, USDC.address],
                    depositAmount: [depositAmount1, depositAmount2],
                    user: [alice, bob]
                }
            );

            await borrow(
                {
                    nftId: [1],
                    borrowTokens: [USDC.address],
                    borrowAmount: [borrowAmount * 0.95],
                    user: [alice]
                }
            );

            await chainlinkWETH.setValue(
                pow8(6)
            );

            await liquidate({
                nftId: 1,
                nftIdLiquidator: 2,
                user: alice,
                liquidator: bob,
                paybackToken: USDC.address,
                receiveToken: WETH.address,
                percent: percent
            });

            const badDebtUsd = await contracts.feeManager.totalBadDebtETH();

            assert.isAbove(
                parseInt(badDebtUsd),
                parseInt(0)
            );

            const badDebtPosition = await contracts.feeManager.badDebtPosition(
                1
            );

            assert.isAbove(
                parseInt(badDebtPosition),
                parseInt(0)
            );

            await contracts.feeManager.setBeneficial(
                alice,
                [WETH.address,USDC.address],
                {
                    from: owner
                }
            );

            const feeTokenAmount = await WETH.balanceOf(
                contracts.feeManager.address
            );

            await expectRevert(
                contracts.feeManager.claimFeesBeneficial(
                    WETH.address,
                    feeTokenAmount,
                    {
                        from: alice
                    }
                ),
                'ExistingBadDebt()'
            );
        })

        it("User can payback bad debt and gets right fee token amount", async () => {

            const transferAmount = toWei("1000000");

            const depositAmount1 = toWei("2754");
            const depositAmount2 = pow6(50000);
            const borrowAmount = pow6(16587);
            const borrowAmount2 = toWei("1000")
            const percent = toWei("0.5");
            const percentPayback = toWei("0.005");

            // const ALLOWED_DIFFERENCE = toWei("0.00001");
            const ALLOWED_DIFFERENCE_ETH = toWei("0.001");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: user
                }
            );

            await transferToken({
                tokens: [WETH.address],
                sender: [alice],
                receiver: [user],
                amount: [transferAmount]
            });

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await deposit(
                {
                    nftId: [2, 1],
                    depositTokens: [WETH.address, USDC.address],
                    depositAmount: [depositAmount1, depositAmount2],
                    user: [user,alice]
                }
            );

            await borrow(
                {
                    nftId: [2, 1],
                    borrowTokens: [USDC.address, WETH.address],
                    borrowAmount: [borrowAmount, borrowAmount2],
                    user: [user, alice]
                }
            );

            await generateFees(
                {
                    time: 310 * SECONDS_IN_DAY,
                    poolTokens: [WETH.address, USDC.address]
                }
            );

            await setLastUpdateGlobal(
                [chainlinkWETH, chainlinkUSDC]
            );

            await contracts.feeManager.claimWiseFeesBulk();

            const balETH = await contracts.feeManager.feeTokens(
                WETH.address
            );

            const balUSDC = await contracts.feeManager.feeTokens(
                USDC.address
            );

            assert.isAbove(
                parseInt(balETH),
                parseInt(0)
            );

            assert.isAbove(
                parseInt(balUSDC),
                parseInt(0)
            );

            await chainlinkWETH.setValue(
                pow8(6)
            );

            await USDC.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await liquidate({
                user: user,
                nftId: 2,
                liquidator: alice,
                nftIdLiquidator: 1,
                paybackToken: USDC.address,
                receiveToken: WETH.address,
                percent: percent
            });

            // console.log(contracts.security, 'contracts.security');
            const debtRatioUser = await contracts.security.getLiveDebtRatio(
                2
            );

            const openSharesBaddebt = await contracts.lending.getPositionBorrowShares(
                2,
                USDC.address
            );

            const USDCcontract = await contracts.feeManager.feeTokens(
                USDC.address
            );

            const portion = Bi(openSharesBaddebt)
                * Bi(percentPayback)
                / Bi(toWei("1"));

            await takeSnapshot();

            await contracts.lending.syncManually(
                WETH.address
            );

            await contracts.lending.syncManually(
                USDC.address
            );

            const paybackAmount = await contracts.lending.paybackAmount(
                USDC.address,
                portion
            );

            const badDebtPosition = await contracts.feeManager.badDebtPosition(
                2
            );

            await snapshot.restore();

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await USDC.approve(
                contracts.feeManager.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            const badDebtContract = await contracts.feeManager.totalBadDebtETH();

            const balLendingBefore = await USDC.balanceOf(
                contracts.lending.address
            );

            await contracts.feeManager.paybackBadDebtForToken(
                2,
                USDC.address,
                USDC.address,
                portion,
                {
                    from: alice
                }
            );

            const balLendingAfter = await USDC.balanceOf(
                contracts.lending.address
            );

            const contractDiff = Bi(balLendingAfter)
                - Bi(balLendingBefore);

            const diffPayback = Bi(contractDiff)
                - Bi(paybackAmount);

            const diffPaybackBool = await inBound(
                abs(diffPayback),
                USDC
            );

            assert.equal(
                diffPaybackBool.toString(),
                "true"
            );

            const debtRatioUserAfter = await contracts.security.getLiveDebtRatio(
                2
            );

            const USDCcontractAfter = await contracts.feeManager.feeTokens(
                USDC.address
            );

            assert.isAbove(
                parseInt(debtRatioUser),
                parseInt(debtRatioUserAfter)
            );

            assert.isAbove(
                parseInt(USDCcontract),
                parseInt(USDCcontractAfter)
            );

            const bonus = await contracts.feeManager.paybackIncentive();

            const adjustBonus = Bi(toWei("1"))
                + Bi(bonus);

            const diffUSD = Bi(USDCcontract)
                - Bi(USDCcontractAfter);

            const quotient = Bi(diffUSD)
                * Bi(toWei("1"))
                / Bi(paybackAmount);

            const diffQuotient = Bi(adjustBonus)
                - Bi(quotient);

            const diffbool = await inBound(
                abs(diffQuotient),
                WETH
            );

            assert.equal(
                diffbool.toString(),
                "true"
            );

            const badDebtContractAfter = await contracts.feeManager.totalBadDebtETH();

            const diffBadDebtContract = Bi(badDebtContract)
                - Bi(badDebtContractAfter);

            const badDebtUserAfter = await contracts.feeManager.badDebtPosition(
                2
            );

            const diffBaddebtUser = Bi(badDebtPosition)
                - Bi(badDebtUserAfter);

            const paybackETH = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                paybackAmount
            );

            assert.equal(
                diffBadDebtContract.toString(),
                diffBaddebtUser.toString()
            );

            const diffETHUser = Bi(paybackETH)
                - Bi(diffBaddebtUser);

            const boolDiffETH = parseInt(abs(diffETHUser)) < parseInt(ALLOWED_DIFFERENCE_ETH);

            assert.equal(
                boolDiffETH.toString(),
                "true"
            );
        })

        it("Bad debt updates correctly when token value changes", async () => {

            const transferAmount = toWei("100000");
            const depositAmount1 = toWei("1785");
            const depositAmount2 = pow6(50000);
            const borrowAmount = pow6(10000);
            const percent = toWei("0.5");

            await contracts.nft.mintPosition(
                {
                    from: user
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await transferToken({
                tokens: [
                    WETH.address
                ],
                sender: [
                    alice
                ],
                receiver: [
                    user
                ],
                amount: [
                    transferAmount
                ]
            });

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await deposit({
                nftId: [
                    1,
                    2
                ],
                depositTokens: [
                    WETH.address,
                    USDC.address
                ],
                depositAmount: [
                    depositAmount1,
                    depositAmount2
                ],
                user: [
                    user,
                    alice
                ]
            });

            await borrow(
                {
                    nftId: [
                        1
                    ],
                    borrowTokens: [
                        USDC.address
                    ],
                    borrowAmount: [
                        borrowAmount
                    ],
                    user: [
                        user
                    ]
                }
            );

            await generateFees(
                {
                    time: 17 * SECONDS_IN_DAY,
                    poolTokens: [
                        WETH.address,
                        USDC.address
                    ]
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await contracts.feeManager.claimWiseFeesBulk();

            await chainlinkWETH.setValue(
                pow8(5)
            );

            await USDC.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await liquidate(
                {
                    user: user,
                    nftId: 1,
                    liquidator: alice,
                    nftIdLiquidator: 2,
                    paybackToken: USDC.address,
                    receiveToken: WETH.address,
                    percent: percent
                }
            );

            const uerBadDebt = await contracts.feeManager.badDebtPosition(
                1
            );

            await chainlinkWETH.setValue(
                pow8(5.1)
            );

            await contracts.feeManager.updatePositionCurrentBadDebt(
                1
            );

            const uerBadDebt2 = await contracts.feeManager.badDebtPosition(
                1
            );

            assert.isAbove(
                parseInt(uerBadDebt),
                parseInt(uerBadDebt2)
            );

            debug("uerBadDebt2", uerBadDebt2);

            const borrowSharesUser = await contracts.lending.getPositionBorrowShares(
                1,
                USDC.address
            );

            debug("borrowSharesUser", borrowSharesUser);

            await takeSnapshot();

            await contracts.lending.syncManually(
                WETH.address
            );

            await contracts.lending.syncManually(
                USDC.address
            );

            const paybackAmount = await contracts.lending.paybackAmount(
                USDC.address,
                borrowSharesUser
            );

            await restoreSnapshot();

            const balLendingBefore = await USDC.balanceOf(
                contracts.lending.address
            );

            debug("balLendingBefore", balLendingBefore);

            await USDC.approve(
                contracts.feeManager.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await contracts.feeManager.paybackBadDebtNoReward(
                1,
                USDC.address,
                borrowSharesUser,
                {
                    from: alice
                }
            );

            const balLendingAfter = await USDC.balanceOf(
                contracts.lending.address
            );

            debug("balLendingAfter",balLendingAfter);

            const contractDiff = Bi(balLendingAfter)
                - Bi(balLendingBefore);

            debug("contractDiff", contractDiff);
            debug("paybackAmount", paybackAmount);

            const diffPayback = Bi(contractDiff)
                - Bi(paybackAmount);

            const diffPaybackBool = await inBound(
                abs(diffPayback),
                USDC
            );

            assert.equal(
                diffPaybackBool.toString(),
                "true"
            );

            const uerBadDebt3 = await contracts.feeManager.badDebtPosition(
                1
            );

            assert.equal(
                uerBadDebt3.toString(),
                "0"
            );
        })
    })

    describe("Fee Destination and magnitute tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

            await chainlinkUSDC.setValue(
                pow8(50)
            );

            await chainlinkWETH.setValue(
                pow8(50)
            );
        });

        it("fee Destination settings", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const smallTime = 1000;

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkWETH
                ]
            );

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
                smallTime
            );

            await contracts.lending.depositExactAmount(
                1,
                WETH.address,
                depositAmount,
                {
                    from: alice
                }
            );

            const feeShares = await contracts.lending.getPositionLendingShares(
                0,
                WETH.address
            );

            assert.isAbove(
                parseInt(feeShares),
                parseInt(0)
            );
        });

        it("fee Destination settings for second token", async () => {

            const depositAmount = pow6(500000);
            const borrowAmount = pow6(10000);
            const smallTime = 1000;

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                1,
                USDC.address,
                depositAmount,
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
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                smallTime
            );

            await contracts.lending.depositExactAmount(
                1,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            const feeShares = await contracts.lending.getPositionLendingShares(
                0,
                USDC.address
            );

            assert.isAbove(
                parseInt(feeShares),
                0
            );
        });

        it("fee Destination lifecycle", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");

            const secondRoundDeposit = toWei("1");

            const smallTime = 1000;
            const EXPECTED_ADMIN_NFT_ID = 0;

            const adminNFT = await contracts.nft.FEE_MANAGER_NFT();
            const aliceNFT = await contracts.nft.getNextExpectedId();

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkWETH
                ]
            );

            await contracts.lending.depositExactAmount(
                aliceNFT,
                WETH.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.collateralizeDeposit(
                aliceNFT,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                aliceNFT,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                smallTime
            );

            await contracts.lending.depositExactAmount(
                aliceNFT,
                WETH.address,
                depositAmount,
                {
                    from: alice
                }
            );

            const balBeforeCashoutFee = await WETH.balanceOf(
                contracts.feeManager.address
            );

            const adminLendingShares = await contracts.lending.getPositionLendingShares(
                adminNFT,
                WETH.address
            );

            assert.equal(
                adminNFT.toString(),
                EXPECTED_ADMIN_NFT_ID
            );

            await expectRevert(
                contracts.lending.withdrawExactShares(
                    adminNFT,
                    WETH.address,
                    adminLendingShares,
                    {
                        from: alice
                    }
                ),
                "NotOwner()"
            );

            await contracts.feeManager.claimWiseFees(
                WETH.address
            );

            userShares = await contracts.lending.getPositionLendingShares(
                aliceNFT,
                WETH.address
            );

            adminShares = await contracts.lending.getPositionLendingShares(
                adminNFT,
                WETH.address
            );

            const balAfterCashoutFee = await WETH.balanceOf(
                contracts.feeManager.address
            );

            assert.isAbove(
                parseInt(balAfterCashoutFee),
                parseInt(balBeforeCashoutFee)
            );

            const borrowSharesUser = await contracts.lending.getPositionBorrowShares(
                aliceNFT,
                WETH.address
            );

            await contracts.lending.paybackExactShares(
                aliceNFT,
                WETH.address,
                borrowSharesUser,
                {
                    from: alice
                }
            );

            const lendingSharesUser = await contracts.lending.getPositionLendingShares(
                aliceNFT,
                WETH.address
            );

            await contracts.lending.withdrawExactShares(
                aliceNFT,
                WETH.address,
                lendingSharesUser,
                {
                    from: alice
                }
            );

            userShares = await contracts.lending.getPositionLendingShares(
                aliceNFT,
                WETH.address
            );

            adminShares = await contracts.lending.getPositionLendingShares(
                adminNFT,
                WETH.address
            );

            await advanceTimeAndBlock(
                1 * SECONDS_IN_DAY
            );

            await contracts.feeManager.claimWiseFees(
                WETH.address
            );

            const balAtEnd = await WETH.balanceOf(
                contracts.lending.address
            );

            assert.equal(
                "2",
                balAtEnd.toString()
            );

            const totalSharesAtEnd = await contracts.lending.getTotalDepositShares(
                WETH.address
            );

            const pseudoEnd = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            assert.isAbove(
                parseInt(1003),
                parseInt(pseudoEnd)
            );

            assert.equal(
                totalSharesAtEnd.toString(),
                "1000"
            );

            let userBorrowShares = await contracts.lending.getPositionBorrowShares(
                aliceNFT,
                WETH.address
            );

            assert.equal(
                userBorrowShares.toString(),
                "0"
            );

            await contracts.lending.depositExactAmount(
                aliceNFT,
                WETH.address,
                secondRoundDeposit,
                {
                    from: alice
                }
            );

            const sharesRound2 = await contracts.lending.getPositionLendingShares(
                aliceNFT,
                WETH.address
            );

            await contracts.lending.withdrawExactShares(
                aliceNFT,
                WETH.address,
                sharesRound2,
                {
                    from: alice
                }
            );

            const totalSharesAtEnd2 = await contracts.lending.getTotalDepositShares(
                WETH.address
            );

            const pseudoEnd2 = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            assert.equal(
                totalSharesAtEnd2.toString(),
                "1000"
            );

            assert.isAbove(
                parseInt(1005),
                parseInt(pseudoEnd2)
            );
        });

        it("fee amount has correct order of magnitude", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const smallTime = 1000;

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

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
                smallTime
            );

            await contracts.lending.depositExactAmount(
                1,
                WETH.address,
                depositAmount,
                {
                    from: alice
                }
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                WETH.address
            );

            const pseudoTotal = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            const calculateInterest = Bi(pseudoTotal)
                - Bi((toWei("100")));

            const balABeforeCashoutFee = await WETH.balanceOf(
                contracts.lending.address
            );

             /*
            const lendingSharesFeeManager = await contracts.lending.getPositionLendingShares(
                contracts.feeManager.address,
                token1.address
            );*/

            await snapshot.restore();

            await contracts.feeManager.claimWiseFees(
                WETH.address
            );

            const balAfterCashoutFee = await WETH.balanceOf(
                contracts.lending.address
            );

            const feeWithdrawn = Bn(balABeforeCashoutFee)
                .sub(balAfterCashoutFee);

            const feeWithDrawCalc = Bi(calculateInterest)
                * Bi(20)
                / Bi(100)

            const diffRel = (Bi(feeWithDrawCalc)
                - Bi(feeWithdrawn))
                * Bi(10000)
                / Bi(feeWithDrawCalc);

            const diffBool = abs(diffRel) < 5;

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });
    });

    describe("Fee Adjustments for Pools tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();
        });

        it("Fee adjustments works correctly", async () => {

            const newFee = toWei("0.5");
            const newFee2 = toWei("0.99");

            const poolData1 = await contracts.lending.globalPoolData(
                WETH.address
            );

            const defaultFee = poolData1.poolFee;

            const poolData2 = await contracts.lending.globalPoolData(
                USDC.address
            );

            const defaultFee2 = poolData2.poolFee;

            assert.equal(
                defaultFee.toString(),
                toWei("0.2").toString()
            );

            assert.equal(
                defaultFee2.toString(),
                defaultFee.toString(),
            );

            await contracts.feeManager.setPoolFee(
                WETH.address,
                newFee
            );

            await contracts.feeManager.setPoolFee(
                USDC.address,
                newFee2
            );

            const poolData3 = await contracts.lending.globalPoolData(
                WETH.address
            );

            const adjustedFee = poolData3.poolFee;

            const poolData4 = await contracts.lending.globalPoolData(
                USDC.address
            );

            const adjustedFee2 = poolData4.poolFee;

            assert.equal(
                newFee.toString(),
                adjustedFee.toString()
            );

            assert.equal(
                newFee2.toString(),
                adjustedFee2.toString()
            );
        });

        it("Reverts work correctly", async () => {

            const newFee = toWei("0.3");
            const newFeeTooHigh = toWei("1.01");
            const newFeeTooLow = toWei("0.009");

            await expectRevert(
                contracts.feeManager.setPoolFee(
                    WETH.address,
                    newFee,
                    {
                        from: alice
                    }
                ),
                'NotMaster()'
            );

            await expectRevert(
                contracts.feeManager.setPoolFee(
                    WETH.address,
                    newFeeTooHigh
                ),
                'TooHighValue()'
            );

            await expectRevert(
                contracts.feeManager.setPoolFee(
                    WETH.address,
                    newFeeTooLow
                ),
                'TooLowValue()'
            );
        });

        it("Pools can added and removed to fee manager correctly", async () => {

            await contracts.feeManager.removePoolTokenManual(
                WETH.address
            );

            const pools = await contracts.feeManager.getPoolTokenAddressesLength();

            let existWETH = false;
            let existUSDC = false;

            let index = 0;

            while(index < pools) {

                poolAddress = await contracts.feeManager.poolTokenAddresses(
                    index
                );

                if (poolAddress == WETH.address) {
                    existWETH = true;
                }

                if (poolAddress == USDC.address) {
                    existUSDC = true;
                }

                index += 1;
            };

            const poolBool = await contracts.feeManager.poolTokenAdded(
                WETH.address
            );

            assert.equal(
                poolBool.toString(),
                "false"
            );

            assert.equal(
                existWETH.toString(),
                "false"
            );

            assert.equal(
                existUSDC.toString(),
                "true"
            );

            await expectRevert(
                contracts.feeManager.addPoolTokenAddressManual(
                    USDC.address
                ),
                'PoolAlreadyAdded()'
            );

            await contracts.feeManager.addPoolTokenAddressManual(
                WETH.address
            );

            const poolsNew = await contracts.feeManager.getPoolTokenAddressesLength();

            existWETH = false;
            existUSDC = false;

            index = 0;

            while(index < poolsNew) {

                poolAddress = await contracts.feeManager.poolTokenAddresses(
                    index
                );

                if (poolAddress == WETH.address) {
                    existWETH = true;
                }

                if (poolAddress == USDC.address) {
                    existUSDC = true;
                }

                index += 1;
            };

            assert.equal(
                existWETH.toString(),
                "true"
            );

            assert.equal(
                existUSDC.toString(),
                "true"
            );
        });

        it("Only Master can remove and add pools manually", async () => {

            await expectRevert(
                contracts.feeManager.removePoolTokenManual(
                    USDC.address,
                    {
                        from: bob
                    }
                ),
                'NotMaster()'
            );

            await contracts.feeManager.removePoolTokenManual(
                USDC.address
            );

            await expectRevert(
                contracts.feeManager.addPoolTokenAddressManual(
                    USDC.address,
                    {
                        from: alice
                    }
                ),
                'NotMaster()'
            );

        });
    });

    describe("Lp Wrapper tests", () => {

        beforeEach(async () => {

            LPtoken = await Token.new(
                10,
                alice
            );

            lpWrapper = await SyntheticLp.new(
                10,
                owner,
                LPtoken.address
            );
        });

        it("LpWrapper gets initialized correctly", async () => {

            const multisig = await lpWrapper.master();

            const fee = await lpWrapper.baseFee();

            const underlyingToken = await lpWrapper.underlyingLpToken();

            assert.equal(
                multisig,
                owner
            );

            assert.equal(
                fee.toString(),
                toWei("0.01").toString()
            );

            assert.equal(
                underlyingToken,
                LPtoken.address
            );
        });

        it("Multisig and Fee can set correctly", async () => {

            const newFee = toWei("0.02");
            const tooBigFee = toWei("0.05");

            await expectRevert(
                lpWrapper.proposeOwner(
                    alice,
                    {
                        from: alice
                    }
                ),
                "NotMaster"
            );

            await lpWrapper.proposeOwner(
                alice,
                {
                    from: owner
                }
            );

            await expectRevert(
                lpWrapper.claimOwnership(
                    {
                        from: bob
                    }
                ),
                "NotProposed()"
            );

            await lpWrapper.claimOwnership(
                {
                    from: alice
                }
            );

            const newMaster = await lpWrapper.master();

            assert.equal(
                newMaster,
                alice
            );

            await expectRevert(
                lpWrapper.adjustBaseFee(
                    tooBigFee,
                    {
                        from: alice
                    }
                ),
                "FeeTooHigh()"
            );

            await expectRevert(
                lpWrapper.adjustBaseFee(
                    newFee,
                    {
                        from: bob
                    }
                ),
                "NotMaster()"
            );

            await lpWrapper.adjustBaseFee(
                newFee,
                {
                    from: alice
                }
            );

            const fee = await lpWrapper.baseFee();

            assert.equal(
                fee.toString(),
                newFee.toString()
            );
        });

        it("Right amount gets minted", async () => {

            const mintAmount = 865 * Math.pow(10,10);   //LP token has dec = 10!
            const fee = await lpWrapper.baseFee();

            const expectedFeeAmount = Bi(mintAmount)
                * Bi(fee)
                / Bi(toWei("1"));

            await LPtoken.approve(
                lpWrapper.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await lpWrapper.mint(
                bob,
                toWei("4"),
                mintAmount,
                {
                    from: alice
                }
            );

            const gatheredFees = await lpWrapper.balanceOf(
                owner
            );

            const totalSupply = await lpWrapper.totalSupply();

            assert.equal(
                totalSupply.toString(),
                mintAmount.toString()
            );

            assert.equal(
                expectedFeeAmount.toString(),
                gatheredFees.toString()
            );

            const balAlice = await lpWrapper.balanceOf(
                bob
            );

            const diff = Bi(mintAmount)
                - Bi(expectedFeeAmount);

            assert.equal(
                diff.toString(),
                balAlice.toString()
            );
        });

        it("Right amount gets burned", async () => {

            const mintAmount = 2659 * Math.pow(10,10);
            const burnAmount = 1269 * Math.pow(10,10);

            await LPtoken.approve(
                lpWrapper.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await lpWrapper.mint(
                alice,
                0,
                mintAmount,
                {
                    from: alice
                }
            );

            const balBefore = await lpWrapper.balanceOf(
                alice
            );

            const balBeforeToken = await LPtoken.balanceOf(
                bob
            );

            const balWrapper = await lpWrapper.totalSupply();

            await lpWrapper.burn(
                bob,
                burnAmount,
                {
                    from: alice
                }
            );

            const balAfter = await lpWrapper.balanceOf(
                alice
            );

            const balAfterToken = await LPtoken.balanceOf(
                bob
            );

            const balWrapperAfter = await lpWrapper.totalSupply();

            const diffToken = Bi(balAfterToken)
                - Bi(balBeforeToken);

            const diff = Bi(balBefore)
                - Bi(balAfter);

            const diffWrapper = Bi(balWrapper)
                - Bi(balWrapperAfter);

            assert.equal(
                diffToken.toString(),
                diff.toString()
            );

            assert.equal(
                diffWrapper.toString(),
                diffToken.toString()
            );
        });
    });
});
