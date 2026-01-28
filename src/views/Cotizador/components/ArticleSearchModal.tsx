import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Button,
  ButtonGroup,
  Text,
  VStack,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  useColorModeValue,
  useColorMode,
  Box,
  Spinner,
  Flex,
  Badge,
  Icon,
  Select,
  Kbd,
  Tooltip,
  IconButton,
  Collapse,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { SearchIcon, CloseIcon, ChevronDownIcon, ChevronUpIcon, WarningIcon } from "@chakra-ui/icons";
import { FaBrain, FaDatabase, FaMagic, FaBarcode } from "react-icons/fa";

// Animación de pulso para skeleton
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Modos de búsqueda disponibles
const SEARCH_MODES = {
  //unified: { label: 'Automático', icon: FaMagic, color: 'green' },
  code: { label: 'Por Código', icon: FaBarcode, color: 'blue' },
  description: { label: 'Por Descripción', icon: FaDatabase, color: 'cyan' },
  //rag: { label: 'Neural (IA)', icon: FaBrain, color: 'purple' }
};

// Componente StockDetail - Muestra stock por bobina en formato compacto
const StockDetail = ({ stocks, title }) => {
  const titleColor = useColorModeValue("gray.700", "gray.300");

  if (!stocks || stocks.length === 0) return null;

  return (
    <Box>
      <Text fontWeight="bold" fontSize="xs" mb={2} color={titleColor}>
        {title}
      </Text>
      <HStack spacing={1} wrap="wrap">
        {stocks.map((stock, idx) => {
          const hasStock = stock.canSto > 0;
          return (
            <Badge
              key={idx}
              colorScheme={hasStock ? 'blue' : 'gray'}
              variant={hasStock ? 'solid' : 'outline'}
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="full"
              fontWeight="semibold"
            >
              {stock.bobina}: {Math.floor(stock.canSto)}
            </Badge>
          );
        })}
      </HStack>
    </Box>
  );
};

// Helper para obtener el estado de un depósito específico
function getDepositoStatus(metadata, nombreDeposito) {
  if (!metadata || !metadata[nombreDeposito]) {
    return { hasError: false, message: null };
  }

  const info = metadata[nombreDeposito];
  return {
    hasError: info.status === 'error',
    message: info.error || null
  };
}

