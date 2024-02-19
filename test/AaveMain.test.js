const Lending = artifacts.require("TesterLending");
const Token = artifacts.require("Token");
const IWETH = artifacts.require("IWETH")
const OracleHub = artifacts.require("TesterWiseOracleHub");
const helpers = require("@nomicfoundation/hardhat-network-helpers");
const Liquidation = artifacts.require("WiseLiquidation");
const FeeManager = artifacts.require("FeeManager");
const WiseSecuirty = artifacts.require("WiseSecurity");
const PositionNFT = artifacts.require("PositionNFTs");
const AaveSecondLayer = artifacts.require("AaveHub");
const Aave = artifacts.require("IAave");

const {
    // BN,
    expectRevert,
    // time
} = require('@openzeppelin/test-helpers');

const { Bi, advanceTimeAndBlock } = require("./utils");

require("./utils");
require("./test-scenarios");
require("./constants.js");

const megaWhale = "0x55FE002aefF02F77364de339a1292923A15844B8";
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

contract("Aave second layer", async accounts => {

    const [owner, alice, bob, pepe] = accounts;

    const HUGE_AMOUNT = Bi(toWei("10000"));

    const MULTIPLICATION_FACTOR = toWei("1");
    const COLLATERAL_FACTOR = toWei("0.8");

    const depositAmount = 40003;
    const borrowAmount = 3000;
    const toWithdrawAmount = 1020;

    let ownerOf;
    let NFT_ID;

    let USDC
    let aUSDC;
    let AAVE;
    let WETH;
    let aWETH;

    let startBlock;

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
                AAVE_WETH_ADDRESS
            ],
            [
                CHAINLINK_USDC,
                CHAINLINK_WETH
            ],
            [
                [], []
            ]
        );

        // set fake heartbeat since local fork doesn't get updated
        await contracts.oracleHub.setHeartBeat(
            AAVE_WETH_ADDRESS,
            HUGE_AMOUNT
        );

        // set fake heartbeat since local fork doesn't get updated
        await contracts.oracleHub.setHeartBeat(
            AAVE_USDC_ADDRESS,
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

        aWETH = await Token.at(
            AAVE_WETH_ADDRESS
        );

        WETH = await IWETH.at(
            WETH_ADDRESS
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

    describe("Aave direct tests", () => {

        it("Aave USDC Deposit returns aUSDC tokens", async () => {

            const REFERRAL_CODE = 0;
            const ADDRESS_ON_BEHALF = owner;

            const depositAmount = pow6(1000);

            await USDC.approve(
                AAVE.address,
                depositAmount,
                {
                    from: owner
                }
            );

            await AAVE.supply(
                USDC.address,
                depositAmount,
                ADDRESS_ON_BEHALF,
                REFERRAL_CODE
            );

            const datas = await getLastEvent(
                "Transfer",
                aUSDC,
                startBlock
            );

            assert.equal(
                datas.value.toString(),
                depositAmount.toString()
            );
        });
    });

    describe("Aave Second layer contract tests USDC/aUSDC", () => {

        it("should able to use depositExactAmount correctly", async () => {

            const fetchAaveToken = await aavePools.aaveTokenAddress(
                USDC.address
            );

            assert.equal(
                fetchAaveToken.toString(),
                aUSDC.address
            );

            const userLendingSharesBefore = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            assert.equal(
                "0",
                userLendingSharesBefore.toString()
            );

            await contracts.lending.syncManually(
                aUSDC.address
            );

            const sharesReturn = await aavePools.depositExactAmount.call(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            const usdcOwnerBalanceBefore = await USDC.balanceOf(
                owner
            );

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            const usdcOwnerBalanceAfter = await USDC.balanceOf(
                owner
            );

            const usdcTokenDifferenceOwner = Bi(usdcOwnerBalanceBefore)
                - Bi(usdcOwnerBalanceAfter);

            assert.equal(
                owner,
                ownerOf
            );

            const userLendingSharesAfter = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            assert.equal(
                userLendingSharesAfter.toString(),
                sharesReturn.toString()
            );

            assert.equal(
                usdcTokenDifferenceOwner.toString(),
                depositAmount.toString()
            );
        });

        // skip reason: function depositExactShares() is DEPRECATED!
        it.skip("should be possible to use depositExactShares correctly", async () => {

            const depositShareAmount = 1111;

            await contracts.lending.syncManually(
                aUSDC.address
            );

            const amountSharesBeforeOwner = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            const amountReturn = await aavePools.depositExactShares.call(
                NFT_ID,
                USDC.address,
                depositShareAmount
            );

            const balanceBefore = await USDC.balanceOf(
                owner
            );

            await aavePools.depositExactShares(
                NFT_ID,
                USDC.address,
                depositShareAmount
            );

            const amountSharesAfterOwner = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            const amountSharesDifferenceOwner = Bi(amountSharesAfterOwner)
                - Bi(amountSharesBeforeOwner);

            const balanceAfter = await USDC.balanceOf(
                owner
            );

            const balDifference = Bi(balanceBefore)
                - Bi(balanceAfter);

            assert.equal(
                balDifference.toString(),
                amountReturn.toString()
            );

            assert.equal(
                amountSharesDifferenceOwner.toString(),
                depositShareAmount.toString()
            );

        });

        it("should support borrowExactAmount / check if approval works", async () => {

            await aavePools.withdrawExactShares(
                NFT_ID,
                USDC.address,
                await contracts.lending.getPositionLendingShares(
                    NFT_ID,
                    aUSDC.address
                )
            );

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            await contracts.lending.collateralizeDeposit(
                NFT_ID,
                aUSDC.address
            );

            await expectRevert.unspecified(
                aavePools.borrowExactAmount(
                    NFT_ID,
                    USDC.address,
                    depositAmount
                )
            );

            const amountUSDCTokensBefore = await USDC.balanceOf(
                owner
            );

            await contracts.lending.syncManually(
                aUSDC.address
            );

            const borrowSharesSimulated = await aavePools.borrowExactAmount.call(
                NFT_ID,
                USDC.address,
                borrowAmount
            );

            await aavePools.borrowExactAmount(
                NFT_ID,
                USDC.address,
                borrowAmount
            );

            const borrowSharesActual = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            assert.equal(
                borrowSharesSimulated.toString(),
                borrowSharesActual.toString()
            );

            const amountUSDCTokensAfter = await USDC.balanceOf(
                owner
            );

            const tokenDiffBorrowed = Bi(amountUSDCTokensAfter)
                - Bi(amountUSDCTokensBefore);

            assert.equal(
                tokenDiffBorrowed.toString(),
                borrowAmount.toString()
            );
        });

        // skip reaosn: borrowExactShares IS DEPRECATED!
        it.skip("should support borrowExactShares / check if approval works", async () => {

            const borrowShareAmount = 2341;

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            await contracts.lending.collateralizeDeposit(
                NFT_ID,
                aUSDC.address
            );

            const amountaUSDCBorrowSharesBefore = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            const contractaUSDCBalanceBefore = await aUSDC.balanceOf(
                lending.address
            );

            await contracts.lending.syncManually(
                aUSDC.address
            );

            const borrowAmountSimulated = await aavePools.borrowExactShares.call(
                NFT_ID,
                USDC.address,
                borrowShareAmount
            );

            await aavePools.borrowExactShares(
                NFT_ID,
                USDC.address,
                borrowShareAmount
            );

            const contractaUSDCBalanceAfter = await aUSDC.balanceOf(
                lending.address
            );

            const aUSDCDifferenceBorrowed = Bi(contractaUSDCBalanceBefore)
                - Bi(contractaUSDCBalanceAfter);

            assert.equal(
                aUSDCDifferenceBorrowed.toString(),
                borrowAmountSimulated.toString()
            );

            const amountaUSDCBorrowSharesAfter = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            const tokenBorrowSharesDifference = Bi(amountaUSDCBorrowSharesAfter)
                - Bi(amountaUSDCBorrowSharesBefore);

            assert.equal(
                tokenBorrowSharesDifference.toString(),
                borrowShareAmount.toString()
            );
        });

        it("only owner of position can borrow and withdraw", async () => {

            const depositAmount = pow6(1000);
            const borrowAmount = pow6(111);
            const withdrawAmount = pow6(222);

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount,
                {
                    from: owner
                }
            );

            await expectRevert(
                aavePools.withdrawExactAmount(
                    NFT_ID,
                    USDC.address,
                    withdrawAmount,
                    {
                        from: alice
                    }
                ),
                "NotOwner()"
            );

            await expectRevert(
                aavePools.borrowExactAmount(
                    NFT_ID,
                    USDC.address,
                    borrowAmount,
                    {
                        from: bob
                    }
                ),
                "NotOwner()"
            );
        });

        it("should be possible to use paybackExactAmount correctly", async () => {

            const paybackAmount = 897;

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            await aavePools.borrowExactAmount(
                NFT_ID,
                USDC.address,
                borrowAmount
            );

            const contractBalanceAaveUSDCBefore = await aUSDC.balanceOf(
                contracts.lending.address
            );

            const borrowSharesBeforePayback = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            await aavePools.paybackExactAmount(
                NFT_ID,
                USDC.address,
                paybackAmount,
                {
                    gas: getBigGas(7)
                }
            );

            const borrowSharesAfterPayback = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            const contractBalanceAaveUSDCAfter = await aUSDC.balanceOf(
                contracts.lending.address
            );

            const tokenDifference = Bi(contractBalanceAaveUSDCAfter)
                - Bi(contractBalanceAaveUSDCBefore);

            const borrowSharesReduction = Bi(borrowSharesBeforePayback)
                - Bi(borrowSharesAfterPayback);

            const paybackFromShares = await contracts.lending.paybackAmount(
                aUSDC.address,
                borrowSharesReduction
            );

            const diffAmount = Bi(paybackFromShares)
                - Bi(paybackAmount)

            const diffAmountBool = await inBound(
                abs(diffAmount),
                aUSDC
            );

            assert.equal(
                diffAmountBool.toString(),
                "true"
            );

            const diffToken2 = Bi(tokenDifference)
                - Bi(paybackAmount);

            const diffToken2Bool = await inBound(
                abs(diffToken2),
                aUSDC
            );

            assert.equal(
                diffToken2Bool.toString(),
                "true"
            );
        });

        it("should be able to use paybackExactShares correctly", async () => {

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            await aavePools.borrowExactAmount(
                NFT_ID,
                USDC.address,
                borrowAmount
            );

            const borrowSharesBeforePayback = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            const contractaUSDCBalanceBefore = await aUSDC.balanceOf(
                contracts.lending.address
            );

            const paybackAmountSimulated = await aavePools.paybackExactShares.call(
                NFT_ID,
                USDC.address,
                borrowSharesBeforePayback
            );

            await aavePools.paybackExactShares(
                NFT_ID,
                USDC.address,
                borrowSharesBeforePayback
            );

            const contractaUSDCBalancAfter = await aUSDC.balanceOf(
                contracts.lending.address
            );

            const borrowSharesAfterPayback = await contracts.lending.getPositionBorrowShares(
                owner,
                aUSDC.address
            );

            const contractaUSDCDifference = Bi(contractaUSDCBalancAfter)
                - Bi(contractaUSDCBalanceBefore);

            assert.equal(
                borrowSharesAfterPayback.toString(),
                "0"
            );

            assert.isAbove(
                parseInt(5),
                parseInt(abs(Bi(contractaUSDCDifference) - Bi(paybackAmountSimulated)))
            );
        });

        it("should be able to withdrawExactAmount correctly", async () => {

            const withdrawAmount = depositAmount;

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            const sharesBefore = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            await contracts.lending.syncManually(
                aUSDC.address
            );

            const withdrawnShares = await aavePools.withdrawExactAmount.call(
                NFT_ID,
                USDC.address,
                withdrawAmount
            );

            const usdcOwnerBalanceBefore = await USDC.balanceOf(
                owner
            );

            await aavePools.withdrawExactAmount(
                NFT_ID,
                USDC.address,
                withdrawAmount
            );

            const usdcOwnerBalanceAfter = await USDC.balanceOf(
                owner
            );

            /*
            const usdcBalWahle = await USDC.balanceOf(
                megaWhale
            );
            */

            const tokenDifference = usdcOwnerBalanceAfter
                .sub(usdcOwnerBalanceBefore);

            const sharesAfter = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            const sharesDifference = Bi(sharesBefore)
                - Bi(sharesAfter);

            assert.equal(
                sharesDifference.toString(),
                withdrawnShares.toString()
            );

            assert.equal(
                tokenDifference.toString(),
                withdrawAmount.toString()
            );

            await USDC.transfer(
                megaWhale,
                withdrawAmount,
                {
                    from: owner
                }
            );
        });

        it("should be able to use WithdrawExactShares correctly", async () => {

            const sharesToWithdraw = 567;

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            const usdcOwnerBalanceBefore  = await USDC.balanceOf(
                owner
            );

            const lendingSharesBefore = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            const tokensWithdrawenSimulated = await aavePools.withdrawExactShares.call(
                NFT_ID,
                USDC.address,
                sharesToWithdraw
            );

            await aavePools.withdrawExactShares(
                NFT_ID,
                USDC.address,
                sharesToWithdraw
            );

            const lendingSharesAfter = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aUSDC.address
            );

            const lendingSharesDifference = Bi(lendingSharesBefore)
                - Bi(lendingSharesAfter);

            const usdcOwnerBalanceAfter = await USDC.balanceOf(
                owner
            );

            const tokenDifference = Bi(usdcOwnerBalanceAfter)
                - Bi(usdcOwnerBalanceBefore);

            assert.equal(
                tokenDifference.toString(),
                tokensWithdrawenSimulated.toString()
            );

            assert.equal(
                lendingSharesDifference.toString(),
                sharesToWithdraw.toString()
            );
        });

        it("should not allow to withdraw more than 100% debtratio", async () => {

            await restoreSnapshot();

            const depositAmount2 = pow6(1000);
            const depositAmount = pow6(100);
            const borrowAmount = pow6(50);
            const withdrawAmount = pow6(38);

            await contracts.nft.mintPosition(
                {
                    from: alice
                }
            );

            const nftAlice = await contracts.nft.tokenOfOwnerByIndex(
                alice,
                0
            );

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount,
                {
                    gas: getBigGas(7)
                }
            );

            await USDC.transfer(
                alice,
                depositAmount2
            );

            await USDC.approve(
                aavePools.address,
                depositAmount2,
                {
                    from: alice
                }
            );

            await aavePools.depositExactAmount(
                nftAlice,
                USDC.address,
                depositAmount2,
                {
                    gas: getBigGas(7),
                    from: alice
                }
            );

            await aavePools.borrowExactAmount(
                NFT_ID,
                USDC.address,
                borrowAmount,
                {
                    from: owner
                }
            );

            await expectRevert(
                aavePools.withdrawExactAmount(
                    NFT_ID,
                    USDC.address,
                    withdrawAmount,
                    {
                        from: owner
                    }
                ),
                'ResultsInBadDebt()'
            );

            const littleLess = Bi(withdrawAmount)
                    - Bi(pow6(5));

            await aavePools.withdrawExactAmount(
                NFT_ID,
                USDC.address,
                littleLess,
                {
                    from: owner
                }
            );
        });

        it("should not allow to borrow more than 100% debtratio", async () => {

            await restoreSnapshot();

            const depositAmount = pow6(100);
            const borrowAmount = pow6(81);

            await aavePools.depositExactAmount(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            await expectRevert(
                aavePools.borrowExactAmount(
                    NFT_ID,
                    USDC.address,
                    borrowAmount,
                    {
                        from: owner
                    }
                ),
                'ResultsInBadDebt()'
            );

            const littleLess = Bi(borrowAmount)
                - Bi(pow6(5))
                - Bi(10);

            await aavePools.borrowExactAmount(
                NFT_ID,
                USDC.address,
                littleLess,
                {
                    from: owner,
                    gas: getBigGas(7)
                }
            );
        })
    });

    describe("Aave Second layer using payable functions", () => {

        it("should be possible to use depositExactAmountETH correctly", async () => {

            const userLendingSharesBefore = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            assert.equal(
                "0",
                userLendingSharesBefore.toString()
            );

            const sharesReturn = await aavePools.depositExactAmountETH.call(
                NFT_ID,
                {
                    value: depositAmount
                }
            );

            const aWETHcontractTokensBefore = await aWETH.balanceOf(
                contracts.lending.address
            );

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    value: depositAmount
                }
            );

            const aWETHcontractTokensAfter = await aWETH.balanceOf(
                contracts.lending.address
            );

            const aWETHTokenDifference = Bi(aWETHcontractTokensAfter)
                - Bi(aWETHcontractTokensBefore);

            assert.equal(
                aWETHTokenDifference.toString(),
                depositAmount.toString()
            );

            const userLendingSharesAfter = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            assert.equal(
                userLendingSharesAfter.toString(),
                sharesReturn.toString()
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );
        });

        it("should allow to perform withdrawExactAmountETH call", async () => {

            const positionBorrowSharesaUSDC = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aUSDC.address
            );

            await aavePools.paybackExactShares(
                NFT_ID,
                USDC.address,
                positionBorrowSharesaUSDC
            );

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    value: depositAmount
                }
            );

            const sharesBefore = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            const withdrawnShares = await aavePools.withdrawExactAmountETH.call(
                NFT_ID,
                toWithdrawAmount,
                {
                    gas: getBigGas(7)
                }
            );

            await contracts.lending.syncManually(
                aWETH.address
            );

            const aWETHcontractTokensBefore = await aWETH.balanceOf(
                contracts.lending.address
            );

            await aavePools.withdrawExactAmountETH(
                NFT_ID,
                toWithdrawAmount,
                {
                    gas: getBigGas(8)
                }
            );

            const aWETHcontractTokensAfter = await aWETH.balanceOf(
                contracts.lending.address
            );

            const aWETHTokenDifference = Bi(aWETHcontractTokensBefore)
                - Bi(aWETHcontractTokensAfter);

            const sharesAfter = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            const ethDifferenceShares = Bi(sharesBefore)
                - Bi(sharesAfter);

            assert.equal(
                ethDifferenceShares.toString(),
                withdrawnShares.toString()
            );

            assert.equal(
                toWithdrawAmount.toString(),
                aWETHTokenDifference.toString()
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );
        });

        it("should allow to use WithdrawExactSharesETH function", async () => {

            const sharesToWithdraw = 125;

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    value: depositAmount,
                    gas: getBigGas(7)
                }
            );

            const aWETHBalanceBeforeContract  = await aWETH.balanceOf(
                contracts.lending.address
            );

            const sharesBefore = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            console.log("sharesBefore", sharesBefore.toString());

            const tokensWithdrawenSimulated = await aavePools.withdrawExactSharesETH.call(
                NFT_ID,
                Bi(sharesToWithdraw) - Bi(2)
            );

            await aavePools.withdrawExactSharesETH(
                NFT_ID,
                Bi(sharesToWithdraw) - Bi(2),
                {
                    gas: getBigGas(9)
                }
            );

            const sharesAfter = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            const aWETHBalanceAfterContract  = await aWETH.balanceOf(
                contracts.lending.address
            );

            const ethDifferenceShares = Bi(sharesBefore)
                - Bi(sharesAfter) + Bi(2);

            const tokenDifference = Bi(aWETHBalanceBeforeContract)
                - Bi(aWETHBalanceAfterContract);

            const difference = tokenDifference-(Bi(tokensWithdrawenSimulated));
            assert(
                difference == Bi(1) || difference == Bi(0)
            );

            assert.equal(
                ethDifferenceShares.toString(),
                sharesToWithdraw.toString()
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );
        });

        it("should support borrowExactAmountETH functionality", async () => {

            const wethAmountToGet = toWei("2");

            await WETH.deposit(
                {
                    value: wethAmountToGet
                }
            );

            await aavePools.withdrawExactShares(
                NFT_ID,
                WETH.address,
                await contracts.lending.getPositionLendingShares(
                    NFT_ID,
                    aWETH.address
                )
            );

            await advanceTimeAndBlock(
                1 * SECONDS_IN_DAY
            )

            await aavePools.withdrawExactShares(
                NFT_ID,
                USDC.address,
                await contracts.lending.getPositionLendingShares(
                    NFT_ID,
                    aUSDC.address
                )
            );

            await aavePools.depositExactAmount(
                NFT_ID,
                WETH.address,
                depositAmount
            );

            await contracts.lending.collateralizeDeposit(
                NFT_ID,
                aWETH.address
            );

            await expectRevert.unspecified(
                aavePools.borrowExactAmount(
                    NFT_ID,
                    WETH.address,
                    depositAmount
                )
            );

            /*
            await contracts.lending.syncManually(
                aWETH.address
            );
            */

            const borrowSharesSimulated = await aavePools.borrowExactAmountETH.call(
                NFT_ID,
                borrowAmount
            );

            const aWETHBalanceBeforeContract = await aWETH.balanceOf(
                contracts.lending.address
            );

            await aavePools.borrowExactAmountETH(
                NFT_ID,
                borrowAmount,
                {
                    gas: getBigGas(8)
                }
            );

            const aWETHBalanceAfterContract  = await aWETH.balanceOf(
                contracts.lending.address
            );

            const borrowSharesActual = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aWETH.address
            );

            const tokenDifference = Bi(aWETHBalanceBeforeContract)
                - Bi(aWETHBalanceAfterContract);

            const difference = abs(
                Bi(borrowSharesSimulated) - Bi(borrowSharesActual)
            );

            assert.isTrue(
                parseInt(difference) <= 1
            );

            const tokenDifferenceAbs = abs(
                Bi(tokenDifference) - Bi(borrowAmount)
            );

            assert.isTrue(
                parseInt(tokenDifferenceAbs) <= 3
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );
        });

        // skip reason: borrowExactSharesETH is DEPRECATED!
        it.skip("should support borrowExactSharesETH functionality", async () => {

            const wethAmountToGet = toWei("2");
            const borrowSharesETH = 1;

            await WETH.deposit(
                {
                    value: wethAmountToGet
                }
            );

            await aavePools.depositExactAmount(
                NFT_ID,
                WETH.address,
                depositAmount
            );

            await contracts.lending.collateralizeDeposit(
                NFT_ID,
                aWETH.address
            );

            const aWETHcontractTokensBefore = await aWETH.balanceOf(
                contracts.lending.address
            );

            /*
            await lending.syncManually(
                aWETH.address
            );
            */

            const sharesBefore = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aWETH.address
            );

            await aavePools.borrowExactSharesETH(
                NFT_ID,
                borrowSharesETH
            );

            const aWETHcontractTokensAfter = await aWETH.balanceOf(
                contracts.lending.address
            );

            const transferData = await getLastEvent(
                "Withdrawal",
                WETH,
                startBlock
            );

            const sharesAfter = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aWETH.address
            );

            const sharesDifference = Bi(sharesAfter)
                - Bi(sharesBefore);

            const borrowAmountActual = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aWETH.address
            );

            assert.equal(
                transferData.wad,
                (Bi(aWETHcontractTokensBefore) - Bi(aWETHcontractTokensAfter)).toString()
            );

            assert.equal(
                sharesDifference.toString(),
                borrowSharesETH.toString()
            );
        });

        it("should support paybackExactAmountETH with less than 100 percent", async () => {

            const smallPaybackAmount = 100;

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    value: depositAmount
                }
            );

            await aavePools.borrowExactAmountETH(
                NFT_ID,
                borrowAmount,
                {
                    gas: getBigGas(8)
                }
            );

            await aavePools.paybackExactAmountETH(
                NFT_ID,
                {
                    value: smallPaybackAmount
                }
            );

            const borrowSharesAfterPayback = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aWETH.address
            );

            const transferData = await getLastEvent(
                "Deposit",
                WETH,
                startBlock
            );

            assert.notEqual(
                borrowSharesAfterPayback.toString(),
                "0"
            );

            assert.equal(
                smallPaybackAmount.toString(),
                transferData.wad.toString()
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );
        });

        it("test default for sending eth to contract", async () => {

            const sendValue = toWei("0.99");
            const depositAmount = toWei("1");
            const borrowAmount = toWei("0.2");

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    value: depositAmount,
                    gas: getBigGas(7)
                }
            );

            await aavePools.borrowExactAmountETH(
                NFT_ID,
                borrowAmount,
                {
                    gas: getBigGas(7)
                }
            );

            await aavePools.paybackExactAmountETH(
                NFT_ID,
                {
                    value: sendValue
                }
            );

            ownerShares = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            const shares = Bi(ownerShares)
                - Bi(toWei("0.9"));

            await aavePools.withdrawExactSharesETH(
                NFT_ID,
                shares,
                {
                    gas: getBigGas(8)
                }
            );

            const balOwnerBefore = await web3.eth.getBalance(
                owner
            );

            const balanceaETHLendingContractBefore = await web3.eth.getBalance(
                contracts.lending.address
            );

            const txHash = await web3.eth.sendTransaction(
                {
                    from: pepe,
                    to: aavePools.address,
                    value: sendValue
                }
            );

            const balanceaETHLendingContractAfter = await web3.eth.getBalance(
                contracts.lending.address
            );

            const balOwnerAfter = await web3.eth.getBalance(
                owner
            );

            const diffOwner = Bi(balOwnerAfter)
                - Bi(balOwnerBefore);

            assert.equal(
                diffOwner.toString(),
                sendValue.toString()
            );

            const differenceaETH = Bi(balanceaETHLendingContractAfter)
                - Bi(balanceaETHLendingContractBefore);

            assert.equal(
                differenceaETH.toString(),
                "0"
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );

            await contracts.nft.safeTransferFrom(
                owner,
                pepe,
                NFT_ID
            );

            const lendingshares = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );
            const sharesWithdraw = Bi(lendingshares)
                - Bi(5);

            await aavePools.withdrawExactSharesETH(
                NFT_ID,
                sharesWithdraw,
                {
                    from: pepe
                }
            );

            const lendingsharesAfterWithdraw = await contracts.lending.getPositionLendingShares(
                NFT_ID,
                aWETH.address
            );

            assert.equal(
                "5",
                lendingsharesAfterWithdraw.toString()
            );

            await restoreSnapshot();
        });

        it("should support paybackExactAmountETH 100 percent method", async () => {

            const depositAmount = toWei("10");
            const borrowAmount = toWei("1");

            await aavePools.depositExactAmountETH(
                NFT_ID,
                {
                    value: depositAmount
                }
            );

            const getCurrentOwner = await contracts.nft.ownerOf(
                NFT_ID
            );

            if (getCurrentOwner == pepe) {
                await contracts.nft.safeTransferFrom(
                    pepe,
                    owner,
                    NFT_ID,
                    {
                        from: pepe,
                        gas: getBigGas(7)
                    }
                );
            }

            await aavePools.borrowExactAmountETH(
                NFT_ID,
                borrowAmount,
                {
                    gas: getBigGas(9)
                }
            );

            const borrowSharesBeforePayback = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aWETH.address
            );

            assert.isAbove(
                parseInt(borrowSharesBeforePayback),
                parseInt(0)
            );

            const paybackETHAmount = toWei("10");

            await aavePools.paybackExactAmountETH(
                NFT_ID,
                {
                    value: paybackETHAmount
                }
            );

            const borrowSharesAfterPayback = await contracts.lending.getPositionBorrowShares(
                NFT_ID,
                aWETH.address
            );

            assert.equal(
                borrowSharesAfterPayback.toString(),
                "1"
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );
        });
    });

    // DEPRECATED SINCE SOLELYDEPOSIT NOT NECESSARY FOR AAVE POOLS , FUNCTIONALITY GOT REMOVED
    describe.skip("Aave Second layer using solelyDeposit/solelyWithdraw", () => {

        it("should be able to use solelyDeposit correctly", async () => {

            const usdcOwnerBalanceBefore = await USDC.balanceOf(
                owner
            );

            await aavePools.solelyDeposit(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            const usdcOwnerBalanceAfter = await USDC.balanceOf(
                owner
            );

            const usdcTokenDifferenceOwner = Bi(usdcOwnerBalanceBefore)
                - Bi(usdcOwnerBalanceAfter);

            assert.equal(
                usdcTokenDifferenceOwner.toString(),
                depositAmount.toString()
            );
        });

        it("should be able to use solelyWithdraw correctly", async () => {

            const getCurrentOwner = await contracts.nft.ownerOf(
                NFT_ID
            );

            if (getCurrentOwner == pepe) {
                await contracts.nft.safeTransferFrom(
                    pepe,
                    owner,
                    NFT_ID,
                    {
                        from: pepe,
                        gas: getBigGas(7)
                    }
                );
            }

            await aavePools.solelyDeposit(
                NFT_ID,
                USDC.address,
                depositAmount
            );

            const usdcOwnerBalanceBefore = await USDC.balanceOf(
                owner
            );

            await aavePools.solelyWithdraw(
                NFT_ID,
                USDC.address,
                toWithdrawAmount
            );

            const usdcOwnerBalanceAfter = await USDC.balanceOf(
                owner
            );

            const tokenDifference = Bi(usdcOwnerBalanceAfter)
                - Bi(usdcOwnerBalanceBefore);

            assert.equal(
                tokenDifference.toString(),
                toWithdrawAmount.toString()
            );
        });

        it("should be able to use solelyDepositETH correctly", async () => {

            const depositValue = toWei("1");

            await aavePools.solelyDepositETH(
                NFT_ID,
                {
                    value: depositValue
                }
            );

            const transferData = await getLastEvent(
                "Deposit",
                WETH,
                startBlock
            );

            assert.equal(
                depositValue,
                transferData.wad.toString()
            );

            await leftOverETHBalanceCheck(
                aavePools.address
            );
        });

        it("should execute solelyWithdrawETH properly", async () => {

            const withdrawValue = toWei("1");
            const depositValue = toWei("2");

            const getCurrentOwner = await contracts.nft.ownerOf(
                NFT_ID
            );

            if (getCurrentOwner == pepe) {
                await contracts.nft.safeTransferFrom(
                    pepe,
                    owner,
                    NFT_ID,
                    {
                        from: pepe
                    }
                );
            }

            await aavePools.solelyDepositETH(
                NFT_ID,
                {
                    value: depositValue
                }
            );

            await aavePools.solelyWithdrawETH(
                NFT_ID,
                withdrawValue
            );

            const transferData = await getLastEvent(
                "Withdrawal",
                WETH,
                startBlock
            );

            assert.equal(
                transferData.wad.toString(),
                withdrawValue.toString()
            );
        });
    });
});
