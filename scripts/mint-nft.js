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
const contractAddress =  "0x958F2B9A4dF5A3D8c3B53084CF018cAe6478C616"

// Create a contract instance
const aiNFTContract = new ethers.Contract(contractAddress, abi, signer)
console.log("Create instance of contract")

// Get the NFT Metadata IPFS URL
const tokenUri = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

// Call mintNFT function
const mintNFT = async () => {
    console.log(signer.address)
    let nftTxn = await aiNFTContract.mintToken(signer.address, tokenUri, hash)
    await nftTxn.wait()
    console.log(`Mint finished! Check it out at: https://goerli.etherscan.io/tx/${nftTxn.hash}`)
}

function checkRegistry(hashedTextId) {
    console.log("calling check registry")
    let hashExists = aiNFTContract.checkIfTextIdExistsInRegistry(hashedTextId)
    console.log(hashExists);
}

mintNFT(signer.getAddress(), tokenUri, hash)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });