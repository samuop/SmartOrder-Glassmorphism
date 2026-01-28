import React from "react";
import {
  Box,
  Grid,
  GridItem,
  Text,
  Input,
  VStack,
  useColorModeValue,
  useColorMode,
} from "@chakra-ui/react";

const InformacionGeneral = ({ cotizacion, setCotizacion }) => {
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
  const inputBg = isDark ? "rgba(255, 255, 255, 0.06)" : "white";
  const accentColor = isDark ? "brand.400" : "brand.500";

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCotizacion((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <Box
      bg={cardBg}
      p={6}
      borderRadius="20px"
      border="2px solid"
      borderColor={cardBorderColor}
      backdropFilter={isDark ? 'blur(120px)' : 'none'}
      boxShadow={isDark ? 'none' : '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)'}
    >
      <Text
        fontSize="xs"
        fontWeight="600"
        color={labelColor}
        textTransform="uppercase"
        letterSpacing="wide"
        mb={4}
      >
        Información General
      </Text>
      <Grid templateColumns="repeat(4, 1fr)" gap={6}>
        <GridItem>
          <VStack align="stretch" spacing={2}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Talonario Cotización
            </Text>
            <Input
              name="talonario"
              value={cotizacion.talonario || ""}
              onChange={handleInputChange}
              size="md"
              bg={inputBg}
              borderColor={borderColor}
              _hover={{ borderColor: "gray.400" }}
              _focus={{
                borderColor: accentColor,
                boxShadow: "0 0 0 1px #4299E1",
              }}
            />
          </VStack>
        </GridItem>
        <GridItem>
          <VStack align="stretch" spacing={2}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Número
            </Text>
            <Input
              value={cotizacion.numero || ""}
              size="md"
              isReadOnly
              bg={isDark ? "rgba(255, 255, 255, 0.04)" : "gray.50"}
              fontWeight="600"
              color={primaryColor}
              borderColor={borderColor}
              cursor="not-allowed"
            />
          </VStack>
        </GridItem>
        <GridItem>
          <VStack align="stretch" spacing={2}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Fecha
            </Text>
            <Input
              name="fecha"
              value={cotizacion.fecha || ""}
              onChange={handleInputChange}
              size="md"
              type="date"
              bg={inputBg}
              borderColor={borderColor}
              _hover={{ borderColor: "gray.400" }}
              _focus={{
                borderColor: accentColor,
                boxShadow: "0 0 0 1px #4299E1",
              }}
            />
          </VStack>
        </GridItem>
        <GridItem>
          <VStack align="stretch" spacing={2}>
            <Text
              fontSize="xs"
              fontWeight="600"
              color={labelColor}
              textTransform="uppercase"
              letterSpacing="wide"
            >
              Vigencia
            </Text>
            <Input
              name="vigencia"
              value={cotizacion.vigencia || ""}
              onChange={handleInputChange}
              size="md"
              type="date"
              bg={inputBg}
              borderColor={borderColor}
              _hover={{ borderColor: "gray.400" }}
              _focus={{
                borderColor: accentColor,
                boxShadow: "0 0 0 1px #4299E1",
              }}
            />
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default InformacionGeneral;