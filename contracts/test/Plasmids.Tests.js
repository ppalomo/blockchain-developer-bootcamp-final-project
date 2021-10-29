const { ethers, upgrades } = require("hardhat");
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Kreepies ERC-721", function() {

    let Plasmids, PlasmidsFactory, AaveStakingAdapter;
    let nft, factory, adapter;
    let maxSupply = 1000;
    let mintingPrice = ethers.utils.parseEther('1');
    let imageURI = "https://ipfs.io/ipfs/QmWNcYhEcggdm1TFt2m6WmGqqQwfFXudr5eFzKPtm1nYwq";
    let metadataURI = "https://ipfs.io/ipfs/QmUCxDBKCrx2JXV4ZNYLwhUPXqTvRAu6Zceoh1FNVumoec";
    let owner;
    let addr1;
    let addr2;
    let addrs;
    let timeout = 10000000;

    beforeEach(async function () {
        // Getting test accounts
        [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

        // Deploying contracts
        Plasmids = await ethers.getContractFactory("Plasmids");
        nft = await Plasmids.deploy();
        expect(nft.address).to.properAddress;

        AaveStakingAdapter = await ethers.getContractFactory("AaveStakingAdapter");
        adapter = await AaveStakingAdapter.deploy(
            "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5", // _lendingPoolAddressesProvider
            "0xcc9a0B7c43DC2a5F023Bb9b738E45B0Ef6B06E04",  // _wethGateway
            "0x030bA81f1c18d280636F32af80b9AAd02Cf0854e"); // _aWethAddress);
        expect(adapter.address).to.properAddress;

        PlasmidsFactory = await ethers.getContractFactory("PlasmidsFactory");
        factory = await PlasmidsFactory.deploy(nft.address, maxSupply, mintingPrice, adapter.address, addrs[2].address);
        expect(factory.address).to.properAddress;

        await nft.setFactory(factory.address);
    });

    // Tests related to the ERC-721.
    describe("ERC-721", function() {

        // The contract must have the correct address of its factory contract.
        it("Should set the factory address", async function() {
            // Assert
            expect(await nft.factory()).to.be.equal(factory.address);
        });

        /**
         * It souldn't be possible to execute the minting if the caller isn't the factory contract.
         * The mintings must be executed from the factory contract.
         */
        it("Shouldn't mint if caller isn't the factory", async function() {
            // Arrange
            const dna = await getRandomDna(addr1);

            // Assert
            await expect(
                nft.mint(addr1.address, dna, imageURI, metadataURI, true, 1000)
            ).to.be.revertedWith('Caller is not the factory contract');
        });

        /**
         * This test checks an NFT transfer.
         * The factory info must be updated and the transfer must be successful.
         */
        it("Should transfer an NFT", async function() {
            // Arrange
            await factory.setSpecialProbability(100);

            await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});
            
            await factory.stake();
            increaseBlocks(10);

            await factory.withdraw();
            increaseBlocks(10);

            // Act
            const sellerOriginalInfo = await factory.users(addr1.address);
            const buyerOriginalInfo = await factory.users(addrs[0].address);

            await nft.connect(addr1).approve(addrs[0].address, 0);
            await nft.connect(addrs[0]).transferFrom(addr1.address, addrs[0].address, 0);

            // Assert
            const sellerCurrentInfo = await factory.users(addr1.address);
            const buyerCurrentInfo = await factory.users(addrs[0].address);

            expect(sellerOriginalInfo.userWeight).to.be.above(sellerCurrentInfo.userWeight);
            expect(buyerOriginalInfo.userWeight).to.be.below(buyerCurrentInfo.userWeight);
            
        }).timeout(timeout);

    });

    async function getRandomDna(account) {
        let tx = await factory.connect(account).getRandomDna();
        let receipt = await tx.wait();
        return receipt.events[0].args.dna;
    }

});

// Private methods
    
async function increaseBlocks(blocks) {
  for (let index = 0; index < blocks; index++) {
      await ethers.provider.send('evm_increaseTime', [3600]);
      await ethers.provider.send('evm_mine');    
  }        
}