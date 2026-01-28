import React, { useState, useEffect } from "react";
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
  Alert,
  AlertIcon,
  Badge,
  HStack,
  Tooltip,
  useColorModeValue,
} from "@chakra-ui/react";
import { InfoIcon } from "@chakra-ui/icons";

const SeccionRetenciones = ({ formData, handleChange }) => {
  const inputBg = useColorModeValue("white", "#1a202c");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  // Estado para validar si el certificado RG 1817 está vencido
  const [rg1817Vencido, setRg1817Vencido] = useState(false);

  // Validar vencimiento de RG 1817 cada vez que cambia la fecha
  useEffect(() => {
    if (formData.rg1817Vto) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0); // Normalizar hora para comparación exacta
      const vencimiento = new Date(formData.rg1817Vto);
      vencimiento.setHours(0, 0, 0, 0);
      setRg1817Vencido(vencimiento < hoy);
    } else {
      setRg1817Vencido(false);
    }
  }, [formData.rg1817Vto]);

  return (
    <Accordion allowToggle size="sm">
      <AccordionItem border="none">
        <AccordionButton px={0} py={1} _hover={{ bg: 'transparent' }}>
          <HStack flex="1" spacing={2}>
            <Text fontWeight="600" fontSize="sm" color={labelColor} letterSpacing="wide">
              RETENCIONES E IMPUESTOS INTERNOS
            </Text>
            {formData.rg1817 && !rg1817Vencido && formData.rg1817Vto && (
              <Badge colorScheme="green" fontSize="xx-small" px={1.5} py={0.5}>
                RG 1817 Vigente ✓
              </Badge>
            )}
            {formData.rg1817 && rg1817Vencido && (
              <Badge colorScheme="red" fontSize="xx-small" px={1.5} py={0.5}>
                RG 1817 Vencido
              </Badge>
            )}
          </HStack>
          <AccordionIcon ml={2} />
        </AccordionButton>
        <AccordionPanel px={0} py={2}>
          {/* Alerta si el certificado está vencido */}
          {formData.rg1817 && rg1817Vencido && (
            <Alert status="warning" mb={3} size="sm" fontSize="xs" borderRadius="md">
              <AlertIcon boxSize={3} />
              <Text>
                El certificado RG 1817 está vencido. Se aplicarán percepciones de IVA y Ganancias en las ventas a este cliente.
              </Text>
            </Alert>
          )}

          {/* Alerta informativa si está vigente */}
          {formData.rg1817 && !rg1817Vencido && formData.rg1817Vto && (
            <Alert status="success" mb={3} size="sm" fontSize="xs" borderRadius="md">
              <AlertIcon boxSize={3} />
              <Text>
                Certificado RG 1817 vigente. El cliente NO sufrirá percepciones de IVA y Ganancias hasta el {new Date(formData.rg1817Vto).toLocaleDateString('es-AR')}.
              </Text>
            </Alert>
          )}

          <Grid templateColumns="repeat(4, 1fr)" gap={3}>
            {/* RG.1817 */}
            <GridItem>
              <FormControl size="sm">
                <HStack spacing={1} mb={0.5}>
                  <FormLabel fontSize="xs" mb={0}>RG.1817</FormLabel>
                  <Tooltip
                    label="Régimen de exclusión de percepciones de IVA y Ganancias. Si tiene certificado vigente, no se le aplicarán estas percepciones."
                    fontSize="xs"
                    placement="top"
                    hasArrow
                  >
                    <InfoIcon boxSize={3} color="gray.500" cursor="help" />
                  </Tooltip>
                </HStack>
                <Input
                  size="sm"
                  name="rg1817"
                  value={formData.rg1817}
                  onChange={handleChange}
                  placeholder="Nro certificado"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* Vto RG.1817 */}
            <GridItem>
              <FormControl size="sm">
                <HStack spacing={1} mb={0.5}>
                  <FormLabel fontSize="xs" mb={0}>Vto.</FormLabel>
                  <Tooltip
                    label="Fecha de vencimiento del certificado RG 1817. Después de esta fecha, se aplicarán percepciones normalmente."
                    fontSize="xs"
                    placement="top"
                    hasArrow
                  >
                    <InfoIcon boxSize={3} color="gray.500" cursor="help" />
                  </Tooltip>
                </HStack>
                <Input
                  size="sm"
                  type="date"
                  name="rg1817Vto"
                  value={formData.rg1817Vto}
                  onChange={handleChange}
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* Nro Certif */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Nro.Certif.</FormLabel>
                <Input
                  size="sm"
                  name="rg1817NroCertif"
                  value={formData.rg1817NroCertif}
                  onChange={handleChange}
                  placeholder="Nro. Certificado"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* Sobre/Subtasa */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Sobre/Subtasa</FormLabel>
                <Select
                  size="sm"
                  name="sobreTasa"
                  value={formData.sobreTasa}
                  onChange={handleChange}
                  bg={inputBg}
                >
                  <option value="N">N</option>
                  <option value="S">S</option>
                </Select>
              </FormControl>
            </GridItem>

            {/* Porc. Exclusión */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Porc. Exclusión</FormLabel>
                <Input
                  size="sm"
                  name="porcExclusion"
                  value={formData.porcExclusion}
                  onChange={handleChange}
                  placeholder="0.00"
                  bg={inputBg}
                />
              </FormControl>
            </GridItem>

            {/* Liquida Impuesto Interno */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Liquida Imp.Int.</FormLabel>
                <Select
                  size="sm"
                  name="liquidaImpInterno"
                  value={formData.liquidaImpInterno}
                  onChange={handleChange}
                  bg={inputBg}
                >
                  <option value="N">N</option>
                  <option value="S">S</option>
                </Select>
              </FormControl>
            </GridItem>

            {/* Discrimina Imp. Int. */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Discrim. Imp.Int.</FormLabel>
                <Select
                  size="sm"
                  name="discriminaImpInt"
                  value={formData.discriminaImpInt}
                  onChange={handleChange}
                  bg={inputBg}
                >
                  <option value="N">N</option>
                  <option value="S">S</option>
                </Select>
              </FormControl>
            </GridItem>

            {/* Sobre/Subtasa Imp Int */}
            <GridItem>
              <FormControl size="sm">
                <FormLabel fontSize="xs" mb={0.5}>Sobre/Sub ImpInt</FormLabel>
                <Select
                  size="sm"
                  name="sobreTasaImpInt"
                  value={formData.sobreTasaImpInt}
                  onChange={handleChange}
                  bg={inputBg}
                >
                  <option value="N">N</option>
                  <option value="S">S</option>
                </Select>
              </FormControl>
            </GridItem>
          </Grid>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default SeccionRetenciones;
