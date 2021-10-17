//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Plasmids ERC721 interface
interface IPlasmids {

    function mint(
        address _owner,
        string memory _dna, 
        string memory _imageURI, 
        string memory _metadataURI, 
        bool _isSpecial, 
        uint _weight) external returns (uint);

    function totalSupply() external view returns (uint);

    function setFactory(address _addr) external;
}