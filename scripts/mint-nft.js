require('dotenv').config();
const ethers = require('ethers');
const Web3 = require("web3")

var web3 = new Web3(Web3.givenProvider)

var raw_text = "Pikachu riding a waving with a thunderbolt";
var hash = web3.utils.sha3(raw_text)

console.log(hash);
// Get Alchemy API Key
const API_KEY = process.env.API_KEY;

// Define an Alchemy Provider
const provider = new ethers.providers.AlchemyProvider('goerli', API_KEY)

//Get contract abi
console.log("Getting contract")
const contract = require("../artifacts/contracts/AINFT.sol/AINFT.json");

// Create a signer
const privateKey = process.env.PRIVATE_KEY
const signer = new ethers.Wallet(privateKey, provider)

// Get contract ABI and address
const abi = contract.abi
const contractAddress =  "0xeD7A288C6d4321ED7C9b6A6c16710fE9b3662373"

// Create a contract instance
const aiNFTContract = new ethers.Contract(contractAddress, abi, signer)
console.log("Create instance of contract")

// Get the NFT Metadata IPFS URL
const tokenUri = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

// Call mintNFT function
const mintNFT = async () => {
    console.log("Calls mintToken")
    let nftTxn = await aiNFTContract.mintToken(signer.address, hash, tokenUri)
    console.log("Starting to mint NFT, waiting for IPFS resolve")
    await nftTxn.wait()
    console.log(`NFT Minted! Check it out at: https://goerli.etherscan.io/tx/${nftTxn.hash}`)
}

const checkRegistry = async (hashedTextId) => {
    let hashExists = await aiNFTContract.checkIfTextIdExistsInRegistry(hashedTextId)
    console.log(hashExists);
}

mintNFT()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });