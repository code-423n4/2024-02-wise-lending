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

contract("Isolation Mode", async accounts  => {

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
                user: user
            }
        );

        const tokenData2 = await createToken(
            {
                Token: Token,
                Chainlink: Chainlink,
                OracleHub: contracts.oracleHub,
                value: pow8(1),
                dec: 18,
                user: user
            }
        );

        USDC = tokenData.token;
        chainlinkUSDC = tokenData.oracle

        DAI = tokenData2.token;
        chainlinkDAI = tokenData2.oracle;

        await setupHeartbeatForTests(
            {
                oracleHub: contracts.oracleHub,
                tokens: [USDC, DAI],
                chainlinkInterfaces: [chainlinkUSDC, chainlinkDAI]
            }
        );

        await addPools(
            contracts.lending,
            [
                {
                    allowBorrow: true,
                    poolToken: USDC,
                    mulFactor: toWei("2"),
                    collFactor: toWei("0.85"),
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: DAI,
                    mulFactor: toWei("1"),
                    collFactor: toWei("0.5"),
                    maxDeposit: HUGE_AMOUNT
                }
            ]
        );

        isolationPool = await IsolationContract.new(
            contracts.oracleHub.address,
            contracts.lending.address,
            contracts.liquidation.address,
            USDC.address,
            contracts.security.address,
            toWei("0.95"),
            // toWei("1"),
            [
                DAI.address
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
                }
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

    // DEPRECATED ONBEHALF
    describe.skip("Setting up Isolation Pool and Registration tests", () => {

        beforeEach(async () => {

            [
                contracts,
                isolationPool
            ] = await preparationSetup();
        });

        it("Isolation pool can be registerd in WISE lending contract by owner", async () => {

            await expectRevert(
                contracts.lending.setVerifiedIsolationPool(
                    isolationPool.address,
                    true,
                    {
                        from: alice
                    }
                ),
                'NotMaster()'
            );

            await contracts.lending.setVerifiedIsolationPool(
                isolationPool.address,
                true
            );

            const state = await contracts.lending.verifiedIsolationPool(
                isolationPool.address
            );

            assert.equal(
                state.toString(),
                "true"
            );
        });

        it.skip("User can only register for verified isolation pool", async () => {

            const isolationPool2 = await IsolationContract.new(
                contracts.oracleHub.address,
                contracts.lending.address,
                contracts.liquidation.address,
                DAI.address,
                contracts.security.address,
                toWei("0.95"),
                // toWei("1"),
                [
                    USDC.address
                ],
                [toWei("1")]
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await expectRevert(
                isolationPool.registrationFarm(
                    1,
                    1,
                    {
                        from: alice
                    }
                ),
                'NonVerifiedPool()'
            );

            await contracts.lending.setVerifiedIsolationPool(
                isolationPool2.address,
                true
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: alice
                }
            );

            const lockBool = await contracts.lending.positionLocked(
                1
            );

            assert.equal(
                lockBool.toString(),
                "true"
            );
        });

        it("User can only register when address not used", async () => {

            const depositAmount = pow6(10);

            await contracts.nft.mintPosition(
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkDAI]
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount,
                user
            );

            await contracts.lending.collateralizeDeposit(
                1,
                USDC.address,
                {
                    from: user
                }
            );

            await expectRevert(
                isolationPool.registrationFarm(
                    1,
                    1,
                    {
                        from: user
                    }
                ),
                'NotAllowedWiseSecurity()'
            );

            const shares = await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            );

            await contracts.lending.withdrawExactShares(
                1,
                USDC.address,
                shares,
                {
                    from: user
                }
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );
        });

        it("Registerd user can not interact with WISE lending anymore", async () => {

            const interactionAmount = pow6(1);
            const nftContract = contracts.nft;
            const lendingContract = contracts.lending;

            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            isolationPool.registrationFarm(
                1,
                1,
                {
                    from: alice
                }
            );

            await expectRevert(
                lendingContract.solelyDeposit(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLocked()'
            );

            await expectRevert(
                wrapDepositAmount(
                    1,
                    USDC.address,
                    interactionAmount,
                    alice
                ),
                'PositionLocked()'
            );

            await expectRevert(
                lendingContract.solelyWithdraw(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLockedWiseSecurity()'
            );

            await expectRevert(
                lendingContract.withdrawExactAmount(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLockedWiseSecurity()'
            );

            await expectRevert(
                lendingContract.withdrawExactShares(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLockedWiseSecurity()'
            );

            await expectRevert(
                lendingContract.withdrawOnBehalfExactAmount(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLockedWiseSecurity()'
            );

            await expectRevert(
                lendingContract.withdrawOnBehalfExactShares(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLockedWiseSecurity()'
            );

            await expectRevert(
                lendingContract.borrowExactAmount(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLockedWiseSecurity()'
            );

            await expectRevert(
                lendingContract.borrowOnBehalfExactAmount(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLockedWiseSecurity()'
            );

            await expectRevert(
                lendingContract.paybackExactAmount(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLocked()'
            );

            await expectRevert(
                lendingContract.paybackExactShares(
                    1,
                    USDC.address,
                    interactionAmount,
                    {
                        from: alice
                    }
                ),
                'PositionLocked()'
            );
        });
    });

    // DEPRECATED ONBEHALF
    describe.skip("Basic Isolation Contract Interaction Tests", () => {

        beforeEach(async () => {

            const transferAmount = toWei("1000000000");

            [
                contracts,
                isolationPool
            ] = await preparationSetup();

            await chainlinkUSDC.setValue(
                pow8(5)
            );

            await chainlinkDAI.setValue(
                pow8(5)
            );

            await DAI.transfer(
                alice,
                transferAmount,
                {
                    from: user
                }
            );
        });

        it.skip("User can Deposit Token when registerd", async () => {

            const depositAmount = pow6(2563);

            await contracts.nft.mintPosition(
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await expectRevert(
                isolationPool.depositExactAmount(
                    1,
                    depositAmount,
                    {
                        from: user
                    }
                ),
                'NotRegistered()'
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
                {
                    from: user
                }
            )

            const userShare = await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            );

            assert.equal(
                userShare.toString(),
                depositAmount.toString()
            );
        });

        it("User can't deposit less then min amount into isolation pool", async () => {

            const depositAmountToLow = pow6(307);
            const depositAmountEnough = pow6(1000);

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkDAI]
            );

            await contracts.nft.mintPosition(
                {
                    from: user
                }
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await expectRevert(
                isolationPool.depositExactAmount(
                    1,
                    depositAmountToLow,
                    {
                        from: user
                    }
                ),
                "WiseIsolation: AMOUNT_TOO_LOW"
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmountEnough,
                {
                    from: user
                }
            );
        });

        it("User can borrow (set allowance for isolation pool)", async () => {

            const targetDebt = toWei("0.90");
            const depositAmount = pow6("3700");
            const depositAmount2 = toWei("10000");

            const nftContract = contracts.nft;
            const lendingContract = contracts.lending;

            await nftContract.mintPosition(
                {
                    from: user
                }
            );

            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
                {
                    from: user
                }
            )

            await expectRevert.unspecified(
                isolationPool.borrowExactDebtRatio(
                    1,
                    targetDebt,
                    {
                        from: user
                    }
                ),
            )

            const bal1 = await DAI.balanceOf(
                user
            );

            const callBackValue = await isolationPool.borrowExactDebtRatio.call(
                1,
                targetDebt,
                {
                    from: user
                }
            ).then(
                await isolationPool.borrowExactDebtRatio(
                    1,
                    targetDebt,
                    {
                        from: user
                    }
                )
            );

            const bal2 = await DAI.balanceOf(
                user
            );

            const diff = Bi(bal2)
                - Bi(bal1);

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                DAI.address
            );

            assert.equal(
                borrowShares.toString(),
                diff.toString()
            );

            assert.equal(
                callBackValue.toString(),
                diff.toString()
            );
        });

        it("borrowExactDebtRatio borrows same amount as borrowExactUSD", async () => {

            const targetDebt = toWei("0.93");
            const depositAmount = pow6(2456);
            const depositAmount2 = toWei("100000");

            const nftContract = contracts.nft;
            const lendingContract = contracts.lending;

            await nftContract.mintPosition(
                {
                    from: user
                }
            );

            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
                {
                    from: user
                }
            )

            const balBefore = await DAI.balanceOf(
                user
            );

            takeSnapshot();

            await isolationPool.borrowExactDebtRatio(
                1,
                targetDebt,
                {
                    from: user
                }
            );

            const balAfter = await DAI.balanceOf(
                user
            );

            const diffBal = Bi(balAfter)
                - Bi(balBefore);

            const borrowAmountDebtRatioUSD = await contracts.oracleHub.getTokensInUSD(
                DAI.address,
                diffBal
            );

            await snapshot.restore();

            const callBackValue = await isolationPool.borrowExactUSD.call(
                1,
                borrowAmountDebtRatioUSD,
                {
                    from: user
                }
            ).then(
                await isolationPool.borrowExactUSD(
                    1,
                    borrowAmountDebtRatioUSD,
                    {
                        from: user
                    }
                )
            );

            assert.equal(
                callBackValue.toString(),
                diffBal.toString()
            );

            const totalBorrowUser = await contracts.security.overallETHBorrow.call(
                1
            );

            const totalCollateralUser = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            const lendingData = await lendingContract.lendingPoolData(
                USDC.address
            );

            const collfactorNormal = lendingData.collateralFactor;

            const collfactorIsoPool = await isolationPool.collateralFactor();

            const rescaledCollat = Bi(totalCollateralUser)
                * Bi(collfactorIsoPool)
                / Bi(collfactorNormal);

            const debtRatio = Bi(totalBorrowUser)
                * Bi(toWei("1"))
                / Bi(rescaledCollat);

            assert.equal(
                debtRatio.toString(),
                targetDebt.toString()
            );
        });

        it("User can payback", async () => {

            const targetDebt = toWei("0.93");
            const paybackDebt = toWei("0.37");
            const depositAmount = pow6("4623");
            const depositAmount2 = toWei("1000000");

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

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
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

            const balBefore = await DAI.balanceOf(
                user
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                DAI.address
            );

            const callBackValue = await isolationPool.paybackExactDebtratio.call(
                1,
                paybackDebt,
                {
                    from: user
                }
            );

            await snapshot.restore();

            await isolationPool.paybackExactDebtratio(
                1,
                paybackDebt,
                {
                    from: user
                }
            );

            const baldAfter = await DAI.balanceOf(
                user
            );

            const diff = Bi(balBefore)
                - Bi(baldAfter);

            assert.equal(
                diff.toString(),
                callBackValue.toString()
            );

            const totalBorrowUser = await contracts.security.overallETHBorrow.call(
                1
            );

            const totalCollateralUser = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            const lendingData = await contracts.lending.lendingPoolData(
                USDC.address
            );

            const collfactorNormal = lendingData.collateralFactor;

            const collfactorIsoPool = await isolationPool.collateralFactor();

            const rescaledCollat = Bi(totalCollateralUser)
                * Bi(collfactorIsoPool)
                / Bi(collfactorNormal);

            const debtRatio = Bi(totalBorrowUser)
                * Bi(toWei("1"))
                / Bi(rescaledCollat);

            assert.equal(
                debtRatio.toString(),
                paybackDebt.toString()
            );
        });

        it("paybackExactUSD paybacks same amount as paybackExactDebtratio", async () => {

            const targetDebt = toWei("0.77");
            const paybackDebt = toWei("0.44");
            const depositAmount = pow6(7700);
            const depositAmount2 = toWei("1000000");

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

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
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

            const balBefore = await DAI.balanceOf(
                user
            );

            takeSnapshot();

            await isolationPool.paybackExactDebtratio(
                1,
                paybackDebt,
                {
                    from: user
                }
            );

            const baldAfter = await DAI.balanceOf(
                user
            );

            const paybackAmount = Bi(balBefore)
                - Bi(baldAfter);

            const paybackAmountUSD = await contracts.oracleHub.getTokensInUSD(
                DAI.address,
                paybackAmount
            );

            await snapshot.restore();

            await contracts.lending.syncManually(
                DAI.address
            );

            const callBackValue = await isolationPool.paybackExactUSD.call(
                1,
                paybackAmountUSD,
                {
                    from: user
                }
            );

            await snapshot.restore();

            await isolationPool.paybackExactUSD(
                1,
                paybackAmountUSD,
                {
                    from: user
                }
            );

            const baldAfter2 = await DAI.balanceOf(
                user
            );

            const paybackAmount2 = Bi(balBefore)
                - Bi(baldAfter2);

            assert.equal(
                paybackAmount.toString(),
                paybackAmount2.toString()
            );

            assert.equal(
                paybackAmount2.toString(),
                callBackValue.toString()
            );

            const totalBorrowUser = await contracts.security.overallETHBorrow.call(
                1
            );

            const totalCollateralUser = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            const lendingData = await contracts.lending.lendingPoolData(
                USDC.address
            );

            const collfactorNormal = lendingData.collateralFactor;

            const collfactorIsoPool = await isolationPool.collateralFactor();

            const rescaledCollat = Bi(totalCollateralUser)
                * Bi(collfactorIsoPool)
                / Bi(collfactorNormal);

            const debtRatio = Bi(totalBorrowUser)
                * Bi(toWei("1"))
                / Bi(rescaledCollat);

            assert.equal(
                debtRatio.toString(),
                paybackDebt.toString()
            );
        });

        it("paybackAll works as intended", async () => {

            const targetDebt = toWei("0.95");
            const depositAmount = pow6(9452);
            const depositAmount2 = toWei("1000000");

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

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
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

            await isolationPool.paybackAll(
                1,
                {
                    from: user
                }
            );

            const borrowAmount = await contracts.security.overallETHBorrow.call(
                1
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                DAI.address
            );

            assert.equal(
                borrowAmount.toString(),
                borrowShares.toString()
            );

            assert.equal(
                borrowShares.toString(),
                "0"
            );
        });

        it("User can withdraw (exactAmounts and exactShares)", async () => {

            const depositAmount = pow6(7430);
            const withdrawPercent = toWei("0.33");

            await contracts.nft.mintPosition(
                {
                    from: user
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
                {
                    from: user
                }
            )

            const userShare = await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            );

            assert.equal(
                userShare.toString(),
                depositAmount.toString()
            );

            const balBefore = await USDC.balanceOf(
                user
            );

            const withdrawShares = Bi(userShare)
                * Bi(withdrawPercent)
                / Bi(toWei("1"));

            takeSnapshot();

            const callBackValue = await isolationPool.withdrawExactShares.call(
                1,
                withdrawShares,
                {
                    from: user
                }
            ).then(
                await isolationPool.withdrawExactShares(
                    1,
                    withdrawShares,
                    {
                        from: user
                    }
                )
            );

            const baldAfter = await USDC.balanceOf(
                user
            );

            const withdrawAmountFromShares = Bi(baldAfter)
                - Bi(balBefore);

            assert.equal(
                withdrawAmountFromShares.toString(),
                callBackValue.toString()
            );

            const userShareAfter = await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            );

            const diffshares = Bi(userShare)
                - Bi(userShareAfter);

            assert.equal(
                diffshares.toString(),
                withdrawShares.toString()
            );

            await snapshot.restore();

            const callBackValue2 = await isolationPool.withdrawExactAmount.call(
                1,
                withdrawAmountFromShares,
                {
                    from: user
                }
            ).then(
                await isolationPool.withdrawExactAmount(
                    1,
                    withdrawAmountFromShares,
                    {
                        from: user
                    }
                )
            );

            const baldAfter2 = await USDC.balanceOf(
                user
            );

            const withdrawAmountFromAmount = Bi(baldAfter2)
                - Bi(balBefore);

            assert.equal(
                withdrawAmountFromAmount.toString(),
                callBackValue2.toString()
            );

            const userShareAfter2 = await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            );

            const diffshares2 = Bi(userShare)
                - Bi(userShareAfter2);

            assert.equal(
                diffshares2.toString(),
                withdrawShares.toString()
            );
        });

        it("Withdraw does not allow debtratio greater 100%",  async () => {

            const percent = toWei("0.75");
            const targetDebt = toWei("0.80");

            const depositAmount = pow6("3570");
            const depositAmount2 = toWei("85206");

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

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
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

            const lendingShares = await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            );

            const withdrawShares = Bi(lendingShares)
                * Bi(percent)
                / Bi(toWei("1"));

            const overallCollat = await isolationPool.getTotalWeightedCollateralUSD(
                1
            );

            const overallBorrow = await isolationPool.getTotalBorrowUSD(
                1
            );

            const collfactor = await isolationPool.collateralFactor();

            const forbiddenWithdrawUSD = Bi(toWei("1"))
                * (Bi(overallCollat) - Bi(overallBorrow))
                / Bi(collfactor);

            const forbiddenWithdrawAmount = await contracts.oracleHub.getTokensFromUSD(
                USDC.address,
                forbiddenWithdrawUSD
            );

            const maxSharePrice = false;

            const forbiddenWithdrawShares = await contracts.lending.calculateLendingShares(
                USDC.address,
                forbiddenWithdrawAmount,
                maxSharePrice
            );

            await expectRevert(
                isolationPool.withdrawExactShares(
                    1,
                    forbiddenWithdrawShares,
                    {
                        from: user
                    }
                ),
                "ResultsInBadDebt()"
            );

            await expectRevert(
                isolationPool.withdrawExactAmount(
                    1,
                    forbiddenWithdrawAmount,
                    {
                        from: user
                    }
                ),
                "ResultsInBadDebt()"
            );

            const littleLessShares = Bi(forbiddenWithdrawShares)
                - Bi(pow6(0.001));

            const littleLessAmount = Bi(forbiddenWithdrawAmount)
                - Bi(pow6(0.001));

            await takeSnapshot();

            isolationPool.withdrawExactAmount(
                1,
                littleLessAmount,
                {
                    from: user
                }
            );

            await restoreSnapshot();

            isolationPool.withdrawExactShares(
                1,
                littleLessShares,
                {
                    from: user
                }
            );
        });
    });
    // DEPRECATED ONBEHALF
    describe.skip("Basic Liquidation Tests", () => {

        beforeEach(async () => {

            const transferAmount = toWei("100000000");

            [
                contracts,
                isolationPool
            ] = await preparationSetup();

            await chainlinkUSDC.setValue(
                pow8(500)
            );

            await chainlinkDAI.setValue(
                pow8(500)
            );

            await DAI.transfer(
                alice,
                transferAmount,
                {
                    from: user
                }
            );
        });

        it("User can't get liquidated by normal liquidation", async () => {

            const targetDebt = toWei("0.93");
            const depositAmount = pow6("370");
            const depositAmount2 = toWei("1000");

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

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
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

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                DAI.address
            );

            const totalBorrow = await contracts.security.overallETHBorrow.call(
                1
            );

            const totalCollatWeighted = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            assert.isAbove(
                parseInt(totalBorrow),
                parseInt(totalCollatWeighted)
            );

            await expectRevert(
                contracts.liquidation.liquidatePartiallyFromTokens(
                    1,
                    2,
                    DAI.address,
                    USDC.address,
                    borrowShares,
                    {
                        from: alice
                    }
                ),
                'PositionLocked()'
            );
        });

        it("User can only liquidate when debtratio greater or equal 100%", async () => {

            const targetDebt = toWei("0.93");
            const LiquPercentUSD = toWei("0.2");

            const depositAmount = pow6(37);
            const depositAmount2 = toWei("100");

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

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
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

            const totalBorrow = await contracts.security.overallETHBorrow.call(
                1
            );

            const totalCollatWeighted = await contracts.security.overallETHCollateralsWeighted.call(
                1
            );

            assert.isAbove(
                parseInt(totalBorrow),
                parseInt(totalCollatWeighted)
            );

            const borrowUSD = await contracts.security.overallETHBorrow.call(
                1
            );

            const liquidationUSDAmount = Bi(borrowUSD)
                * Bi(LiquPercentUSD)
                / Bi(toWei("1"));

            await expectRevert(
                isolationPool.liquidationUSDAmount(
                    1,
                    2,
                    liquidationUSDAmount,
                    {
                        from: alice
                    }

                ),
                "WiseIsolation: TOO_LOW"
            );
        });

        it("liquidationUSDAmount works and liquidates right amounts", async () => {

            const targetDebt = toWei("0.99");
            const percent = toWei("0.90");

            const depositAmount = pow6(5785);
            const depositAmount2 = toWei("100000");
            const newDAIPrice = pow8(1.012);

            const nftContract = contracts.nft;
            const lendingContract = contracts.lending;

            await nftContract.mintPosition(
                {
                    from: user
                }
            );

            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC,
                    chainlinkDAI
                ]
            );

            await chainlinkDAI.setValue(
                pow8(1)
            );

            await chainlinkUSDC.setValue(
                pow8(1)
            );

            await isolationPool.registrationFarm(
                1,
                1,
                {
                    from: user
                }
            );

            await wrapDepositAmount(
                2,
                DAI.address,
                depositAmount2,
                alice
            );

            await isolationPool.depositExactAmount(
                1,
                depositAmount,
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

            await chainlinkDAI.setValue(
                newDAIPrice
            );

            const totalBorrowUSDBefore = await isolationPool.getTotalBorrowUSD(
                1
            );

            const liquidationUSDAmount = Bi(totalBorrowUSDBefore)
                * Bi(percent)
                / Bi(toWei("1"));

            const balDAIAliceBefore = await DAI.balanceOf(
                alice
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
                liquidationUSDAmount,
                {
                    from: alice
                }
            );

            const balUSDCAliceAfter = await USDC.balanceOf(
                alice
            );

            const balDAIAliceAfter = await DAI.balanceOf(
                alice
            );

            const daiDec = await DAI.decimals();
            const usdcDec = await USDC.decimals();

            const rescaledUSDCBalAlice = Bi(balUSDCAliceAfter)
                * Bi(10 ** (daiDec - usdcDec));

            const diffDAI = Bi(balDAIAliceBefore)
                - Bi(balDAIAliceAfter);

            const diffDAIUSD = Bi(diffDAI)
                * Bi(newDAIPrice)
                / Bi(pow8(1));

            assert.equal(
                diffDAIUSD.toString(),
                liquidationUSDAmount.toString()
            );

            assert.isAbove(
                parseInt(rescaledUSDCBalAlice),
                parseInt(diffDAIUSD)
            );
        });
    });
});
