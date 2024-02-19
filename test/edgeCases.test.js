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

const toWei = web3.utils.toWei;
const fromWei = web3.utils.fromWei;

contract("Edge Cases tests", async accounts  => {

    const [owner, alice, bob, random] = accounts;

    let tokens = new Array();
    let oracles = new Array();

    let contracts;

    let USDC;
    let WETH;

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
                borrowCap: toWei("0.9")
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
                tokens: [USDC, WETH],
                chainlinkInterfaces: [chainlinkUSDC, chainlinkWETH]
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
                }
            ]
        );

        return contracts
    }

    depositTokens = async (inputParam = {}) => {

        let balAfter;
        let token;

        for (index = 0; index < inputParam.depositTokens.length; index++) {

            token = await Token.at(inputParam.depositTokens[index]);

            await contracts.lending.depositExactAmount(
                inputParam.depositTokens[index],
                inputParam.depositAmount[index],
                {
                    from: inputParam.user[index]
                }
            );

            await contracts.lending.collateralizeDeposit(
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

    borrowToken = async (inputParam = {}) => {

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
                feeManager.address,
                HUGE_AMOUNT,
                {
                    from: inputParam.receiver[index]
                }
            );
        }
    }

    liquidate = async (inputParam = {}) => {

        const borrowShares = await contracts.lending.getPositionBorrowShares(
            inputParam.user,
            inputParam.paybackToken
        );

        const paybackShares = Bn(borrowShares)
            .mul(Bn(inputParam.percent))
            .div(Bn(toWei("1")));


        await contracts.liquidation.liquidatePartiallyFromTokens(
            inputParam.user,
            inputParam.paybackToken,
            inputParam.receiveToken,
            paybackShares,
            {
                from: inputParam.liquidator
            }
        );
    }

    describe("Liquidation edge case tests", () => {

        beforeEach(async () => {

            for (index = 0; index < 10; index++) {

                tokens[index] = await Token.new(
                    18,
                    alice
                );
            }

            for (index = 0; index < 10; index++) {

                oracles[index] = await Chainlink.new(
                    pow8(10),
                    8
                );
            }

            contracts = await setUpContracts(
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

            for (index = 0; index < 10; index++) {

                await contracts.oracleHub.addOracle(
                    tokens[index].address,
                    oracles[index].address,
                    []
                );
            }

            await setupHeartbeatForTests(
                {
                    tokens: tokens,
                    chainlinkInterfaces: oracles,
                    oracleHub: contracts.oracleHub
                }
            );

            for (index = 0; index < 10; index++) {

                await tokens[index].approve(
                    contracts.lending.address,
                    HUGE_AMOUNT,
                    {
                        from: alice
                    }
                );
            }
        });

        it.skip("Liquidation with 10 borrow and deposit tokens", async () => {

            const transferAmount = toWei("1000000");
            const depositAmount = toWei("125");
            const borrowAmount = toWei("80");

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

            const emptyStructToken = {
                curvePoolTokenIndexFrom: 0,
                curvePoolTokenIndexTo: 0,
                curveMetaPoolTokenIndexFrom: 0,
                curveMetaPoolTokenIndexTo: 0
            };

            const emptyStructData = {
                curvePool: ZERO_ADDRESS,
                curveMetaPool: ZERO_ADDRESS,
                swapBytesPool: [],
                swapBytesMeta: []
            }

                for (index = 0; index < 10; index++) {

                    await contracts.lending.createPool(
                        {
                            allowBorrow: true,
                            poolToken: tokens[index].address,
                            poolMulFactor: toWei("1"),
                            poolCollFactor: toWei("0.8"),
                            maxDepositAmount: HUGE_AMOUNT
                        }
                    );
                }

            await tokens[0].transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await tokens[1].transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await tokens[0].approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await tokens[1].approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                oracles
            );

            await contracts.lending.depositExactAmount(
                2,
                tokens[0].address,
                depositAmount,
                {
                    from: bob
                }
            );

            for (index = 1; index < 10; index++) {

                await contracts.lending.depositExactAmount(
                    1,
                    tokens[index].address,
                    depositAmount,
                    {
                        from: alice
                    }

                );

                await contracts.lending.collateralizeDeposit(
                    1,
                    tokens[index].address,
                    {
                        from: alice
                    }
                );
            }

            for (index = 0; index < 10; index++) {

                await contracts.lending.borrowExactAmount(
                    1,
                    tokens[index].address,
                    borrowAmount,
                    {
                        from: alice
                    }

                );
            }

            await oracles[0].setValue(
                pow8(25)
            )

            await contracts.lending.syncManually(
                tokens[0].address
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                tokens[1].address
            );

            const halfShares = Bn(borrowShares)
                .mul(Bn(toWei("0.5")))
                .div(Bn(toWei("1")));

            await contracts.liquidation.liquidatePartiallyFromTokens(
                1,
                2,
                tokens[1].address,
                tokens[2].address,
                halfShares,
                {
                    from: bob
                }
            );
        });
    });

    describe("Miscellaneous tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

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
                    tokens: [USDT],
                    chainlinkInterfaces: [chainlinkUSDT]
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
                        maxDeposit: HUGE_AMOUNT,
                        borrowCap: toWei("0.9")
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
        });

        it("Test maximumWithdrawToken", async () => {

            const depositAmount = pow6(100);
            const depositAmountWETH = toWei("100");
            const borrowAmount = toWei("1");
            const transferAmount = toWei("1000");

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositAmountWETH,
                {
                    from: bob
                }
            );

            await contracts.lending.borrowExactAmount(
                nftAlice,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                1 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            const amount = await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                0,
                0
            );

            const increasedAmount = Bi(amount)
                * Bi(toWei("1.001"))
                / Bi(toWei("1"));

            await expectRevert(
                contracts.lending.withdrawExactAmount(
                    nftAlice,
                    USDC.address,
                    increasedAmount,
                    {
                        from: alice
                    }
                ),
                "ResultsInBadDebt()"
            );

            contracts.lending.withdrawExactAmount(
                nftAlice,
                USDC.address,
                amount,
                {
                    from: alice
                }
            );
        });

        it("maximumWithdrawToken returns deposit amount after direct querry", async () => {

            const depositAmount = pow6(54698);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            const amount = Bi(await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                0,
                0
            )) + Bi(1);

            assert.equal(
                amount.toString(),
                depositAmount.toString()
            );
        });

        it("maximumWithdrawToken works correct for more than one collat token", async () => {

            const depositAmount = pow6(54698);
            const depositAmountWETH = toWei("2487");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            const amountUSDC = Bi(await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                0,
                0
            )) + Bi(1);

            const amountWETH = Bi(await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                0
            )) + Bi(1);

            assert.equal(
                amountUSDC.toString(),
                depositAmount.toString()
            );

            assert.equal(
                amountWETH.toString(),
                depositAmountWETH.toString()
            );
        });

        it.skip("maximumBorrowToken works correct", async () => {

            const depositAmount = pow6(35784);
            const depositAmountWETH = toWei("9846");
            const borrowAmount = toWei("564");

            const poolData = await contracts.lending.lendingPoolData(
                USDC.address
            );

            const collfactorUSDC = poolData.collateralFactor;

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositAmountWETH,
                {
                    from: bob
                }
            );

            const maxBorrowCalc = Bi(depositAmount)
                * Bi(collfactorUSDC)
                * Bi(toWei("0.95"))
                / Bi(toWei("1"))
                / Bi(toWei("1"));

            const convertedUSD = await contracts.oracleHub.getTokensInUSD(
                USDC.address,
                maxBorrowCalc
            );

            const maxBorrowCalcWETH = await contracts.oracleHub.getTokensFromUSD(
                WETH.address,
                convertedUSD
            )

            const amountUSDC = Bi(await contracts.security.maximumBorrowToken(
                1,
                USDC.address,
                0
            ))+ Bi(1);

            assert.equal(
                amountUSDC.toString(),
                maxBorrowCalc.toString()
            );

            const amountWETH = await contracts.security.maximumBorrowToken(
                1,
                WETH.address,
                0
            );

/*            assert.equal(
                amountWETH.toString(),
                maxBorrowCalcWETH.toString()
            ); */

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            const borrowUSD = await contracts.oracleHub.getTokensInUSD(
                WETH.address,
                borrowAmount
            );

            const borrowInUSDCToken = await contracts.oracleHub.getTokensFromUSD(
                USDC.address,
                borrowUSD
            );

            const amountUSDC2 = Bi(await contracts.security.maximumBorrowToken(
                1,
                USDC.address,
                0
            )) +Bi(1);

            const diffUSDC = Bi(amountUSDC)
                - Bi(borrowInUSDCToken);

            assert.equal(
                diffUSDC.toString(),
                amountUSDC2.toString()
            );

            const diffWETH = Bi(amountWETH)
                - Bi(borrowAmount);

            const amountWETH2 = await contracts.security.maximumBorrowToken(
                1,
                WETH.address,
                0
            );

            assert.equal(
                diffWETH.toString(),
                amountWETH2.toString()
            );
        });

        it.skip("Extended maximumWithdraw function test", async () => {

            const depositAmount = pow6(100);
            const depositAmount2 = pow6(10000);
            const depositAmountWETH = toWei("10");
            const borrowAmount = toWei("1");
            const borrowAmount2 = pow6(1000);

            const interval = 3 * 60 * 60;

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositAmount2,
                {
                    from: alice
                }
            );

            await contracts.lending.solelyDeposit(
                nftAlice,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                nftAlice,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await takeSnapshot();

            await time.increase(
                interval
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            const maxWithdraw = await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                0,
                0
            );

            assert.equal(
                maxWithdraw.toString(),
                depositAmount.toString()
            );

            await contracts.lending.withdrawExactAmount(
                nftAlice,
                USDC.address,
                maxWithdraw,
                {
                    from: alice
                }
            );

            await restoreSnapshot();

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            const maxWithdrawWETH = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                0
            );

            assert.equal(
                maxWithdrawWETH.toString(),
                "0"
            );

            await restoreSnapshot();

            await contracts.lending.solelyWithdraw(
                nftAlice,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                USDC.address,
                borrowAmount2,
                {
                    from: bob
                }
            );

            await contracts.lending.syncManually(
                USDC.address
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            const maxWithdrawUSDC2 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                2 * 60 * 60,
                0
            );

            await time.increase(
                interval
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            console.log("maxWithdrawUSDC2",maxWithdrawUSDC2.toString());

            await contracts.lending.withdrawExactAmount(
                nftAlice,
                USDC.address,
                maxWithdrawUSDC2,
                {
                    from: alice
                }
            );
        });

        it.skip("Extended maximumBorrow function test", async () => {

            const depositAmount = pow6(1000);
            const depositAmount2 = pow6(100000);
            const depositAmountWETH = toWei("10000");
            const borrowAmount = toWei("10");
            const borrowAmount2 = pow6(10000);

            const interval = 4 * 60 * 60;

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositAmount2,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                nftAlice,
                USDC.address,
                borrowAmount2,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            await time.increase(
                interval
            )

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            const maxBorrow = await contracts.security.maximumBorrowToken(
                nftAlice,
                WETH.address,
                60*60*1
            );

            await contracts.lending.borrowExactAmount(
                nftAlice,
                WETH.address,
                maxBorrow,
                {
                    from: alice
                }
            );
        });

        it.skip("overall borrow and lending apy test", async () => {

            const depositAmount = pow6(1000);
            const depositAmount2 = pow6(100000);
            const depositAmountWETH = toWei("1000");
            const depositAmountWETH2 = toWei("100000")
            const borrowAmount = toWei("1000");
            const borrowAmount2 = pow6(1000);

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositAmountWETH2,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositAmount2,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            const overallLendingAPY = await contracts.security.overallLendingAPY(
                nftAlice
            );

            assert.equal(
                overallLendingAPY.toString(),
                "0"
            );

            const overallBorrowAPY = await contracts.security.overallBorrowAPY(
                nftBob
            );

            assert.equal(
                overallBorrowAPY.toString(),
                "0"
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                USDC.address,
                borrowAmount2,
                {
                    from: bob
                }
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            const overallLendingAPY2 = await contracts.security.overallLendingAPY(
                nftAlice
            );

            const overallBorrowAPY2 = await contracts.security.overallBorrowAPY(
                nftBob
            );

            const lendingRateUSDC = await contracts.security.getLendingRate(
                USDC.address
            );

            const lendingRateWETH = await contracts.security.getLendingRate(
                WETH.address
            );

            const borrowRateUSDC = await contracts.security.getBorrowRate(
                USDC.address
            );

            const borrowRateWETH = await contracts.security.getBorrowRate(
                WETH.address
            );

            const apyDataAlice = await contracts.security.overallNetAPY(
                nftAlice
            );

            const apyDataBob = await contracts.security.overallNetAPY(
                nftBob
            );

            const netApyBob = apyDataBob[0];
            const netApyAlice = apyDataAlice[0];

            const isNegativBob = apyDataBob[1];
            const isNegativAlice = apyDataAlice[1];


            /*
            debug("lendingRateUSDC",lendingRateUSDC);
            debug("lendingRateWETH",lendingRateWETH);

            debug("borrowRateUSDC",borrowRateUSDC);
            debug("borrowRateWETH",borrowRateWETH);

            debug("overallLendingAPY2",overallLendingAPY2);
            debug("overallBorrowAPY2",overallBorrowAPY2);

            debug("netApyAlice",netApyAlice);
            debug("netApyBob",netApyBob);

            debug("isNegativBob",isNegativBob);
            debug("isNegativAlice",isNegativAlice);
            */
        });

        it.skip("overallNetAPY value test", async () => {

            const depositAmount = pow6(1000);
            const depositAmount2 = pow6(100000);
            const depositAmountWETH = toWei("1000");
            const depositAmountWETH2 = toWei("100000")
            const borrowAmount = toWei("1000");
            const borrowAmount2 = pow6(1000);

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositAmountWETH2,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositAmount2,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                USDC.address,
                borrowAmount2,
                {
                    from: bob
                }
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            const netAPYAliceData = await contracts.security.overallNetAPY(
                nftAlice
            );

            const netAPYAlice = netAPYAliceData[0];

            debug("netAPYAlice",netAPYAlice);
            console.log("---------------------")

            const netAPYBobData = await contracts.security.overallNetAPY(
                nftBob
            );

            const netAPYBob = netAPYBobData[0];

            debug("netAPYBob", netAPYBob);
            debug("is negative", netAPYBobData[1]);
        });

        it.skip("One wei bug", async () => {

            const depositAmountUSDC = pow6(2130);
            const depositAmountWETH = toWei("200");

            const depositAmountUSDC2 = pow6(10000);
            const depositAmountWETH2 = toWei("100");

            const borrowAmount = pow6(1230);

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await USDC.approve(
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
                    from: bob
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositAmountUSDC,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositAmountWETH,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                USDC.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            await time.increase(
                5 * 60 * 60
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmountUSDC2,
                {
                    from: alice
                }
            );

            await time.increase(
                60
            );

            await contracts.lending.syncManually(
                USDC.address
            );

            const maxWithdrawAmount= await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                0,
                0
            );

            debug("maxWithdraw", maxWithdrawAmount);

            await contracts.lending.withdrawExactAmount(
                nftAlice,
                USDC.address,
                maxWithdrawAmount,
                {
                    from: alice
                }
            );

            const maxWithdrawAmount2 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                0,
                0
            );

            debug("maxWithdraw2", maxWithdrawAmount2);


            await contracts.lending.withdrawExactAmount(
                nftAlice,
                USDC.address,
                maxWithdrawAmount2,
                {
                    from: alice
                }
            );

            const maxWithdrawAmount3 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                USDC.address,
                0,
                0
            );

            const totPseudo = await contracts.lending.getPseudoTotalPool(
                USDC.address
            );

            const totShares = await contracts.lending.getTotalDepositShares(
                USDC.address
            );

            debug("totPseudo",totPseudo);
            debug("totShares",totShares);

            debug("maxWithdraw3", maxWithdrawAmount3);

            await contracts.lending.withdrawExactAmount(
                nftAlice,
                USDC.address,
                maxWithdrawAmount3,
                {
                    from: alice
                }
            );
        });

        it.skip("Check contract sizes", async () => {

            const mainLending = await contracts.lending.getContractSize();
            const oracle = await contracts.oracleHub.getContractSize();
            const liqui = await contracts.liquidation.getContractSize();
            const fee = await contracts.feeManager.getContractSize();
            const security = await contracts.security.getContractSize();
            const iso = await isolationPool.getContractSize();

            debug("mainLending", mainLending);
            debug("oracle", oracle);
            debug("liqui", liqui);
            debug("fee", fee);
            debug("security", security);
            debug("iso", iso);
        });
    });

    describe("WithdrawBoth tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

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
                    tokens: [USDT],
                    chainlinkInterfaces: [chainlinkUSDT]
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
                        maxDeposit: HUGE_AMOUNT,
                        borrowCap: toWei("0.9")
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
        });

        it.skip("maximumWithdrawTokenSolely gives right amount (single withdraw)", async () => {

            const depositAmountUSDC = pow6(100000);
            const depositAmount = toWei("10000");
            const depositAmountSolely = toWei("5000");

            const borrowAmount = pow6(2000)

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.solelyDeposit(
                nftAlice,
                WETH.address,
                depositAmountSolely,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositAmountUSDC,
                {
                    from: alice
                }
            );

            const maxWithdrawStart = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                0
            );

            assert.equal(
                maxWithdrawStart.toString(),
                depositAmountSolely.toString()
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                WETH.address,
                depositAmount,
                {
                    from: bob
                }
            );

            const maxWithdrawSecond = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                0
            );

            assert.equal(
                maxWithdrawSecond.toString(),
                depositAmountSolely.toString()
            );

            await contracts.lending.borrowExactAmount(
                nftAlice,
                USDC.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            const maxWithdrawThird = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                60*60,
                0
            );

            assert.isAbove(
                parseInt(depositAmountSolely),
                parseInt(maxWithdrawThird)
            );

            await expectRevert(
                contracts.lending.solelyWithdraw(
                    nftAlice,
                    WETH.address,
                    depositAmountSolely,
                    {
                        from: alice
                    }
                ),
                "ResultsInBadDebt()"
            );

            await contracts.lending.solelyWithdraw(
                nftAlice,
                WETH.address,
                maxWithdrawThird,
                {
                    from: alice
                }
            );
        });

        it.skip("maximumWithdrawTokenSolely gives right amount (normale and solely withdraw)", async () => {

            const depositSolely = toWei("1000");
            const depositPool = toWei("750");
            const depositUSDC = pow6("100000");
            const borrowAmount = toWei("100");

            const borrowUSDC = pow6("7425");

            const compareValue = toWei("186.8421");

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.solelyDeposit(
                nftAlice,
                WETH.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositPool,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositUSDC,
                {
                    from: alice
                }
            );

            const maxWithdrawSoley = Bi(await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                0
            ));

            const maxWithdrawPool = Bi(await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                0
            ))+Bi(1);

            assert.equal(
                maxWithdrawSoley.toString(),
                depositSolely.toString()
            );

            assert.equal(
                maxWithdrawPool.toString(),
                depositPool.toString()
            );

            const maxWithdrawSoley2 = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                depositPool
            );

            const maxWithdrawPool2 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                depositSolely
            );
/*
            assert.equal(
                maxWithdrawSoley2.toString(),
                depositSolely.toString()
            );*/

            assert.equal(
                maxWithdrawPool2.toString(),
                "0"
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            const portionSoley = Bi(depositSolely)
                * Bi(toWei("0.1"))
                / Bi(toWei("1"));

            const maxWithdrawPool3 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                portionSoley
            );

            const diff = Bi(depositPool)
                - Bi(borrowAmount)
                - Bi(maxWithdrawPool3);

            const diffBool = await inBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            await contracts.lending.borrowExactAmount(
                nftAlice,
                USDC.address,
                borrowUSDC,
                {
                    from: alice
                }
            );

            const maxWithdrawPool4 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                0
            );

            const maxWithdrawSoley4 = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                0
            );

            const diffSolely = Bi(compareValue)
                - Bi(maxWithdrawSoley4);

            const diffPool = Bi(compareValue)
                - Bi(maxWithdrawPool4);

            const diffSolelyBool = await inBoundVar(
                abs(diffSolely),
                WETH,
                0.0001
            );

            const diffPoolBool = await inBoundVar(
                abs(diffPool),
                WETH,
                0.0001
            );

            assert.equal(
                diffSolelyBool.toString(),
                "true"
            );

            assert.equal(
                diffPoolBool.toString(),
                "true"
            );

            await time.increase(
                60*60
            );

            const maxWithdrawPool5 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                compareValue
            );

            const maxWithdrawSoley5 = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                compareValue
            );

            assert.equal(
                maxWithdrawPool5.toString(),
                "0"
            );

            assert.equal(
                maxWithdrawSoley5.toString(),
                "0"
            );
        })

        it.skip("user gets right amount of token with withdrawBothExactAmount", async () => {

            const depositSolely = toWei("2467");
            const depositPool = toWei("6741");

            const withdrawSolely = toWei("1500");
            const withdrawPool = toWei("2000");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.solelyDeposit(
                nftAlice,
                WETH.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositPool,
                {
                    from: alice
                }
            );

            const balBefore = await WETH.balanceOf(
                alice
            );

            await contracts.lending.withdrawBothExactAmount(
                nftAlice,
                WETH.address,
                withdrawPool,
                withdrawSolely,
                {
                    from: alice
                }
            );

            const balAfter = await WETH.balanceOf(
                alice
            );

            const diff = Bi(balAfter)
                - Bi(balBefore);

            const sumWithdraw = Bi(withdrawPool)
                + Bi(withdrawSolely);

            assert.equal(
                diff.toString(),
                sumWithdraw.toString()
            );
        })

        it.skip("user can not withdraw more from one deposit type than deposited (pool or solely)", async () => {

            const depositSolely = toWei("1337");
            const depositPool = toWei("5790");

            const withdrawSolely = toWei("2000");
            const withdrawPool = toWei("6000");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.solelyDeposit(
                nftAlice,
                WETH.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositPool,
                {
                    from: alice
                }
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawBothExactAmount(
                    nftAlice,
                    WETH.address,
                    withdrawPool,
                    0,
                    {
                        from: alice
                    }
                ),
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawBothExactAmount(
                    nftAlice,
                    WETH.address,
                    withdrawPool,
                    0,
                    {
                        from: alice
                    }
                ),
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawBothExactAmount(
                    nftAlice,
                    WETH.address,
                    0,
                    withdrawSolely,
                    {
                        from: alice
                    }
                ),
            );

            await expectRevert.unspecified(
                contracts.lending.withdrawBothExactAmount(
                    nftAlice,
                    WETH.address,
                    withdrawPool,
                    withdrawSolely,
                    {
                        from: alice
                    }
                ),
            );

            contracts.lending.withdrawBothExactAmount(
                nftAlice,
                WETH.address,
                withdrawSolely,
                withdrawPool,
                {
                    from: alice
                }
            )


        })

        it.skip("user can not withdraw more than 100% debtratio with withdrawBoth", async () => {

            const depositSolely = pow6(20000);
            const depositPool = pow6(10000);

            const depositETH = toWei("100000");

            const withdrawSolely = pow6(4550);
            const withdrawPool = pow6(4550);

            const borrowAmount = toWei("1600");

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.solelyDeposit(
                nftAlice,
                USDC.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                USDC.address,
                depositPool,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                WETH.address,
                depositETH,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                nftAlice,
                WETH.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                60 * 60
            );

            await expectRevert(
                contracts.lending.withdrawBothExactAmount(
                    nftAlice,
                    USDC.address,
                    withdrawPool,
                    withdrawSolely,
                    {
                        from: alice
                    }
                ),
                "ResultsInBadDebt()"
            );

            const littleLessSolely = Bi(withdrawSolely)
                - Bi(pow6(30));

            const littleLessPool = Bi(withdrawPool)
                - Bi(pow6(30));

            await takeSnapshot();

            contracts.lending.withdrawBothExactAmount(
                nftAlice,
                USDC.address,
                withdrawPool,
                littleLessSolely,
                {
                    from: alice
                }
            );

            await restoreSnapshot();

            contracts.lending.withdrawBothExactAmount(
                nftAlice,
                USDC.address,
                littleLessPool,
                withdrawSolely,
                {
                    from: alice
                }
            );
        })

        it.skip("Both maximumWithdraw functions deal with non collateralized token correctly", async () => {

            const depositSolely = toWei("1500");
            const depositPool = toWei("500");
            const depositUSDC = pow6("100000");

            const borrowAmount = toWei("100");

            const borrowUSDC = pow6("7425");

            const compareValue = toWei("100");

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

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.lending.solelyDeposit(
                nftAlice,
                WETH.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftAlice,
                WETH.address,
                depositPool,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                nftBob,
                USDC.address,
                depositUSDC,
                {
                    from: alice
                }
            );

            const maxWithdrawSoleyOnly = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                0
            );

            const maxWithdrawPoolOnly = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                0
            );

            const maxWithdrawSoleyBoth = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                compareValue
            );

            const maxWithdrawPoolBoth = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                compareValue
            );

            assert.equal(
                maxWithdrawPoolBoth.toString(),
                maxWithdrawPoolOnly.toString()
            );

            assert.equal(
                maxWithdrawSoleyOnly.toString(),
                maxWithdrawSoleyBoth.toString()
            );

            await contracts.lending.borrowExactAmount(
                nftBob,
                WETH.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            const maxWithdrawSoley3 = await contracts.security.maximumWithdrawTokenSolely(
                nftAlice,
                WETH.address,
                0,
                compareValue
            );

            const maxWithdrawPool3 = await contracts.security.maximumWithdrawToken(
                nftAlice,
                WETH.address,
                0,
                compareValue
            );

            const poolAmount = await contracts.lending.getTotalPool(
                WETH.address
            );

            assert.equal(
                maxWithdrawPool3.toString(),
                poolAmount.toString()
            );

            assert.equal(
                maxWithdrawSoley3.toString(),
                maxWithdrawSoleyBoth.toString()
            );
        });
    });
})
