import React, { useState, useEffect } from 'react';
import {
    Box,
    Flex,
    Text,
    VStack,
    HStack,
    Badge,
    IconButton,
    useColorModeValue,
    Spinner,
    Button,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalCloseButton,
    ModalFooter,
    Table,
    Thead,
    Tbody,
    Tr,
    Th,
    Td,
    Divider,
    Grid,
    GridItem,
    useDisclosure,
    Portal,
    Icon,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
} from '@chakra-ui/react';
import { AddIcon, TimeIcon, CheckCircleIcon, InfoIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { SlSocialDropbox } from "react-icons/sl";
import { FaTruck, FaFileInvoice, FaBox, FaDownload } from "react-icons/fa";
import { getVendedores, SearchCLI, Vendedor } from '@/api';
import cotizadorService from '../../../services/cotizadorService';
import { VersionCotizacion, Cotizacion } from '../../../types/cotizador';

interface MapaPedidosProps {
    cotizacion: Cotizacion;
    onCrearPedidoTango?: (version: any) => Promise<void>;
    onCrearPedidoDeposito?: (version: any) => Promise<void>;
    onVerDetallePedido?: (pedido: any) => void;
}


// Función para descargar factura en PDF
const handleFacturaClick = async (nroFactura) => {
    try {
        const response = await fetch(`/CRM/getFacturaPDF?nroFactura=${nroFactura}`, {
            method: 'GET',
        });

        if (!response.ok) throw new Error('Error al descargar factura');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Factura_${nroFactura}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al descargar factura:', error);
        alert('Error al descargar la factura');
    }
};

// Función para descargar remito en PDF
const handleRemitoClick = async (nroRemito) => {
    try {
        // Usar el mismo endpoint que en Modal_I.js
        const response = await fetch(`/CRM/getFacturaPDF?nroREM=${nroRemito}`, {
            method: 'GET',
        });

        if (!response.ok) throw new Error('Error al descargar remito');

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Remito_${nroRemito}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error al descargar remito:', error);
        alert('Error al descargar el remito');
    }
};



// Constantes para tamaños consistentes
const NODE_HEIGHT = 70; // Altura estándar de todos los nodos
const NODE_CENTER = NODE_HEIGHT / 2; // Centro vertical (35px)
const CONNECTOR_WIDTH = 20; // Ancho de conectores
const LINE_THICKNESS = 2; // Grosor de líneas

// Componente para renderizar lista de pedidos (Extraído para evitar re-renderizados)
const PedidosList = ({ pedidos, color, lineColor, cardBg, vendedoresMap, onVerDetalle, detallesCache, depositosData, relacionesData, children }) => {
    const totalItems = pedidos.length + (children ? 1 : 0);

    return (
        <Flex direction="column" position="relative">
            {pedidos.map((pedido, idx) => {
                const detalles = detallesCache?.[pedido.NRO_PEDIDO_TANGO];
                const nroMostrar = detalles?.nroPedido || pedido.NRO_COMPROBANTE || pedido.NRO_PEDIDO_TANGO || '-';
                const estadoMostrar = detalles?.estado || pedido.ESTADO_DESCRIPCION || pedido.ESTADO_PEDIDO || 'Pendiente';
                const isLast = idx === totalItems - 1;

                // Obtener relaciones (facturas/remitos) para este pedido usando NRO_PEDIDO_TANGO
                const relacion = relacionesData?.[pedido.NRO_PEDIDO_TANGO];
                const tieneFacturas = relacion && relacion.facturas && relacion.facturas.length > 0;
                const tieneRemitos = relacion && relacion.remitos && relacion.remitos.length > 0;
                const mostrarRemito = relacion && relacion.COND_VTA !== 3; // No mostrar remito si COND_VTA es 3 (NETO CONTADO)

                // Calcular altura dinámica basada en facturas y remitos
                const numFacturas = tieneFacturas ? relacion.facturas.length : 0;
                const numRemitos = (tieneRemitos && mostrarRemito) ? relacion.remitos.length : 0;
                const maxItems = Math.max(1, numFacturas, numRemitos);
                const alturaDinamica = maxItems * NODE_HEIGHT;

                return (
                    <React.Fragment key={`${color}-${pedido.ID || idx}-${idx}`}>
                        <Flex align="flex-start" position="relative" minH={`${alturaDinamica}px`}>
                            {/* Conector Vertical y Horizontal */}
                            <Box w={`${CONNECTOR_WIDTH}px`} position="relative" h={`${alturaDinamica}px`}>
                                {/* Línea vertical principal: siempre desde el top */}
                                <Box
                                    position="absolute"
                                    left="0"
                                    top={idx === 0 ? `${NODE_HEIGHT / 2}px` : "0"}
                                    bottom={isLast ? `${alturaDinamica - NODE_HEIGHT / 2}px` : "0"}
                                    w={`${LINE_THICKNESS}px`}
                                    bg={lineColor}
                                />
                                {/* Línea horizontal al nodo */}
                                <Box
                                    position="absolute"
                                    left="0"
                                    top={`${NODE_HEIGHT / 2}px`}
                                    w="100%"
                                    h={`${LINE_THICKNESS}px`}
                                    bg={lineColor}
                                />
                            </Box>

                            <Box>
                                <Box
                                    p={2}
                                    px={3}
                                    bg={cardBg}
                                    borderLeft="3px solid"
                                    borderLeftColor={`${color}.400`}
                                    borderRadius="md"
                                    boxShadow="sm"
                                    w="180px"
                                    h={`${NODE_HEIGHT - 10}px`}
                                    display="flex"
                                    flexDirection="column"
                                    justifyContent="center"
                                    cursor="pointer"
                                    _hover={{ boxShadow: "md", transform: "translateY(-1px)", transition: "all 0.2s" }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onVerDetalle(pedido);
                                    }}
                                >
                                    <HStack spacing={2} align="flex-start">
                                        <Flex w={5} h={5} align="center" justify="center" borderRadius="full" bg={`${color}.100`} color={`${color}.600`} flexShrink={0} mt="2px">
                                            <Text fontSize="2xs" fontWeight="bold">✓</Text>
                                        </Flex>
                                        <Box flex={1} overflow="hidden">
                                            <Text fontWeight="600" fontSize="xs" noOfLines={1}>
                                                ID: {pedido.NRO_PEDIDO_TANGO || (pedido.ID < 0 ? Math.abs(pedido.ID) : pedido.ID)}
                                            </Text>
                                            <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                                                {pedido.DEPOSITO_ORIGEN ? 'Dpto' : 'Nro'}: {pedido.DEPOSITO_ORIGEN ? pedido.DEPOSITO_ORIGEN : (detalles === undefined && pedido.NRO_PEDIDO_TANGO ? <Spinner size="xs" /> : nroMostrar)}
                                            </Text>
                                            {detalles === undefined && pedido.NRO_PEDIDO_TANGO ? (
                                                <Spinner size="xs" mt={1} />
                                            ) : (
                                                <Badge
                                                    colorScheme={
                                                        (estadoMostrar || '').toLowerCase().includes('aprobado') ? 'green' :
                                                            (estadoMostrar || '').toLowerCase().includes('cumplido') ? 'green' :
                                                                (estadoMostrar || '').toLowerCase().includes('anulado') ? 'red' : 'yellow'
                                                    }
                                                    fontSize="2xs"
                                                    mt={1}
                                                >
                                                    {estadoMostrar}
                                                </Badge>
                                            )}
                                        </Box>
                                    </HStack>
                                </Box>
                            </Box>

                            {/* Conector hacia facturas si existen */}
                            {tieneFacturas && (
                                <Box w="15px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2 - LINE_THICKNESS / 2}px`} />
                            )}

                            {/* Columna de Facturas */}
                            {tieneFacturas && (
                                <Flex direction="column" position="relative">
                                    {relacion.facturas.length > 1 && (
                                        <Box position="absolute" left="0" top={`${NODE_HEIGHT / 2}px`} bottom={`${NODE_HEIGHT / 2}px`} w={`${LINE_THICKNESS}px`} bg={lineColor} />
                                    )}
                                    {relacion.facturas.map((factura, fIdx) => (
                                        <Flex key={`fac-${factura.N_COMP}-${fIdx}`} align="center" position="relative" h={`${NODE_HEIGHT}px`}>
                                            <Box w={`${CONNECTOR_WIDTH}px`} position="relative" alignSelf="stretch">
                                                {relacion.facturas.length > 1 ? (
                                                    <>
                                                        <Box
                                                            position="absolute"
                                                            left="0"
                                                            top={fIdx === 0 ? "50%" : "0"}
                                                            bottom={fIdx === relacion.facturas.length - 1 ? "50%" : "0"}
                                                            w={`${LINE_THICKNESS}px`}
                                                            bg={lineColor}
                                                        />
                                                        <Box
                                                            position="absolute"
                                                            left="0"
                                                            top="50%"
                                                            w="100%"
                                                            h={`${LINE_THICKNESS}px`}
                                                            bg={lineColor}
                                                        />
                                                    </>
                                                ) : (
                                                    /* Línea horizontal simple cuando hay una sola factura */
                                                    <Box
                                                        position="absolute"
                                                        left="0"
                                                        top="50%"
                                                        w="100%"
                                                        h={`${LINE_THICKNESS}px`}
                                                        bg={lineColor}
                                                    />
                                                )}
                                            </Box>
                                            <Box>
                                                <Box
                                                    p={2}
                                                    px={3}
                                                    bg={cardBg}
                                                    borderLeft="3px solid"
                                                    borderLeftColor="green.400"
                                                    borderRadius="md"
                                                    boxShadow="sm"
                                                    w="150px"
                                                    h={`${NODE_HEIGHT - 10}px`}
                                                    display="flex"
                                                    flexDirection="column"
                                                    justifyContent="center"
                                                    cursor="pointer"
                                                    _hover={{
                                                        boxShadow: "md",
                                                        transform: "translateY(-1px)",
                                                        transition: "all 0.2s",
                                                        bg: useColorModeValue("green.50", "green.900")
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFacturaClick(factura.N_COMP);
                                                    }}
                                                >
                                                    <HStack spacing={2}>
                                                        <Flex w={5} h={5} align="center" justify="center" borderRadius="full" bg="green.100" color="green.600" flexShrink={0}>
                                                            <FaFileInvoice size={10} />
                                                        </Flex>
                                                        <Box flex={1} overflow="hidden">
                                                            <Text fontWeight="600" fontSize="xs" color="green.600">
                                                                Factura
                                                            </Text>
                                                            <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                                                                {factura.N_COMP}
                                                            </Text>
                                                        </Box>
                                                        <Icon as={FaDownload} boxSize={3} color="green.500" />
                                                    </HStack>
                                                </Box>
                                            </Box>
                                        </Flex>
                                    ))}
                                </Flex>
                            )}

                            {/* Conector hacia remitos si existen y deben mostrarse */}
                            {tieneRemitos && mostrarRemito && (
                                <Box w="15px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2 - LINE_THICKNESS / 2}px`} />
                            )}

                            {/* Columna de Remitos (separada de facturas) */}
                            {tieneRemitos && mostrarRemito && (
                                <Flex direction="column" position="relative">
                                    {relacion.remitos.length > 1 && (
                                        <Box position="absolute" left="0" top={`${NODE_HEIGHT / 2}px`} bottom={`${NODE_HEIGHT / 2}px`} w={`${LINE_THICKNESS}px`} bg={lineColor} />
                                    )}
                                    {relacion.remitos.map((remito, rIdx) => (
                                        <Flex key={`rem-${remito.N_REM}-${rIdx}`} align="center" position="relative" h={`${NODE_HEIGHT}px`}>
                                            <Box w={`${CONNECTOR_WIDTH}px`} position="relative" alignSelf="stretch">
                                                {relacion.remitos.length > 1 ? (
                                                    <>
                                                        <Box
                                                            position="absolute"
                                                            left="0"
                                                            top={rIdx === 0 ? "50%" : "0"}
                                                            bottom={rIdx === relacion.remitos.length - 1 ? "50%" : "0"}
                                                            w={`${LINE_THICKNESS}px`}
                                                            bg={lineColor}
                                                        />
                                                        <Box
                                                            position="absolute"
                                                            left="0"
                                                            top="50%"
                                                            w="100%"
                                                            h={`${LINE_THICKNESS}px`}
                                                            bg={lineColor}
                                                        />
                                                    </>
                                                ) : (
                                                    <Box
                                                        position="absolute"
                                                        left="0"
                                                        top="50%"
                                                        w="100%"
                                                        h={`${LINE_THICKNESS}px`}
                                                        bg={lineColor}
                                                    />
                                                )}
                                            </Box>
                                            <Box>
                                                <Box
                                                    p={2}
                                                    px={3}
                                                    bg={cardBg}
                                                    borderLeft="3px solid"
                                                    borderLeftColor="cyan.400"
                                                    borderRadius="md"
                                                    boxShadow="sm"
                                                    w="150px"
                                                    h={`${NODE_HEIGHT - 10}px`}
                                                    display="flex"
                                                    flexDirection="column"
                                                    justifyContent="center"
                                                    cursor="pointer"
                                                    _hover={{
                                                        boxShadow: "md",
                                                        transform: "translateY(-1px)",
                                                        transition: "all 0.2s",
                                                        bg: useColorModeValue("cyan.50", "cyan.900")
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemitoClick(remito.N_REM);
                                                    }}
                                                >
                                                    <HStack spacing={2}>
                                                        <Flex w={5} h={5} align="center" justify="center" borderRadius="full" bg="cyan.100" color="cyan.600" flexShrink={0}>
                                                            <FaBox size={10} />
                                                        </Flex>
                                                        <Box flex={1} overflow="hidden">
                                                            <Text fontWeight="600" fontSize="xs" color="cyan.600">
                                                                Remito
                                                            </Text>
                                                            <Text fontSize="2xs" color="gray.500" noOfLines={1}>
                                                                {remito.N_REM}
                                                            </Text>
                                                        </Box>
                                                        <Icon as={FaDownload} boxSize={3} color="cyan.500" />
                                                    </HStack>
                                                </Box>
                                            </Box>
                                        </Flex>
                                    ))}
                                </Flex>
                            )}
                        </Flex>
                    </React.Fragment>
                )
            })}

            {/* Renderizar hijos (ej: botón crear) como último item conectado */}
            {children && (
                <Flex align="center" position="relative" h={`${NODE_HEIGHT}px`}>
                    <Box w={`${CONNECTOR_WIDTH}px`} position="relative" alignSelf="stretch">
                        <Box
                            position="absolute"
                            left="0"
                            top={pedidos.length === 0 ? "50%" : "0"}
                            bottom="50%"
                            w={`${LINE_THICKNESS}px`}
                            bg={lineColor}
                        />
                        <Box
                            position="absolute"
                            left="0"
                            top="50%"
                            w="100%"
                            h={`${LINE_THICKNESS}px`}
                            bg={lineColor}
                        />
                    </Box>
                    <Box>
                        {children}
                    </Box>
                </Flex>
            )}
        </Flex>
    );
};



