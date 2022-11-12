require('dotenv').config();

// Get Alchemy API Key
const API_KEY = process.env.API_KEY;

// Define an Alchemy Provider
const provider = new ethers.providers.AlchemyProvider('goerli', API_KEY)

//Get contract abi
const contract = require("../artifacts/contracts/SyntheticDreams.sol/SyntheticDreams.json");

// Create a signer
const privateKey = process.env.PRIVATE_KEY
const signer = new ethers.Wallet(privateKey, provider)

// Get contract ABI and address
const abi = contract.abi
const contractAddress =  "0x64caFaf56173EF3e6bCFb3ad1Ec7B9314bfb0eB2"

// Create a contract instance
const contractInstance = new ethers.Contract(contractAddress, abi, signer)

const tokenInt = 1;
const tokenId = ethers.BigNumber.from(tokenInt)
const newTokenURI = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

const updateTokenURI = async () => {
    // Get gas fees for 
    const updateGasFees = contractInstance.estimateGas.updateTokenURI(
        tokenId,
        newTokenURI,
    )

    const overrideOptions = {
        gasLimit: updateGasFees,
    }

    const tx = await contractInstance.updateTokenURI(
        tokenId,
        newTokenURI,
        overrideOptions
    )
    await tx.wait()
    console.log(`Update the tokenURI, https://goerli.etherscan.io/tx/${tx.hash}`)
}

updateTokenURI().then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});

