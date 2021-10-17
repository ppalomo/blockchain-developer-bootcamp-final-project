//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/// @title Plasmids ERC721 interface
interface IPlasmidsFactory {
    function changeNFTOwner(address _oldOwner, address _newOwner, uint _tokenId) external;
}