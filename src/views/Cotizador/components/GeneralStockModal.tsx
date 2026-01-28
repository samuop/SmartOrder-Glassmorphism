import React, { useState, useEffect, useCallback, useMemo, memo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  useColorModeValue,
  useColorMode,
  Box,
  IconButton,
  Collapse,
  Spinner,
  Flex,
  Alert,
  AlertIcon,
  AlertDescription,
  Tooltip,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { ChevronDownIcon, ChevronUpIcon, WarningIcon } from "@chakra-ui/icons";

// Animación de pulso para skeleton
const pulseAnimation = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

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

// Componente StockRow - Estilo similar a ArticleSearchModal
const StockRow = memo(({ item, orden, stockData, stockMetadata, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const rowBg = useColorModeValue("white", "gray.800");
  const hoverBg = useColorModeValue("gray.50", "gray.700");
  const detailBg = useColorModeValue("gray.50", "gray.700");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "gray.600");
  const skeletonBg = useColorModeValue("gray.200", "gray.600");

  // Encontrar el stock de este artículo
  const articleStock = useMemo(() => {
    if (!stockData || stockData.length === 0) return null;
    const articleCode = (item.codigo || item.articulo || '').trim().toUpperCase();
    return stockData.find(stock => stock.codArticu?.trim().toUpperCase() === articleCode);
  }, [stockData, item.codigo, item.articulo]);

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

  const handleToggleStock = useCallback((e) => {
    e.stopPropagation();
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <Box
      bg={rowBg}
      borderRadius="lg"
      border="1px solid"
      borderColor="transparent"
      transition="all 0.2s"
      _hover={{
        borderColor: "blue.400",
        shadow: "sm",
        bg: hoverBg
      }}
    >
      <HStack spacing={2} align="center" p={2} minHeight="40px">
        {/* Número de orden */}
        <Box minW="30px" maxW="30px" textAlign="center">
          <Badge colorScheme="gray" fontSize="xs" fontWeight="bold">
            {orden}
          </Badge>
        </Box>

        {/* Botón expandir stock */}
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

        {/* Código */}
        <Box minW="110px" maxW="110px">
          <Badge colorScheme="blue" fontSize="2xs" fontFamily="mono">
            {(item.codigo || item.articulo || '').trim()}
          </Badge>
        </Box>

        {/* Descripción */}
        <Box flex="2" minW="200px">
          <Text fontSize="xs" fontWeight="medium" color={labelColor} noOfLines={1}>
            {item.descripcion || 'Sin descripción'}
          </Text>
        </Box>

        {/* Descripción Adicional */}
        <Box flex="1" minW="120px">
          <Text fontSize="2xs" color={labelColor} fontStyle="italic" noOfLines={1}>
            {item.descAdic?.trim() || '-'}
          </Text>
        </Box>

        {/* Stock resumido */}
        {articleStock ? (
          <HStack spacing={0.5} minW="280px" height="20px" align="center">
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
        ) : isLoading ? (
          <HStack spacing={0.5} minW="280px" height="20px" align="center">
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
          <Box minW="280px" height="20px" display="flex" alignItems="center">
            <Text fontSize="2xs" color="gray.400" fontStyle="italic">
              Sin datos de stock
            </Text>
          </Box>
        )}

        {/* Cantidad en cotización */}
        <Box minW="70px" maxW="70px" textAlign="right">
          <Badge colorScheme="purple" fontSize="xs" px={2} py={1}>
            {item.cantidad || 0}
          </Badge>
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
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders innecesarios
  const prevCode = (prevProps.item.codigo || prevProps.item.articulo || '').trim().toUpperCase();
  const nextCode = (nextProps.item.codigo || nextProps.item.articulo || '').trim().toUpperCase();

  const prevStock = prevProps.stockData?.find(s => s.codArticu?.trim().toUpperCase() === prevCode);
  const nextStock = nextProps.stockData?.find(s => s.codArticu?.trim().toUpperCase() === nextCode);

  return (
    prevCode === nextCode &&
    prevProps.orden === nextProps.orden &&
    prevProps.item.cantidad === nextProps.item.cantidad &&
    prevProps.isLoading === nextProps.isLoading &&
    prevStock === nextStock &&
    prevProps.stockMetadata === nextProps.stockMetadata
  );
});

StockRow.displayName = 'StockRow';

// Componente principal
const GeneralStockModal = ({ isOpen, onClose, articulos = [] }) => {
  const [stockData, setStockData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stockMetadata, setStockMetadata] = useState(null);

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Estilos glass para Modal
  const modalBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const modalBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

  const labelColor = isDark ? "gray.400" : "gray.600";
  const headerBg = isDark ? "whiteAlpha.100" : "gray.100";

  // Crear una key estable basada en los códigos de artículos (manteniendo orden)
  const articulosKey = useMemo(() => {
    return articulos.map(art => {
      return art.codigo || art.articulo || art.COD_ARTICU || art.codArticu || art.id || '';
    }).filter(Boolean).join(',');
  }, [articulos]);

  const fetchStockData = useCallback(async () => {
    if (!articulosKey) {
      setError('No se pudieron extraer códigos de artículos');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/Deposito/articulos?articulos=${encodeURIComponent(articulosKey)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.metadata) {
        setStockMetadata(data.metadata);
      }

      // Los artículos vienen en data.articulos
      const articulosStock = data.articulos || data;
      setStockData(articulosStock);
    } catch (error) {
      console.error('Error al obtener stock:', error);
      setError('No se pudo cargar el stock de los artículos');
      setStockData([]);
    } finally {
      setIsLoading(false);
    }
  }, [articulosKey]);

  // Fetch stock data cuando el modal se abre
  useEffect(() => {
    if (isOpen && articulosKey) {
      fetchStockData();
    }
  }, [isOpen, fetchStockData, articulosKey]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered motionPreset="slideInBottom">
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
            Consulta de Stock General
          </Text>
          <Text variant="secondary" fontSize="sm" mt={1}>
            Stock disponible de los artículos en la cotización
          </Text>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6} overflowY="auto">
          <VStack align="stretch" spacing={3}>
            {/* Indicador de artículos */}
            {articulos.length > 0 && (
              <HStack justify="space-between">
                <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                  {articulos.length} {articulos.length === 1 ? 'artículo' : 'artículos'} en cotización
                </Badge>
                <Button size="sm" onClick={fetchStockData} variant="ghost" isLoading={isLoading}>
                  Actualizar
                </Button>
              </HStack>
            )}

            {/* Error */}
            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Sin artículos en cotización */}
            {!isLoading && articulos.length === 0 && (
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <AlertDescription>
                  No hay artículos en la cotización para consultar stock
                </AlertDescription>
              </Alert>
            )}

            {/* Header de columnas */}
            {articulos.length > 0 && (
              <HStack
                spacing={2}
                align="center"
                px={2}
                py={2}
                bg={headerBg}
                borderRadius="lg"
                fontSize="2xs"
                fontWeight="bold"
                color={labelColor}
              >
                <Box minW="30px" maxW="30px" textAlign="center">#</Box>
                <Box minW="40px" maxW="40px" />
                <Box minW="110px" maxW="110px">Código</Box>
                <Box flex="2" minW="200px">Descripción</Box>
                <Box flex="1" minW="120px">Especificación</Box>
                <Box minW="280px">Stock por Depósito</Box>
                <Box minW="70px" maxW="70px" textAlign="right">Cantidad</Box>
              </HStack>
            )}

            {/* Lista de artículos (en el orden original de la cotización) */}
            {articulos.length > 0 && (
              <VStack spacing={1} align="stretch">
                {articulos.map((item, index) => (
                  <StockRow
                    key={`${item.codigo || item.articulo || item.id}-${index}`}
                    item={item}
                    orden={index + 1}
                    stockData={stockData}
                    stockMetadata={stockMetadata}
                    isLoading={isLoading}
                  />
                ))}
              </VStack>
            )}

            {/* Estado de carga inicial */}
            {isLoading && articulos.length === 0 && (
              <Flex justify="center" p={8}>
                <VStack>
                  <Spinner size="xl" color="blue.500" thickness="4px" />
                  <Text color={labelColor}>Consultando stock...</Text>
                </VStack>
              </Flex>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose} colorScheme="blue">
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default GeneralStockModal;
