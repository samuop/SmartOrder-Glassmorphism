import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Divider,
  Text,
  Box,
  Grid,
  GridItem,
  Badge,
  Progress,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Skeleton,
  Icon,
  Heading,
} from '@chakra-ui/react';
import { FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCreditCard, FaUser, FaTruck, FaMapPin } from 'react-icons/fa';
import { CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';

/**
 * Componente para mostrar información detallada de un cliente habitual
 * Muestra datos de Tango: condiciones comerciales, estado de cuenta, percepciones, etc.
 * Es de solo lectura - los clientes habituales se gestionan desde Tango
 */
const VistaClienteHabitual = ({
  isOpen,
  onClose,
  cliente,
  estadoCuenta,
  percepciones = [],
  isLoading = false
}) => {
 
  
  const cardBg = useColorModeValue('white', '#2D3748');
  const labelColor = useColorModeValue('gray.600', 'gray.400');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const accentColor = useColorModeValue('#4299E1', '#63B3ED');

  // Calcular porcentaje de crédito usado
  const creditoInfo = estadoCuenta ? {
    saldo: estadoCuenta.saldo || 0,
    limite: estadoCuenta.limiteCredito || 0,
    disponible: (estadoCuenta.limiteCredito || 0) - (estadoCuenta.saldo || 0),
    porcentaje: estadoCuenta.limiteCredito > 0
      ? ((estadoCuenta.saldo || 0) / estadoCuenta.limiteCredito) * 100
      : 0
  } : null;

  // Determinar color según porcentaje de crédito usado
  const getCreditoColor = (porcentaje) => {
    if (porcentaje >= 90) return 'red';
    if (porcentaje >= 70) return 'orange';
    return 'green';
  };

  const FieldDisplay = ({ label, value, icon }) => (
    <Box>
      <HStack spacing={2} mb={1}>
        {icon && <Icon as={icon} color={labelColor} boxSize={3} />}
        <Text fontSize="xs" fontWeight="600" color={labelColor} textTransform="uppercase">
          {label}
        </Text>
      </HStack>
      <Text fontSize="sm" fontWeight="500" color={useColorModeValue('gray.800', 'white')}>
        {value || '-'}
      </Text>
    </Box>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent bg={cardBg} maxW="1400px" maxH="90vh">
        <ModalHeader py={4} borderBottom="1px" borderColor={borderColor}>
          <HStack spacing={3}>
            <Icon as={FaBuilding} color="blue.500" boxSize={5} />
            <Box>
              <Heading size="md" fontWeight="600">
                {isLoading ? <Skeleton height="20px" width="200px" /> : cliente?.cliente || 'Cliente Habitual'}
              </Heading>
              <Text fontSize="xs" color={labelColor} mt={1}>
                Información desde Tango - Solo lectura
              </Text>
            </Box>
            {!isLoading && cliente?.codigoCliente && (
              <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
                {cliente.codigoCliente}
              </Badge>
            )}
          </HStack>
        </ModalHeader>
        <ModalCloseButton />

        <ModalBody py={6} px={8}>
          {isLoading ? (
            <VStack spacing={4}>
              <Skeleton height="60px" width="100%" />
              <Skeleton height="200px" width="100%" />
              <Skeleton height="150px" width="100%" />
            </VStack>
          ) : cliente ? (
            <VStack spacing={6} align="stretch">
              {/* SECCIÓN: Estado de Cuenta */}
              {creditoInfo && (
                <Box
                  p={5}
                  bg={useColorModeValue('blue.50', 'blue.900')}
                  borderRadius="md"
                  border="1px"
                  borderColor={useColorModeValue('blue.200', 'blue.700')}
                >
                  <Heading size="sm" mb={4} color={useColorModeValue('blue.800', 'blue.100')}>
                    <Icon as={FaCreditCard} mr={2} />
                    Estado de Cuenta Corriente
                  </Heading>
                  <Grid templateColumns="repeat(5, 1fr)" gap={6}>
                    <GridItem>
                      <Stat>
                        <StatLabel fontSize="xs">Saldo Actual</StatLabel>
                        <StatNumber fontSize="2xl" color={creditoInfo.saldo > 0 ? 'orange.500' : 'green.500'}>
                          ${creditoInfo.saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </StatNumber>
                        {creditoInfo.saldo > 0 && (
                          <StatHelpText>
                            <StatArrow type="increase" />
                            Deuda pendiente
                          </StatHelpText>
                        )}
                      </Stat>
                    </GridItem>
                    <GridItem>
                      <Stat>
                        <StatLabel fontSize="xs">Saldo Anterior</StatLabel>
                        <StatNumber fontSize="2xl" color="gray.500">
                          ${(cliente?.SALDO_ANT || cliente?.saldoAnterior || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </StatNumber>
                        <StatHelpText fontSize="xs">Mes anterior</StatHelpText>
                      </Stat>
                    </GridItem>
                    <GridItem>
                      <Stat>
                        <StatLabel fontSize="xs">Límite de Crédito</StatLabel>
                        <StatNumber fontSize="2xl">
                          ${creditoInfo.limite.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </StatNumber>
                      </Stat>
                    </GridItem>
                    <GridItem>
                      <Stat>
                        <StatLabel fontSize="xs">Crédito Disponible</StatLabel>
                        <StatNumber fontSize="2xl" color={getCreditoColor(creditoInfo.porcentaje) + '.500'}>
                          ${creditoInfo.disponible.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </StatNumber>
                      </Stat>
                    </GridItem>
                    <GridItem>
                      <Box>
                        <Text fontSize="xs" fontWeight="600" mb={2}>Uso del Crédito</Text>
                        <Progress
                          value={creditoInfo.porcentaje}
                          colorScheme={getCreditoColor(creditoInfo.porcentaje)}
                          size="lg"
                          borderRadius="md"
                          hasStripe
                        />
                        <Text fontSize="xs" mt={1} textAlign="center" fontWeight="600">
                          {creditoInfo.porcentaje.toFixed(1)}%
                        </Text>
                      </Box>
                    </GridItem>
                  </Grid>

                  {estadoCuenta?.deudaVencida > 0 && (
                    <Alert status="warning" mt={4} borderRadius="md">
                      <AlertIcon />
                      <AlertTitle fontSize="sm">Deuda Vencida:</AlertTitle>
                      <AlertDescription fontSize="sm">
                        ${estadoCuenta.deudaVencida.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </AlertDescription>
                    </Alert>
                  )}
                </Box>
              )}

              {/* SECCIÓN: Datos Fiscales y Comerciales */}
              <Box
                p={5}
                bg={cardBg}
                borderRadius="md"
                border="1px"
                borderColor={borderColor}
              >
                <Heading size="sm" mb={4}>
                  Datos Fiscales y Comerciales
                </Heading>
                <Grid templateColumns="repeat(3, 1fr)" gap={6}>
                  <GridItem>
                    <FieldDisplay label="CUIT" value={cliente.cuit} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Tipo de Documento" value={cliente.tipoDocumento} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay 
                      label="Categoría IVA" 
                      value={cliente.CATEG_IVA || cliente.COD_CATEG_IVA || '-'} 
                    />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Condición de Venta" value={cliente.condicion} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Lista de Precios" value={cliente.listaPrecios} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Bonificación %" value={`${cliente.bonificacion || 0}%`} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Vendedor Asignado" value={cliente.nombreVendedor || cliente.codigoVendedor} icon={FaUser} />
                  </GridItem>
                </Grid>
              </Box>

              {/* SECCIÓN: Domicilio y Contacto */}
              <Box
                p={5}
                bg={cardBg}
                borderRadius="md"
                border="1px"
                borderColor={borderColor}
              >
                <Heading size="sm" mb={4}>
                  <Icon as={FaMapMarkerAlt} mr={2} />
                  Domicilio y Contacto
                </Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                  <GridItem colSpan={2}>
                    <FieldDisplay label="Domicilio" value={cliente.domicilio} icon={FaMapPin} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Localidad" value={cliente.localidad} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Provincia" value={cliente.provincia} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Código Postal" value={cliente.codigoPostal} />
                  </GridItem>
                  <GridItem>
                    <FieldDisplay label="Teléfono" value={cliente.telefono} icon={FaPhone} />
                  </GridItem>
                  <GridItem colSpan={2}>
                    <FieldDisplay label="Email" value={cliente.email} icon={FaEnvelope} />
                  </GridItem>
                </Grid>
              </Box>

              {/* SECCIÓN: Logística */}
              {(cliente.codigoTransporte || cliente.codigoZona) && (
                <Box
                  p={5}
                  bg={cardBg}
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                >
                  <Heading size="sm" mb={4}>
                    <Icon as={FaTruck} mr={2} />
                    Logística y Zona de Venta
                  </Heading>
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    {cliente.codigoTransporte && (
                      <GridItem>
                        <FieldDisplay
                          label="Transporte Preferido"
                          value={cliente.nombreTransporte || cliente.codigoTransporte}
                        />
                      </GridItem>
                    )}
                    {cliente.codigoZona && (
                      <GridItem>
                        <FieldDisplay
                          label="Zona de Venta"
                          value={cliente.nombreZona || cliente.codigoZona}
                        />
                      </GridItem>
                    )}
                  </Grid>
                </Box>
              )}

              {/* SECCIÓN: Percepciones Fiscales */}
              {percepciones && percepciones.length > 0 && (
                <Box
                  p={5}
                  bg={cardBg}
                  borderRadius="md"
                  border="1px"
                  borderColor={borderColor}
                >
                  <Heading size="sm" mb={4}>
                    Percepciones Fiscales Activas ({percepciones.length})
                  </Heading>
                  <VStack spacing={2} align="stretch">
                    {percepciones.map((percepcion, index) => (
                      <HStack
                        key={index}
                        p={3}
                        bg={useColorModeValue('gray.50', 'gray.700')}
                        borderRadius="md"
                        justify="space-between"
                      >
                        <VStack align="start" spacing={1}>
                          <HStack>
                            <CheckCircleIcon color="green.500" />
                            <Text fontSize="sm" fontWeight="600">
                              {percepcion.DESCRIPCION || percepcion.descripcion || 'Sin descripción'}
                            </Text>
                          </HStack>
                          {(percepcion.COD_IMPUES || percepcion.codigoImpuesto) && (
                            <Text fontSize="xs" color={labelColor} ml={5}>
                              Código de Impuesto: {percepcion.COD_IMPUES || percepcion.codigoImpuesto}
                            </Text>
                          )}
                        </VStack>
                        <Badge colorScheme="purple" fontSize="sm" px={3} py={1}>
                          {percepcion.ALICUOTA || percepcion.alicuota || 0}%
                        </Badge>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* SECCIÓN: Observaciones */}
              {(cliente.observaciones || cliente.notasInternas) && (
                <Box
                  p={5}
                  bg={useColorModeValue('yellow.50', 'yellow.900')}
                  borderRadius="md"
                  border="1px"
                  borderColor={useColorModeValue('yellow.200', 'yellow.700')}
                >
                  <Heading size="sm" mb={3}>
                    <Icon as={WarningIcon} mr={2} />
                    Observaciones
                  </Heading>
                  {cliente.observaciones && (
                    <Text fontSize="sm" mb={2}>
                      <strong>Generales:</strong> {cliente.observaciones}
                    </Text>
                  )}
                  {cliente.notasInternas && (
                    <Text fontSize="sm">
                      <strong>Notas Internas:</strong> {cliente.notasInternas}
                    </Text>
                  )}
                </Box>
              )}

              {/* Nota informativa */}
              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle fontSize="sm">Información de solo lectura</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Los datos de clientes habituales se gestionan desde Tango.
                    Para modificar esta información, accede al sistema Tango.
                  </AlertDescription>
                </Box>
              </Alert>
            </VStack>
          ) : (
            <Alert status="warning">
              <AlertIcon />
              No se encontró información del cliente
            </Alert>
          )}
        </ModalBody>

        <ModalFooter py={3} borderTop="1px" borderColor={borderColor}>
          <Button colorScheme="blue" onClick={onClose}>
            Cerrar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default VistaClienteHabitual;
