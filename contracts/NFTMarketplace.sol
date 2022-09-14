//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract AINFTMarketplace is ERC721URIStorage {
    
    address payable owner;

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;
    Counters.Counter private _itemsSold;
    
    uint256 listPrice = 0.01 ether;

    constructor() ERC721("AINFTMarketplace", "AINFT") {
        owner = payable(msg.sender);
    }

    // Struct for the NFT itself with all the different attributes we want to have
    struct ListedToken {
        uint256 tokenID;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
    }

    // Mapping token id to metadata for a token
    mapping(uint256 => ListedToken) private idToListedToken;

    //This function can update the price to list an NFT on the entire marketplace
    function updateListPrice(uint256 _newListPrice) public payable {
        require(owner == msg.sender, "Only owner can update the listing price");
        listPrice = _newListPrice;
    }

    function getListPrice() public view returns (uint256) {
        return listPrice;
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


    //Note this functionality implies that when an NFT is created it is automatically listed as eell
    function createToken(string memory tokenURI) public payable returns (uint) {
        require(msg.value == listPrice, "Send enough ether to list");
        require(price > 0, "Make sure price is negative");

        _tokenIds.increment();
        uint256 currentTokenId = _tokenIds.current();
        _safeMint(msg.sender, currentTokenId);

        _setTokenURI(currentTokenId, tokenURI);

        createListedToken(currentTokenId, price);

        return currentTokenId;
    }

    function createListedToken(uint256 tokenId, uint256 price) private {
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            payable(address(this)),
            payable(msg.sender),
            price,
            true
        );

        _transfer(msg.sender, address(this), tokenId);
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

    function executeSale(uint256 tokenId) public payable {
        uint price = idToListedToken[tokenId].price;
        require(msg.value == price, "Please submit the asking price");

        address seller = idToListedToken[tokenId].seller;
        
        idToListedToken[tokenId].currentlyListed = false;
        idToListedToken[tokenId].seller = payable(msg.sender);
        _itemsSold.increment();

        _transfer(address(this), msg.sender, tokenId);

        approve(address(this), tokenId);

        //Wait why are we transfering the list price?
        payable(owner).transfer(listPrice);
        payable(seller).transfer(msg.value);
    }
}