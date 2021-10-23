import React, {useEffect} from "react";
import {
    Center
  } from '@chakra-ui/react';
import {
    Switch,
    Route, 
    useLocation   
} from "react-router-dom";
import useStore from '../store';
import { topMenuItems } from '../data/menuItems';
import Home from './Home';

export default function Content () {
    let location = useLocation();
    const { setPageSelected } = useStore();

    useEffect(() => {
        let item = topMenuItems.find(i => i.url == location.pathname);
        setPageSelected(item.id);
    }, [location]);

    return(
        <Center>
            <Switch>
                <Route exact path="/" component={Home} />
            </Switch>
        </Center>
    );

} 
