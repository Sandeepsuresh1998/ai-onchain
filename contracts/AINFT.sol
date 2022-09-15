//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract AINFT is ERC721URIStorage{
    
    address payable _owner;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;

    uint256 MINT_PRICE = 0.05 ether;
    uint256 LIST_PRICE = 0.01 ether;

    uint256 MAX_AI_SUPPLY = 10000000;

    //Owner of the contract is the one who deploys it 
    constructor() ERC721("AINFT", "AINFT") {
        _owner = payable(msg.sender);
    }

    // Struct for the NFT itself with all the different attributes we want to have
    struct ListedToken {
        uint256 tokenID;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }

    //the event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 indexed tokenId,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    // Mapping token id to metadata for a token
    mapping(uint256 => ListedToken) private idToListedToken;

    // Registry that holds all unique text ids 
    mapping(bytes32 => bool) internal registry;

    //Mapping of tokenId to the text ID of the token
    mapping(uint256 => bytes32) internal tokenIdToTextId;

    /*
        Function to mint the NFT
        params:
            address recipient: Address that will receive the newly minted NFT
            string memory tokenURI: TokenURI that will resolve to the NFTs json metadata
            bytes32 textId: The hashed (sha3) of the text input for the model (note this should be normalized)

    */
    function mintToken(address recipient, string memory tokenURI, bytes32 textId) public payable returns (uint) {
        // TODO: Add a mint price
        // TODO: Add a cap for number of mints allowed
        require(msg.value == MINT_PRICE, "Send enough ether to mint");
        require(registry[textId] == false, "Text has alredy been claimed");

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
        // TODO: tokenURI validation here (might be expensive)?
        _setTokenURI(currentTokenId, tokenURI);

        payable(_owner).transfer(msg.value);

        return currentTokenId;
    }

    /*
        Function to list an NFT for sale. It will also cost some small fee to actually list the NFT. 
        params:
            uint256: The token id of the NFT that owner is trying to sell
            uint256: Price in ether you'd like to list your art for
    */
    function createListedToken(uint256 tokenId, uint256 price) private {
        //Make sure the sender sent enough ETH to pay for listing
        require(msg.value == LIST_PRICE, "Please send enough ETH for list price");

        //Price sanity check
        require(price > 0, "Make sure the price isn't negative");

        // Create mapping of tokenId is now listed
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)), //When you list give up ownership to smart contract itself
            payable(msg.sender),
            price,
            true
        );

        _transfer(msg.sender, address(this), tokenId);

        //Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            address(this),
            msg.sender,
            price,
            true
        );
    }


    /*
        Function to actually execute the sale of the NFT to another address
    */
    function executeSale(uint256 tokenId) public payable {
        uint price = idToListedToken[tokenId].price;
        address seller = idToListedToken[tokenId].seller;
        require(msg.value == price, "Please submit the asking price");

        
        idToListedToken[tokenId].currentlyListed = false; //Note example contracts keep this as true not sure why
        idToListedToken[tokenId].owner = payable(msg.sender);
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold.increment();

        // Update registry for new owner
        

        _transfer(address(this), msg.sender, tokenId);

        approve(address(this), tokenId);

        payable(_owner).transfer(LIST_PRICE);
        payable(seller).transfer(msg.value);

        //TODO: Emit a event for item sold
    }

    //This function can update the price to list an NFT on the entire marketplace
    function updateListPrice(uint256 _newListPrice) public payable {
        require(_owner == msg.sender, "Only owner can update the listing price");
        LIST_PRICE = _newListPrice;
    }

    // Below are all heloer view functions
    function getListPrice() public view returns (uint256) {
        return LIST_PRICE;
    }

    function getLatestIdToListedToken() public view returns (ListedToken memory) {
        uint256 currentTokenId = _tokenIds.current();
        return idToListedToken[currentTokenId];
    }

    // Retrieve data for NFT in the front end
    function getListedForTokenId(uint256 tokenId) public view returns (ListedToken memory) {
        return idToListedToken[tokenId];
    }

    function getCurrentToken() public view returns (uint256) {
        return _tokenIds.current();
    }

    //Get all NFTs that we have created on the marketplace
    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds.current();
        ListedToken[] memory tokens = new ListedToken[](nftCount);

        uint currentIndex = 0;

        for(uint i = 0; i < nftCount; i++) 
        {
            uint currentId = i+1; //Why not just represent this in i?
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex +=1;
        }

        return tokens;
    }

    function getMyNFTs() public view returns(ListedToken[] memory) {
        uint totalItemCount = _tokenIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        //This is iterating to find a count of NFTs relevant to the owner itself, should prob be a map
        for(uint i=0; i < totalItemCount; i++)
        {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i = 0; i < totalItemCount; i++) {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                uint currentId = i+1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1; //Can't we check for a break here and quit early?
            }
        }

        return items;
    }
}