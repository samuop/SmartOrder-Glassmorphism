import React from 'react';
import {
    Box,
    Flex,
    HStack,
    Heading,
    Text,
    Badge,
    Button,
    Divider,
    Icon,
    IconButton,
    useColorModeValue,
    useColorMode,
} from '@chakra-ui/react';
import {
    ArrowBackIcon,
    EditIcon,
    LockIcon,
    UnlockIcon,
    WarningIcon,
    TimeIcon,
} from '@chakra-ui/icons';

/**
 * Header del Cotizador
 * Muestra título, badges de estado, y botones de acción principales
 */
const CotizadorHeader = ({
    cotizacion,
    cotizacionId,
    modoEdicion,
    isLocked,
    lockedBy,
    hasUnsavedChanges,
    requiereNuevaVersion,
    onBack,
    onEdit,
    onStopEdit,
    onOpenHistorial,
}) => {
    // Colores Vision UI
    const { colorMode } = useColorMode();
    const isDark = colorMode === 'dark';

    const primaryColor = isDark ? 'white' : 'gray.800';
    const labelColor = isDark ? 'gray.400' : 'gray.600';
    const borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'gray.200';

    // Texto de estado
    const getStatusText = () => {
        if (!cotizacionId) {
            return '🆕 Selecciona un cliente para comenzar';
        }
        if (modoEdicion) {
            return '✏️ Modo Edición Activo';
        }
        if (lockedBy) {
            return `Solo lectura - Editando: ${lockedBy.nombre || 'otro usuario'}`;
        }
        return 'Solo lectura - Click en "Editar" para modificar';
    };

    return (
        <Box>
            <Flex align="center" justify="space-between" mb={4}>
                <HStack spacing={4}>
                    <IconButton
                        icon={<ArrowBackIcon />}
                        variant="ghost"
                        onClick={onBack}
                        aria-label="Volver a la lista"
                    />
                    <Box>
                        <Heading size="xl" color={primaryColor} fontWeight="600" mb={1}>
                            {cotizacion?.numero ? `${cotizacion.numero}` : 'Nueva Cotización'}
                        </Heading>
                        <Text fontSize="sm" color={labelColor}>
                            {getStatusText()}
                        </Text>
                    </Box>
                </HStack>

                <HStack spacing={3}>
                    {/* Botón Editar - Solo si no está en modo edición y no está bloqueada */}
                    {!modoEdicion && !lockedBy && cotizacionId && (
                        <Button
                            leftIcon={<EditIcon />}
                            colorScheme="red"
                            size="sm"
                            onClick={onEdit}
                        >
                            Editar Cotización
                        </Button>
                    )}

                    {/* Botón Dejar de Editar */}
                    {modoEdicion && (
                        <Button
                            leftIcon={<LockIcon />}
                            variant="outline"
                            colorScheme="gray"
                            size="sm"
                            onClick={onStopEdit}
                        >
                            Dejar de Editar
                        </Button>
                    )}

                    {/* Badge de modo */}
                    <Badge
                        colorScheme={modoEdicion ? 'green' : lockedBy ? 'red' : 'yellow'}
                        px={3}
                        py={1}
                        fontSize="sm"
                        display="flex"
                        alignItems="center"
                        gap={2}
                    >
                        <Icon as={modoEdicion ? UnlockIcon : LockIcon} />
                        {modoEdicion
                            ? 'Editando'
                            : lockedBy
                                ? `Bloqueada por ${lockedBy.nombre}`
                                : 'Solo Lectura'}
                    </Badge>

                    {/* Badge de versión */}
                    <Badge colorScheme="teal" px={3} py={1} fontSize="sm">
                        Versión {cotizacion?.VERSION || 1}
                    </Badge>

                    {/* Badge de cambios sin guardar */}
                    {hasUnsavedChanges && (
                        <Badge colorScheme="orange" px={3} py={1} fontSize="sm">
                            <Icon as={WarningIcon} mr={1} />
                            Cambios sin guardar
                        </Badge>
                    )}

                    {/* Badge de requiere nueva versión */}
                    {requiereNuevaVersion && (
                        <Badge colorScheme="purple" px={3} py={1} fontSize="sm">
                            <Icon as={WarningIcon} mr={1} />
                            Requiere nueva versión
                        </Badge>
                    )}

                    {/* Botón Ver Versiones */}
                    <Button
                        leftIcon={<TimeIcon />}
                        size="sm"
                        colorScheme="gray"
                        variant="outline"
                        onClick={onOpenHistorial}
                    >
                        Ver Versiones
                    </Button>
                </HStack>
            </Flex>
            <Divider borderColor={borderColor} />
        </Box>
    );
};

export default CotizadorHeader;
