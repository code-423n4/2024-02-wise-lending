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

require("./utils");
require("./constants");
require("./test-scenarios");

contract("Basic NFT tests", async (accounts)  => {

    const [owner, alice, bob, random] = accounts;

    let USDC;
    let contracts;
    let chainlinkUSDC;

    let nftContract;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
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

        nftContract = contracts.nft;

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

        USDC = tokenData.token;
        chainlinkUSDC = tokenData.oracle

        await setupHeartbeatForTests(
            {
                oracleHub: contracts.oracleHub,
                tokens: [
                    USDC
                ],
                chainlinkInterfaces: [
                    chainlinkUSDC
                ]
            }
        );

        await addPools(
            contracts.lending,
            [
                {
                    allowBorrow: true,
                    poolToken: USDC,
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
                }
            ]
        );
    }

    describe("NFT function tests", () => {

        beforeEach(async () => {
            await preparationSetup();
        })

        it("User can mint NFT", async () => {

            const idCounter = await nftContract.totalSupply();

            assert.equal(
                idCounter.toString(),
                "1"
            );

            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            const idCounter2 = await nftContract.totalSupply();

            assert.equal(
                idCounter2.toString(),
                "2"
            );

            const ownerAdd = await nftContract.ownerOf(
                idCounter2 - 1
            );

            assert.equal(
                ownerAdd,
                alice
            );

            const ownedId = await nftContract.tokenOfOwnerByIndex(
                alice,
                0
            );

            assert.equal(
                ownedId.toString(),
                "1"
            );
        });

        it("User can use safeTransferFrom for NFT", async () => {

            await nftContract.mintPosition(
                {
                    from: bob
                }
            );

            await nftContract.safeTransferFrom(
                bob,
                alice,
                1,
                {
                    from: bob
                }
            );

            const anzBob = await nftContract.balanceOf(
                bob
            );

            assert.equal(
                anzBob.toString(),
                "0"
            );

            const ownedId = await nftContract.tokenOfOwnerByIndex(
                alice,
                0
            );

            assert.equal(
                ownedId.toString(),
                "1"
            );
        })

        it("User can use safeTransfer for NFT", async () => {

            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            await nftContract.safeTransferFrom(
                alice,
                bob,
                1,
                {
                    from: alice
                }
            );

            const anzAlice = await nftContract.balanceOf(
                alice
            );

            assert.equal(
                anzAlice.toString(),
                "0"
            );

            const ownedId = await nftContract.tokenOfOwnerByIndex(
                bob,
                0
            );

            assert.equal(
                ownedId.toString(),
                "1"
            );
        })

        it("Reserving position should increase total reserved", async () => {

            const totalReservedBefore = await nftContract.totalReserved();

            assert.equal(
                totalReservedBefore.toString(),
                "0"
            );

            await nftContract.reservePosition(
                {
                    from: alice
                }
            );

            const totalReservedAfter = await nftContract.totalReserved();

            assert.equal(
                totalReservedAfter.toString(),
                "1"
            );

            assert.isAbove(
                parseInt(totalReservedAfter),
                parseInt(totalReservedBefore)
            );

            assert.equal(
                parseInt(totalReservedAfter),
                parseInt(totalReservedBefore) + 1
            );
        });

        it("Reserving position should not increase total supply", async () => {

            const totalySupplyBefore = await nftContract.totalSupply();

            assert.equal(
                totalySupplyBefore.toString(),
                "1"
            );

            await nftContract.reservePosition(
                {
                    from: alice
                }
            );

            const totalySupplyAfter = await nftContract.totalSupply();

            assert.equal(
                totalySupplyAfter.toString(),
                "1"
            );

            assert.equal(
                totalySupplyAfter.toString(),
                totalySupplyBefore.toString()
            );
        });

        it("Reserving position allows to mint reserved nftId", async () => {

            const firstReserver = alice;
            const firstMinter = bob;
            const secondMinter = firstReserver;

            await nftContract.reservePosition(
                {
                    from: firstReserver
                }
            );

            await nftContract.mintPosition(
                {
                    from: firstMinter
                }
            );

            await nftContract.mintPosition(
                {
                    from: secondMinter
                }
            );

            const ownerOf1After = await nftContract.ownerOf(1);
            const ownerOf2After = await nftContract.ownerOf(2);

            assert.equal(
                ownerOf1After,
                firstReserver
            );

            assert.equal(
                ownerOf1After,
                secondMinter
            );

            assert.equal(
                ownerOf2After,
                firstMinter
            );
        });

        it("Minting position should reduce totalReserved", async () => {

            const firstReserver = alice;
            const firstMinter = bob;
            const secondMinter = firstReserver;

            await nftContract.reservePosition(
                {
                    from: firstReserver
                }
            );

            await nftContract.mintPosition(
                {
                    from: firstMinter
                }
            );

            await nftContract.mintPosition(
                {
                    from: secondMinter
                }
            );

            const ownerOf1After = await nftContract.ownerOf(1);
            const ownerOf2After = await nftContract.ownerOf(2);

            assert.equal(
                ownerOf1After,
                firstReserver
            );

            assert.equal(
                ownerOf1After,
                secondMinter
            );

            assert.equal(
                ownerOf2After,
                firstMinter
            );
        });

        it("Minting position should give reserved nftId", async () => {

            const expectedId = "1";
            const expectedOwner = alice;

            await nftContract.reservePosition(
                {
                    from: expectedOwner
                }
            );

            const reservedIdBefore = await nftContract.reserved(
                expectedOwner
            );

            assert.equal(
                reservedIdBefore.toString(),
                expectedId
            );

            await nftContract.mintPosition(
                {
                    from: expectedOwner
                }
            );

            const ownerOf1 = await nftContract.ownerOf(
                expectedId
            );

            assert.equal(
                ownerOf1,
                expectedOwner
            );
        });

        it("should mint reserved nftId if approve is called", async () => {

            const expectedId = "1";
            const expectedOwner = alice;

            await nftContract.reservePosition(
                {
                    from: expectedOwner
                }
            );

            const reservedIdBefore = await nftContract.reserved(
                expectedOwner
            );

            assert.equal(
                reservedIdBefore.toString(),
                expectedId
            );

            await nftContract.approveMint(
                bob,
                expectedId,
                {
                    from: expectedOwner
                }
            );

            const ownerOf1 = await nftContract.ownerOf(
                expectedId
            );

            assert.equal(
                ownerOf1,
                expectedOwner
            );
        });

        it("Minting position should reset reserved mapping", async () => {

            const resetId = "0";
            const expectedId = "1";
            const expectedOwner = alice;

            await nftContract.reservePosition(
                {
                    from: expectedOwner
                }
            );

            const reservedIdBefore = await nftContract.reserved(
                expectedOwner
            );

            assert.equal(
                reservedIdBefore.toString(),
                expectedId
            );

            await nftContract.mintPosition(
                {
                    from: expectedOwner
                }
            );

            const reservedIdAfter = await nftContract.reserved(
                expectedOwner
            );

            assert.equal(
                reservedIdAfter.toString(),
                resetId
            );
        });

        it("Should not be able to reserve twice", async () => {

            const reserver = alice;

            await nftContract.reservePosition(
                {
                    from: reserver
                }
            );

            await nftContract.reservePosition(
                {
                    from: reserver
                }
            );
        });

        it("Should be able to reserve again after mint", async () => {

            const reserver = alice;
            const expectedIdStart = "0";
            const expectedIdBefore = "1";
            const expectedIdAfter = expectedIdStart;
            const expectedIdFinish = "2";

            const reservedIdStart = await nftContract.reserved(
                reserver
            );

            assert.equal(
                reservedIdStart,
                expectedIdStart
            );

            await nftContract.reservePosition(
                {
                    from: reserver
                }
            );

            const reservedIdBefore = await nftContract.reserved(
                reserver
            );

            assert.equal(
                reservedIdBefore,
                expectedIdBefore
            );

            await nftContract.reservePosition(
                {
                    from: reserver
                }
            );

            await nftContract.mintPosition(
                {
                    from: reserver
                }
            );

            const reservedIdAfter = await nftContract.reserved(
                reserver
            );

            assert.equal(
                reservedIdAfter,
                expectedIdAfter
            );

            await nftContract.reservePosition(
                {
                    from: reserver
                }
            );

            const reservedIdFinish = await nftContract.reserved(
                reserver
            );

            assert.equal(
                reservedIdFinish,
                expectedIdFinish
            );
        });

        it("Minting position should be in parallel with reserved", async () => {

            const resetId = "0";

            const expectedId = "1";
            const expectedOwner = alice;

            const secondUser = bob;
            const bobsExpected = "2";

            await nftContract.reservePosition(
                {
                    from: expectedOwner
                }
            );

            const reservedIdBefore = await nftContract.reserved(
                expectedOwner
            );

            assert.equal(
                reservedIdBefore.toString(),
                expectedId
            );

            await nftContract.mintPosition(
                {
                    from: expectedOwner
                }
            );

            const totalReserved = await nftContract.totalReserved();
            const totalSupply = await nftContract.totalSupply();

            const nextExpected = parseInt(totalSupply)
                + parseInt(totalReserved);

            const nextExpectedId = await nftContract.getNextExpectedId();

            assert.equal(
                nextExpected,
                nextExpectedId
            );

            await nftContract.mintPosition(
                {
                    from: secondUser
                }
            );

            const ownerOf1 = await nftContract.ownerOf(
                expectedId
            );

            assert.equal(
                ownerOf1.toString(),
                expectedOwner
            );


            const reservedIdAfter = await nftContract.reserved(
                expectedOwner
            );

            assert.equal(
                reservedIdAfter.toString(),
                resetId
            );

            const ownerOf2 = await nftContract.ownerOf(
                bobsExpected
            );

            assert.equal(
                ownerOf2,
                secondUser
            );

            const ownerOfExpected = await nftContract.ownerOf(
                nextExpected
            );

            assert.equal(
                ownerOfExpected,
                secondUser
            );
        });

        it("Minting position should increase totalSupply", async () => {

            const totalySupplyBefore = await nftContract.totalSupply();

            assert.equal(
                totalySupplyBefore.toString(),
                "1"
            );

            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            const totalySupplyAfter = await nftContract.totalSupply();

            assert.equal(
                totalySupplyAfter.toString(),
                "2"
            );

            assert.isAbove(
                parseInt(totalySupplyAfter),
                parseInt(totalySupplyBefore)
            );
        });

        it("depositExactAmountMint test", async () => {

            const depositAmount = pow6(156);

            await setLastUpdateGlobal(
                [
                    chainlinkUSDC
                ]
            );

            const nftBalAliceBefore = await nftContract.balanceOf(
                alice
            );

            assert.equal(
                nftBalAliceBefore.toString(),
                "0"
            );

            // this performs reservation
            await contracts.lending.depositExactAmountMint(
                USDC.address,
                depositAmount,
                {
                    from: alice
                }
            );

            // it does not mint nft so alice still has 0
            const nftBalAliceReservation = await nftContract.balanceOf(
                alice
            );

            // checkng...
            assert.equal(
                nftBalAliceReservation.toString(),
                "0"
            );

            // this performs actual mint
            await nftContract.mintPosition(
                {
                    from: alice
                }
            );

            // now alice should have 1 NFT
            const nftBalAliceAfter = await nftContract.balanceOf(
                alice
            );

            // checking...
            assert.equal(
                nftBalAliceAfter.toString(),
                "1"
            );

            const totalySupply = await nftContract.totalSupply();

            assert(
                totalySupply.toString(),
                "1"
            );

            const ownerNFT = await nftContract.ownerOf(
                totalySupply - 1
            );

            assert.equal(
                ownerNFT,
                alice
            );

            const shares = Bi(await contracts.lending.getPositionLendingShares(
                1,
                USDC.address
            )) + Bi(1);

            assert.equal(
                shares.toString(),
                depositAmount.toString()
            );
        });
    });
})
