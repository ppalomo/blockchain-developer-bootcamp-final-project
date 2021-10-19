// import React, { useState, useEffect } from "react";
// import { ethers, utils } from 'ethers';
// import useStore from '../../store';
// import { useContract, useAdminContract } from '../../hooks/contractHooks';
// import p5 from 'p5';
// import {
//     Button,
//     Center,
//     HStack,
//     Input,
//     Image,
//     Progress,
//     Skeleton, SkeletonCircle, SkeletonText,
//     Stack,
//     Text,
//     VStack,
//     Wrap, WrapItem,
//     useColorModeValue
// } from '@chakra-ui/react';
// const IPFS = require('ipfs-api');

// export default function Home (props) {
//     const { isWalletConnected } = useStore();
//     const factoryContract = useContract("PlasmidsFactory");
//     const factoryAdminContract = useAdminContract("PlasmidsFactory");
//     const nftAdminContract = useAdminContract("Plasmids");
//     const [mintingPrice, setMintingPrice] = useState();
//     const [maxSupply, setMaxSupply] = useState();
//     const [totalSupply, setTotalSupply] = useState();
//     const [stakedAmount, setStakedAmount] = useState();
//     const [currentYield, setCurrentYield] = useState();
//     const [dna, setDna] = useState();
//     const [sketch, setSketch] = useState();
//     const [hash, setHash] = useState(null);
//     const canvasWidth=500;
//     const canvasHeight=500;
//     let cells = 22;
//     let cellWidth = canvasWidth/cells;
//     let rows = canvasHeight/cells;
//     let columns = canvasWidth/cells;
//     var palettes = [
//         [
//             [247,207,101],
//             [214,174,101],
//             [235,181,108],
//             [212,144,87],
//             [245,203,181]
//         ],
//         [
//             [247,101,92],
//             [214,92,114],
//             [235,98,175],
//             [212,78,205],
//             [231,171,245]
//         ],
//         [
//             [174,168,247],
//             [153,118,214],
//             [213,171,235],
//             [207,144,212],
//             [245,196,225]
//         ],
//         [
//             [166,247,232],
//             [116,204,214],
//             [170,210,235],
//             [142,166,212],
//             [198,201,245]
//         ],

//         [
//             [158,247,159],
//             [109,214,141],
//             [163,235,206],
//             [135,212,204],
//             [206,238,245]
//         ],
//         [
//             [245,193,176],
//             [212,159,125],
//             [233,209,180],
//             [255,231,184],
//             [242,229,184]
//         ],
//         [
//             [203,130,250],
//             [194,82,217],
//             [235,139,226],
//             [214,114,163],
//             [245,211,214]
//         ],
//         [
//             [72,62,250],
//             [83,104,219],
//             [167,191,235],
//             [116,170,214],
//             [176,228,245]
//         ],
//         [
//             [148,187,255],
//             [255,199,229],
//             [174,204,255],
//             [255,221,148],
//             [163,255,161]
//         ],
//         [
//             [16,16,16],
//             [93,93,93],
//             [72,72,72],
//             [150,150,150],
//             [84,84,84]
//         ],
//      ];
    
//     const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

//     useEffect(async () => {
//         if (factoryAdminContract)
//         {
//             await fetchData();

//             // if (sketch != null)
//             // {
//             //     sketch.remove();
//             // }
//             // setSketch(new p5(setupSketch, 'canvas'))

//         }
//     }, [factoryAdminContract]);

//     // useEffect(() => {
//     //     if (sketch != null)
//     //     {
//     //         sketch.remove();
//     //     }
//     //     setSketch(new p5(setupSketch, 'canvas'))
//     // }, [dna]);

//     async function fetchData() {
//         try {
//             if(factoryAdminContract != null && nftAdminContract != null) {
//                 const price = await factoryAdminContract.mintingPrice();
//                 setMintingPrice(price.toString());

//                 const mSupply = await factoryAdminContract.maxSupply();
//                 setMaxSupply(mSupply.toString());

//                 const tSupply = await nftAdminContract.totalSupply();
//                 setTotalSupply(tSupply.toString());

//                 const stkAmount = await factoryAdminContract.stakedAmount();
//                 setStakedAmount(stkAmount.toString());

