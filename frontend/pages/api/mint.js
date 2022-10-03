import { aiNFTContract as contract} from "../../util/contract";
const Web3 = require("web3")
var web3 = new Web3(Web3.givenProvider)
const ethers = require('ethers');
import text_to_hash from "../../util/text_to_hash";

export default async function handler(req, res) {

    if (req.method === 'GET') {
        return res.status(400).send("This is a POST");
    }

    console.log(req.body)

    var address = req.body.address;
    var tokenURI = req.body.metadataUrl;
    var textInput = req.body.textInput;

    var hash = text_to_hash(textInput)
    const mint_price = "0.05"

    // Redudant check if hash is already taken
    let isHashAlreadyTaken = await contract.isTextMinted(hash)
    if (isHashAlreadyTaken) {
        res.status(403).send("Hash already taken");
        return
    }
    const options = {value: ethers.utils.parseEther(mint_price)}
    let nftTxn = await contract.mintToken(address, tokenURI, hash, options)
    await nftTxn.wait()

    res.status(200).json({ 
        tx_link: `https://goerli.etherscan.io/tx/${nftTxn.hash}`,
        address: address,
    })
}