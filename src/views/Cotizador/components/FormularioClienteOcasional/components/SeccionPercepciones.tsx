import React from "react";
import {
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Select,
  Button,
  Text,
  VStack,
  HStack,
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Alert,
  AlertIcon,
  Badge,
  Spinner,
  Tooltip,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  useColorModeValue,
} from "@chakra-ui/react";
import { AddIcon, DeleteIcon, InfoIcon } from "@chakra-ui/icons";

const SeccionPercepciones = ({
  codProvincia,
  percepcionesDisponibles,
  percepcionesCliente,
  isLoadingPercepciones,
  percepcionSeleccionada,
  alicuotasDisponibles,
  alicuotaSeleccionada,
  setAlicuotaSeleccionada,
  handlePercepcionChange,
  agregarPercepcion,
  eliminarPercepcion,
}) => {
  const inputBg = useColorModeValue("white", "#1a202c");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const borderColor = useColorModeValue("gray.200", "#4A5568");

  return (
    <Accordion allowToggle size="sm">
      <AccordionItem border="none">
        <AccordionButton px={0} py={1} _hover={{ bg: 'transparent' }}>
          <HStack flex="1" spacing={2}>
            <Text fontWeight="600" fontSize="sm" color={labelColor} letterSpacing="wide">
              PERCEPCIONES FISCALES
            </Text>
            <Tooltip
              label="Percepciones de IIBB, IVA y Ganancias que se aplicarán automáticamente en las ventas a este cliente según su jurisdicción y condición fiscal."
              fontSize="xs"
              placement="top"
              hasArrow
            >
              <InfoIcon boxSize={3} color="gray.500" cursor="help" />
            </Tooltip>
            {percepcionesCliente.length > 0 && (
              <Badge colorScheme="purple" fontSize="xx-small" px={1.5}>
                {percepcionesCliente.length} configurada{percepcionesCliente.length !== 1 ? 's' : ''}
              </Badge>
            )}
            {isLoadingPercepciones && <Spinner size="xs" />}
          </HStack>
          <AccordionIcon ml={2} />
        </AccordionButton>
        <AccordionPanel px={0} py={2}>
          <VStack spacing={3} align="stretch">
            {/* Info box */}
            <Alert status="info" borderRadius="md" py={2} fontSize="xs">
              <AlertIcon boxSize={3} />
              <Text>
                Seleccione las percepciones que aplican a este cliente según su provincia y condición fiscal.
                Primero seleccione la provincia del domicilio principal.
              </Text>
            </Alert>

            {/* Selector de percepciones */}
            {codProvincia ? (
              <Grid templateColumns="repeat(3, 1fr)" gap={2}>
                <GridItem>
                  <FormControl size="sm">
                    <FormLabel fontSize="xs" mb={0.5}>Percepción</FormLabel>
                    <Select
                      size="sm"
                      placeholder="Seleccionar..."
                      onChange={handlePercepcionChange}
                      value={percepcionSeleccionada?.ID_PERCEPCION_VENTAS || ""}
                      bg={inputBg}
                      disabled={isLoadingPercepciones}
                    >
                      {percepcionesDisponibles.map(p => (
                        <option key={p.ID_PERCEPCION_VENTAS} value={p.ID_PERCEPCION_VENTAS}>
                          {p.DESCRIPCIO || p.COD_IMPUES || 'Sin descripción'} - {p.TIP_IMPUES}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem>
                  <FormControl size="sm">
                    <FormLabel fontSize="xs" mb={0.5}>Alícuota</FormLabel>
                    <Select
                      size="sm"
                      placeholder="Seleccionar..."
                      value={alicuotaSeleccionada}
                      onChange={(e) => setAlicuotaSeleccionada(e.target.value)}
                      bg={inputBg}
                      disabled={!percepcionSeleccionada || alicuotasDisponibles.length === 0}
                    >
                      {alicuotasDisponibles.map(a => (
                        <option key={a.COD_ALICUO} value={a.COD_ALICUO}>
                          {a.DESCRIPCIO} - {a.PORCENTAJE}%
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                </GridItem>

                <GridItem display="flex" alignItems="flex-end">
                  <Button
                    size="sm"
                    colorScheme="green"
                    leftIcon={<AddIcon boxSize={2} />}
                    onClick={agregarPercepcion}
                    isDisabled={!percepcionSeleccionada || !alicuotaSeleccionada}
                    width="full"
                  >
                    Agregar
                  </Button>
                </GridItem>
              </Grid>
            ) : (
              <Alert status="warning" borderRadius="md" py={2} fontSize="xs">
                <AlertIcon boxSize={3} />
                <Text>Seleccione primero la provincia del domicilio principal para ver las percepciones disponibles.</Text>
              </Alert>
            )}

           

            {/* Tabla de percepciones asignadas */}
            {percepcionesCliente.length > 0 && (
              <Box borderWidth="1px" borderRadius="md" borderColor={borderColor} overflow="hidden">
                <Table size="sm" variant="simple">
                  <Thead bg={useColorModeValue("gray.50", "gray.700")}>
                    <Tr>
                      <Th fontSize="xx-small" py={1}>Tipo</Th>
                      <Th fontSize="xx-small" py={1}>Descripción</Th>
                      <Th fontSize="xx-small" py={1}>Alícuota</Th>
                      <Th fontSize="xx-small" py={1}>Base de Cálculo</Th>
                      <Th fontSize="xx-small" py={1} isNumeric>%</Th>
                      <Th fontSize="xx-small" py={1} width="50px"></Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {percepcionesCliente.map((percepcion, index) => {
                      // Determinar color del badge según tipo de impuesto
                      const getBadgeColor = (tipo) => {
                        if (tipo === 'IB' || tipo === 'IIBB') return 'blue';
                        if (tipo === 'IVA') return 'green';
                        if (tipo === 'GANANCIAS') return 'purple';
                        return 'gray';
                      };

                      // Determinar texto de tooltip según tipo de impuesto
                      const getTooltipText = (tipo) => {
                        if (tipo === 'IB' || tipo === 'IIBB') {
                          return 'IIBB se calcula sobre NETO + IVA';
                        }
                        if (tipo === 'IVA') {
                          return 'Percepción IVA se calcula sobre NETO (sin IVA)';
                        }
                        if (tipo === 'GANANCIAS') {
                          return 'Ganancias se calcula sobre NETO (sin IVA)';
                        }
                        return 'Percepción fiscal';
                      };

                      // Determinar base de cálculo desde el campo BASE_CALCULO
                      const getBaseCalculo = (percepcion) => {
                        // BASE_CALCULO viene del backend ya mapeado correctamente
                        if (percepcion.BASE_CALCULO === 'NETO_IVA') {
                          return 'Neto + IVA';
                        } else if (percepcion.BASE_CALCULO === 'NETO') {
                          return 'Neto';
                        }
                        return 'N/A';
                      };

                      return (
                      <Tr key={index}>
                        <Td fontSize="xs" py={1}>
                          <Tooltip
                            label={getTooltipText(percepcion.TIPO_IMPUESTO)}
                            fontSize="xs"
                            placement="top"
                            hasArrow
                          >
                            <Badge
                              colorScheme={getBadgeColor(percepcion.TIPO_IMPUESTO)}
                              fontSize="xx-small"
                              px={1.5}
                              cursor="help"
                            >
                              {percepcion.TIPO_IMPUESTO}
                            </Badge>
                          </Tooltip>
                        </Td>
                        <Td fontSize="xs" py={1}>{percepcion.DESCRIPCION || percepcion.DESCRIPCIO}</Td>
                        <Td fontSize="xs" py={1}>{percepcion.DES_ALICUO}</Td>
                        <Td fontSize="xs" py={1}>
                          <Text fontSize="xx-small" fontWeight="500" color={useColorModeValue("blue.600", "blue.300")}>
                            {getBaseCalculo(percepcion)}
                          </Text>
                        </Td>
                        <Td fontSize="xs" py={1} isNumeric fontWeight="600">
                          {percepcion.ALICUOTA_ASIGNADA}%
                        </Td>
                        <Td py={1}>
                          <IconButton
                            size="xs"
                            icon={<DeleteIcon />}
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => eliminarPercepcion(index)}
                            aria-label="Eliminar percepción"
                          />
                        </Td>
                      </Tr>
                    );
                    })}
                  </Tbody>
                </Table>
              </Box>
            )}

            {percepcionesCliente.length === 0 && codProvincia && (
              <Text fontSize="xs" color={labelColor} fontStyle="italic" textAlign="center" py={2}>
                No hay percepciones asignadas. Agregue las que correspondan al cliente.
              </Text>
            )}
          </VStack>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
};

export default SeccionPercepciones;
