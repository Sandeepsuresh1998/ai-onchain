/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config();
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");

const { API_URL, PRIVATE_KEY, ETHERSCAN_API_KEY, MAINNET_API_URL } = process.env;
module.exports = {
   solidity: "0.8.7",
   defaultNetwork: "goerli",
   networks: {
      hardhat: {},
      mainnet: {
         url: MAINNET_API_URL,
         accounts: [`0x${PRIVATE_KEY}`]
      }
   },
   etherscan: {
      // Your API key for Etherscan
      // Obtain one at https://etherscan.io/
      apiKey: ETHERSCAN_API_KEY
    }
}