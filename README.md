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
4. Special NFTs give the owner the right to withdraw monthly a percentage of the interest generated depending on the weight of the NFT. Standard NFTs will have a zero weight.
5. The weight of an Special NFT can grow every month (after the monthly withdrawal). This way the older owners will benefit from keeping his NFTs.
6. NFT weight is related to an owner. If the owner changes, the weight will be reset to original weight.
7. The monthly unclaimed yield will be sent to charity.

**Objectives:**

1. Bring something new to the exciting world of NFTs.
2. Benefit owners to keep their NTFs and thus raise their price.

## Contracts

The contracts have been deployed to **Kovan Testnet** due to the fact that is the AAVE testnet.

1. **Plasmids (ERC-721)**: [0x5c3f7D44cB21BD93e7fcA3Fd2379D902d742BedC](https://kovan.etherscan.io/address/0x5c3f7D44cB21BD93e7fcA3Fd2379D902d742BedC#code)

This is the ERC-721 contract wich stores the NFT assets themselves.

2. **AaveStakingAdapter**: [0xdFC8EF2e2B50160CD3C61F9614887e4ce55F2257](https://kovan.etherscan.io/address/0xdFC8EF2e2B50160CD3C61F9614887e4ce55F2257#code)

This is the contract used to communicate Plasmids Factory with the AAVE protocol. Here we can find the staking and withdraw methods besides another useful tools.

3. **PlasmidsFactory**: [0xc5Cc3648109885E14363E6EA1f9B1eF10B28b9C5](https://kovan.etherscan.io/address/0xc5Cc3648109885E14363E6EA1f9B1eF10B28b9C5#code)

This is the factory contract where the magic happens. Here we can find all the methods related to minting, redeeming, etc. This contract is linked with the ERC721 and the AAVE adapter.

###

## Directory Structure:

In this section I will briefly describe the directory structure:

- **contracts**: This directory stores the HardHat project. He re we can find the contracts, intefaces, tests and scripts to deploy them.
  - **contracts**: Stores the different contracts.
    - **interfaces**: Stores the different interfaces.
  - **scripts**: Stores the deploy script.
  - **tests**: Stores the test files.
- **public**: Public resources for the fronted like images.
- **src**: React Project source files.
  - **abis**: Contract abis used to communicate the frontend with the blockchain.
  - **components**: All the Reacts components used to build the interface.
  - **data**: Data dictionaries.
  - **hooks**: Useful hooks to use in the frontend.
  - **styles**: Style files.
  - **utils**: Useful common methods.

###

## How to populate the .ENV file

In order to populate the .env file we have to fill the next variables:

REACT_APP_DEFAULT_NETWORK=kovan

REACT_APP_INFURA_API_KEY=??????????

REACT_APP_INFURA_PROJECT_SECRET=??????????

REACT_APP_ETHERSCAN_API_KEY=??????????

REACT_APP_PINATA_API_KEY=??????????

REACT_APP_PINATA_API_SECRET=??????????

REACT_APP_PLASMIDS_KOVAN_ADDRESS=0x887e0296bFdB8DB1B5bb4b855CbCc3F17b3Db3A0

REACT_APP_AAVESTAKINGADAPTER_KOVAN_ADDRESS=0xEAbB9d1245633D4d7C6360100F8ccE6075375258

REACT_APP_PLASMIDSFACTORY_KOVAN_ADDRESS=0x306F9f156cf1CC54C2e5640f68580dC318e22df0

# How to run the application

1. First we'll need to clone the repository.

```
$ git clone https://github.com/ppalomo/blockchain-developer-bootcamp-final-project.git
```

2. Go inside the created directory and intall all the dependencies.

```
$ npm install
```

3. Execute the app.

```
$ yarn start
```

# How to execute the tests

If we want to execute the test we need to follow the next steps:

1. First of all, we need to install the utility **[ganache-cli](https://docs.nethereum.com/en/latest/ethereum-and-clients/ganache-cli/#:~:text=Ganache%20CLI%20is%20the%20latest,running%20an%20actual%20Ethereum%20node.&text=Accounts%20can%20be%20re%2Dcycled,need%20for%20faucets%20or%20mining)** to fork the **mainnet**. This step is necessary to test the integration with an already deployed protocol like **AAVE**.

```
$ npm install -g ganache-cli
$ yarn global add ganache-cli
```

2. Then, we can execute the new local forked chain. We'll need an Infura key.

```
$ ganache-cli --fork https://mainnet.infura.io/v3/[replace-with-infura-key]
```

3. Finally, we can execute the tests in a different command window.

```
$ npx hardhat test --network localhost
```

## Next Steps (Optimizations)

- Store image hashes on-chain to secure the image generation.
- Create method to add new Plasmid characteristics.
- Create method to force withdraw all amount staked in Aave.
- Only store NFTs info in the ERC721 contract to avoid inconsistencies.
- Avoid 2 different transactions to generate DNA and mint the NFT. This is a problem because the user can reject the second tx if he doesn't like the generated image.

## Ideas for the future

- Create a Plasmid ERC20 token and give some to NFT owners. Even if you don't have an special NFT.
- Change Plasmid NFT image (mutation) every X redeems.
- Create more staking adapters to choose the best option (Compound, ...)
