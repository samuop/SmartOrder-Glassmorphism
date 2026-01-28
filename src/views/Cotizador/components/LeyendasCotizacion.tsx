import { useMemo } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Textarea,
  Badge,
  Icon,
  IconButton,
  useColorModeValue,
  useColorMode,
  Tooltip
} from "@chakra-ui/react";
import { LockIcon, CloseIcon } from "@chakra-ui/icons";

// ============================================
// TIPOS
// ============================================

interface Leyendas {
  leyenda1?: string;
  leyenda2?: string;
  leyenda3?: string;
  leyenda4?: string;
  leyenda5?: string;
  _touched3?: boolean;
  _touched4?: boolean;
  _touched5?: boolean;
}

interface CotizacionData {
  numero?: string;
  numeroCotizacion?: string;
  nroCotizacion?: string;
  NRO_COTIZACION?: string;
  leyendas?: Leyendas;
  [key: string]: unknown;
}

interface LeyendasCotizacionProps {
  cotizacion: CotizacionData;
  onUpdateLeyendas?: (leyendas: Leyendas) => void;
  isDisabled?: boolean;
}

// ============================================
// CONSTANTES
// ============================================

const LEYENDAS_DEFAULT: Record<string, string> = {
  leyenda3: "Validez de la Oferta: ",
  leyenda4: "Plazo de entrega: ",
  leyenda5: "Forma de pago: "
};

// ============================================
// COMPONENTE
// ============================================

