//#region [Imports]

import React, {useEffect} from "react";
import {
    Button,
    ButtonGroup,
    Flex,
    HStack,
    Image,
    Text,
    useColorMode,
    useColorModeValue,
} from '@chakra-ui/react';
import {
    Link,
} from "react-router-dom";
import { utils } from 'ethers';
import { FaDiscord, FaMoon, FaSun, FaTwitter, FaBars, FaUser } from 'react-icons/fa';
import { truncate } from '../utils/stringsHelper';
import useStore from '../store';
import { topMenuItems } from '../data/menuItems';

//#endregion

export default function Header (props) {
    const { colorMode, toggleColorMode } = useColorMode();
    const { isWalletConnected, wallet, balance, setBalance, signer, network, toggleWalletModal, toggleNetworkModal, pageSelected, setNetwork } = useStore();
    const borderColor = useColorModeValue("border.100", "border.900");
    const textColor = useColorModeValue("text.100", "text.900");
    const addressBg = useColorModeValue("border.100", "border.900");

    return(
        <>

            <Flex
                display={{
                    base: "none",
                    md: "none",
                    xl: "flex"
                }}
                as="header"
                w="100%"
                h={{
                    base: "5rem", // 0-48em
                    md: "5rem", // 48em-80em,
                    xl: "5rem", // 80em+
                }}
                m="0 auto"
                position="sticky"
                alignItems="center"
                justifyContent="space-between"
                px={['0.5rem', '0.5rem', '1.5rem']}
                bgColor={useColorModeValue("header.100", "header.900")}
                borderBottom="1px"
                borderColor={borderColor}>

                <Link to="/">
                    <Text
                        ml="1rem"
                        bgGradient="linear(to-l, #7928CA,#FF0080)"
                        bgClip="text"
                        fontSize={{
                            "base": "4xl",
                            "md": "4xl",
                            "xl": "5xl"
                        }}
                        fontWeight="extrabold">
                        PLASMIDS
                    </Text>
                </Link>

                <ButtonGroup variant="ghost" color="gray.600" mr="1rem">

                    {!isWalletConnected ?
                        <Button 
                            variant="outline" 
                            bg="transparent" 
                            borderColor={borderColor}
                            onClick={() => toggleWalletModal()}>
                            Connect wallet
                        </Button>
                    :
                        <Button 
                            p={2}
                            variant="outline" 
                            bg="transparent" 
                            borderColor={borderColor} 
                            onClick={() => toggleWalletModal()}>
                            <HStack spacing="10px">
                                <Flex pl={2}>
                                    <Text
                                        color={textColor}
                                        fontSize="sm">                                    
                                        {balance != null ? Math.round(utils.formatEther(balance) * 1e3) / 1e3 + ' ' + network.symbol : ""}
                                    </Text>
                                </Flex>
                                <Flex 
                                    bg={addressBg}
                                    border="1px"
                                    borderColor={borderColor}
                                    p={1.5} rounded="md"
                                    position="relative">
                                    <HStack>
                                        <Text
                                            color={textColor}
                                            fontSize="sm">                                    
                                            {truncate(wallet, 15, '...')}
                                        </Text>
                                        {/* <FaUser size={15}/> */}
                                    </HStack>
                                </Flex>
                            </HStack>
                        </Button>
                    }

                    { network ?
                    <Button 
                        variant="outline" 
                        bg="transparent" 
                        borderColor={borderColor}
                        onClick={() => toggleNetworkModal()}>
                        <HStack spacing="10px">
                            <Image 
                                src={`images/${network.icon}`} 
                                h="20px" objectFit="cover" />
                            <Text 
                                fontSize="md" 
                                color={textColor}>
                                {network.name}                                    
                            </Text>
                        </HStack>
                    </Button>
                    :
                    <></>
                    }

                </ButtonGroup>

            </Flex>
        </>
    );

}