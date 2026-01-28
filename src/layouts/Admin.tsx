import {
  Box,
  Flex,
  useColorMode,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerBody,
  IconButton,
  VStack,
  HStack,
  Text,
  Link as ChakraLink,
  Icon,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Stack,
  Input,
  InputGroup,
  InputLeftElement,
  Button,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Divider,
} from '@chakra-ui/react'
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { Suspense, lazy, useState } from 'react'
import { HamburgerIcon, SearchIcon, BellIcon } from '@chakra-ui/icons'
import { FaCalculator } from 'react-icons/fa'
import { ProfileIcon, SettingsIcon as VisionSettingsIcon, SimmmpleLogoWhite } from '../components/Icons/Icons'
import { ColorModeToggle } from '../components/common/ColorModeToggle'
import { Separator } from '../components/Separator/Separator'
import IconBox from '../components/Icons/IconBox'
import Configurator from '../components/Configurator/Configurator'
import Footer from '../components/Footer/Footer'

// Lazy load del Cotizador
const CotizadorPage = lazy(() => import('../views/Cotizador'))

// Rutas del sidebar
const sidebarRoutes = [
  { path: '/admin/cotizador', name: 'Cotizaciones', icon: FaCalculator },
]

// Loading spinner con estilo Vision UI
function LoadingSpinner() {
  return (
    <Flex h="100%" w="100%" align="center" justify="center" minH="400px">
      <Box
        w="50px"
        h="50px"
        borderRadius="full"
        border="3px solid"
        borderColor="brand.500"
        borderTopColor="transparent"
        animation="spin 0.8s linear infinite"
        sx={{
          '@keyframes spin': {
            '0%': { transform: 'rotate(0deg)' },
            '100%': { transform: 'rotate(360deg)' },
          },
        }}
      />
    </Flex>
  )
}

// Sidebar Content con estilo Vision UI original
function SidebarContent({ onClose }: { onClose?: () => void }) {
  const location = useLocation()

  // Colores Vision UI originales
  const activeBg = '#1A1F37'
  const inactiveBg = '#1A1F37'
  const activeColor = 'white'
  const inactiveColor = 'white'

  return (
    <Box>
      {sidebarRoutes.map((route) => {
        const isActive = location.pathname.startsWith(route.path)
        return (
          <NavLink to={route.path} key={route.path} onClick={onClose}>
            <Flex
              boxSize="initial"
              justifyContent="flex-start"
              alignItems="center"
              bg={isActive ? activeBg : 'transparent'}
              backdropFilter={isActive ? 'blur(42px)' : 'none'}
              mb="12px"
              mx="auto"
              ps="10px"
              py="12px"
              borderRadius="15px"
              cursor="pointer"
              _hover={{ bg: isActive ? activeBg : 'whiteAlpha.100' }}
              transition="all 0.2s"
            >
              <IconBox
                bg={isActive ? 'brand.200' : inactiveBg}
                color={isActive ? 'white' : 'brand.200'}
                h="30px"
                w="30px"
                me="12px"
                transition="0.2s linear"
              >
                <Icon as={route.icon} boxSize={4} />
              </IconBox>
              <Text color={isActive ? activeColor : inactiveColor} my="auto" fontSize="sm">
                {route.name}
              </Text>
            </Flex>
          </NavLink>
        )
      })}
    </Box>
  )
}

