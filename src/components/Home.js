import React, { useState, useEffect } from "react";
import { ethers, utils } from 'ethers';
import useStore from '../store';
import { parseDate, datediff, getNextDay1 } from '../utils/datesHelper';
import { useContract, useAdminContract } from '../hooks/contractHooks';
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
import { images } from '../data/images';
const IPFS = require('ipfs-api');

export default function Home (props) {
    const { isWalletConnected, wallet } = useStore();
    const factoryContract = useContract("PlasmidsFactory");
    const factoryAdminContract = useAdminContract("PlasmidsFactory");
    const nftAdminContract = useAdminContract("Plasmids");
    const [mintingPrice, setMintingPrice] = useState(0);
    const [maxSupply, setMaxSupply] = useState(0);
    const [totalSupply, setTotalSupply] = useState(0);
    const [stakedAmount, setStakedAmount] = useState(0);
    const [currentYield, setCurrentYield] = useState(0);
    const [dna, setDna] = useState();
    const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    const [plasmid, setPlasmid] = useState();
    const [daysToNextWithdrawal, setDaysToNextWithdrawal] = useState(null);
    const [pendingToRedeem, setPendingToRedeem] = useState(0);
    // const [hash, setHash] = useState(null);
    // const [metadataHash, setMetadataHash] = useState(null);

    useEffect(async () => {
        if (factoryAdminContract)
        {
            await fetchData();
        }
    }, [factoryAdminContract]);

    useEffect(async () => {
        if (plasmid)
        {            
            // Uploading image to IPFS
            var imageBuffer = decodeBase64Image(plasmid);      
            ipfs.files.add(imageBuffer.data, (error, result) => {
                if(error) {
                    console.error(error)
                    return
                }
                // console.log(result[0].hash);
                // setHash(result[0].hash);
                uploadMetadata(result[0].hash);
            });
        }
    }, [plasmid]);

    async function fetchData() {
        try {
            if(factoryAdminContract != null && nftAdminContract != null) {
                setDaysToNextWithdrawal(datediff(parseDate('10/19/2021'), parseDate(getNextDay1())));

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

                if (isWalletConnected) {
                    const toRedeem = await factoryAdminContract.pendingToRedeem(wallet);
                    setPendingToRedeem(toRedeem.toString());
                }
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
                
                // Generating image
                console.log(result.events[0].args[1]);
                generateImage(result.events[0].args[1]);
            } catch (err) {
                console.log("Error: ", err);
            }
        }
    }

    async function generateImage(dna0) {
        let hashes = getHashesByDna(dna0);        
        await mergeImages(hashes, { crossOrigin: 'Anonymous' })
        .then(b64 => {
            setPlasmid(b64)
        });
    }

    async function handlRedeem(e) {
        // let dna0 = getRandomDna();
        // generateImage(dna0);
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

    // function getRandomDna() {
    //     const p1 = Math.floor(Math.random() * 7);
    //     const p2 = Math.floor(Math.random() * 5);
    //     const p3 = Math.floor(Math.random() * 3);
    //     const p4 = Math.floor(Math.random() * 3);
    //     let dna = ("0" + p1).slice(-2) + ("0" + p2).slice(-2) + ("0" + p3).slice(-2) + ("0" + p4).slice(-2);
    //     console.log("getRandomDna  => ", dna);
    //     return dna;
    // }

    async function uploadMetadata(imgHash){
        const metadata = `{
            "image": "https://ipfs.io/ipfs/${imgHash}",
            "name": "Plasmid",
            "attributes": [
                {
                    "trait_type": "Contract",
                    "value": "${factoryContract.address}"
                }
            ]
        }`;

        var imageBuffer = Buffer.from(metadata);

        // Uploading image to IPFS
        ipfs.files.add(imageBuffer, (error, result) => {
            if(error) {
                console.error(error)
                return
            }
            // setMetadataHash(result[0].hash);
            mintNFT(imgHash, result[0].hash);
        });
    }

    async function mintNFT(iHash, mHash){
        const imageURI = 'https://ipfs.io/ipfs/' + iHash;
        const metadataURI = 'https://ipfs.io/ipfs/' + mHash;
        try {
            if(factoryContract) {
                const tx = await factoryContract.mintNFT(imageURI, metadataURI, {value: mintingPrice.toString()});
                const result = await tx.wait();
                // console.log("index = ", result.events[0].args[2].toString());
                // console.log("nftContract.address = ", nftContract.address);
            }
        } catch (error) {
            console.log(error);
        }
        fetchData();
    }

    function decodeBase64Image(dataString) {
        var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
          response = {};
      
        if (matches.length !== 3) {
          return new Error('Invalid input string');
        }
      
        response.type = matches[1];
        response.data = new Buffer(matches[2], 'base64');
      
        return response;
    }
    
    return(
        <VStack>

            <Center
                m={{
                    base: "0.5rem",
                    md: "0.5rem",
                    xl: "1.5rem"
                }}
                w="100%">
                <Text
                    color="gray.500"
                    fontSize={{
                        "base": "3xl",
                        "md": "3xl",
                        "xl": "4xl"
                    }}
                    fontWeight="bold">
                    {daysToNextWithdrawal} DAYS TO NEXT YIELD WITHDRAWAL
                </Text>
            </Center>

            <Wrap
                mt={{
                    base: "1.5rem",
                    md: "2rem",
                    xl: "2rem"
                }}
                minHeight="500px"
                w="100%"
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
                        </HStack>

                        <Text
                            pt={{
                                base: "1.5rem",
                                md: "2rem",
                                xl: "2rem"
                            }}
                            color="gray.700"
                            fontSize={{
                                "base": "2xl",
                                "md": "2xl",
                                "xl": "2xl"
                            }}
                            fontWeight="bold">
                            You have {pendingToRedeem} ETH to redeem
                        </Text>

                        <HStack 
                            spacing="20px"
                            pt={{
                                base: ".5rem",
                                md: "2rem",
                                xl: "2rem"
                            }}>
                            <Button
                                isDisabled={!isWalletConnected}
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

        </VStack>
    );

}