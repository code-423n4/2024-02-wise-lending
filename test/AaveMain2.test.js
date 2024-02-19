const Lending = artifacts.require("TesterLending");
const Token = artifacts.require("Token");
const IWETH = artifacts.require("IWETH")
const OracleHub = artifacts.require("TesterWiseOracleHub");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const Liquidation = artifacts.require("WiseLiquidation");
const FeeManager = artifacts.require("FeeManager");
const WiseSecuirty = artifacts.require("WiseSecurity");
const PositionNFT = artifacts.require("PositionNFTs");
const IsolationContract = artifacts.require("WiseIsolationMode");
const AaveSecondLayer = artifacts.require("AaveHub");
const Aave = artifacts.require("IAave");
const Chainlink = artifacts.require("TesterChainlink");

const { expectRevert, time } = require('@openzeppelin/test-helpers');

require("./utils");
require("./test-scenarios");
require("./constants.js");

const AAVE_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
// const AAVE_ADDRESS_V2 = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9";

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const CHAINLINK_WETH = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419";
const AAVE_WETH_ADDRESS = "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8";
// const AAVE_WETH_ADDRESS_V2 = "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

// USDC to ETH
const CHAINLINK_USDC = "0x986b5E1e1755e3C2440e960477f25201B0a8bbD4";

const AAVE_USDC_ADDRESS = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c";
// const AAVE_USDC_ADDRESS_V2 = "0xBcca60bB61934080951369a648Fb03DF4F96263C";

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

// DAI to ETH
const CHAINLINK_DAI = "0x773616e4d11a78f511299002da57a0a94577f1f4";
const AAVE_DAI_ADDRESS = "0x018008bfb33d285247A21d44E50697654f754e63";


const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
// const CHAINLINK_USDT = "0x3E7d1eAB13ad0104d2750B8863b489D65364e32D";
// const AAVE_USDT_ADDRESS_V2 = "0x3Ed3B47Dd13EC9a98b44e6204A523E766B225811";

const megaWhale = "0x55FE002aefF02F77364de339a1292923A15844B8";
// const AUSDT_WHALE = "0xf07766108Cdb54082F7B06CAd20d6ADAb1342d46";
const DAI_WHALE = "0xB96695ccb167AC37AE2FD46F8a8DDFAf462F27ac";

