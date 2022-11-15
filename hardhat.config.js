/**
* @type import('hardhat/config').HardhatUserConfig
*/
require('dotenv').config({path:__dirname+'/.env'})
require("@nomiclabs/hardhat-ethers");
require("@nomiclabs/hardhat-etherscan");
const { API_URL, PRIVATE_KEY, ETHERSCAN_API_KEY } = process.env;

console.log(process.env.API_URL)
module.exports = {
   solidity: "0.8.7",
   defaultNetwork: "mainnet",
   networks: {
      hardhat: {},
      mainnet: {
         url: API_URL,
         accounts: [PRIVATE_KEY]
      }
   },
   etherscan: {
      // Your API key for Etherscan
      // Obtain one at https://etherscan.io/
      apiKey: ETHERSCAN_API_KEY
    }
}