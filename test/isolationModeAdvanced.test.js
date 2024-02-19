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

require("./utils");
require("./constants");
require("./test-scenarios");

contract("Isolation Mode Advanced Tests", async accounts  => {

    const [owner, user, alice, bob, random] = accounts;

    let contracts;
    let isolationPool;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

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

        const tokenData3 = await createToken(
            {
                Token: Token,
                Chainlink: Chainlink,
                OracleHub: contracts.oracleHub,
                value: pow8(2),
                dec: 18,
                user: user
            }
        );

        USDC = tokenData.token;
        chainlinkUSDC = tokenData.oracle

        DAI = tokenData2.token;
        chainlinkDAI = tokenData2.oracle;

        LPToken = tokenData3.token;
        chainlinkLPToken = tokenData3.oracle;

        await setupHeartbeatForTests(
            {
                oracleHub: contracts.oracleHub,
                tokens: [
                    USDC,
                    DAI,
                    LPToken
                ],
                chainlinkInterfaces: [
                    chainlinkUSDC,
                    chainlinkDAI,
                    chainlinkLPToken
                ]
            }
        );

        await addPools(
            contracts.lending,
            [
                {
                    allowBorrow: true,
                    poolToken: USDC,
                    mulFactor: toWei("1"),
                    collFactor: toWei("0.8"),
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: DAI,
                    mulFactor: toWei("1"),
                    collFactor: toWei("0.8"),
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: LPToken,
                    mulFactor: toWei("2"),
                    collFactor: toWei("0.8"),
                    maxDeposit: HUGE_AMOUNT
                }
            ]
        );

        isolationPool = await IsolationContract.new(
            contracts.oracleHub.address,
            contracts.lending.address,
            contracts.liquidation.address,
            LPToken.address,
            contracts.security.address,
            toWei("0.95"),
            // toWei("1"),
            [
                DAI.address,
                USDC.address
            ],
            [
                toWei("0.5"),
                toWei("0.5")
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
                    user: user,
                    type: "normal"
                },
                {
                    Token: DAI,
                    contract: contracts.lending,
                    user: user,
                    type: "normal"
                },
                {
                    Token: LPToken,
                    contract: contracts.lending,
                    user: user,
                    type: "normal"
                },
                {
                    Token: USDC,
                    contract: contracts.lending,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: DAI,
                    contract: contracts.lending,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: LPToken,
                    contract: contracts.lending,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: DAI,
                    contract: isolationPool,
                    user: user,
                    type: "normal"
                },
                {
                    Token: DAI,
                    contract: isolationPool,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: USDC,
                    contract: isolationPool,
                    user: user,
                    type: "normal"
                },
                {
                    Token: USDC,
                    contract: isolationPool,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: LPToken,
                    contract: isolationPool,
                    user: alice,
                    type: "normal"
                },
                {
                    Token: LPToken,
                    contract: isolationPool,
                    user: user,
                    type: "normal"
                },
            ]
        );

        return [
            contracts,
            isolationPool
        ];
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

    // DEPRECATED ONBEHALF USE POWER FARMS METHOD OF KEEPING NFT INSTEAD
    describe.skip("Advanced Tests with two Borrow Token (50/50)", () => {

        beforeEach(async () => {

            [
                contracts,
                isolationPool
            ] = await preparationSetup();
        });

        it("Borrower can only borrow after approving both borrow token", async() => {

            const targetDebt = toWei("0.80");
            const depositUSDCAlice = pow6(1000000);
            const depositDAIAlice = toWei("3258694");

            const transferAmountLP = toWei("10000");

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

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI,
                    chainlinkLPToken
                ]
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositDAIAlice,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositUSDCAlice,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                transferAmountLP,
                {
                    from: user
                }
            );

            await expectRevert.unspecified(
                isolationPool.borrowExactDebtRatio(
                    1,
                    targetDebt,
                    {
                        from: user
                    }
                ),
            );

            await expectRevert.unspecified(
                isolationPool.borrowExactDebtRatio(
                    1,
                    targetDebt,
                    {
                        from: user
                    }
                ),
            );

            await isolationPool.borrowExactDebtRatio(
                1,
                targetDebt,
                {
                    from: user
                }
            );
        })

        it("Borrower gets right amount of both tokens", async() => {

            const targetDebt = toWei("0.80");
            const transferAmountLP = toWei("10000");
            const depositUSDCAlice = pow6(1000000);
            const depositDAIAlice = toWei("3258694");

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

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI,
                    chainlinkLPToken
                ]
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositDAIAlice,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositUSDCAlice,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                transferAmountLP,
                {
                    from: user
                }
            );

            await isolationPool.borrowExactDebtRatio(
                1,
                targetDebt,
                {
                    from: user
                }
            );

            const balDai = await DAI.balanceOf(
                user
            );

            const balUSDC = await USDC.balanceOf(
                user
            );

            const decDai = await DAI.decimals();
            const decUSDC = await USDC.decimals();

            const adjustedUSDC = Bi(balUSDC)
                * Bi(10 ** (decDai - decUSDC));

            assert.equal(
                balDai.toString(),
                adjustedUSDC.toString()
            );

            const debtRatio = await isolationPool.getLiveDebtRatio(
                1
            );

            assert.equal(
                targetDebt.toString(),
                debtRatio.toString()
            );
        })

        it("borrowExactDebtRatio gets the same token amounts as borrowExactUSD", async() => {

            const targetDebt = toWei("0.80");
            const depositLP = toWei("10000");
            const depositUSDCAlice = pow6(1000000);
            const depositDAIAlice = toWei("2546982");

            const DAI_USD = pow8(1.001);
            const USDC_USD = pow8(0.9998);

            await chainlinkDAI.setValue(
                DAI_USD
            );

            await chainlinkUSDC.setValue(
                USDC_USD
            );

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

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI,
                    chainlinkLPToken
                ]
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositDAIAlice,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositUSDCAlice,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositLP,
                {
                    from: user
                }
            );

            takeSnapshot();

            await isolationPool.borrowExactDebtRatio(
                1,
                targetDebt,
                {
                    from: user
                }
            );

            const balAfterDAI = await DAI.balanceOf(
                user
            );

            const balAfterUSDC = await USDC.balanceOf(
                user
            );

            const borrowAmountDebtRatioDAIUSD = await contracts.oracleHub.getTokensInETH(
                DAI.address,
                balAfterDAI
            );

            const borrowAmountDebtRatioUSDCUSD = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                balAfterUSDC
            );

            const diff = Bi(borrowAmountDebtRatioDAIUSD)
                - Bi(borrowAmountDebtRatioUSDCUSD)

            const diffBool = await inBound(
                abs(diff),
                DAI
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            await snapshot.restore();

            const borrowAmount = await isolationPool.getBorrowAmountFromDebtratio(
                1,
                targetDebt
            );

            const callBackValue = await isolationPool.borrowExactUSD.call(
                1,
                borrowAmount,
                {
                    from: user
                }
            ).then(
                await isolationPool.borrowExactUSD(
                    1,
                    borrowAmount,
                    {
                        from: user
                    }
                )
            );

            balNewAfterDAI = await DAI.balanceOf(
                user
            );

            balNewAfterUSDC = await USDC.balanceOf(
                user
            );

            assert.equal(
                balAfterDAI.toString(),
                callBackValue[0].toString()
            );

            assert.equal(
                callBackValue[1].toString(),
                balAfterUSDC.toString()
            );

            assert.equal(
                balNewAfterDAI.toString(),
                balAfterDAI.toString()
            );

            assert.equal(
                balNewAfterUSDC.toString(),
                balAfterUSDC.toString()
            );
        });

        it("paybackExactDebtratio pays back right amounts", async() => {

            const targetDebt = toWei("0.80");
            const paybackTarget = toWei("0.40");
            const depositLP = toWei("10000");

            const depositUSDCAlice = pow6(1000000);
            const depositDAIAlice = toWei("5469872");

            const DAI_USD = pow8(1.001);
            const USDC_USD = pow8(0.9998);

            await chainlinkDAI.setValue(
                DAI_USD
            );

            await chainlinkUSDC.setValue(
                USDC_USD
            );

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

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI,
                    chainlinkLPToken
                ]
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositDAIAlice,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositUSDCAlice,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositLP,
                {
                    from: user
                }
            );

            await isolationPool.borrowExactDebtRatio(
                1,
                targetDebt,
                {
                    from: user
                }
            );

            const userDAI = await DAI.balanceOf(
                user
            );

            const userUSDC = await USDC.balanceOf(
                user
            );

            const paybackTokenUSDCApprox = Bi(paybackTarget)
                * Bi(userUSDC)
                / Bi(targetDebt);

            const paybackTokenDAIApprox = Bi(paybackTarget)
                * Bi(userDAI)
                / Bi(targetDebt);

            const callBackValue = await isolationPool.paybackExactDebtratio.call(
                1,
                paybackTarget,
                {
                    from: user
                }
            ).then(
                await isolationPool.paybackExactDebtratio(
                    1,
                    paybackTarget,
                    {
                        from: user
                    }
                )
            );

            const diffUSDC = Bi(callBackValue[1])
                - Bi(paybackTokenUSDCApprox);

            const diffDAI = Bi(callBackValue[0])
                    - Bi(paybackTokenDAIApprox);

            const diffUSDCBool = await inBound(
                abs(diffUSDC),
                USDC
            );

            const diffDAIBool = await inBound(
                abs(diffDAI),
                DAI
            );

            assert.equal(
                diffUSDCBool.toString(),
                "true"
            );

            assert.equal(
                diffDAIBool.toString(),
                "true"
            );
        });

        it("paybackExactDebtratio payback same amount as paybackExactUSD", async() => {

            const targetDebt = toWei("0.80");
            const paybackTarget = toWei("0.53");

            const depositLP = toWei("23500");

            const depositUSDCAlice = pow6(2367485);
            const depositDAIAlice = toWei("3674185");

            const DAI_USD = pow8(0.9995);
            const USDC_USD = pow8(1.002);

            await chainlinkDAI.setValue(
                DAI_USD
            );

            await chainlinkUSDC.setValue(
                USDC_USD
            );

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

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkDAI, chainlinkLPToken]
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositDAIAlice,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositUSDCAlice,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositLP,
                {
                    from: user
                }
            )

            await isolationPool.borrowExactDebtRatio(
                1,
                targetDebt,
                {
                    from: user
                }
            )

            const userDAIBefore = await DAI.balanceOf(
                user
            );

            const userUSDCBefore = await USDC.balanceOf(
                user
            );

            takeSnapshot();

            const callBackValue = await isolationPool.paybackExactDebtratio.call(
                1,
                paybackTarget,
                {
                    from: user
                }
            );

            snapshot.restore();

            await isolationPool.paybackExactDebtratio(
                1,
                paybackTarget,
                {
                    from: user
                }
            );

            const userDAIAfter1 = await DAI.balanceOf(
                user
            );

            const userUSDCAfter1 = await USDC.balanceOf(
                user
            );

            const diffDAI1 = Bi(userDAIBefore)
                - Bi(userDAIAfter1);

            const diffUSDC1 = Bi(userUSDCBefore)
                - Bi(userUSDCAfter1);

            const usdEquivDAI = await contracts.oracleHub.getTokensInETH(
                DAI.address,
                callBackValue[0]
            );

            const usdEquivUSDC = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                callBackValue[1]
            );

            const usdEquiv = Bi(usdEquivUSDC)
                + Bi(usdEquivDAI);

            await snapshot.restore();

            await isolationPool.paybackExactUSD(
                1,
                usdEquiv,
                {
                    from: user
                }
            );

            const userDAIAfter2 = await DAI.balanceOf(
                user
            );

            const userUSDCAfter2 = await USDC.balanceOf(
                user
            );

            const diffDAI2 = Bi(userDAIBefore)
                - Bi(userDAIAfter2);

            const diffUSDC2 = Bi(userUSDCBefore)
                - Bi(userUSDCAfter2);

            const diffUSDC = Bi(diffUSDC1)
                - Bi(diffUSDC2);

            const diffDAI = Bi(diffDAI1)
                - Bi(diffDAI2);

            const diffUSDCBool = await inBound(
                abs(diffUSDC),
                USDC
            );

            const diffDAIBool = await inBound(
                abs(diffDAI),
                DAI
            );

            assert.equal(
                diffUSDCBool.toString(),
                "true"
            );

            assert.equal(
                diffDAIBool.toString(),
                "true"
            );
        });

        it("Liquidation works correctly for two token", async() => {

            const targetDebt = toWei("0.90");
            const liquidatePercent = toWei("0.53");

            const depositLP = toWei("23500");

            const depositUSDCAlice = pow6(3542589);
            const depositDAIAlice = toWei("8467952");

            const UPPER_BOUND = pow6(1);

            const DAI_USD = pow8(1);
            const USDC_USD = pow8(1);;

            await chainlinkDAI.setValue(
                DAI_USD
            );

            await chainlinkUSDC.setValue(
                USDC_USD
            );

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

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI,
                    chainlinkLPToken
                ]
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositDAIAlice,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositUSDCAlice,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositLP,
                {
                    from: user
                }
            )

            await isolationPool.borrowExactDebtRatio(
                1,
                targetDebt,
                {
                    from: user
                }
            );

            const LPprice = await contracts.oracleHub.latestResolver(
                LPToken.address
            );

            const newLprice = Bi(LPprice)
                * Bi(targetDebt)
                / Bi(toWei("1"));

            await chainlinkLPToken.setValue(
                newLprice
            );

            const totalBorrowUSD = await isolationPool.getTotalBorrowUSD(
                1
            );

            const liquidationAmountUSD = Bi(totalBorrowUSD)
                * Bi(liquidatePercent)
                / Bi(toWei("1"));

            const AliceUSDCBefore = await USDC.balanceOf(
                alice
            );

            const AliceDAIBefore = await DAI.balanceOf(
                alice
            );

            await USDC.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await DAI.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await isolationPool.liquidationUSDAmount(
                1,
                2,
                liquidationAmountUSD,
                {
                    from: alice
                }
            );

            const AliceUSDCAfter = await USDC.balanceOf(
                alice
            );

            const AliceDAIAfter = await DAI.balanceOf(
                alice
            );

            const diffUSDC = Bi(AliceUSDCBefore)
                - Bi(AliceUSDCAfter);

            const diffDAI = Bi(AliceDAIBefore)
                - Bi(AliceDAIAfter);

            const diffDAIUSD = await contracts.oracleHub.getTokensInETH(
                DAI.address,
                diffDAI
            );

            const diffUSDCUSD = await contracts.oracleHub.getTokensInETH(
                USDC.address,
                diffUSDC
            );

            const sumPayback = Bi(diffDAIUSD)
                + Bi(diffUSDCUSD);

            assert.equal(
                sumPayback.toString(),
                liquidationAmountUSD.toString()
            );

            const LPtokenAliceAfter = await LPToken.balanceOf(
                alice
            );

            const aliceCollatETH = await contracts.oracleHub.getTokensInETH(
                LPToken.address,
                LPtokenAliceAfter
            );

            const liquFee = await contracts.security.baseRewardLiquidationFarm();

            const liquFeeInverse = Bi(toWei("1"))
                + Bi(liquFee);

            const ETHWithoutFee = Bi(aliceCollatETH)
                * Bi(toWei("1"))
                / Bi(liquFeeInverse);

            const diff = Bi(sumPayback)
                - Bi(ETHWithoutFee);

            const diffBool = await inBound(
                abs(diff),
                DAI
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            const liveDebtratio2 = await isolationPool.getLiveDebtRatio(
                1
            );

            assert.isAbove(
                parseInt(toWei("1")),
                parseInt(liveDebtratio2)
            );
        });
    });
})
