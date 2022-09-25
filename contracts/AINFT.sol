//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AINFT is ERC721URIStorage, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    uint256 MINT_PRICE = 0.05 ether;
    uint256 LIST_PRICE = 0.01 ether;

    uint256 MAX_AI_SUPPLY = 10000;
    uint256 MAX_MINTS = 5;

    //Owner of the contract is the one who deploys it 
    constructor() ERC721("AINFT", "AINFT") {}

    // Registry that holds all unique text ids 
    mapping(bytes32 => bool) internal registry;

    //Mapping of tokenId to the text ID of the token
    mapping(uint256 => bytes32) internal tokenIdToTextId;

    //Mapping of number of mints for an address
    mapping(address => uint) public walletMints;

    function contractURI() public pure returns (string memory) {
        return "https://gateway.pinata.cloud/ipfs/QmYiDdgY7Nxsf3fNnCUWNHVtn2fmSBMYYr1QxNS8c5ehEW";
    }

    /*
        Function to mint the NFT
        params:
            address recipient: Address that will receive the newly minted NFT
            string memory tokenURI: TokenURI that will resolve to the NFTs json metadata
            bytes32 textId: The hashed (sha3) of the text input for the model (note this should be normalized)

    */
    function mintToken(address recipient, string memory tokenURI, bytes32 textId) public payable returns (uint) {
        require(msg.value == MINT_PRICE, "beep boop need more eth to mint");
        require(registry[textId] == false, "Text has alredy been claimed");
        require(walletMints[recipient] <= MAX_MINTS, "You have already minted your limit");

        // Create registry entry for the new text id
        registry[textId] = true;

        // Increment the tokenIds count because we are minting a new nft
        _tokenIds.increment();

        // Set the id of the newly minted nft to this
        uint256 currentTokenId = _tokenIds.current();

        if (currentTokenId > MAX_AI_SUPPLY) {
            revert("This NFT project has been sold out");
        }

        // Create mapping of token id to text id
        tokenIdToTextId[currentTokenId] = textId;

        // Actual safe mint call to mint the NFT this is inherited
        _safeMint(recipient, currentTokenId);

        // Set the tokenURI for the NFT
        // TODO: tokenURI validation here (might be expensive)
        _setTokenURI(currentTokenId, tokenURI);

        // Transfer mint fee to wallet
        payable(owner()).transfer(msg.value);

        // Increment number of mints for the user
        uint mints = walletMints[recipient];
        walletMints[recipient] = mints+1;

        return currentTokenId;
    }

    //This function can update the price to list an NFT on the entire marketplace
    function updateListPrice(uint256 _newListPrice) public onlyOwner {
        LIST_PRICE = _newListPrice;
    }

    // Below are all heloer view functions
    function getListPrice() public view returns (uint256) {
        return LIST_PRICE;
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    function isTextMinted(bytes32 textId) public view returns (bool) {
        if (registry[textId] == true) {
            return true;
        }
        return false;
    }
}