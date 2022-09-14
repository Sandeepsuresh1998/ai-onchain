# Deploying Contract
Note: Ensure that you create a .env file with an alchemy key and a wallet's private key

```shell
npx hardhat run --network goerli scripts/deploy.js
```
# Minting an NFT
```shell
node scripts/mint-nft.js
```
If you want to modify the contents of the NFT itself you can update the `tokenURI` variable in
mint-nft.js. 
Note: Please make sure that the mint-nft.js has the right contract address after you deploy 
the contract to goerli.