//                 const cYield = await factoryAdminContract.currentYield();
//                 setCurrentYield(cYield.toString());
//             }
//         } catch (err) {
//             console.log("Error: ", err);
//         } 
//     }

//     async function handleMinting(e) {
//         // let imageURI = "https://ipfs.io/ipfs/QmWNcYhEcggdm1TFt2m6WmGqqQwfFXudr5eFzKPtm1nYwq";
//         // let metadataURI = "https://ipfs.io/ipfs/QmUCxDBKCrx2JXV4ZNYLwhUPXqTvRAu6Zceoh1FNVumoec";

//         if (isWalletConnected && factoryContract != null)
//         {
//             try {              
//                 // Generating a random DNA
//                 const tx = await factoryContract.getRandomDna();
//                 const result = await tx.wait();
//                 setDna(result.events[0].args[1])
//                 console.log(dna);

//                 if (sketch != null)
//                 {
//                     sketch.remove();
//                 }
//                 setSketch(new p5(setupSketch, 'canvas'))

//                 // handleSave();

//         //             console.log("dna generated!")
                    
//         //             const tx2 = await factoryContract.mintNFT(imageURI,metadataURI, {value: mintingPrice.toString()});
//         //             await tx2.wait();

//         //             console.log("nft minted!")

//                 fetchData();
//             } catch (err) {
//                 console.log("Error: ", err);
//             }
//         }
//     }

//     async function handlRedeem(e) {
//         setDna("060100");
//         if (sketch != null)
//         {
//             sketch.remove();
//         }
//         setSketch(new p5(setupSketch, 'canvas'))
//     }

//     // function handleSave() {
//     //     // sketch.saveCanvas('canvas', 'jpg');
//     // }

//     const setupSketch = (s) => {
//         var buffer;
//         var image;
        
//         s.setup = () => {
//             s.createCanvas(canvasWidth, canvasHeight);
//         }
    
//         s.draw = () => {
//             var colors = palettes[Math.floor(Math.random()*palettes.length)];
//             s.background(255);
//             s.stroke(255);

//             for (let x = 0; x < columns; x++) {
//                 for (let y = 0; y < rows; y++) { 
//                     let color = colors[Math.floor(Math.random()*colors.length)];
//                     s.fill(color);
//                     s.square(cellWidth*x, cellWidth*y, cellWidth);
//                 }
//             }

//             s.noLoop();
            
//             // ***************************************
            
//             // var img = s.get();
//             // console.log(img);

//             // var img = s.createGraphics();
//             // console.log(img)
        
//             // Uploading image to IPFS
//             // ipfs.files.add(imageBuffer.data, (error, result) => {
//             //     if(error) {
//             //         console.error(error)
//             //         return
//             //     }
//             //     setHash(result[0].hash);
//             //     // uploadMetadata(result[0].hash);
//             // });
//             // ***************************************
            
//             s.saveCanvas('plasmid_' + dna, 'jpg');
//             s.remove();
//         }
//     }

//     // function decodeBase64Image(dataString) {
//     //     var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
//     //       response = {};
      
//     //     if (matches.length !== 3) {
//     //       return new Error('Invalid input string');
//     //     }
      
//     //     response.type = matches[1];
//     //     response.data = new Buffer(matches[2], 'base64');
      
//     //     return response;
//     // }
    
//     return(
//         <Wrap
//             mt={{
//                 base: "1.5rem",
//                 md: "2rem",
//                 xl: "2rem"
//             }}
//             minHeight="500px"
//             w="1000px"
//             bgColor={useColorModeValue("header.100", "header.900")}
//             borderWidth="1px"
//             borderColor={useColorModeValue("gray.200", "gray.700")}
//             rounded="xl"
//             position="relative"
//             shadow="lg">
            
//             <WrapItem
//                p="20px"
//                w="450px">
//                     <VStack 
//                         mt={{
//                             base: "1.5rem",
//                             md: "2rem",
//                             xl: "2rem"
//                         }}
//                         w="100%">

//                         <Text                        
//                             color="gray.700"
//                             fontSize={{
//                                 "base": "3xl",
//                                 "md": "3xl",
//                                 "xl": "3xl"
//                             }}
//                             fontWeight="bold">
//                             MEET THE PLASMIDS!
//                         </Text>