const EmptyNode = ({ tipo, color, onCreate, emptyNodeBg, isLoading }) => {
    const textColor = useColorModeValue(`${color}.600`, `${color}.200`);
    const iconBg = useColorModeValue(`${color}.100`, `${color}.900`);
    const iconColor = useColorModeValue(`${color}.500`, `${color}.200`);
    const borderColor = useColorModeValue(`${color}.300`, `${color}.500`);
    const hoverBg = useColorModeValue(`${color}.50`, "whiteAlpha.100");

    return (
        <Box
            p={2}
            px={3}
            bg={emptyNodeBg}
            border="2px dashed"
            borderColor={borderColor}
            borderRadius="md"
            cursor={isLoading ? "not-allowed" : "pointer"}
            _hover={!isLoading ? { bg: hoverBg, borderColor: iconColor } : {}}
            onClick={!isLoading ? onCreate : undefined}
            w="180px"
            h={`${NODE_HEIGHT - 10}px`}
            display="flex"
            alignItems="center"
        >
            <HStack spacing={2}>
                <Flex w={6} h={6} align="center" justify="center" borderRadius="full" bg={iconBg} color={iconColor} flexShrink={0}>
                    {isLoading ? <Spinner size="xs" /> : <AddIcon boxSize={3} />}
                </Flex>
                <Text fontSize="xs" fontWeight="600" color={textColor} noOfLines={1}>
                    {isLoading ? `Creando ${tipo}...` : `Crear ${tipo}`}
                </Text>
            </HStack>
        </Box>
    );
};

