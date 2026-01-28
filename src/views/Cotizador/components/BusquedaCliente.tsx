import React, { useState, useEffect } from 'react';
import {
  Box,
  Input,
  InputGroup,
  InputLeftElement,
  List,
  ListItem,
  Text,
  Flex,
  Avatar,
  Spinner,
  useColorModeValue,
  useColorMode,
  Icon,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { FaBuilding, FaUser } from 'react-icons/fa';
import { SearchCLI } from '@/api';

const BusquedaCliente = ({ onClienteSeleccionado, isDisabled = false }) => {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarResultados, setMostrarResultados] = useState(false);

  // Estado para navegación por teclado
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const bgColor = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';
  const hoverBg = isDark ? 'whiteAlpha.100' : 'gray.50';
  const selectedBg = isDark ? 'brand.900' : 'brand.50';

  useEffect(() => {
    const fetchClientes = async () => {
      if (busqueda.trim().length < 2) {
        setResultados([]);
        setMostrarResultados(false);
        return;
      }

      try {
        setIsLoading(true);
        // Para el cotizador, solo buscar clientes HABITUALES de Tango
        const data = await SearchCLI(busqueda);
        setResultados(Array.isArray(data) ? data : []);
        setMostrarResultados(true);
        setSelectedIndex(-1); // Reset selection
      } catch (error) {
        console.error('Error al buscar clientes:', error);
        setResultados([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchClientes, 300);
    return () => clearTimeout(timeoutId);
  }, [busqueda]);

  const handleSeleccionar = (cliente) => {
    onClienteSeleccionado(cliente);
    setBusqueda('');
    setMostrarResultados(false);
    setResultados([]);
  };

  const handleKeyDown = (e) => {
    if (!mostrarResultados || resultados.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < resultados.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < resultados.length) {
          handleSeleccionar(resultados[selectedIndex]);
        }
        break;
      case 'Escape':
        setMostrarResultados(false);
        break;
      default:
        break;
    }
  };

  return (
    <Box position="relative" w="100%">
      <InputGroup size="md">
        <InputLeftElement pointerEvents="none">
          <SearchIcon color="blue.500" />
        </InputLeftElement>
        <Input
          placeholder="Escribe el nombre, razón social o código del cliente..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          onFocus={() => {
            if (resultados.length > 0) setMostrarResultados(true);
          }}
          onBlur={() => {
            // Delay para permitir clic en resultados
            setTimeout(() => setMostrarResultados(false), 200);
          }}
          isDisabled={isDisabled}
          bg={bgColor}
          focusBorderColor="blue.400"
          _placeholder={{ color: 'gray.400', fontSize: 'sm' }}
          autoFocus
          onKeyDown={handleKeyDown}
        />
      </InputGroup>

      {/* Mensaje de ayuda cuando no hay búsqueda */}
      {busqueda.trim().length === 0 && (
        <Box mt={3} p={3} bg={isDark ? 'whiteAlpha.50' : 'gray.50'} borderRadius="md">
          <Text fontSize="sm" color={isDark ? 'gray.400' : 'gray.600'} textAlign="center">
            Tip: Escribe al menos 2 caracteres para comenzar la búsqueda
          </Text>
        </Box>
      )}

      {mostrarResultados && (
        <List
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={1}
          bg={bgColor}
          border="2px solid"
          borderColor={borderColor}
          borderRadius="20px"
          maxH="400px"
          overflowY="auto"
          zIndex={1000}
          boxShadow="lg"
          backdropFilter={isDark ? 'blur(120px)' : 'none'}
        >
          {isLoading ? (
            <Flex justify="center" align="center" py={4}>
              <Spinner size="sm" />
            </Flex>
          ) : resultados.length === 0 ? (
            <ListItem p={4}>
              <Text color="gray.500" textAlign="center">
                No se encontraron clientes
              </Text>
            </ListItem>
          ) : (
            resultados.map((cliente, index) => (
              <ListItem
                key={index}
                p={3}
                cursor="pointer"
                bg={index === selectedIndex ? selectedBg : undefined}
                _hover={{ bg: hoverBg }}
                onClick={() => handleSeleccionar(cliente)}
                borderBottom="1px"
                borderColor={borderColor}
              >
                <Flex align="center" gap={3}>
                  <Avatar
                    size="sm"
                    name={cliente.razonSocial}
                    icon={cliente.codigo ? <FaBuilding /> : <FaUser />}
                    bg={cliente.codigo ? 'blue.500' : 'orange.500'}
                  />
                  <Box flex="1">
                    <Flex align="center" gap={2}>
                      <Text fontWeight="semibold" fontSize="sm">
                        {cliente.razonSocial}
                      </Text>
                      {cliente.codigo && (
                        <Badge colorScheme="blue" fontSize="xs">
                          {cliente.codigo}
                        </Badge>
                      )}
                    </Flex>
                    <Text fontSize="xs" color="gray.500">
                      {cliente.cuit} • {cliente.localidad}
                    </Text>
                  </Box>
                </Flex>
              </ListItem>
            ))
          )}
        </List>
      )}
    </Box>
  );
};

export default BusquedaCliente;