//                         <HStack 
//                             spacing="20px"
//                             pt={{
//                                 base: ".5rem",
//                                 md: "1rem",
//                                 xl: "1rem"
//                             }}>
//                             <VStack>
//                                 <Text fontSize="0.8rem" fontWeight="500" color="gray.400">PRICE</Text>                                    
//                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
//                                     {mintingPrice != undefined ? Math.round(utils.formatEther(mintingPrice.toString()) * 1e3) / 1e3 : ""} ETH
//                                 </Text>
//                             </VStack>
//                             <VStack>
//                                 <Text fontSize="0.8rem" fontWeight="500" color="gray.400">SUPPLY</Text>                                    
//                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
//                                     {totalSupply}/{maxSupply}
//                                 </Text>
//                             </VStack>
//                             <VStack>
//                                 <Text fontSize="0.8rem" fontWeight="500" color="gray.400">STAKED</Text>
//                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
//                                     {stakedAmount != undefined ? Math.round(utils.formatEther(stakedAmount.toString()) * 1e3) / 1e3 : ""} ETH
//                                 </Text>
//                             </VStack>
//                             <VStack>
//                                 <Text fontSize="0.8rem" fontWeight="500" color="gray.400">YIELD</Text>
//                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
//                                     {currentYield != undefined ? Math.round(utils.formatEther(currentYield.toString()) * 1e3) / 1e3 : ""} ETH
//                                 </Text>
//                             </VStack>
//                         </HStack>

//                         <HStack 
//                             spacing="20px"
//                             pt={{
//                                 base: ".5rem",
//                                 md: "2rem",
//                                 xl: "2rem"
//                             }}>
//                             <Button 
//                                 isDisabled={!isWalletConnected}
//                                 onClick={() => handleMinting() }
//                                 w="150px"
//                                 fontSize={14}
//                                 colorScheme="green"
//                                 variant="solid">
//                                 Mint
//                             </Button>
//                             <Button 
//                                 onClick={() => handlRedeem() }
//                                 w="150px"
//                                 fontSize={14}
//                                 colorScheme="blue"
//                                 variant="solid">
//                                 Redeem
//                             </Button>
//                         </HStack>

                        

//                     </VStack>                
//             </WrapItem>

//             <WrapItem
//                 p="20px"
//                 w="auto">
                    
//                 <Center w="500px" h="500px" bg="gray.100">
//                     <Text fontSize="0.8rem" fontWeight="500" color="gray.400">MINT A NEW RANDOM NFT</Text>
//                 </Center>
                
//             </WrapItem>

//             <div visibility="hidden" id="canvas"></div>

//         </Wrap >
//     );

// }

// //     const [mintingPrice, setMintingPrice] = useState();
// //     const [maxSupply, setMaxSupply] = useState();
// //     const [totalSupply, setTotalSupply] = useState();
// //     const [stakedAmount, setStakedAmount] = useState();
// //     const [currentYield, setCurrentYield] = useState();

// //     useEffect(async () => {
// //         if (factoryAdminContract)
// //             await fetchData();
// //     }, [factoryAdminContract]);

// //     async function fetchData() {
// //         try {
// //             if(factoryAdminContract != null && nftAdminContract != null) {
// //                 const price = await factoryAdminContract.mintingPrice();
// //                 setMintingPrice(price.toString());

// //                 const mSupply = await factoryAdminContract.maxSupply();
// //                 setMaxSupply(mSupply.toString());

// //                 const tSupply = await nftAdminContract.totalSupply();
// //                 setTotalSupply(tSupply.toString());

// //                 const stkAmount = await factoryAdminContract.stakedAmount();
// //                 setStakedAmount(stkAmount.toString());

// //                 const cYield = await factoryAdminContract.currentYield();
// //                 setCurrentYield(cYield.toString());
// //             }
// //         } catch (err) {
// //             console.log("Error: ", err);
// //         }   
// //     }

