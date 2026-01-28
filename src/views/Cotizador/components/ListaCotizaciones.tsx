import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  IconButton,
  useColorModeValue,
  useColorMode,
  Spinner,
  Text,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Icon,
  Tooltip,
  Card,
  CardBody
} from '@chakra-ui/react';
import { SearchIcon, ArrowBackIcon, AddIcon, ViewIcon, CloseIcon, ChevronLeftIcon, ChevronRightIcon, DeleteIcon } from '@chakra-ui/icons';
import { MdFirstPage, MdLastPage } from 'react-icons/md';
import cotizadorService from '../../../services/cotizadorService';
import { useToast } from '@chakra-ui/react';

const ListaCotizaciones = ({ onSeleccionar, onNueva, onVolver }) => {
  const codigoVendedor = Cookies.get('COD_VENDED') || '';
  const toast = useToast({ position: 'bottom' });
  const navigate = useNavigate();

  const [cotizaciones, setCotizaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [metadata, setMetadata] = useState({
    total: 0,
    totalPages: 0,
    currentPage: 1,
  });
  // Cargar filtros desde localStorage o usar valores por defecto
  const [filtros, setFiltros] = useState(() => {
    const savedFilters = localStorage.getItem('cotizaciones_filtros');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        // Mantener page y limit en valores por defecto
        return {
          ...parsed,
          page: 1,
          limit: 20,
        };
      } catch (e) {
        console.error('Error al parsear filtros guardados:', e);
      }
    }
    return {
      page: 1,
      limit: 20,
      estado: '',
      busqueda: '',
      fechaDesde: '',
      fechaHasta: '',
      creadoPor: codigoVendedor, // Por defecto el usuario actual
      montoMinimo: '',
      montoMaximo: '',
    };
  });

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Fondos con efecto glass para modo oscuro
  const cardBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'gray.200';
  const labelColor = isDark ? 'gray.400' : 'gray.600';
  const primaryColor = isDark ? 'white' : 'gray.800';
  const hoverBg = isDark ? 'whiteAlpha.100' : 'gray.50';
  const tableHeaderBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.8) 19.41%, rgba(10, 14, 35, 0.4) 76.65%)'
    : 'gray.50';

  // Guardar filtros en localStorage cuando cambien
  useEffect(() => {
    const { page, limit, ...filtrosParaGuardar } = filtros;
    localStorage.setItem('cotizaciones_filtros', JSON.stringify(filtrosParaGuardar));
  }, [filtros]);

  // Debounce para búsqueda
  useEffect(() => {
    const timer = setTimeout(() => {
      setFiltros(prev => ({ ...prev, busqueda: searchTerm, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    cargarCotizaciones();
  }, [filtros]);

  const cargarCotizaciones = async () => {
    // Si ya hay cotizaciones cargadas, usar isRefreshing en lugar de isLoading
    if (cotizaciones.length > 0) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setError(null);
    try {
      const response = await cotizadorService.listarCotizaciones(filtros);

      if (response.success) {
        setCotizaciones(response.data || []);
        setMetadata({
          total: response.total || 0,
          totalPages: response.totalPages || 0,
          currentPage: response.page || 1,
        });
      } else {
        console.log('❌ Success es false');
      }
    } catch (err) {
      console.error('Error al cargar cotizaciones:', err);
      setError('Error al cargar cotizaciones');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const colores = {
      creada: 'blue',
      borrador: 'gray',
      enviada: 'cyan',
      aprobada: 'green',
      rechazada: 'red',
      convertida: 'purple',
      archivada: 'orange',
    };
    return (
      <Badge colorScheme={colores[estado] || 'gray'}>
        {estado?.toUpperCase()}
      </Badge>
    );
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) return '-';

    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const anio = date.getFullYear();

    return `${dia}/${mes}/${anio}`;
  };

  const formatMoneda = (valor) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(valor || 0);
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    const filtrosLimpios = {
      page: 1,
      limit: 20,
      estado: '',
      busqueda: '',
      fechaDesde: '',
      fechaHasta: '',
      creadoPor: codigoVendedor, // Volver al vendedor actual
      montoMinimo: '',
      montoMaximo: '',
    };
    setFiltros(filtrosLimpios);
    // Limpiar localStorage
    localStorage.removeItem('cotizaciones_filtros');
  };

  const cambiarPagina = (nuevaPagina) => {
    setFiltros(prev => ({ ...prev, page: nuevaPagina }));
  };

  const cambiarLimite = (nuevoLimite) => {
    setFiltros(prev => ({ ...prev, limit: nuevoLimite, page: 1 }));
  };

  const eliminarCotizacion = async (id, nroCotizacion, e) => {
    e.stopPropagation(); // Evitar que se abra la cotización al hacer clic en eliminar

    if (!window.confirm(`¿Está seguro que desea eliminar la cotización ${nroCotizacion}?`)) {
      return;
    }

    try {
      await cotizadorService.eliminarCotizacion(id);

      toast({
        title: 'Cotización eliminada',
        description: `La cotización ${nroCotizacion} ha sido archivada exitosamente.`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Recargar la lista
      cargarCotizaciones();
    } catch (error) {
      console.error('Error al eliminar cotización:', error);
      toast({
        title: 'Error al eliminar',
        description: error.message || 'No se pudo eliminar la cotización',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box p={8} minH="100vh" pt={24}>
      <VStack spacing={6} align="stretch" maxW="1400px" mx="auto">
        {/* Header */}
        <Flex justify="space-between" align="center">
          <HStack spacing={4}>
            <IconButton
              icon={<ArrowBackIcon />}
              variant="ghost"
              onClick={onVolver}
              aria-label="Volver"
              color={primaryColor}
              _hover={{ bg: hoverBg }}
            />
            <Heading size="lg" color={primaryColor}>
              Cotizaciones
            </Heading>
          </HStack>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="brand"
            onClick={onNueva}
          >
            Nueva Cotización
          </Button>
        </Flex>

        {/* Filtros - Card con efecto glass */}
        <Box
          bg={cardBg}
          p={5}
          borderRadius="16px"
          border="2px solid"
          borderColor={borderColor}
          backdropFilter={isDark ? 'blur(120px)' : 'none'}
          boxShadow={isDark ? 'none' : 'lg'}
        >
          <VStack spacing={4} align="stretch">
            {/* Primera fila: Búsqueda, Estado y Vendedor */}
            <Flex gap={3} wrap="wrap" align="flex-end">
              <Box flex="2" minW="250px">
                <Text fontSize="sm" mb={1} fontWeight="500" color={labelColor}>
                  Búsqueda
                </Text>
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Buscar por número, cliente o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="md"
                  />
                </InputGroup>
              </Box>

              <Box flex="1" minW="180px">
                <Text fontSize="sm" mb={1} fontWeight="500" color={labelColor}>
                  Estado
                </Text>
                <Select
                  value={filtros.estado}
                  onChange={(e) =>
                    setFiltros({ ...filtros, estado: e.target.value, page: 1 })
                  }
                  size="md"
                >
                  <option value="">Todos los estados</option>
                  <option value="creada">Creada</option>
                  <option value="convertida">Convertida</option>
                  <option value="archivada">Archivada</option>
                </Select>
              </Box>

              <Box flex="1" minW="180px">
                <Text fontSize="sm" mb={1} fontWeight="500" color={labelColor}>
                  Vendedor
                </Text>
                <Select
                  value={filtros.creadoPor}
                  onChange={(e) =>
                    setFiltros({ ...filtros, creadoPor: e.target.value, page: 1 })
                  }
                  size="md"
                >
                  <option value="">Todos los vendedores</option>
                  <option value={codigoVendedor}>Mis cotizaciones</option>
                </Select>
              </Box>
            </Flex>

            {/* Segunda fila: Fechas, Montos y Botón Limpiar */}
            <Flex gap={3} wrap="wrap" align="flex-end">
              <Box flex="1" minW="150px">
                <Text fontSize="sm" mb={1} fontWeight="500" color={labelColor}>
                  Fecha desde
                </Text>
                <Input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) =>
                    setFiltros({ ...filtros, fechaDesde: e.target.value, page: 1 })
                  }
                  size="md"
                />
              </Box>

              <Box flex="1" minW="150px">
                <Text fontSize="sm" mb={1} fontWeight="500" color={labelColor}>
                  Fecha hasta
                </Text>
                <Input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) =>
                    setFiltros({ ...filtros, fechaHasta: e.target.value, page: 1 })
                  }
                  size="md"
                />
              </Box>

              <Box flex="1" minW="150px">
                <Text fontSize="sm" mb={1} fontWeight="500" color={labelColor}>
                  Monto desde
                </Text>
                <Input
                  type="number"
                  placeholder="$ 0"
                  value={filtros.montoMinimo}
                  onChange={(e) =>
                    setFiltros({ ...filtros, montoMinimo: e.target.value, page: 1 })
                  }
                  size="md"
                />
              </Box>

              <Box flex="1" minW="150px">
                <Text fontSize="sm" mb={1} fontWeight="500" color={labelColor}>
                  Monto hasta
                </Text>
                <Input
                  type="number"
                  placeholder="$ 999999"
                  value={filtros.montoMaximo}
                  onChange={(e) =>
                    setFiltros({ ...filtros, montoMaximo: e.target.value, page: 1 })
                  }
                  size="md"
                />
              </Box>

              <Button
                leftIcon={<CloseIcon />}
                variant="outline"
                colorScheme="gray"
                onClick={limpiarFiltros}
                size="md"
                minW="150px"
              >
                Limpiar Filtros
              </Button>
            </Flex>
          </VStack>
        </Box>

        {/* Tabla - Card con efecto glass */}
        <Box
          bg={cardBg}
          borderRadius="16px"
          border="2px solid"
          borderColor={borderColor}
          backdropFilter={isDark ? 'blur(120px)' : 'none'}
          boxShadow={isDark ? 'none' : 'lg'}
          overflowX="auto"
        >
          {isLoading ? (
            <Flex justify="center" align="center" p={8}>
              <Spinner size="xl" />
            </Flex>
          ) : error ? (
            <Flex justify="center" align="center" p={8}>
              <Text color="red.500">{error}</Text>
            </Flex>
          ) : cotizaciones.length === 0 ? (
            <Flex justify="center" align="center" p={8}>
              <Text color={labelColor}>No se encontraron cotizaciones</Text>
            </Flex>
          ) : (
            <Table variant="simple" size="sm">
              <Thead bg={tableHeaderBg}>
                <Tr>
                  <Th w="100px">Número</Th>
                  <Th minW="120px" maxW="200px">Título</Th>
                  <Th w="90px">Cód. Cliente</Th>
                  <Th minW="150px">Cliente</Th>
                  <Th w="120px">Vendedor</Th>
                  <Th w="100px">Fecha</Th>
                  <Th w="90px">Estado</Th>
                  <Th w="120px" isNumeric>Total (Sin IVA)</Th>
                  <Th w="80px">Acciones</Th>
                </Tr>
              </Thead>
              <Tbody>
                {cotizaciones.map((cot) => (
                  <Tr
                    key={cot.ID}
                    _hover={{ bg: hoverBg }}
                    cursor="pointer"
                    onClick={() => onSeleccionar(cot.ID)}
                  >
                    <Td fontWeight="500" color={primaryColor}>
                      {cot.NRO_COTIZACION?.replace('C-', '') || '-'}
                    </Td>
                    <Td>
                      <Tooltip
                        label={cot.TITULO || 'Sin título'}
                        placement="top"
                        hasArrow
                        isDisabled={!cot.TITULO}
                      >
                        <Text
                          fontSize="sm"
                          noOfLines={1}
                          color={cot.TITULO ? 'inherit' : labelColor}
                          fontStyle={cot.TITULO ? 'normal' : 'italic'}
                          cursor={cot.TITULO ? 'help' : 'default'}
                        >
                          {cot.TITULO || 'Sin título'}
                        </Text>
                      </Tooltip>
                    </Td>
                    <Td fontWeight="500">
                      {cot.TIPO_CLIENTE === 'H' && cot.COD_CLIENTE && cot.COD_CLIENTE !== '000000' ? (
                        <Box
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/admin/Integrador/${cot.COD_CLIENTE}`);
                          }}
                          cursor="pointer"
                          transition="all 0.2s ease-in-out"
                          _hover={{
                            transform: "scale(1.05)",
                          }}
                          display="inline-block"
                        >
                          <Badge
                            fontWeight="bold"
                            fontSize="15px"
                            transition="all 0.2s ease-in-out"
                            _hover={{
                              bg: "blue.500",
                              color: "white",
                              transform: "translateY(-1px)"
                            }}
                          >
                            {cot.COD_CLIENTE}
                          </Badge>
                        </Box>
                      ) : (
                        cot.COD_CLIENTE || '-'
                      )}
                    </Td>
                    <Td>{cot.NOMBRE_CLIENTE || '-'}</Td>
                    <Td>{cot.NOMBRE_VENDEDOR || cot.COD_VENDEDOR || '-'}</Td>
                    <Td>{formatFecha(cot.FECHA_CREACION)}</Td>
                    <Td>{getEstadoBadge(cot.ESTADO)}</Td>
                    <Td isNumeric fontWeight="500">
                      {formatMoneda(cot.TOTAL)}
                    </Td>
                    <Td>
                      <HStack spacing={1}>
                        <IconButton
                          icon={<ViewIcon />}
                          size="sm"
                          variant="ghost"
                          colorScheme="blue"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSeleccionar(cot.ID);
                          }}
                          aria-label="Ver detalles"
                        />
                        {cot.ESTADO === 'creada' && (
                          <IconButton
                            icon={<DeleteIcon />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            onClick={(e) => eliminarCotizacion(cot.ID, cot.NRO_COTIZACION, e)}
                            aria-label="Eliminar cotización"
                          />
                        )}
                      </HStack>
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          )}

          {/* Paginación */}
          {!isLoading && !error && cotizaciones.length > 0 && (
            <Flex
              justify="space-between"
              align="center"
              p={4}
              borderTop="1px"
              borderColor={borderColor}
              flexWrap="wrap"
              gap={4}
            >
              {/* Info de registros */}
              <Text fontSize="sm" color={labelColor}>
                Mostrando{' '}
                {Math.min((filtros.page - 1) * filtros.limit + 1, metadata.total)}-
                {Math.min(filtros.page * filtros.limit, metadata.total)} de{' '}
                {metadata.total} cotizaciones
              </Text>

              {/* Controles de paginación */}
              <HStack spacing={2}>
                {/* Primera página */}
                <IconButton
                  icon={<Icon as={MdFirstPage} />}
                  size="sm"
                  isDisabled={filtros.page === 1}
                  onClick={() => cambiarPagina(1)}
                  aria-label="Primera página"
                />

                {/* Anterior */}
                <IconButton
                  icon={<ChevronLeftIcon />}
                  size="sm"
                  isDisabled={filtros.page === 1}
                  onClick={() => cambiarPagina(filtros.page - 1)}
                  aria-label="Página anterior"
                />

                {/* Números de página */}
                {(() => {
                  const paginas = [];
                  const totalPaginas = metadata.totalPages;
                  const paginaActual = filtros.page;

                  // Lógica para mostrar páginas: 1 ... 4 5 [6] 7 8 ... 15
                  if (totalPaginas <= 7) {
                    // Mostrar todas las páginas
                    for (let i = 1; i <= totalPaginas; i++) {
                      paginas.push(i);
                    }
                  } else {
                    // Siempre mostrar primera página
                    paginas.push(1);

                    if (paginaActual > 3) {
                      paginas.push('...');
                    }

                    // Mostrar páginas alrededor de la actual
                    const inicio = Math.max(2, paginaActual - 1);
                    const fin = Math.min(totalPaginas - 1, paginaActual + 1);

                    for (let i = inicio; i <= fin; i++) {
                      if (!paginas.includes(i)) {
                        paginas.push(i);
                      }
                    }

                    if (paginaActual < totalPaginas - 2) {
                      paginas.push('...');
                    }

                    // Siempre mostrar última página
                    if (!paginas.includes(totalPaginas)) {
                      paginas.push(totalPaginas);
                    }
                  }

                  return paginas.map((pag, idx) =>
                    pag === '...' ? (
                      <Text key={`dots-${idx}`} px={2} color={labelColor}>
                        ...
                      </Text>
                    ) : (
                      <Button
                        key={pag}
                        size="sm"
                        variant={pag === paginaActual ? 'solid' : 'outline'}
                        colorScheme={pag === paginaActual ? 'blue' : 'gray'}
                        onClick={() => cambiarPagina(pag)}
                      >
                        {pag}
                      </Button>
                    )
                  );
                })()}

                {/* Siguiente */}
                <IconButton
                  icon={<ChevronRightIcon />}
                  size="sm"
                  isDisabled={filtros.page === metadata.totalPages}
                  onClick={() => cambiarPagina(filtros.page + 1)}
                  aria-label="Página siguiente"
                />

                {/* Última página */}
                <IconButton
                  icon={<Icon as={MdLastPage} />}
                  size="sm"
                  isDisabled={filtros.page === metadata.totalPages}
                  onClick={() => cambiarPagina(metadata.totalPages)}
                  aria-label="Última página"
                />
              </HStack>

              {/* Selector de límite */}
              <HStack spacing={2}>
                <Text fontSize="sm" color={labelColor}>
                  Mostrar:
                </Text>
                <Select
                  w="80px"
                  size="sm"
                  value={filtros.limit}
                  onChange={(e) => cambiarLimite(Number(e.target.value))}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </Select>
              </HStack>
            </Flex>
          )}
        </Box>
      </VStack>
    </Box>
  );
};

export default ListaCotizaciones;
