import React from "react";
import {
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Input,
  Select,
  Text,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  HStack,
  useColorModeValue,
} from "@chakra-ui/react";
import { RepeatIcon } from "@chakra-ui/icons";
import OpenStreetMapAutocomplete from "../../OpenStreetMapAutocomplete";

const SeccionDireccionEntrega = ({
  formData,
  provincias,
  isLoadingProvincias,
  handleChange,
  onDomicilioEntregaPlaceSelected,
}) => {
  const inputBg = useColorModeValue("white", "#1a202c");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  return (
    <Accordion allowToggle size="sm">
      <AccordionItem border="none">
        <AccordionButton px={0} py={2} _hover={{ bg: 'transparent' }}>
          <HStack flex="1" spacing={2}>
            <Text fontWeight="600" fontSize="sm" color={labelColor} letterSpacing="wide">
              DIRECCIÓN DE ENTREGA (opcional)
            </Text>
          </HStack>
          <AccordionIcon ml={2} />
        </AccordionButton>
        <AccordionPanel px={0} py={3}>
          <Grid templateColumns="repeat(4, 1fr)" gap={3}>
            {/* Dirección Entrega */}
            <GridItem colSpan={2}>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Dirección 🌍</FormLabel>
                <OpenStreetMapAutocomplete
                  name="direccionEntrega"
                  value={formData.direccionEntrega}
                  onChange={handleChange}
                  onPlaceSelected={onDomicilioEntregaPlaceSelected}
                  placeholder="Buscar dirección con OpenStreetMap..."
                  size="sm"
                  provincias={provincias}
                />
              </FormControl>
            </GridItem>

            {/* Localidad Entrega */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Localidad</FormLabel>
                <Input
                  size="sm"
                  name="localidadEntrega"
                  value={formData.localidadEntrega}
                  onChange={handleChange}
                  placeholder="Ciudad"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* CP Entrega */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>C.P.</FormLabel>
                <Input
                  size="sm"
                  name="codigoPostalEntrega"
                  value={formData.codigoPostalEntrega}
                  onChange={handleChange}
                  placeholder="1000"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* Provincia Entrega */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Provincia</FormLabel>
                <Select
                  size="sm"
                  name="provinciaEntrega"
                  value={formData.provinciaEntrega}
                  onChange={handleChange}
                  placeholder={isLoadingProvincias ? "Cargando..." : "Seleccionar..."}
                  bg={inputBg}
                  disabled={isLoadingProvincias}
                >
                  {provincias.map(prov => (
                    <option key={prov.value} value={prov.value}>{prov.label}</option>
                  ))}
                </Select>
              </FormControl>
            </GridItem>

            {/* Teléfono Entrega */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Teléfono</FormLabel>
                <Input
                  size="sm"
                  name="telefonoEntrega"
                  value={formData.telefonoEntrega}
                  onChange={handleChange}
                  placeholder="Teléfono entrega"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* Fax Entrega */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Fax</FormLabel>
                <Input
                  size="sm"
                  name="faxEntrega"
                  value={formData.faxEntrega}
                  onChange={handleChange}
                  placeholder="Fax entrega"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* Observaciones */}
            <GridItem colSpan={4}>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Observaciones</FormLabel>
                <Input
                  size="sm"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleChange}
                  placeholder="Notas adicionales..."
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>
          </Grid>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default SeccionDireccionEntrega;
