require('dotenv').config();
const ethers = require('ethers');

// Get Alchemy API Key
const API_KEY = process.env.API_KEY;

// Define an Alchemy Provider
const provider = new ethers.providers.AlchemyProvider('goerli', API_KEY)

//Get contract abi
const contract = require("../artifacts/contracts/AINFT.sol/AINFT.json");

// Create a signer
const privateKey = process.env.PRIVATE_KEY
const signer = new ethers.Wallet(privateKey, provider)

// Get contract ABI and address
const abi = contract.abi
const contractAddress = '0x1B15519591Ec9a81590be430e770896d2c224411'

// Create a contract instance
const aiNFTContract = new ethers.Contract(contractAddress, abi, signer)

// Get the NFT Metadata IPFS URL
const tokenUri = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

// Call mintNFT function
const mintNFT = async () => {
    let nftTxn = await aiNFTContract.mintToken(signer.address, tokenUri)
    console.log("Starting to mint NFT, waiting for IPFS resolve")
    await nftTxn.wait()
    console.log(`NFT Minted! Check it out at: https://goerli.etherscan.io/tx/${nftTxn.hash}`)
}

mintNFT()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });