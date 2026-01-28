import React, { useRef } from 'react';
import {
    AlertDialog,
    AlertDialogBody,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogContent,
    AlertDialogOverlay,
    Button,
    VStack,
    HStack,
    Box,
    Text,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
    FormControl,
    FormLabel,
    Textarea,
    Switch,
    Spinner,
    Badge,
    Icon,
    useColorModeValue,
    useColorMode,
} from '@chakra-ui/react';
import {
    TimeIcon,
} from '@chakra-ui/icons';

/**
 * Diálogo de confirmación para cerrar/limpiar cotización
 */
export const ClearCotizacionDialog = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const cancelRef = useRef();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Estilos glass para Dialog
    const dialogBg = isDark
        ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        : 'white';
    const dialogBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
        >
            <AlertDialogOverlay>
                <AlertDialogContent
                    bg={dialogBg}
                    borderRadius="20px"
                    border="2px solid"
                    borderColor={dialogBorderColor}
                    backdropFilter={isDark ? 'blur(120px)' : 'none'}
                >
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        Cerrar Cotización
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        ¿Estás seguro que deseas cerrar la cotización actual? Los cambios guardados se mantendrán y podrás acceder a esta cotización más tarde.
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button colorScheme="blue" onClick={onConfirm} ml={3}>
                            Cerrar
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

/**
 * Diálogo para crear nueva versión de cotización
 */
export const NuevaVersionDialog = ({
    isOpen,
    onClose,
    onConfirm,
    razonCambio,
    onRazonChange,
    actualizarPrecios,
    onActualizarPreciosChange,
    previsualizacionPrecios,
    loadingPreview,
    onLoadPreview,
}) => {
    const cancelRef = useRef();
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    // Estilos glass para Dialog
    const dialogBg = isDark
        ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
        : 'white';
    const dialogBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

    const labelColor = isDark ? 'gray.400' : 'gray.600';
    const boxBorderColor = isDark ? 'brand.700' : 'brand.200';
    const bgAlt = isDark ? 'whiteAlpha.100' : 'gray.50';

    const handleActualizarPreciosChange = (e) => {
        const checked = e.target.checked;
        onActualizarPreciosChange(checked);
        if (checked && !previsualizacionPrecios) {
            onLoadPreview();
        }
    };

    return (
        <AlertDialog
            isOpen={isOpen}
            leastDestructiveRef={cancelRef}
            onClose={onClose}
            size="lg"
        >
            <AlertDialogOverlay>
                <AlertDialogContent
                    bg={dialogBg}
                    borderRadius="20px"
                    border="2px solid"
                    borderColor={dialogBorderColor}
                    backdropFilter={isDark ? 'blur(120px)' : 'none'}
                >
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        <HStack spacing={2}>
                            <Icon as={TimeIcon} color="blue.500" />
                            <Text>Crear Nueva Versión</Text>
                        </HStack>
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <VStack spacing={4} align="stretch">
                            {/* Alerta informativa */}
                            <Alert status="info" borderRadius="md">
                                <AlertIcon />
                                <Box>
                                    <AlertTitle fontSize="sm">Se han realizado cambios en los artículos</AlertTitle>
                                    <AlertDescription fontSize="xs">
                                        • Se guardará el estado actual como versión anterior
                                        <br />
                                        • Tus cambios se aplicarán como nueva versión
                                    </AlertDescription>
                                </Box>
                            </Alert>

                            {/* Sección de actualización de precios */}
                            <Box borderWidth="1px" borderRadius="md" p={4} borderColor={boxBorderColor}>
                                <VStack align="stretch" spacing={3}>
                                    <HStack justify="space-between" align="center">
                                        <VStack align="start" spacing={0}>
                                            <Text fontSize="sm" fontWeight="600" color={labelColor}>
                                                ¿Actualizar precios a valores actuales de Tango?
                                            </Text>
                                            <Text fontSize="xs" color="gray.500">
                                                Los artículos sin precio mantendrán su valor histórico
                                            </Text>
                                        </VStack>
                                        <Switch
                                            size="lg"
                                            colorScheme="blue"
                                            isChecked={actualizarPrecios}
                                            onChange={handleActualizarPreciosChange}
                                        />
                                    </HStack>

                                    {/* Preview de cambios de precios */}
                                    {actualizarPrecios && (
                                        <Box mt={2}>
                                            {loadingPreview ? (
                                                <HStack justify="center" py={4}>
                                                    <Spinner size="sm" color="blue.500" />
                                                    <Text fontSize="xs" color="gray.500">Consultando precios actuales...</Text>
                                                </HStack>
                                            ) : previsualizacionPrecios ? (
                                                <VStack align="stretch" spacing={2}>
                                                    <Alert status="info" size="sm" borderRadius="md">
                                                        <AlertIcon boxSize="12px" />
                                                        <Box fontSize="xs">
                                                            <Text fontWeight="600">
                                                                {previsualizacionPrecios.resumen.conCambios} artículos con cambios de precio
                                                            </Text>
                                                            {previsualizacionPrecios.resumen.sinPrecio > 0 && (
                                                                <Text color="orange.600">
                                                                    {previsualizacionPrecios.resumen.sinPrecio} artículos sin precio actual (mantendrán histórico)
                                                                </Text>
                                                            )}
                                                        </Box>
                                                    </Alert>

                                                    {/* Mostrar artículos con cambios */}
                                                    {previsualizacionPrecios.articulos
                                                        .filter(art => art.cambio && Math.abs(art.cambio.porcentaje) > 0.01)
                                                        .slice(0, 5)
                                                        .map(art => (
                                                            <HStack key={art.id} justify="space-between" fontSize="xs" p={2} bg={bgAlt} borderRadius="md">
                                                                <VStack align="start" spacing={0} flex={1}>
                                                                    <Text fontWeight="500" noOfLines={1}>{art.codigo}</Text>
                                                                    <Text color="gray.500" noOfLines={1}>{art.descripcion}</Text>
                                                                </VStack>
                                                                <VStack align="end" spacing={0} minW="120px">
                                                                    <Text textDecoration="line-through" color="gray.400">
                                                                        ${art.precioActual.precioSinImp.toFixed(2)}
                                                                    </Text>
                                                                    <HStack spacing={1}>
                                                                        <Text fontWeight="600" color={art.cambio.porcentaje > 0 ? 'red.500' : 'green.500'}>
                                                                            ${art.precioNuevo.precioSinImp.toFixed(2)}
                                                                        </Text>
                                                                        <Badge colorScheme={art.cambio.porcentaje > 0 ? 'red' : 'green'} fontSize="9px">
                                                                            {art.cambio.porcentaje > 0 ? '+' : ''}{art.cambio.porcentaje.toFixed(1)}%
                                                                        </Badge>
                                                                    </HStack>
                                                                </VStack>
                                                            </HStack>
                                                        ))}

                                                    {previsualizacionPrecios.articulos.filter(a => a.cambio && Math.abs(a.cambio.porcentaje) > 0.01).length > 5 && (
                                                        <Text fontSize="xs" color="gray.500" textAlign="center">
                                                            ... y {previsualizacionPrecios.articulos.filter(a => a.cambio && Math.abs(a.cambio.porcentaje) > 0.01).length - 5} más
                                                        </Text>
                                                    )}
                                                </VStack>
                                            ) : null}
                                        </Box>
                                    )}
                                </VStack>
                            </Box>

                            {/* Textarea para motivo */}
                            <FormControl>
                                <FormLabel fontSize="sm" fontWeight="600" color={labelColor}>
                                    Motivo del cambio (opcional):
                                </FormLabel>
                                <Textarea
                                    placeholder="Escribe el motivo del cambio..."
                                    value={razonCambio}
                                    onChange={(e) => onRazonChange(e.target.value)}
                                    size="sm"
                                    rows={2}
                                    borderColor="gray.300"
                                    _focus={{
                                        borderColor: 'blue.500',
                                        boxShadow: '0 0 0 1px var(--chakra-colors-blue-500)',
                                    }}
                                />
                            </FormControl>
                        </VStack>
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} onClick={onClose}>
                            Cancelar
                        </Button>
                        <Button colorScheme="blue" onClick={onConfirm} ml={3}>
                            Crear Nueva Versión
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    );
};

export default {
    ClearCotizacionDialog,
    NuevaVersionDialog,
};
