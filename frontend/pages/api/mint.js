export default async function handler(req, res) {

    if (req.method === 'GET') {
        return res.status(400).send("This is a POST");
    }
    console.log(req.body);
    var address = req.body.address;
    var tokenURI = req.body.tokenURI;

    const ethers = require('ethers');
    const Web3 = require("web3")

    var web3 = new Web3(Web3.givenProvider)

    var raw_text = "Sandeep suresh as a baby on a carpet with a soccer ball";
    var hash = web3.utils.sha3(raw_text)
    const mint_price = "0.05"

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
    const contractAddress =  "0x9c1E0f73FafA03Bf8Fbda8647a6A87D12afF9CCD"

    // Create a contract instance
    const aiNFTContract = new ethers.Contract(contractAddress, abi, signer)

    // Check if hash is already taken
    let isHashAlreadyTaken = await aiNFTContract.isTextMinted(hash)
    if (isHashAlreadyTaken) {
        console.log("Hash already taken")
        res.status(403).send("Hash already taken");
        return
    }
    
    // Get the NFT Metadata IPFS URL
    const tokenUri = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

    const options = {value: ethers.utils.parseEther(mint_price)}
    let nftTxn = await aiNFTContract.mintToken(signer.address, tokenUri, hash, options)
    await nftTxn.wait()

    res.status(200).json({ 
        tx_link: `https://goerli.etherscan.io/tx/${nftTxn.hash}`,
        address: address,
    })
}