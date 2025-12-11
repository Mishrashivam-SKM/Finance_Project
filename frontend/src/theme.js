import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    primary: {
      50: '#E0F7FF',
      100: '#B3EEFF',
      200: '#80E5FF',
      300: '#4DDCFF',
      400: '#1AD3FF',
      500: '#00A3C4',
      600: '#0088A6',
      700: '#006D88',
      800: '#00526A',
      900: '#00374C',
    },
    dark: {
      50: '#F7FAFC',
      100: '#EDF2F7',
      200: '#E2E8F0',
      300: '#CBD5E0',
      400: '#A0AEC0',
      500: '#718096',
      600: '#4A5568',
      700: '#2D3748',
      800: '#1A202C',
      900: '#0F1419',
    },
  },
  fonts: {
    body: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    heading: "'Inter', 'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    mono: "'Courier New', monospace",
  },
  styles: {
    global: (props) => ({
      body: {
        bg: props.colorMode === 'dark' ? '#171923' : '#F7FAFC',
        color: props.colorMode === 'dark' ? '#E2E8F0' : '#2D3748',
        fontFamily: "'Inter', 'Poppins', sans-serif",
        lineHeight: 'base',
        transition: 'background-color 0.3s ease, color 0.3s ease',
      },
      html: {
        scrollBehavior: 'smooth',
      },
      '*': {
        boxSizing: 'border-box',
      },
    }),
  },
  semanticTokens: {
    colors: {
      'chakra-border-color': {
        _light: '#E2E8F0',
        _dark: '#2D3748',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'primary',
      },
      variants: {
        solid: {
          bg: 'primary.500',
          color: 'white',
          _hover: {
            bg: 'primary.600',
          },
          _active: {
            bg: 'primary.700',
          },
        },
        outline: {
          borderColor: 'primary.500',
          color: 'primary.500',
          _hover: {
            bg: 'primary.50',
          },
          _dark: {
            _hover: {
              bg: 'primary.900',
            },
          },
        },
      },
    },
    Card: {
      baseStyle: {
        container: {
          bg: { base: '#FFFFFF', _dark: '#1A202C' },
          borderRadius: 'lg',
          boxShadow: 'sm',
          transition: 'all 0.3s ease',
        },
      },
    },
  },
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
});

export default theme;
