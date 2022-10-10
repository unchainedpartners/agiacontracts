require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-web3");
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-solhint");
require("hardhat-deploy");
require('solidity-coverage')


/**
 * @type import('hardhat/config').HardhatUserConfig
 */
 module.exports = {
  networks: {
    hardhat: {
      
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // mainnet: {
    //   url: "https://rpc.ankr.com/eth",
    //   chainId: 1,
    //   accounts:["PRIVATE_KEY"],
    // },
  },
  etherscan: {
    // apiKey: {
    //   mainnet: "ETHERSCAN_API_KEY",
    // }
  },
  solidity: {
    version: "0.8.14",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};
