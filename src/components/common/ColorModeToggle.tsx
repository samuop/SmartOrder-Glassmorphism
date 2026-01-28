import { IconButton, useColorMode, useColorModeValue } from '@chakra-ui/react'
import { FaSun, FaMoon } from 'react-icons/fa'

interface ColorModeToggleProps {
  size?: 'sm' | 'md' | 'lg'
}

export function ColorModeToggle({ size = 'md' }: ColorModeToggleProps) {
  const { colorMode, toggleColorMode } = useColorMode()

  const SwitchIcon = colorMode === 'dark' ? FaSun : FaMoon
  const iconColor = useColorModeValue('gray.600', 'gray.300')
  const hoverBg = useColorModeValue('gray.100', 'whiteAlpha.200')

  return (
    <IconButton
      aria-label={`Switch to ${colorMode === 'dark' ? 'light' : 'dark'} mode`}
      icon={<SwitchIcon />}
      onClick={toggleColorMode}
      variant="ghost"
      color={iconColor}
      _hover={{ bg: hoverBg }}
      size={size}
    />
  )
}
