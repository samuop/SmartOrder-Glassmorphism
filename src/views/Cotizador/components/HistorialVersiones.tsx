import React, { useState, useEffect } from "react";
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
  Icon,
  useColorModeValue,
  useColorMode,
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Tooltip,
  Collapse,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Switch,
  useToast,
  useDisclosure,
} from "@chakra-ui/react";
import { TimeIcon, RepeatIcon, CheckIcon, ViewIcon, ChevronUpIcon, DownloadIcon } from "@chakra-ui/icons";
import { FaCodeBranch } from "react-icons/fa";
import cotizadorService from "../../../services/cotizadorService";
// CombinarVersionesModal ya no se importa aquí, se movió a CotizadorCore

const HistorialVersiones = ({ isOpen, onClose, cotizacionId, onRestaurar, modoEdicion = false, showIVA = true, applyDiscount = true, onOpenCombinar }) => {
  const [versiones, setVersiones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [versionSeleccionada, setVersionSeleccionada] = useState(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [vistasPrevia, setVistasPrevia] = useState(new Map()); // Map de VERSION -> datos de vista previa
  const [versionesExpandidas, setVersionesExpandidas] = useState(new Set()); // Set de VERSIONes expandidas
  const [actualizarPrecios, setActualizarPrecios] = useState(false); // Estado para actualización de precios


  const toast = useToast({ position: 'bottom' });

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Estilos glass para Modal
  const modalBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const modalBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

  const bgColor = isDark ? "transparent" : "white";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.16)" : "gray.200";
  const hoverBg = isDark ? "whiteAlpha.100" : "gray.50";
  const labelColor = isDark ? "gray.400" : "gray.600";
  const primaryColor = isDark ? "white" : "gray.800";
  const addedBg = isDark ? "green.900" : "green.50";
  const removedBg = isDark ? "red.900" : "red.50";
  const modifiedBg = isDark ? "yellow.900" : "yellow.50";

  useEffect(() => {
    if (isOpen && cotizacionId) {
      cargarVersiones();
    }
  }, [isOpen, cotizacionId]);

  const cargarVersiones = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await cotizadorService.obtenerVersiones(cotizacionId);

      if (response.success) {
        setVersiones(response.data || []);
      }
    } catch (err) {
      console.error('Error al cargar versiones:', err);
      setError('No se pudo cargar el historial de versiones');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVistaPrevia = async (version) => {
    const versionNum = version.VERSION;
    const nuevasExpandidas = new Set(versionesExpandidas);

    if (nuevasExpandidas.has(versionNum)) {
      // Cerrar esta vista previa
      nuevasExpandidas.delete(versionNum);
      setVersionesExpandidas(nuevasExpandidas);

      const nuevasVistas = new Map(vistasPrevia);
      nuevasVistas.delete(versionNum);
      setVistasPrevia(nuevasVistas);
    } else {
      // Abrir esta vista previa
      nuevasExpandidas.add(versionNum);
      setVersionesExpandidas(nuevasExpandidas);

      try {
        const response = await cotizadorService.obtenerCotizacion(cotizacionId);
        if (response.success) {
          const versionActual = response.data;

          // Determinar si es la versión actual
          const esVersionActual = version.VERSION === versionMasReciente?.VERSION;

          // Obtener artículos de la versión seleccionada
          let articulosVersion = [];
          if (esVersionActual) {
            articulosVersion = versionActual.articulos || [];
          } else {
            articulosVersion = version.articulos || [];
          }

          // 🔄 Buscar la versión ANTERIOR para comparar (no la actual)
          let versionAnterior = null;
          let articulosVersionAnterior = [];

          if (version.VERSION > 1) {
            // Buscar la versión inmediatamente anterior
            versionAnterior = versiones.find(v => v.VERSION === version.VERSION - 1);

            if (versionAnterior) {
              // Si la versión anterior es la actual, usar artículos del backend
              const esVersionAnteriorActual = versionAnterior.VERSION === versionMasReciente?.VERSION;
              if (esVersionAnteriorActual) {
                articulosVersionAnterior = versionActual.articulos || [];
              } else {
                articulosVersionAnterior = versionAnterior.articulos || [];
              }
            }
          }



          const nuevasVistas = new Map(vistasPrevia);
          nuevasVistas.set(versionNum, {
            version: version,
            articulos: articulosVersion,
            versionAnterior: versionAnterior,
            articulosVersionAnterior: articulosVersionAnterior
          });
          setVistasPrevia(nuevasVistas);
        }
      } catch (err) {
        console.error('Error al cargar vista previa:', err);
      }
    }
  };

  /**
   * Compara campos comerciales entre dos versiones
   * @param {Object} versionActual - Versión actual
   * @param {Object} versionAnterior - Versión anterior
   * @returns {Array} Array de cambios detectados
   */
  const compararCamposComerciales = (versionActual, versionAnterior) => {
    const cambios = [];

    // Campos a comparar con sus labels y formateadores
    const campos = [
      {
        key: 'FECHA_VIGENCIA',
        label: 'Fecha de Validez',
        formatear: (valor) => {
          if (!valor) return 'Sin fecha';
          const fecha = new Date(valor);
          return fecha.toLocaleDateString('es-AR');
        }
      },
      {
        key: 'COND_VTA',
        label: 'Condición de Venta',
        formatear: (valor) => valor || 'N/A'
      },
      {
        key: 'NRO_LISTA',
        label: 'Lista de Precios',
        formatear: (valor) => valor || 'N/A'
      },
      {
        key: 'TALONARIO',
        label: 'Talonario Pedido',
        formatear: (valor) => valor || 'N/A'
      },
      {
        key: 'TALONARIO_FACTURA',
        label: 'Talonario Factura',
        formatear: (valor) => valor || 'N/A'
      },
      {
        key: 'ORIGEN_VENTA',
        label: 'Origen de Venta',
        formatear: (valor) => valor || 'N/A'
      },
      {
        key: 'BONIFICACION_GENERAL',
        label: 'Bonificación General',
        formatear: (valor) => `${parseFloat(valor || 0).toFixed(2)}%`
      }
    ];

    // Comparar cada campo
    campos.forEach(campo => {
      const valorActual = versionActual?.[campo.key];
      const valorAnterior = versionAnterior?.[campo.key];

      // Para campos numéricos (bonificación), comparar con tolerancia
      if (campo.key === 'BONIFICACION_GENERAL') {
        const numActual = parseFloat(valorActual || 0);
        const numAnterior = parseFloat(valorAnterior || 0);

        if (Math.abs(numActual - numAnterior) > 0.001) {
          cambios.push({
            campo: campo.key,
            label: campo.label,
            valorAnterior: campo.formatear(valorAnterior),
            valorActual: campo.formatear(valorActual),
            valorAnteriorRaw: numAnterior,
            valorActualRaw: numActual
          });
        }
      }
      // Para fechas, comparar como strings
      else if (campo.key === 'FECHA_VIGENCIA') {
        const fechaActual = valorActual ? new Date(valorActual).toISOString().split('T')[0] : null;
        const fechaAnterior = valorAnterior ? new Date(valorAnterior).toISOString().split('T')[0] : null;

        if (fechaActual !== fechaAnterior) {
          cambios.push({
            campo: campo.key,
            label: campo.label,
            valorAnterior: campo.formatear(valorAnterior),
            valorActual: campo.formatear(valorActual),
            valorAnteriorRaw: valorAnterior,
            valorActualRaw: valorActual
          });
        }
      }
      // Para campos de texto/número, comparar directo
      else {
        const strActual = String(valorActual || '').trim();
        const strAnterior = String(valorAnterior || '').trim();

        if (strActual !== strAnterior) {
          cambios.push({
            campo: campo.key,
            label: campo.label,
            valorAnterior: campo.formatear(valorAnterior),
            valorActual: campo.formatear(valorActual),
            valorAnteriorRaw: valorAnterior,
            valorActualRaw: valorActual
          });
        }
      }
    });

    return cambios;
  };

  const compararArticulos = (articulosVersionActual, articulosVersionAnterior) => {
    const cambios = [];
    const getOrden = (art, idx) => art.ORDEN ?? (idx + 1);

    // Crear arrays por COD_ARTICULO para manejar duplicados
    // Cada código puede tener múltiples instancias con diferentes ORDEN
    const mapActualPorCodigo = new Map(); // COD_ARTICULO -> [{ art, orden, usado }]
    articulosVersionActual.forEach((art, idx) => {
      const orden = getOrden(art, idx);
      const codigo = art.COD_ARTICULO;
      if (!mapActualPorCodigo.has(codigo)) {
        mapActualPorCodigo.set(codigo, []);
      }
      mapActualPorCodigo.get(codigo).push({ art: { ...art, _orden: orden }, orden, usado: false });
    });

    const mapAnteriorPorCodigo = new Map();
    articulosVersionAnterior.forEach((art, idx) => {
      const orden = getOrden(art, idx);
      const codigo = art.COD_ARTICULO;
      if (!mapAnteriorPorCodigo.has(codigo)) {
        mapAnteriorPorCodigo.set(codigo, []);
      }
      mapAnteriorPorCodigo.get(codigo).push({ art: { ...art, _orden: orden }, orden, usado: false });
    });

    // Función para encontrar la mejor coincidencia de un artículo anterior
    // Prioriza: 1) mismo ORDEN, 2) ORDEN más cercano no usado
    const encontrarMejorCoincidencia = (codigo, ordenActual, mapAnterior) => {
      const instancias = mapAnterior.get(codigo);
      if (!instancias) return null;

      // Buscar primero una con el mismo ORDEN que no esté usada
      let mejor = instancias.find(i => i.orden === ordenActual && !i.usado);

      // Si no hay, buscar la más cercana no usada
      if (!mejor) {
        const noUsadas = instancias.filter(i => !i.usado);
        if (noUsadas.length > 0) {
          mejor = noUsadas.reduce((closest, current) => {
            const diffCurrent = Math.abs(current.orden - ordenActual);
            const diffClosest = Math.abs(closest.orden - ordenActual);
            return diffCurrent < diffClosest ? current : closest;
          });
        }
      }

      if (mejor) {
        mejor.usado = true;
      }
      return mejor;
    };

    // Procesar artículos de la versión ACTUAL
    articulosVersionActual.forEach((artActual, idxActual) => {
      const ordenActual = getOrden(artActual, idxActual);
      const codigo = artActual.COD_ARTICULO;

      // Buscar la mejor coincidencia en la versión anterior
      const coincidencia = encontrarMejorCoincidencia(codigo, ordenActual, mapAnteriorPorCodigo);

      if (coincidencia) {
        const artAnterior = coincidencia.art;
        const ordenAnterior = coincidencia.orden;
        const cambioOrden = ordenActual !== ordenAnterior;

        // Verificar cambios en campos
        const cambiosCampos = [];

        if (artActual.CANTIDAD !== artAnterior.CANTIDAD) {
          cambiosCampos.push({
            campo: 'cantidad',
            anterior: artAnterior.CANTIDAD,
            nuevo: artActual.CANTIDAD
          });
        }

        if (parseFloat(artActual.PRECIO_UNITARIO_SIN_IMP || 0) !== parseFloat(artAnterior.PRECIO_UNITARIO_SIN_IMP || 0)) {
          cambiosCampos.push({
            campo: 'precio',
            anterior: artAnterior.PRECIO_UNITARIO_SIN_IMP,
            nuevo: artActual.PRECIO_UNITARIO_SIN_IMP
          });
        }

        if (parseFloat(artActual.BONIFICACION_PORCENTAJE || 0) !== parseFloat(artAnterior.BONIFICACION_PORCENTAJE || 0)) {
          cambiosCampos.push({
            campo: 'descuento',
            anterior: artAnterior.BONIFICACION_PORCENTAJE,
            nuevo: artActual.BONIFICACION_PORCENTAJE
          });
        }

        // Determinar estado
        if (cambioOrden && cambiosCampos.length > 0) {
          cambios.push({
            ...artActual,
            _orden: ordenActual,
            _ordenAnterior: ordenAnterior,
            estado: 'movido_modificado',
            cambiosCampos,
            valoresAnteriores: artAnterior
          });
        } else if (cambioOrden) {
          cambios.push({
            ...artActual,
            _orden: ordenActual,
            _ordenAnterior: ordenAnterior,
            estado: 'movido'
          });
        } else if (cambiosCampos.length > 0) {
          cambios.push({
            ...artActual,
            _orden: ordenActual,
            estado: 'modificado',
            cambiosCampos,
            valoresAnteriores: artAnterior
          });
        } else {
          cambios.push({ ...artActual, _orden: ordenActual, estado: 'sin_cambios' });
        }
      } else {
        // Artículo NUEVO (no existía en la versión anterior o todas las instancias ya se usaron)
        cambios.push({ ...artActual, _orden: ordenActual, estado: 'agregado' });
      }
    });

    // Artículos que estaban antes pero ya NO están (no fueron emparejados)
    mapAnteriorPorCodigo.forEach((instancias) => {
      instancias.forEach((instancia) => {
        if (!instancia.usado) {
          cambios.push({ ...instancia.art, estado: 'eliminado' });
        }
      });
    });

    // Ordenar por ORDEN actual
    return cambios.sort((a, b) => (a._orden || 0) - (b._orden || 0));
  };

  const handleRestaurar = async () => {
    if (!versionSeleccionada) return;

    const razon = prompt('¿Por qué deseas restaurar esta versión?');
    if (!razon) return;

    setIsRestoring(true);

    try {
      const response = await cotizadorService.restaurarVersion(
        cotizacionId,
        versionSeleccionada.VERSION,
        razon,
        actualizarPrecios  // Pasar parámetro de actualización de precios
      );

      if (response.success) {
        onRestaurar(response.data);
        onClose();
        // Limpiar estado
        setActualizarPrecios(false);
      }
    } catch (err) {
      console.error('Error al restaurar versión:', err);
      alert('Error al restaurar la versión: ' + (err.message || 'Error desconocido'));
    } finally {
      setIsRestoring(false);
    }
  };

  const handleAbrirCombinar = () => {
    if (onOpenCombinar) {
      onOpenCombinar(versiones);
    }
  };

  const handleDescargarPDF = async (e, version) => {
    e.stopPropagation();

    // Crear ID único para el toast para evitar duplicados si clickea rápido
    const toastId = `pdf-${version.ID}`;

    if (toast.isActive(toastId)) return;

    toast({
      id: toastId,
      title: `Descargando PDF v${version.VERSION}...`,
      description: "Si no existe, se generará autométicamente",
      status: "info",
      duration: null,
      isClosable: false,
    });

    try {
      // El backend ahora es lo suficientemente inteligente para generar el PDF si no existe
      // pasando la versión específica.
      await cotizadorService.descargarPdfVersion(
        version.ID,
        version.VERSION,
        showIVA,
        applyDiscount,
        true // Forzar regeneración para aplicar opciones visuales actuales (con/sin IVA)
      );

      toast.update(toastId, {
        title: "PDF descargado",
        description: `Versión ${version.VERSION} guardada`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error al descargar PDF de versión:', err);
      toast.update(toastId, {
        title: "Error al descargar PDF",
        description: err.message || "No se pudo obtener el documento",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'N/A';
    const date = new Date(fecha);
    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const versionMasReciente = versiones.length > 0 ?
    versiones.reduce((max, v) => v.VERSION > max.VERSION ? v : max, versiones[0]) : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" scrollBehavior="inside" isCentered>
      <ModalOverlay />
      <ModalContent
        bg={modalBg}
        maxH="95vh"
        minH="85vh"
        borderRadius="20px"
        border="2px solid"
        borderColor={modalBorderColor}
        backdropFilter={isDark ? 'blur(120px)' : 'none'}
        boxShadow={isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)'}
      >
        <ModalHeader color={primaryColor}>
          <HStack spacing={3}>
            <Icon as={TimeIcon} />
            <Text>Historial de Versiones</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          {isLoading ? (
            <Flex justify="center" align="center" py={8}>
              <Spinner size="lg" color="blue.500" />
            </Flex>
          ) : error ? (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          ) : versiones.length === 0 ? (
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              No hay versiones disponibles
            </Alert>
          ) : (
            <VStack spacing={3} align="stretch">
              {!modoEdicion && (
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  Estás en modo solo lectura. Para restaurar versiones, primero haz click en "Editar Cotización"
                </Alert>
              )}

              {versiones
                .sort((a, b) => b.VERSION - a.VERSION)
                .map((version) => {
                  const esActual = version.VERSION === versionMasReciente?.VERSION;
                  const esSeleccionada = versionSeleccionada?.VERSION === version.VERSION;
                  const estaExpandida = versionesExpandidas.has(version.VERSION);
                  const vistaPrevia = vistasPrevia.get(version.VERSION);

                  return (
                    <Box
                      key={version.ID}
                      borderRadius="md"
                      border="2px"
                      borderColor={esSeleccionada ? "blue.500" : borderColor}
                      overflow="hidden"
                      boxShadow={esSeleccionada ? "0 0 0 3px rgba(66, 153, 225, 0.3)" : "none"}
                    >
                      <Box
                        p={4}
                        bg={esSeleccionada ? useColorModeValue("blue.50", "#2C5282") : bgColor}
                        transition="all 0.2s"
                      >
                        <Flex justify="space-between" align="start">
                          <VStack align="start" spacing={2} flex="1">
                            <HStack spacing={2}>
                              <Badge colorScheme="blue" fontSize="md" px={2} py={1}>
                                Versión {version.VERSION}
                              </Badge>
                              {esActual && (
                                <Badge colorScheme="green" fontSize="sm">
                                  <Icon as={CheckIcon} mr={1} />
                                  Actual
                                </Badge>
                              )}
                            </HStack>

                            <HStack spacing={4} color={labelColor} fontSize="sm">
                              <HStack spacing={1}>
                                <Icon as={TimeIcon} />
                                <Text>{formatearFecha(version.FECHA_MODIFICACION)}</Text>
                              </HStack>
                              <Text>•</Text>
                              <Text fontWeight="600">
                                {version.NOMBRE_USUARIO_CREADOR || `Usuario ${version.CREADO_POR}`}
                              </Text>
                            </HStack>

                            {/* Motivo del cambio */}
                            {version.RAZON_CAMBIO && (
                              <Box
                                p={2}
                                bg={useColorModeValue("gray.100", "gray.700")}
                                borderRadius="md"
                                width="100%"
                              >
                                <Text fontSize="xs" color={labelColor} fontWeight="600" mb={1}>
                                  Motivo del cambio:
                                </Text>
                                <Text fontSize="sm" color={primaryColor} fontStyle="italic">
                                  "{version.RAZON_CAMBIO}"
                                </Text>
                              </Box>
                            )}

                            <Divider />

                            <HStack spacing={6} fontSize="sm" flexWrap="wrap">
                              <HStack spacing={2}>
                                <Text color={labelColor} fontWeight="600">Cliente:</Text>
                                <Text color={primaryColor}>
                                  {version.NOMBRE_CLIENTE} ({version.COD_CLIENTE})
                                </Text>
                              </HStack>

                              <HStack spacing={2}>
                                <Text color={labelColor} fontWeight="600">Bonif. General:</Text>
                                <Text color={primaryColor} fontWeight="600">
                                  {parseFloat(version.BONIFICACION_GENERAL || 0).toFixed(2)}%
                                </Text>
                              </HStack>

                              <HStack spacing={2}>
                                <Text color={labelColor} fontWeight="600">Total:</Text>
                                <Text color={primaryColor} fontWeight="700">
                                  ${parseFloat(version.TOTAL || 0).toFixed(2)}
                                </Text>
                              </HStack>

                              <HStack spacing={2}>
                                <Text color={labelColor} fontWeight="600">Estado:</Text>
                                <Badge
                                  colorScheme={
                                    version.ESTADO === 'aprobada' ? 'green' :
                                      version.ESTADO === 'enviada' ? 'blue' :
                                        version.ESTADO === 'rechazada' ? 'red' : 'gray'
                                  }
                                >
                                  {version.ESTADO}
                                </Badge>
                              </HStack>
                            </HStack>
                          </VStack>

                          <HStack spacing={2}>
                            <Tooltip label={esSeleccionada ? "Versión seleccionada" : modoEdicion ? "Seleccionar para restaurar" : "Solo lectura - No puedes restaurar"}>
                              <IconButton
                                icon={<CheckIcon />}
                                size="sm"
                                colorScheme={esSeleccionada ? "blue" : "gray"}
                                variant={esSeleccionada ? "solid" : "outline"}
                                aria-label="Seleccionar versión"
                                isDisabled={!modoEdicion}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setVersionSeleccionada(esSeleccionada ? null : version);
                                }}
                              />
                            </Tooltip>

                            <Tooltip
                              label={estaExpandida ? "Ocultar vista previa" :
                                version.VERSION === 1 ? "Ver artículos de la primera versión" :
                                  "Ver cambios comparado con versión anterior"}
                            >
                              <IconButton
                                icon={estaExpandida ? <ChevronUpIcon /> : <ViewIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme={estaExpandida ? "blue" : "gray"}
                                aria-label="Ver detalles"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleVistaPrevia(version);
                                }}
                              />
                            </Tooltip>

                            <Tooltip label={`Descargar PDF v${version.VERSION} ${showIVA ? '(con IVA)' : '(sin IVA)'}`}>
                              <IconButton
                                icon={<DownloadIcon />}
                                size="sm"
                                variant="ghost"
                                colorScheme="teal"
                                aria-label="Descargar PDF"
                                onClick={(e) => handleDescargarPDF(e, version)}
                              />
                            </Tooltip>
                          </HStack>
                        </Flex>
                      </Box>

                      {/* Vista previa expandible */}
                      <Collapse in={estaExpandida} animateOpacity>
                        {vistaPrevia && (
                          <Box p={4} bg={useColorModeValue("gray.50", "gray.800")} borderTop="1px" borderColor={borderColor}>
                            <VStack align="stretch" spacing={3}>

                              {/* Mostrar cambios en campos comerciales si hay versión anterior */}
                              {vistaPrevia.versionAnterior && (() => {
                                const cambiosComerciales = compararCamposComerciales(
                                  vistaPrevia.version,
                                  vistaPrevia.versionAnterior
                                );

                                if (cambiosComerciales.length > 0) {
                                  return (
                                    <Box
                                      p={4}
                                      bg={useColorModeValue("white", "gray.700")}
                                      borderRadius="md"
                                      border="1px"
                                      borderColor="purple.400"
                                      boxShadow="sm"
                                    >
                                      <VStack align="stretch" spacing={3}>
                                        <HStack spacing={2}>
                                          <Icon as={RepeatIcon} color="purple.500" />
                                          <Text fontWeight="700" fontSize="md" color={primaryColor}>
                                            Cambios en Datos Comerciales
                                          </Text>
                                          <Badge colorScheme="purple" fontSize="xs">
                                            {cambiosComerciales.length} campo{cambiosComerciales.length !== 1 ? 's' : ''} modificado{cambiosComerciales.length !== 1 ? 's' : ''}
                                          </Badge>
                                        </HStack>

                                        <Divider />

                                        {/* Mostrar cada cambio */}
                                        <VStack align="stretch" spacing={2}>
                                          {cambiosComerciales.map((cambio, idx) => (
                                            <Box
                                              key={idx}
                                              p={3}
                                              bg={modifiedBg}
                                              borderRadius="md"
                                              border="1px"
                                              borderColor="yellow.300"
                                            >
                                              <VStack align="stretch" spacing={1}>
                                                <Text fontSize="sm" fontWeight="600" color={labelColor}>
                                                  {cambio.label}:
                                                </Text>
                                                <HStack spacing={2} fontSize="sm">
                                                  <Text
                                                    color="red.500"
                                                    textDecoration="line-through"
                                                    fontStyle="italic"
                                                  >
                                                    {cambio.valorAnterior}
                                                  </Text>
                                                  <Icon as={RepeatIcon} boxSize={3} color="gray.500" />
                                                  <Text
                                                    color="green.600"
                                                    fontWeight="700"
                                                  >
                                                    {cambio.valorActual}
                                                  </Text>
                                                </HStack>
                                              </VStack>
                                            </Box>
                                          ))}
                                        </VStack>
                                      </VStack>
                                    </Box>
                                  );
                                }
                                return null;
                              })()}

                              <Flex justify="space-between" align="center" flexWrap="wrap">
                                <HStack spacing={2}>
                                  <Icon as={ViewIcon} color="blue.500" />
                                  <Text fontWeight="600" color={primaryColor}>
                                    Vista Previa - Artículos
                                  </Text>
                                  {vistaPrevia.versionAnterior && (
                                    <Badge colorScheme="purple" fontSize="xs">
                                      Comparando con versión {vistaPrevia.versionAnterior.VERSION}
                                    </Badge>
                                  )}
                                </HStack>

                                {/* Resumen de cambios estilo GitHub */}
                                {vistaPrevia.versionAnterior && (() => {
                                  const cambios = compararArticulos(
                                    vistaPrevia.articulos,
                                    vistaPrevia.articulosVersionAnterior || []
                                  );
                                  const agregados = cambios.filter(a => a.estado === 'agregado').length;
                                  const eliminados = cambios.filter(a => a.estado === 'eliminado').length;
                                  const modificados = cambios.filter(a => a.estado === 'modificado' || a.estado === 'movido_modificado').length;
                                  const movidos = cambios.filter(a => a.estado === 'movido' || a.estado === 'movido_modificado').length;

                                  return (
                                    <HStack spacing={2} fontSize="sm">
                                      {agregados > 0 && (
                                        <Badge colorScheme="green" variant="subtle">
                                          +{agregados}
                                        </Badge>
                                      )}
                                      {eliminados > 0 && (
                                        <Badge colorScheme="red" variant="subtle">
                                          -{eliminados}
                                        </Badge>
                                      )}
                                      {modificados > 0 && (
                                        <Badge colorScheme="yellow" variant="subtle">
                                          ~{modificados}
                                        </Badge>
                                      )}
                                      {movidos > 0 && (
                                        <Badge colorScheme="purple" variant="subtle">
                                          ↕{movidos}
                                        </Badge>
                                      )}
                                      {agregados === 0 && eliminados === 0 && modificados === 0 && movidos === 0 && (
                                        <Badge colorScheme="gray" variant="subtle">
                                          Sin cambios
                                        </Badge>
                                      )}
                                    </HStack>
                                  );
                                })()}
                              </Flex>

                              {vistaPrevia.articulos && vistaPrevia.articulos.length > 0 ? (
                                <>
                                  <Box overflowX="auto">
                                    <Table size="sm" variant="simple">
                                      <Thead>
                                        <Tr>
                                          <Th w="50px" textAlign="center">#</Th>
                                          <Th>Código</Th>
                                          <Th>Descripción</Th>
                                          <Th isNumeric>Cantidad</Th>
                                          <Th isNumeric>Precio Unit.</Th>
                                          <Th isNumeric>Desc. %</Th>
                                          <Th isNumeric>Importe</Th>
                                          {vistaPrevia.versionAnterior && <Th>Estado</Th>}
                                        </Tr>
                                      </Thead>
                                      <Tbody>
                                        {vistaPrevia.versionAnterior ? (
                                          // Comparar con versión ANTERIOR
                                          compararArticulos(
                                            vistaPrevia.articulos,
                                            vistaPrevia.articulosVersionAnterior || []
                                          ).map((art, idx) => {
                                            const tieneCambioCantidad = art.cambiosCampos?.some(c => c.campo === 'cantidad');
                                            const tieneCambioPrecio = art.cambiosCampos?.some(c => c.campo === 'precio');
                                            const tieneCambioDescuento = art.cambiosCampos?.some(c => c.campo === 'descuento');
                                            const tieneMovimiento = art.estado === 'movido' || art.estado === 'movido_modificado';

                                            // Color de fondo para movido (púrpura)
                                            const movidoBg = useColorModeValue("purple.50", "purple.900");

                                            return (
                                              <Tr
                                                key={idx}
                                                bg={
                                                  art.estado === 'agregado' ? addedBg :
                                                    art.estado === 'eliminado' ? removedBg :
                                                      art.estado === 'modificado' ? modifiedBg :
                                                        art.estado === 'movido' ? movidoBg :
                                                          art.estado === 'movido_modificado' ? movidoBg :
                                                            'transparent'
                                                }
                                              >
                                                <Td textAlign="center" fontWeight="500">
                                                  {tieneMovimiento ? (
                                                    <HStack spacing={1} justify="center">
                                                      <Text fontSize="xs" color="gray.500">{art._ordenAnterior}</Text>
                                                      <Text fontSize="xs" color="purple.500">→</Text>
                                                      <Text fontWeight="600" color="purple.600">{art._orden}</Text>
                                                    </HStack>
                                                  ) : (
                                                    art._orden
                                                  )}
                                                </Td>
                                                <Td fontWeight={art.estado !== 'sin_cambios' ? '600' : 'normal'}>
                                                  {art.COD_ARTICULO}
                                                </Td>
                                                <Td>
                                                  <Text
                                                    textDecoration={art.estado === 'eliminado' ? 'line-through' : 'none'}
                                                    color={art.estado === 'eliminado' ? 'gray.500' : 'inherit'}
                                                  >
                                                    {art.DESCRIPCION}
                                                  </Text>
                                                </Td>
                                                <Td isNumeric>
                                                  <VStack spacing={0} align="flex-end">
                                                    <Text
                                                      fontWeight={tieneCambioCantidad ? '700' : 'normal'}
                                                      color={tieneCambioCantidad ? 'green.600' : 'inherit'}
                                                    >
                                                      {art.CANTIDAD}
                                                    </Text>
                                                    {tieneCambioCantidad && art.valoresAnteriores && (
                                                      <Text fontSize="xs" color="red.500" textDecoration="line-through">
                                                        {art.valoresAnteriores.CANTIDAD}
                                                      </Text>
                                                    )}
                                                  </VStack>
                                                </Td>
                                                <Td isNumeric>
                                                  <VStack spacing={0} align="flex-end">
                                                    <Text
                                                      fontWeight={tieneCambioPrecio ? '700' : 'normal'}
                                                      color={tieneCambioPrecio ? 'green.600' : 'inherit'}
                                                    >
                                                      ${parseFloat(art.PRECIO_UNITARIO_SIN_IMP || 0).toFixed(2)}
                                                    </Text>
                                                    {tieneCambioPrecio && art.valoresAnteriores && (
                                                      <Text fontSize="xs" color="red.500" textDecoration="line-through">
                                                        ${parseFloat(art.valoresAnteriores.PRECIO_UNITARIO_SIN_IMP || 0).toFixed(2)}
                                                      </Text>
                                                    )}
                                                  </VStack>
                                                </Td>
                                                <Td isNumeric>
                                                  <VStack spacing={0} align="flex-end">
                                                    <Text
                                                      fontWeight={tieneCambioDescuento ? '700' : 'normal'}
                                                      color={tieneCambioDescuento ? 'green.600' : 'inherit'}
                                                    >
                                                      {art.BONIFICACION_PORCENTAJE}%
                                                    </Text>
                                                    {tieneCambioDescuento && art.valoresAnteriores && (
                                                      <Text fontSize="xs" color="red.500" textDecoration="line-through">
                                                        {art.valoresAnteriores.BONIFICACION_PORCENTAJE}%
                                                      </Text>
                                                    )}
                                                  </VStack>
                                                </Td>
                                                <Td isNumeric fontWeight="600">
                                                  ${parseFloat(art.IMPORTE || 0).toFixed(2)}
                                                </Td>
                                                <Td>
                                                  <Badge
                                                    colorScheme={
                                                      art.estado === 'agregado' ? 'green' :
                                                        art.estado === 'eliminado' ? 'red' :
                                                          art.estado === 'modificado' ? 'yellow' :
                                                            art.estado === 'movido' ? 'purple' :
                                                              art.estado === 'movido_modificado' ? 'orange' :
                                                                'gray'
                                                    }
                                                    fontSize="xs"
                                                  >
                                                    {art.estado === 'agregado' ? '+ Agregado' :
                                                      art.estado === 'eliminado' ? '- Eliminado' :
                                                        art.estado === 'modificado' ? '~ Modificado' :
                                                          art.estado === 'movido' ? '↕ Movido' :
                                                            art.estado === 'movido_modificado' ? '↕~ Movido y Mod.' :
                                                              '= Sin cambios'}
                                                  </Badge>
                                                </Td>
                                              </Tr>
                                            );
                                          })
                                        ) : (
                                          // Versión 1: sin comparación (primera versión)
                                          vistaPrevia.articulos.map((art, idx) => (
                                            <Tr key={idx}>
                                              <Td textAlign="center" fontWeight="500">{art.ORDEN ?? (idx + 1)}</Td>
                                              <Td>{art.COD_ARTICULO}</Td>
                                              <Td>{art.DESCRIPCION}</Td>
                                              <Td isNumeric>{art.CANTIDAD}</Td>
                                              <Td isNumeric>${parseFloat(art.PRECIO_UNITARIO_SIN_IMP || 0).toFixed(2)}</Td>
                                              <Td isNumeric>{art.BONIFICACION_PORCENTAJE}%</Td>
                                              <Td isNumeric fontWeight="600">${parseFloat(art.IMPORTE || 0).toFixed(2)}</Td>
                                            </Tr>
                                          ))
                                        )}
                                      </Tbody>
                                    </Table>
                                  </Box>

                                  {/* Leyenda de colores */}
                                  {vistaPrevia.versionAnterior && (
                                    <Box
                                      p={3}
                                      bg={useColorModeValue("white", "gray.700")}
                                      borderRadius="md"
                                      border="1px"
                                      borderColor={borderColor}
                                    >
                                      <HStack spacing={4} fontSize="xs" flexWrap="wrap">
                                        <Text fontWeight="600" color={labelColor}>Leyenda:</Text>
                                        <HStack spacing={1}>
                                          <Box w={3} h={3} bg={addedBg} borderRadius="sm" />
                                          <Text color={labelColor}>Agregado</Text>
                                        </HStack>
                                        <HStack spacing={1}>
                                          <Box w={3} h={3} bg={modifiedBg} borderRadius="sm" />
                                          <Text color={labelColor}>Modificado</Text>
                                        </HStack>
                                        <HStack spacing={1}>
                                          <Box w={3} h={3} bg={removedBg} borderRadius="sm" />
                                          <Text color={labelColor}>Eliminado</Text>
                                        </HStack>
                                        <HStack spacing={1}>
                                          <Box w={3} h={3} bg={useColorModeValue("purple.50", "purple.900")} borderRadius="sm" />
                                          <Text color={labelColor}>Movido</Text>
                                        </HStack>
                                      </HStack>
                                    </Box>
                                  )}
                                </>
                              ) : (
                                <Alert status="info" size="sm">
                                  <AlertIcon />
                                  Esta versión no tiene artículos
                                </Alert>
                              )}
                            </VStack>
                          </Box>
                        )}
                      </Collapse>
                    </Box>
                  );
                })}
            </VStack>
          )}
        </ModalBody>

        <ModalFooter bg={useColorModeValue("gray.50", "gray.900")} borderTop="1px" borderColor={borderColor}>
          <VStack width="100%" spacing={3} align="stretch">
            {/* Sección de actualización de precios */}
            {versionSeleccionada && versionSeleccionada.VERSION !== versionMasReciente?.VERSION && (
              <Box borderWidth="1px" borderRadius="md" p={3} borderColor="blue.200" bg={useColorModeValue("blue.50", "gray.800")}>
                <HStack justify="space-between">
                  <VStack align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="600">
                      ¿Actualizar precios a valores actuales de Tango?
                    </Text>
                    <Text fontSize="xs" color={labelColor}>
                      Los artículos sin precio mantendrán su valor histórico
                    </Text>
                  </VStack>
                  <Switch
                    size="lg"
                    colorScheme="blue"
                    isChecked={actualizarPrecios}
                    onChange={(e) => setActualizarPrecios(e.target.checked)}
                  />
                </HStack>
              </Box>
            )}

            {/* Barra de acciones */}
            <HStack spacing={3} width="100%" justify="space-between">
              <Box>
                {versionSeleccionada ? (
                  <HStack spacing={2}>
                    <Icon as={CheckIcon} color="blue.500" />
                    <Text fontSize="sm" color={labelColor}>
                      Versión {versionSeleccionada.VERSION} seleccionada
                    </Text>
                  </HStack>
                ) : (
                  <Text fontSize="sm" color={labelColor} fontStyle="italic">
                    Haz clic en el ícono <Icon as={CheckIcon} display="inline" /> para seleccionar una versión a restaurar
                  </Text>
                )}
              </Box>

              <HStack spacing={3}>
                <Button variant="ghost" onClick={onClose}>
                  Cerrar
                </Button>

                {/* Botón Combinar Versiones */}
                <Tooltip
                  label={
                    !modoEdicion
                      ? "Activa el modo edición para combinar versiones"
                      : versiones.length < 2
                        ? "Se necesitan al menos 2 versiones para combinar"
                        : "Combinar artículos de dos versiones diferentes"
                  }
                >
                  <Button
                    leftIcon={<Icon as={FaCodeBranch} />}
                    colorScheme="purple"
                    variant="outline"
                    onClick={handleAbrirCombinar}
                    size="md"
                    fontWeight="600"
                    isDisabled={!modoEdicion || versiones.length < 2}
                  >
                    Combinar Versiones
                  </Button>
                </Tooltip>

                {versionSeleccionada && (
                  <Button
                    leftIcon={<RepeatIcon />}
                    colorScheme="blue"
                    onClick={handleRestaurar}
                    isLoading={isRestoring}
                    loadingText="Restaurando..."
                    size="md"
                    fontWeight="600"
                    isDisabled={!modoEdicion || versionSeleccionada.VERSION === versionMasReciente?.VERSION}
                  >
                    {versionSeleccionada.VERSION === versionMasReciente?.VERSION ?
                      'Versión Actual' :
                      `Restaurar Versión ${versionSeleccionada.VERSION}`}
                  </Button>
                )}
              </HStack>
            </HStack>
          </VStack>
        </ModalFooter>
      </ModalContent>

    </Modal>
  );
};

export default HistorialVersiones;
