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

contract("Test for security checks", async accounts  => {

    const [owner, alice, bob, chad, random] = accounts;

    let USDC;
    let WETH;
    let WBTC;
    let chainlinkUSDC;
    let chainlinkWETH;
    let chainlinkWBTC;

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
                value: pow8(1),
                dec: 8,
                user: alice
            }
        );

        USDC = tokenData.token;
        chainlinkUSDC = tokenData.oracle

        WETH = tokenData2.token;
        chainlinkWETH = tokenData2.oracle;

        WBTC = tokenData3.token;
        chainlinkWBTC = tokenData3.oracle;

        await setupHeartbeatForTests(
            {
                oracleHub: contracts.oracleHub,
                tokens: [
                    USDC,
                    WETH,
                    WBTC
                ],
                chainlinkInterfaces: [
                    chainlinkUSDC,
                    chainlinkWETH,
                    chainlinkWBTC
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
                    collFactor: toWei("0.65"),
                    maxDeposit: HUGE_AMOUNT
                },
                {
                    allowBorrow: true,
                    poolToken: WBTC,
                    mulFactor: toWei("0.1"),
                    collFactor: toWei("0.65"),
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
                    Token: WBTC,
                    contract: contracts.lending,
                    user: alice,
                    type: "normal"
                }
            ]
        );

        return contracts
    }

    wrapDepositAmountMint = async (_poolToken, _amount, _caller, _state = false) => {
        await contracts.lending.depositExactAmountMint(
            _poolToken.address,
            _amount,
            {
                from: _caller
            }
        );

        const nftId = await contracts.nft.tokenOfOwnerByIndex(
            _caller,
            0
        );

        return nftId;
    }

    wrapDepositAmount = async (_nftId, _poolToken, _amount, _caller, _state = false) => {
        await contracts.lending.depositExactAmount(
            _nftId,
            _poolToken.address,
            _amount,
            {
                from: _caller
            }
        );
    }

    wrapWithdrawAmount = async (_nftId, _poolToken, _amount, _caller) => {
        await contracts.lending.withdrawExactAmount(
            _nftId,
            _poolToken.address,
            _amount,
            {
                from: _caller
            }
        );
    }

    wrapBorrowAmount = async (_nftId, _poolToken, _amount, _caller) => {
        await contracts.lending.borrowExactAmount(
            _nftId,
            _poolToken.address,
            _amount,
            {
                from: _caller
            }
        );
    }

    wrapPaybackAmount = async (_nftId, _poolToken, _amount, _caller) => {
        await contracts.lending.paybackExactAmount(
            _nftId,
            _poolToken.address,
            _amount,
            {
                from: _caller
            }
        );
    }

    wrapPaybackAll = async (_nftId, _poolToken, _caller) => {

        const shares = await contracts.lending.getPositionBorrowShares(
            _nftId,
            _poolToken.address
        );

        await contracts.lending.paybackExactShares(
            _nftId,
            _poolToken.address,
            shares,
            {
                from: _caller
            }
        );
    }

    describe("Heartbeat tests from wiseSecurity", () => {

        beforeEach( async () => {
            contracts = await preparationSetup();
        });

        it("User can't deposit token with no heartbeat", async () => {

            const depositAmount = toWei("1");
            const depositAmount2 = pow8(1);

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC]
            );

            const nftAlice = await wrapDepositAmountMint(
                WBTC,
                depositAmount2,
                alice,
                true
            );

            await expectRevert(
                wrapDepositAmount(
                    nftAlice,
                    WETH,
                    depositAmount,
                    alice,
                    true
                ),
                "ChainlinkDead()"
            );

            await setLastUpdateGlobal(
                [chainlinkWETH]
            );

            await wrapDepositAmount(
                nftAlice,
                WETH,
                depositAmount,
                alice,
                true
            );
        });

        it("User can't borrow any token when one collateral token has no heartbeat", async () => {

            const depositAmount = toWei("1");
            const depositAmount2 = pow8(1);
            const depositAmount3 = pow6(1);

            const tinyBorrow = 1000;

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC, chainlinkWETH]
            );

            const nftAlice = await wrapDepositAmountMint(
                WETH,
                depositAmount,
                alice,
                true
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await wrapDepositAmount(
                nftBob,
                USDC,
                depositAmount3,
                alice,
                true
            );

            await wrapDepositAmount(
                nftAlice,
                WBTC,
                depositAmount2,
                alice,
                true
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    USDC,
                    tinyBorrow,
                    alice
                ),
                "ChainlinkDead()"
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    WETH,
                    tinyBorrow,
                    alice
                ),
                "ChainlinkDead()"
            );

            await wrapBorrowAmount(
                nftBob,
                WETH,
                tinyBorrow,
                bob
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftBob,
                    WBTC,
                    tinyBorrow,
                    bob
                ),
                "ChainlinkDead()"
            );
        });

        it("User can use wise lending normally when paid back dead token", async () => {

            const depositAmount = toWei("10");
            const depositAmount2 = pow8(10);
            const depositAmount3 = pow6(10);

            const tinyBorrow = 1000;
            const tinyWithdraw = 1000;

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC, chainlinkWETH]
            );

            const nftAlice = await wrapDepositAmountMint(
                WETH,
                depositAmount,
                alice,
                true
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await wrapDepositAmount(
                nftBob,
                USDC,
                depositAmount3,
                alice,
                true
            );

            await wrapDepositAmount(
                nftBob,
                WBTC,
                depositAmount2,
                alice,
                true
            );

            await wrapBorrowAmount(
                nftAlice,
                WBTC,
                tinyBorrow,
                alice,
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWETH]
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    USDC,
                    tinyBorrow,
                    alice
                ),
                "ChainlinkDead()"
            );

            await wrapPaybackAll(
                nftAlice,
                WBTC,
                alice
            );

            await wrapBorrowAmount(
                nftAlice,
                USDC,
                tinyBorrow,
                alice
            );

            await wrapWithdrawAmount(
                nftAlice,
                WETH,
                tinyWithdraw,
                alice
            );
        });

        it("User can withdraw dead token when paid back debt", async () => {

            const depositAmount = toWei("10");
            const depositAmount2 = pow8(10);
            const depositAmount3 = pow6(10);

            const tinyBorrow = 1000;
            const tinyWithdraw = 1000;

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC, chainlinkWETH]
            );

            const nftAlice = await wrapDepositAmountMint(
                WETH,
                depositAmount,
                alice,
                true
            );

            await wrapDepositAmount(
                nftAlice,
                USDC,
                depositAmount3,
                alice,
                true
            );

            await wrapDepositAmount(
                nftAlice,
                WBTC,
                depositAmount2,
                alice,
                true
            );

            await wrapBorrowAmount(
                nftAlice,
                WBTC,
                tinyBorrow,
                alice,
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            await setLastUpdateGlobal(
                [chainlinkWBTC, chainlinkWETH]
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    USDC,
                    tinyBorrow,
                    alice
                ),
                "ChainlinkDead()"
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    WETH,
                    tinyBorrow,
                    alice
                ),
                "ChainlinkDead()"
            );

            await expectRevert(
                wrapWithdrawAmount(
                    nftAlice,
                    USDC,
                    tinyWithdraw,
                    alice
                ),
                "OpenBorrowPosition()"
            );

            await wrapPaybackAll(
                nftAlice,
                USDC,
                alice
            );

            const shares = await contracts.lending.getPositionLendingShares(
                nftAlice,
                USDC.address
            );

            await contracts.lending.withdrawExactShares(
                nftAlice,
                USDC.address,
                shares,
                {
                    from: alice
                }
            );

            await wrapBorrowAmount(
                nftAlice,
                WETH,
                tinyBorrow,
                alice
            );

            await wrapWithdrawAmount(
                nftAlice,
                WBTC,
                tinyWithdraw,
                alice
            );
        });
    });

    describe("Blacklist token tests from wiseSecurity", () => {

        beforeEach( async () => {
            contracts = await preparationSetup();
        });

        it("User can't deposit blacklisted token", async () => {

            const depositAmount = toWei("1");
            const depositAmount2 = pow8(1);

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC, chainlinkWETH]
            );

            const nftAlice = await wrapDepositAmountMint(
                WBTC,
                depositAmount2,
                alice,
                true
            );

            await wrapDepositAmount(
                nftAlice,
                WETH,
                depositAmount,
                alice,
                true
            );

            await contracts.security.setBlacklistToken(
                WETH.address,
                true
            );

            await expectRevert(
                wrapDepositAmount(
                    nftAlice,
                    WETH,
                    depositAmount,
                    alice,
                    true
                ),
                "Blacklisted()"
            );
        });

        it("User can't borrow any token when one collateral token is blacklisted", async () => {

            const depositAmount = toWei("1");
            const depositAmount2 = pow8(1);
            const depositAmount3 = pow6(1);

            const tinyBorrow = 1000;

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC, chainlinkWETH]
            );

            const nftAlice = await wrapDepositAmountMint(
                WETH,
                depositAmount,
                alice,
                true
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await wrapDepositAmount(
                nftBob,
                USDC,
                depositAmount3,
                alice,
                true
            );

            await wrapDepositAmount(
                nftAlice,
                WBTC,
                depositAmount2,
                alice,
                true
            );

            contracts.security.setBlacklistToken(
                WBTC.address,
                true
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    USDC,
                    tinyBorrow,
                    alice
                ),
                "Blacklisted()"
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    WETH,
                    tinyBorrow,
                    alice
                ),
                "Blacklisted()"
            );

            await wrapBorrowAmount(
                nftBob,
                WETH,
                tinyBorrow,
                bob
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftBob,
                    WBTC,
                    tinyBorrow,
                    bob
                ),
                "Blacklisted()"
            );
        });

        it("User can use wise lending normally when paid back blacklisted token", async () => {

            const depositAmount = toWei("10");
            const depositAmount2 = pow8(10);
            const depositAmount3 = pow6(10);

            const tinyBorrow = 1000;
            const tinyWithdraw = 1000;

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC, chainlinkWETH]
            );

            const nftAlice = await wrapDepositAmountMint(
                WETH,
                depositAmount,
                alice,
                true
            );

            await contracts.nft.mintPosition(
                {
                    from: bob
                }
            );

            const nftBob = await contracts.nft.tokenOfOwnerByIndex(
                bob,
                0
            );

            await wrapDepositAmount(
                nftBob,
                USDC,
                depositAmount3,
                alice,
                true
            );

            await wrapDepositAmount(
                nftBob,
                WBTC,
                depositAmount2,
                alice,
                true
            );

            await wrapBorrowAmount(
                nftAlice,
                WBTC,
                tinyBorrow,
                alice,
            );

            await contracts.security.setBlacklistToken(
                WBTC.address,
                true
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    USDC,
                    tinyBorrow,
                    alice
                ),
                "Blacklisted()"
            );

            await wrapPaybackAll(
                nftAlice,
                WBTC,
                alice
            );

            await wrapBorrowAmount(
                nftAlice,
                USDC,
                tinyBorrow,
                alice
            );

            await wrapWithdrawAmount(
                nftAlice,
                WETH,
                tinyWithdraw,
                alice
            );
        });

        it("User can withdraw blacklisted token when paid back debt", async () => {

            const depositAmount = toWei("10");
            const depositAmount2 = pow8(10);
            const depositAmount3 = pow6(10);

            const tinyBorrow = 1000;
            const tinyWithdraw = 1000;

            await setLastUpdateGlobal(
                [chainlinkUSDC, chainlinkWBTC, chainlinkWETH]
            );

            const nftAlice = await wrapDepositAmountMint(
                WETH,
                depositAmount,
                alice,
                true
            );

            await wrapDepositAmount(
                nftAlice,
                USDC,
                depositAmount3,
                alice,
                true
            );

            await wrapDepositAmount(
                nftAlice,
                WBTC,
                depositAmount2,
                alice,
                true
            );

            await wrapBorrowAmount(
                nftAlice,
                WBTC,
                tinyBorrow,
                alice,
            );

            await contracts.security.setBlacklistToken(
                USDC.address,
                true
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    USDC,
                    tinyBorrow,
                    alice
                ),
                "Blacklisted()"
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    WETH,
                    tinyBorrow,
                    alice
                ),
                "Blacklisted()"
            );

            await expectRevert(
                wrapWithdrawAmount(
                    nftAlice,
                    USDC,
                    tinyWithdraw,
                    alice
                ),
                "OpenBorrowPosition()"
            );

            await wrapPaybackAll(
                nftAlice,
                USDC,
                alice
            );

            const shares = await contracts.lending.getPositionLendingShares(
                nftAlice,
                USDC.address
            );

            await contracts.lending.withdrawExactShares(
                nftAlice,
                USDC.address,
                shares,
                {
                    from: alice
                }
            );

            await wrapBorrowAmount(
                nftAlice,
                WETH,
                tinyBorrow,
                alice
            );

            await wrapWithdrawAmount(
                nftAlice,
                WBTC,
                tinyWithdraw,
                alice
            );
        });
    });

    describe("Liquidation tests for blacklist and heartbeat", () => {

        beforeEach( async () => {

            contracts = await preparationSetup();

            await WETH.approve(
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

            await USDC.approve(
                contracts.lending.address,
                HUGE_AMOUNT,
                {
                    from: alice
                }
            );

            await WETH.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );

            await USDC.approve(
                contracts.liquidation.address,
                HUGE_AMOUNT,
                {
                    from: bob
                }
            );
        });

        it("Position with dead token can't get liquidated", async () => {

            const deposit = toWei("200");
            const deposit2 = pow6(500);
            const borrow = pow6(120);

            const liquidationPercentage = toWei("0.5");

            const transferAmount = pow6(100000);

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
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await chainlinkUSDC.setValue(
                pow8(1)
            );

            await USDC.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                nftAlice,
                WETH,
                deposit,
                alice,
                true
            );

            await wrapDepositAmount(
                nftBob,
                USDC,
                deposit2,
                alice
            );

            await wrapBorrowAmount(
                nftAlice,
                USDC,
                borrow,
                alice
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                nftAlice,
                USDC.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await chainlinkWETH.setValue(
                pow8(0.75)
            );

            await time.increase(
                SECONDS_IN_DAY
            );

            await expectRevert(
                contracts.liquidation.liquidatePartiallyFromTokens(
                    nftAlice,
                    nftBob,
                    USDC.address,
                    WETH.address,
                    paybackShares,
                    {
                        from: bob
                    }
                ),
                "ChainlinkDead()"
            );

            await setLastUpdateGlobal(
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await contracts.liquidation.liquidatePartiallyFromTokens(
                nftAlice,
                nftBob,
                USDC.address,
                WETH.address,
                paybackShares,
                {
                    from: bob
                }
            );
        });

        it("Position with blacklisted token but no dead token can still get liquidated", async () => {

            const deposit = toWei("200");
            const deposit2 = pow6(500);
            const borrow = pow6(120);

            const tinyBorrow = 1000;

            const liquidationPercentage = toWei("0.5");

            const transferAmount = pow6(100000);

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
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await chainlinkUSDC.setValue(
                pow8(1)
            );

            await USDC.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                nftAlice,
                WETH,
                deposit,
                alice,
                true
            );

            await wrapDepositAmount(
                nftBob,
                USDC,
                deposit2,
                alice
            );

            await wrapBorrowAmount(
                nftAlice,
                USDC,
                borrow,
                alice
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                nftAlice,
                USDC.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await chainlinkWETH.setValue(
                pow8(0.75)
            );

            await contracts.security.setBlacklistToken(
                USDC.address,
                true,
                {
                    from: owner
                }
            );

            await expectRevert(
                wrapBorrowAmount(
                    nftAlice,
                    USDC,
                    tinyBorrow,
                    alice
                ),
                "Blacklisted()"
            );

            await contracts.liquidation.liquidatePartiallyFromTokens(
                nftAlice,
                nftBob,
                USDC.address,
                WETH.address,
                paybackShares,
                {
                    from: bob
                }
            );
        });

        it("Update badDebt from fee manager can used with blacklisted token", async () => {

            const deposit = toWei("30000");
            const deposit2 = pow6(100000);
            const borrow = pow6(19000);

            const tinyBorrow = 1000;

            const liquidationPercentage = toWei("0.5");

            const transferAmount = pow6(100000);

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
                [
                    chainlinkWETH,
                    chainlinkUSDC
                ]
            );

            await chainlinkWETH.setValue(
                pow8(1)
            );

            await chainlinkUSDC.setValue(
                pow8(1)
            );

            await USDC.transfer(
                bob,
                transferAmount,
                {
                    from: alice
                }
            );

            await wrapDepositAmount(
                nftAlice,
                WETH,
                deposit,
                alice,
                true
            );

            await wrapDepositAmount(
                nftBob,
                USDC,
                deposit2,
                alice
            );

            await wrapBorrowAmount(
                nftAlice,
                USDC,
                borrow,
                alice
            );

            const borrowShares = await contracts.lending.getPositionBorrowShares(
                nftAlice,
                USDC.address
            );

            const paybackShares = Bi(borrowShares)
                * Bi(liquidationPercentage)
                / Bi(toWei("1"));

            await chainlinkWETH.setValue(
                pow8(0.60)
            );

            await contracts.liquidation.liquidatePartiallyFromTokens(
                nftAlice,
                nftBob,
                USDC.address,
                WETH.address,
                paybackShares,
                {
                    from: bob
                }
            );

            const aliceBadDebt = await contracts.feeManager.badDebtPosition(
                nftAlice
            );

            assert.isAbove(
                parseInt(aliceBadDebt),
                parseInt(0)
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

            await contracts.security.setBlacklistToken(
                USDC.address,
                true,
                {
                    from: owner
                }
            );

            await contracts.feeManager.updatePositionCurrentBadDebt(
                nftAlice
            );

            const aliceBadDebt2 = await contracts.feeManager.badDebtPosition(
                nftAlice
            );

            assert.isAbove(
                parseInt(aliceBadDebt2),
                parseInt(aliceBadDebt)
            );
        });
    })
});