// //     async function handleMinting(e) {
// //         let imageURI = "https://ipfs.io/ipfs/QmWNcYhEcggdm1TFt2m6WmGqqQwfFXudr5eFzKPtm1nYwq";
// //         let metadataURI = "https://ipfs.io/ipfs/QmUCxDBKCrx2JXV4ZNYLwhUPXqTvRAu6Zceoh1FNVumoec";

// //         if (isWalletConnected)
// //         {
// //             try {
// //                 if(factoryContract != null) {              
// //                     const tx = await factoryContract.getRandomDna();
// //                     const result = await tx.wait();
// //                     const dna = result.events[0].args[1];

// //                     console.log(dna);

// //                     console.log("dna generated!")
                    
// //                     const tx2 = await factoryContract.mintNFT(imageURI,metadataURI, {value: mintingPrice.toString()});
// //                     await tx2.wait();

// //                     console.log("nft minted!")

// //                     fetchData();
// //                 }
// //             } catch (err) {
// //                 console.log("Error: ", err);
// //             }
// //             // setIsDepositOpen(false);
// //         }
// //     }

// //     return(
// //         <Center
// //             mt={{
// //                 base: "1.5rem",
// //                 md: "2rem",
// //                 xl: "2rem"
// //             }}
// //             minHeight="100px"
// //             w="50%"
// //             bgColor={useColorModeValue("header.100", "header.900")}
// //             borderWidth="1px"
// //             borderColor={useColorModeValue("gray.200", "gray.700")}
// //             rounded="xl"
// //             position="relative"
// //             shadow="lg">
// //             <VStack spacing={10} p="2rem" w="100%">
// //                 <Text
// //                     color="gray.800"
// //                     fontSize={{
// //                         "base": "3xl",
// //                         "md": "3xl",
// //                         "xl": "3xl"
// //                     }}
// //                     fontWeight="bold">
// //                     Mint a Plasmid!
// //                 </Text>

// //                 <Center w="60%" spacing={2}>
// //                     <WrapItem w="20%">
// //                         <VStack>
// //                             <Text fontSize="0.9rem" fontWeight="500" color="primary.500">NFT Price</Text>
// //                             <HStack>
// //                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
// //                                     {mintingPrice != undefined ? Math.round(utils.formatEther(mintingPrice.toString()) * 1e3) / 1e3 : ""} ETH
// //                                 </Text>
// //                             </HStack>
// //                         </VStack>
// //                     </WrapItem>
// //                     <WrapItem w="20%">
// //                         <VStack>
// //                             <Text fontSize="0.9rem" fontWeight="500" color="primary.500">Supply</Text>
// //                             <HStack>
// //                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
// //                                     {totalSupply}/{maxSupply}
// //                                 </Text>
// //                             </HStack>
// //                         </VStack>
// //                     </WrapItem>

// //                     <WrapItem w="20%">
// //                         <VStack>
// //                             <Text fontSize="0.9rem" fontWeight="500" color="primary.500">In Stake</Text>
// //                             <HStack>
// //                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
// //                                     {stakedAmount != undefined ? Math.round(utils.formatEther(stakedAmount.toString()) * 1e3) / 1e3 : ""} ETH
// //                                 </Text>
// //                             </HStack>
// //                         </VStack>
// //                     </WrapItem>
// //                     <WrapItem w="20%">
// //                         <VStack>
// //                             <Text fontSize="0.9rem" fontWeight="500" color="primary.500">Supply</Text>
// //                             <HStack>
// //                                 <Text fontSize="0.9rem" fontWeight="500" color="white.100">
// //                                     {currentYield != undefined ? Math.round(utils.formatEther(currentYield.toString()) * 1e3) / 1e3 : ""} ETH
// //                                 </Text>
// //                             </HStack>
// //                         </VStack>
// //                     </WrapItem>
// //                 </Center>

// //                 {/* <Progress hasStripe value={totalSupply} w="60%" h="20px" max={maxSupply} /> */}

// //                 <Button 
// //                     isDisabled={!isWalletConnected}
// //                     onClick={() => handleMinting() }
// //                     w="33%"
// //                     fontSize={14}
// //                     colorScheme="blue"
// //                     variant="outline">
// //                         Mint
// //                 </Button>

// //                 <Canvas mintingPrice={mintingPrice} />
                
                
// //             </VStack>
// //         </Center>
// //     );

// // } 
