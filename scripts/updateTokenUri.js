const hre = require("hardhat");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const updateTokenURI = async () => {
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
    const contractAddress =  "0xA847618e28fB3b9BfDee8894f0b04b224d57de78"

    // Create a contract instance
    const contractInstance = new hre.ethers.Contract(contractAddress, abi, signer)

    const tokenInt = 1;
    const tokenId = hre.ethers.BigNumber.from(tokenInt)
    const newTokenURI = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

    // Worker will fix all tokenURIs, if mismatch
    for (let i = 1; i <= 10000; i++) {
        console.log(`Processing tokenID ${i}`)
        let tokenURI = await contractInstance.tokenURI(hre.ethers.BigNumber.from(i))
        // Convert tokenURI to json
        const resp = await fetch(tokenURI);
        const json = await resp.json();
        const name = json.name

        // Grab tokenID from metadata
        const extractedTokenId = parseInt(name.substring(name.indexOf("#") + 1)).to
        
        // Condition to check for mismatch
        if (i == extractedTokenId) {
            console.log('Skipped tokenID', i)
            continue;
        }

        // Generate new tokenURI with corrected metadata
        const newMetadata = {
            name: `Dream #${i}`,
            description: json.description,
            image: json.image,
        }
        let metadataRes = await fetch("http://localhost:8000/upload_metadata", {
            method: 'post',
            body: JSON.stringify({metadata: newMetadata}),
            headers: {'Content-Type': 'application/json'}
        });
        metadataRes = await metadataRes.json();
        console.log(metadataRes);
        const newTokenURI = baseIpfsUrl + metadataRes.ipfs_uri;
        console.log("New token URI", newTokenURI)

        // Get gas fees for 
        const updateGasFees = contractInstance.estimateGas.updateTokenURI(
            tokenId,
            newTokenURI,
        )

        const overrideOptions = {
            gasLimit: updateGasFees,
        }

        const tx = await contractInstance.updateTokenURI(
            hre.ethers.BigNumber.from(i),
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
