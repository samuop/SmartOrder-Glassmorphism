import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  Divider,
  useColorModeValue,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  IconButton,
  Tooltip,
  Collapse,
  Grid,
  GridItem,
  useDisclosure,
} from '@chakra-ui/react';
import {
  CheckCircleIcon,
  TimeIcon,
  ExternalLinkIcon,
  InfoIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@chakra-ui/icons';
import cotizadorService from '../../../services/cotizadorService';
import { getVendedores } from '@/api';

/**
 * Componente para mostrar el historial de pedidos generados desde una cotización
 */
function HistorialPedidos({ isOpen, onClose, cotizacionId }) {
  const [pedidos, setPedidos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pedidosExpandidos, setPedidosExpandidos] = useState({});
  const [detallesPedidos, setDetallesPedidos] = useState({});
  const [loadingDetalles, setLoadingDetalles] = useState({});

  const [loadingEstados, setLoadingEstados] = useState({});
  const [vendedoresMap, setVendedoresMap] = useState({});

  // Colores del tema
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const labelColor = useColorModeValue('gray.600', 'gray.400');

  const cargarHistorial = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cotizadorService.obtenerHistorialPedidos(cotizacionId);

      if (response.success) {
        const pedidosData = response.data || [];
        setPedidos(pedidosData);

        // Cargar estados desde Tango para todos los pedidos de forma asíncrona
        pedidosData.forEach(async (pedido) => {
          const nroPedido = pedido.NRO_PEDIDO_TANGO;
          if (nroPedido) {
            // Marcar como cargando
            setLoadingEstados((prev) => ({ ...prev, [nroPedido]: true }));

            try {
              const detallesResponse = await cotizadorService.obtenerDetallesPedidoTango(nroPedido);
              if (detallesResponse.success && detallesResponse.data?.estado) {
                // Guardar los detalles para tener disponible info como el Nro. Pedido
                setDetallesPedidos((prev) => ({
                  ...prev,
                  [nroPedido]: { success: true, data: detallesResponse.data },
                }));

                // Actualizar solo el estado del pedido
                setPedidos((prevPedidos) =>
                  prevPedidos.map((p) =>
                    p.NRO_PEDIDO_TANGO === nroPedido
                      ? { ...p, ESTADO_PEDIDO: detallesResponse.data.estado }
                      : p
                  )
                );
              }
            } catch (err) {
              // Silenciar errores individuales para no interrumpir la carga de otros estados
              console.warn(`No se pudo actualizar estado del pedido ${nroPedido}:`, err);
            } finally {
              // Marcar como terminado
              setLoadingEstados((prev) => ({ ...prev, [nroPedido]: false }));
            }
          }
        });
      } else {
        setError('No se pudo cargar el historial de pedidos');
      }
    } catch (err) {
      console.error('Error al cargar historial de pedidos:', err);
      setError(err.message || 'Error al cargar el historial');
    } finally {
      setIsLoading(false);
    }
  }, [cotizacionId]);

  useEffect(() => {
    const cargarVendedores = async () => {
      try {
        const data = await getVendedores();
        if (Array.isArray(data)) {
          const map = {};
          data.forEach(v => {
            map[v.COD_VENDED] = v.NOMBRES;
          });
          setVendedoresMap(map);
        }
      } catch (err) {
        console.error('Error al cargar vendedores:', err);
      }
    };

    if (isOpen) {
      cargarVendedores();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && cotizacionId) {
      cargarHistorial();
    }
  }, [isOpen, cotizacionId, cargarHistorial]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '-';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const obtenerColorEstado = (estado) => {
    if (!estado) return 'gray';
    const estadoLower = estado.toLowerCase();

    // Estados de Tango
    if (estadoLower.includes('ingresado')) return 'yellow';
    if (estadoLower.includes('aprobado')) return 'blue';
    if (estadoLower.includes('cumplido') || estadoLower.includes('completado')) return 'green';
    if (estadoLower.includes('anulado') || estadoLower.includes('cancelado')) return 'red';

    // Estados adicionales
    if (estadoLower.includes('pendiente')) return 'yellow';
    if (estadoLower.includes('procesado')) return 'green';
    if (estadoLower.includes('facturado')) return 'blue';

    return 'gray';
  };

  const toggleDetallesPedido = async (nroPedido) => {

    // Si ya está expandido, solo colapsarlo
    if (pedidosExpandidos[nroPedido]) {

      setPedidosExpandidos((prev) => ({ ...prev, [nroPedido]: false }));
      return;
    }

    // Expandir el pedido inmediatamente

    setPedidosExpandidos((prev) => ({ ...prev, [nroPedido]: true }));

    // Si no tiene detalles cargados, cargarlos
    if (!detallesPedidos[nroPedido]) {

      setLoadingDetalles((prev) => ({ ...prev, [nroPedido]: true }));

      try {
        const response = await cotizadorService.obtenerDetallesPedidoTango(nroPedido);


        if (response.success) {
          setDetallesPedidos((prev) => ({
            ...prev,
            [nroPedido]: { success: true, data: response.data },
          }));

          // Actualizar el estado del pedido en la lista
          setPedidos((prevPedidos) =>
            prevPedidos.map((p) =>
              p.NRO_PEDIDO_TANGO === nroPedido
                ? { ...p, ESTADO_PEDIDO: response.data.estado }
                : p
            )
          );
        } else {
          setDetallesPedidos((prev) => ({
            ...prev,
            [nroPedido]: {
              success: false,
              error: response.message || 'No se pudieron cargar los detalles',
            },
          }));
        }
      } catch (err) {
        console.error('Error al cargar detalles del pedido:', err);
        setDetallesPedidos((prev) => ({
          ...prev,
          [nroPedido]: {
            success: false,
            error: err.message || 'Error al cargar los detalles',
          },
        }));
      } finally {
        setLoadingDetalles((prev) => ({ ...prev, [nroPedido]: false }));
      }
    }
  };

  const formatearMoneda = (valor) => {
    if (!valor && valor !== 0) return '$0.00';
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(valor);
  };

  const formatearNroPedido = (nroPedido) => {
    if (!nroPedido) return '-';
    // Si ya tiene el formato correcto (empieza con 0 y tiene más de 10 caracteres), devolverlo tal cual
    if (nroPedido.toString().startsWith('0') && nroPedido.toString().length > 10) {
      return nroPedido.toString().trim();
    }
    // Sino, formatear con ceros a la izquierda (13 dígitos)
    return nroPedido.toString().padStart(13, '0');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent maxH="90vh">
        <ModalHeader>
          <HStack spacing={3}>
            <Icon as={TimeIcon} color="blue.500" boxSize={5} />
            <Text>Historial de Pedidos</Text>
          </HStack>

        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" minH="200px">
              <VStack spacing={3}>
                <Spinner size="lg" color="blue.500" thickness="3px" />
                <Text color={labelColor}>Cargando historial...</Text>
              </VStack>
            </Flex>
          ) : error ? (
            <Alert
              status="error"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              minH="200px"
              borderRadius="lg"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Error al cargar historial
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                {error}
              </AlertDescription>
              <Button
                mt={4}
                colorScheme="blue"
                size="sm"
                onClick={cargarHistorial}
              >
                Reintentar
              </Button>
            </Alert>
          ) : pedidos.length === 0 ? (
            <Alert
              status="info"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              minH="200px"
              borderRadius="lg"
            >
              <AlertIcon boxSize="40px" mr={0} />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Sin pedidos registrados
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                Aún no se han generado pedidos desde esta cotización.
                Crea un pedido usando el botón "Crear Pedido en Tango".
              </AlertDescription>
            </Alert>
          ) : (
            <VStack spacing={4} align="stretch">
              {pedidos.map((pedido, index) => {
                const nroPedido = pedido.NRO_PEDIDO_TANGO;
                const isExpanded = pedidosExpandidos[nroPedido];
                const detalles = detallesPedidos[nroPedido];
                const isLoadingDetails = loadingDetalles[nroPedido];

                return (
                  <Box
                    key={pedido.ID || index}
                    border="1px"
                    borderColor={borderColor}
                    borderRadius="lg"
                    overflow="hidden"
                    transition="all 0.3s"
                    _hover={{ shadow: 'md' }}
                  >
                    {/* Cabecera del pedido - siempre visible */}
                    <Box
                      p={4}
                      bg={useColorModeValue('gray.50', 'gray.700')}
                      cursor="pointer"
                      onClick={() => toggleDetallesPedido(nroPedido)}
                      _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}
                      transition="all 0.2s"
                    >
                      <Grid templateColumns="repeat(7, 1fr)" gap={4} alignItems="center">
                        <GridItem>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color={labelColor} fontWeight="500">
                              Versión
                            </Text>
                            <Badge colorScheme="teal" fontSize="sm" px={2} py={1} borderRadius="md">
                              v{pedido.VERSION}
                            </Badge>
                          </VStack>
                        </GridItem>
                        <GridItem>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color={labelColor} fontWeight="500">
                              ID Tango
                            </Text>
                            <HStack>
                              <Text fontWeight="700" fontSize="md" color="gray.500">
                                {nroPedido || '-'}
                              </Text>
                              {nroPedido && (
                                <Tooltip label="Abrir en Tango Gestión" hasArrow>
                                  <IconButton
                                    size="xs"
                                    icon={<ExternalLinkIcon />}
                                    colorScheme="orange"
                                    variant="ghost"
                                    aria-label="Abrir en Tango"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(`http://servidor:17000/company/165/voucher/19845/edit/${nroPedido}`, '_blank');
                                    }}
                                  />
                                </Tooltip>
                              )}
                            </HStack>
                          </VStack>
                        </GridItem>
                        <GridItem>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color={labelColor} fontWeight="500">
                              Nro. Pedido
                            </Text>
                            {(isLoadingDetails && !detalles) || loadingEstados[nroPedido] ? (
                              <HStack spacing={2}>
                                <Spinner size="xs" color="blue.500" />
                                <Text fontSize="xs" color={labelColor}>
                                  Cargando...
                                </Text>
                              </HStack>
                            ) : (
                              <Text fontWeight="700" fontSize="lg" color="blue.500">
                                {detalles?.data?.data?.nroPedido?.trim() || detalles?.data?.nroPedido?.trim() || '-'}
                              </Text>
                            )}
                          </VStack>
                        </GridItem>
                        <GridItem>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color={labelColor} fontWeight="500">
                              Estado
                            </Text>
                            {(isLoadingDetails && !detalles) || loadingEstados[nroPedido] ? (
                              <HStack spacing={2}>
                                <Spinner size="xs" color="blue.500" />
                                <Text fontSize="xs" color={labelColor}>
                                  Consultando...
                                </Text>
                              </HStack>
                            ) : (
                              <Badge
                                colorScheme={obtenerColorEstado(pedido.ESTADO_PEDIDO)}
                                fontSize="sm"
                                px={3}
                                py={1}
                                borderRadius="md"
                              >
                                {pedido.ESTADO_PEDIDO || 'Sin estado'}
                              </Badge>
                            )}
                          </VStack>
                        </GridItem>
                        <GridItem>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color={labelColor} fontWeight="500">
                              Fecha Creación
                            </Text>
                            <Text fontSize="sm">{formatearFecha(pedido.FECHA_CREACION_PEDIDO)}</Text>
                          </VStack>
                        </GridItem>
                        <GridItem>
                          <VStack align="start" spacing={1}>
                            <Text fontSize="xs" color={labelColor} fontWeight="500">
                              Creado Por
                            </Text>
                            <Text fontSize="sm" fontWeight="500">
                              {vendedoresMap[pedido.CREADO_POR] || pedido.CREADO_POR}
                            </Text>
                          </VStack>
                        </GridItem>
                        <GridItem textAlign="right">
                          <Tooltip label={isExpanded ? 'Ocultar detalles' : 'Ver detalles'} hasArrow>
                            <IconButton
                              icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                              size="lg"
                              variant="ghost"
                              colorScheme="blue"
                              aria-label="Toggle detalles"
                            />
                          </Tooltip>
                        </GridItem>
                      </Grid>

                      {pedido.OBSERVACIONES && (
                        <Box mt={3} pt={3} borderTop="1px" borderColor={borderColor}>
                          <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                            Observaciones:
                          </Text>
                          <Text fontSize="sm" color={labelColor}>
                            {pedido.OBSERVACIONES}
                          </Text>
                        </Box>
                      )}
                    </Box>

                    {/* Detalles expandibles del pedido */}
                    <Collapse in={isExpanded} animateOpacity>
                      <Box p={5} bg={bgColor} borderTop="1px" borderColor={borderColor}>
                        {isLoadingDetails ? (
                          <Flex justify="center" align="center" minH="200px">
                            <VStack spacing={3}>
                              <Spinner size="lg" color="blue.500" thickness="3px" />
                              <Text color={labelColor}>Consultando Tango...</Text>
                            </VStack>
                          </Flex>
                        ) : detalles && !detalles.success ? (
                          <Alert status="error" borderRadius="md">
                            <AlertIcon />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{detalles.error}</AlertDescription>
                          </Alert>
                        ) : detalles && detalles.success ? (
                          <VStack spacing={5} align="stretch">
                            {/* Información General */}
                            <Box
                              p={4}
                              bg={useColorModeValue('gray.50', 'gray.700')}
                              borderRadius="md"
                              borderLeft="4px"
                              borderColor="blue.500"
                            >
                              <HStack mb={3}>
                                <Icon as={InfoIcon} color="blue.500" />
                                <Text fontSize="md" fontWeight="600">
                                  Información General
                                </Text>
                              </HStack>
                              <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                                <GridItem>
                                  <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                    Fecha Pedido
                                  </Text>
                                  <Text fontSize="sm" fontWeight="600">
                                    {formatearFecha(detalles.data.fechaPedido)}
                                  </Text>
                                </GridItem>
                                {detalles.data.fechaEntrega && (
                                  <GridItem>
                                    <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                      Fecha Entrega
                                    </Text>
                                    <Text fontSize="sm" fontWeight="600">
                                      {formatearFecha(detalles.data.fechaEntrega)}
                                    </Text>
                                  </GridItem>
                                )}
                                <GridItem>
                                  <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                    Cliente
                                  </Text>
                                  <Text fontSize="sm" fontWeight="600">
                                    {detalles.data.nombreCliente || 'N/A'}
                                  </Text>
                                </GridItem>
                                {detalles.data.codigoCliente && (
                                  <GridItem>
                                    <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                      Código Cliente
                                    </Text>
                                    <Text fontSize="sm" fontWeight="600">
                                      {detalles.data.codigoCliente}
                                    </Text>
                                  </GridItem>
                                )}
                              </Grid>
                            </Box>

                            {/* Cliente Ocasional */}
                            {detalles.data.clienteOcasional && (
                              <Box
                                p={4}
                                bg={useColorModeValue('gray.50', 'gray.700')}
                                borderRadius="md"
                                borderLeft="4px"
                                borderColor="blue.500"
                              >
                                <Text fontSize="md" fontWeight="600" mb={3}>
                                  Cliente Ocasional
                                </Text>
                                <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                                  {detalles.data.clienteOcasional.razonSocial && (
                                    <GridItem>
                                      <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                        Razón Social
                                      </Text>
                                      <Text fontSize="sm">{detalles.data.clienteOcasional.razonSocial}</Text>
                                    </GridItem>
                                  )}
                                  {detalles.data.clienteOcasional.cuit && (
                                    <GridItem>
                                      <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                        CUIT
                                      </Text>
                                      <Text fontSize="sm">{detalles.data.clienteOcasional.cuit}</Text>
                                    </GridItem>
                                  )}
                                  {detalles.data.clienteOcasional.domicilio && (
                                    <GridItem colSpan={2}>
                                      <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                        Domicilio
                                      </Text>
                                      <Text fontSize="sm">{detalles.data.clienteOcasional.domicilio}</Text>
                                    </GridItem>
                                  )}
                                  {detalles.data.clienteOcasional.localidad && (
                                    <GridItem>
                                      <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                        Localidad
                                      </Text>
                                      <Text fontSize="sm">
                                        {detalles.data.clienteOcasional.localidad}
                                        {detalles.data.clienteOcasional.codigoPostal &&
                                          ` (${detalles.data.clienteOcasional.codigoPostal})`}
                                      </Text>
                                    </GridItem>
                                  )}
                                  {detalles.data.clienteOcasional.telefono && (
                                    <GridItem>
                                      <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                        Teléfono
                                      </Text>
                                      <Text fontSize="sm">{detalles.data.clienteOcasional.telefono}</Text>
                                    </GridItem>
                                  )}
                                  {detalles.data.clienteOcasional.email && (
                                    <GridItem>
                                      <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                        Email
                                      </Text>
                                      <Text fontSize="sm">{detalles.data.clienteOcasional.email}</Text>
                                    </GridItem>
                                  )}
                                  {detalles.data.clienteOcasional.nroIngresosBrutos && (
                                    <GridItem>
                                      <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                        Nro. Ingresos Brutos
                                      </Text>
                                      <Text fontSize="sm">{detalles.data.clienteOcasional.nroIngresosBrutos}</Text>
                                    </GridItem>
                                  )}
                                </Grid>

                                {/* Percepciones del Cliente */}
                                {detalles.data.clienteOcasional.percepciones &&
                                  detalles.data.clienteOcasional.percepciones.length > 0 && (
                                    <Box mt={4} pt={3} borderTop="1px" borderColor={borderColor}>
                                      <HStack mb={2}>
                                        <Badge colorScheme="blue" fontSize="xs">
                                          {detalles.data.clienteOcasional.percepciones.length}
                                        </Badge>
                                        <Text fontSize="sm" fontWeight="600">
                                          Percepciones Aplicadas
                                        </Text>
                                      </HStack>
                                      <VStack spacing={2} align="stretch">
                                        {detalles.data.clienteOcasional.percepciones.map((percepcion, idx) => (
                                          <HStack
                                            key={idx}
                                            p={2}
                                            bg={useColorModeValue('white', 'gray.600')}
                                            borderRadius="md"
                                            spacing={2}
                                            fontSize="sm"
                                          >
                                            <Text color={labelColor} minW="50px">
                                              ID {percepcion.idPercepcion}:
                                            </Text>
                                            <Text flex={1}>
                                              {percepcion.leyenda}
                                            </Text>
                                          </HStack>
                                        ))}
                                      </VStack>
                                    </Box>
                                  )}
                              </Box>
                            )}

                            {/* Items del Pedido */}
                            {detalles.data.renglones && detalles.data.renglones.length > 0 && (
                              <Box
                                p={4}
                                bg={useColorModeValue('gray.50', 'gray.700')}
                                borderRadius="md"
                                borderLeft="4px"
                                borderColor="green.500"
                              >
                                <HStack mb={3}>
                                  <Badge colorScheme="green" fontSize="sm">
                                    {detalles.data.renglones.length}
                                  </Badge>
                                  <Text fontSize="md" fontWeight="600">
                                    Items del Pedido
                                  </Text>
                                </HStack>
                                <Box overflowX="auto">
                                  <Table variant="simple" size="sm">
                                    <Thead bg={useColorModeValue('gray.100', 'gray.800')}>
                                      <Tr>
                                        <Th>Descripción</Th>
                                        <Th isNumeric>Cant.</Th>
                                        <Th isNumeric>Precio Unit.</Th>
                                        <Th isNumeric>Bonif.</Th>
                                        <Th isNumeric>Importe</Th>
                                      </Tr>
                                    </Thead>
                                    <Tbody>
                                      {detalles.data.renglones.map((renglon, idx) => (
                                        <Tr key={idx} _hover={{ bg: useColorModeValue('gray.100', 'gray.600') }}>
                                          <Td maxW="300px">
                                            <VStack align="start" spacing={0}>
                                              <Text fontSize="sm" fontWeight="500">
                                                {renglon.descripcion || 'Sin descripción'}
                                              </Text>
                                              {renglon.descripcionAdicional && (
                                                <Text fontSize="xs" color={labelColor}>
                                                  {renglon.descripcionAdicional}
                                                </Text>
                                              )}
                                            </VStack>
                                          </Td>
                                          <Td isNumeric fontWeight="500">{renglon.cantidad || 0}</Td>
                                          <Td isNumeric>{formatearMoneda(renglon.precio)}</Td>
                                          <Td isNumeric>
                                            {renglon.bonificacion > 0 && (
                                              <Badge colorScheme="orange" fontSize="xs">
                                                {renglon.bonificacion}%
                                              </Badge>
                                            )}
                                            {!renglon.bonificacion && '-'}
                                          </Td>
                                          <Td isNumeric fontWeight="700">
                                            {formatearMoneda(renglon.importe)}
                                          </Td>
                                        </Tr>
                                      ))}
                                    </Tbody>
                                  </Table>
                                </Box>

                                {/* Total */}
                                <Divider my={3} />
                                <HStack justify="space-between" p={2}>
                                  <Text fontSize="lg" fontWeight="700">
                                    Total del Pedido:
                                  </Text>
                                  <Text fontSize="xl" fontWeight="700" color="green.600">
                                    {formatearMoneda(detalles.data.total)}
                                  </Text>
                                </HStack>
                              </Box>
                            )}

                            {/* Notas del Pedido */}
                            {detalles.data.notas && detalles.data.notas.length > 0 && (
                              <Box
                                p={4}
                                bg={useColorModeValue('gray.50', 'gray.700')}
                                borderRadius="md"
                                borderLeft="4px"
                                borderColor="orange.500"
                              >
                                <HStack mb={3}>
                                  <Badge colorScheme="orange" fontSize="sm">
                                    {detalles.data.notas.length}
                                  </Badge>
                                  <Text fontSize="md" fontWeight="600">
                                    Historial de Notas
                                  </Text>
                                </HStack>
                                <VStack spacing={2} align="stretch">
                                  {detalles.data.notas.map((nota, idx) => (
                                    <HStack
                                      key={nota.idNota || idx}
                                      p={2}
                                      bg={useColorModeValue('white', 'gray.600')}
                                      borderRadius="md"
                                      spacing={2}
                                      fontSize="sm"
                                    >
                                      <Text color={labelColor} fontWeight="500" minW="60px">
                                        #{nota.idNota}
                                      </Text>
                                      <Text flex={1}>
                                        {nota.mensaje}
                                      </Text>
                                    </HStack>
                                  ))}
                                </VStack>
                              </Box>
                            )}

                            {/* Observaciones */}
                            {detalles.data.observaciones && (
                              <Box
                                p={4}
                                bg={useColorModeValue('gray.50', 'gray.700')}
                                borderRadius="md"
                                borderLeft="4px"
                                borderColor="gray.400"
                              >
                                <Text fontSize="md" fontWeight="600" mb={2}>
                                  Observaciones
                                </Text>
                                <Text fontSize="sm" whiteSpace="pre-wrap">
                                  {detalles.data.observaciones}
                                </Text>
                              </Box>
                            )}
                          </VStack>
                        ) : null}
                      </Box>
                    </Collapse>
                  </Box>
                );
              })}


            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default HistorialPedidos;
