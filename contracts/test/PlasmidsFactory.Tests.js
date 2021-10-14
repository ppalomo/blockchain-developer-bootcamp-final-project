const { ethers, upgrades } = require("hardhat");
const { use, expect, assert } = require("chai");
const { solidity } = require("ethereum-waffle");

use(solidity);

describe("Kreepies Factory", function() {

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

    describe("DNA Generation", function() {

        it("Should get a random DNA", async function() {
            // Act
            const dna = await getRandomDna(addr1);
        
            // Assert
            expect(dna).to.have.lengthOf.at.least(6);
        }).timeout(timeout);;

    });

    describe("Minting", function() {

        it("Should mint a new NFT", async function() {
            // Arrange
            const dna = await getRandomDna(addr1);
        
            // Act
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});
        
            // Assert
            expect(await nft.totalSupply()).to.be.equal(1);
            expect(await nft.ownerOf(0)).to.be.equal(addr1.address);
        
            const item = await nft.nfts(0);
            expect(item[0]).to.be.equal(dna);
            expect(item[1]).to.be.equal(imageURI);
            expect(await nft.tokenURI(0)).to.be.equal(metadataURI);
        }).timeout(timeout);;

        it("Should store payments in the balance", async function() {
            // Arrange
            const pendingStake = await factory.pendingStake();
            const balance = await factory.getBalance();

            // Act
            let dna = await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            dna = await getRandomDna(addr2);
            await factory.connect(addr2).mintNFT(imageURI, metadataURI, {value: mintingPrice});
    
            // Assert
            const lastPendingStake = await factory.pendingStake();
            expect(lastPendingStake).to.be.equal(pendingStake.add(ethers.utils.parseEther('2')));

            const lastBalance = await factory.getBalance();
            expect(lastBalance).to.be.equal(balance.add(ethers.utils.parseEther('2')));
        }).timeout(timeout);;

        it("Should calculate special and weight attributes", async function() {
            // Arrange
            await factory.setSpecialProbability(100);
            const dna = await getRandomDna(addr1);
        
            // Act
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});
        
            // Assert       
            const item = await nft.nfts(0);
            expect(item[2]).to.be.equal(true);
            expect(item.weight.toNumber()).to.be.greaterThanOrEqual(1);

            const maxInitialWeight = await factory.maxInitialWeight();
            expect(item.weight.toNumber()).to.be.lessThanOrEqual(maxInitialWeight.toNumber());

            const info = await factory.users(addr1.address);
            expect(info.userWeight).to.equal(item.weight);
            expect(info.lastRedeemBlock).to.be.above(0);
            expect(info.exists).to.equal(true);
        }).timeout(timeout);;

        it("Shouldn't mint if dna was not generated before", async function() {
            // Assert
            await expect(
                factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice})
            ).to.be.revertedWith('Should generate a random DNA before minting');
        }).timeout(timeout);;

        it("Shouldn't mint twice with the same dna", async function() {
            // Arrange
            const dna = await getRandomDna(addr1);
        
            // Act
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});
        
            // Assert
            await expect(
                factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice})
            ).to.be.revertedWith('Should generate a random DNA before minting');
        }).timeout(timeout);;

        it("Shouldn't mint if price isn't correct", async function() {
            // Arrange
            const dna = await getRandomDna(addr1);
        
            // Act
            await expect(
                factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: ethers.utils.parseEther('0.1')})
            ).to.be.revertedWith('Price is not correct');
        
            // Assert
            expect(await nft.totalSupply()).to.be.equal(0);
        }).timeout(timeout);;

        it("Shouldn't mint if max supply has been reached", async function() {
            // Arrange
            let dna = await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});
        
            // Act
            await factory.setMaxSupply(1);

            // Assert
            await expect(
                factory.connect(addr1).getRandomDna()
            ).to.be.revertedWith('Max supply has been reached');

            await expect(
                factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice})
            ).to.be.revertedWith('Max supply has been reached');
        }).timeout(timeout);;

    });

    describe("Max Supply", function() {

        it("Should modify max supply", async function() {
            // Arrange
            const newMaxSupply = 10;
  
            // Act
            await factory.setMaxSupply(newMaxSupply);
  
            // Assert
            expect(await factory.maxSupply()).to.be.equal(newMaxSupply);
        }).timeout(timeout);;

        it("Shouldn't set a max supply less than current supply", async function() {
            // Arrange
            let dna = await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            dna = await getRandomDna(addr2);
            await factory.connect(addr2).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            // Assert
            await expect(
                factory.setMaxSupply(1)
            ).to.be.revertedWith('Max supply cannot be less than current supply');
        }).timeout(timeout);;

        it("Shouln't modify max supply if sender isn't the owner", async function() {
            // Arrange
            const newMaxSupply = 10;
        
            // Assert
            await expect(
                factory.connect(addr1).setMaxSupply(newMaxSupply)
            ).to.be.revertedWith('caller is not the owner');
        }).timeout(timeout);;

    });

    describe("Minting Price", function() {

        it("Should modify minting price", async function() {
            // Arrange
            const newPrice = ethers.utils.parseEther('2');
        
            // Act
            await factory.setMintingPrice(newPrice);
        
            // Assert
            expect(await factory.mintingPrice()).to.be.equal(newPrice);
        });

        it("Shouln't modify minting price if sender isn't the owner", async function() {
            // Arrange
            const newPrice = ethers.utils.parseEther('2');
        
            // Assert
            await expect(
                factory.connect(addr1).setMintingPrice(newPrice)
            ).to.be.revertedWith('caller is not the owner');
        });

    });

    describe("Special Probability", function() {
        
        it("Should modify special probability", async function() {
            // Arrange
            const newProbability = 20;
        
            // Act
            await factory.setSpecialProbability(newProbability);
        
            // Assert
            expect(await factory.specialProbability()).to.be.equal(newProbability);
        });

        it("Shouldn't set a probability greater than 100", async function() {
            // Assert
            await expect(
                factory.setSpecialProbability(200)
            ).to.be.revertedWith('Probability should be between 0 - 100');
        });

        it("Shouldn't modify special probability if sender isn't the owner", async function() {
            // Assert
            await expect(
                factory.connect(addr1).setSpecialProbability(20)
            ).to.be.revertedWith('caller is not the owner');
        });

    });

    describe("Staking", function() {

        it("Should stake pending balance", async function() {
            // Arrange
            await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            await getRandomDna(addr2);
            await factory.connect(addr2).mintNFT(imageURI, metadataURI, {value: mintingPrice});
            
            // Act
            await factory.stake();
    
            // Assert
            expect(await factory.pendingStake()).to.be.equal(0);

            const stakedAmount = await adapter.getStakedAmount(factory.address);
            expect(stakedAmount).to.be.equal(mintingPrice.add(mintingPrice));
        }).timeout(timeout);

        it("Shouldn't stake if sender isn't the owner", async function() {
            // Arrange
            let dna = await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});
            
            // Assert
            await expect(
                factory.connect(addr1).stake()
            ).to.be.revertedWith('caller is not the owner');
        }).timeout(timeout);

    });

    describe("Withdraw", function() {

        it("Should withdraw pending yield", async function() {
            // Arrange
            await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            await getRandomDna(addr2);
            await factory.connect(addr2).mintNFT(imageURI, metadataURI, {value: mintingPrice});
            
            await factory.stake();
            increaseBlocks(10);

            // Act
            const pendingYield = await factory.pendingYield();
            await factory.withdraw();
    
            // Assert
            expect(await factory.currentYield()).to.be.above(0);

            const stakedAmount = await factory.stakedAmount();
            expect(stakedAmount).to.be.equal(mintingPrice.add(mintingPrice));

            expect(await factory.currentYield()).to.be.above(0);
            expect(await factory.unclaimedYield()).to.be.equal(pendingYield);
        }).timeout(timeout);

    });

    describe("Send to Charity", function() {

        it("Should send unclaimed yield to charity", async function() {
            const originalBalance = await addrs[2].getBalance();

            // Arrange
            await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            await getRandomDna(addr2);
            await factory.connect(addr2).mintNFT(imageURI, metadataURI, {value: mintingPrice});
            
            await factory.stake();
            increaseBlocks(10);
            
            await factory.withdraw();
            increaseBlocks(10);
            await factory.withdraw();

            // Act
            expect(await factory.unclaimedYield()).to.be.above(0);
            await factory.sendToCharity();

            // Assert
            expect(await factory.unclaimedYield()).to.be.equal(0);
            expect(await addrs[2].getBalance()).to.be.above(originalBalance);
        }).timeout(timeout);

    });

    describe("Redeem", function() {

        it("Should redeem pending monthly yield", async function() {
            // Arrange
            await factory.setSpecialProbability(100);

            await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            await getRandomDna(addr2);
            await factory.connect(addr2).mintNFT(imageURI, metadataURI, {value: mintingPrice});
            
            await factory.stake();
            increaseBlocks(10);

            await factory.withdraw();
            expect(await factory.pendingYield()).to.equal(await factory.currentYield());
            increaseBlocks(10);

            // Act
            const originalInfo = await factory.users(addr1.address);

            expect(await factory.pendingToRedeem(addr1.address)).to.be.above(0);
            await factory.connect(addr1).redeem();
    
            // Assert
            expect(await factory.pendingToRedeem(addr1.address)).to.equal(0);
            expect(await factory.pendingYield()).to.be.below(await factory.currentYield());

            const currentInfo = await factory.users(addr1.address);
            expect(currentInfo.userWeight).to.be.above(originalInfo.userWeight);
        }).timeout(timeout);

        it("Shouldn't redeem twice the same month", async function() {
            // Arrange
            await factory.setSpecialProbability(100);

            await getRandomDna(addr1);
            await factory.connect(addr1).mintNFT(imageURI, metadataURI, {value: mintingPrice});

            await getRandomDna(addr2);
            await factory.connect(addr2).mintNFT(imageURI, metadataURI, {value: mintingPrice});
            
            await factory.stake();
            increaseBlocks(10);

            await factory.withdraw();
            expect(await factory.pendingYield()).to.equal(await factory.currentYield());
            increaseBlocks(10);

            // Act
            await factory.connect(addr1).redeem();

            // Assert
            await expect(
                factory.connect(addr1).redeem()
            ).to.be.revertedWith('Yield already redeemed');

            increaseBlocks(10);
            await factory.withdraw();

            await factory.connect(addr1).redeem();

            expect(await factory.pendingToRedeem(addr1.address)).to.equal(0);
            expect(await factory.pendingYield()).to.be.below(await factory.currentYield());
        }).timeout(timeout);

    });

    // Private methods

    async function getRandomDna(account) {
        let tx = await factory.connect(account).getRandomDna();
        let receipt = await tx.wait();
        return receipt.events[0].args.dna;
    }

    async function increaseBlocks(blocks) {
      for (let index = 0; index < blocks; index++) {
          await ethers.provider.send('evm_increaseTime', [3600]);
          await ethers.provider.send('evm_mine');    
      }
    }

});