// Componente de fila de artículo - Memoizado para evitar re-renders innecesarios
const ArticleRow = memo(({ article, onSelect, isSelected, borderColor, labelColor, stockData, stockMetadata, onVisible }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const rowRef = useRef(null);
  const hasBeenVisibleRef = useRef(false); // Usar ref en lugar de state
  const [, forceUpdate] = useState(0); // Para forzar re-render cuando llegue el stock
  const rowBg = useColorModeValue("white", "gray.800");
  const selectedBg = useColorModeValue("blue.50", "blue.900"); // Fondo claro cuando está seleccionado
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const detailBg = useColorModeValue("gray.50", "gray.700");
  const skeletonBg = useColorModeValue("gray.200", "gray.600");

  // Auto-scroll cuando se selecciona
  useEffect(() => {
    if (isSelected && rowRef.current) {
      rowRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [isSelected]);

  // Intersection Observer para detectar cuando el artículo es visible
  useEffect(() => {
    if (!rowRef.current) return;

    const currentRow = rowRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Usar ref para evitar problemas de closure
          if (entry.isIntersecting && !hasBeenVisibleRef.current) {
            hasBeenVisibleRef.current = true;
            onVisible(article.COD_ARTICU.trim());
            forceUpdate(n => n + 1); // Forzar re-render para mostrar skeleton
          }
        });
      },
      {
        root: null,
        rootMargin: '100px', // Pre-cargar cuando está a 100px de ser visible
        threshold: 0.1
      }
    );

    observer.observe(currentRow);

    return () => {
      if (currentRow) {
        observer.unobserve(currentRow);
      }
    };
  }, [article.COD_ARTICU, onVisible]); // Removido hasBeenVisible de dependencias

  // Encontrar el stock de este artículo
  const articleStock = useMemo(() => {
    if (!stockData || stockData.length === 0) return null;
    const articleCode = article.COD_ARTICU.trim().toUpperCase();
    return stockData.find(stock => stock.codArticu?.trim().toUpperCase() === articleCode);
  }, [stockData, article.COD_ARTICU]);

  // Verificar si tiene detalles de stock
  const hasStockDetails = useMemo(() => {
    if (!articleStock) return false;
    return (
      articleStock.stocks_CC?.length > 0 ||
      articleStock.stocks_CDU?.length > 0 ||
      articleStock.stocks_CDR?.length > 0 ||
      articleStock.stocks_PSS?.length > 0
    );
  }, [articleStock]);

  // Memoizar el precio formateado
  const formattedPrice = useMemo(() =>
    (Number(article.precio) || 0).toLocaleString("es-AR", { minimumFractionDigits: 2 }),
    [article.precio]
  );

  // Handler para expandir stock
  const handleToggleStock = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  // Handler de click en la fila
  const handleClick = useCallback(() => {
    onSelect(article);
  }, [article, onSelect]);

  return (
    <>
      <Box
        ref={rowRef}
        bg={isSelected ? selectedBg : rowBg}
        borderRadius="lg"
        border="1px solid"
        borderColor={isSelected ? "blue.500" : "transparent"}
        borderWidth={isSelected ? "2px" : "1px"}
        transition="all 0.2s"
        _hover={{
          borderColor: "green.400",
          shadow: "sm",
          bg: !isSelected && hoverBg
        }}
        position="relative"
        zIndex={isSelected ? 1 : 0}
      >
        <HStack spacing={2} align="center" p={2} height="36px" cursor="pointer" onClick={handleClick}>
          {/* Botón expandir stock - Siempre reservar espacio */}
          <Box minW="40px" maxW="40px">
            {articleStock && (
              <IconButton
                aria-label="Ver stock"
                icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                size="sm"
                variant="ghost"
                colorScheme={hasStockDetails ? "blue" : "gray"}
                onClick={handleToggleStock}
                isDisabled={!hasStockDetails}
              />
            )}
          </Box>

          {/* Columna 1: Código */}
          <Box minW="100px" maxW="100px">
            <Badge colorScheme="blue" fontSize="2xs" fontFamily="mono">
              {article.COD_ARTICU.trim()}
            </Badge>
          </Box>

          {/* Columna 2: Descripción */}
          <Box flex="2" minW="200px">
            <Text fontSize="xs" fontWeight="medium" color={labelColor} noOfLines={1}>
              {article.descripcion}
            </Text>
          </Box>

          {/* Columna 3: Descripción Adicional */}
          <Box flex="1.5" minW="150px">
            <Text fontSize="2xs" color={labelColor} fontStyle="italic" noOfLines={1}>
              {article.descAdic && article.descAdic.trim() ? article.descAdic.trim() : '-'}
            </Text>
          </Box>

          {/* Columna 4: Stock resumido */}
          {articleStock ? (
            <HStack spacing={0.5} minW="250px" height="20px" align="center">
              {/* CDU */}
              <Tooltip
                label={getDepositoStatus(stockMetadata, 'CDU').hasError ? getDepositoStatus(stockMetadata, 'CDU').message : ''}
                hasArrow
                placement="top"
                bg="orange.600"
                isDisabled={!getDepositoStatus(stockMetadata, 'CDU').hasError}
              >
                <Badge
                  colorScheme={getDepositoStatus(stockMetadata, 'CDU').hasError ? 'orange' : (articleStock.STOCK_CDU > 0 ? 'green' : 'red')}
                  fontSize="xs"
                  px={1.5}
                  py={0.5}
                  variant={getDepositoStatus(stockMetadata, 'CDU').hasError ? 'outline' : 'solid'}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {getDepositoStatus(stockMetadata, 'CDU').hasError && <WarningIcon boxSize={2} />}
                  CDU: {Math.floor(articleStock.STOCK_CDU || 0)} P: {articleStock.PEND_CDU || 0}
                </Badge>
              </Tooltip>

              {/* CC */}
              <Tooltip
                label={getDepositoStatus(stockMetadata, 'CC').hasError ? getDepositoStatus(stockMetadata, 'CC').message : ''}
                hasArrow
                placement="top"
                bg="orange.600"
                isDisabled={!getDepositoStatus(stockMetadata, 'CC').hasError}
              >
                <Badge
                  colorScheme={getDepositoStatus(stockMetadata, 'CC').hasError ? 'orange' : (articleStock.STOCK_CC > 0 ? 'green' : 'red')}
                  fontSize="xs"
                  px={1.5}
                  py={0.5}
                  variant={getDepositoStatus(stockMetadata, 'CC').hasError ? 'outline' : 'solid'}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {getDepositoStatus(stockMetadata, 'CC').hasError && <WarningIcon boxSize={2} />}
                  CC: {Math.floor(articleStock.STOCK_CC || 0)} P: {articleStock.PEND_CC || 0}
                </Badge>
              </Tooltip>

              {/* CDR */}
              <Tooltip
                label={getDepositoStatus(stockMetadata, 'CDR').hasError ? getDepositoStatus(stockMetadata, 'CDR').message : ''}
                hasArrow
                placement="top"
                bg="orange.600"
                isDisabled={!getDepositoStatus(stockMetadata, 'CDR').hasError}
              >
                <Badge
                  colorScheme={getDepositoStatus(stockMetadata, 'CDR').hasError ? 'orange' : (articleStock.STOCK_CDR > 0 ? 'green' : 'red')}
                  fontSize="xs"
                  px={1.5}
                  py={0.5}
                  variant={getDepositoStatus(stockMetadata, 'CDR').hasError ? 'outline' : 'solid'}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {getDepositoStatus(stockMetadata, 'CDR').hasError && <WarningIcon boxSize={2} />}
                  CDR: {Math.floor(articleStock.STOCK_CDR || 0)} P: {articleStock.PEND_CDR || 0}
                </Badge>
              </Tooltip>

              {/* PSS */}
              <Tooltip
                label={getDepositoStatus(stockMetadata, 'PSS').hasError ? getDepositoStatus(stockMetadata, 'PSS').message : ''}
                hasArrow
                placement="top"
                bg="orange.600"
                isDisabled={!getDepositoStatus(stockMetadata, 'PSS').hasError}
              >
                <Badge
                  colorScheme={getDepositoStatus(stockMetadata, 'PSS').hasError ? 'orange' : (articleStock.STOCK_PSS > 0 ? 'green' : 'red')}
                  fontSize="xs"
                  px={1.5}
                  py={0.5}
                  variant={getDepositoStatus(stockMetadata, 'PSS').hasError ? 'outline' : 'solid'}
                  display="flex"
                  alignItems="center"
                  gap={1}
                >
                  {getDepositoStatus(stockMetadata, 'PSS').hasError && <WarningIcon boxSize={2} />}
                  PSS: {Math.floor(articleStock.STOCK_PSS || 0)} P: {articleStock.PEND_PSS || 0}
                </Badge>
              </Tooltip>
            </HStack>
          ) : hasBeenVisibleRef.current ? (
            <HStack spacing={0.5} minW="250px" height="20px" align="center">
              <Box
                height="16px"
                width="65px"
                bg={skeletonBg}
                borderRadius="md"
                animation={`${pulseAnimation} 1.5s ease-in-out infinite`}
              />
              <Box
                height="16px"
                width="55px"
                bg={skeletonBg}
                borderRadius="md"
                animation={`${pulseAnimation} 1.5s ease-in-out infinite`}
              />
              <Box
                height="16px"
                width="60px"
                bg={skeletonBg}
                borderRadius="md"
                animation={`${pulseAnimation} 1.5s ease-in-out infinite`}
              />
              <Box
                height="16px"
                width="60px"
                bg={skeletonBg}
                borderRadius="md"
                animation={`${pulseAnimation} 1.5s ease-in-out infinite`}
              />
            </HStack>
          ) : (
            <Box minW="250px" height="20px" display="flex" alignItems="center">
              <Text fontSize="2xs" color="gray.400" fontStyle="italic">
                -
              </Text>
            </Box>
          )}

          {/* Columna 5: Precio */}
          <Box minW="100px" maxW="100px" textAlign="right">
            <Text fontWeight="bold" color="green.500" fontSize="xs">
              ${formattedPrice}
            </Text>
          </Box>
        </HStack>

        {/* Detalle de stock expandible */}
        {articleStock && hasStockDetails && (
          <Collapse in={isExpanded} animateOpacity>
            <Box p={4} bg={detailBg} borderTopWidth="1px" borderColor={borderColor}>
              <VStack align="stretch" spacing={3}>
                <StockDetail stocks={articleStock.stocks_CDU} title="Detalle Stock CDU" />
                <StockDetail stocks={articleStock.stocks_CC} title="Detalle Stock CC" />
                <StockDetail stocks={articleStock.stocks_CDR} title="Detalle Stock CDR" />
                <StockDetail stocks={articleStock.stocks_PSS} title="Detalle Stock PSS" />
              </VStack>
            </Box>
          </Collapse>
        )}
      </Box>
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison: solo re-renderizar si cambian estas props
  // Para stockData, comparamos solo si el stock de ESTE artículo cambió
  const prevArticleStock = prevProps.stockData?.find(s => s.codArticu?.trim().toUpperCase() === prevProps.article.COD_ARTICU.trim().toUpperCase());
  const nextArticleStock = nextProps.stockData?.find(s => s.codArticu?.trim().toUpperCase() === nextProps.article.COD_ARTICU.trim().toUpperCase());
  const stockChanged = prevArticleStock !== nextArticleStock;

  return prevProps.article.COD_ARTICU === nextProps.article.COD_ARTICU &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.labelColor === nextProps.labelColor &&
    !stockChanged &&
    prevProps.stockMetadata === nextProps.stockMetadata &&
    prevProps.onVisible === nextProps.onVisible;
});

