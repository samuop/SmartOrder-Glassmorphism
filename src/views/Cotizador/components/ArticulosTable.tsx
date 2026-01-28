import React, { useMemo, useState, useCallback, memo, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import {
  Box,
  Card,
  CardBody,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  VStack,
  HStack,
  Text,
  Heading,
  IconButton,
  useColorModeValue,
  useColorMode,
  NumberInput,
  NumberInputField,
  Badge,
  Flex,
  Alert,
  AlertIcon,
  AlertDescription,
  Tooltip,
  Switch,
  Spacer,
  Kbd,
  useDisclosure,
  Spinner,
  Icon,
  ScaleFade,
  Collapse,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Divider,
  Input,
  Textarea,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { AddIcon, DeleteIcon, SearchIcon, ChevronDownIcon, ChevronUpIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { FaBrain, FaRobot, FaMagic } from "react-icons/fa";
import { ENDPOINTS } from "@/api/endpoints";

import GeneralStockModal from "./GeneralStockModal";
import ArticleSearchModal from "./ArticleSearchModal";

// ==================== UTILIDADES MEMOIZADAS ====================

const formatCurrency = (n) => {
  const num = Number(n) || 0;
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `$${integerPart},${decimalPart}`;
};

const formatNumber = (n) => {
  const num = Number(n) || 0;
  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const decimalPart = parts[1];
  return `${integerPart},${decimalPart}`;
};

const calcUnit = (item, opts = {}) => {
  const withDisc = opts.withDisc ?? true;
  const withIVA = opts.withIVA ?? true;
  const base = Number(item.precioSinImp) || 0;
  const bonif = Math.max(0, Math.min(100, Number(item.bonif) || 0));
  const iva = Math.max(0, Number(item.iva ?? 21));
  const afterDisc = withDisc ? base * (1 - bonif / 100) : base;
  const afterIVA = withIVA ? afterDisc * (1 + iva / 100) : afterDisc;
  return afterIVA;
};

// ==================== COMPONENTE DE FILA MEMOIZADO ====================

const ArticuloRow = memo(({
  item,
  isDisabled,
  showIVA,
  applyDiscount,
  onUpdateRow,
  onDelete,
  onEditArticle,
  onInsertAt, // Callback para insertar artículo en posición específica
  colors,
  onKeyDown,
  registerRef,
  rowIndex,
  orden // Número de orden/posición del artículo
}) => {
  const { labelColor, primaryColor, hoverBg, borderColor } = colors;

  // Memoizar todos los cálculos de precio para esta fila
  const priceCalculations = useMemo(() => {
    const unitSinIVA = calcUnit(item, { withIVA: false, withDisc: false });
    const unitConDesc = calcUnit(item, { withIVA: false, withDisc: true });
    const unitConIVA = calcUnit(item, { withIVA: true, withDisc: false });
    const unitDescIVA = calcUnit(item, { withIVA: true, withDisc: true });
    const unitShown = calcUnit(item, { withIVA: showIVA, withDisc: applyDiscount });
    const importe = unitShown * (Number(item.cantidad) || 0);

    return { unitSinIVA, unitConDesc, unitConIVA, unitDescIVA, unitShown, importe };
  }, [item.precioSinImp, item.bonif, item.iva, item.cantidad, showIVA, applyDiscount]);

  const { unitSinIVA, unitConDesc, unitConIVA, unitDescIVA, importe } = priceCalculations;

  // Callbacks memoizados para esta fila
  const handleDecrease = useCallback(() => {
    const newCantidad = Math.max(0, (Number(item.cantidad) || 0) - 1);
    onUpdateRow(item.id, { cantidad: newCantidad });
  }, [item.id, item.cantidad, onUpdateRow]);

  const handleIncrease = useCallback(() => {
    const newCantidad = (Number(item.cantidad) || 0) + 1;
    onUpdateRow(item.id, { cantidad: newCantidad });
  }, [item.id, item.cantidad, onUpdateRow]);

  const handleCantidadChange = useCallback((_, v) => {
    onUpdateRow(item.id, { cantidad: isNaN(v) ? 0 : v });
  }, [item.id, onUpdateRow]);

  const handleBonifChange = useCallback((valString) => {
    // Reemplazar coma por punto para consistencia interna
    const cleanVal = valString.replace(',', '.');

    // Solo permitir caracteres válidos para un número decimal
    if (cleanVal !== "" && !/^-?\d*\.?\d*$/.test(cleanVal)) return;

    onUpdateRow(item.id, { bonif: cleanVal });
  }, [item.id, onUpdateRow]);

  const handleDelete = useCallback(() => {
    onDelete(item.id);
  }, [item.id, onDelete]);

  const handleEdit = useCallback(() => {
    onEditArticle(item);
  }, [item, onEditArticle]);

  // Callback memoizado para cambio de descripción
  const handleDescripcionChange = useCallback((e) => {
    onUpdateRow(item.id, { descripcion: e.target.value });
  }, [item.id, onUpdateRow]);

  // Colores para items recuperados
  const recoveredBg = useColorModeValue("yellow.50", "rgba(236, 201, 75, 0.1)");
  const recoveredHoverBg = useColorModeValue("yellow.100", "rgba(236, 201, 75, 0.2)");

  const bg = item._recovered ? recoveredBg : undefined;
  const bgHover = item._recovered ? recoveredHoverBg : hoverBg;

  return (
    <Tr
      bg={bg}
      _hover={{ bg: bgHover }}
      transition="backgroundColor 0.15s ease-in-out"
      borderBottom="1px"
      borderColor={borderColor}
      onKeyDown={(e) => {
        // Si el foco está en el TR (y no en un input), delegar
        if (e.target.tagName === 'TR') onKeyDown(e, rowIndex, 'row');
      }}
    >
      {/* Orden/Posición */}
      <Td px={1} textAlign="center">
        <Text fontSize="sm" fontWeight="500" color={labelColor}>
          {orden}
        </Text>
      </Td>

      {/* Código */}
      <Td
        fontWeight="500"
        color={primaryColor}
        whiteSpace="nowrap"
        fontSize="sm"
        px={2}
        cursor="pointer"
        onClick={handleEdit}
      >
        <HStack spacing={1}>
          <Text>{item.codigo || item.articulo}</Text>
          {item.metadata?.sinPrecioActual && (
            <Tooltip label="Artículo sin precio actual en Tango. Usando precio histórico." hasArrow>
              <Badge colorScheme="orange" fontSize="9px" px={1}>
                <Icon as={InfoOutlineIcon} boxSize="9px" mr={0.5} />
                SIN PRECIO
              </Badge>
            </Tooltip>
          )}
        </HStack>
      </Td>

      {/* Descripción */}
      <Td maxW="220px" px={2}>
        <VStack align="stretch" spacing={0}>
          <Textarea
            value={item.descripcion}
            onChange={handleDescripcionChange}
            size="sm"
            variant="unstyled"
            fontSize="sm"
            fontWeight="500"
            color={labelColor}
            isDisabled={isDisabled}
            p={0}
            minH="unset"
            rows={1}
            resize="none"
            _focus={{
              bg: useColorModeValue("white", "gray.700"),
              boxShadow: "0 0 0 1px #3182ce",
              p: 1
            }}
          />
          {item.descAdic && (
            <Text fontSize="xs" color={labelColor} opacity={0.7} noOfLines={1}>
              {item.descAdic}
            </Text>
          )}
        </VStack>
      </Td>

      {/* Cantidad */}
      <Td isNumeric px={2}>
        <HStack spacing={0}>
          {!isDisabled && (
            <IconButton
              icon={<MinusIcon />}
              size="xs"
              variant="ghost"
              colorScheme="blue"
              onClick={handleDecrease}
              aria-label="Decrementar cantidad"
              isDisabled={item.cantidad <= 0}
            />
          )}
          <NumberInput
            value={item.cantidad}
            size="sm"
            min={0}
            onChange={handleCantidadChange}
            w="55px"
            variant="filled"
            isDisabled={isDisabled}
          >
            <NumberInputField
              textAlign="center"
              fontSize="sm"
              px={1}
              onKeyDown={(e) => onKeyDown(e, rowIndex, 'cantidad')}
              ref={(el) => registerRef(rowIndex, 'cantidad', el)}
            />
          </NumberInput>
          {!isDisabled && (
            <IconButton
              icon={<AddIcon />}
              size="xs"
              variant="ghost"
              colorScheme="blue"
              onClick={handleIncrease}
              aria-label="Incrementar cantidad"
            />
          )}
        </HStack>
      </Td>

      {/* Unitario sin IVA */}
      <Td isNumeric px={2}>
        <Text fontSize="sm" fontWeight="500" color={primaryColor}>
          {formatCurrency(item.precioSinImp || 0)}
        </Text>
      </Td>

      {/* IVA % */}
      <Td isNumeric px={2}>
        <Text fontSize="sm" fontWeight="500" color={primaryColor}>
          {formatNumber(item.iva ?? 21)}%
        </Text>
      </Td>

      {/* Descuento % */}
      <Td isNumeric px={2}>
        <NumberInput
          value={item.bonif || 0}
          size="sm"
          min={0}
          max={100}
          onChange={handleBonifChange}
          w="80px"
          variant="filled"
          isDisabled={isDisabled}
        >
          <NumberInputField
            textAlign="right"
            fontSize="sm"
            onKeyDown={(e) => onKeyDown(e, rowIndex, 'bonif')}
            ref={(el) => registerRef(rowIndex, 'bonif', el)}
            onBlur={() => {
              if (item.bonif === "" || item.bonif === ".") {
                onUpdateRow(item.id, { bonif: 0 });
              }
            }}
          />
        </NumberInput>
      </Td>

      {/* Precio mostrado */}
      <Td isNumeric fontWeight="500" color={primaryColor} fontSize="sm" px={2}>
        {formatCurrency(importe)}
        <Text fontSize="xs" color={labelColor}>
          {showIVA ? "c/IVA" : "s/IVA"} {applyDiscount ? "· c/desc." : ""}
        </Text>
      </Td>

      {/* Acciones - Menú compacto */}
      <Td px={1} w="40px" textAlign="center" whiteSpace="nowrap">
        <Menu placement="bottom-end" isLazy>
          <MenuButton
            as={IconButton}
            icon={<ChevronDownIcon />}
            size="xs"
            variant="ghost"
            aria-label="Acciones"
            minW="auto"
            h="24px"
            w="24px"
          />
          <MenuList minW="200px" fontSize="sm">
            {/* Desglose de precios */}
            <Box px={3} py={2} borderBottom="1px" borderColor={borderColor}>
              <Text fontWeight="600" fontSize="xs" color={labelColor} mb={2}>
                Detalle de precio
              </Text>
              <VStack align="stretch" spacing={1} fontSize="xs">
                <HStack justify="space-between">
                  <Text color={labelColor}>Sin IVA:</Text>
                  <Text fontWeight="500">{formatCurrency(unitSinIVA)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={labelColor}>Con IVA:</Text>
                  <Text fontWeight="500">{formatCurrency(unitConIVA)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={labelColor}>Con desc.:</Text>
                  <Text fontWeight="500">{formatCurrency(unitConDesc)}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color={labelColor}>Con desc. + IVA:</Text>
                  <Text fontWeight="500">{formatCurrency(unitDescIVA)}</Text>
                </HStack>
              </VStack>
            </Box>
            {!isDisabled && (
              <>
                <MenuItem
                  icon={<ArrowUpIcon color="green.500" />}
                  onClick={() => onInsertAt(rowIndex)}
                >
                  Insertar arriba
                </MenuItem>
                <MenuItem
                  icon={<ArrowDownIcon color="green.500" />}
                  onClick={() => onInsertAt(rowIndex + 1)}
                >
                  Insertar abajo
                </MenuItem>
                <MenuItem
                  icon={<DeleteIcon color="red.500" />}
                  onClick={handleDelete}
                  color="red.500"
                >
                  Eliminar
                </MenuItem>
              </>
            )}
          </MenuList>
        </Menu>
      </Td>
    </Tr>
  );
}, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.cantidad === nextProps.item.cantidad &&
    prevProps.item.bonif === nextProps.item.bonif &&
    prevProps.item.precioSinImp === nextProps.item.precioSinImp &&
    prevProps.item.iva === nextProps.item.iva &&
    prevProps.item.descripcion === nextProps.item.descripcion &&
    prevProps.item.descAdic === nextProps.item.descAdic &&
    prevProps.item.codigo === nextProps.item.codigo &&
    prevProps.item._recovered === nextProps.item._recovered &&
    prevProps.orden === nextProps.orden &&
    prevProps.isDisabled === nextProps.isDisabled &&
    prevProps.showIVA === nextProps.showIVA &&
    prevProps.applyDiscount === nextProps.applyDiscount
  );
});

ArticuloRow.displayName = 'ArticuloRow';

// ==================== COMPONENTE DE RECOMENDACIÓN ====================

const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0px rgba(255, 51, 51, 0.9);
  }
  70% {
    box-shadow: 0 0 0 15px rgba(255, 51, 51, 0);
  }
  100% {
    box-shadow: 0 0 0 0px rgba(255, 51, 51, 0);
  }
`;

const RecommendationRow = memo(({ item, onAdd, colors, showIVA }) => {
  const { labelColor, primaryColor, borderColor } = colors;
  const recBg = useColorModeValue("blue.50", "blue.900");
  const recHoverBg = useColorModeValue("blue.100", "blue.800");

  // Calcular precio para mostrar
  const precioMostrado = useMemo(() => {
    const base = Number(item.precioSinImp) || 0;
    const ivaVal = Math.max(0, Number(item.iva ?? 21));
    return showIVA ? base * (1 + ivaVal / 100) : base;
  }, [item.precioSinImp, item.iva, showIVA]);

  const handleAdd = useCallback(() => {
    onAdd(item);
  }, [item, onAdd]);

  return (
    <Tr
      bg={recBg}
      _hover={{ bg: recHoverBg }}
      borderBottom="1px"
      borderColor={borderColor}
      transition="backgroundColor 0.2s ease"
    >
      {/* Orden - vacío para recomendaciones */}
      <Td px={1} textAlign="center">
        <Text fontSize="sm" color={labelColor}>-</Text>
      </Td>

      {/* Código con badge de tipo de relación */}
      <Td fontWeight="500" color={primaryColor} fontSize="sm" px={2}>
        <Text fontWeight="500">{item.COD_ARTICU}</Text>
      </Td>

      {/* Descripción */}
      <Td maxW="220px" color={labelColor} fontSize="sm" px={2}>
        <Tooltip label={item.descripcion} placement="top-start">
          <Text noOfLines={2}>{item.descripcion}{item.descAdic ? " - " + item.descAdic : ""}</Text>
        </Tooltip>
      </Td>

      {/* Cantidad - vacío para recomendaciones */}
      <Td isNumeric px={2}>
        <Text fontSize="sm" color={labelColor}>-</Text>
      </Td>

      {/* Precio Unitario sin IVA */}
      <Td isNumeric px={2}>
        <Text fontSize="sm" fontWeight="500" color={primaryColor}>
          {formatCurrency(item.precioSinImp || 0)}
        </Text>
      </Td>

      {/* IVA % */}
      <Td isNumeric px={2}>
        <Text fontSize="sm" fontWeight="500" color={primaryColor}>
          {formatNumber(item.iva ?? 21)}%
        </Text>
      </Td>

      {/* Descuento - vacío para recomendaciones */}
      <Td isNumeric px={2}>
        <Text fontSize="sm" color={labelColor}>-</Text>
      </Td>

      {/* Precio mostrado */}
      <Td isNumeric fontWeight="500" color={primaryColor} fontSize="sm" px={2}>
        {formatCurrency(precioMostrado)}
        <Text fontSize="xs" color={labelColor}>
          {showIVA ? "c/IVA" : "s/IVA"}
        </Text>
      </Td>

      {/* Botón agregar */}
      <Td px={1} whiteSpace="nowrap">
        <IconButton
          size="xs"
          colorScheme="red"
          icon={<AddIcon />}
          onClick={handleAdd}
          aria-label="Agregar"
          _hover={{
            transform: "translateY(-1px)",
            boxShadow: "md"
          }}
          transition="all 0.2s"
        />
      </Td>
    </Tr>
  );
});

RecommendationRow.displayName = 'RecommendationRow';

// ==================== COMPONENTE PRINCIPAL ====================

const ArticulosTable = forwardRef(({
  articulos,
  setArticulos,
  agregarArticulo,
  eliminarArticulo,
  onArticuloChange,
  onReplaceArticle, // Nuevo: callback para reemplazar artículo
  onLimpiarCotizacion,
  isDisabled = false,
  // Nuevos props para controlar switches externamente
  showIVA: externalShowIVA,
  applyDiscount: externalApplyDiscount,
  onShowIVAChange,
  onApplyDiscountChange,
}, ref) => {
  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Estilos glass para Card
  const cardBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

  // Colores del theme
  const labelColor = isDark ? "gray.400" : "gray.600";
  const primaryColor = isDark ? "white" : "gray.800";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.16)" : "gray.200";
  const hoverBg = isDark ? "whiteAlpha.100" : "gray.50";

  // Memoizar objeto de colores para pasarlo a las filas
  const colors = useMemo(() => ({
    labelColor,
    primaryColor,
    hoverBg,
    borderColor
  }), [labelColor, primaryColor, hoverBg, borderColor]);

  // Preferencias de visualización/calculo
  const [internalShowIVA, setInternalShowIVA] = useState(true);
  const [internalApplyDiscount, setInternalApplyDiscount] = useState(true);

  const showIVA = externalShowIVA !== undefined ? externalShowIVA : internalShowIVA;
  const applyDiscount = externalApplyDiscount !== undefined ? externalApplyDiscount : internalApplyDiscount;

  const { isOpen: isGeneralStockModalOpen, onOpen: openGeneralStockModal, onClose: closeGeneralStockModal } = useDisclosure();
  const { isOpen: isArticleSearchModalOpen, onOpen: openArticleSearchModal, onClose: closeArticleSearchModal } = useDisclosure();
  const [articleToEdit, setArticleToEdit] = useState(null);
  const [insertPosition, setInsertPosition] = useState(null); // Posición donde insertar (null = al final)
  const lastInsertPositionRef = useRef(null); // Para el auto-focus después de insertar

  // ==================== KEYBOARD NAVIGATION LOGIC ====================
  const inputRefs = useRef({});
  const addButtonRef = useRef(null);

  const registerRef = useCallback((rowIndex, colKey, element) => {
    if (!element) return;
    if (!inputRefs.current[rowIndex]) inputRefs.current[rowIndex] = {};
    inputRefs.current[rowIndex][colKey] = element;
  }, []);

  const focusCell = useCallback((rowIndex, colKey) => {
    if (inputRefs.current[rowIndex] && inputRefs.current[rowIndex][colKey]) {
      inputRefs.current[rowIndex][colKey].focus();
      // Optional: Select content
      if (inputRefs.current[rowIndex][colKey].select) {
        // Small timeout to ensure focus works before selecting
        setTimeout(() => inputRefs.current[rowIndex][colKey].select(), 0);
      }
    }
  }, []);

  // Expose focus method to parent
  useImperativeHandle(ref, () => ({
    focus: () => {
      // Focus first input of last row (newly added) or first row
      const lastRowIndex = articulos.length - 1;
      if (lastRowIndex >= 0) {
        focusCell(lastRowIndex, 'cantidad');
      } else {
        // Fallback: Si no hay artículos, intentar abrir modal (implementación futura)
        handleAddNew();
      }
    }
  }));

  const handleCellKeyDown = useCallback((e, rowIndex, colKey) => {
    // Teclas de navegación
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Tab'].includes(e.key)) {
      e.preventDefault();

      const cols = ['cantidad', 'bonif']; // Columnas navegables
      const maxRows = articulos.length;
      let nextRow = rowIndex;
      let nextCol = colKey;

      switch (e.key) {
        case 'ArrowUp':
          nextRow = Math.max(0, rowIndex - 1);
          break;
        case 'ArrowDown':
          nextRow = Math.min(maxRows - 1, rowIndex + 1);
          break;
        case 'Enter':
        case 'Tab':
          if (e.shiftKey && e.key === 'Tab') { // Navegación hacia atrás con Shift+Tab
            if (colKey === 'bonif') {
              focusCell(rowIndex, 'cantidad');
              return;
            } else if (rowIndex > 0) {
              focusCell(rowIndex - 1, 'bonif');
              return;
            }
          } else { // Navegación hacia adelante con Enter o Tab
            if (colKey === 'cantidad') {
              // De Cantidad -> Bonif
              focusCell(rowIndex, 'bonif');
              return;
            } else { // colKey is 'bonif'
              // De Bonif -> SIEMPRE al botón Agregar
              if (addButtonRef.current) {
                setTimeout(() => {
                  addButtonRef.current.focus();
                  addButtonRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 50); // Small delay to ensure it runs after any re-renders
              }
              return;
            }
          }
          break;
        case 'ArrowLeft':
          { // Scope block for let
            const currentIdx = cols.indexOf(colKey);
            if (currentIdx > 0) {
              nextCol = cols[currentIdx - 1];
            }
          }
          break;
        case 'ArrowRight':
          {
            const currentIdx = cols.indexOf(colKey);
            if (currentIdx < cols.length - 1) {
              nextCol = cols[currentIdx + 1];
            }
          }
          break;
        default:
          break;
      }

      focusCell(nextRow, nextCol);
    }
  }, [articulos.length, focusCell]);

  // State for recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const lastCodeRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Estado para colapsar/expandir artículos relacionados (persistente en localStorage)
  const STORAGE_KEY = 'cotizador_relacionados_expandido';
  const [relacionadosExpandido, setRelacionadosExpandido] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved !== null ? JSON.parse(saved) : true; // Por defecto abierto
  });

  // Guardar preferencia en localStorage cuando cambia
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(relacionadosExpandido));
  }, [relacionadosExpandido]);

  const toggleRelacionados = useCallback(() => {
    setRelacionadosExpandido(prev => !prev);
  }, []);

  // Función para cargar recomendaciones de un código específico
  // El parámetro forceRefresh permite forzar la recarga incluso si es el mismo código
  const fetchRecommendationsFor = useCallback(async (codArticulo, forceRefresh = false) => {

    if (!codArticulo || isDisabled || isFetchingRef.current) {

      return;
    }

    // Evitar fetches duplicados (a menos que se fuerce la recarga)
    if (!forceRefresh && lastCodeRef.current === codArticulo) {

      return;
    }

    isFetchingRef.current = true;
    lastCodeRef.current = codArticulo;
    setIsLoadingRecommendations(true);

    try {
      const response = await fetch(ENDPOINTS.RECOMMENDATIONS(codArticulo));
      if (response.ok) {
        const data = await response.json();
        // Filter out items already in the list
        const currentCodes = articulos.map(a => a.codigo || a.articulo);
        const filtered = data.filter(rec => !currentCodes.includes(rec.COD_ARTICU));

        setRecommendations(filtered.slice(0, 5));
      } else {
        setRecommendations([]);
      }
    } catch (err) {
      console.error("Error fetching recommendations:", err);
      setRecommendations([]);
    } finally {
      isFetchingRef.current = false;
      setIsLoadingRecommendations(false);
    }
  }, [articulos, isDisabled]);

  // Observar cambios en articulos
  useEffect(() => {
    if (articulos.length === 0 || isDisabled) {
      setRecommendations([]);
      lastCodeRef.current = null;
      return;
    }

    const lastArticle = articulos[articulos.length - 1];
    const currentLastCode = lastArticle?.codigo || lastArticle?.articulo || null;



    if (currentLastCode) {
      fetchRecommendationsFor(currentLastCode);
    }
  }, [articulos, isDisabled, fetchRecommendationsFor]);

  const handleAddRecommendation = useCallback((item) => {
    // Limpiar estado de recomendaciones inmediatamente
    setRecommendations([]);

    // IMPORTANTE: Resetear lastCodeRef para que el useEffect pueda hacer fetch
    // del nuevo artículo cuando se actualice la lista
    lastCodeRef.current = null;

    // También resetear el flag de fetching para permitir nueva búsqueda
    isFetchingRef.current = false;

    // Agregar artículo - esto disparará el useEffect que observa 'articulos'
    // y automáticamente hará fetch de las recomendaciones del nuevo artículo
    agregarArticulo({
      codigo: item.COD_ARTICU,
      articulo: item.COD_ARTICU,
      descripcion: item.descripcion,
      descAdic: item.descAdic,
      cantidad: 1,
      precioSinImp: item.precioSinImp,
      iva: item.iva,
      bonif: 0,
      um: item.um || 'UN',
      codBarra: item.codBarra
    });
  }, [agregarArticulo]);

  // Callback memoizado para actualizar filas
  const updateRow = useCallback(async (id, patch) => {
    setArticulos((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const next = { ...it, ...patch };
        return next;
      })
    );

    if (onArticuloChange && (patch.cantidad !== undefined || patch.bonif !== undefined || patch.descripcion !== undefined)) {
      try {
        const cambios = {};
        if (patch.cantidad !== undefined) cambios.cantidad = patch.cantidad;
        if (patch.bonif !== undefined) cambios.descuento = patch.bonif;
        if (patch.descripcion !== undefined) cambios.descripcion = patch.descripcion;
        await onArticuloChange(id, cambios);
      } catch (error) {
        console.error('Error al actualizar artículo:', error);
      }
    }
  }, [setArticulos, onArticuloChange]);

  // Callback memoizado para editar artículo
  const handleEditArticle = useCallback((item) => {
    setArticleToEdit(item);
    openArticleSearchModal();
  }, [openArticleSearchModal]);

  const handleSelectArticle = useCallback((selected) => {
    if (articleToEdit) {
      // Reemplazando artículo existente - usar callback dedicado si existe
      if (onReplaceArticle) {
        onReplaceArticle(articleToEdit.id, selected);
      } else {
        // Fallback: actualizar localmente (sin marcar cambios)
        setArticulos((prev) =>
          prev.map((item) => (item.id === articleToEdit.id ? { ...selected, id: item.id, cantidad: item.cantidad } : item))
        );
      }
    } else {
      // Agregando nuevo artículo (con posición opcional)
      // Guardar posición para el auto-focus
      lastInsertPositionRef.current = insertPosition;
      agregarArticulo(selected, insertPosition);
    }
    setArticleToEdit(null);
    setInsertPosition(null);
  }, [articleToEdit, setArticulos, agregarArticulo, insertPosition, onReplaceArticle]);

  const handleAddNew = useCallback(() => {
    setArticleToEdit(null);
    setInsertPosition(null); // Al final
    openArticleSearchModal();
  }, [openArticleSearchModal]);

  // Insertar artículo en posición específica
  const handleInsertAt = useCallback((position) => {
    setArticleToEdit(null);
    setInsertPosition(position);
    openArticleSearchModal();
  }, [openArticleSearchModal]);

  const handleToggleIVA = useCallback((e) => {
    const newValue = e.target.checked;
    if (onShowIVAChange) {
      onShowIVAChange(newValue);
    } else {
      setInternalShowIVA(newValue);
    }
  }, [onShowIVAChange]);

  const handleToggleDiscount = useCallback((e) => {
    const newValue = e.target.checked;
    if (onApplyDiscountChange) {
      onApplyDiscountChange(newValue);
    } else {
      setInternalApplyDiscount(newValue);
    }
  }, [onApplyDiscountChange]);

  // Auto-focus logic: Cuando se agrega un artículo nuevo, enfocar su cantidad
  const prevArticulosLength = useRef(articulos.length);
  useEffect(() => {
    if (articulos.length > prevArticulosLength.current) {
      // Se agregó uno nuevo - determinar en qué posición
      const insertPos = lastInsertPositionRef.current;
      const rowToFocus = insertPos !== null ? insertPos : articulos.length - 1;
      // Pequeño timeout para asegurar que el DOM se actualizó
      setTimeout(() => {
        focusCell(rowToFocus, 'cantidad');
      }, 300);
      // Limpiar la posición de inserción
      lastInsertPositionRef.current = null;
    }
    prevArticulosLength.current = articulos.length;
  }, [articulos.length, focusCell]);

  return (
    <Card
      overflow="hidden"
      bg={cardBg}
      borderRadius="20px"
      border="2px solid"
      borderColor={cardBorderColor}
      backdropFilter={isDark ? 'blur(120px)' : 'none'}
      boxShadow={isDark ? 'none' : '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)'}
    >
      <CardBody p={0}>
        {/* Header */}
        <Flex
          align="center"
          justify="space-between"
          p={4}
          borderBottom="1px"
          borderColor="border.default"
          wrap="wrap"
          gap={2}
        >
          <HStack spacing={3}>
            <Heading size="sm">
              Artículos
            </Heading>
            <Text variant="secondary" fontSize="xs">
              ({articulos.length})
            </Text>
          </HStack>

          <HStack spacing={3}>
            <HStack spacing={1}>
              <Text variant="secondary" fontSize="xs">Con IVA</Text>
              <Switch size="sm" isChecked={showIVA} onChange={handleToggleIVA} />
            </HStack>
            <HStack spacing={1}>
              <Text variant="secondary" fontSize="xs">Aplicar desc.</Text>
              <Switch size="sm" isChecked={applyDiscount} onChange={handleToggleDiscount} />
            </HStack>

            <Divider orientation="vertical" h="24px" />

            <Button
              leftIcon={<SearchIcon />}
              colorScheme="red"
              size="sm"
              onClick={openGeneralStockModal}
              fontWeight="500"
            >
              Consultar Stock
            </Button>
          </HStack>
        </Flex>

        {/* Tabla */}
        <Box overflowX="auto">
          <Table variant="simple" size="sm">
            <Thead>
              <Tr>
                <Th px={1} w="35px" textAlign="center">#</Th>
                <Th px={2} w="130px">Artículo</Th>
                <Th px={2}>Descripción</Th>
                <Th isNumeric px={2} w="110px">Cantidad</Th>
                <Th isNumeric px={2} w="100px">P. Unitario</Th>
                <Th isNumeric px={2} w="60px">IVA %</Th>
                <Th isNumeric px={2} w="70px">Desc</Th>
                <Th isNumeric px={2} w="100px">Precio</Th>
                <Th px={1} w="30px" textAlign="center" />
              </Tr>
            </Thead>

            <Tbody>
              {articulos.length === 0 ? (
                <Tr>
                  <Td colSpan={9} textAlign="center" py={10}>
                    <VStack spacing={3}>
                      <Text variant="secondary" fontSize="md">
                        No hay artículos en esta cotización
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                articulos.map((item, index) => (
                  <ArticuloRow
                    key={`${item.id || item.codigo}-${index}`}
                    item={item}
                    isDisabled={isDisabled}
                    showIVA={showIVA}
                    applyDiscount={applyDiscount}
                    onUpdateRow={updateRow}
                    onDelete={eliminarArticulo}
                    onEditArticle={handleEditArticle}
                    onInsertAt={handleInsertAt}
                    colors={colors}
                    onKeyDown={handleCellKeyDown}
                    registerRef={registerRef}
                    rowIndex={index}
                    orden={index + 1}
                  />
                ))
              )}

              {/* Recommendations Section */}
              {isLoadingRecommendations && !isDisabled && (
                <Tr bg={useColorModeValue("blue.50", "blue.900")}>
                  <Td colSpan={9} py={4}>
                    <HStack spacing={3} justify="center">
                      <Spinner size="sm" color="blue.500" thickness="3px" speed="0.65s" />
                      <HStack spacing={2}>
                        <Icon as={FaBrain} color="blue.500" boxSize={4} />
                        <Text fontWeight="600" fontSize="sm" color={useColorModeValue("blue.700", "blue.200")}>
                          Analizando recomendaciones inteligentes...
                        </Text>
                      </HStack>
                    </HStack>
                  </Td>
                </Tr>
              )}

              {recommendations.length > 0 && !isDisabled && !isLoadingRecommendations && (
                <>
                  <Tr>
                    <Td
                      colSpan={9}
                      py={2}
                      px={3}
                      bgGradient={useColorModeValue(
                        "linear(to-r, purple.500, purple.600, pink.500)",
                        "linear(to-r, gray.700, gray.800, gray.900)"
                      )}
                      borderBottom="none"
                      cursor="pointer"
                      onClick={toggleRelacionados}
                      _hover={{ opacity: 0.95 }}
                      transition="opacity 0.2s"
                    >
                      <HStack spacing={3} justify="space-between">
                        <HStack spacing={3}>
                          <Icon as={FaMagic} color="white" boxSize={5} />
                          <Text fontWeight="bold" fontSize="md" color="white" letterSpacing="wide">
                            Artículos relacionados
                          </Text>
                          <Badge colorScheme="whiteAlpha" variant="solid" fontSize="xs">
                            {recommendations.length}
                          </Badge>
                        </HStack>
                        <IconButton
                          icon={relacionadosExpandido ? <ChevronUpIcon /> : <ChevronDownIcon />}
                          size="sm"
                          variant="ghost"
                          color="white"
                          _hover={{ bg: "whiteAlpha.200" }}
                          aria-label={relacionadosExpandido ? "Colapsar" : "Expandir"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRelacionados();
                          }}
                        />
                      </HStack>
                    </Td>
                  </Tr>
                  {relacionadosExpandido && recommendations.map((rec, index) => (
                    <RecommendationRow
                      key={rec.COD_ARTICU}
                      item={rec}
                      onAdd={handleAddRecommendation}
                      colors={colors}
                      showIVA={showIVA}
                    />
                  ))}
                </>
              )}
            </Tbody>
          </Table>
          {!isDisabled && (
            <Box p={3} borderTop="1px" borderColor={borderColor}>
              <Button
                ref={addButtonRef}
                leftIcon={<AddIcon />}
                colorScheme="red"
                size="sm"
                onClick={handleAddNew}
                width="full"
                fontWeight="500"
                _focus={{
                  animation: `${pulse} 2s infinite`,
                }}
              >
                Agregar artículo
              </Button>
            </Box>
          )}
        </Box>

        {isArticleSearchModalOpen && (
          <ArticleSearchModal
            isOpen={isArticleSearchModalOpen}
            onClose={closeArticleSearchModal}
            onSelectArticle={handleSelectArticle}
            currentArticle={articleToEdit}
          />
        )}

        {isGeneralStockModalOpen && (
          <GeneralStockModal
            isOpen={isGeneralStockModalOpen}
            onClose={closeGeneralStockModal}
            articulos={articulos}
          />
        )}
      </CardBody>
    </Card>
  );
});

export default memo(ArticulosTable);
