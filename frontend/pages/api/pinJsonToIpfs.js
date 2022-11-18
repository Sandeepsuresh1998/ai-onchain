const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK({ pinataJWTKey:
    process.env.PINATA_JWT
});

export default async function handler(_req, res) {
    const response = await pinata.pinJSONToIPFS(
        {
            pinataOptions: {cidVersion: 1},
            pinataMetadata: {name: _req.metadata.description},
            pinataContent: _req.metadata,
        }
    )
    res.status(200).json(
        {
            ipfs_uri: "ipfs://" + response.IpfsHash
        }
    )
}

