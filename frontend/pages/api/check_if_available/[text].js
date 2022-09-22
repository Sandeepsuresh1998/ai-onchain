import { aiNFTContract as contract} from "../../util/contract";
import hash from "../../util/hash";


export default async function handler(req, res) {
    // Note: Text should be coming in hashed from client side already
    var text = req.query.text
    console.log(typeof(hash))
    var hashedText = hash(text)
    
    let isHashAlreadyTaken = await contract.isTextMinted(hashedText)
    res.status(200).send({
        "is_available": !isHashAlreadyTaken,
    });
}