const MapaPedidos: React.FC<MapaPedidosProps> = ({ cotizacion, onCrearPedidoTango, onCrearPedidoDeposito, onVerDetallePedido }) => {
    const [versiones, setVersiones] = useState<VersionCotizacion[]>([]);
    const [vendedoresMap, setVendedoresMap] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [detallesCache, setDetallesCache] = useState<Record<string, any>>({}); // Cache para Nro Largo y Estado real
    const [depositosData, setDepositosData] = useState<Record<string, any>>({}); // Info de depósitos (CC/CDU)
    const [relacionesData, setRelacionesData] = useState<Record<string, any>>({}); // Facturas/Remitos por pedido ID

    // Estados para drag & scroll
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startY, setStartY] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const scrollContainerRef = React.useRef(null);

    // Loading states for creation
    const [loadingTango, setLoadingTango] = useState(false);
    const [loadingDeposito, setLoadingDeposito] = useState(false);

    const handleCrearTango = async (version) => {
        if (onCrearPedidoTango) {
            // Confirmación antes de proceder
            const confirmar = window.confirm("¿Estás seguro de que deseas generar el pedido en TANGO para esta versión?");
            if (!confirmar) return;

            setLoadingTango(true);
            try {
                await onCrearPedidoTango(version);
                // Refrescar datos
                await loadData();
                await loadDepositosInfo();
            } finally {
                setLoadingTango(false);
            }
        }
    };

    const handleCrearDeposito = async (version) => {
        if (onCrearPedidoDeposito) {
            setLoadingDeposito(true);
            try {
                await onCrearPedidoDeposito(version);
                // Refrescar datos
                await loadData();
                await loadDepositosInfo();
            } finally {
                setLoadingDeposito(false);
            }
        }
    };

    // Estado para el modal de detalles
    const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
    const [detallesPedido, setDetallesPedido] = useState(null);
    const [isLoadingDetalles, setIsLoadingDetalles] = useState(false);
    const { isOpen: isDetallesOpen, onOpen: onDetallesOpen, onClose: onDetallesClose } = useDisclosure();

    // Colores
    const containerBg = useColorModeValue("gray.50", "gray.900");
    const cardBg = useColorModeValue("white", "gray.800");
    const lineColor = useColorModeValue("gray.300", "gray.600");
    const emptyNodeBg = useColorModeValue("gray.100", "gray.700");
    const labelColor = useColorModeValue("gray.600", "gray.400");
    const borderColor = useColorModeValue('gray.200', 'gray.600');

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [versionesRes, pedidosRes, vendedoresData] = await Promise.all([
                cotizadorService.obtenerVersiones(cotizacion.id),
                cotizadorService.obtenerHistorialPedidos(cotizacion.id),
                getVendedores()
            ]);

            const pedidosData = pedidosRes || [];
            const versionesData = versionesRes || [];

            const pedidos = Array.isArray(pedidosData) ? pedidosData : [];
            let versionesList = Array.isArray(versionesData) ? versionesData : [];

            if (versionesList.length === 0) {
                versionesList = [{
                    id: 0,
                    cotizacionId: cotizacion.id || 0,
                    numeroVersion: cotizacion.version || 1,
                    fechaCreacion: cotizacion.fecha,
                    creadoPor: 0,
                    creadoPorNombre: '',
                    razonCambio: 'Versión inicial',
                    esVersionActual: true,
                    datosSnapshot: cotizacion
                }];
            }

            if (Array.isArray(vendedoresData)) {
                const map = {};
                vendedoresData.forEach(v => { map[v.codigo] = v.nombre; });
                setVendedoresMap(map);
            }

            const arbolConstruido = versionesList
                .sort((a, b) => b.numeroVersion - a.numeroVersion)
                .map((version, index) => {
                    const pedidosDeVersion = pedidos.filter(p => {
                        if (String(p.version) === String(version.numeroVersion)) return true;
                        if (index === 0 && (p.version === null || p.version === undefined)) return true;
                        return false;
                    });

                    const pedidosTango = pedidosDeVersion.filter(p => p.NRO_PEDIDO_TANGO);
                    const pedidosDeposito = pedidosDeVersion.filter(p => !p.NRO_PEDIDO_TANGO);

                    return { ...version, pedidosTango, pedidosDeposito };
                });

            setVersiones(arbolConstruido);

            // Cargar detalles extra en background
            pedidos.forEach(async (p) => {
                if (p.NRO_PEDIDO_TANGO) {
                    try {
                        const res = await cotizadorService.obtenerDetallesPedidoTango(p.NRO_PEDIDO_TANGO);
                        if (res.success && res.data) {
                            setDetallesCache(prev => ({
                                ...prev,
                                [p.NRO_PEDIDO_TANGO]: res.data
                            }));
                        }
                    } catch (e) {
                        console.warn("Error fetching details background:", e);
                    }
                }
            });

            // Cargar relaciones de facturas/remitos para todos los pedidos
            if (pedidos.length > 0) {
                await loadRelacionesComprobantes(pedidos);
            }

        } catch (error) {
            console.error("Error cargando mapa:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadDepositosInfo = async () => {
        const nroCot = cotizacion.N_COTIZ || cotizacion.nroCotizacion || cotizacion.numero; // Intentar obtener nro cotizacion

        if (!nroCot) return;

        try {
            const data = await cotizadorService.obtenerDetallesDepositosCotizacion(nroCot);
            if (data && Array.isArray(data)) {
                // Agrupar por idPed
                const grouped = {};
                data.forEach(item => {
                    if (!grouped[item.idPed]) grouped[item.idPed] = [];
                    // Evitar duplicados si hay múltiples items para el mismo pedido/depósito (agrupar artículos?)
                    // Aquí asumimos que queremos ver resumen. SI son muchos artículos, mejor mostrar "CC: 5 items" o sumarizados.
                    // Por ahora, guardamos todo y en render hacemos un resumen simple.
                    grouped[item.idPed].push(item);
                });

                // Resumir para el badge (ej: CC: 10/10)
                const resumen = {};
                Object.keys(grouped).forEach(idPed => {
                    const items = grouped[idPed];
                    const byDep = {};
                    items.forEach(i => {
                        if (!byDep[i.desDep]) byDep[i.desDep] = { ped: 0, prep: 0, desDep: i.desDep };
                        byDep[i.desDep].ped += i.cantPed;
                        byDep[i.desDep].prep += i.cantPrep;
                    });
                    resumen[idPed] = Object.values(byDep);
                });

                setDepositosData(resumen);
            }
        } catch (e) {
            console.error("Error loading deposit info:", e);
        }
    };

    const loadRelacionesComprobantes = async (pedidosList) => {
        try {
            // Extraer IDs de pedidos de Tango (ID_TANGO o el ID que se muestra en la UI)
            const pedidosTango = pedidosList.filter(p => p.NRO_PEDIDO_TANGO);

            if (pedidosTango.length === 0) {

                return;
            }

            // El ID que se muestra en la UI: pedido.NRO_PEDIDO_TANGO || Math.abs(pedido.ID)
            // Este ID debe corresponder al ID_GVA21 en Tango
            // Crear mapa para poder indexar las relaciones por NRO_PEDIDO_TANGO
            const idToNroPedidoMap = {};
            const idsPedidos = [];

            pedidosTango.forEach(p => {
                // El ID correcto es el que se muestra en la UI
                const idTango = p.NRO_PEDIDO_TANGO || (p.ID < 0 ? Math.abs(p.ID) : p.ID);
                idsPedidos.push(idTango);
                idToNroPedidoMap[idTango] = p.NRO_PEDIDO_TANGO;
            });


            // Llamar al servicio con array de IDs de pedido
            const relaciones = await cotizadorService.obtenerRelacionesPedidosFacturasRemitos(idsPedidos);



            if (relaciones && Array.isArray(relaciones)) {
                // El backend devuelve datos agrupados con ID_GVA21, facturas y remitos arrays
                const relacionesMap = {};

                relaciones.forEach(rel => {
                    // Usar ID_GVA21 para encontrar el NRO_PEDIDO_TANGO correspondiente
                    const nroPedidoTango = idToNroPedidoMap[rel.ID_GVA21];

                    if (nroPedidoTango) {
                        relacionesMap[nroPedidoTango] = {
                            NRO_PEDIDO: rel.NRO_PEDIDO,
                            ID_GVA21: rel.ID_GVA21,
                            COND_VTA: rel.facturas && rel.facturas.length > 0 ? rel.facturas[0].COND_VTA_FAC : null,
                            facturas: rel.facturas || [],
                            remitos: rel.remitos || []
                        };
                    }
                });


                setRelacionesData(relacionesMap);
            }
        } catch (error) {
            console.error('❌ Error al obtener relaciones de comprobantes:', error);
        }
    };

    useEffect(() => {
        if (cotizacion?.id) {
            loadData();
            loadDepositosInfo(); // Cargar info depósitos en paralelo/background
        }
    }, [cotizacion]);

    // Función para ver detalles de un pedido
    const handleVerDetalles = async (pedido) => {

        setPedidoSeleccionado(pedido);
        setDetallesPedido(null);
        onDetallesOpen();

        if (pedido.NRO_PEDIDO_TANGO) {
            setIsLoadingDetalles(true);
            try {
                const response = await cotizadorService.obtenerDetallesPedidoTango(pedido.NRO_PEDIDO_TANGO);
                if (response.success) {
                    setDetallesPedido(response.data);
                }
            } catch (error) {
                console.error("Error cargando detalles:", error);
            } finally {
                setIsLoadingDetalles(false);
            }
        } else if (pedido.ES_DEPOSITO || (pedido.DEPOSITO_ORIGEN && pedido.PEDIDO_ID)) {
            // Es un pedido de depósito
            setIsLoadingDetalles(true);
            try {
                // pedido.PEDIDO_ID es positivo en la base local, pero en el mapa (Pedido_C.ts) se devuelve mapeado?
                // En Pedido_C.ts:
                // ID: p.idPed * -1
                // PEDIDO_ID: p.idPed
                // DEPOSITO_ORIGEN: p.desDep

                const response = await cotizadorService.obtenerDetallesPedidoDeposito(pedido.PEDIDO_ID, pedido.DEPOSITO_ORIGEN);

                if (response.success && Array.isArray(response.data)) {
                    // Mapear respuesta del depósito al formato esperado por el modal (GestorPedido_R.get_detalleArticulos devuelve un array de items)
                    const items = response.data;

                    // Construir objeto detalles unificado
                    const detallesUnificados = {
                        nroPedido: pedido.NRO_COTIZACION ? `${pedido.DEPOSITO_ORIGEN}-${pedido.PEDIDO_ID}` : `#${pedido.PEDIDO_ID}`,
                        fechaPedido: pedido.FECHA_CREACION_PEDIDO,
                        nombreCliente: pedido.NOMBRE_CLIENTE,
                        clienteOcasional: {
                            razonSocial: pedido.NOMBRE_CLIENTE || '-',
                            cuit: pedido.COD_CLIENTE, // Podría no ser CUIT si es cod interno, pero sirve para mostrar algo
                            domicilio: items[0]?.dirEnt || '', // Si viene en la query
                            telefono: '',
                            email: ''
                        },
                        renglones: items.map(item => ({
                            descripcion: item.descripcio,
                            descripcionAdicional: item.descAdic,
                            codArticulo: item.codArticu,
                            cantidad: item.cantPed,
                            cantidadPreparada: item.cantPrep,
                            deposito: item.desDep,
                            idPedido: item.idPed
                        })),
                        total: 0,
                        notas: [],
                        observaciones: items[0]?.obsPed || pedido.OBSERVACIONES || '',
                        esDeposito: true // Flag para renderizado
                    };

                    setDetallesPedido(detallesUnificados);
                } else {
                    console.warn("No data for deposit details", response);
                }
            } catch (error) {
                console.error("Error cargando detalles depósito:", error);
            } finally {
                setIsLoadingDetalles(false);
            }
        }
    };

    const formatearMoneda = (valor) => {
        if (!valor && valor !== 0) return '$0.00';
        return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(valor);
    };

    const formatearFecha = (fecha) => {
        if (!fecha) return '-';

        let date = new Date(fecha);

        // Soporte para formato DD/MM/YYYY
        if (typeof fecha === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(fecha)) {
            const parts = fecha.split('/'); // [DD, MM, YYYY]
            // Nota: Si viene con hora, date-fns u otra lib es mejor, pero aquí hacemos algo simple
            // Cortamos por si viene algo más
            const [dia, mes, anio] = fecha.substr(0, 10).split('/');
            date = new Date(Number(anio), Number(mes) - 1, Number(dia));
        }

        if (isNaN(date.getTime())) return fecha; // Si falla, devolver string original por si acaso

        return date.toLocaleDateString('es-AR', { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    // Handlers para drag & scroll
    const handleMouseDown = (e) => {
        if (!scrollContainerRef.current) return;
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setStartY(e.pageY - scrollContainerRef.current.offsetTop);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
        setScrollTop(scrollContainerRef.current.scrollTop);
    };

    const handleMouseMove = (e) => {
        if (!isDragging || !scrollContainerRef.current) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const y = e.pageY - scrollContainerRef.current.offsetTop;
        const walkX = (x - startX) * 1.5; // Multiplicador para velocidad de scroll
        const walkY = (y - startY) * 1.5;
        scrollContainerRef.current.scrollLeft = scrollLeft - walkX;
        scrollContainerRef.current.scrollTop = scrollTop - walkY;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    if (isLoading) {
        return (
            <Flex justify="center" align="center" h="400px" direction="column" gap={4}>
                <Spinner size="xl" thickness="4px" color="blue.500" />
                <Text color="gray.500">Cargando mapa de relaciones...</Text>
            </Flex>
        );
    }

    return (
        <>
            <Box
                ref={scrollContainerRef}
                p={2}
                bg={containerBg}
                borderRadius="xl"
                overflowX="auto"
                overflowY="auto"
                cursor={isDragging ? "grabbing" : "grab"}
                userSelect="none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
            >
                <Flex align="flex-start" justify="flex-start" minW="max-content" pb={2} pt={4}>

                    {/* NODO RAÍZ: Cotización */}
                    <Flex align="center">
                        <Box
                            p={3}
                            bg={cardBg}
                            borderLeft="4px solid"
                            borderLeftColor="teal.400"
                            borderRadius="lg"
                            boxShadow="lg"
                            w="200px"
                            h={`${NODE_HEIGHT}px`}
                            display="flex"
                            flexDirection="column"
                            justifyContent="center"
                            position="relative"
                        >
                            <HStack spacing={2}>
                                <Flex w={8} h={8} align="center" justify="center" borderRadius="full" bg="teal.100" color="teal.600" flexShrink={0}>
                                    <InfoIcon boxSize={4} />
                                </Flex>
                                <Box flex={1} overflow="hidden">
                                    <Text fontWeight="bold" fontSize="sm" noOfLines={1}>Cot. #{cotizacion.numero}</Text>
                                    <Text fontSize="xs" color="gray.500" noOfLines={1}>{cotizacion.cliente?.razonSocial || 'Cliente Desconocido'}</Text>
                                </Box>
                            </HStack>
                            <Box position="absolute" right="-6px" top="50%" transform="translateY(-50%)" w={3} h={3} bg="teal.400" borderRadius="full" border="2px solid" borderColor={cardBg} />
                        </Box>
                        <Box w="25px" h={`${LINE_THICKNESS}px`} bg={lineColor} />
                    </Flex>

                    {/* COLUMNA DE VERSIONES */}
                    <Flex direction="column" position="relative" mt={0}>
                        {/* Línea vertical que conecta todas las versiones */}
                        {versiones.length > 1 && (
                            <Box position="absolute" left="0" top={`${NODE_HEIGHT / 2}px`} bottom={`${NODE_HEIGHT / 2 + 4}px`} w={`${LINE_THICKNESS}px`} bg={lineColor} />
                        )}

                        {versiones.map((version, versionIdx) => (
                            <Flex key={version.id || `ver-${version.numeroVersion}`} align="flex-start" mt={versionIdx === 0 ? 0 : 1} mb={1}>
                                <Box w="15px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2}px`} />

                                <Box
                                    p={2}
                                    px={3}
                                    bg={cardBg}
                                    borderLeft="4px solid"
                                    borderLeftColor="blue.400"
                                    borderRadius="lg"
                                    boxShadow="md"
                                    w="150px"
                                    h={`${NODE_HEIGHT}px`}
                                    display="flex"
                                    flexDirection="column"
                                    justifyContent="center"
                                    position="relative"
                                >
                                    <HStack spacing={2}>
                                        <Flex w={6} h={6} align="center" justify="center" borderRadius="full" bg="blue.100" color="blue.600" flexShrink={0}>
                                            <TimeIcon boxSize={3} />
                                        </Flex>
                                        <Box flex={1} overflow="hidden">
                                            <Text fontWeight="bold" fontSize="xs">Versión {version.numeroVersion}</Text>
                                            <Text fontSize="2xs" color="gray.500" noOfLines={1}>{version.razonCambio || "Inicial"}</Text>
                                        </Box>
                                    </HStack>
                                    <Box position="absolute" right="-6px" top="50%" transform="translateY(-50%)" w={3} h={3} bg="blue.400" borderRadius="full" border="2px solid" borderColor={cardBg} />
                                </Box>

                                <Box w="20px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2}px`} />
                                {/* CATEGORÍAS */}
                                <Flex direction="column" position="relative">
                                    <Box position="absolute" left="0" top={`${NODE_HEIGHT / 2}px`} bottom={`${NODE_HEIGHT / 2}px`} w={`${LINE_THICKNESS}px`} bg={lineColor} />

                                    <Flex align="flex-start" mb={1}>
                                        <Box w="12px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2}px`} />
                                        <Box
                                            p={2}
                                            px={3}
                                            bg={cardBg}
                                            borderLeft="3px solid"
                                            borderLeftColor="orange.400"
                                            borderRadius="md"
                                            boxShadow="sm"
                                            w="130px"
                                            h={`${NODE_HEIGHT}px`}
                                            display="flex"
                                            flexDirection="column"
                                            justifyContent="center"
                                            position="relative"
                                        >
                                            <HStack spacing={2}>
                                                <Flex w={5} h={5} align="center" justify="center" borderRadius="full" bg="orange.100" color="orange.600" flexShrink={0}>
                                                    <FaTruck size={10} />
                                                </Flex>
                                                <Text fontWeight="600" fontSize="xs" color="orange.600">Tango</Text>
                                                <Badge colorScheme="orange" fontSize="2xs">{version.pedidosTango.length}</Badge>
                                            </HStack>
                                            {version.pedidosTango.length > 0 && (
                                                <Box position="absolute" right="-6px" top="50%" transform="translateY(-50%)" w={3} h={3} bg="orange.400" borderRadius="full" border="2px solid" borderColor={cardBg} />
                                            )}
                                        </Box>
                                        <Box w="15px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2}px`} />
                                        <PedidosList
                                            pedidos={version.pedidosTango}
                                            color="orange"
                                            lineColor={lineColor}
                                            cardBg={cardBg}
                                            vendedoresMap={vendedoresMap}
                                            onVerDetalle={handleVerDetalles}
                                            detallesCache={detallesCache}
                                            depositosData={depositosData}
                                            relacionesData={relacionesData}
                                        >
                                            {version.numeroVersion == cotizacion.version && (
                                                <EmptyNode
                                                    tipo="Tango"
                                                    color="orange"
                                                    emptyNodeBg={emptyNodeBg}
                                                    onCreate={() => handleCrearTango(version)}
                                                    isLoading={loadingTango}
                                                />
                                            )}
                                        </PedidosList>
                                    </Flex>

                                    {/* NODO DEPÓSITO */}
                                    <Flex align="flex-start" mt={1}>
                                        <Box w="12px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2}px`} />
                                        <Box
                                            p={2}
                                            px={3}
                                            bg={cardBg}
                                            borderLeft="3px solid"
                                            borderLeftColor="purple.400"
                                            borderRadius="md"
                                            boxShadow="sm"
                                            w="130px"
                                            h={`${NODE_HEIGHT}px`}
                                            display="flex"
                                            flexDirection="column"
                                            justifyContent="center"
                                            position="relative"
                                        >
                                            <HStack spacing={2}>
                                                <Flex w={5} h={5} align="center" justify="center" borderRadius="full" bg="purple.100" color="purple.600" flexShrink={0}>
                                                    <SlSocialDropbox size={10} />
                                                </Flex>
                                                <Text fontWeight="600" fontSize="xs" color="purple.600">Depósito</Text>
                                                <Badge colorScheme="purple" fontSize="2xs">{version.pedidosDeposito.length}</Badge>
                                            </HStack>
                                            {version.pedidosDeposito.length > 0 && (
                                                <Box position="absolute" right="-6px" top="50%" transform="translateY(-50%)" w={3} h={3} bg="purple.400" borderRadius="full" border="2px solid" borderColor={cardBg} />
                                            )}
                                        </Box>
                                        <Box w="15px" h={`${LINE_THICKNESS}px`} bg={lineColor} mt={`${NODE_HEIGHT / 2}px`} />
                                        <PedidosList
                                            pedidos={version.pedidosDeposito}
                                            color="purple"
                                            lineColor={lineColor}
                                            cardBg={cardBg}
                                            vendedoresMap={vendedoresMap}
                                            onVerDetalle={handleVerDetalles}
                                            detallesCache={detallesCache}
                                            depositosData={depositosData}
                                            relacionesData={relacionesData}
                                        >
                                            {version.numeroVersion == cotizacion.version && (
                                                <EmptyNode
                                                    tipo="Depósito"
                                                    color="purple"
                                                    emptyNodeBg={emptyNodeBg}
                                                    onCreate={() => handleCrearDeposito(version)}
                                                    isLoading={loadingDeposito}
                                                />
                                            )}
                                        </PedidosList>
                                    </Flex>
                                </Flex>
                            </Flex>
                        ))}
                    </Flex>
                </Flex>

                {/* Leyenda */}
                <HStack mt={3} spacing={4} justify="center" pt={2} borderTop="1px solid" borderColor={lineColor} flexWrap="wrap">
                    <HStack><Box w={3} h={3} bg="teal.400" borderRadius="full" /><Text fontSize="xs" color="gray.500">Cotización</Text></HStack>
                    <HStack><Box w={3} h={3} bg="blue.400" borderRadius="full" /><Text fontSize="xs" color="gray.500">Versión</Text></HStack>
                    <HStack><Box w={3} h={3} bg="orange.400" borderRadius="full" /><Text fontSize="xs" color="gray.500">Tango</Text></HStack>
                    <HStack><Box w={3} h={3} bg="purple.400" borderRadius="full" /><Text fontSize="xs" color="gray.500">Depósito</Text></HStack>
                    <HStack><Box w={3} h={3} bg="green.400" borderRadius="full" /><Text fontSize="xs" color="gray.500">Factura</Text></HStack>
                    <HStack><Box w={3} h={3} bg="cyan.400" borderRadius="full" /><Text fontSize="xs" color="gray.500">Remito</Text></HStack>
                </HStack>
            </Box>

            {/* Portal envuelve al Modal para sacarlo del DOM del padre */}
            <Portal>
                <Modal
                    isOpen={isDetallesOpen}
                    onClose={onDetallesClose}
                    size="6xl"
                    scrollBehavior="outside"
                    blockScrollOnMount={false}
                >
                    <ModalOverlay zIndex="1400" />
                    <ModalContent containerProps={{ zIndex: "1400" }}>
                        <ModalHeader>
                            <HStack>
                                {/* <CheckCircleIcon color={pedidoSeleccionado?.NRO_PEDIDO_TANGO ? "orange.500" : "purple.500"} /> */}
                                <Text>Detalles del Pedido {pedidoSeleccionado?.NRO_PEDIDO_TANGO || `#${pedidoSeleccionado?.ID}`}</Text>
                                {pedidoSeleccionado?.NRO_PEDIDO_TANGO && (
                                    <Button
                                        leftIcon={<ExternalLinkIcon />}
                                        size="xs"
                                        colorScheme="orange"
                                        variant="solid"
                                        ml={2}
                                        onClick={() => window.open(`http://servidor:17000/company/165/voucher/19845/edit/${pedidoSeleccionado.NRO_PEDIDO_TANGO}`, '_blank')}
                                    >
                                        Abrir en Tango
                                    </Button>
                                )}
                            </HStack>
                        </ModalHeader>
                        <ModalCloseButton />
                        <ModalBody pb={6}>
                            {isLoadingDetalles ? (
                                <Flex justify="center" align="center" minH="200px">
                                    <Spinner size="lg" color="blue.500" />
                                </Flex>
                            ) : detallesPedido ? (
                                <VStack align="stretch" spacing={4}>

                                    {/* Información General */}
                                    <Box
                                        p={4}
                                        bg={containerBg}
                                        borderRadius="md"
                                        borderLeft="4px"
                                        borderColor="blue.500"
                                    >
                                        <HStack mb={3}>
                                            <Text fontSize="md">ℹ️</Text>
                                            {/* <Icon as={InfoIcon} color="blue.500" /> */}
                                            <Text fontSize="md" fontWeight="600">
                                                Información General
                                            </Text>
                                        </HStack>
                                        <Grid templateColumns="repeat(3, 1fr)" gap={4}>
                                            <GridItem>
                                                <Text fontSize="xs" color={labelColor}>Nro. Pedido</Text>
                                                <Text fontWeight="500">{detallesPedido.nroPedido || pedidoSeleccionado?.NRO_PEDIDO_TANGO}</Text>
                                            </GridItem>
                                            <GridItem>
                                                <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                    Fecha Pedido
                                                </Text>
                                                <Text fontSize="sm" fontWeight="600">
                                                    {formatearFecha(detallesPedido.fechaPedido || detallesPedido.fechaIngreso || pedidoSeleccionado?.FECHA_CREACION)}
                                                </Text>
                                            </GridItem>
                                            {detallesPedido.fechaEntrega && (
                                                <GridItem>
                                                    <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                        Fecha Entrega
                                                    </Text>
                                                    <Text fontSize="sm" fontWeight="600">
                                                        {formatearFecha(detallesPedido.fechaEntrega)}
                                                    </Text>
                                                </GridItem>
                                            )}
                                            <GridItem>
                                                <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                    Cliente
                                                </Text>
                                                <Text fontSize="sm" fontWeight="600">
                                                    {detallesPedido.nombreCliente || cotizacion.cliente}
                                                </Text>
                                            </GridItem>
                                            {detallesPedido.codigoCliente && (
                                                <GridItem>
                                                    <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                        Código Cliente
                                                    </Text>
                                                    <Text fontSize="sm" fontWeight="600">
                                                        {detallesPedido.codigoCliente}
                                                    </Text>
                                                </GridItem>
                                            )}
                                        </Grid>
                                    </Box>

                                    {/* Cliente Ocasional */}
                                    {detallesPedido.clienteOcasional && (
                                        <Box
                                            p={4}
                                            bg={containerBg}
                                            borderRadius="md"
                                            borderLeft="4px"
                                            borderColor="blue.500"
                                        >
                                            <Text fontSize="md" fontWeight="600" mb={3}>
                                                Cliente Ocasional
                                            </Text>
                                            <Grid templateColumns="repeat(2, 1fr)" gap={3}>
                                                {detallesPedido.clienteOcasional.razonSocial && (
                                                    <GridItem>
                                                        <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                            Razón Social
                                                        </Text>
                                                        <Text fontSize="sm">{detallesPedido.clienteOcasional.razonSocial}</Text>
                                                    </GridItem>
                                                )}
                                                {detallesPedido.clienteOcasional.cuit && (
                                                    <GridItem>
                                                        <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                            CUIT
                                                        </Text>
                                                        <Text fontSize="sm">{detallesPedido.clienteOcasional.cuit}</Text>
                                                    </GridItem>
                                                )}
                                                {detallesPedido.clienteOcasional.domicilio && (
                                                    <GridItem colSpan={2}>
                                                        <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                            Domicilio
                                                        </Text>
                                                        <Text fontSize="sm">{detallesPedido.clienteOcasional.domicilio}</Text>
                                                    </GridItem>
                                                )}
                                                {detallesPedido.clienteOcasional.localidad && (
                                                    <GridItem>
                                                        <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                            Localidad
                                                        </Text>
                                                        <Text fontSize="sm">
                                                            {detallesPedido.clienteOcasional.localidad}
                                                            {detallesPedido.clienteOcasional.codigoPostal &&
                                                                ` (${detallesPedido.clienteOcasional.codigoPostal})`}
                                                        </Text>
                                                    </GridItem>
                                                )}
                                                {detallesPedido.clienteOcasional.telefono && (
                                                    <GridItem>
                                                        <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                            Teléfono
                                                        </Text>
                                                        <Text fontSize="sm">{detallesPedido.clienteOcasional.telefono}</Text>
                                                    </GridItem>
                                                )}
                                                {detallesPedido.clienteOcasional.email && (
                                                    <GridItem>
                                                        <Text fontSize="xs" color={labelColor} fontWeight="500" mb={1}>
                                                            Email
                                                        </Text>
                                                        <Text fontSize="sm">{detallesPedido.clienteOcasional.email}</Text>
                                                    </GridItem>
                                                )}
                                            </Grid>

                                            {/* Percepciones del Cliente */}
                                            {detallesPedido.clienteOcasional.percepciones &&
                                                detallesPedido.clienteOcasional.percepciones.length > 0 && (
                                                    <Box mt={4} pt={3} borderTop="1px" borderColor={borderColor}>
                                                        <HStack mb={2}>
                                                            <Badge colorScheme="blue" fontSize="xs">
                                                                {detallesPedido.clienteOcasional.percepciones.length}
                                                            </Badge>
                                                            <Text fontSize="sm" fontWeight="600">
                                                                Percepciones Aplicadas
                                                            </Text>
                                                        </HStack>
                                                        <VStack spacing={2} align="stretch">
                                                            {detallesPedido.clienteOcasional.percepciones.map((percepcion, idx) => (
                                                                <HStack
                                                                    key={idx}
                                                                    p={2}
                                                                    bg={cardBg}
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
                                    {detallesPedido.renglones && detallesPedido.renglones.length > 0 && (
                                        <Box
                                            p={4}
                                            bg={containerBg}
                                            borderRadius="md"
                                            borderLeft="4px"
                                            borderColor="green.500"
                                        >
                                            <HStack mb={3}>
                                                <Badge colorScheme="green" fontSize="sm">
                                                    {detallesPedido.renglones.length}
                                                </Badge>
                                                <Text fontWeight="bold">Items del Pedido</Text>
                                            </HStack>
                                            <Box overflowX="auto" border="1px solid" borderColor={lineColor} borderRadius="md" bg={cardBg}>
                                                <Table size="sm">
                                                    <Thead bg={useColorModeValue('gray.100', 'gray.800')}>
                                                        <Tr>
                                                            <Th>Código</Th>
                                                            <Th>Descripción</Th>
                                                            {detallesPedido.esDeposito && <Th>Desc. Adic</Th>}
                                                            <Th isNumeric>Cant. {detallesPedido.esDeposito ? 'Pedida' : ''}</Th>
                                                            {detallesPedido.esDeposito && <Th isNumeric>Cant. Prep</Th>}
                                                            {detallesPedido.esDeposito && <Th>Depósito</Th>}
                                                            {detallesPedido.esDeposito && <Th>Pedido</Th>}

                                                            {!detallesPedido.esDeposito && <Th isNumeric>Precio Unit.</Th>}
                                                            {!detallesPedido.esDeposito && <Th isNumeric>Bonif.</Th>}
                                                            {!detallesPedido.esDeposito && <Th isNumeric>Importe</Th>}
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {detallesPedido.renglones.map((renglon, idx) => (
                                                            <Tr key={idx}>
                                                                <Td fontSize="xs" color="gray.500">{renglon.codArticulo}</Td>
                                                                <Td maxW="300px">
                                                                    <Text fontSize="sm" fontWeight="500">
                                                                        {renglon.descripcion || 'Sin descripción'}
                                                                    </Text>
                                                                    {!detallesPedido.esDeposito && renglon.descripcionAdicional && (
                                                                        <Text fontSize="xs" color={labelColor}>
                                                                            {renglon.descripcionAdicional}
                                                                        </Text>
                                                                    )}
                                                                </Td>

                                                                {detallesPedido.esDeposito && (
                                                                    <Td fontSize="xs">{renglon.descripcionAdicional}</Td>
                                                                )}

                                                                <Td isNumeric fontWeight="500">{renglon.cantidad}</Td>

                                                                {detallesPedido.esDeposito && (
                                                                    <Td isNumeric fontWeight="500">{renglon.cantidadPreparada}</Td>
                                                                )}
                                                                {detallesPedido.esDeposito && (
                                                                    <Td>
                                                                        <Badge colorScheme="purple" variant="outline">{renglon.deposito}</Badge>
                                                                    </Td>
                                                                )}
                                                                {detallesPedido.esDeposito && (
                                                                    <Td fontSize="xs">{renglon.idPedido}</Td>
                                                                )}

                                                                {!detallesPedido.esDeposito && (
                                                                    <>
                                                                        <Td isNumeric>{formatearMoneda(renglon.precioUnitario || renglon.precio)}</Td>
                                                                        <Td isNumeric>
                                                                            {renglon.bonificacion > 0 && (
                                                                                <Badge colorScheme="orange" fontSize="xs">
                                                                                    {renglon.bonificacion}%
                                                                                </Badge>
                                                                            )}
                                                                            {!renglon.bonificacion && '-'}
                                                                        </Td>
                                                                        <Td isNumeric fontWeight="500">{formatearMoneda(renglon.importe)}</Td>
                                                                    </>
                                                                )}
                                                            </Tr>
                                                        ))}
                                                    </Tbody>
                                                </Table>
                                            </Box>

                                            {/* Total */}
                                            {!detallesPedido.esDeposito && (
                                                <>
                                                    <Divider my={3} />
                                                    <HStack justify="space-between" p={2}>
                                                        <Text fontSize="lg" fontWeight="700">
                                                            Total del Pedido:
                                                        </Text>
                                                        <Text fontSize="xl" fontWeight="700" color="green.600">
                                                            {formatearMoneda(detallesPedido.total)}
                                                        </Text>
                                                    </HStack>
                                                </>
                                            )}
                                        </Box>
                                    )}
                                    {/* StepCRM Integration */}



                                    {/* Notas del Pedido */}
                                    {detallesPedido.notas && detallesPedido.notas.length > 0 && (
                                        <Box
                                            p={4}
                                            bg={containerBg}
                                            borderRadius="md"
                                            borderLeft="4px"
                                            borderColor="orange.500"
                                        >
                                            <HStack mb={3}>
                                                <Badge colorScheme="orange" fontSize="sm">
                                                    {detallesPedido.notas.length}
                                                </Badge>
                                                <Text fontSize="md" fontWeight="600">
                                                    Historial de Notas
                                                </Text>
                                            </HStack>
                                            <VStack spacing={2} align="stretch">
                                                {detallesPedido.notas.map((nota, idx) => (
                                                    <HStack
                                                        key={nota.idNota || idx}
                                                        p={2}
                                                        bg={cardBg}
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
                                    {detallesPedido.observaciones && (
                                        <Box
                                            p={4}
                                            bg={containerBg}
                                            borderRadius="md"
                                            borderLeft="4px"
                                            borderColor="gray.400"
                                        >
                                            <Text fontSize="md" fontWeight="600" mb={2}>
                                                Observaciones
                                            </Text>
                                            <Text fontSize="sm" whiteSpace="pre-wrap">
                                                {detallesPedido.observaciones}
                                            </Text>
                                        </Box>
                                    )}

                                </VStack>
                            ) : (
                                <VStack spacing={3} py={8}>
                                    {/* <InfoIcon boxSize={10} color="gray.400" /> */}
                                    <Text color="gray.500">No se pudieron cargar los detalles del pedido</Text>
                                </VStack>
                            )}
                        </ModalBody>
                        <ModalFooter>
                            <Button onClick={onDetallesClose}>Cerrar</Button>
                        </ModalFooter>
                    </ModalContent>
                </Modal>
            </Portal >
        </>
    );
};

export default MapaPedidos;
