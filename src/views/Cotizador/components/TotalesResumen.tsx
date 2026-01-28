import {
  Box,
  Card,
  CardBody,
  Grid,
  GridItem,
  Text,
  VStack,
  HStack,
  Badge,
  Tooltip,
  useColorModeValue,
  useColorMode
} from "@chakra-ui/react";
import LeyendasCotizacion from "./LeyendasCotizacion";

// ============================================
// TIPOS
// ============================================

interface Totales {
  totalBruto?: number;
  subtotalSinIva?: number;
  bonificacionArticulos?: number;
  netoGravado?: number;
  subtotalConDescuento?: number;
  iva?: number;
  percepciones?: number;
  total?: number;
}

interface Leyendas {
  leyenda2?: string;
  leyenda3?: string;
  leyenda4?: string;
  leyenda5?: string;
}

interface CotizacionData {
  leyendas?: Leyendas;
  [key: string]: unknown;
}

interface TotalesResumenProps {
  totales: Totales;
  cotizacion: CotizacionData;
  onUpdateCotizacion?: (cotizacion: CotizacionData) => void;
  isDisabled?: boolean;
  setHasUnsavedChanges?: (value: boolean) => void;
}

// ============================================
// HELPERS
// ============================================

const formatCurrency = (value: number): string => {
  return value.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
  });
};

// ============================================
// COMPONENTE
// ============================================

const TotalesResumen = ({
  totales,
  cotizacion,
  onUpdateCotizacion,
  isDisabled = false,
  setHasUnsavedChanges
}: TotalesResumenProps) => {
  const IS_MODULE_DISABLED = false;

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Estilos glass para Card
  const cardBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

  // Colores del theme
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");

  // Handlers
  const handleUpdateLeyendas = (nuevasLeyendas: Leyendas) => {
    if (onUpdateCotizacion) {
      onUpdateCotizacion({
        ...cotizacion,
        leyendas: nuevasLeyendas
      });
    }
    if (setHasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  };

  // Valores calculados
  const totalBruto = totales.totalBruto ?? totales.subtotalSinIva ?? 0;
  const bonificacionArticulos = totales.bonificacionArticulos ?? 0;
  const netoGravado = totales.netoGravado ?? totales.subtotalConDescuento ?? 0;
  const iva = totales.iva ?? 0;
  const percepciones = totales.percepciones ?? 0;
  const total = totales.total ?? 0;

  return (
    <Box position="relative">
      {/* Contenido principal */}
      <Box
        aria-disabled={IS_MODULE_DISABLED}
        pointerEvents={IS_MODULE_DISABLED ? "none" : "auto"}
        opacity={IS_MODULE_DISABLED ? 0.6 : 1}
        filter={IS_MODULE_DISABLED ? "grayscale(0.1)" : "none"}
        transition="opacity 0.2s ease, filter 0.2s ease"
      >
        <Card
          bg={cardBg}
          borderRadius="20px"
          border="2px solid"
          borderColor={cardBorderColor}
          backdropFilter={isDark ? 'blur(120px)' : 'none'}
          boxShadow={isDark ? 'none' : '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)'}
        >
          <CardBody>
            <Text variant="label" mb={4}>
              Resumen de Totales
            </Text>

            <Grid templateColumns="1fr 400px" gap={8}>
              <GridItem>
                {/* Leyendas del Comprobante */}
                <LeyendasCotizacion
                  cotizacion={cotizacion}
                  onUpdateLeyendas={handleUpdateLeyendas}
                  isDisabled={isDisabled}
                />
              </GridItem>

              <GridItem>
                <VStack spacing={3} align="stretch">
                  {/* 1. Total Bruto */}
                  <HStack justify="space-between" py={2}>
                    <Text variant="secondary" fontSize="sm" fontWeight="500">
                      Total Bruto:
                    </Text>
                    <Text fontSize="md" fontWeight="600">
                      ${formatCurrency(totalBruto)}
                    </Text>
                  </HStack>

                  {/* 2. Descuentos por Artículo */}
                  {bonificacionArticulos > 0 && (
                    <HStack justify="space-between" py={2}>
                      <Text variant="secondary" fontSize="sm" fontWeight="500">
                        (-) Desc. Artículos:
                      </Text>
                      <Text fontSize="md" fontWeight="500" color="red.500">
                        -${formatCurrency(bonificacionArticulos)}
                      </Text>
                    </HStack>
                  )}

                  {/* Línea divisoria */}
                  <Box borderBottom="1px" borderColor={borderColor} my={1} />

                  {/* 3. Neto Gravado */}
                  <HStack justify="space-between" py={2}>
                    <Text variant="secondary" fontSize="sm" fontWeight="500">
                      Neto Gravado:
                    </Text>
                    <Text fontSize="md" fontWeight="600">
                      ${formatCurrency(netoGravado)}
                    </Text>
                  </HStack>

                  {/* 4. IVA */}
                  <HStack justify="space-between" py={2}>
                    <Text variant="secondary" fontSize="sm" fontWeight="500">
                      (+) IVA:
                    </Text>
                    <Text fontSize="md" fontWeight="500">
                      ${formatCurrency(iva)}
                    </Text>
                  </HStack>

                  {/* 5. Percepciones */}
                  {percepciones > 0 && (
                    <HStack justify="space-between" py={2}>
                      <HStack>
                        <Text variant="secondary" fontSize="sm" fontWeight="500">
                          (+) Percepciones:
                        </Text>
                        <Tooltip
                          label="Incluye percepciones provinciales según jurisdicción del cliente"
                          placement="top"
                        >
                          <Badge colorScheme="purple" fontSize="xs">
                            INFO
                          </Badge>
                        </Tooltip>
                      </HStack>
                      <Text fontSize="md" fontWeight="500" color="purple.500">
                        ${formatCurrency(percepciones)}
                      </Text>
                    </HStack>
                  )}

                  {/* Línea divisoria final */}
                  <Box borderBottom="2px" borderColor={borderColor} my={1} />

                  {/* 6. TOTAL FINAL */}
                  <HStack justify="space-between" py={3}>
                    <Text fontSize="lg" fontWeight="bold">
                      TOTAL:
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="brand.500">
                      ${formatCurrency(total)}
                    </Text>
                  </HStack>
                </VStack>
              </GridItem>
            </Grid>
          </CardBody>
        </Card>
      </Box>
    </Box>
  );
};

export default TotalesResumen;
