import { extendTheme, type ThemeConfig, createMultiStyleConfigHelpers } from '@chakra-ui/react'
import { cardAnatomy } from '@chakra-ui/anatomy'
import { mode, type StyleFunctionProps } from '@chakra-ui/theme-tools'

// Helpers para componentes multipart (Card)
const { definePartsStyle, defineMultiStyleConfig } = createMultiStyleConfigHelpers(cardAnatomy.keys)

// Configuración del color mode
const config: ThemeConfig = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
}

// Colores personalizados - Vision UI Pro
const colors = {
  brand: {
    50: '#E9E3FF',
    100: '#C0B8FE',
    200: '#A195FD',
    300: '#8171FC',
    400: '#7551FF',
    500: '#582CFF',
    600: '#4318FF',
    700: '#3311DB',
    800: '#2B0BAA',
    900: '#1B0772',
  },
  // Colores Navy (Vision UI Dark Theme)
  navy: {
    50: '#d0dcfb',
    100: '#aac0fe',
    200: '#a3b9f8',
    300: '#728fea',
    400: '#3652ba',
    500: '#1b3bbb',
    600: '#24388a',
    700: '#1B254B',
    800: '#111c44',
    900: '#0b1437',
  },
  // Grays mejorados
  gray: {
    50: '#F7FAFC',
    100: '#EDF2F7',
    200: '#E2E8F0',
    300: '#CBD5E0',
    400: '#A0AEC0',
    500: '#718096',
    600: '#4A5568',
    700: '#2D3748',
    800: '#1A202C',
    900: '#171923',
  },
  // Colores de acento vibrantes (Vision UI Pro)
  cyan: {
    50: '#E0F7FF',
    100: '#B3ECFF',
    200: '#80DFFF',
    300: '#4DD2FF',
    400: '#0BC5EA',
    500: '#00B5D8',
    600: '#0099B8',
    700: '#007A94',
    800: '#005C70',
    900: '#003D4C',
  },
  teal: {
    400: '#01B574',
    500: '#00A86B',
  },
  // Verde vibrante (Vision UI)
  green: {
    50: '#E6FFF5',
    100: '#B3FFE0',
    200: '#80FFCC',
    300: '#4DFFB8',
    400: '#01B574',
    500: '#00A86B',
    600: '#008F5B',
    700: '#00764B',
    800: '#005D3B',
    900: '#00442B',
  },
  // Rosa/Magenta vibrante
  pink: {
    400: '#FF0080',
    500: '#E6006E',
  },
}

// Semantic tokens para colores que cambian con el modo
const semanticTokens = {
  colors: {
    // Fondos
    'bg.primary': {
      default: 'white',
      _dark: 'navy.900',
    },
    'bg.secondary': {
      default: 'gray.50',
      _dark: 'navy.800',
    },
    'bg.card': {
      default: 'white',
      _dark: 'navy.800',
    },
    // Textos
    'text.primary': {
      default: 'gray.800',
      _dark: 'white',
    },
    'text.secondary': {
      default: 'gray.600',
      _dark: 'gray.400',
    },
    'text.muted': {
      default: 'gray.500',
      _dark: 'gray.500',
    },
    // Bordes - más brillantes en dark mode
    'border.default': {
      default: 'gray.200',
      _dark: 'rgba(255, 255, 255, 0.16)',
    },
    'border.hover': {
      default: 'gray.300',
      _dark: 'rgba(255, 255, 255, 0.24)',
    },
  },
}

