import React, { useMemo } from "react";
import {
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  InputGroup,
  InputRightElement,
  Select,
  Badge,
  Spinner,
  HStack,
  Text,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { InfoIcon, WarningIcon } from "@chakra-ui/icons";
import { TIPO_DOC_CODES, CATEGORIAS_IVA, DESCRIPCION_CATEGORIAS_IVA, DNI_GENERICO_DEFAULT } from "../constants/catalogos";
import { esDniGenerico, normalizarDocumento } from "../utils/validaciones";

const SeccionDatosBasicos = ({
  formData,
  errors,
  isCheckingCuit,
  handleChange,
  handleCuitChange,
  tiposDocumento = [],
  isLoadingTiposDocumento = false,
}) => {
  const inputBg = useColorModeValue("white", "#1a202c");
  const warningColor = useColorModeValue("orange.600", "orange.300");

  // Determinar si el DNI es vacío o genérico
  const dniStatus = useMemo(() => {
    const dniValue = formData.dniCuit?.trim() || '';
    if (!dniValue) {
      return { isEmpty: true, isGeneric: false, message: `Sin documento - se usará ${DNI_GENERICO_DEFAULT}` };
    }
    if (esDniGenerico(dniValue)) {
      return { isEmpty: false, isGeneric: true, message: "DNI genérico - se permite crear múltiples clientes" };
    }
    return { isEmpty: false, isGeneric: false, message: null };
  }, [formData.dniCuit]);

  return (
    <Grid templateColumns="repeat(4, 1fr)" gap={3}>
      {/* DNI/CUIT/CUIL - Ahora es opcional */}
      <GridItem>
        <FormControl isInvalid={!!errors.dniCuit} size="sm">
          <FormLabel fontSize="xs" mb={1} fontWeight="600" height="20px" display="flex" alignItems="center">
            <HStack spacing={2}>
              <span>DNI / CUIT / CUIL</span>
              <Text as="span" fontSize="xx-small" color="gray.500">(opcional)</Text>
              {isCheckingCuit && <Spinner size="xs" />}
            </HStack>
          </FormLabel>
          <InputGroup size="sm">
            <Input
              size="sm"
              name="dniCuit"
              value={formData.dniCuit}
              onChange={handleCuitChange}
              placeholder="Dejar vacío si no tiene"
              bg={inputBg}
            />
          </InputGroup>
          {errors.dniCuit ? (
            <FormErrorMessage fontSize="xs">{errors.dniCuit}</FormErrorMessage>
          ) : dniStatus.message && (
            <FormHelperText fontSize="xx-small" color={warningColor} mt={1}>
              <HStack spacing={1}>
                <WarningIcon boxSize={2.5} />
                <span>{dniStatus.message}</span>
              </HStack>
            </FormHelperText>
          )}
        </FormControl>
      </GridItem>

      {/* Razón Social - ocupa 2 columnas */}
      <GridItem colSpan={2}>
        <FormControl isInvalid={!!errors.razonSocial} size="sm">
          <FormLabel fontSize="xs" mb={1} fontWeight="600" height="20px" display="flex" alignItems="center">
            Razón Social / Nombre <Text as="span" color="red.500" ml={1}>*</Text>
          </FormLabel>
          <Input
            size="sm"
            name="razonSocial"
            value={formData.razonSocial}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez o Empresa S.A."
            bg={inputBg}
          />
          <FormErrorMessage fontSize="xs">{errors.razonSocial}</FormErrorMessage>
        </FormControl>
      </GridItem>

      {/* Tipo de Documento */}
      <GridItem>
        <FormControl size="sm">
          <FormLabel fontSize="xs" mb={1} fontWeight="600" height="20px" display="flex" alignItems="center">
            Tipo de Documento
          </FormLabel>
          <Select
            size="sm"
            name="tipoDoc"
            value={formData.tipoDoc || "80"}
            onChange={handleChange}
            bg={inputBg}
            isDisabled={isLoadingTiposDocumento}
          >
            {isLoadingTiposDocumento ? (
              <option value="">Cargando...</option>
            ) : (
              tiposDocumento.map((tipo) => (
                <option key={tipo.codigoAFIP} value={tipo.codigoAFIP}>
                  {tipo.codigoAFIP} - {tipo.descripcion}
                </option>
              ))
            )}
          </Select>
        </FormControl>
      </GridItem>

      {/* Categoría IVA */}
      <GridItem>
        <FormControl size="sm">
          <HStack spacing={1} mb={0.5}>
            <FormLabel fontSize="xs" mb={0} fontWeight="600">Categoría IVA</FormLabel>
            <Tooltip
              label="Categoría fiscal del cliente según AFIP. Determina si se aplican percepciones de IVA."
              fontSize="xs"
              placement="top"
              hasArrow
            >
              <InfoIcon boxSize={3} color="gray.500" cursor="help" />
            </Tooltip>
          </HStack>
          <Select
            size="sm"
            name="categoriaIva"
            value={formData.categoriaIva}
            onChange={handleChange}
            bg={inputBg}
          >
            {CATEGORIAS_IVA.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </Select>
          {/* Ayuda contextual según categoría seleccionada */}
          {formData.categoriaIva && DESCRIPCION_CATEGORIAS_IVA[formData.categoriaIva] && (
            <Text fontSize="xx-small" color="gray.500" mt={1} lineHeight="1.2">
              {DESCRIPCION_CATEGORIAS_IVA[formData.categoriaIva]}
            </Text>
          )}
        </FormControl>
      </GridItem>

      {/* Nro Ingresos Brutos */}
      <GridItem>
        <FormControl size="sm">
          <FormLabel fontSize="xs" mb={0.5} fontWeight="600">Nro. IIBB</FormLabel>
          <Input
            size="sm"
            name="nroIngresosBrutos"
            value={formData.nroIngresosBrutos}
            onChange={handleChange}
            placeholder="Nro inscripción"
            bg={inputBg}
          />
        </FormControl>
      </GridItem>

      {/* Nombre Contacto */}
      <GridItem>
        <FormControl size="sm">
          <FormLabel fontSize="xs" mb={0.5} fontWeight="600">Nombre Contacto</FormLabel>
          <Input
            size="sm"
            name="nombreContacto"
            value={formData.nombreContacto}
            onChange={handleChange}
            placeholder="Ej: Juan Pérez"
            bg={inputBg}
          />
        </FormControl>
      </GridItem>
    </Grid>
  );
};

export default SeccionDatosBasicos;
