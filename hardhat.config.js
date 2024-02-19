/** @type import('hardhat/config').HardhatUserConfig */

require("@nomiclabs/hardhat-truffle5");
require("hardhat-gas-reporter");
require("@nomiclabs/hardhat-ethers");
require("@nomicfoundation/hardhat-foundry");

module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 1337,
            allowUnlimitedContractSize: true,
            blockGasLimit: 100000000,
            callGasLimit: 100000000,
            forking: {
                url: "https://eth-mainnet.g.alchemy.com/v2/PUT_YOUR_ALCHEMY_KEY",
                blockNumber: 17990216, // <= block from 25.08.23;
                //blockNumber: 17612373, <= used for previouse testing
                enabled: true
            }
        },
        live: {
            chainId: 1337,
            allowUnlimitedContractSize: true,
            blockGasLimit: 100000000,
            callGasLimit: 100000000,
            url: "http://127.0.0.1:9545/"
        }
    },
    solidity: {
        version: "0.8.24",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            },
            evmVersion: "shanghai"
        }
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts"
    },
    mocha: {
        timeout: 4000000
    }
}