// Estilos globales con soporte dark/light
const styles = {
  global: (props: StyleFunctionProps) => ({
    body: {
      bg: mode('gray.50', 'navy.900')(props),
      color: mode('gray.800', 'white')(props),
      fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    '*::placeholder': {
      color: mode('gray.400', 'gray.500')(props),
    },
    // Scrollbar estilizado
    '::-webkit-scrollbar': {
      width: '8px',
      height: '8px',
    },
    '::-webkit-scrollbar-track': {
      bg: mode('gray.100', 'navy.800')(props),
    },
    '::-webkit-scrollbar-thumb': {
      bg: mode('gray.300', 'navy.600')(props),
      borderRadius: '4px',
    },
    '::-webkit-scrollbar-thumb:hover': {
      bg: mode('gray.400', 'navy.500')(props),
    },
  }),
}

// Componentes personalizados - Vision UI Pro
const components = {
  // Button con efectos Vision UI Pro
  Button: {
    baseStyle: {
      borderRadius: '12px',
      fontWeight: '600',
      transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
      _focus: {
        boxShadow: 'none',
      },
    },
    variants: {
      brand: () => ({
        bg: 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)',
        color: 'white',
        _hover: {
          transform: 'translateY(-2px)',
          boxShadow: '0 7px 23px rgba(67, 24, 255, 0.5)',
          _disabled: {
            transform: 'none',
            boxShadow: 'none',
          },
        },
        _active: {
          transform: 'translateY(0)',
        },
      }),
      solid: (props: StyleFunctionProps) => {
        const { colorScheme } = props
        // Gradientes específicos por color
        if (colorScheme === 'red') {
          return {
            bg: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)',
            color: 'white',
            _hover: {
              transform: 'translateY(-2px)',
              boxShadow: '0 7px 23px rgba(255, 75, 43, 0.5)',
              _disabled: { transform: 'none', boxShadow: 'none' },
            },
          }
        }
        if (colorScheme === 'green') {
          return {
            bg: 'linear-gradient(135deg, #01B574 0%, #00A86B 100%)',
            color: 'white',
            _hover: {
              transform: 'translateY(-2px)',
              boxShadow: '0 7px 23px rgba(1, 181, 116, 0.5)',
              _disabled: { transform: 'none', boxShadow: 'none' },
            },
          }
        }
        if (colorScheme === 'cyan' || colorScheme === 'blue') {
          return {
            bg: 'linear-gradient(135deg, #0BC5EA 0%, #00B5D8 100%)',
            color: 'white',
            _hover: {
              transform: 'translateY(-2px)',
              boxShadow: '0 7px 23px rgba(11, 197, 234, 0.5)',
              _disabled: { transform: 'none', boxShadow: 'none' },
            },
          }
        }
        return {
          bg: mode('brand.500', 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)')(props),
          color: 'white',
          _hover: {
            bg: mode('brand.600', 'linear-gradient(135deg, #868CFF 0%, #4318FF 100%)')(props),
            transform: 'translateY(-2px)',
            boxShadow: '0 7px 23px rgba(67, 24, 255, 0.5)',
            _disabled: { transform: 'none' },
          },
        }
      },
      outline: (props: StyleFunctionProps) => ({
        borderColor: mode('gray.200', 'rgba(255, 255, 255, 0.16)')(props),
        borderWidth: '1px',
        color: mode('gray.700', 'white')(props),
        _hover: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
          borderColor: mode('gray.300', 'rgba(255, 255, 255, 0.24)')(props),
        },
      }),
      ghost: (props: StyleFunctionProps) => ({
        color: mode('gray.600', 'gray.300')(props),
        _hover: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
        },
      }),
    },
  },

  // Box - Variantes para cards con efecto glass Vision UI
  Box: {
    variants: {
      card: (props: StyleFunctionProps) => ({
        bg: mode(
          'white',
          'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        )(props),
        borderRadius: '20px',
        p: 6,
        backdropFilter: 'blur(120px)',
        boxShadow: mode('0px 3.5px 5.5px rgba(0, 0, 0, 0.02)', 'none')(props),
        border: '2px solid',
        borderColor: mode('gray.200', 'rgba(255, 255, 255, 0.125)')(props),
      }),
      glass: (props: StyleFunctionProps) => ({
        bg: mode(
          'rgba(255, 255, 255, 0.9)',
          'linear-gradient(127.09deg, rgba(6, 11, 40, 0.74) 28.26%, rgba(14, 21, 58, 0.71) 91.2%)'
        )(props),
        borderRadius: '20px',
        backdropFilter: 'blur(120px)',
        border: '2px solid',
        borderColor: mode('gray.200', 'rgba(255, 255, 255, 0.125)')(props),
      }),
    },
  },

  // Card - Chakra UI Card component con glass effect (usando cardAnatomy)
  Card: defineMultiStyleConfig({
    baseStyle: definePartsStyle((props) => ({
      container: {
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        borderRadius: '20px',
        bg: mode(
          'white',
          'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        )(props),
        backdropFilter: 'blur(120px)',
        boxShadow: mode('0px 3.5px 5.5px rgba(0, 0, 0, 0.02)', 'none')(props),
        border: '2px solid',
        borderColor: mode('gray.200', 'rgba(255, 255, 255, 0.125)')(props),
        overflow: 'hidden',
      },
      header: {
        p: 6,
        pb: 0,
      },
      body: {
        p: 6,
      },
      footer: {
        p: 6,
        pt: 0,
      },
    })),
  }),

  // Heading
  Heading: {
    baseStyle: (props: StyleFunctionProps) => ({
      color: mode('gray.800', 'white')(props),
      fontWeight: 'bold',
    }),
  },

  // Text
  Text: {
    baseStyle: (props: StyleFunctionProps) => ({
      color: mode('gray.800', 'white')(props),
    }),
    variants: {
      secondary: (props: StyleFunctionProps) => ({
        color: mode('gray.600', 'gray.400')(props),
      }),
      muted: (props: StyleFunctionProps) => ({
        color: mode('gray.500', 'gray.500')(props),
      }),
      label: (props: StyleFunctionProps) => ({
        color: mode('gray.600', 'gray.400')(props),
        fontSize: 'xs',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }),
    },
  },

  // FormLabel
  FormLabel: {
    baseStyle: (props: StyleFunctionProps) => ({
      color: mode('gray.600', 'gray.400')(props),
      fontSize: 'xs',
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      mb: 1,
    }),
  },

  // Input con bordes Vision UI
  Input: {
    baseStyle: {
      field: {
        borderRadius: '15px',
      },
    },
    variants: {
      outline: (props: StyleFunctionProps) => ({
        field: {
          bg: mode('white', 'navy.900')(props),
          borderColor: mode('gray.200', 'rgba(255, 255, 255, 0.16)')(props),
          borderWidth: '1px',
          borderRadius: '15px',
          color: mode('gray.800', 'white')(props),
          _hover: {
            borderColor: mode('gray.300', 'rgba(255, 255, 255, 0.24)')(props),
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
          _readOnly: {
            bg: mode('gray.50', 'navy.800')(props),
            cursor: 'default',
            opacity: 0.8,
          },
          _disabled: {
            bg: mode('gray.100', 'navy.800')(props),
            opacity: 0.6,
          },
        },
      }),
      filled: (props: StyleFunctionProps) => ({
        field: {
          bg: mode('gray.100', 'navy.800')(props),
          borderRadius: '15px',
          border: '1px solid transparent',
          _hover: {
            bg: mode('gray.200', 'navy.700')(props),
          },
          _focus: {
            bg: mode('white', 'navy.700')(props),
            borderColor: 'brand.500',
          },
        },
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },

  // NumberInput
  NumberInput: {
    baseStyle: {
      field: {
        borderRadius: '15px',
      },
    },
    variants: {
      outline: (props: StyleFunctionProps) => ({
        field: {
          bg: mode('white', 'navy.900')(props),
          borderColor: mode('gray.200', 'whiteAlpha.200')(props),
          borderRadius: '15px',
          _hover: {
            borderColor: mode('gray.300', 'whiteAlpha.300')(props),
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },

  // Select con bordes Vision UI
  Select: {
    baseStyle: {
      field: {
        borderRadius: '15px',
      },
    },
    variants: {
      outline: (props: StyleFunctionProps) => ({
        field: {
          bg: mode('white', 'navy.900')(props),
          borderRadius: '15px',
          borderColor: mode('gray.200', 'rgba(255, 255, 255, 0.16)')(props),
          borderWidth: '1px',
          _hover: {
            borderColor: mode('gray.300', 'rgba(255, 255, 255, 0.24)')(props),
          },
          _focus: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
          },
        },
        icon: {
          color: mode('gray.500', 'gray.400')(props),
        },
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },

  // Textarea
  Textarea: {
    variants: {
      outline: (props: StyleFunctionProps) => ({
        bg: mode('white', 'navy.900')(props),
        borderRadius: '15px',
        borderColor: mode('gray.200', 'whiteAlpha.200')(props),
        _hover: {
          borderColor: mode('gray.300', 'whiteAlpha.300')(props),
        },
        _focus: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
        },
      }),
    },
    defaultProps: {
      variant: 'outline',
    },
  },

  // Table
  Table: {
    variants: {
      simple: (props: StyleFunctionProps) => ({
        th: {
          borderColor: mode('gray.200', 'whiteAlpha.100')(props),
          color: mode('gray.600', 'gray.400')(props),
          fontWeight: '700',
          fontSize: 'xs',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          bg: mode('gray.50', 'navy.800')(props),
        },
        td: {
          borderColor: mode('gray.200', 'whiteAlpha.100')(props),
          color: mode('gray.800', 'white')(props),
        },
        tr: {
          _hover: {
            bg: mode('gray.50', 'whiteAlpha.50')(props),
          },
        },
      }),
    },
  },

  // Modal con efecto glass Vision UI
  Modal: {
    baseStyle: (props: StyleFunctionProps) => ({
      overlay: {
        bg: 'blackAlpha.700',
        backdropFilter: 'blur(10px)',
      },
      dialog: {
        bg: mode(
          'white',
          'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        )(props),
        borderRadius: '20px',
        backdropFilter: 'blur(120px)',
        border: '2px solid',
        borderColor: mode('gray.200', 'rgba(255, 255, 255, 0.125)')(props),
      },
      header: {
        color: mode('gray.800', 'white')(props),
        fontWeight: 'bold',
      },
      body: {
        color: mode('gray.800', 'white')(props),
      },
    }),
  },

  // Drawer (Sidebar)
  Drawer: {
    baseStyle: (props: StyleFunctionProps) => ({
      overlay: {
        backdropFilter: 'blur(10px)',
      },
      dialog: {
        bg: mode(
          'white',
          'linear-gradient(111.84deg, rgba(6, 11, 38, 0.94) 59.3%, rgba(26, 31, 55, 0) 100%)'
        )(props),
        backdropFilter: mode('none', 'blur(42px)')(props),
      },
    }),
  },

  // Menu
  Menu: {
    baseStyle: (props: StyleFunctionProps) => ({
      list: {
        bg: mode('white', 'navy.800')(props),
        borderColor: mode('gray.200', 'whiteAlpha.200')(props),
        borderRadius: '15px',
        boxShadow: 'lg',
        py: 2,
      },
      item: {
        bg: 'transparent',
        color: mode('gray.800', 'white')(props),
        _hover: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
        },
        _focus: {
          bg: mode('gray.100', 'whiteAlpha.100')(props),
        },
      },
    }),
  },

  // Badge
  Badge: {
    baseStyle: {
      borderRadius: '8px',
      px: 2,
      py: 1,
      fontWeight: '600',
      textTransform: 'none',
    },
    variants: {
      subtle: (props: StyleFunctionProps) => ({
        bg: mode(`${props.colorScheme}.100`, `${props.colorScheme}.900`)(props),
        color: mode(`${props.colorScheme}.800`, `${props.colorScheme}.200`)(props),
      }),
    },
  },

  // Alert
  Alert: {
    baseStyle: (props: StyleFunctionProps) => ({
      container: {
        borderRadius: '15px',
      },
    }),
  },

  // Switch
  Switch: {
    baseStyle: (props: StyleFunctionProps) => ({
      track: {
        bg: mode('gray.200', 'navy.700')(props),
        _checked: {
          bg: 'brand.500',
        },
      },
    }),
  },

  // Tooltip
  Tooltip: {
    baseStyle: (props: StyleFunctionProps) => ({
      bg: mode('gray.700', 'navy.700')(props),
      color: 'white',
      borderRadius: '8px',
      px: 3,
      py: 2,
      fontSize: 'sm',
    }),
  },

  // Divider
  Divider: {
    baseStyle: (props: StyleFunctionProps) => ({
      borderColor: mode('gray.200', 'whiteAlpha.200')(props),
    }),
  },

  // Link
  Link: {
    baseStyle: (props: StyleFunctionProps) => ({
      color: mode('brand.500', 'brand.400')(props),
      _hover: {
        textDecoration: 'none',
        color: mode('brand.600', 'brand.300')(props),
      },
    }),
  },

  // Tabs
  Tabs: {
    variants: {
      enclosed: (props: StyleFunctionProps) => ({
        tab: {
          borderRadius: '12px 12px 0 0',
          _selected: {
            bg: mode('white', 'navy.800')(props),
            color: 'brand.500',
          },
        },
        tabpanel: {
          bg: mode('white', 'navy.800')(props),
        },
      }),
      'soft-rounded': (props: StyleFunctionProps) => ({
        tab: {
          borderRadius: '12px',
          _selected: {
            bg: 'brand.500',
            color: 'white',
          },
        },
      }),
    },
  },
}

// Breakpoints
const breakpoints = {
  sm: '320px',
  md: '768px',
  lg: '960px',
  xl: '1200px',
  '2xl': '1536px',
}

// Fonts
const fonts = {
  heading: '"Plus Jakarta Sans", sans-serif',
  body: '"Plus Jakarta Sans", sans-serif',
}

// Border radius
const radii = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '12px',
  lg: '15px',
  xl: '20px',
  '2xl': '24px',
  full: '9999px',
}

// Shadows - Vision UI Pro style
const shadows = {
  sm: '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)',
  base: '0px 7px 23px rgba(0, 0, 0, 0.05)',
  md: '0px 10px 30px rgba(0, 0, 0, 0.1)',
  lg: '0px 20px 40px rgba(0, 0, 0, 0.15)',
  xl: '0px 30px 60px rgba(0, 0, 0, 0.2)',
  // Sombras de color para botones
  brand: '0 7px 23px rgba(67, 24, 255, 0.5)',
  green: '0 7px 23px rgba(1, 181, 116, 0.5)',
  cyan: '0 7px 23px rgba(11, 197, 234, 0.5)',
  red: '0 7px 23px rgba(255, 75, 43, 0.5)',
}

// Crear el tema
const theme = extendTheme({
  config,
  colors,
  semanticTokens,
  styles,
  components,
  breakpoints,
  fonts,
  radii,
  shadows,
})

export default theme
