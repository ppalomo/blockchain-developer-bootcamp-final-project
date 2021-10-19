import React, { useState, useEffect } from "react";
import { ethers, utils } from 'ethers';
import p5 from 'p5';
import {
    Button,
    Center,
    HStack,
    VStack
  } from '@chakra-ui/react';
import { useContract, useAdminContract } from '../hooks/contractHooks';
import useStore from '../store';

export default function Canvas (props) {
    const [sketch, setSketch] = useState();
    const [dna, setDna] = useState();

    const { isWalletConnected } = useStore();    
    const factoryContract = useContract("PlasmidsFactory");

    const canvasWidth=1200;
    const canvasHeight=1200;
    let cells = 22;
    let cellWidth = canvasWidth/cells;
    let rows = canvasHeight/cells;
    let columns = canvasWidth/cells;

    var palettes = [
        [
            [247,207,101],
            [214,174,101],
            [235,181,108],
            [212,144,87],
            [245,203,181]
        ],
        [
            [247,101,92],
            [214,92,114],
            [235,98,175],
            [212,78,205],
            [231,171,245]
        ],
        [
            [174,168,247],
            [153,118,214],
            [213,171,235],
            [207,144,212],
            [245,196,225]
        ],
        [
            [166,247,232],
            [116,204,214],
            [170,210,235],
            [142,166,212],
            [198,201,245]
        ],

        [
            [158,247,159],
            [109,214,141],
            [163,235,206],
            [135,212,204],
            [206,238,245]
        ],
        [
            [245,193,176],
            [212,159,125],
            [233,209,180],
            [255,231,184],
            [242,229,184]
        ],
        [
            [203,130,250],
            [194,82,217],
            [235,139,226],
            [214,114,163],
            [245,211,214]
        ],
        [
            [72,62,250],
            [83,104,219],
            [167,191,235],
            [116,170,214],
            [176,228,245]
        ],
        [
            [148,187,255],
            [255,199,229],
            [174,204,255],
            [255,221,148],
            [163,255,161]
        ],
        [
            [16,16,16],
            [93,93,93],
            [72,72,72],
            [150,150,150],
            [84,84,84]
        ],
     ];

    useEffect(() => {
        if (sketch != null)
        {
            sketch.remove();
        }
        setSketch(new p5(calculateImage, 'canvas'))
    }, [dna]);

    // async function handleMinting(e) {
    //     let imageURI = "https://ipfs.io/ipfs/QmWNcYhEcggdm1TFt2m6WmGqqQwfFXudr5eFzKPtm1nYwq";
    //     let metadataURI = "https://ipfs.io/ipfs/QmUCxDBKCrx2JXV4ZNYLwhUPXqTvRAu6Zceoh1FNVumoec";

    //     if (isWalletConnected)
    //     {
    //         try {
    //             if(factoryContract != null) {    
    //                 console.log(factoryContract);          
    //                 let tx = await factoryContract.getRandomDna();
    //                 const result = await tx.wait();
                    
    //                 const dna = result.events[0].args[1];
    //                 console.log(dna);
    //                 console.log("dna generated!")
    //                 console.log(props.mintingPrice.toString());

    //                 tx = await factoryContract.mintNFT(imageURI, metadataURI, {value: mintingPrice.toString()});
    //                 // await tx2.wait();

    //                 console.log("nft minted!")

    //         //         fetchData();
    //             }
    //         } catch (err) {
    //             console.log("Error: ", err);
    //         }
    //     }
    // }

    const calculateImage = (s) => {
        
        console.log(dna)

        if (dna != undefined) {
            const splittedDna = dna.match(/.{2}/g);
            
            cells = getNumCells(splittedDna[1]);
            cellWidth = canvasWidth/cells;
            rows = canvasHeight/cells;
            columns = canvasWidth/cells;
            
            console.log(splittedDna)
    
            s.setup = () => {
                s.createCanvas(canvasWidth, canvasHeight);
            }
    
            s.draw = () => {
                var colors = palettes[parseInt(splittedDna[0])];
                // var colors = palettes[7]; //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                s.background(255);
                s.stroke(255);
    
                for (let x = 0; x < columns; x++) {
                    for (let y = 0; y < rows; y++) {
                        
                        let color = colors[Math.floor(Math.random()*colors.length)];
                        s.fill(color);
                        s.square(cellWidth*x, cellWidth*y, cellWidth);
    
                        if (splittedDna[2]=="01") {
                            color = colors[Math.floor(Math.random()*colors.length)];
                            s.circle(cellWidth*x, cellWidth*y, cellWidth);
                        }
                    }
                }
    
                s.noLoop();
            }
        }

    }

    const setupSketch = (s) => {
        
        s.setup = () => {
            s.createCanvas(canvasWidth, canvasHeight);
        }
    
        s.draw = () => {
            var colors = palettes[Math.floor(Math.random()*palettes.length)];
            s.background(255);
            s.stroke(255);

            for (let x = 0; x < columns; x++) {
                for (let y = 0; y < rows; y++) {
                    
                    let color = colors[Math.floor(Math.random()*colors.length)];
                    s.fill(color);
                    s.square(cellWidth*x, cellWidth*y, cellWidth);

                    // color = colors[Math.floor(Math.random()*colors.length)];
                    // s.circle(cellWidth*x, cellWidth*y, cellWidth);

                    // let shapeWidth=200;
                    // s.fill(0,0,0);
                    // s.square(canvasWidth/2-shapeWidth/2, 250, cellWidth);
                    
                    

                }
            }

            s.noLoop();
        }
    }

    async function handleGenerate(e) {
        // const dna = await getRandomDna();
        // setDna(dna);
        
        if (sketch != null)
        {
            sketch.remove();
        }
        setSketch(new p5(setupSketch, 'canvas'))
    }

    async function getRandomDna() {
        const p1 = Math.floor(Math.random() * 10);
        const p2 = Math.floor(Math.random() * 4);
        const p3 = Math.floor(Math.random() * 2);        
        let dna = ("0" + p1).slice(-2) + ("0" + p2).slice(-2) + ("0" + p3).slice(-2);
        return dna;
    }

    function getNumCells(code){
        switch (code) {
            case '00':
                return 22;
            case '01':
                return 20;
            case '02':
                return 18;
            case '03':
                return 16;
            default:
                return 22;
        }
    }

    async function handleSave(e) {
        sketch.saveCanvas('canvas', 'jpg');
    }

    return(
        <VStack>

            <p>{props.mintingPrice}</p>

            {/* <Button 
                isDisabled={!isWalletConnected}
                onClick={() => handleMinting() }
                w="100px"
                fontSize={14}
                colorScheme="blue"
                variant="outline">
                    Mint
            </Button> */}

            <Button 
                onClick={() => handleGenerate() }
                w="100px"
                fontSize={14}
                colorScheme="blue"
                variant="outline">
                    Generate
            </Button>

            <div id="canvas"></div>

            <Button 
                onClick={() => handleSave() }
                w="100px"
                fontSize={14}
                colorScheme="blue"
                variant="outline">
                    Save
            </Button>
        </VStack>
    );

} 
