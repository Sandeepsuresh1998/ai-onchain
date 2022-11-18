const pinataSDK = require('@pinata/sdk');
const pinata = new pinataSDK({ pinataJWTKey:
    process.env.PINATA_JWT,
});

const https = require('https')


export default async function handler(_req, res) {
    const request = https.request(_req.body.image_url)
    request.end();
    request.on('response', function(readableStream) {
        const response = pinata.pinFileToIPFS(readableStream).then(response => {
            res.status(200).json(
                {
                    ipfs_uri: "ipfs://" + response.IpfsHash
                }
            )
        })
    })

}