const ArticleSearchModal = ({ isOpen, onClose, onSelectArticle, currentArticle = null }) => {
  // Cargar preferencias guardadas del localStorage
  const getSavedPreference = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(`articleSearch_${key}`);
      return saved !== null ? JSON.parse(saved) : defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const [searchTerm, setSearchTerm] = useState(currentArticle ? currentArticle.articulo : "");
  const [searchResults, setSearchResults] = useState(() => getSavedPreference('lastResults', []));
  const [lastSearchTerm, setLastSearchTerm] = useState(() => getSavedPreference('lastSearchTerm', ''));
  const [isLoading, setIsLoading] = useState(false);
  const [searchSource, setSearchSource] = useState(() => getSavedPreference('lastSource', null));
  const [searchMode, setSearchMode] = useState(() => {
    const saved = getSavedPreference('searchMode', 'code');
    // Asegurarse de que el modo guardado existe realmente en SEARCH_MODES
    return SEARCH_MODES[saved] ? saved : 'code';
  });
  const [maxResults, setMaxResults] = useState(() => getSavedPreference('maxResults', 50));
  const [stockData, setStockData] = useState([]);
  const [isLoadingStock, setIsLoadingStock] = useState(false);
  const [stockMetadata, setStockMetadata] = useState(null);
  const [hayErroresStock, setHayErroresStock] = useState(false);
  const [depositosFallidosStock, setDepositosFallidosStock] = useState([]);

  // Estado para navegación por teclado
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const resultsContainerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Sistema de batching para cargar stock
  const stockBatchQueue = useRef(new Set());
  const stockBatchTimer = useRef(null);
  const stockCache = useRef(new Map()); // Caché de stock ya consultado
  const inFlightArticles = useRef(new Set()); // Artículos actualmente en proceso de fetch
  const isProcessingBatch = useRef(false); // Flag para evitar procesamiento concurrente
  const maxBatchSize = useRef(15); // Procesar máximo 15 artículos por batch
  const stockCacheTimestamp = useRef(null); // Timestamp de la última actualización del caché
  const stockCacheMaxAge = useRef(60000); // 1 minuto en milisegundos

  // Guardar preferencias cuando cambian
  useEffect(() => {
    localStorage.setItem('articleSearch_searchMode', JSON.stringify(searchMode));
  }, [searchMode]);

  useEffect(() => {
    localStorage.setItem('articleSearch_maxResults', JSON.stringify(maxResults));
  }, [maxResults]);

  // Guardar últimos resultados de búsqueda
  useEffect(() => {
    if (searchResults.length > 0) {
      localStorage.setItem('articleSearch_lastResults', JSON.stringify(searchResults));
      localStorage.setItem('articleSearch_lastSearchTerm', JSON.stringify(lastSearchTerm));
      localStorage.setItem('articleSearch_lastSource', JSON.stringify(searchSource));
    }
  }, [searchResults, lastSearchTerm, searchSource]);

  useEffect(() => {
    if (isOpen && currentArticle) {
      setSearchTerm(currentArticle.articulo);
    }
  }, [currentArticle, isOpen]);

  // Verificar edad del caché de stock cuando se abre el modal
  useEffect(() => {
    if (isOpen && stockCacheTimestamp.current) {
      const now = Date.now();
      const cacheAge = now - stockCacheTimestamp.current;

      // Si el caché tiene más de 1 minuto, limpiarlo
      if (cacheAge > stockCacheMaxAge.current) {
        stockCache.current.clear();
        setStockData([]);
        stockCacheTimestamp.current = null;
      }
    }
  }, [isOpen]);

  // NO resetear al cerrar - mantener resultados guardados
  // useEffect(() => {
  //   if (!isOpen) {
  //     setSearchResults([]);
  //     setSearchSource(null);
  //   }
  // }, [isOpen]);

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Estilos glass para Modal
  const modalBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const modalBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

  // Colores
  const labelColor = isDark ? "gray.400" : "gray.600";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.16)" : "gray.200";
  const inputBg = isDark ? "rgba(255, 255, 255, 0.06)" : "white";

  // Función para procesar el batch de artículos y cargar su stock
  const processBatch = useCallback(async () => {
    // Si ya estamos procesando, salir
    if (isProcessingBatch.current) return;

    if (stockBatchQueue.current.size === 0) return;

    // Marcar que estamos procesando
    isProcessingBatch.current = true;

    // Filtrar artículos que no están en caché Y no están en proceso de fetch
    const allArticlesToFetch = Array.from(stockBatchQueue.current).filter(
      codArticu => {
        const normalized = codArticu.toUpperCase();
        return !stockCache.current.has(normalized) && !inFlightArticles.current.has(normalized);
      }
    );

    if (allArticlesToFetch.length === 0) {
      stockBatchQueue.current.clear();
      isProcessingBatch.current = false;
      return;
    }

    // Procesar solo los primeros N artículos del batch
    const articlesToFetch = allArticlesToFetch.slice(0, maxBatchSize.current);

    // Remover de la cola y marcar como "en vuelo"
    articlesToFetch.forEach(art => {
      stockBatchQueue.current.delete(art);
      inFlightArticles.current.add(art.toUpperCase());
    });

    setIsLoadingStock(true);
    try {
      const articulosKey = articlesToFetch.join(',');
      const response = await fetch(`/Deposito/articulos?articulos=${encodeURIComponent(articulosKey)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Capturar metadata de depósitos
      if (data.metadata) {

        setStockMetadata(data.metadata);
        setHayErroresStock(data.hayErrores || false);
        setDepositosFallidosStock(data.depositosFallidos || []);
      }

      // Los artículos ahora vienen en data.articulos
      const articulos = data.articulos || data;

      // Agregar al caché los artículos que SÍ tienen stock
      articulos.forEach(stockItem => {
        const codArticu = stockItem.codArticu?.trim().toUpperCase();
        if (codArticu) {
          stockCache.current.set(codArticu, stockItem);
        }
      });

      // IMPORTANTE: Marcar como "consultado pero sin stock" los artículos que no vinieron en la respuesta
      const codigosConStock = new Set(articulos.map(item => item.codArticu?.trim().toUpperCase()).filter(Boolean));
      articlesToFetch.forEach(codArticu => {
        const codArticuNormalized = codArticu.toUpperCase();
        if (!codigosConStock.has(codArticuNormalized)) {
          // Crear un objeto vacío para indicar que se consultó pero no hay stock
          stockCache.current.set(codArticuNormalized, {
            codArticu: codArticu,
            STOCK_CDU: 0,
            STOCK_CC: 0,
            STOCK_CDR: 0,
            STOCK_PSS: 0,
            stocks_CDU: [],
            stocks_CC: [],
            stocks_CDR: [],
            stocks_PSS: []
          });
        }
      });

      // Actualizar el estado con todos los datos en caché
      setStockData(Array.from(stockCache.current.values()));

      // Actualizar timestamp del caché
      stockCacheTimestamp.current = Date.now();
    } catch (error) {
      console.error('Error al obtener stock:', error);

      // En caso de error, marcar todos como "sin stock" para evitar quedarse cargando
      articlesToFetch.forEach(codArticu => {
        const codArticuNormalized = codArticu.toUpperCase();
        if (!stockCache.current.has(codArticuNormalized)) {
          stockCache.current.set(codArticuNormalized, {
            codArticu: codArticu,
            STOCK_CDU: 0,
            STOCK_CC: 0,
            STOCK_CDR: 0,
            STOCK_PSS: 0,
            stocks_CDU: [],
            stocks_CC: [],
            stocks_CDR: [],
            stocks_PSS: []
          });
        }
      });
      setStockData(Array.from(stockCache.current.values()));

      // Actualizar timestamp del caché también en caso de error
      stockCacheTimestamp.current = Date.now();
    } finally {
      // Limpiar artículos de inFlightArticles
      articlesToFetch.forEach(art => {
        inFlightArticles.current.delete(art.toUpperCase());
      });

      setIsLoadingStock(false);
      isProcessingBatch.current = false;

      // Si aún quedan artículos en la cola, programar otro batch
      if (stockBatchQueue.current.size > 0) {
        stockBatchTimer.current = setTimeout(() => {
          processBatch();
        }, 100); // Esperar solo 100ms antes del siguiente batch
      }
    }
  }, []);

  // Handler para cuando un artículo se hace visible
  const handleArticleVisible = useCallback((codArticu) => {
    const codArticuNormalized = codArticu.toUpperCase();

    // Si ya está en caché o en proceso de fetch, no hacer nada
    if (stockCache.current.has(codArticuNormalized)) return;
    if (inFlightArticles.current.has(codArticuNormalized)) return;

    // Agregar a la cola de batch (normalizado para evitar duplicados por case)
    stockBatchQueue.current.add(codArticuNormalized);

    // Si ya hay un batch procesándose, no hacer nada - se procesará automáticamente después
    if (isProcessingBatch.current) return;

    // Cancelar timer anterior si existe
    if (stockBatchTimer.current) {
      clearTimeout(stockBatchTimer.current);
    }

    // Crear nuevo timer para procesar el batch después de 300ms
    stockBatchTimer.current = setTimeout(() => {
      processBatch();
    }, 300);
  }, [processBatch]);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (stockBatchTimer.current) {
        clearTimeout(stockBatchTimer.current);
      }
    };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setSearchSource(null);

    // Limpiar stock anterior y caché
    setStockData([]);
    setStockMetadata(null);
    setHayErroresStock(false);
    setDepositosFallidosStock([]);
    stockCache.current.clear();
    stockBatchQueue.current.clear();
    isProcessingBatch.current = false;
    stockCacheTimestamp.current = null;
    if (stockBatchTimer.current) {
      clearTimeout(stockBatchTimer.current);
    }

    try {
      const params = new URLSearchParams({
        code: searchTerm,
        limit: maxResults.toString(),
        mode: searchMode,
      });

      const response = await fetch(`/Cotizador/articles/search?${params.toString()}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setSearchResults(data);
      setSelectedIndex(-1); // Reset selection
      setLastSearchTerm(searchTerm); // Guardar el término buscado

      if (data.length > 0 && data[0].fuenteBusqueda) {
        setSearchSource(data[0].fuenteBusqueda);
      }

      // El stock se cargará automáticamente cuando los ArticleRow se hagan visibles
    } catch (error) {
      console.error("Error al buscar artículos:", error);
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, maxResults, searchMode]);

  const handleSelect = useCallback((article) => {

    onSelectArticle({
      id: article.COD_ARTICU.trim(),
      articulo: article.COD_ARTICU.trim(),
      descripcion: article.descripcion,
      descAdic: article.descAdic,
      sinonimo: article.sinonimo,
      precioSinImp: Number(article.precioSinImp) || 0,
      precioFinal: Number(article.precio) || 0,
      iva: Number(article.iva) || 0,
      codBarra: article.codBarra,
      um: article.um || "UN",
      bonif: 0,
      cantidad: 1,
    });
    onClose();
  }, [onSelectArticle, onClose]);

  const currentModeInfo = SEARCH_MODES[searchMode];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      isCentered
      motionPreset="slideInBottom"
    >
      <ModalOverlay />
      <ModalContent
        mx="auto"
        my="auto"
        maxW="95vw"
        maxH="90vh"
        overflow="hidden"
        bg={modalBg}
        borderRadius="20px"
        border="2px solid"
        borderColor={modalBorderColor}
        backdropFilter={isDark ? 'blur(120px)' : 'none'}
        boxShadow={isDark ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)' : '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)'}
      >
        <ModalHeader pb={2}>
          <Text fontSize="xl" fontWeight="bold">
            {currentArticle ? "Cambiar Artículo" : "Buscar Artículo"}
          </Text>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6} overflowY="auto">
          <VStack spacing={4} align="stretch">
            {/* Barra de búsqueda compacta */}
            <HStack spacing={3} flexWrap="wrap">
              <InputGroup size="lg" flex={1} minW="250px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="blue.500" />
                </InputLeftElement>
                <Input
                  ref={searchInputRef}
                  placeholder="Buscar artículo..."
                  autoFocus
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  bg={inputBg}
                  borderRadius="xl"
                  focusBorderColor="blue.400"
                  pr={searchTerm ? "40px" : "16px"}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                    } else if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
                        handleSelect(searchResults[selectedIndex]);
                        return; // Avoid triggering search again
                      } else {
                        handleSearch();
                      }
                    }
                  }}
                />
                {searchTerm && (
                  <InputRightElement>
                    <CloseIcon
                      color="gray.400"
                      boxSize={3}
                      cursor="pointer"
                      onClick={() => setSearchTerm("")}
                      _hover={{ color: "gray.600" }}
                    />
                  </InputRightElement>
                )}
              </InputGroup>

              {/* Botones de modo de búsqueda - 1 click para cambiar */}
              <ButtonGroup size="md" isAttached variant="outline" borderRadius="xl">
                {Object.entries(SEARCH_MODES).map(([key, mode]) => (
                  <Tooltip key={key} label={mode.label} placement="top" hasArrow>
                    <Button
                      onClick={() => setSearchMode(key)}
                      colorScheme={searchMode === key ? mode.color : 'gray'}
                      variant={searchMode === key ? 'solid' : 'outline'}
                      borderRadius="xl"
                      px={3}
                    >
                      <Icon as={mode.icon} boxSize={4} />
                    </Button>
                  </Tooltip>
                ))}
              </ButtonGroup>

              <Select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                size="lg"
                w="90px"
                borderRadius="xl"
                bg={inputBg}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={250}>250</option>
                <option value={500}>500</option>
              </Select>

              <Button
                onClick={handleSearch}
                colorScheme="blue"
                size="lg"
                px={8}
                borderRadius="xl"
                isLoading={isLoading}
              >
                Buscar
              </Button>
            </HStack>

            {/* Info de resultados */}
            {searchResults.length > 0 && (
              <HStack justify="space-between" px={1}>
                <HStack spacing={2}>
                  <Badge colorScheme={currentModeInfo?.color || 'blue'} variant="subtle" px={2} py={1} borderRadius="md">
                    <HStack spacing={1}>
                      <Icon as={currentModeInfo?.icon || SearchIcon} boxSize={3} />
                      <Text>{currentModeInfo?.label || 'Búsqueda'}</Text>
                    </HStack>
                  </Badge>
                  {searchSource && (
                    <Badge
                      colorScheme={searchSource === 'rag' ? 'purple' : 'blue'}
                      variant="solid"
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      <HStack spacing={1}>
                        <Icon as={searchSource === 'rag' ? FaBrain : FaDatabase} boxSize={3} />
                        <Text>{searchSource === 'rag' ? 'Neural' : 'SQL'}</Text>
                      </HStack>
                    </Badge>
                  )}
                  {isLoadingStock && (
                    <Badge colorScheme="orange" variant="subtle" px={2} py={1} borderRadius="md">
                      <HStack spacing={1}>
                        <Spinner size="xs" />
                        <Text>Cargando stock...</Text>
                      </HStack>
                    </Badge>
                  )}
                  {lastSearchTerm && (
                    <Text fontSize="sm" color={labelColor} fontStyle="italic">
                      "{lastSearchTerm}"
                    </Text>
                  )}
                </HStack>
                <HStack spacing={2}>
                  <Text fontSize="sm" color={labelColor}>
                    {searchResults.length} resultado{searchResults.length !== 1 ? 's' : ''}
                  </Text>
                  {searchResults.length > 0 && (
                    <Button
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => {
                        setSearchResults([]);
                        setLastSearchTerm('');
                        setSearchSource(null);
                        setStockData([]);
                        setStockMetadata(null);
                        setHayErroresStock(false);
                        setDepositosFallidosStock([]);
                        stockCache.current.clear();
                        stockBatchQueue.current.clear();
                        isProcessingBatch.current = false;
                        stockCacheTimestamp.current = null;
                        if (stockBatchTimer.current) {
                          clearTimeout(stockBatchTimer.current);
                        }
                        localStorage.removeItem('articleSearch_lastResults');
                        localStorage.removeItem('articleSearch_lastSearchTerm');
                        localStorage.removeItem('articleSearch_lastSource');
                      }}
                    >
                      Limpiar
                    </Button>
                  )}
                </HStack>
              </HStack>
            )}

            {/* Resultados en lista */}
            {isLoading ? (
              <Flex justify="center" align="center" py={12}>
                <VStack spacing={3}>
                  <Spinner size="xl" color="blue.500" thickness="4px" />
                  <Text color={labelColor}>Buscando artículos...</Text>
                </VStack>
              </Flex>
            ) : searchResults.length > 0 ? (
              <VStack spacing={1} align="stretch">
                {/* Header de columnas */}
                <HStack
                  spacing={2}
                  align="center"
                  px={2}
                  py={1}
                  bg={useColorModeValue("gray.100", "gray.700")}
                  borderRadius="lg"
                  fontSize="2xs"
                  fontWeight="bold"
                  color={labelColor}
                >
                  {/* Espacio para botón expandir */}
                  <Box minW="40px" maxW="40px" />

                  {/* Columna 1: Código */}
                  <Box minW="100px" maxW="100px">
                    Código
                  </Box>

                  {/* Columna 2: Descripción */}
                  <Box flex="2" minW="200px">
                    Descripción
                  </Box>

                  {/* Columna 3: Descripción Adicional */}
                  <Box flex="1.5" minW="150px">
                    Descripción Adic
                  </Box>

                  {/* Columna 4: Stock */}
                  <Box minW="250px">
                    Stock
                  </Box>

                  {/* Columna 5: Precio */}
                  <Box minW="100px" maxW="100px" textAlign="right">
                    Precio/IVA
                  </Box>
                </HStack>

                {searchResults.map((article, index) => (
                  <ArticleRow
                    key={article.COD_ARTICU}
                    article={article}
                    onSelect={handleSelect}
                    isSelected={index === selectedIndex}
                    borderColor={borderColor}
                    labelColor={labelColor}
                    stockData={stockData}
                    stockMetadata={stockMetadata}
                    onVisible={handleArticleVisible}
                  />
                ))}
              </VStack>
            ) : searchTerm && !isLoading ? (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={12}
                bg={useColorModeValue("gray.50", "gray.800")}
                borderRadius="xl"
              >
                <Icon as={SearchIcon} boxSize={10} color="gray.400" mb={3} />
                <Text color={labelColor} fontSize="lg" mb={1}>No se encontraron artículos</Text>
                <Text color={labelColor} fontSize="sm">
                  Prueba con otros términos o cambia el modo de búsqueda
                </Text>
              </Flex>
            ) : (
              <Flex
                direction="column"
                align="center"
                justify="center"
                py={12}
                bg={useColorModeValue("gray.50", "gray.800")}
                borderRadius="xl"
              >
                <Icon as={SearchIcon} boxSize={10} color="gray.300" mb={3} />
                <Text color={labelColor} fontSize="lg" mb={2}>
                  Escribe para buscar artículos
                </Text>
                <HStack spacing={1} color={labelColor} fontSize="sm">
                  <Text>Presiona</Text>
                  <Kbd>Enter</Kbd>
                  <Text>para buscar</Text>
                </HStack>
              </Flex>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ArticleSearchModal;