// Navbar con estilo Vision UI original
function Navbar({
  onOpenSidebar,
  onOpenConfigurator,
  fixed
}: {
  onOpenSidebar: () => void;
  onOpenConfigurator: () => void;
  fixed: boolean
}) {
  // Colores Vision UI
  const mainText = 'white'
  const navbarIcon = 'white'
  const inputBg = '#0F1535'

  return (
    <Flex
      position={fixed ? 'fixed' : 'absolute'}
      zIndex="10"
      boxShadow="none"
      bg="none"
      borderColor="transparent"
      filter="none"
      backdropFilter="blur(42px)"
      borderWidth="1.5px"
      borderStyle="solid"
      transitionDelay="0s, 0s, 0s, 0s"
      transitionDuration="0.25s, 0.25s, 0.25s, 0s"
      transitionTimingFunction="linear, linear, linear, linear"
      alignItems={{ xl: 'center' }}
      borderRadius="16px"
      display="flex"
      minH="75px"
      justifyContent={{ xl: 'center' }}
      lineHeight="25.6px"
      mx="auto"
      pb="8px"
      right="30px"
      px={{ sm: '15px', md: '30px' }}
      ps={{ xl: '12px' }}
      pt="8px"
      top="18px"
      w={{ sm: 'calc(100vw - 60px)', xl: 'calc(100vw - 75px - 275px)' }}
    >
      <Flex
        w="100%"
        flexDirection={{ sm: 'column', md: 'row' }}
        alignItems={{ xl: 'center' }}
      >
        {/* Breadcrumb y título */}
        <Box mb={{ sm: '8px', md: '0px' }}>
          <Breadcrumb>
            <BreadcrumbItem color="#A0AEC0">
              <BreadcrumbLink href="#" color="#A0AEC0">
                Pages
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem color={mainText}>
              <BreadcrumbLink href="#" color={mainText}>
                Default
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <ChakraLink
            color={mainText}
            href="#"
            bg="inherit"
            borderRadius="inherit"
            fontWeight="bold"
            _hover={{ color: mainText }}
            _active={{ bg: 'inherit', transform: 'none', borderColor: 'transparent' }}
            _focus={{ boxShadow: 'none' }}
          >
            Default
          </ChakraLink>
        </Box>

        {/* Navbar Links */}
        <Box ms="auto" w={{ sm: '100%', md: 'unset' }}>
          <Flex
            pe={{ sm: '0px', md: '16px' }}
            w={{ sm: '100%', md: 'auto' }}
            alignItems="center"
            flexDirection="row"
          >
            {/* Search Input */}
            <InputGroup
              cursor="pointer"
              bg={inputBg}
              borderRadius="15px"
              borderColor="rgba(226, 232, 240, 0.3)"
              w={{ sm: '128px', md: '200px' }}
              me={{ sm: 'auto', md: '20px' }}
            >
              <InputLeftElement>
                <IconButton
                  aria-label="Search"
                  bg="inherit"
                  borderRadius="inherit"
                  _hover={{ bg: 'inherit' }}
                  _active={{ bg: 'inherit', transform: 'none', borderColor: 'transparent' }}
                  _focus={{ boxShadow: 'none' }}
                  icon={<SearchIcon color={navbarIcon} w="15px" h="15px" />}
                />
              </InputLeftElement>
              <Input
                fontSize="xs"
                py="11px"
                color="gray.400"
                placeholder="Type here..."
                borderRadius="inherit"
              />
            </InputGroup>

            {/* Sign In Button */}
            <NavLink to="/auth/signin">
              <Button
                ms="0px"
                px="0px"
                me={{ sm: '2px', md: '16px' }}
                color={navbarIcon}
                variant="transparent-with-icon"
                leftIcon={<ProfileIcon color={navbarIcon} w="22px" h="22px" me="0px" />}
              >
                <Text display={{ sm: 'none', md: 'flex' }}>Sign In</Text>
              </Button>
            </NavLink>

            {/* Mobile Menu Button */}
            <IconButton
              aria-label="Open menu"
              icon={<HamburgerIcon color="gray.500" w="18px" h="18px" />}
              variant="ghost"
              display={{ sm: 'flex', xl: 'none' }}
              onClick={onOpenSidebar}
              _hover={{ bg: 'transparent' }}
              _active={{ bg: 'transparent' }}
              _focus={{ boxShadow: 'none' }}
            />

            {/* Settings Icon */}
            <VisionSettingsIcon
              cursor="pointer"
              ms={{ base: '16px', xl: '0px' }}
              me="16px"
              onClick={onOpenConfigurator}
              color={navbarIcon}
              w="18px"
              h="18px"
            />

            {/* Notifications Menu */}
            <Menu>
              <MenuButton>
                <BellIcon color={navbarIcon} mt="-4px" w="18px" h="18px" />
              </MenuButton>
              <MenuList
                border="transparent"
                backdropFilter="blur(63px)"
                bg="linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.69) 76.65%)"
                borderRadius="20px"
              >
                <Flex flexDirection="column" p={4}>
                  <Text color="white" fontSize="sm">
                    No hay notificaciones
                  </Text>
                </Flex>
              </MenuList>
            </Menu>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  )
}