contract("Aave second layer", async accounts => {

    const [owner, alice, bob, pepe] = accounts;

    const HUGE_AMOUNT = Bi(
        toWei("10000000")
    );

    const MULTIPLICATION_FACTOR = toWei("1");
    const COLLATERAL_FACTOR = toWei("0.8");

    let NFT_ID;

    let USDC
    let aUSDC;
    let AAVE;
    let WETH;
    let aWETH;

    let USDT;

    let DAI;
    let aDAI;

    let contracts;
    let aavePools;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

    getLastEvent = async (_eventName, _instance, _startBlock) => {
        const events = await _instance.getPastEvents(
            _eventName,
            {
                fromBlock: _startBlock,
                toBlock: "latest",
            }
        );
        return events.pop().returnValues;
    };

    getPositionInfo = async (_positionNft, _nftId) => {

        const owner = await _positionNft.ownerOf(
            _nftId
        );

        return owner;
    }

    leftOverETHBalanceCheck = async (_address) => {

        const res = await web3.eth.getBalance(
            _address
        );

        if (res.toString() === "0") {
            return;
        }

        console.log(
            "ERROR ETH LEFT IN CONTRACT"
        );
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

        await contracts.oracleHub.addOracleBulk(
            [
                AAVE_USDC_ADDRESS,
                AAVE_WETH_ADDRESS,
                WETH_ADDRESS,
                AAVE_DAI_ADDRESS
            ],
            [
                CHAINLINK_USDC,
                CHAINLINK_WETH,
                CHAINLINK_WETH,
                CHAINLINK_DAI
            ],
            [
                [],
                [],
                [],
                []
            ]
        );

        // set fake heartbeat since local fork doesn't get updated
        await contracts.oracleHub.setHeartBeat(
            USDC_ADDRESS,
            HUGE_AMOUNT
        );

        // set fake heartbeat since local fork doesn't get updated
        await contracts.oracleHub.setHeartBeat(
            AAVE_WETH_ADDRESS,
            HUGE_AMOUNT
        );

        await contracts.oracleHub.setHeartBeat(
            WETH_ADDRESS,
            HUGE_AMOUNT
        );

        // set fake heartbeat since local fork doesn't get updated
        await contracts.oracleHub.setHeartBeat(
            AAVE_USDC_ADDRESS,
            HUGE_AMOUNT
        );

        // set fake heartbeat since local fork doesn't get updated
        await contracts.oracleHub.setHeartBeat(
            AAVE_DAI_ADDRESS,
            HUGE_AMOUNT
        );

        await addPools(
            contracts.lending,
            [
                {
                    allowBorrow: true,
                    poolToken: aUSDC,
                    mulFactor: MULTIPLICATION_FACTOR,
                    collFactor: COLLATERAL_FACTOR,
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: aWETH,
                    mulFactor: MULTIPLICATION_FACTOR,
                    collFactor: COLLATERAL_FACTOR,
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: USDT,
                    mulFactor: MULTIPLICATION_FACTOR,
                    collFactor: COLLATERAL_FACTOR,
                    maxDeposit: HUGE_AMOUNT
                }
            ]
        );

        await contracts.aaveHub.setAaveTokenAddress(
            USDC_ADDRESS,
            AAVE_USDC_ADDRESS
        );

        await contracts.aaveHub.setAaveTokenAddress(
            WETH_ADDRESS,
            AAVE_WETH_ADDRESS
        );

        await approveTokens(
            contracts.lending,
            [
                {
                    Token: USDC,
                    contract: contracts.aaveHub,
                    user: owner,
                    type: "normal"
                },
                {
                    Token: USDT,
                    contract: contracts.aaveHub,
                    user: owner,
                    type: "normal"
                },
                {
                    Token: WETH,
                    contract: contracts.aaveHub,
                    user: owner,
                    type: "normal"
                }
            ]
        );

        return {
            contracts,
            aavePools: contracts.aaveHub
        }
    }

    before(async () => {

        startBlock = (
            await getBlockInfo()
        ).blockNumber;

        aUSDC = await Token.at(
            AAVE_USDC_ADDRESS
        );

        AAVE = await Aave.at(
            AAVE_ADDRESS
        );

        USDC = await Token.at(
            USDC_ADDRESS
        );

        USDT = await Token.at(
            USDT_ADDRESS
        );

        aWETH = await Token.at(
            AAVE_WETH_ADDRESS
        );

        WETH = await IWETH.at(
            WETH_ADDRESS
        );

        DAI = await Token.at(
            DAI_ADDRESS
        );

        aDAI = await Token.at(
            AAVE_DAI_ADDRESS
        );

        await getTokenFromWhale(
            {
                Token: Token,
                Helpers: helpers,
                Web3: web3,
                Ethers: ethers,
                whaleAddress: megaWhale,
                user: owner,
                tokenAddress: USDC
            }
        );

        const data = await preparationSetup();

        contracts = data.contracts;
        aavePools = data.aavePools;

        await contracts.nft.mintPosition(
            {
                from: owner
            }
        );

        NFT_ID = await contracts.nft.tokenOfOwnerByIndex(
            owner,
            0
        );

        ownerOf = await getPositionInfo(
            contracts.nft,
            NFT_ID
        );

        await takeSnapshot();
    });

    describe("Aave functionality", () => {

        it("aUSDC accumualtes and is picked up by cleanup", async () => {

            const depositValue = toWei("10");

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    value: depositValue
                }
            );

            const totalPoolBeforeCleanup = await contracts.lending.getTotalPool(
                aWETH.address
            );

            const borrowShares = await contracts.lending.getTotalBorrowShares(
                aWETH.address
            );

            assert.equal(
                "1000",
                borrowShares.toString()
            );

            const balanceaWETHnow = await aWETH.balanceOf(
                contracts.lending.address
            );

            assert.equal(
                depositValue.toString(),
                balanceaWETHnow
            );

            await time.increase(
                7 * SECONDS_IN_DAY
            );

            const balanceaWETHafterWeek = await aWETH.balanceOf(
                contracts.lending.address
            );

            assert.isAbove(
                parseInt(balanceaWETHafterWeek),
                parseInt(balanceaWETHnow)
            );

            await contracts.lending.syncManually(
                aWETH.address
            );

            const totalPoolAfterCleanup = await contracts.lending.getTotalPool(
                aWETH.address
            );

            assert.isAbove(
                parseInt(totalPoolAfterCleanup),
                parseInt(totalPoolBeforeCleanup)
            );
        });

        it("Functions for pool APY are giving the right value", async () => {

            const depositAmount = toWei("1");
            const borrowAmount = toWei("0.001");

            const withdrawShares = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            await advanceTimeAndBlock(
                1 * SECONDS_IN_DAY
            );

            if (withdrawShares > 0) {
                await aavePools.withdrawExactSharesETH(
                    NFT_ID,
                    withdrawShares,
                    {
                        from: owner
                    }
                );
            }

            const poolAPY = await aavePools.getLendingRate(
                WETH_ADDRESS
            );

            assert.isAbove(
                parseInt(poolAPY),
                parseInt(0)
            );

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    from: owner,
                    value: depositAmount
                }
            );

            const aavePoolAPY2 = await aavePools.getAavePoolAPY(
                WETH_ADDRESS
            );

            const poolAPY2 = await aavePools.getLendingRate(
                WETH_ADDRESS
            );

            const diff = Bi(aavePoolAPY2)
                - Bi(poolAPY2);

            const diffBool = await inBound(
                abs(diff),
                WETH
            );

            console.log(poolAPY2.toString(), 'poolAPY2');
            console.log(aavePoolAPY2.toString(), 'aavePoolAPY2');
            console.log(diff, 'diff');
            console.log(diffBool, 'diffBool');

            /*assert.equal(
                diffBool.toString(),
                "true"
            );*/

            await aavePools.borrowExactAmountETH(
                NFT_ID,
                borrowAmount,
                {
                    from: owner
                }
            );

            const aavePoolAPYEnd = await aavePools.getAavePoolAPY(
                WETH_ADDRESS
            );

            const poolAPYEnd = await aavePools.getLendingRate(
                WETH_ADDRESS
            );

            assert.isAbove(
                parseInt(aavePoolAPYEnd),
                parseInt(poolAPYEnd)
            );
        });
    });

    describe("Extra Unusual Tests", () => {

        before(async () => {
            await snapshot.restore();
        })

        it("dumping tokens which are later added in governance", async () => {

            const SMALL_AMOUNT = 100000;

            await web3.eth.sendTransaction(
                {
                    from: owner,
                    to: DAI_WHALE,
                    value: toWei("10")
                }
            );

            await getTokenFromWhale(
                {
                    Token: Token,
                    Helpers: helpers,
                    Web3: web3,
                    Ethers: ethers,
                    whaleAddress: DAI_WHALE,
                    user: owner,
                    tokenAddress: DAI
                }
            );

            await DAI.approve(
                AAVE.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await AAVE.supply(
                DAI.address,
                SMALL_AMOUNT,
                owner,
                0,
                {
                    from: owner
                }
            );


            await aDAI.transfer(
                contracts.lending.address,
                SMALL_AMOUNT
            );

            await addPools(
                contracts.lending,
                [
                    {
                        allowBorrow: true,
                        poolToken: aDAI,
                        mulFactor: MULTIPLICATION_FACTOR,
                        collFactor: COLLATERAL_FACTOR,
                        maxDeposit: HUGE_AMOUNT
                    }
                ]
            );

            await aavePools.setAaveTokenAddress(
                DAI.address,
                aDAI.address
            );

            await DAI.approve(
                aavePools.address,
                HUGE_AMOUNT
            );


            const adjustedAmount = Bi(SMALL_AMOUNT)
                - Bi(1);

            await aavePools.depositExactAmount(
                NFT_ID,
                DAI.address,
                adjustedAmount
            );

            const contractBalAUSDTBefore = await aDAI.balanceOf(
                contracts.lending.address
            );

            assert.equal(
                contractBalAUSDTBefore.toString(),
                adjustedAmount.toString()
            );

            const userLendingShares = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aDAI.address
            );

            await aavePools.withdrawExactShares(
                NFT_ID,
                DAI.address,
                userLendingShares
            );

            const contractBalAUSDTAfter = await aDAI.balanceOf(
                contracts.lending.address
            );

            assert.equal(
                contractBalAUSDTAfter.toString(),
                "2"
            );
        });

        it("Propose and take ownership", async () => {

            await expectRevert(
                aavePools.proposeOwner(
                    pepe,
                    {
                        from: pepe
                    }
                ),
                "NotMaster()"
            );

            await aavePools.proposeOwner(
                pepe,
                {
                    from: owner
                }
            );

            // const currentProposedNewOwner = await aavePools.proposedMaster();

            /*
            assert.equal(
                currentProposedNewOwner.toString(),
                pepe.toString()
            );
            */

            await expectRevert(
                aavePools.claimOwnership(),
                "NotProposed()"
            );

            await aavePools.claimOwnership(
                {
                    from: pepe
                }
            );

            const newOwner = await aavePools.master();

            assert.equal(
                pepe.toString(),
                newOwner.toString()
            );
        });
    });

    describe("Extra security and update tests", () => {

        beforeEach(async () => {
            await snapshot.restore();
        })

        it("Can't use aaveHub functions when registered for isolation pools", async () => {

            const testAmount = pow6(1);

            const isolationPool = await IsolationContract.new(
                contracts.oracleHub.address,
                contracts.lending.address,
                contracts.liquidation.address,
                USDC.address,
                contracts.security.address,
                toWei("0.95"),
                // toWei("1"),
                [
                    WETH.address
                ],
                [
                    toWei("1")
                ]
            );

            await contracts.lending.setVerifiedIsolationPool(
                isolationPool.address,
                true
            );

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNFT = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await isolationPool.registrationFarm(
                aliceNFT,
                1,
                {
                    from: alice
                }
            );

            await contracts.lending.setVerifiedIsolationPool(
                isolationPool.address,
                true
            );
/*
            await contracts.lending.setRegistrationIsolationPool(
                aliceNFT,
                true,
                {
                    from: isolationPool.address
                }
            );*/

            await USDC.transfer(
                alice,
                testAmount,
                {
                    from: owner
                }
            );

            await USDC.approve(
                aavePools.address,
                testAmount,
                {
                    from: alice
                }
            );

            await expectRevert(
                aavePools.depositExactAmount(
                    aliceNFT,
                    USDC.address,
                    testAmount,
                    {
                        from: alice
                    }
                ),
                "PositionLocked()"
            );

            await expectRevert(
                aavePools.depositExactAmountETH(
                    aliceNFT,
                    {
                        from: alice,
                        value: testAmount
                    }
                ),
                "PositionLocked()"
            );

            await expectRevert(
                aavePools.withdrawExactAmount(
                    aliceNFT,
                    USDC.address,
                    testAmount,
                    {
                        from: owner
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.withdrawExactAmountETH(
                    aliceNFT,
                    testAmount,
                    {
                        from: owner
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.withdrawExactShares(
                    aliceNFT,
                    USDC.address,
                    testAmount,
                    {
                        from: owner
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.withdrawExactSharesETH(
                    aliceNFT,
                    testAmount,
                    {
                        from: owner
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.borrowExactAmount(
                    aliceNFT,
                    USDC.address,
                    testAmount,
                    {
                        from: owner
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.borrowExactAmountETH(
                    aliceNFT,
                    testAmount,
                    {
                        from: owner
                    }
                ),
                "NotOwner()"
            );

        });

        it("Only owner of position can use borrow and withdraw functions on aave pools", async () => {

            const depositAmount = pow6(1000);
            const testAmount = pow6(2);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNFT = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await USDC.transfer(
                alice,
                depositAmount,
                {
                    from: owner
                }
            );

            await USDC.approve(
                aavePools.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await aavePools.depositExactAmount(
                aliceNFT,
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            await expectRevert(
                aavePools.withdrawExactAmount(
                    aliceNFT,
                    USDC.address,
                    testAmount,
                    {
                        from: bob
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.withdrawExactAmountETH(
                    aliceNFT,
                    testAmount,
                    {
                        from: bob
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.withdrawExactShares(
                    aliceNFT,
                    USDC.address,
                    testAmount,
                    {
                        from: bob
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.withdrawExactSharesETH(
                    aliceNFT,
                    testAmount,
                    {
                        from: bob
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.borrowExactAmount(
                    aliceNFT,
                    USDC.address,
                    testAmount,
                    {
                        from: bob
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.borrowExactAmountETH(
                    aliceNFT,
                    testAmount,
                    {
                        from: bob
                    }
                ),
                "NotOwner()"
            );
        })

        it("Borrow rate and utilization get correctly updated when aave pools used", async () => {

            const depositAmountETH = toWei("6");
            const depositAmount = pow6(10000);
            const borrowAmount = pow6(5000);

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

            const aliceNFT = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const bobNFT = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await USDC.transfer(
                bob,
                depositAmount,
                {
                    from: owner
                }
            );

            await USDC.approve(
                aavePools.address,
                depositAmount,
                {
                    from: bob
                }
            );

            await aavePools.depositExactAmount(
                bobNFT,
                USDC.address,
                depositAmount,
                {
                    from: bob
                }
            );

            await aavePools.depositExactAmountETH(
                aliceNFT,
                {
                    from: alice,
                    value: depositAmountETH
                }
            );

            const poolData = await contracts.lending.globalPoolData(
                aUSDC.address
            );

            const borrowData = await contracts.lending.borrowPoolData(
                aUSDC.address
            );

            const utilization = poolData.utilization;
            const borrowRate = borrowData.borrowRate;

            await aavePools.borrowExactAmount(
                aliceNFT,
                USDC.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            const poolData2 = await contracts.lending.globalPoolData(
                aUSDC.address
            );

            const utilization2 = poolData2.utilization;

            const borrowData2 = await contracts.lending.borrowPoolData(
                aUSDC.address
            );

            const borrowRate2 = borrowData2.borrowRate;

            assert.isAbove(
                parseInt(utilization2),
                parseInt(utilization)
            );

            assert.isAbove(
                parseInt(borrowRate2),
                parseInt(borrowRate)
            );
        });

        it("Collateral and borrow amount get correctly updated when aave pools used", async () => {

            const depositAmountETH = toWei("6");
            const depositAmount = pow6(10000);
            const borrowAmount = pow6(5000);
            const borrowAmountETH = toWei("1");

        /*    const feedAddress = await contracts.oracleHub.priceFeed(
                AAVE_USDC_ADDRESS
            );

            console.log(feedAddress, 'feedAddress');

            const isAlive2 = await contracts.oracleHub.latestResolver(
                AAVE_USDC_ADDRESS
            );

            console.log(isAlive2.toString(), 'isAlive2');

            const isAlive3 = await contracts.oracleHub.latestResolver(
                AAVE_WETH_ADDRESS
            );

            console.log(isAlive3.toString(), 'isAlive3');

            const isAlive = await contracts.oracleHub.latestResolver(
                WETH_ADDRESS
            );

            console.log(isAlive, 'isAlive'); */

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

            const aliceNFT = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const bobNFT = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await USDC.transfer(
                bob,
                depositAmount,
                {
                    from: owner
                }
            );

            await USDC.approve(
                aavePools.address,
                depositAmount,
                {
                    from: bob
                }
            );

            await aavePools.depositExactAmount(
                bobNFT,
                USDC.address,
                depositAmount,
                {
                    from: bob
                }
            );

            await aavePools.depositExactAmountETH(
                aliceNFT,
                {
                    from: alice,
                    value: depositAmountETH
                }
            );

            const collatAlice = await contracts.security.overallETHCollateralsWeighted(
                aliceNFT
            );

            await aavePools.borrowExactAmount(
                aliceNFT,
                USDC.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await advanceTimeAndBlock(
                1 * SECONDS_IN_DAY
            );

            await contracts.lending.syncManually(
                aUSDC.address
            );

            await contracts.lending.syncManually(
                aWETH.address
            );

            const collatAlice2 = await contracts.security.overallETHCollateralsWeighted(
                aliceNFT
            );

            assert.isAbove(
                parseInt(collatAlice2),
                parseInt(collatAlice)
            );

            borrowETH = await contracts.security.overallETHBorrow(
                aliceNFT
            );

            borrowETH = await contracts.oracleHub.getTokensInUSD(
                WETH_ADDRESS,
                borrowETH
            );

            await aavePools.borrowExactAmountETH(
                aliceNFT,
                borrowAmountETH,
                {
                    from: alice
                }
            );

            borrowETHEND = await contracts.security.overallETHBorrow(
                aliceNFT
            );

            borrowETHEND = await contracts.oracleHub.getTokensInUSD(
                WETH_ADDRESS,
                borrowETHEND
            );

            await advanceTimeAndBlock(
                1 * SECONDS_IN_DAY
            );

            await contracts.lending.syncManually(
                aUSDC.address
            );

            await contracts.lending.syncManually(
                aWETH.address
            );

            const collatAliceEND = await contracts.security.overallETHCollateralsWeighted(
                aliceNFT
            );

            assert.isAbove(
                parseInt(collatAliceEND),
                parseInt(collatAlice2)
            );

            const borrowETHUSD = await contracts.oracleHub.getTokensInUSD(
                WETH_ADDRESS,
                borrowAmountETH
            );

            const reducedBorrowETH = Bi(borrowETHEND)
                - Bi(borrowETHUSD)

            assert.isAbove(
                parseInt(reducedBorrowETH),
                parseInt(borrowETH)
            );
        });
    });

    describe.skip("WithdrawBoth tests", () => {

        before(async () => {

            const data = await preparationSetup();

            contracts = data.contracts;
            aavePools = data.aavePools;

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

            await USDC.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await WETH.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await USDC.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await WETH.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );
        });

        it("user gets right amount of token with withdrawBothExactAmount", async () => {

            const depositSolely = toWei("2.4");
            const depositPool = toWei("6.7");

            const withdrawSolely = toWei("1.5");
            const withdrawPool = toWei("2");

            const wrapAmount = Bi(depositSolely)
                + Bi(depositPool);

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await WETH.deposit(
                {
                    from: alice,
                    value: wrapAmount.toString()
                }
            );

            await aavePools.solelyDeposit(
                nftAlice,
                WETH.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await aavePools.depositExactAmount(
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

            await aavePools.withdrawBothExactAmount(
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
        });

        it("user gets right amount of token with withdrawBothExactSharesETH", async () => {

            const depositSolely = toWei("6");
            const depositPool = toWei("8");

            const withdrawSolely = toWei("3");
            const withdrawPool = toWei("4");

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const sharesClean = await contracts.lending.getPositionLendingShares(
                nftAlice,
                aWETH.address
            );

            if (sharesClean != 0) {
                await aavePools.withdrawExactShares(
                    nftAlice,
                    WETH.address,
                    sharesClean,
                    {
                        from: alice
                    }
                );
            }

            const soleyAmountClean = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aWETH.address
            );

            if (soleyAmountClean != 0) {
                await aavePools.solelyWithdraw(
                    nftAlice,
                    WETH.address,
                    soleyAmountClean,
                    {
                        from: alice
                    }
                );
            }

            await aavePools.depositExactAmountETH(
                nftAlice,
                {
                    from: alice,
                    value: depositPool
                }
            );

            await aavePools.solelyDepositETH(
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
                aWETH.address
            );

            await aavePools.withdrawBothExactSharesETH(
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
                aWETH.address
            );

            const diffShares = Bi(sharesBefore)
                - Bi(sharesAfter);

            assert.equal(
                diffShares.toString(),
                withdrawPool.toString()
            );
        })

        it("user gets right amount of token with withdrawBothExactShares", async () => {

            const depositSolely = pow6(23000);
            const depositPool = pow6(15486);

            const withdrawSolely = pow6(16120);
            const percentShares = toWei("0.73");

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const transferAmount = pow6(100000);

            await USDC.transfer(
                alice,
                transferAmount,
                {
                    from: owner
                }
            );

            const sharesClean = await contracts.lending.getPositionLendingShares(
                nftAlice,
                aWETH.address
            );

            if (sharesClean != 0) {
                await aavePools.withdrawExactShares(
                    nftAlice,
                    WETH.address,
                    sharesClean,
                    {
                        from: alice
                    }
                );
            }

            const soleyAmountClean = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aWETH.address
            );

            if (soleyAmountClean != 0) {
                await aavePools.solelyWithdraw(
                    nftAlice,
                    WETH.address,
                    soleyAmountClean,
                    {
                        from: alice
                    }
                );
            }

            await aavePools.depositExactAmount(
                nftAlice,
                USDC.address,
                depositPool,
                {
                    from: alice,
                }
            );

            await aavePools.solelyDeposit(
                nftAlice,
                USDC.address,
                depositSolely,
                {
                    from: alice,
                }
            );

            const balBefore = await USDC.balanceOf(
                alice
            );

            const sharesBefore = await contracts.lending.getPositionLendingShares(
                nftAlice,
                aUSDC.address
            );

            const portionWithdrawShares = Bi(sharesBefore)
                * Bi(percentShares)
                / Bi(toWei("1"));

            const soleyAmountBefore = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aUSDC.address
            );

            await takeSnapshot();

            const withdrawPool = await aavePools.withdrawBothExactShares.call(
                nftAlice,
                USDC.address,
                portionWithdrawShares,
                withdrawSolely,
                {
                    from: alice
                }
            );

            await restoreSnapshot();

            await aavePools.withdrawBothExactShares(
                nftAlice,
                USDC.address,
                portionWithdrawShares,
                withdrawSolely,
                {
                    from: alice
                }
            );

            const balAfter = await USDC.balanceOf(
                alice
            );

            const soleyAmount = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aUSDC.address
            );

            const diffAlice = Bi(balAfter)
                - Bi(balBefore);

            const sumWithdraw = Bi(withdrawPool)
                + Bi(withdrawSolely);

            const diff = Bi(diffAlice)
                - Bi(sumWithdraw);

            const diffBool = await inBoundVar(
                abs(diff),
                USDC,
                0.00025
            );

            assert.equal(
                diffBool.toString(),
                "true"
            );

            const diffSolely = Bi(soleyAmountBefore)
                - Bi(soleyAmount);

            assert.equal(
                diffSolely.toString(),
                withdrawSolely.toString()
            );

            const sharesAfter = await contracts.lending.getPositionLendingShares(
                nftAlice,
                aUSDC.address
            );

            const diffShares = Bi(sharesBefore)
                - Bi(sharesAfter);

            const diffSharesTot = Bi(diffShares)
                - Bi(withdrawPool);

            const diffSharesTotBool = await inBoundVar(
                abs(diffSharesTot),
                USDC,
                0.00025
            );

            assert.equal(
                diffSharesTotBool.toString(),
                "true"
            );

            await aavePools.withdrawExactShares(
                nftAlice,
                USDC.address,
                sharesAfter,
                {
                    from: alice
                }
            );

            await aavePools.solelyWithdraw(
                nftAlice,
                USDC.address,
                soleyAmount,
                {
                    from: alice
                }
            );
        });

        it("user gets right amount of token with withdrawBothExactAmountETH", async () => {

            const depositSolely = toWei("4.4");
            const depositPool = toWei("2.8");

            const withdrawSolely = toWei("2.0");
            const withdrawPool = toWei("1.2");

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const sharesClean = await contracts.lending.getPositionLendingShares(
                nftAlice,
                aUSDC.address
            );

            const soleyAmountClean = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aUSDC.address
            );

            if (sharesClean != 0) {
                await aavePools.withdrawExactShares(
                    nftAlice,
                    USDC.address,
                    sharesClean,
                    {
                        from: alice
                    }
                );
            }

            if (soleyAmountClean != 0) {
                await aavePools.solelyWithdraw(
                    nftAlice,
                    USDC.address,
                    soleyAmountClean,
                    {
                        from: alice
                    }
                );
            }

            await aavePools.solelyDepositETH(
                nftAlice,
                {
                    from: alice,
                    value: depositSolely
                }
            );

            await aavePools.depositExactAmountETH(
                nftAlice,
                {
                    from: alice,
                    value: depositPool
                }
            );

            const balBefore = await web3.eth.getBalance(
                alice
            );

            await aavePools.withdrawBothExactAmountETH(
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
                aWETH.address
            );

            await aavePools.withdrawExactSharesETH(
                nftAlice,
                shares,
                {
                    from: alice
                }
            );

            const soleyAmount = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aWETH.address
            );

            await aavePools.solelyWithdrawETH(
                nftAlice,
                soleyAmount,
                {
                    from: alice
                }
            );
        });

        it("user can not withdraw more than 100% debtratio with withdrawBothExactAmount", async () => {

            const depositSolely = pow6(20000);
            const depositPool = pow6(10000);

            const depositWETH = toWei("50");

            const withdrawSolely = pow6(5050);
            const withdrawPool = pow6(5050);

            const borrowAmount = toWei("10");

            const transferAmount = pow6(100000);

            await USDC.transfer(
                alice,
                transferAmount,
                {
                    from: owner
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

            const sharesClean = await contracts.lending.getPositionLendingShares(
                nftAlice,
                aWETH.address
            );

            if (sharesClean != 0) {
                await aavePools.withdrawExactShares(
                    nftAlice,
                    WETH.address,
                    sharesClean,
                    {
                        from: alice
                    }
                );
            }

            const soleyAmountClean = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aWETH.address
            );

            if (soleyAmountClean != 0) {
                await aavePools.solelyWithdraw(
                    nftAlice,
                    WETH.address,
                    soleyAmountClean,
                    {
                        from: alice
                    }
                );
            }

            await aavePools.solelyDeposit(
                nftAlice,
                USDC.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await aavePools.depositExactAmount(
                nftAlice,
                USDC.address,
                depositPool,
                {
                    from: alice
                }
            );

            await WETH.deposit(
                {
                    from: alice,
                    value: depositWETH
                }
            );

            await aavePools.depositExactAmount(
                nftBob,
                WETH.address,
                depositWETH,
                {
                    from: alice
                }
            );

            await aavePools.borrowExactAmount(
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
                aavePools.withdrawBothExactAmount(
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
                - Bi(pow6(100));

            const littleLessPool = Bi(withdrawPool)
                - Bi(pow6(100));

            await takeSnapshot();

            aavePools.withdrawBothExactAmount(
                nftAlice,
                USDC.address,
                withdrawPool,
                littleLessSolely,
                {
                    from: alice
                }
            );

            await restoreSnapshot();

            aavePools.withdrawBothExactAmount(
                nftAlice,
                USDC.address,
                littleLessPool,
                withdrawSolely,
                {
                    from: alice
                }
            );
        });

        it("user can not withdraw more than 100% debtratio with withdrawBothExactShares", async () => {

            const depositSolely = pow6(20000);
            const depositPool = pow6(10000);

            const depositWETH = toWei("50");

            const withdrawSolely = pow6(5050);
            const withdrawPool = pow6(5050);

            const borrowAmount = toWei("10");

            const transferAmount = pow6(100000);

            await USDC.transfer(
                alice,
                transferAmount,
                {
                    from: owner
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

            const paybackClean = await contracts.lending.getPositionBorrowShares(
                nftAlice,
                aWETH.address
            );

            if (paybackClean != 0) {
                await aavePools.paybackExactShares(
                    nftAlice,
                    WETH.address,
                    paybackClean,
                    {
                        from: alice
                    }
                );
            }

            const withdrawPoolClean = await contracts.lending.getPositionLendingShares(
                nftAlice,
                aUSDC.address
            );

            const solelyClean = await contracts.lending.getPureCollateralAmount(
                nftAlice,
                aUSDC.address
            );

            if (solelyClean != 0 && withdrawPoolClean != 0) {
                await aavePools.withdrawBothExactShares(
                    nftAlice,
                    USDC.address,
                    withdrawPoolClean,
                    solelyClean,
                    {
                        from: alice
                    }
                );
            }

            const withdrawBobClean = await contracts.lending.getPositionLendingShares(
                nftBob,
                aWETH.address
            );

            if (withdrawBobClean != 0) {
                await aavePools.withdrawExactShares(
                    nftBob,
                    WETH.address,
                    withdrawBobClean,
                    {
                        from: bob
                    }
                );
            }

            await aavePools.depositExactAmount(
                nftAlice,
                USDC.address,
                depositPool,
                {
                    from: alice
                }
            );

            await aavePools.solelyDeposit(
                nftAlice,
                USDC.address,
                depositSolely,
                {
                    from: alice
                }
            );

            await WETH.deposit(
                {
                    from: alice,
                    value: depositWETH
                }
            );

            await aavePools.depositExactAmount(
                nftBob,
                WETH.address,
                depositWETH,
                {
                    from: alice
                }
            );

            await aavePools.borrowExactAmount(
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
                aavePools.withdrawBothExactShares(
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
                - Bi(pow6(100));

            const littleLessPool = Bi(withdrawPool)
                - Bi(pow6(100));

            await takeSnapshot();

            aavePools.withdrawBothExactShares(
                nftAlice,
                USDC.address,
                withdrawPool,
                littleLessSolely,
                {
                    from: alice
                }
            );

            await restoreSnapshot();

            aavePools.withdrawBothExactAmount(
                nftAlice,
                USDC.address,
                littleLessPool,
                withdrawSolely,
                {
                    from: alice
                }
            );
        });
    });

    describe("FeeManager aToken tests", () => {

        before(async () => {

            const transferAmount = pow6(10000000);

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
                alice,
                transferAmount,
                {
                    from: owner
                }
            );

            await USDC.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await WETH.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await USDC.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await WETH.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );
        });

        it("Can claim afee token and convert them correclty into underlaying", async () => {

            const incentiveOwnerA = "0xf69A0e276664997357BF987df83f32a1a3F80944";
            const incentiveOwnerB = "0x8f741ea9C9ba34B5B8Afc08891bDf53faf4B3FE7";

            const depositPool = pow6(15486);

            const borrowAmount = pow6(10000);

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await contracts.feeManager.setAaveFlag(
                aUSDC.address,
                USDC.address
            );

            await aavePools.depositExactAmount(
                nftAlice,
                USDC.address,
                depositPool,
                {
                    from: alice
                }
            );

            await aavePools.borrowExactAmount(
                nftAlice,
                USDC.address,
                borrowAmount,
                {
                    from: alice
                }
            );

            await time.increase(
                10 * SECONDS_IN_DAY
            );

            const shares = await contracts.lending.getPositionBorrowShares(
                nftAlice,
                aUSDC.address
            );

            await aavePools.paybackExactShares(
                nftAlice,
                USDC.address,
                shares,
                {
                    from: alice
                }
            );

            const bal = await USDC.balanceOf(
                contracts.feeManager.address
            );

            await takeSnapshot();

            await contracts.feeManager.claimWiseFees(
                aUSDC.address
            );

            const balAfter1 = await USDC.balanceOf(
                contracts.feeManager.address
            );

            const diff1 = Bi(balAfter1)
                - Bi(bal);

            const mapping1 = await contracts.feeManager.feeTokens(
                USDC.address
            );

            const portionA = await contracts.feeManager.gatheredIncentiveToken(
                incentiveOwnerA,
                USDC.address
            );

            const portionB = await contracts.feeManager.gatheredIncentiveToken(
                incentiveOwnerB,
                USDC.address
            );

            const sum1 = Bi(mapping1)
                + Bi(portionA)
                + Bi(portionB);

            assert.equal(
                sum1.toString(),
                diff1.toString()
            );

            await restoreSnapshot();

            await contracts.feeManager.claimWiseFeesBulk();
        });
    });

    describe("Aave pools liquidation tests", () => {

        beforeEach(async () => {

            const data = await preparationSetup();

            contracts = data.contracts;
            aavePools = data.aavePools;

            await contracts.nft.mintPosition(
                {
                    from: owner
                }
            );

            NFT_ID = await contracts.nft.tokenOfOwnerByIndex(
                owner,
                0
            );
        });

        it("Liquidation works for aToken (as receive)", async () => {

            const depositUSDC = pow6(100);
            const depositDummy = toWei("100000");
            const borrowDummy = toWei("75");

            const percent = toWei("1.1");

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNFT = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const DT = await Token.new(
                18,
                alice,
                {
                    from: owner
                }
            );

            const currentUSDC = await contracts.oracleHub.latestResolver(
                AAVE_USDC_ADDRESS
            );

            // Set Dummy token with current USDC value in ETH
            const dummyFeed = await Chainlink.new(
                currentUSDC,
                18
            );

            await contracts.oracleHub.addOracle(
                DT.address,
                dummyFeed.address,
                []
            );

            // set fake heartbeat since local fork doesn't get updated
            await contracts.oracleHub.setHeartBeat(
                DT.address,
                HUGE_AMOUNT
            );

            await addPools(
                contracts.lending,
                [
                    {
                        allowBorrow: true,
                        poolToken: DT,
                        mulFactor: toWei("1"),
                        collFactor: toWei("0.8"),
                        maxDeposit: HUGE_AMOUNT
                    }
                ]
            );

            await DT.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositUSDC,
                {
                    from: owner,
                    gas: getBigGas(7)
                }
            );

            await contracts.lending.depositExactAmount(
                aliceNFT,
                DT.address,
                depositDummy,
                {
                    from: alice,
                    gas: getBigGas(7)
                }
            );

            await contracts.lending.borrowExactAmount(
                NFT_ID,
                DT.address,
                borrowDummy,
                {
                    from: owner,
                    gas: getBigGas(7)
                }
            );

            // Increase dummy token value by 10% and trigger liquidation
            const increasedValue = Bi(currentUSDC)
                * Bi(percent)
                / Bi(toWei("1"));

            await dummyFeed.setValue(
                increasedValue
            );

            const debtratio = await contracts.security.getLiveDebtRatio(
                NFT_ID
            );

            const paybackShares = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                DT.address
            );

            const halfShares = Bi(paybackShares)
                * Bi(toWei("0.5"))
                / Bi(toWei("1"));

            await contracts.lending.liquidatePartiallyFromTokens(
                NFT_ID,
                aliceNFT,
                DT.address,
                aUSDC.address,
                halfShares,
                {
                    from: alice
                }
            );

            const debtratioEnd = await contracts.security.getLiveDebtRatio(
                NFT_ID
            );

            assert.isAbove(
                parseInt(debtratio),
                parseInt(debtratioEnd)
            );
        });

        it("Liquidation works for aToken (as payback)", async () => {

            const depositUSDC = pow6(100);
            const depositUSDCAlice = pow6(1000000);
            const depositDummyOwner = toWei("1000");
            const depositDummy = toWei("1000000");
            const borrowUSDC = pow6(790);

            const percent = toWei("0.85");

            const transferAmount = pow6(10000);
            const wrapAmount = pow6(1000);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const aliceNFT = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            const DT = await Token.new(
                18,
                alice,
                {
                    from: owner
                }
            );

            const currentUSDC = await contracts.oracleHub.latestResolver(
                AAVE_USDC_ADDRESS
            );

            // Set Dummy token with current USDC value in ETH
            const dummyFeed = await Chainlink.new(
                currentUSDC,
                18
            );

            await contracts.oracleHub.addOracle(
                DT.address,
                dummyFeed.address,
                []
            );

            await contracts.oracleHub.setHeartBeat(
                DT.address,
                HUGE_AMOUNT
            );

            await addPools(
                contracts.lending,
                [
                    {
                        allowBorrow: true,
                        poolToken: DT,
                        mulFactor: toWei("1"),
                        collFactor: toWei("0.8"),
                        maxDeposit: HUGE_AMOUNT
                    }
                ]
            );

            await DT.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositUSDC,
                {
                    from: owner,
                    gas: getBigGas(7)
                }
            );

            await USDC.transfer(
                alice,
                transferAmount,
                {
                    from: owner
                }
            );

            await USDC.approve(
                aavePools.address,
                depositUSDCAlice,
                {
                    from: alice
                }
            );

            await aavePools.depositExactAmount(
                aliceNFT,
                USDC.address,
                depositUSDCAlice,
                {
                    from: alice,
                    gas: getBigGas(7)
                }
            );

            await contracts.lending.depositExactAmount(
                aliceNFT,
                DT.address,
                depositDummy,
                {
                    from: alice,
                    gas: getBigGas(7)
                }
            );

            await DT.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await DT.transfer(
                owner,
                depositDummyOwner,
                {
                    from: alice
                }
            );

            await contracts.lending.depositExactAmount(
                NFT_ID,
                DT.address,
                depositDummyOwner,
                {
                    from: owner,
                    gas: getBigGas(7)
                }
            );

            await aavePools.borrowExactAmount(
                NFT_ID,
                USDC.address,
                borrowUSDC,
                {
                    from: owner,
                    gas: getBigGas(7)
                }
            );

            // Reduce dummy token value by 15% and trigger liquidation
            const reduceValue = Bi(currentUSDC)
                * Bi(percent)
                / Bi(toWei("1"));

            await dummyFeed.setValue(
                reduceValue
            );

            const debtratio = await contracts.security.getLiveDebtRatio(
                NFT_ID
            );

            const paybackShares = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            await USDC.transfer(
                alice,
                transferAmount,
                {
                    from: owner
                }
            );

            await USDC.approve(
                AAVE.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await AAVE.supply(
                USDC.address,
                wrapAmount,
                alice,
                0,
                {
                    from: alice
                }
            );

            await aUSDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            const portionShares = Bi(paybackShares)
                * Bi(toWei("0.40"))
                / Bi(toWei("1"));

            await contracts.lending.liquidatePartiallyFromTokens(
                NFT_ID,
                aliceNFT,
                aUSDC.address,
                DT.address,
                portionShares,
                {
                    from: alice
                }
            );

            const debtratioEnd = await contracts.security.getLiveDebtRatio(
                NFT_ID
            );

            assert.isAbove(
                parseInt(debtratio),
                parseInt(debtratioEnd)
            );
        });
    });
});
