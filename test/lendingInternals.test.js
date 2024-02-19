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

const calcFlag = false;

contract("WiseLending internals test", async (accounts) => {

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
                }
            ]
        );
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

    /*wrapDepositShares = async (_nftId, _poolToken, _shares, _caller, _state = false, ) => {
        await contracts.lending.depositExactShares(
            _nftId,
            _poolToken,
            _shares,
            _state,
            {
                from: _caller
            }
        );
    }*/

    describe("cleanUp() tests", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("cleanUp() works as intended (same token transmitted as deposited)", async () => {

            const depositAmount = toWei("50");
            const depositAmount2 = toWei("3");
            const transferAmount = toWei("2");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            let poolAmount = await contracts.lending.getTotalPool(
                WETH.address
            );

            await WETH.transfer(
                contracts.lending.address,
                transferAmount,
                {
                    from: alice
                }
            );

            poolAmount = await contracts.lending.getTotalPool(
                WETH.address
            );

            const balCont = await WETH.balanceOf(
                contracts.lending.address
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount2,
                alice
            );

            poolAmount = await contracts.lending.getTotalPool(
                WETH.address
            );

            assert.equal(
                poolAmount.toString(),
                "53000003170979198376"
                // toWei("55").toString()
            );
        });

        it("cleanUp() works as intended (different token transmitted as deposited)", async () => {

            const depositAmount = toWei("50");
            const depositAmount2 = toWei("5");
            const transferAmount = pow6(200);

            const sum = Bi(depositAmount)
                + Bi(depositAmount2);


            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            USDC.transfer(
                contracts.lending.address,
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

            const poolAmount = await contracts.lending.getTotalPool(
                WETH.address
            );

            assert.equal(
                poolAmount.toString(),
                sum.toString()
            );
        });
    });

    describe("allocateDepositShares() tests", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("allocateDepositShares() works as intended (One user deposit)", async () => {

            const depositAmount = toWei("50");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const bla = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            console.log(bla.shares.toString(),"shares before deposit");

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            const userLendingdata = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            console.log(userLendingdata.shares.toString(),"shares after deposit");

            const shareAmount = Bi(userLendingdata.shares) + Bi(1);

            assert.equal(
                depositAmount.toString(),
                shareAmount.toString()
            );
        });

        it("cashoutAmount() works as intended (One user deposit)", async () => {

            const depositAmount = toWei("50");
            const depositAmount2 = toWei("73");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            const userLendingdata = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            const shareAmount = Bi(userLendingdata.shares)+Bi(1);

            assert.equal(
                shareAmount.toString(),
                depositAmount.toString()
            );

            const totalPool = await contracts.lending.getTotalPool(
                WETH.address
            );

            assert.equal(
                totalPool.toString(),
                depositAmount.toString()
            );

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount2,
                alice
            );

            const totalPool2 = await contracts.lending.getTotalPool(
                WETH.address
            );

            const totalShare = await contracts.lending.getTotalDepositShares(
                WETH.address
            )

            const pseudoPool = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            const calcAddAmount = Bi(Bi(depositAmount2)-Bi(2))
                * Bi(pseudoPool)
                / Bi(totalShare);

            const diff = Bi(totalPool2)
                - Bi(totalPool);

            assert.equal(
                diff.toString(),
                calcAddAmount.toString()
            );
        });

        it("allocateDepositShares() works as intended (Two users deposit)", async () => {

            const depositAmount = toWei("50");
            const depositAmount2 = toWei("5");

            const transferAmount = toWei("50");


            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount2,
                bob
            );

            const user1Lendingdata = await contracts.lending.userLendingData(
                1,
                WETH.address
            );
            const user2Lendingdata = await contracts.lending.userLendingData(
                2,
                WETH.address
            );

            const shareAmount1 = Bi(user1Lendingdata.shares) + Bi(1);
            const shareAmount2 = Bi(user2Lendingdata.shares) + Bi(2);

            assert.equal(
                shareAmount1.toString(),
                toWei("50").toString()
            );
            assert.equal(
                shareAmount2.toString(),
                toWei("5").toString()
            );
        });
    });

    describe("allocateBorrowShares() tests", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("allocateBorrowShares() works as intended (One user borrow)", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            const userBorroShares = Bi(await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            )) - Bi(1);

            assert.equal(
                userBorroShares.toString(),
                toWei("10").toString()
            );
        });

        it("payoutAmount works as intended (One user borrow)", async () => {

            const depositAmount = toWei("100");

            const borrowAmount = toWei("15");
            const borrowAmount2 = toWei("37");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            const usershares = Bi(await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            )) - Bi(1);

            assert.equal(
                usershares.toString(),
                borrowAmount.toString()
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                WETH.address
            );

            const totalBorrowAmount = await contracts.lending.getPseudoTotalBorrowAmount(
                WETH.address
            );

            await snapshot.restore();

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount2,
                {
                    from: alice
                }
            );

            const totalBorrowAmountAfter = await contracts.lending.getPseudoTotalBorrowAmount(
                WETH.address
            );

            const diff = Bi(totalBorrowAmountAfter)
                - Bi(totalBorrowAmount)

            assert.equal(
                diff.toString(),
                borrowAmount2.toString()
            );
        })

        it("allocateBorrowShares() works as intended (Two user borrow)", async () => {

            const depositAmount = toWei("50");
            const depositAmount2 = toWei("30");


            const borrowAmount1 = toWei("30");
            const borrowAmount2 = toWei("20");

            const transferAmount = toWei("50");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
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
                    from: alice
                }
            );

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount1,
                {
                    from: alice
                }
            );

            await contracts.lending.collateralizeDeposit(
                2,
                WETH.address,
                {
                    from: bob
                }
            );

            takeSnapshot()

            await contracts.lending.syncManually(
                WETH.address
            );

            const pseudoBorrow = await contracts.lending.getPseudoTotalBorrowAmount(
                WETH.address
            );

            const totalBorrowShares = await contracts.lending.getTotalBorrowShares(
                WETH.address
            );

            const product = Bi(borrowAmount2)
                * Bi(totalBorrowShares)

            const calcValue = product / Bi(pseudoBorrow) + Bi(1);

            await snapshot.restore();

            await contracts.lending.borrowExactAmount(
                2,
                WETH.address,
                borrowAmount2,
                {
                    from: bob
                }
            );

            const user1BorrowShares = Bi(await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            )) - Bi(1);

            const user2BorrowShares = Bi(await contracts.lending.getPositionBorrowShares(
                2,
                WETH.address
            ));

            assert.equal(
                user1BorrowShares.toString(),
                borrowAmount1.toString()
            );

            assert.equal(
                user2BorrowShares.toString(),
                calcValue.toString()
            );
        });
    });

    describe("calcUtilization() tests", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("Utilization correct calculated (One deposit and one borrow)", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            const poolData = await contracts.lending.globalPoolData(
                WETH.address
            );

            const utilization = poolData.utilization;

            const totalPool = await contracts.lending.getTotalPool(
                WETH.address
            );

            const pseudoToT = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            const term = Bi(toWei("1"))
                * Bi(totalPool)
                / Bi(pseudoToT);

            const calcNumber = Bi(toWei("1"))
                - Bi(term);

            assert.equal(
                calcNumber.toString(),
                utilization
            );
        });

        it("Utilization correct calculated (One deposit and two borrow)", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");
            const borrowAmount2 = toWei("5");


            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            await contracts.lending.borrowExactAmount(
                1,
                WETH.address,
                borrowAmount2,
                {
                    from: alice
                }
            );

            const poolData = await contracts.lending.globalPoolData(
                WETH.address
            );

            const utilization = poolData.utilization;

            const totalPool = await contracts.lending.getTotalPool(
                WETH.address
            );

            const pseudoToT = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            const term = Bi(toWei("1"))
                * Bi(totalPool)
                / Bi(pseudoToT);

            const calcNumber = Bi(toWei("1"))
                - Bi(term);

            assert.equal(
                calcNumber.toString(),
                utilization
            );
        });
    });

    describe("Updating pseudo Pools tests", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("Updating pseudoTotalPool and pseudoTotalBorrowAmount works as intended ", async () => {

            const BOUND = toWei("0.00005");

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            takeSnapshot();

            const pseudoTotalPoolAmount = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            const pseudoTotalBorrowAmount = await contracts.lending.getPseudoTotalBorrowAmount(
                WETH.address
            );

            const borrowData = await contracts.lending.borrowPoolData(
                WETH.address
            );

            const borrowAPY = borrowData.borrowRate;

            await snapshot.restore();

            await time.increase(
                SECONDS_IN_DAY
            );

            await contracts.lending.syncManually(
                WETH.address
            );

            let pseudoTotalPoolAmountEnd = await contracts.lending.getPseudoTotalPool(
                WETH.address
            );

            let pseudoTotalBorrowAmountEnd = await contracts.lending.getPseudoTotalBorrowAmount(
                WETH.address
            );

            if(calcFlag) {

                console.log("borrowAPY:",borrowAPY.toString() );
                console.log("pseudoTotalBorrowAmount:",pseudoTotalBorrowAmount.toString() );
                console.log("pseudoTotalPoolAmount:",pseudoTotalPoolAmount.toString() );

                console.log("pseudoTotalBorrowAmountEnd:",pseudoTotalBorrowAmountEnd.toString() );
                console.log("pseudoTotalPoolAmountEnd:",pseudoTotalPoolAmountEnd.toString() );
            }

            let increaseAmount = Bi(borrowAPY)
                * Bi(pseudoTotalBorrowAmount)
                * Bi(SECONDS_IN_DAY)
                / Bi(SECONDS_IN_YEAR)
                / Bi(toWei("1"));

            let diffTotalPool = pseudoTotalPoolAmountEnd
                .sub(pseudoTotalPoolAmount);


            let diffTotalBorrow = pseudoTotalBorrowAmountEnd
                .sub(pseudoTotalBorrowAmount);

            const diffDeposit = Bi(diffTotalPool)
                - Bi(increaseAmount);


            const diffBorrow = Bi(diffTotalPool)
                - Bi(increaseAmount);

            const boolDeposit = BOUND > diffDeposit;
            const boolBorrow = BOUND > diffBorrow;

            assert.equal(
                boolDeposit.toString(),
                "true"
            );
            assert.equal(
                boolBorrow.toString(),
                "true"
            );
        });
    });

    describe("Updating user lendingTokenData tests (dynamical array updating) ", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("Adding token address to array works as intended (One deposit)", async () => {

            const depositAmount = toWei("50");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            let tokenAddress = await contracts.lending.positionLendTokenData(
                1,
                0
            );

            assert.equal(
                WETH.address.toString(),
                tokenAddress.toString()
            );
        });

        it("Adding token address to array works as intended (Two deposit)", async () => {

            const depositAmount = toWei("50");
            const depositAmount2 = pow6("6000");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            let tokenAddress1 = await contracts.lending.positionLendTokenData(
                1,
                0
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount2,
                alice
            );

            let tokenAddress2 = await contracts.lending.positionLendTokenData(
                1,
                1
            );

            assert.equal(
                WETH.address.toString(),
                tokenAddress1.toString()
            );

            assert.equal(
                USDC.address.toString(),
                tokenAddress2.toString()
            );
        });

        it("Remove token address from array works as intended (Two deposit)", async () => {

            const depositAmount = toWei("50");
            const depositAmount2 = pow6("6000");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            let tokenAddress1 = await contracts.lending.positionLendTokenData(
                1,
                0
            );

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount2,
                alice
            );

            let tokenAddress2 = await contracts.lending.positionLendTokenData(
                1,
                1
            );

            const lendingData = await contracts.lending.userLendingData(
                1,
                tokenAddress1
            );

            await expectRevert.unspecified(

                contracts.lending.withdrawExactAmount(
                    1,
                    tokenAddress1,
                    depositAmount,
                    {
                        from: alice
                    }
                )
            );

            await contracts.lending.withdrawExactAmount(
                1,
                    tokenAddress1,
                    Bi(depositAmount) -Bi(1),
                    {
                        from: alice
                    }
                );

            let newTokenAddress = await contracts.lending.positionLendTokenData(
                1,
                0
            );

            assert.equal(
                tokenAddress2.toString(),
                newTokenAddress.toString()
            );
        });
    });

    describe("Updating user lendingBorrowTokenData tests (dynamical array updating) ", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("Adding token address to array works as intended (One Borrow)", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("1");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            let tokenAddress = await contracts.lending.positionBorrowTokenData(
                1,
                0
            );

            assert.equal(
                WETH.address.toString(),
                tokenAddress.toString()
            );
        });

        it("Adding token address to array works as intended (Two borrows)", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("1");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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
                USDC.address,
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

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            let tokenAddress1 = await contracts.lending.positionLendTokenData(
                1,
                0
            );

            let tokenAddress2 = await contracts.lending.positionLendTokenData(
                1,
                1
            );

            assert.equal(
                WETH.address.toString(),
                tokenAddress1.toString()
            );

            assert.equal(
                USDC.address.toString(),
                tokenAddress2.toString()
            );
        });

        it("Remove token address from array works as intended (Two borrows)", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("1");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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
                USDC.address,
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

            await contracts.lending.borrowExactAmount(
                1,
                USDC.address,
                ONE_ETH,
                {
                    from: alice
                }
            );

            let tokenAddress2 = await contracts.lending.positionBorrowTokenData(
                1,
                1
            );

            const shares1 = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            )

            await contracts.lending.paybackExactShares(
                1,
                WETH.address,
                shares1,
                {
                    from: alice
                }
            );

            const shares1End = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            assert.equal(
                shares1End.toString(),
                "0"
            );

            const newTokenAddress = await contracts.lending.positionBorrowTokenData(
                1,
                0
            );

            assert.equal(
                tokenAddress2.toString(),
                newTokenAddress.toString()
            );
        });

    });

    describe("Calculating right fraction for withdraw tests", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("Withdraw 33% of a token after deposit works as intended (Deposited 10 token)", async () => {

            const depositAmount = toWei("10");
            const fraction = toWei("0.33");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            const depositTokenStruct = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            const shareAmount = depositTokenStruct.shares;

            const shareFraction = Bi(shareAmount)
                * Bi(fraction)
                / Bi(toWei("1"));

            const tokenFraction = Bi(depositAmount)
                * Bi(fraction)
                / Bi(toWei("1"));

            takeSnapshot();

            await contracts.lending.withdrawExactAmount(
                1,
                WETH.address,
                tokenFraction,
                {
                    from: alice
                }
            );

            let depositTokenStructAfter = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            let shareAmountAfter = depositTokenStructAfter.shares;

            let quotientShares = (Bi(shareAmountAfter)
                * Bi(toWei("1"))
                / Bi(shareAmount)) + Bi(1);

            assert.equal(
                quotientShares.toString(),
                toWei("0.67").toString()
            );

            await snapshot.restore();

            await contracts.lending.withdrawExactShares(
                1,
                WETH.address,
                shareFraction,
                {
                    from: alice
                }
            );

            depositTokenStructAfter = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            shareAmountAfter = depositTokenStructAfter.shares;

            quotientShares = Bi(shareAmountAfter)
                * Bi(toWei("1"))
                / Bi(shareAmount);

            assert.equal(
                quotientShares.toString(),
                toWei("0.67").toString()
            );
        });

        it("Withdraw 73% of a token after deposit works as intended (Deposited 23 tokens)", async () => {

            const depositAmount = toWei("23");
            const fraction = toWei("0.73");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            let depositTokenStruct = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            let shareAmount = depositTokenStruct.shares;

            const shareFraction = Bi(shareAmount)
                * Bi(fraction)
                / Bi(toWei("1"));

            const tokenFraction = Bi(depositAmount)
                * Bi(fraction)
                / Bi(toWei("1"));

            takeSnapshot();

            const balBefore = await WETH.balanceOf(
                alice
            );

            await contracts.lending.withdrawExactAmount(
                1,
                WETH.address,
                tokenFraction,
                {
                    from: alice
                }
            );

            let balAfter = await WETH.balanceOf(
                alice
            );

            let diff = Bi(balAfter)
                - Bi(balBefore);

            assert.equal(
                diff.toString(),
                tokenFraction.toString()
            );

            let depositTokenStructAfter = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            let shareAmountAfter = depositTokenStructAfter.shares;

            let quotientShares = (Bi(shareAmountAfter)
                * Bi(toWei("1"))
                / Bi(shareAmount))
                + Bi(1);

            assert.equal(
                quotientShares.toString(),
                toWei("0.27").toString()
            );

            restoreSnapshot();

            await contracts.lending.withdrawExactShares(
                1,
                WETH.address,
                shareFraction,
                {
                    from: alice
                }
            );

            balAfter = await WETH.balanceOf(
                alice
            );

            diff = Bi(balAfter)
                - Bi(balBefore)
                + Bi(2);

            assert.equal(
                diff.toString(),
                tokenFraction.toString()
            );

            depositTokenStructAfter = await contracts.lending.userLendingData(
                1,
                WETH.address
            );

            shareAmountAfter = depositTokenStructAfter.shares;

            quotientShares = Bi(shareAmountAfter)
                * Bi(toWei("1"))
                / Bi(shareAmount);

            assert.equal(
                quotientShares.toString(),
                toWei("0.27").toString()
            );
        });
    });

    describe("Calculating right fraction for payback tests", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("Payback 37% of a token after borrow works as intended (Borrowed 10 token)", async () => {

            const depositAmount = toWei("50");
            const borrowAmount = toWei("10");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            const amountBefore = await WETH.balanceOf(
                alice
            );

            const fractionShares = Bi(borrowShares)
                * Bi(toWei("0.37"))
                / Bi(toWei("1"));

            await advanceTimeAndBlock(SECONDS_IN_DAY);

            await contracts.lending.paybackExactShares(
                1,
                WETH.address,
                fractionShares,
                {
                    from: alice
                }
            );

            let amountAfter = await WETH.balanceOf(
                alice
            );

            let borrowSharesAfter = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            let quotientShares = Bi(borrowSharesAfter)
                * Bi(toWei("1"))
                / Bi(borrowShares);

            let diff = Bi(amountBefore)
                - Bi(amountAfter);

            assert.equal(
                quotientShares.toString(),
                toWei("0.63").toString()
            );
        });

        it("Payback 13% of a token after borrow works as intended (Borrowed 17 token)", async () => {

            const depositAmount = toWei("50");
            const paybackPercantage = toWei("0.13");
            const borrowAmount = toWei("17");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const inversePerc = Bi(toWei("1"))
                - Bi(paybackPercantage);

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            let borrowShares = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            let paybackShares = Bi(borrowShares)
                * Bi(paybackPercantage)
                / Bi(toWei("1"));

            let amountBefore = await WETH.balanceOf(
                alice
            );

            takeSnapshot();

            await advanceTimeAndBlock(SECONDS_IN_DAY);

            const approxPaybackAmount = await contracts.lending.paybackAmount(
                WETH.address,
                paybackShares
            );

            restoreSnapshot();

            await advanceTimeAndBlock(
                SECONDS_IN_DAY
            );

            takeSnapshot();

            await contracts.lending.paybackExactShares(
                1,
                WETH.address,
                paybackShares,
                {
                    from: alice
                }
            );

            let amountAfter = await WETH.balanceOf(
                alice
            );

            let borrowSharesAfter = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            let diff = Bi(amountBefore)
                - Bi(amountAfter);

            assert.isAbove(
                parseInt(diff),
                parseInt(approxPaybackAmount)
            );

            let fractionShares = Bi(borrowSharesAfter)
                * Bi(toWei("1"))
                / Bi(borrowShares);

            assert.equal(
                fractionShares.toString(),
                inversePerc.toString()
            );

            restoreSnapshot();

            const fractionAmount = Bi(borrowAmount)
                * Bi(paybackPercantage)
                / Bi(toWei("1"));

            await contracts.lending.paybackExactAmount(
                1,
                WETH.address,
                fractionAmount,
                {
                    from: alice
                }
            );

            amountAfter = await WETH.balanceOf(
                alice
            );

            borrowSharesAfter = await contracts.lending.getPositionBorrowShares(
                1,
                WETH.address
            );

            diff = Bi(amountBefore)
                - Bi(amountAfter);

            assert.equal(
                diff.toString(),
                fractionAmount.toString()
            );

            fractionShares = Bi(borrowSharesAfter)
                * Bi(toWei("1"))
                / Bi(borrowShares);

            assert.isAbove(
                parseInt(fractionShares),
                parseInt(inversePerc)
            );
        });
    });

    describe("Testing switches and requirements", () => {

        beforeEach( async () => {

            await preparationSetup();
        });

        it("Uncollateralize works as intended", async () => {

            const borrowAmount = toWei("10");
            const depositAmount = toWei("50");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            await expectRevert(
                contracts.lending.unCollateralizeDeposit(
                    1,
                    WETH.address,
                    {
                        from: alice
                    }
                ),
                'ResultsInBadDebt()'
            );
        });

        it("borrowLimit works as intended", async () => {

            const borrowAmountFail = pow6("1");
            const borrowAmount = pow6(40);
            const depositAmount2 = pow6(100);
            const depositAmount = toWei("50");
            const newOracleValue = pow8(1.0625);
            const transferAmount = pow6(100)

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
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

            await USDC.transfer(
                bob,
                transferAmount,
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

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositAmount2,
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
                USDC.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await chainlinkUSDC.setValue(
                newOracleValue
            );

            await expectRevert(
                contracts.lending.withdrawExactAmount(
                    1,
                    WETH.address,
                    borrowAmountFail,
                    {
                        from: alice
                    }
                ),
                'ResultsInBadDebt()'
            );
        });

        it("borrowLimit with several borrows works as intended", async () => {

            const borrowAmount = pow6(84999);
            const secondBorrowAmount = pow6("3");
            const depositAmount = toWei("100000");
            const depositAmount2 = pow6(100000);
            const newOracleValue = pow8(1);
            const transferAmount = toWei("1000000");

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await chainlinkUSDC.setValue(
                newOracleValue
            );

            await chainlinkWETH.setValue(
                newOracleValue
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

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            )

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

            await wrapDepositAmount(
                1,
                USDC.address,
                depositAmount2,
                alice
            );

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            await contracts.lending.collateralizeDeposit(
                2,
                WETH.address,
                {
                    from: bob
                }
            );

            await contracts.lending.borrowExactAmount(
                2,
                USDC.address,
                BigInt(borrowAmount * 0.95),
                {
                    from: bob
                }
            );

            await time.increase(
                12 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                USDC.address
            );

            restoreSnapshot();

            await expectRevert(
                contracts.lending.borrowExactAmount(
                    2,
                    USDC.address,
                    secondBorrowAmount,
                    {
                        from: bob
                    }
                ),
                'ResultsInBadDebt()'
            );
        })

        it("checkBorrowPossible works as intended", async () => {

            const borrowAmountFail = pow6(1);
            const borrowAmount = pow6(10000);
            const depositAmount = toWei("50000");
            const depositAmountUSDC = pow6(50000);
            const newOracleValue = pow8("10000");
            const transferAmount = pow6(100000);

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await USDC.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            )

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
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

            await wrapDepositAmount(
                1,
                WETH.address,
                depositAmount,
                alice
            );

            await wrapDepositAmount(
                2,
                USDC.address,
                depositAmountUSDC,
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
                USDC.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await chainlinkUSDC.setValue(
                newOracleValue
            );

            await expectRevert(
                contracts.lending.borrowExactAmount(
                    1,
                    USDC.address,
                    borrowAmountFail,
                    {
                        from: alice
                    }
                ),
                'ResultsInBadDebt()'
            );
        });

        it("checkBorrowPossible with several borrows works as intended", async () => {

            const borrowAmount = pow6("80000");
            const tinyWithdraw = toWei("200");
            const depositAmount = toWei("100000");
            const depositAmount2 = pow6(85000);
            const newOracleValue = toWei("1");
            const transferAmount = toWei("100000");
            const transferAmount2 = pow6(100000);

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await chainlinkUSDC.setValue(
                newOracleValue
            );

            await chainlinkWETH.setValue(
                newOracleValue
            );

            await WETH.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            )

            await WETH.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await USDC.transfer(
                bob,
                transferAmount2,
                {
                    from: alice
                }
            )

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
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

            await wrapDepositAmount(
                2,
                WETH.address,
                depositAmount,
                bob
            );

            await contracts.lending.collateralizeDeposit(
                2,
                WETH.address,
                {
                    from: bob
                }
            );

            await contracts.lending.borrowExactAmount(
                2,
                USDC.address,
                borrowAmount,
                {
                    from: bob
                }
            );

            await time.increase(
                16 * SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            takeSnapshot();

            await contracts.lending.syncManually(
                USDC.address
            );

            await expectRevert(
                contracts.lending.withdrawExactAmount(
                    2,
                    WETH.address,
                    tinyWithdraw,
                    {
                        from: bob
                    }
                ),
                "ResultsInBadDebt()"
            );
        });
    });
});
