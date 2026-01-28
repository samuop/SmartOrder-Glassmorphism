import React, { useState, useEffect, useMemo, useCallback } from "react";
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
  Spinner,
  Alert,
  AlertIcon,
  Flex,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Radio,
  RadioGroup,
  Checkbox,
  Input,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Switch,
  Textarea,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Tooltip,
  IconButton,
} from "@chakra-ui/react";
import {
  RepeatIcon,
  CheckIcon,
  WarningIcon,
  ArrowForwardIcon,
  ArrowBackIcon,
  AddIcon,
  MinusIcon,
} from "@chakra-ui/icons";
import { FaCodeBranch } from "react-icons/fa";
import cotizadorService from "../../../services/cotizadorService";

const CombinarVersionesModal = ({
  isOpen,
  onClose,
  cotizacionId,
  versiones,
  onCombinacionExitosa,
  modoEdicion = false,
}) => {
  // Estados principales
  const [paso, setPaso] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Paso 1: Seleccion de versiones
  const [versionA, setVersionA] = useState(null);
  const [versionB, setVersionB] = useState(null);
  const [versionPredeterminada, setVersionPredeterminada] = useState("B");

  // Paso 2: Seleccion de articulos
  const [analisis, setAnalisis] = useState(null);
  const [articulosSeleccionados, setArticulosSeleccionados] = useState([]);
  const [edicionesManual, setEdicionesManual] = useState({});

  // Paso 3: Datos comerciales
  const [fuenteDatosComerciales, setFuenteDatosComerciales] = useState("B");
  const [actualizarPrecios, setActualizarPrecios] = useState(false);
  const [razonCombinacion, setRazonCombinacion] = useState("");

  // Paso 4: Procesando
  const [isProcessing, setIsProcessing] = useState(false);

  const toast = useToast({ position: "bottom" });

  // Colores
  const bgColor = useColorModeValue("white", "#2D3748");
  const borderColor = useColorModeValue("gray.200", "#4A5568");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const primaryColor = useColorModeValue("#2D3748", "white");
  const selectedBg = useColorModeValue("blue.50", "blue.900");
  const conflictBg = useColorModeValue("orange.50", "orange.900");
  const soloABg = useColorModeValue("purple.50", "purple.900");
  const soloBBg = useColorModeValue("teal.50", "teal.900");

  // Reset al cerrar
  useEffect(() => {
    if (!isOpen) {
      setPaso(1);
      setVersionA(null);
      setVersionB(null);
      setVersionPredeterminada("B");
      setAnalisis(null);
      setArticulosSeleccionados([]);
      setEdicionesManual({});
      setFuenteDatosComerciales("B");
      setActualizarPrecios(false);
      setRazonCombinacion("");
      setError(null);
    }
  }, [isOpen]);

  // Versiones ordenadas por numero
  const versionesOrdenadas = useMemo(() => {
    return [...versiones].sort((a, b) => b.VERSION - a.VERSION);
  }, [versiones]);

  // Obtener datos de version por numero
  const obtenerDatosVersion = useCallback(
    (numVersion) => {
      return versiones.find((v) => v.VERSION === numVersion);
    },
    [versiones]
  );

  // Cargar analisis cuando se seleccionan ambas versiones
  const cargarAnalisis = async () => {
    if (!versionA || !versionB) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await cotizadorService.analizarVersionesParaCombinar(
        cotizacionId,
        versionA,
        versionB
      );

      if (response.success) {
        setAnalisis(response.data);

        // Pre-seleccionar todos los articulos segun version predeterminada
        const datosVersionA = obtenerDatosVersion(versionA);
        const datosVersionB = obtenerDatosVersion(versionB);
        const articulosA = datosVersionA?.articulos || [];
        const articulosB = datosVersionB?.articulos || [];

        const seleccionInicial = [];

        // Articulos solo en A
        response.data.articulosSoloEnA.forEach((codigo) => {
          seleccionInicial.push({
            codArticulo: codigo,
            fuenteVersion: "A",
            seleccionado: true,
          });
        });

        // Articulos solo en B
        response.data.articulosSoloEnB.forEach((codigo) => {
          seleccionInicial.push({
            codArticulo: codigo,
            fuenteVersion: "B",
            seleccionado: true,
          });
        });

        // Articulos en ambas - usar version predeterminada
        response.data.articulosEnAmbas.forEach((codigo) => {
          seleccionInicial.push({
            codArticulo: codigo,
            fuenteVersion: versionPredeterminada,
            seleccionado: true,
          });
        });

        setArticulosSeleccionados(seleccionInicial);
      }
    } catch (err) {
      console.error("Error al cargar analisis:", err);
      setError("No se pudo analizar las versiones");
    } finally {
      setIsLoading(false);
    }
  };

  // Validar paso actual
  const puedeAvanzar = useMemo(() => {
    switch (paso) {
      case 1:
        return versionA && versionB && versionA !== versionB;
      case 2:
        return articulosSeleccionados.filter((a) => a.seleccionado).length > 0;
      case 3:
        return razonCombinacion.trim().length > 0;
      default:
        return true;
    }
  }, [paso, versionA, versionB, articulosSeleccionados, razonCombinacion]);

  // Avanzar paso
  const handleSiguiente = async () => {
    if (paso === 1) {
      await cargarAnalisis();
    }
    setPaso(paso + 1);
  };

  // Retroceder paso
  const handleAnterior = () => {
    setPaso(paso - 1);
  };

  // Toggle seleccion de articulo
  const toggleArticulo = (codArticulo, seleccionado) => {
    setArticulosSeleccionados((prev) =>
      prev.map((a) =>
        a.codArticulo === codArticulo ? { ...a, seleccionado } : a
      )
    );
  };

  // Cambiar fuente de articulo
  const cambiarFuenteArticulo = (codArticulo, nuevaFuente) => {
    setArticulosSeleccionados((prev) =>
      prev.map((a) =>
        a.codArticulo === codArticulo ? { ...a, fuenteVersion: nuevaFuente } : a
      )
    );
  };

  // Actualizar edicion manual
  const actualizarEdicionManual = (codArticulo, campo, valor) => {
    setEdicionesManual((prev) => ({
      ...prev,
      [codArticulo]: {
        ...prev[codArticulo],
        [campo]: valor,
      },
    }));
  };

  // Ejecutar combinacion
  const ejecutarCombinacion = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Preparar articulos seleccionados con ediciones manuales
      const articulosParaCombinar = articulosSeleccionados
        .filter((a) => a.seleccionado)
        .map((a) => ({
          codArticulo: a.codArticulo,
          fuenteVersion: a.fuenteVersion,
          datosEditados: edicionesManual[a.codArticulo] || undefined,
        }));

      const datosCombinacion = {
        versionA,
        versionB,
        versionPredeterminada,
        articulosSeleccionados: articulosParaCombinar,
        datosComerciales: {
          fuente: fuenteDatosComerciales,
        },
        razonCombinacion,
        actualizarPrecios,
      };

      const response = await cotizadorService.combinarVersiones(
        cotizacionId,
        datosCombinacion
      );

      if (response.success) {
        toast({
          title: "Versiones combinadas",
          description: response.message,
          status: "success",
          duration: 5000,
          isClosable: true,
        });

        if (onCombinacionExitosa) {
          onCombinacionExitosa(response.data.cotizacion);
        }

        onClose();
      }
    } catch (err) {
      console.error("Error al combinar versiones:", err);
      setError(err.message || "Error al combinar versiones");
      toast({
        title: "Error",
        description: err.message || "No se pudieron combinar las versiones",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Obtener articulo de una version
  const obtenerArticuloDeVersion = (codArticulo, numVersion) => {
    const version = obtenerDatosVersion(numVersion);
    return version?.articulos?.find((a) => a.COD_ARTICULO === codArticulo);
  };

  // Formatear moneda
  const formatearMoneda = (valor) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(valor || 0);
  };

  // Formatear fecha
  const formatearFecha = (fecha) => {
    if (!fecha) return "N/A";
    const date = new Date(fecha);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Pasos del wizard
  const pasos = [
    { titulo: "Versiones", descripcion: "Seleccionar versiones" },
    { titulo: "Articulos", descripcion: "Seleccionar articulos" },
    { titulo: "Opciones", descripcion: "Datos comerciales" },
    { titulo: "Confirmar", descripcion: "Vista previa" },
  ];

  // Renderizar Paso 1: Seleccion de versiones
  const renderPaso1 = () => (
    <VStack spacing={4} align="stretch">
      <Alert status="info" borderRadius="md" py={2}>
        <AlertIcon />
        <Box>
          <Text fontWeight="600" fontSize="sm">Selecciona dos versiones para combinar</Text>
          <Text fontSize="xs">
            La versión predeterminada se usará cuando un artículo exista en
            ambas versiones con valores diferentes.
          </Text>
        </Box>
      </Alert>

      <HStack spacing={4} align="start">
        {/* Version A */}
        <Box flex={1}>
          <Text fontWeight="600" mb={2} fontSize="sm" color={primaryColor}>
            Versión A
          </Text>
          <RadioGroup
            value={String(versionA || "")}
            onChange={(val) => setVersionA(parseInt(val))}
          >
            <VStack align="stretch" spacing={2} pr={2}>
              {versionesOrdenadas.map((v) => (
                <Box
                  key={v.VERSION}
                  p={2}
                  borderRadius="md"
                  border="1px"
                  borderColor={
                    versionA === v.VERSION ? "blue.500" : borderColor
                  }
                  bg={versionA === v.VERSION ? selectedBg : bgColor}
                  cursor="pointer"
                  onClick={() => setVersionA(v.VERSION)}
                  opacity={versionB === v.VERSION ? 0.3 : 1}
                  pointerEvents={versionB === v.VERSION ? "none" : "auto"}
                  _hover={{ borderColor: versionA === v.VERSION ? "blue.500" : "blue.200" }}
                >
                  <Radio value={String(v.VERSION)} isDisabled={versionB === v.VERSION} size="sm">
                    <HStack spacing={2}>
                      <Badge colorScheme="blue" fontSize="xs">v{v.VERSION}</Badge>
                      <Text fontSize="xs" fontWeight="500">{formatearFecha(v.FECHA_MODIFICACION)}</Text>
                    </HStack>
                  </Radio>
                  <Text fontSize="2xs" color={labelColor} mt={1} ml={5}>
                    {v.articulos?.length || 0} art. - {formatearMoneda(v.TOTAL)}
                  </Text>
                </Box>
              ))}
            </VStack>
          </RadioGroup>
        </Box>

        {/* Version B */}
        <Box flex={1}>
          <Text fontWeight="600" mb={2} fontSize="sm" color={primaryColor}>
            Versión B
          </Text>
          <RadioGroup
            value={String(versionB || "")}
            onChange={(val) => setVersionB(parseInt(val))}
          >
            <VStack align="stretch" spacing={2} pr={2}>
              {versionesOrdenadas.map((v) => (
                <Box
                  key={v.VERSION}
                  p={2}
                  borderRadius="md"
                  border="1px"
                  borderColor={
                    versionB === v.VERSION ? "teal.500" : borderColor
                  }
                  bg={versionB === v.VERSION ? soloBBg : bgColor}
                  cursor="pointer"
                  onClick={() => setVersionB(v.VERSION)}
                  opacity={versionA === v.VERSION ? 0.3 : 1}
                  pointerEvents={versionA === v.VERSION ? "none" : "auto"}
                  _hover={{ borderColor: versionB === v.VERSION ? "teal.500" : "teal.200" }}
                >
                  <Radio value={String(v.VERSION)} isDisabled={versionA === v.VERSION} size="sm">
                    <HStack spacing={2}>
                      <Badge colorScheme="teal" fontSize="xs">v{v.VERSION}</Badge>
                      <Text fontSize="xs" fontWeight="500">{formatearFecha(v.FECHA_MODIFICACION)}</Text>
                    </HStack>
                  </Radio>
                  <Text fontSize="2xs" color={labelColor} mt={1} ml={5}>
                    {v.articulos?.length || 0} art. - {formatearMoneda(v.TOTAL)}
                  </Text>
                </Box>
              ))}
            </VStack>
          </RadioGroup>
        </Box>
      </HStack>

      {/* Version predeterminada */}
      {versionA && versionB && (
        <Box
          p={3}
          borderRadius="md"
          border="1px"
          borderColor="orange.300"
          bg={conflictBg}
        >
          <Text fontWeight="600" mb={1} fontSize="sm">
            Versión predeterminada para conflictos
          </Text>
          <Text fontSize="xs" color={labelColor} mb={2}>
            Cuando un artículo exista en ambas con valores diferentes, se usarán los de esta versión.
          </Text>
          <RadioGroup
            value={versionPredeterminada}
            onChange={setVersionPredeterminada}
            size="sm"
          >
            <HStack spacing={6}>
              <Radio value="A">
                <Badge colorScheme="blue" fontSize="xs">Versión A (v{versionA})</Badge>
              </Radio>
              <Radio value="B">
                <Badge colorScheme="teal" fontSize="xs">Versión B (v{versionB})</Badge>
              </Radio>
            </HStack>
          </RadioGroup>
        </Box>
      )}
    </VStack>
  );

  // Renderizar Paso 2: Seleccion de articulos
  const renderPaso2 = () => {
    if (isLoading) {
      return (
        <Flex justify="center" align="center" py={8}>
          <Spinner size="lg" color="blue.500" />
          <Text ml={3}>Analizando versiones...</Text>
        </Flex>
      );
    }

    if (!analisis) {
      return (
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          No se pudo cargar el analisis de versiones
        </Alert>
      );
    }

    const datosVersionA = obtenerDatosVersion(versionA);
    const datosVersionB = obtenerDatosVersion(versionB);

    return (
      <VStack spacing={4} align="stretch">
        {/* Resumen */}
        <HStack spacing={4} justify="center">
          <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
            Solo en A: {analisis.articulosSoloEnA.length}
          </Badge>
          <Badge colorScheme="teal" fontSize="sm" px={3} py={1}>
            Solo en B: {analisis.articulosSoloEnB.length}
          </Badge>
          <Badge colorScheme="orange" fontSize="sm" px={3} py={1}>
            En ambas: {analisis.articulosEnAmbas.length}
          </Badge>
          {analisis.conflictos.length > 0 && (
            <Badge colorScheme="red" fontSize="sm" px={3} py={1}>
              <Icon as={WarningIcon} mr={1} />
              Conflictos: {analisis.conflictos.length}
            </Badge>
          )}
        </HStack>

        <Divider />

        {/* Tabla de articulos */}
        <Box
          overflowX="auto"
          border="1px"
          borderColor={borderColor}
          borderRadius="md"
        >
          <Table size="sm" variant="simple">
            <Thead position="sticky" top={0} bg={bgColor} zIndex={1}>
              <Tr>
                <Th w="40px"></Th>
                <Th>Codigo</Th>
                <Th>Descripcion</Th>
                <Th>Fuente</Th>
                <Th isNumeric>Cantidad</Th>
                <Th isNumeric>Precio</Th>
                <Th isNumeric>Desc %</Th>
                <Th>Estado</Th>
              </Tr>
            </Thead>
            <Tbody>
              {articulosSeleccionados.map((sel) => {
                const esConflicto = analisis.articulosEnAmbas.includes(
                  sel.codArticulo
                );
                const esSoloA = analisis.articulosSoloEnA.includes(
                  sel.codArticulo
                );
                const esSoloB = analisis.articulosSoloEnB.includes(
                  sel.codArticulo
                );

                const articuloA = obtenerArticuloDeVersion(
                  sel.codArticulo,
                  versionA
                );
                const articuloB = obtenerArticuloDeVersion(
                  sel.codArticulo,
                  versionB
                );
                const articuloActual =
                  sel.fuenteVersion === "A" ? articuloA : articuloB;

                const edicion = edicionesManual[sel.codArticulo] || {};
                const cantidad =
                  edicion.cantidad ?? articuloActual?.CANTIDAD ?? 0;
                const descuento =
                  edicion.bonificacionPorcentaje ??
                  articuloActual?.BONIFICACION_PORCENTAJE ??
                  0;

                const bgRow = esSoloA
                  ? soloABg
                  : esSoloB
                    ? soloBBg
                    : esConflicto
                      ? conflictBg
                      : "transparent";

                return (
                  <Tr key={sel.codArticulo} bg={bgRow}>
                    <Td>
                      <Checkbox
                        isChecked={sel.seleccionado}
                        onChange={(e) =>
                          toggleArticulo(sel.codArticulo, e.target.checked)
                        }
                      />
                    </Td>
                    <Td fontWeight="500">{sel.codArticulo}</Td>
                    <Td maxW="200px" isTruncated>
                      {articuloActual?.DESCRIPCION || "-"}
                    </Td>
                    <Td>
                      {esConflicto ? (
                        <RadioGroup
                          size="sm"
                          value={sel.fuenteVersion}
                          onChange={(val) =>
                            cambiarFuenteArticulo(sel.codArticulo, val)
                          }
                        >
                          <HStack spacing={2}>
                            <Radio value="A">
                              <Badge size="sm" colorScheme="blue">
                                A
                              </Badge>
                            </Radio>
                            <Radio value="B">
                              <Badge size="sm" colorScheme="teal">
                                B
                              </Badge>
                            </Radio>
                          </HStack>
                        </RadioGroup>
                      ) : (
                        <Badge
                          colorScheme={esSoloA ? "purple" : "teal"}
                          size="sm"
                        >
                          {esSoloA ? "A" : "B"}
                        </Badge>
                      )}
                    </Td>
                    <Td isNumeric>
                      <NumberInput
                        size="xs"
                        value={cantidad}
                        min={0.001}
                        precision={3}
                        step={1}
                        maxW="80px"
                        onChange={(_, val) =>
                          actualizarEdicionManual(
                            sel.codArticulo,
                            "cantidad",
                            val
                          )
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                    <Td isNumeric fontSize="xs">
                      {formatearMoneda(
                        articuloActual?.PRECIO_UNITARIO_SIN_IMP || 0
                      )}
                    </Td>
                    <Td isNumeric>
                      <NumberInput
                        size="xs"
                        value={descuento}
                        min={0}
                        max={100}
                        precision={2}
                        step={1}
                        maxW="70px"
                        onChange={(_, val) =>
                          actualizarEdicionManual(
                            sel.codArticulo,
                            "bonificacionPorcentaje",
                            val
                          )
                        }
                      >
                        <NumberInputField />
                      </NumberInput>
                    </Td>
                    <Td>
                      {esConflicto && (
                        <Tooltip label="Existe en ambas versiones con valores diferentes">
                          <Badge colorScheme="orange" fontSize="xs">
                            <Icon as={WarningIcon} mr={1} />
                            Conflicto
                          </Badge>
                        </Tooltip>
                      )}
                      {esSoloA && (
                        <Badge colorScheme="purple" fontSize="xs">
                          Solo en A
                        </Badge>
                      )}
                      {esSoloB && (
                        <Badge colorScheme="teal" fontSize="xs">
                          Solo en B
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>

        {/* Leyenda */}
        <HStack spacing={4} fontSize="xs" color={labelColor} justify="center">
          <HStack>
            <Box w={3} h={3} bg={soloABg} borderRadius="sm" />
            <Text>Solo en version A</Text>
          </HStack>
          <HStack>
            <Box w={3} h={3} bg={soloBBg} borderRadius="sm" />
            <Text>Solo en version B</Text>
          </HStack>
          <HStack>
            <Box w={3} h={3} bg={conflictBg} borderRadius="sm" />
            <Text>En ambas (conflicto)</Text>
          </HStack>
        </HStack>
      </VStack>
    );
  };

  // Renderizar Paso 3: Datos comerciales
  const renderPaso3 = () => {
    const datosVersionA = obtenerDatosVersion(versionA);
    const datosVersionB = obtenerDatosVersion(versionB);

    return (
      <VStack spacing={6} align="stretch">
        {/* Datos comerciales */}
        <Box>
          <Text fontWeight="600" mb={3}>
            Datos comerciales
          </Text>
          <RadioGroup
            value={fuenteDatosComerciales}
            onChange={setFuenteDatosComerciales}
          >
            <VStack align="stretch" spacing={3}>
              <Box
                p={4}
                borderRadius="md"
                border="1px"
                borderColor={
                  fuenteDatosComerciales === "A" ? "blue.500" : borderColor
                }
                bg={fuenteDatosComerciales === "A" ? selectedBg : bgColor}
                cursor="pointer"
                onClick={() => setFuenteDatosComerciales("A")}
              >
                <Radio value="A">
                  <Badge colorScheme="blue" mr={2}>
                    Version A (v{versionA})
                  </Badge>
                </Radio>
                <VStack align="start" spacing={1} mt={2} ml={6} fontSize="sm">
                  <Text>
                    Bonificacion General:{" "}
                    {datosVersionA?.BONIFICACION_GENERAL || 0}%
                  </Text>
                  <Text>
                    Condicion de Venta: {datosVersionA?.CONDICION_VENTA || "N/A"}
                  </Text>
                  <Text>
                    Lista de Precios: {datosVersionA?.LISTA_PRECIOS || "N/A"}
                  </Text>
                </VStack>
              </Box>

              <Box
                p={4}
                borderRadius="md"
                border="1px"
                borderColor={
                  fuenteDatosComerciales === "B" ? "teal.500" : borderColor
                }
                bg={fuenteDatosComerciales === "B" ? soloBBg : bgColor}
                cursor="pointer"
                onClick={() => setFuenteDatosComerciales("B")}
              >
                <Radio value="B">
                  <Badge colorScheme="teal" mr={2}>
                    Version B (v{versionB})
                  </Badge>
                </Radio>
                <VStack align="start" spacing={1} mt={2} ml={6} fontSize="sm">
                  <Text>
                    Bonificacion General:{" "}
                    {datosVersionB?.BONIFICACION_GENERAL || 0}%
                  </Text>
                  <Text>
                    Condicion de Venta: {datosVersionB?.CONDICION_VENTA || "N/A"}
                  </Text>
                  <Text>
                    Lista de Precios: {datosVersionB?.LISTA_PRECIOS || "N/A"}
                  </Text>
                </VStack>
              </Box>
            </VStack>
          </RadioGroup>
        </Box>

        <Divider />

        {/* Actualizar precios */}
        <Box
          p={4}
          borderRadius="md"
          border="1px"
          borderColor="blue.200"
          bg={useColorModeValue("blue.50", "gray.800")}
        >
          <HStack justify="space-between">
            <VStack align="start" spacing={0}>
              <Text fontWeight="600">
                Actualizar precios a valores actuales de Tango
              </Text>
              <Text fontSize="xs" color={labelColor}>
                Los articulos sin precio en Tango mantendran su valor historico
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

        <Divider />

        {/* Razon de la combinacion */}
        <Box>
          <Text fontWeight="600" mb={2}>
            Razon de la combinacion *
          </Text>
          <Textarea
            value={razonCombinacion}
            onChange={(e) => setRazonCombinacion(e.target.value)}
            placeholder="Explica por que estas combinando estas versiones..."
            rows={3}
          />
        </Box>
      </VStack>
    );
  };

  // Renderizar Paso 4: Confirmacion
  const renderPaso4 = () => {
    const articulosACombinar = articulosSeleccionados.filter(
      (a) => a.seleccionado
    );
    const articulosDeA = articulosACombinar.filter(
      (a) => a.fuenteVersion === "A"
    ).length;
    const articulosDeB = articulosACombinar.filter(
      (a) => a.fuenteVersion === "B"
    ).length;

    return (
      <VStack spacing={6} align="stretch">
        <Alert status="info" borderRadius="md">
          <AlertIcon />
          <Box>
            <Text fontWeight="600">Confirma los datos antes de combinar</Text>
            <Text fontSize="sm">
              Se creara una nueva version con los articulos seleccionados.
            </Text>
          </Box>
        </Alert>

        {/* Resumen */}
        <Box p={4} borderRadius="md" border="1px" borderColor={borderColor}>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <Text color={labelColor}>Versiones a combinar:</Text>
              <HStack>
                <Badge colorScheme="blue">v{versionA}</Badge>
                <Icon as={RepeatIcon} />
                <Badge colorScheme="teal">v{versionB}</Badge>
              </HStack>
            </HStack>

            <HStack justify="space-between">
              <Text color={labelColor}>Articulos totales:</Text>
              <Text fontWeight="600">{articulosACombinar.length}</Text>
            </HStack>

            <HStack justify="space-between">
              <Text color={labelColor}>Articulos de version A:</Text>
              <Badge colorScheme="purple">{articulosDeA}</Badge>
            </HStack>

            <HStack justify="space-between">
              <Text color={labelColor}>Articulos de version B:</Text>
              <Badge colorScheme="teal">{articulosDeB}</Badge>
            </HStack>

            <HStack justify="space-between">
              <Text color={labelColor}>Datos comerciales de:</Text>
              <Badge
                colorScheme={fuenteDatosComerciales === "A" ? "blue" : "teal"}
              >
                Version {fuenteDatosComerciales} (v
                {fuenteDatosComerciales === "A" ? versionA : versionB})
              </Badge>
            </HStack>

            <HStack justify="space-between">
              <Text color={labelColor}>Actualizar precios:</Text>
              <Badge colorScheme={actualizarPrecios ? "green" : "gray"}>
                {actualizarPrecios ? "Si" : "No"}
              </Badge>
            </HStack>

            <Divider />

            <Box>
              <Text color={labelColor} fontSize="sm">
                Razon:
              </Text>
              <Text fontStyle="italic">"{razonCombinacion}"</Text>
            </Box>
          </VStack>
        </Box>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
        )}
      </VStack>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      isCentered
    >
      <ModalOverlay backdropFilter="blur(4px)" />
      <ModalContent bg={bgColor} maxH="95vh" w="95vw" maxW="1200px">
        <ModalHeader color={primaryColor} py={3}>
          <HStack justify="space-between" width="100%" pr={10}>
            <HStack spacing={3}>
              <Icon as={FaCodeBranch} color="blue.500" />
              <Text fontSize="lg">Combinar Versiones</Text>
            </HStack>
            {versionA && versionB && (
              <HStack spacing={2}>
                <Badge colorScheme="blue" variant="outline">v{versionA}</Badge>
                <Icon as={RepeatIcon} size="xs" color="gray.400" />
                <Badge colorScheme="teal" variant="outline">v{versionB}</Badge>
              </HStack>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton top={3} />

        <ModalBody py={2} px={6} overflowY="auto" sx={{
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-thumb': { background: 'gray.200', borderRadius: 'full' }
        }}>
          {/* Stepper - Versión más compacta */}
          <Stepper index={paso - 1} mb={4} size="xs" colorScheme="blue">
            {pasos.map((p, idx) => (
              <Step key={idx}>
                <StepIndicator>
                  <StepStatus
                    complete={<StepIcon />}
                    incomplete={<StepNumber />}
                    active={<StepNumber />}
                  />
                </StepIndicator>
                <Box flexShrink="0">
                  <StepTitle style={{ fontSize: '12px' }}>{p.titulo}</StepTitle>
                </Box>
                <StepSeparator />
              </Step>
            ))}
          </Stepper>

          <Divider mb={4} />

          {/* Contenido del paso */}
          <Box minH="40vh">
            {paso === 1 && renderPaso1()}
            {paso === 2 && renderPaso2()}
            {paso === 3 && renderPaso3()}
            {paso === 4 && renderPaso4()}
          </Box>
        </ModalBody>

        <ModalFooter
          bg={useColorModeValue("gray.50", "gray.900")}
          borderTop="1px"
          borderColor={borderColor}
        >
          <HStack spacing={3} width="100%" justify="space-between">
            <Box>
              {paso > 1 && (
                <Button
                  leftIcon={<ArrowBackIcon />}
                  variant="ghost"
                  onClick={handleAnterior}
                  isDisabled={isProcessing}
                >
                  Anterior
                </Button>
              )}
            </Box>

            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose} isDisabled={isProcessing}>
                Cancelar
              </Button>

              {paso < 4 ? (
                <Button
                  rightIcon={<ArrowForwardIcon />}
                  colorScheme="blue"
                  onClick={handleSiguiente}
                  isDisabled={!puedeAvanzar}
                  isLoading={isLoading}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  leftIcon={<FaCodeBranch />}
                  colorScheme="green"
                  onClick={ejecutarCombinacion}
                  isLoading={isProcessing}
                  loadingText="Combinando..."
                  isDisabled={!puedeAvanzar}
                >
                  Combinar Versiones
                </Button>
              )}
            </HStack>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CombinarVersionesModal;
