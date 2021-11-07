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
    Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Lorem, ModalFooter,
    Progress,
    Skeleton, SkeletonCircle, SkeletonText,
    Stack,
    Text,
    VStack,
    Wrap, WrapItem,
    useColorModeValue,
    useDisclosure
} from '@chakra-ui/react';
import mergeImages from 'merge-images';
import { images } from '../data/images';
const IPFS = require('ipfs-api');

export default function Home (props) {    
    const { isOpen, onOpen, onClose } = useDisclosure()
    const { isWalletConnected, wallet, signer, setBalance } = useStore();
    const factoryContract = useContract("PlasmidsFactory");
    const factoryAdminContract = useAdminContract("PlasmidsFactory");
    const nftAdminContract = useAdminContract("Plasmids");
    const [contractsLoaded, setContractsLoaded] = useState(false);
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
    const [totalSentToCharity, setTotalSentToCharity] = useState(0);
    const [yourNfts, setYourNfts] = useState(0);
    const [yourSpecialNfts, setYourSpecialNfts] = useState(0);
    const [yourWeight, setYourWeight] = useState(0);
    const [nftInfo, setNftInfo] = useState(["",false,""]);

    useEffect(async () => {
        if (factoryAdminContract && !contractsLoaded)
        {
            setContractsLoaded(true);
            await fetchData();
        }
    }, [factoryAdminContract]);

    useEffect(async () => {
        if (factoryAdminContract)
        {
            await fetchData();
        }
    }, [wallet]);

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
                uploadMetadata(result[0].hash);
            });
        }
    }, [plasmid]);

    async function fetchData() {
        try {
            // Updating wallet balance
            if (signer != null){
                const bal = await signer.getBalance();
                setBalance(bal);
            }

            if(factoryAdminContract != null && nftAdminContract != null) {
                setDaysToNextWithdrawal(datediff(Date.now(), parseDate(getNextDay1())) + 1);
                
                const info = await factoryAdminContract.getFactoryInfo();
                setMintingPrice(info[0].toString());
                setMaxSupply(info[1].toString());
                setTotalSupply(info[2].toString());
                setStakedAmount(info[3].toString());
                setCurrentYield(info[4].toString());

                const charity = await factoryAdminContract.totalSentToCharity();
                setTotalSentToCharity(charity);

                if (isWalletConnected) {
                    const toRedeem = await factoryAdminContract.pendingToRedeem(wallet);
                    setPendingToRedeem(toRedeem.toString());

                    const userInfo = await factoryAdminContract.users(wallet);
                    setYourNfts(userInfo.numNfts.toString());
                    setYourSpecialNfts(userInfo.numSpecialNfts.toString());
                    setYourWeight(userInfo.userWeight.toString());
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
                const tx = await factoryContract.getRandomDna({ gasLimit: 200000 });
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

    async function handleRedeem(e) {        
        const tx = await factoryContract.redeem({ gasLimit: 500000 });
        const result = await tx.wait();
        fetchData();
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
                const tx = await factoryContract.mintNFT(imageURI, metadataURI, {value: mintingPrice.toString(), gasLimit: 1000000 });
                const result = await tx.wait();

                setNftInfo([
                    result.events[1].args[0].toString(),
                    result.events[1].args[5],
                    result.events[1].args[6].toString()
                ]);
                console.log("id = ", result.events[1].args[0].toString());
                console.log("isSpecial = ", result.events[1].args[5].toString());
                console.log("weight = ", result.events[1].args[6].toString());

                onOpen();
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
        <>
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
                                    {currentYield != undefined ? Math.round(utils.formatEther(currentYield.toString()) * 1e6) / 1e6 : ""} ETH
                                </Text>
                            </VStack>
                        </HStack>

                        {isWalletConnected ?
                            <>
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

                            <HStack 
                                spacing="20px"
                                pt={{
                                    base: ".5rem",
                                    md: "1rem",
                                    xl: "2rem"
                                }}>
                                <VStack>
                                    <Text fontSize="0.8rem" fontWeight="500" color="gray.400">YOUR NFTS</Text>                                    
                                    <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                        {yourNfts}
                                    </Text>
                                </VStack>
                                <VStack>
                                    <Text fontSize="0.8rem" fontWeight="500" color="gray.400">SPECIAL NFTS</Text>                                    
                                    <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                        {yourSpecialNfts}
                                    </Text>
                                </VStack>
                                <VStack>
                                    <Text fontSize="0.8rem" fontWeight="500" color="gray.400">NFTS WEIGHT</Text>
                                    <Text fontSize="0.9rem" fontWeight="500" color="white.100">
                                        {yourWeight}
                                    </Text>
                                </VStack>
                            </HStack>

                            <Text
                                pt={{
                                    base: "1.5rem",
                                    md: "2rem",
                                    xl: "2rem"
                                }}
                                color="gray.700"
                                fontSize={{
                                    "base": "1xl",
                                    "md": "1xl",
                                    "xl": "1xl"
                                }}
                                fontWeight="bold">
                                You have {Math.round(utils.formatEther(pendingToRedeem.toString()) * 1e8) / 1e8} ETH to redeem this month
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
                                    onClick={() => handleRedeem() }
                                    w="150px"
                                    fontSize={14}
                                    colorScheme="blue"
                                    variant="solid">
                                    Redeem
                                </Button>
                            </HStack>

                            </>
                        :

                            <Text
                                pt={{
                                    base: "3rem",
                                    md: "5rem",
                                    xl: "5rem"
                                }}
                                color="blue.300"
                                fontSize={{
                                    "base": "1xl",
                                    "md": "1xl",
                                    "xl": "1xl"
                                }}
                                fontWeight="bold">
                                Please, connect your wallet
                            </Text>

                        }
                        
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
                            fallbackSrc="https://ipfs.io/ipfs/QmXUdRBhkNaYTw4Sii1LgKpeJ7iC9p7RrZQGJ5MRwumobp"
                            boxSize="500px" />

                        <canvas id="canvas" className="hidden"></canvas>
                    
                    </Center>
                    
                </WrapItem>

            </Wrap >

            <Center>
                <Text
                    pt={{
                        base: "1rem",
                        md: "1rem",
                        xl: "1rem"
                    }}
                    color="gray.700"
                    fontSize={{
                        "base": "2xl",
                        "md": "2xl",
                        "xl": "2xl"
                    }}
                    fontWeight="bold">
                    {Math.round(utils.formatEther(totalSentToCharity.toString()) * 1e8) / 1e8} ETH sent to charity until now
                </Text>
            </Center>

        </VStack>

        <Center>
            <Modal isOpen={isOpen} onClose={onClose} isCentered={true}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>Congrats!</ModalHeader>
                    {/* <ModalCloseButton /> */}
                    <ModalBody>
                        {nftInfo[1] ?
                        <>
                        <Text fontSize="lg">Woohoo! You have minted an special NFT! (Id: {nftInfo[0]}, Weight: {nftInfo[2]})</Text>
                        </>
                        :
                        <>
                        <Text fontSize="lg">Your standard NFT has been minted! (Id: {nftInfo[0]})</Text>
                        </>
                        }
                    </ModalBody>

                    <ModalFooter>
                        <Button colorScheme="blue" mr={3} onClick={onClose}>
                        Close
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal>
        </Center>

        </>
    );

}