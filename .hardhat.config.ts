// environment variables
import 'dotenv/config';

// import path resolution
import 'tsconfig-paths/register';

// hardhat config
import {HardhatUserConfig} from 'hardhat/config';

// hardhat
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-waffle';
import '@typechain/hardhat';
import 'hardhat-abi-exporter';
import 'hardhat-deploy';
// import 'hardhat-gas-reporter';
import 'hardhat-spdx-license-identifier';

const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.7',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  abiExporter: {
    flat: true,
    clear: true,
  },
  spdxLicenseIdentifier: {
    overwrite: false,
    runOnCompile: true,
  },
  mocha: {
    timeout: 200000
  },
  namedAccounts: {
    deployer: 0,
    token: '',
  },
  typechain: {
    outDir: './types',
  },
  external: {
    contracts: [
      {
        artifacts: "../node_modules/@ohfinance/oh-contracts/artifacts"
      }
    ]
  },
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    hardhat: {
      live: false,
      chainId: 1,
      forking: {
        // enabled: false,
        blockNumber: 13489900,
        url: process.env.MAINNET_NODE_URL || '',
      },
    },
    rinkeby: {
      url: process.env.RINKEBY_NODE_URL || '',
      chainId: 4,
      accounts: process.env.TESTNET_DEPLOYER_KEY ? [`0x${process.env.TESTNET_DEPLOYER_KEY}`] : [],
    },
    kovan: {
      url: process.env.KOVAN_NODE_URL || '',
      chainId: 42,
      accounts: process.env.TESTNET_DEPLOYER_KEY ? [`0x${process.env.TESTNET_DEPLOYER_KEY}`] : [],
    },
    mainnet: {
      url: process.env.MAINNET_NODE_URL || '',
      chainId: 1,
      accounts:
        process.env.DEPLOYER_KEY
          ? [`0x${process.env.DEPLOYER_KEY}`]
          : [],
      gasPrice: 200000000000,
    },
  }
}

export default config