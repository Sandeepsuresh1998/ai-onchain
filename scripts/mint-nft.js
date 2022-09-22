require('dotenv').config();
const ethers = require('ethers');
const Web3 = require("web3")
var web3 = new Web3(Web3.givenProvider)

var raw_text = "Sandeep suresh as a baby on a carpet";
var hash = web3.utils.sha3(raw_text)
const mint_price = "0.05"

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
const contractAddress =  "0xB45284B827B99264032b91AcE42d923894bBe51A"

// Create a contract instance
const aiNFTContract = new ethers.Contract(contractAddress, abi, signer)
console.log("Create instance of contract")

// Get the NFT Metadata IPFS URL
const tokenUri = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

// Call mintNFT function
const mintNFT = async () => {
    console.log(signer.address)
    const options = {value: ethers.utils.parseEther(mint_price)}
    let nftTxn = await aiNFTContract.mintToken(signer.address, tokenUri, hash, options)
    await nftTxn.wait()
    console.log(`Mint finished! Check it out at: https://goerli.etherscan.io/tx/${nftTxn.hash}`)
}


mintNFT(hash)
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });