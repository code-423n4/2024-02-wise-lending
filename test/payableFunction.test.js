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
const { time, expectRevert } = require('@openzeppelin/test-helpers');
const { Bi } = require("./utils");

require("./utils");
require("./constants");
require("./test-scenarios");

contract("Payable function tests", async accounts => {

    const [owner, alice, bob, chad] = accounts;

    let contracts;

    let WETH;
    let USDC;
    let chainlinkUSDC;

    const WETHChain = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const WETHFeed = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419";

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
                borrowCap: toWei("0.85")
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

    describe("Payable function tests", () => {

        beforeEach(async () => {

            contracts = await preparationSetup();

            WETH = await Token.at(
                WETHChain
            );

            await contracts.oracleHub.addOracle(
                WETH.address,
                WETHFeed,
                []
            );

            /*
            await contracts.oracleHub.recalibrate(
                WETH.address
            );
            */

            // set fake heartbeat since local fork doesn't get updated
            await contracts.oracleHub.setHeartBeat(
                WETH.address,
                HUGE_AMOUNT
            );

            await addPools(
                contracts.lending,
                [
                    {
                        allowBorrow: true,
                        poolToken: WETH,
                        mulFactor: toWei("0.1"),
                        collFactor: toWei("0.85"),
                        maxDeposit: HUGE_AMOUNT,
                        borrowCap: toWei("1")
                    }
                ]
            );

        });

        it("depositExactAmountETH works as intended", async () => {

            const depositValue = toWei("1.3");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.depositExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: depositValue
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const shares = Bi(await contracts.lending.getPositionLendingShares(
                aliceNft,
                WETH.address
            ))+Bi(1);

            const diff = Bi(balBefore)
                - Bi(balAfter)
                - Bi(depositValue);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            assert.equal(
                shares.toString(),
                depositValue.toString()
            );
        });

        it("depositExactAmountETHMint works as intended", async () => {

            const depositAmount = toWei("1.4");

            await contracts.lending.depositExactAmountETHMint(
                {
                    from: alice,
                    value: depositAmount
                }
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const totalSupply = await contracts.nft.totalSupply();

            const ownerNFT = await contracts.nft.ownerOf(
                totalSupply - 1
            );

            assert.equal(
                ownerNFT,
                alice
            );

            const shares = Bi(await contracts.lending.getPositionLendingShares(
                aliceNft,
                WETH.address
            ))+Bi(1);

            assert.equal(
                shares.toString(),
                depositAmount.toString()
            );
        });

        it("withdrawExactAmountETH works as intended", async () => {

            const depositValue = toWei("5.4");
            const withdrawValue = toWei("1.6");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: depositValue
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.withdrawExactAmountETH(
                aliceNft,
                withdrawValue,
                {
                    from: alice
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const shares = Bi(await contracts.lending.getPositionLendingShares(
                aliceNft,
                WETH.address
            ))+Bi(1);

            const calcShares = Bi(depositValue)
                - Bi(withdrawValue);

            assert.equal(
                shares.toString(),
                calcShares.toString()
            );

            const diff = Bi(balAfter)
                - Bi(balBefore)
                - Bi(withdrawValue);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it("withdrawExactSharesETH works as intended", async () => {

            const depositValue = toWei("1.589");
            const withdrawValueShares = toWei("0.167");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: depositValue
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.withdrawExactSharesETH(
                aliceNft,
                withdrawValueShares,
                {
                    from: alice
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const shares = Bi(await contracts.lending.getPositionLendingShares(
                aliceNft,
                WETH.address
            ))+Bi(1);

            const calcShares = Bi(depositValue)
                - Bi(withdrawValueShares);

            assert.equal(
                shares.toString(),
                calcShares.toString()
            );

            const diff = Bi(balAfter)
                - Bi(balBefore)
                - Bi(withdrawValueShares);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it("withdrawExactSharesETH works as intended", async () => {

            const depositValue = toWei("1.337");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: depositValue
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            const maxShares = await contracts.lending.getPositionLendingShares(
                aliceNft,
                WETH.address
            );

            await contracts.lending.withdrawExactSharesETH(
                aliceNft,
                maxShares,
                {
                    from: alice
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const shares = await contracts.lending.getPositionLendingShares(
                aliceNft,
                WETH.address
            );

            assert.equal(
                shares.toString(),
                "0"
            );

            const balContract = await WETH.balanceOf(
                contracts.lending.address
            );

            assert.equal(
                balContract.toString(),
                "2"
            );

            const diff = Bi(balAfter)
                - Bi(balBefore)
                - Bi(maxShares);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it("borrowExactAmountETH works as intended", async () => {

            const depositAmount = toWei("1.254");
            const borrowAmount = toWei("0.654");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: depositAmount
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.collateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            const balContBefore = await WETH.balanceOf(
                contracts.lending.address
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.borrowExactAmountETH(
                aliceNft,
                borrowAmount,
                {
                    from: alice
                }
            );

            const balContAfter = await WETH.balanceOf(
                contracts.lending.address
            );

            const diffCont = Bi(balContBefore)
                - Bi(balContAfter);

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const borrowShares = Bi(await contracts.lending.getPositionBorrowShares(
                aliceNft,
                WETH.address
            ))-Bi(1);

            assert.equal(
                borrowShares.toString(),
                borrowAmount.toString()
            );

            assert.equal(
                abs(diffCont).toString(),
                borrowAmount.toString()
            );

            const diff = Bi(balAfter)
                - Bi(balBefore)
                - Bi(borrowAmount);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it("paybackExactAmountETH works as intended", async () => {

            const depositAmount = toWei("4");
            const borrowAmount = toWei("0.165");
            const paybackAmount = toWei("0.097")

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: depositAmount
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.collateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmountETH(
                aliceNft,
                borrowAmount,
                {
                    from: alice
                }
            );

            const balContBefore = await WETH.balanceOf(
                contracts.lending.address
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.paybackExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: paybackAmount
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const balContAfter = await WETH.balanceOf(
                contracts.lending.address
            );

            const diffCont = Bi(balContBefore)
                - Bi(balContAfter);

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                aliceNft,
                WETH.address
            );

            const diffShares = Bi(borrowAmount)
                - Bi(borrowShares);

            const diffShareAndAmount = Bi(diffShares)
                - Bi(paybackAmount);

            const diffShareAndAmountBool = await inBound(
                abs(diffShareAndAmount),
                WETH
            );

            assert.equal(
                diffShareAndAmountBool.toString(),
                "true"
            );

            assert.equal(
                abs(diffCont).toString(),
                paybackAmount.toString()
            );

            const diff = Bi(balBefore)
                - Bi(balAfter)
                - Bi(paybackAmount)

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it("paybackExactAmountETH sends back rest eth", async () => {

            const depositAmount = toWei("2");
            const borrowAmount = toWei("0.2");
            const paybackAmount = toWei("1")

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: depositAmount
                }
            );

            await contracts.lending.unCollateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.collateralizeDeposit(
                aliceNft,
                WETH.address,
                {
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmountETH(
                aliceNft,
                borrowAmount,
                {
                    from: alice
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.paybackExactAmountETH(
                aliceNft,
                {
                    from: alice,
                    value: paybackAmount
                }
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                aliceNft,
                WETH.address
            );

            assert.equal(
                borrowShares.toString(),
                "0"
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const bareDiff = Bi(balBefore)
                - Bi(balAfter);

            const diff = Bi(bareDiff)
                - Bi(borrowAmount);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.isAbove(
                parseInt(paybackAmount),
                parseInt(bareDiff)
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it("test getExpectedPaybackAmount (in context payable payback)", async () => {

            const depositAmount1 = toWei("10");
            const depositUSDC = pow6(10000);
            const borrowETH = toWei("2");

            const interval = 7 * 60 * 60;

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
                depositUSDC,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmountETH(
                nftBob,
                {
                    from: bob,
                    value: depositAmount1
                }
            );

            await contracts.lending.borrowExactAmountETH(
                nftAlice,
                borrowETH,
                {
                    from: alice
                }
            );

            await time.increase(
                interval
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            const paybackExtrapoliert = await contracts.security.getExpectedPaybackAmount(
                nftAlice,
                WETH.address,
                60*60*2
            );

            const balContractBefore = await WETH.balanceOf(
                contracts.lending.address
            );

            await contracts.lending.paybackExactAmountETH(
                nftAlice,
                {
                    from: alice,
                    value: paybackExtrapoliert
                }
            );

            const balContractAfter = await WETH.balanceOf(
                contracts.lending.address
            );

            const diff = Bi(balContractAfter)
                - Bi(balContractBefore);

            assert.isAbove(
                parseInt(paybackExtrapoliert),
                parseInt(diff)
            );

            const borrowSharesEnd = await contracts.lending.getPositionBorrowShares(
                nftAlice,
                WETH.address
            );

            assert.equal(
                borrowSharesEnd.toString(),
                "0"
            );
        });

        it("solelyDepositETH works as intended", async () => {

            const depositValue = toWei("2.7");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.solelyDepositETH(
                aliceNft,
                {
                    from: alice,
                    value: depositValue
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const soleyAmount = await contracts.lending.getPureCollateralAmount(
                aliceNft,
                WETH.address
            );

            const diff = Bi(balBefore)
                - Bi(balAfter)
                - Bi(depositValue);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            assert.equal(
                soleyAmount.toString(),
                depositValue.toString()
            );
        });

        it("solelyWithdrawETH works as intended", async () => {

            const depositValue = toWei("3.1");
            const withdrawValue = toWei("1.3");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNft = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.solelyDepositETH(
                aliceNft,
                {
                    from: alice,
                    value: depositValue
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.solelyWithdrawETH(
                aliceNft,
                withdrawValue,
                {
                    from: alice
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const soleyAmount = await contracts.lending.getPureCollateralAmount(
                aliceNft,
                WETH.address
            );

            const calcSolely = Bi(depositValue)
                - Bi(withdrawValue);

            assert.equal(
                soleyAmount.toString(),
                calcSolely.toString()
            );

            const diff = Bi(balAfter)
                - Bi(balBefore)
                - Bi(withdrawValue);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );
        });

        it.skip("user gets right amount of token with withdrawBothExactAmountETH", async () => {

            const depositSolely = toWei("10");
            const depositPool = toWei("3.8");

            const withdrawSolely = toWei("8");
            const withdrawPool = toWei("3.2");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );


            await contracts.lending.solelyDepositETH(
                nftAlice,
                {
                    from: alice,
                    value: depositSolely
                }
            );

            await contracts.lending.depositExactAmountETH(
                nftAlice,
                {
                    from: alice,
                    value: depositPool
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await contracts.lending.withdrawBothExactAmountETH(
                nftAlice,
                withdrawPool,
                withdrawSolely,
                {
                    from: alice
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const diffAlice = Bi(balAfter)
                - Bi(balBefore);

            const sumWithdraw = Bi(withdrawPool)
                + Bi(withdrawSolely);

            const diff = Bi(diffAlice)
                - Bi(sumWithdraw);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            const shares = await contracts.lending.getPositionLendingShares(
                nftAlice,
                WETH.address
            );

            await contracts.lending.withdrawExactSharesETH(
                nftAlice,
                shares,
                {
                    from: alice
                }
            );

            const soleyAmount = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                WETH.address
            );

            await contracts.lending.solelyWithdrawETH(
                nftAlice,
                soleyAmount,
                {
                    from: alice
                }
            );
        });

        it.skip("user gets right amount of token with withdrawBothExactSharesETH", async () => {

            const depositSolely = toWei("13");
            const depositPool = toWei("37");

            const withdrawSolely = toWei("5");
            const withdrawPool = toWei("27");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.lending.depositExactAmountETH(
                nftAlice,
                {
                    from: alice,
                    value: depositPool
                }
            );

            await contracts.lending.solelyDepositETH(
                nftAlice,
                {
                    from: alice,
                    value: depositSolely
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            const sharesBefore = await contracts.lending.getPositionLendingShares(
                nftAlice,
                WETH.address
            );

            await contracts.lending.withdrawBothExactSharesETH(
                nftAlice,
                withdrawPool,
                withdrawSolely,
                {
                    from: alice
                }
            );

            const balAfter = await web3.eth.getBalance(
                alice
            );

            const diffAlice = Bi(balAfter)
                - Bi(balBefore);

            const sumWithdraw = Bi(withdrawPool)
                + Bi(withdrawSolely);

            const diff = Bi(diffAlice)
                - Bi(sumWithdraw);

            const diffBool = await inGasBound(
                abs(diff),
                WETH
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            const sharesAfter = await contracts.lending.getPositionLendingShares(
                nftAlice,
                WETH.address
            );

            const diffShares = Bi(sharesBefore)
                - Bi(sharesAfter);

            assert.equal(
                diffShares.toString(),
                withdrawPool.toString()
            );

            await contracts.lending.withdrawExactShares(
                nftAlice,
                WETH.address,
                sharesAfter,
                {
                    from: alice
                }
            );

            const soleyAmount = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                WETH.address
            );

            await contracts.lending.solelyWithdraw(
                nftAlice,
                WETH.address,
                soleyAmount,
                {
                    from: alice
                }
            );
        });

        it.skip("user can not withdraw more than 100% debtratio with withdrawBothExactSharesETH", async () => {

            const depositSolely = toWei("11");
            const depositPool = toWei("5.5");

            const depositWETH = toWei("50");

            const withdrawSolely = toWei("2.7");
            const withdrawPool = toWei("2.7");

            const borrowAmount = toWei("10");

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

            await contracts.lending.depositExactAmountETH(
                nftAlice,
                {
                    from: alice,
                    value: depositPool
                }
            );

            await contracts.lending.solelyDepositETH(
                nftAlice,
                {
                    from: alice,
                    value: depositSolely
                }
            );

            await contracts.lending.depositExactAmountETH(
                nftBob,
                {
                    from: alice,
                    value: depositWETH
                }
            );

            await contracts.lending.borrowExactAmountETH(
                nftAlice,
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                60 * 60
            );

            await expectRevert(
                contracts.lending.withdrawBothExactSharesETH(
                    nftAlice,
                    withdrawPool,
                    withdrawSolely,
                    {
                        from: alice
                    }
                ),
                "NotEnoughCollateral()"
            );

            const littleLessSolely = Bi(withdrawSolely)
                - Bi(toWei("0.006"));

            const littleLessPool = Bi(withdrawPool)
                - Bi(toWei("0.006"));

            await takeSnapshot();

            contracts.lending.withdrawBothExactSharesETH(
                nftAlice,
                withdrawPool,
                littleLessSolely,
                {
                    from: alice
                }
            );

            await restoreSnapshot();

            contracts.lending.withdrawBothExactSharesETH(
                nftAlice,
                littleLessPool,
                withdrawSolely,
                {
                    from: alice
                }
            );
        });
    });
});
