import React from 'react';
import {
    Flex,
    HStack,
    Button,
    Tooltip,
} from '@chakra-ui/react';
import {
    CopyIcon,
    DownloadIcon,
    CheckIcon,
} from '@chakra-ui/icons';
import { SlSocialDropbox } from 'react-icons/sl';

/**
 * Barra de acciones del Cotizador
 * Contiene botones de: Copiar Link, Exportar PDF, Pedidos, Guardar
 */
const CotizadorActionBar = ({
    cotizacionId,
    articulos,
    showIVA,
    applyDiscount,
    modoEdicion,
    hasUnsavedChanges,
    requiereNuevaVersion,
    clienteConfirmado,
    isSaving,
    onCopyLink,
    onGeneratePDF,
    onOpenPedidos,
    onSave,
}) => {
    const hasArticulos = articulos && articulos.length > 0;

    // Determinar si el botón guardar está deshabilitado
    const isGuardarDisabled =
        !cotizacionId ||
        !modoEdicion ||
        (!hasUnsavedChanges && !requiereNuevaVersion);

    // Texto del botón guardar
    const guardarText = (hasUnsavedChanges || requiereNuevaVersion)
        ? 'Guardar Cambios'
        : 'Guardado';

    return (
        <Flex justify="flex-end" pt={4} pb={2}>
            <HStack spacing={3}>
                {/* Solo mostrar si la cotización está guardada */}
                {cotizacionId && (
                    <>
                        {/* Copiar Link */}
                        <Button
                            leftIcon={<CopyIcon />}
                            variant="outline"
                            size="md"
                            colorScheme="red"
                            onClick={onCopyLink}
                        >
                            Copiar Link
                        </Button>

                        {/* Exportar PDF */}
                        <Tooltip
                            label={`El PDF se generará ${showIVA ? 'con IVA incluido' : 'sin IVA'}${applyDiscount ? ' y con descuentos aplicados' : ''}`}
                            hasArrow
                        >
                            <Button
                                leftIcon={<DownloadIcon />}
                                variant="outline"
                                size="md"
                                colorScheme="red"
                                onClick={onGeneratePDF}
                                isDisabled={!hasArticulos}
                            >
                                Exportar PDF {showIVA ? '(con IVA)' : '(sin IVA)'}
                            </Button>
                        </Tooltip>

                        {/* Pedidos */}
                        <Button
                            leftIcon={<SlSocialDropbox />}
                            variant="solid"
                            size="md"
                            colorScheme="red"
                            onClick={onOpenPedidos}
                            isDisabled={!clienteConfirmado || !hasArticulos}
                        >
                            Pedidos
                        </Button>
                    </>
                )}

                {/* Guardar */}
                <Button
                    colorScheme="red"
                    size="md"
                    onClick={onSave}
                    isLoading={isSaving}
                    loadingText="Guardando..."
                    isDisabled={isGuardarDisabled}
                    leftIcon={(!hasUnsavedChanges && !requiereNuevaVersion) ? <CheckIcon /> : undefined}
                >
                    {guardarText}
                </Button>
            </HStack>
        </Flex>
    );
};

export default CotizadorActionBar;
