// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IPlasmidsFactory.sol";
import "hardhat/console.sol";

/**
 @title Plasmids ERC-721 standard.
 */
contract Plasmids is ERC721, ERC721URIStorage, Ownable {

    // Structs
    struct NFT {
        string dna;
        string imageURI;
        bool isSpecial;
        uint weight;
    }

    // Variables
    address public factory;
    NFT[] public nfts;

    // Events
    event FactoryChanged(address indexed addr);

    /**
     @notice Contract constructor method.
     */
    constructor() ERC721("Plasmids", "PLASM") Ownable() {}

    // Public methods

    /**
     @notice Function used to mint a new NFT.
     @param _owner - NFT owner.
     @param _imageURI - Link to an image referencing the asset.
     @param _metadataURI - Link to metadata.
     @param _isSpecial - Is special parameter.
     @param _weight - Rewards weight.
     */
    function mint(
        address _owner, 
        string memory _dna, 
        string memory _imageURI, 
        string memory _metadataURI, 
        bool _isSpecial,
        uint _weight
        ) public onlyFactory returns (uint) {
        
        // Getting new identifier
        uint newId = nfts.length;

        // Pushing the new NFT
        nfts.push(
            NFT({
                dna: _dna,
                imageURI: _imageURI,
                isSpecial: _isSpecial,
                weight: _weight
            })
        );

        // Minting a new NFT
        _safeMint(_owner, newId);
        _setTokenURI(newId, _metadataURI);

        return newId;
    }

    /**
     @notice Returns NFTs total supply.
     */
    function totalSupply() public view returns (uint) {
        return nfts.length;
    }

    /**
     @notice Method used to get token URI address.
     @param tokenId - Token identifier.
     */
    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    /**
     @notice Method used to set the factory address.
     @param _addr - New factory address.
     */
    function setFactory(address _addr) external onlyOwner {
        require(_addr != address(0), 'Address is not correct');
        factory = _addr;

        // Emiting event
        emit FactoryChanged(_addr);
    }

    // Private methods

    /**
     @notice Burning function.
     @param tokenId - Token identifier.
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    /**
     @notice Before transfer function.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override(ERC721) {
        super._beforeTokenTransfer(from, to, tokenId);

        IPlasmidsFactory(factory).changeNFTOwner(from, to, tokenId);
    }

    // Modifiers

    modifier onlyFactory() {
        require(msg.sender == factory, 'Caller is not the factory contract');
        _;
    }

}