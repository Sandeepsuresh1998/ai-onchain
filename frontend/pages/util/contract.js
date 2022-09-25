const ethers = require('ethers');
const Web3 = require("web3")
var web3 = new Web3(Web3.givenProvider)
require("dotenv").config()

// Get Alchemy API Key
const API_KEY = process.env.API_KEY;
// Define an Alchemy Provider
const provider = new ethers.providers.AlchemyProvider('goerli', API_KEY)
//Get contract abi
const contract = require("../../../artifacts/contracts/AINFT.sol/AINFT.json");
// Create a signer
const privateKey = process.env.PRIVATE_KEY
const signer = new ethers.Wallet(privateKey, provider)
// Get contract ABI and address
const abi = contract.abi
const contractAddress =  "0x724e0AEcf6Cf6c0f883581609500A9Fd1Afd2661"

// Create a contract instance
export const aiNFTContract = new ethers.Contract(contractAddress, abi, signer)