export default function AdminLayout() {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const { isOpen: isOpenConfig, onOpen: onOpenConfig, onClose: onCloseConfig } = useDisclosure()
  const [fixed, setFixed] = useState(false)
  const { colorMode } = useColorMode()
  const isDark = colorMode === 'dark'

  // Estilos Vision UI
  const mainBg = isDark
    ? 'linear-gradient(159.02deg, #0F123B 14.25%, #090D2E 56.45%, #020515 86.14%)'
    : 'gray.50'
  const sidebarBg = 'linear-gradient(111.84deg, rgba(6, 11, 38, 0.94) 59.3%, rgba(26, 31, 55, 0) 100%)'

  return (
    <Flex minH="100vh" bg={mainBg} position="relative" overflow="hidden">
      {/* Fondo decorativo - Glow effects */}
      {isDark && (
        <>
          {/* Glow superior derecho - púrpura */}
          <Box
            position="fixed"
            top="-20%"
            right="-10%"
            w="50vw"
            h="50vw"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(67, 24, 255, 0.15) 0%, transparent 70%)"
            filter="blur(60px)"
            pointerEvents="none"
            zIndex={0}
          />
          {/* Glow inferior izquierdo - cyan */}
          <Box
            position="fixed"
            bottom="-30%"
            left="-10%"
            w="60vw"
            h="60vw"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(11, 197, 234, 0.1) 0%, transparent 70%)"
            filter="blur(80px)"
            pointerEvents="none"
            zIndex={0}
          />
          {/* Glow central - brand sutil */}
          <Box
            position="fixed"
            top="30%"
            right="20%"
            w="40vw"
            h="40vw"
            borderRadius="full"
            bg="radial-gradient(circle, rgba(88, 44, 255, 0.08) 0%, transparent 60%)"
            filter="blur(100px)"
            pointerEvents="none"
            zIndex={0}
          />
        </>
      )}
      {/* Sidebar Desktop */}
      <Box
        as="aside"
        display={{ base: 'none', xl: 'block' }}
        position="fixed"
        zIndex={1}
      >
        <Box
          bg={sidebarBg}
          backdropFilter="blur(10px)"
          transition="0.2s linear"
          w="260px"
          maxW="260px"
          ms="16px"
          my="16px"
          h="calc(100vh - 32px)"
          ps="20px"
          pe="20px"
          borderRadius="16px"
        >
          {/* Logo Vision UI */}
          <Box pt="25px" mb="12px">
            <ChakraLink
              href="#/"
              display="flex"
              lineHeight="100%"
              mb="30px"
              fontWeight="bold"
              justifyContent="center"
              alignItems="center"
              fontSize="11px"
              _hover={{ textDecoration: 'none' }}
            >
              <SimmmpleLogoWhite w="22px" h="22px" me="10px" mt="2px" />
              <Box
                bg="linear-gradient(97.89deg, #FFFFFF 70.67%, rgba(117, 122, 140, 0) 108.55%)"
                bgClip="text"
              >
                <Text fontSize="sm" letterSpacing="3px" mt="3px" color="transparent">
                  VISION UI FREE
                </Text>
              </Box>
            </ChakraLink>
            <Separator />
          </Box>

          {/* Navigation Links */}
          <Stack direction="column" mb="40px">
            <SidebarContent />
          </Stack>
        </Box>
      </Box>

      {/* Sidebar - Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent
          backdropFilter="blur(10px)"
          bg={sidebarBg}
          w="250px"
          maxW="250px"
          ms="16px"
          my="16px"
          borderRadius="16px"
        >
          <DrawerCloseButton
            color="white"
            _focus={{ boxShadow: 'none' }}
            _hover={{ boxShadow: 'none' }}
          />
          <DrawerBody maxW="250px" px="1rem">
            <Box maxW="100%" h="100vh">
              {/* Logo Vision UI */}
              <Box pt="35px" mb="8px">
                <ChakraLink
                  href="#/"
                  display="flex"
                  lineHeight="100%"
                  mb="30px"
                  fontWeight="bold"
                  justifyContent="center"
                  alignItems="center"
                  fontSize="11px"
                  _hover={{ textDecoration: 'none' }}
                >
                  <SimmmpleLogoWhite w="22px" h="22px" me="10px" mt="2px" />
                  <Box
                    bg="linear-gradient(97.89deg, #FFFFFF 70.67%, rgba(117, 122, 140, 0) 108.55%)"
                    bgClip="text"
                  >
                    <Text fontSize="sm" letterSpacing="3px" mt="3px" color="transparent">
                      VISION UI FREE
                    </Text>
                  </Box>
                </ChakraLink>
                <Separator />
              </Box>

              <Stack direction="column" mb="40px">
                <SidebarContent onClose={onClose} />
              </Stack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Panel */}
      <Box
        float="right"
        maxWidth="100%"
        overflow="auto"
        position="relative"
        maxHeight="100%"
        w={{ base: '100%', xl: 'calc(100% - 275px)' }}
        ms={{ base: '0px', xl: '275px' }}
        transition="all 0.33s cubic-bezier(0.685, 0.0473, 0.346, 1)"
      >
        <Navbar fixed={fixed} onOpenSidebar={onOpen} onOpenConfigurator={onOpenConfig} />

        {/* Content */}
        <Box
          as="main"
          p={{ base: 4, md: 6 }}
          pt={{ base: 4, md: 4 }}
          minH="calc(100vh - 80px)"
        >
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="cotizador/*" element={<CotizadorPage />} />
              <Route path="cotizador/:id" element={<CotizadorPage />} />
              <Route path="cotizaciones" element={<CotizadorPage />} />
              <Route path="*" element={<Navigate to="cotizador" replace />} />
            </Routes>
          </Suspense>
          <Footer />
        </Box>
      </Box>
      <Configurator
        secondary={false}
        isOpen={isOpenConfig}
        onClose={onCloseConfig}
        isChecked={fixed}
        onSwitch={(value: boolean) => {
          setFixed(value)
        }}
      />
    </Flex>
  )
}
