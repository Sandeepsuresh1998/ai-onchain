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
const contractAddress =  "0x576941204434695E62115a4a57914910B93c7819"

// Create a contract instance
const aiNFTContract = new ethers.Contract(contractAddress, abi, signer)
console.log("Create instance of contract")

// Get the NFT Metadata IPFS URL
const tokenUri = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

// Call mintNFT function
const mintNFT = async () => {
    console.log("Calls set owner")
    let ownerTxn = await aiNFTContract.setOwner(signer.address, hash, tokenUri)
    console.log("Starting to set owner")
    await ownerTxn.wait()
    console.log("Owner set")
    console.log("Starting to mint")
    let nftTxn = await aiNFTContract.mintNFT(hash)
    await nftTxn.wait()
    console.log(`Mint finished! Check it out at: https://goerli.etherscan.io/tx/${nftTxn.hash}`)

}

const checkRegistry = async (hashedTextId) => {
    console.log("calling check registry")
    let hashExists = await aiNFTContract.checkIfTextIdExistsInRegistry(hashedTextId)
    console.log(hashExists);
}

const setOwner = async (owner, textId, passed_token_uri) => {
    console.log("Calling set owner")
    await aiNFTContract.setOwner(owner, textId, passed_token_uri);
    let hashExists = await aiNFTContract.checkIfTextIdExistsInRegistry(textId)
    console.log(hashExists);
}

setOwner(signer.address, hash, tokenUri)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });