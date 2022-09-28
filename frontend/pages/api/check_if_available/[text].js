import { aiNFTContract as contract} from "../../util/contract";
import text_to_hash from "../../util/text_to_hash";


export default async function handler(req, res) {
    // Note: Text should be coming in hashed from client side already
    var text = req.query.text
    var hashedText = text_to_hash(text)
    
    let isHashAlreadyTaken = await contract.isTextMinted(hashedText)
    res.status(200).send({
        "is_available": !isHashAlreadyTaken,
    });
}