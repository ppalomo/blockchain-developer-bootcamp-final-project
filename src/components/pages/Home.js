import React, { useState, useEffect } from "react";
import { ethers, utils } from 'ethers';
import useStore from '../../store';
import { useContract, useAdminContract } from '../../hooks/contractHooks';
import {
    Button,
    Center,
    HStack,
    Input,
    Image as ChakraImage,
    Progress,
    Skeleton, SkeletonCircle, SkeletonText,
    Stack,
    Text,
    VStack,
    Wrap, WrapItem,
    useColorModeValue
} from '@chakra-ui/react';
import mergeImages from 'merge-images';
import { images } from '../../data/images';
const IPFS = require('ipfs-api');

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
    const [dna, setDna] = useState();
    const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    const [plasmid, setPlasmid] = useState();

    useEffect(async () => {
        if (factoryAdminContract)
        {
            await fetchData();
        }
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
        if (isWalletConnected && factoryContract != null)
        {
            try {              
                // Generating a random DNA
                const tx = await factoryContract.getRandomDna();
                const result = await tx.wait();
                setDna(result.events[0].args[1])
                console.log(dna);

                



                fetchData();
            } catch (err) {
                console.log("Error: ", err);
            }
        }
    }

    async function handlRedeem(e) {
        let dna0 = getRandomDna();
        let hashes = getHashesByDna(dna0);
        // console.log(hashes);

        await mergeImages(hashes, { crossOrigin: 'Anonymous' })
        .then(b64 => {
            setPlasmid(b64)
        });
    }

    function getHashesByDna(dna0){
        let imgs = []
        if (dna0 != undefined) {
            const splittedDna = dna0.match(/.{2}/g);
            for (let i = 0; i < splittedDna.length; i++) {
                let code = i + '-' + splittedDna[i];
                let img = images.find(i => i.code === code);
                imgs.push({ src: "https://ipfs.io/ipfs/" + img.hash});
            }
        }
        return imgs;
    }

    function getRandomDna() {
        const p1 = Math.floor(Math.random() * 7);
        const p2 = Math.floor(Math.random() * 5);
        const p3 = Math.floor(Math.random() * 3);
        const p4 = Math.floor(Math.random() * 3);
        let dna = ("0" + p1).slice(-2) + ("0" + p2).slice(-2) + ("0" + p3).slice(-2) + ("0" + p4).slice(-2);
        console.log("getRandomDna  => ", dna);
        return dna;
    }
    
    return(
        <Wrap
            mt={{
                base: "1.5rem",
                md: "2rem",
                xl: "2rem"
            }}
            minHeight="500px"
            w="1000px"
            bgColor={useColorModeValue("header.100", "header.900")}
            borderWidth="1px"
            borderColor={useColorModeValue("gray.200", "gray.700")}
            rounded="xl"
            position="relative"
            shadow="lg">
            
            <WrapItem
               p="20px"
               w="450px">
                    <VStack 
                        mt={{
                            base: "1.5rem",
                            md: "2rem",
                            xl: "2rem"
                        }}
                        w="100%">

                        <Text                        
                            color="gray.700"
                            fontSize={{
                                "base": "3xl",
                                "md": "3xl",
                                "xl": "3xl"
                            }}
                            fontWeight="bold">
                            MEET THE PLASMIDS!
                        </Text>

                        <HStack 
                            spacing="20px"
                            pt={{
                                base: ".5rem",
                                md: "1rem",
                                xl: "1rem"
                            }}>
                            <VStack>
                                <Text fontSize="0.8rem" fontWeight="500" color="gray.400">PRICE</Text>                                    
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {mintingPrice != undefined ? Math.round(utils.formatEther(mintingPrice.toString()) * 1e3) / 1e3 : ""} ETH
                                </Text>
                            </VStack>
                            <VStack>
                                <Text fontSize="0.8rem" fontWeight="500" color="gray.400">SUPPLY</Text>                                    
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {totalSupply}/{maxSupply}
                                </Text>
                            </VStack>
                            <VStack>
                                <Text fontSize="0.8rem" fontWeight="500" color="gray.400">STAKED</Text>
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {stakedAmount != undefined ? Math.round(utils.formatEther(stakedAmount.toString()) * 1e3) / 1e3 : ""} ETH
                                </Text>
                            </VStack>
                            <VStack>
                                <Text fontSize="0.8rem" fontWeight="500" color="gray.400">YIELD</Text>
                                <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                    {currentYield != undefined ? Math.round(utils.formatEther(currentYield.toString()) * 1e3) / 1e3 : ""} ETH
                                </Text>
                            </VStack>
                        </HStack>

                        <HStack 
                            spacing="20px"
                            pt={{
                                base: ".5rem",
                                md: "2rem",
                                xl: "2rem"
                            }}>
                            <Button 
                                isDisabled={!isWalletConnected}
                                onClick={() => handleMinting() }
                                w="150px"
                                fontSize={14}
                                colorScheme="green"
                                variant="solid">
                                Mint
                            </Button>
                            <Button 
                                onClick={() => handlRedeem() }
                                w="150px"
                                fontSize={14}
                                colorScheme="blue"
                                variant="solid">
                                Redeem
                            </Button>
                        </HStack>

                        

                    </VStack>                
            </WrapItem>

            <WrapItem
                p="20px"
                w="auto">
                    
                <Center 
                    w="500px" 
                    h="500px" 
                    bg="gray.100" 
                    borderWidth="1px"
                    borderColor={useColorModeValue("gray.200", "gray.700")}>
                    {/* <Text fontSize="0.8rem" fontWeight="500" color="gray.400">MINT A NEW RANDOM NFT</Text> */}

                    <ChakraImage 
                        src={plasmid}
                        fallbackSrc="https://via.placeholder.com/500"
                        boxSize="500px" />

                    <canvas id="canvas" className="hidden"></canvas>
                   
                </Center>
                
            </WrapItem>

        </Wrap >
    );

}