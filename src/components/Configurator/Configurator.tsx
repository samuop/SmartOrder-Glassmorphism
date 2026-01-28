/*!

=========================================================
* Vision UI Free Chakra - v1.0.0
=========================================================

* Product Page: https://www.creative-tim.com/product/vision-ui-free-chakra
* Copyright 2021 Creative Tim (https://www.creative-tim.com/)
* Licensed under MIT (https://github.com/creativetimofficial/vision-ui-free-chakra/blob/master LICENSE.md)

* Design and Coded by Simmmple & Creative Tim

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

// Chakra Imports
import {
  Box,
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  Flex,
  Link,
  Switch,
  Text,
  DarkMode,
  LightMode,
} from "@chakra-ui/react";
import { Separator } from "../Separator/Separator";
import PropTypes from "prop-types";
import React, { useState } from "react";
import { FaTwitter, FaFacebook } from "react-icons/fa";

export default function Configurator(props) {
  const { secondary, isOpen, onClose, isChecked, onSwitch, ...rest } = props;
  const [switched, setSwitched] = useState(isChecked);

  // Chakra Color Mode
  let fixedDisplay = "flex";
  if (secondary) {
    fixedDisplay = "none";
  }
  let colorButton = "white";
  const secondaryButtonColor = "white";
  const settingsRef = React.useRef();
  return (
    <>
      <Drawer
        isOpen={props.isOpen}
        onClose={props.onClose}
        placement={document.documentElement.dir === "rtl" ? "left" : "right"}
        finalFocusRef={settingsRef}
        blockScrollOnMount={false}>
        <DrawerContent
          bg='linear-gradient(111.84deg, rgba(6, 11, 38, 0.94) 59.3%, rgba(26, 31, 55, 0) 100%)'
          backdropFilter='blur(42px)'>
          <DrawerHeader pt='24px' px='24px'>
            <DrawerCloseButton color='white' />
            <Text color='white' fontSize='xl' fontWeight='bold' mt='16px'>
              Vision UI Configurator
            </Text>
            <Text color='white' fontSize='md' mb='16px'>
              See your dashboard options.
            </Text>
            <Separator />
          </DrawerHeader>
          <DrawerBody w='340px' ps='24px' pe='40px'>
            <Flex flexDirection='column'>
              <Box
                display={fixedDisplay}
                justifyContent='space-between '
                mb='20px'>
                <DarkMode>
                  <Text color='white' fontSize='md' fontWeight='600' mb='4px'>
                    Navbar Fixed
                  </Text>
                  <Switch
                    colorScheme='brand'
                    isChecked={switched}
                    onChange={(event) => {
                      if (switched === true) {
                        onSwitch(false);
                        setSwitched(false);
                      } else {
                        onSwitch(true);
                        setSwitched(true);
                      }
                    }}
                  />
                </DarkMode>
              </Box>
              
              <Separator />
              
              <Box mt='24px'>
                <Text color='white' fontSize='md' fontWeight='600' mb='12px'>
                  Thank you for sharing!
                </Text>
                <Flex justifyContent='center'>
                  <Link
                    isExternal
                    href='https://twitter.com/intent/tweet?text=Check%20Vision%20UI%20Free%20Chakra%20made%20by%20@simmmple_web%20and%20@CreativeTim%20#webdesign%20#chakra-ui%20#react'>
                    <Button
                      colorScheme='twitter'
                      leftIcon={<FaTwitter />}
                      me='10px'>
                      <Text>Tweet</Text>
                    </Button>
                  </Link>
                  <Link
                    isExternal
                    href='https://www.facebook.com/sharer/sharer.php?u=https://www.creative-tim.com/product/vision-ui-free-chakra'>
                    <Button colorScheme='facebook' leftIcon={<FaFacebook />}>
                      <Text>Share</Text>
                    </Button>
                  </Link>
                </Flex>
              </Box>
            </Flex>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
Configurator.propTypes = {
  secondary: PropTypes.bool,
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  isChecked: PropTypes.bool,
  onSwitch: PropTypes.func,
};