const LeyendasCotizacion = ({
  cotizacion,
  onUpdateLeyendas,
  isDisabled = false
}: LeyendasCotizacionProps) => {
  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const labelColor = isDark ? "gray.400" : "gray.600";
  const inputBg = isDark ? "navy.900" : "white";
  const borderColor = isDark ? "rgba(255, 255, 255, 0.16)" : "gray.200";
  const disabledBg = isDark ? "navy.800" : "gray.50";
  const hoverBorderColor = isDark ? "rgba(255, 255, 255, 0.24)" : "blue.300";

  // Obtener el número de cotización desde múltiples fuentes
  const numeroCotizacion = cotizacion?.numero ||
    cotizacion?.numeroCotizacion ||
    cotizacion?.nroCotizacion ||
    cotizacion?.NRO_COTIZACION || '';

  // Obtener leyendas actuales o inicializar
  const leyendas = useMemo((): Leyendas & { leyenda1: string } => {
    const base = cotizacion?.leyendas || {};
    return {
      leyenda1: `Cotización: ${numeroCotizacion}`,
      leyenda2: base.leyenda2 || '',
      leyenda3: base.leyenda3 || '',
      leyenda4: base.leyenda4 || '',
      leyenda5: base.leyenda5 || '',
      _touched3: base._touched3 || false,
      _touched4: base._touched4 || false,
      _touched5: base._touched5 || false,
    };
  }, [cotizacion?.leyendas, numeroCotizacion]);

  // Handlers
  const handleLeyendaChange = (numero: number, valor: string) => {
    if (numero === 1 || isDisabled) return;

    const nuevasLeyendas: Leyendas = {
      ...leyendas,
      [`leyenda${numero}`]: valor,
      ...(numero >= 3 && { [`_touched${numero}`]: true })
    };

    onUpdateLeyendas?.(nuevasLeyendas);
  };

  const handleLeyendaFocus = (numero: number) => {
    if (numero < 3 || numero > 5 || isDisabled) return;

    const touchedKey = `_touched${numero}` as keyof Leyendas;
    if (!leyendas[touchedKey]) {
      const nuevasLeyendas: Leyendas = {
        ...leyendas,
        [`leyenda${numero}`]: LEYENDAS_DEFAULT[`leyenda${numero}`],
        [`_touched${numero}`]: true
      };
      onUpdateLeyendas?.(nuevasLeyendas);
    }
  };

  const handleLimpiarLeyenda = (numero: number) => {
    if (isDisabled) return;

    const nuevasLeyendas: Leyendas = {
      ...leyendas,
      [`leyenda${numero}`]: '',
      [`_touched${numero}`]: false
    };
    onUpdateLeyendas?.(nuevasLeyendas);
  };

  return (
    <Box>
      <Text
        fontSize="xs"
        fontWeight="600"
        color={labelColor}
        textTransform="uppercase"
        letterSpacing="wide"
        mb={3}
      >
        Leyendas del Comprobante
      </Text>

      <VStack spacing={2} align="stretch">
        {/* Leyenda 1 - Automática */}
        <Box position="relative">
          <HStack spacing={2} mb={1}>
            <Text fontSize="xs" fontWeight="500" color={labelColor}>
              Leyenda Nº 1:
            </Text>
            <Badge size="xs" colorScheme="blue" fontSize="9px">
              Automática
            </Badge>
            <Icon as={LockIcon} w={3} h={3} color="gray.400" />
          </HStack>
          <Textarea
            value={leyendas.leyenda1}
            isReadOnly
            isDisabled
            size="sm"
            rows={1}
            fontSize="sm"
            bg={disabledBg}
            borderColor={borderColor}
            _disabled={{
              opacity: 0.7,
              cursor: "not-allowed"
            }}
          />
        </Box>

        {/* Leyenda 2 - Editable sin valor por defecto */}
        <Box>
          <HStack spacing={2} mb={1}>
            <Text fontSize="xs" fontWeight="500" color={labelColor}>
              Leyenda Nº 2:
            </Text>
          </HStack>
          <Textarea
            value={leyendas.leyenda2}
            onChange={(e) => handleLeyendaChange(2, e.target.value)}
            placeholder="Leyenda 2 (opcional)"
            isDisabled={isDisabled}
            size="sm"
            rows={1}
            fontSize="sm"
            bg={inputBg}
            borderColor={borderColor}
            _hover={{ borderColor: hoverBorderColor }}
            _focus={{
              borderColor: "blue.400",
              boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)"
            }}
            _disabled={{
              opacity: 0.6,
              cursor: "not-allowed",
              bg: disabledBg
            }}
            maxLength={200}
          />
        </Box>

        {/* Leyendas 3-5 - Editables con valores por defecto */}
        {[3, 4, 5].map((numero) => {
          const valorDefault = LEYENDAS_DEFAULT[`leyenda${numero}`];
          const touchedKey = `_touched${numero}` as keyof Leyendas;
          const leyendaKey = `leyenda${numero}` as keyof Leyendas;
          const estaTocada = leyendas[touchedKey] as boolean;
          const valorActual = (leyendas[leyendaKey] as string) || '';
          const seIncluiraEnPdf = estaTocada && valorActual.trim().length > 0;

          return (
            <Box key={numero}>
              <HStack spacing={2} mb={1}>
                <Text fontSize="xs" fontWeight="500" color={labelColor}>
                  Leyenda Nº {numero}:
                </Text>
                {seIncluiraEnPdf && (
                  <Badge size="xs" colorScheme="green" fontSize="9px">
                    Se incluirá en PDF
                  </Badge>
                )}
              </HStack>
              <HStack spacing={1}>
                <Textarea
                  value={valorActual}
                  onChange={(e) => handleLeyendaChange(numero, e.target.value)}
                  onFocus={() => handleLeyendaFocus(numero)}
                  placeholder={valorDefault}
                  isDisabled={isDisabled}
                  size="sm"
                  rows={1}
                  fontSize="sm"
                  bg={inputBg}
                  borderColor={borderColor}
                  _hover={{ borderColor: hoverBorderColor }}
                  _focus={{
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 1px var(--chakra-colors-blue-400)"
                  }}
                  _disabled={{
                    opacity: 0.6,
                    cursor: "not-allowed",
                    bg: disabledBg
                  }}
                  _placeholder={{
                    color: "gray.400",
                    fontStyle: "italic"
                  }}
                  maxLength={200}
                  flex={1}
                />
                {estaTocada && !isDisabled && (
                  <Tooltip label="Limpiar y no incluir en PDF" hasArrow placement="top">
                    <IconButton
                      icon={<CloseIcon />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      aria-label="Limpiar leyenda"
                      onClick={() => handleLimpiarLeyenda(numero)}
                    />
                  </Tooltip>
                )}
              </HStack>
            </Box>
          );
        })}
      </VStack>

      {/* Nota informativa */}
      <Text fontSize="10px" color={labelColor} mt={3} fontStyle="italic">
        Haz clic en las leyendas 3-5 para incluirlas en el PDF. Usa el botón X para quitarlas.
      </Text>
    </Box>
  );
};

export default LeyendasCotizacion;
