const hre = require("hardhat");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { DefaultService } = require("../frontend/backend-client");
const { OpenAPI } = require("../frontend/backend-client");

const getTokenIdFromName = (name) => {
    const tokenId = name.substring(name.indexOf("#") + 1)
    console.log("Number: " + 1)
}


const updateTokenURI = async () => {

    // Set OpenAI base
    OpenAPI.BASE = "http://localhost:8000";

    // Base IPFS URL
    const baseIpfsUrl = "https://gateway.pinata.cloud/ipfs/";

    // Get Alchemy API Key
    const API_KEY = process.env.API_KEY;

    // Define an Alchemy Provider
    const provider = new hre.ethers.providers.AlchemyProvider('goerli', API_KEY)

    //Get contract abi
    const contract = require("../artifacts/contracts/SyntheticDreams.sol/SyntheticDreams.json");

    // Create a signer
    const privateKey = process.env.PRIVATE_KEY
    const signer = new hre.ethers.Wallet(privateKey, provider)

    // Get contract ABI and address
    const abi = contract.abi
    const contractAddress =  "0x64caFaf56173EF3e6bCFb3ad1Ec7B9314bfb0eB2"

    // Create a contract instance
    const contractInstance = new hre.ethers.Contract(contractAddress, abi, signer)

    const tokenInt = 1;
    const tokenId = hre.ethers.BigNumber.from(tokenInt)
    const newTokenURI = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

    // Worker will fix all tokenURIs, if mismatch
    for (let i = 2; i <= 10000; i++) {
        let tokenURI = await contractInstance.tokenURI(hre.ethers.BigNumber.from(i))
        console.log(tokenURI)
        // Convert tokenURI to json
        const resp = await fetch(tokenURI);
        const json = await resp.json();
        console.log(json)
        console.log(json.name)

        // Condition to check for mismatch
        if (i == 1) {
            continue;
        }

        const name = json.name
        // Grab tokenID from metadata
        const extractedTokenId = parseInt(name.substring(name.indexOf("#") + 1)).to
        
        // If the tokenID and the extracted tokenId in name is equal move on
        if (i == extractedTokenId) {
            console.log("They are the same no need to worry")
            continue;
        }

        // Generate new tokenURI with corrected metadata
        const newMetadata = {
            name: `Dream #${i}`,
            description: json.description,
            image: json.image,
        }

        const metadataRes = await DefaultService.uploadMetadataToIpfsUploadMetadataPost({
            metadata: metadata,
        });
        const newTokenURI = baseIpfsUrl + metadataRes.ipfs_uri

        console.log("New token URI")

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
            overrideOptions,
        )
        await tx.wait()
        console.log(`Update the tokenURI, https://goerli.etherscan.io/tx/${tx.hash}`)


    } 
    
}

updateTokenURI().then(() => process.exit(0))
.catch((error) => {
    console.error(error);
    process.exit(1);
});

