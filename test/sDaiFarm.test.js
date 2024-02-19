const LendingContract = artifacts.require("TesterLending");
const Token = artifacts.require("Token");
const IWETH = artifacts.require("IWETH")
const OracleHub = artifacts.require("TesterWiseOracleHub");
const FeeManager = artifacts.require("FeeManager");
const WiseSecuirty = artifacts.require("WiseSecurity");
const PositionNFT = artifacts.require("PositionNFTs");
const AaveSecondLayer = artifacts.require("AaveHub");
const Aave = artifacts.require("IAave");
const sDaiFarmContract = artifacts.require("SDaiFarm");

const { BN, expectRevert, time } = require('@openzeppelin/test-helpers');
const helpers = require("@nomicfoundation/hardhat-network-helpers");


require("./utils");
require("./test-scenarios");
require("./constants.js");

const wiseOracleAdd = "0xD2cAa748B66768aC9c53A5443225Bdf1365dd4B6";
const wiseLendingAdd = "0x84524bAa1951247b3A2617A843e6eCe915Bb9674";
const aaveHubAdd = "0x4307d8207f2C429f0dCbd9051b5B1d638c3b7fbB"
const nftContract = "0x9D6d4e2AfAB382ae9B52807a4B36A8d2Afc78b07";

const masterAdd = "0x641AD78BAca220C5BD28b51Ce8e0F495e85Fe689";

const megaWhale = "0x55FE002aefF02F77364de339a1292923A15844B8";
const daiWhale = "0xaD0135AF20fa82E106607257143d0060A7eB5cBf";

const AAVE_ADDRESS = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";

const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const CHAINLINK_WETH = "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419";
const AAVE_WETH_ADDRESS = "0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8";

const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const CHAINLINK_USDC = "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6";
const AAVE_USDC_ADDRESS = "0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c";

const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";

const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

contract("sDai power farm tests", async accounts => {

    const [owner, alice, bob, pepe] = accounts;

    let master;
    let sDaiFarm;
    let contracts;

    let DAI;

    takeSnapshot = async () => {
        snapshot = await helpers.takeSnapshot();
    }

    restoreSnapshot = async () => {
        await snapshot.restore();
    }

    getContracts = async () => {

        const Lending = await LendingContract.at(
            wiseLendingAdd
        );

        const AaveHub = await AaveSecondLayer.at(
            aaveHubAdd
        );

        const Oracle = await OracleHub.at(
            wiseOracleAdd
        );

        const NFT = await PositionNFT.at(
            nftContract
        );

        return {
            Lending,
            AaveHub,
            Oracle,
            NFT
        }
    }

    highjackMaster = async (_address) => {

        await helpers.impersonateAccount(
            _address
        );

        return await ethers.getSigner(
            _address
        );
    }

    before(async () => {

        const borrowTokens = [
            DAI_ADDRESS,
            USDC_ADDRESS,
            USDT_ADDRESS
        ];

        DAI = await Token.at(
            DAI_ADDRESS
        );

        contracts = await getContracts();

        master = await highjackMaster(
            masterAdd
        );

        sDaiFarm = await sDaiFarmContract.new(
            contracts.Lending.address,
            borrowTokens,
            toWei("0.95")
        );

        const wiseLending = await ethers.getContractAt(
            "WiseLending",
            contracts.Lending.address
        );

        await wiseLending.connect(master).setVerifiedIsolationPool(
            sDaiFarm.address,
            true
        );

        await getTokenFromWhale(
            {
                Token: Token,
                Helpers: helpers,
                Web3: web3,
                Ethers: ethers,
                whaleAddress: daiWhale,
                user: owner,
                tokenAddress: DAI
            }
        );

        await takeSnapshot();
    });

    describe("sDai power farm test with DAI as borrow token", () => {

        it("User can register farm and is locked for all other interactions", async () => {

            const aavePools = contracts.AaveHub;
            const lending = contracts.Lending;
            const nft = contracts.NFT;

            await DAI.approve(
                aavePools.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await lending.approve(
                sDaiFarm.address,
                DAI.address,
                HUGE_AMOUNT,
                {
                    from: owner
                }
            );

            await nft.mintPosition(
                {
                    from: owner
                }
            );

            const nftOwner = await nft.tokenOfOwnerByIndex(
                owner,
                0
            );

            await sDaiFarm.registrationFarm(
                nftOwner,
                0,
                {
                    from: owner
                }
            );

            await expectRevert(
                lending.depositExactAmountETH(
                    nftOwner,
                    {
                        from: owner,
                        value: toWei("1")
                    }
                ),
                "PositionLocked()"
            );
        });
    });

});