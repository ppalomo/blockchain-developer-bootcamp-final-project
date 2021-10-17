import React, { useState, useEffect } from "react";
import { ethers, utils } from 'ethers';
import {
    Button,
    Center,
    HStack,
    Input,
    Image,
    Progress,
    Skeleton, SkeletonCircle, SkeletonText,
    Stack,
    Text,
    VStack,
    Wrap, WrapItem,
    useColorModeValue
  } from '@chakra-ui/react';
import useStore from '../../store';
import { useContract, useAdminContract } from '../../hooks/contractHooks';
import Canvas from '../Canvas'; 

export default function Home (props) {
    const { isWalletConnected } = useStore();
    const factoryContract = useContract("PlasmidsFactory");
    const factoryAdminContract = useAdminContract("PlasmidsFactory");
    const nftAdminContract = useAdminContract("Plasmids");
    const [mintingPrice, setMintingPrice] = useState();
    const [maxSupply, setMaxSupply] = useState();
    const [totalSupply, setTotalSupply] = useState();
    const [stakedAmount, setStakedAmount] = useState();
    const [currentYield, setCurrentYield] = useState();

    useEffect(async () => {
        if (factoryAdminContract)
            await fetchData();
    }, [factoryAdminContract]);

    async function fetchData() {
        try {
            if(factoryAdminContract != null && nftAdminContract != null) {
                const price = await factoryAdminContract.mintingPrice();
                setMintingPrice(price.toString());

                const mSupply = await factoryAdminContract.maxSupply();
                setMaxSupply(mSupply.toString());

                const tSupply = await nftAdminContract.totalSupply();
                setTotalSupply(tSupply.toString());

                const stkAmount = await factoryAdminContract.stakedAmount();
                setStakedAmount(stkAmount.toString());

                const cYield = await factoryAdminContract.currentYield();
                setCurrentYield(cYield.toString());
            }
        } catch (err) {
            console.log("Error: ", err);
        }   
    }

    async function handleMinting(e) {
        let imageURI = "https://ipfs.io/ipfs/QmWNcYhEcggdm1TFt2m6WmGqqQwfFXudr5eFzKPtm1nYwq";
        let metadataURI = "https://ipfs.io/ipfs/QmUCxDBKCrx2JXV4ZNYLwhUPXqTvRAu6Zceoh1FNVumoec";

        if (isWalletConnected)
        {
            try {
                if(factoryContract != null) {              
                    const tx = await factoryContract.getRandomDna();
                    const result = await tx.wait();
                    const dna = result.events[0].args[1];

                    console.log(dna);

                    console.log("dna generated!")
                    
                    // const tx2 = await factoryContract.mintNFT(imageURI,metadataURI, {value: mintingPrice.toString()});
                    // await tx2.wait();

                    // console.log("nft minted!")

                    fetchData();
                }
            } catch (err) {
                console.log("Error: ", err);
            }
            // setIsDepositOpen(false);
        }
    }

    return(
        <Center
            mt={{
                base: "1.5rem",
                md: "2rem",
                xl: "2rem"
            }}
            minHeight="100px"
            w="50%"
            bgColor={useColorModeValue("header.100", "header.900")}
            borderWidth="1px"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            rounded="xl"
            position="relative"
            shadow="lg">
            <VStack spacing={10} p="2rem" w="100%">
                <Text
                    color="gray.800"
                    fontSize={{
                        "base": "3xl",
                        "md": "3xl",
                        "xl": "3xl"
                    }}
                    fontWeight="bold">
                    Mint a Plasmid!
                </Text>

                <Center w="60%" spacing={2}>
                    <WrapItem w="20%">
                        <VStack>
                            <Text fontSize="0.9rem" fontWeight="500" color="primary.500">NFT Price</Text>
                            <HStack>
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {mintingPrice != undefined ? Math.round(utils.formatEther(mintingPrice.toString()) * 1e3) / 1e3 : ""} ETH
                                </Text>
                            </HStack>
                        </VStack>
                    </WrapItem>
                    <WrapItem w="20%">
                        <VStack>
                            <Text fontSize="0.9rem" fontWeight="500" color="primary.500">Supply</Text>
                            <HStack>
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {totalSupply}/{maxSupply}
                                </Text>
                            </HStack>
                        </VStack>
                    </WrapItem>

                    <WrapItem w="20%">
                        <VStack>
                            <Text fontSize="0.9rem" fontWeight="500" color="primary.500">In Stake</Text>
                            <HStack>
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {stakedAmount != undefined ? Math.round(utils.formatEther(stakedAmount.toString()) * 1e3) / 1e3 : ""} ETH
                                </Text>
                            </HStack>
                        </VStack>
                    </WrapItem>
                    <WrapItem w="20%">
                        <VStack>
                            <Text fontSize="0.9rem" fontWeight="500" color="primary.500">Supply</Text>
                            <HStack>
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {currentYield != undefined ? Math.round(utils.formatEther(currentYield.toString()) * 1e3) / 1e3 : ""} ETH
                                </Text>
                            </HStack>
                        </VStack>
                    </WrapItem>
                </Center>

                {/* <Progress hasStripe value={totalSupply} w="60%" h="20px" max={maxSupply} /> */}

                {/* <Button 
                    isDisabled={!isWalletConnected}
                    onClick={() => handleMinting() }
                    w="33%"
                    fontSize={14}
                    colorScheme="blue"
                    variant="outline">
                        Mint
                </Button> */}

                <Canvas mintingPrice={mintingPrice} />
                
                
            </VStack>
        </Center>
    );

} 
