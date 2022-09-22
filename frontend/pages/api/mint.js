import { aiNFTContract as contract} from "../util/contract";
const Web3 = require("web3")
var web3 = new Web3(Web3.givenProvider)
const ethers = require('ethers');

export default async function handler(req, res) {

    if (req.method === 'GET') {
        return res.status(400).send("This is a POST");
    }

    var address = req.body.address;
    var tokenURI = req.body.tokenURI;

    // TODO: Replacing hashing of text on client_side, ideally would like to gate this with some validation as well
    var raw_text = "Sandeep suresh as a baby on a carpet";
    var hash = web3.utils.sha3(raw_text)
    const mint_price = "0.05"

    // Redudant check if hash is already taken
    let isHashAlreadyTaken = await contract.isTextMinted(hash)
    if (isHashAlreadyTaken) {
        console.log("Hash already taken")
        res.status(403).send("Hash already taken");
        return
    }
    
    // Get the NFT Metadata IPFS URL
    const tokenUri = "https://gateway.pinata.cloud/ipfs/QmaHupJ2t2g2dwMWbqU2jiwH14D9FVC5aSQaXFKfVVYJb7"

    const options = {value: ethers.utils.parseEther(mint_price)}
    let nftTxn = await contract.mintToken(address, tokenUri, hash, options)
    await nftTxn.wait()

    res.status(200).json({ 
        tx_link: `https://goerli.etherscan.io/tx/${nftTxn.hash}`,
        address: address,
    })
}