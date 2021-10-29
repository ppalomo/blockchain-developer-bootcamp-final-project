# Methods

**NFT Minting:** 

1. Users will generate a new random DNA

```solidity
function getRandomDna() public {
  // Generating a new DNA and linking it to the sender
}
```

2. Users will mint a new NFT through last generated DNA

```solidity
function mintNFT(string memory _imageURI, string memory _metadataURI) external payable {
  // Minting a new NFT    
}
```

**Rewards:** 

3. Users will redeem pending rewards (through generated yield)

```solidity
function redeem() external {
  // Redeeming pending rewards  
}
```

**Administrator Methods:** 

4. Owner can send pending balance to staking pool

```solidity
function stake() external onlyOwner {
  // Sending to stake
}
```

5. Owner can withdraw pending yield generated through staking

```solidity
function withdraw() external onlyOwner {
  // Withdrawing pending yield
}
```

6. Owner can send the unclaimed yield to charity

```solidity
function sendToCharity() external onlyOwner {
  // Sending unclaimed yield to charity
}
```
