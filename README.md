# Plasmids - Rewarded NFTs Marketplace
**Project Idea `Pablo Palomo (ppalomo.eth)`**

###

Project URL: [https://plasmids.herokuapp.com](https://plasmids.herokuapp.com/)

Author Address: 0x25f1Db85C33E4b3d3732d02371Dd13F7477F6185

Screencast URL: -----

## Project Description:

The project consists of the creation of an ERC-721 contract that will send the collected amount of minting NFTs to stake. This way, every month, generated interests will be shared through NFT owners. But... how?

User will mine assets of two types depending on how lucky they are:
1. **Standard NFTs** These are normal NFT images randomnly generated without extra capabilities.
2. **Special NFTs** These are rare an unusual NFTs with some interesting capabilities. A random weight between 1 and 1000 which means the percentage of interests that can be withdrawn every month.

**Workflow:** 
1. A user mints a new NFT which is generated randomly.
2. The collected amount will be sent to stake. This stake will generate interests every month.
3. The NFT created can be either a Standard NFT or a Special NFT.
5. Special NFTs give the owner the right to withdraw monthly a percentage of the interest generated depending on the weight of the NFT. Standard NFTs will have a zero weight.
6. The weight of an Special NFT can grow every month (after the monthly withdrawal). This way the older owners will benefit from keeping his NFTs. 
7. NFT weight is related to an owner. If the owner changes, the weight will be reset to original weight.
8. The monthly unclaimed yield will be sent to charity.

**Objectives:** 
1. Bring something new to the exciting world of NFTs.
2. Benefit owners to keep their NTFs and thus raise their price.

## Contracts

The contracts have been deployed to **Kovan Testnet** due to the fact that is the AAVE testnet.

1) **Plasmids (ERC-721)**: [0x5c3f7D44cB21BD93e7fcA3Fd2379D902d742BedC](https://kovan.etherscan.io/address/0x5c3f7D44cB21BD93e7fcA3Fd2379D902d742BedC#code)

This is the ERC-721 contract wich stores the NFT assets themselves.

2) **AaveStakingAdapter**: [0xdFC8EF2e2B50160CD3C61F9614887e4ce55F2257](https://kovan.etherscan.io/address/0xdFC8EF2e2B50160CD3C61F9614887e4ce55F2257#code)

This is the contract used to communicate Plasmids Factory with the AAVE protocol. Here we can find the staking and withdraw methods besides another useful tools.

3) **PlasmidsFactory**: [0xc5Cc3648109885E14363E6EA1f9B1eF10B28b9C5](https://kovan.etherscan.io/address/0xc5Cc3648109885E14363E6EA1f9B1eF10B28b9C5#code)

This is the factory contract where the magic happens. Here we can find all the methods related to minting, redeeming, etc. This contract is linked with the ERC721 and the AAVE adapter.

###

## Directory Structure:
???

## How to populate the .ENV file
REACT_APP_DEFAULT_NETWORK=kovan

REACT_APP_INFURA_API_KEY=?????
REACT_APP_INFURA_PROJECT_SECRET==?????
REACT_APP_ETHERSCAN_API_KEY==?????
REACT_APP_COINMARKETCAP_KEY==?????
REACT_APP_PINATA_API_KEY==?????
REACT_APP_PINATA_API_SECRET==?????
REACT_APP_DEPLOYER_PRIVATE_KEY==???
REACT_APP_PLASMIDS_KOVAN_ADDRESS=0x887e0296bFdB8DB1B5bb4b855CbCc3F17b3Db3A0
REACT_APP_AAVESTAKINGADAPTER_KOVAN_ADDRESS=0xEAbB9d1245633D4d7C6360100F8ccE6075375258
REACT_APP_PLASMIDSFACTORY_KOVAN_ADDRESS=0x306F9f156cf1CC54C2e5640f68580dC318e22df0


npx hardhat clean && npx hardhat verify --network kovan 0x887e0296bFdB8DB1B5bb4b855CbCc3F17b3Db3A0
npx hardhat clean && npx hardhat verify --network kovan 0xEAbB9d1245633D4d7C6360100F8ccE6075375258 0x88757f2f99175387ab4c6a4b3067c77a695b0349 0xA61ca04DF33B72b235a8A28CfB535bb7A5271B70 0x87b1f4cf9BD63f7BBD3eE1aD04E8F52540349347

npx hardhat clean && npx hardhat verify --network kovan 0x306F9f156cf1CC54C2e5640f68580dC318e22df0 0x887e0296bFdB8DB1B5bb4b855CbCc3F17b3Db3A0 100 50000000000000000 0xEAbB9d1245633D4d7C6360100F8ccE6075375258 0xDaf3E0F6639776617b8fb1BE07b614aB93Bf19a8

## Ideas for the future
- Create a Plasmid ERC20 token and give some to NFT owners. Even if you don't have an special NFT.
- Change Plasmid NFT image (mutation) every X redeems.

