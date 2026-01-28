import React, { useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useColorModeValue,
  Icon,
  HStack,
  Text,
} from "@chakra-ui/react";
import { EditIcon, AddIcon } from "@chakra-ui/icons";
import CotizadorCore from "./CotizadorCore";

/**
 * CotizadorModal - Wrapper de modal para el cotizador
 * Permite abrir el cotizador en un modal desde cualquier parte del sistema
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - Estado del modal
 * @param {function} props.onClose - Callback al cerrar
 * @param {number} props.cotizacionId - ID de cotización a cargar (null = nueva)
 * @param {function} props.onSave - Callback al guardar exitosamente (recibe cotización)
 * @param {function} props.onCancel - Callback al cancelar
 * @param {string} props.mode - Modo: 'create' | 'edit' | 'view'
 * @param {string} props.size - Tamaño del modal ('full', '6xl', '5xl', etc.)
 * @param {object} props.clienteInicial - Datos del cliente a pre-cargar {id, nombre, dni}
 * @param {object} props.defaultValues - Valores por defecto para nueva cotización
 */
function CotizadorModal({
  isOpen,
  onClose,
  cotizacionId = null,
  onSave = null,
  onCancel = null,
  mode = 'edit',
  size = 'full',
  clienteInicial = null,
  defaultValues = null,
}) {
  // Store local para estrategia 'prop' (evita colisiones con localStorage)
  const [propStore, setPropStore] = useState({});

  // Colores del tema
  const headerBg = useColorModeValue("white", "gray.800");
  const headerBorder = useColorModeValue("gray.200", "gray.700");

  // Determinar título del modal
  const getModalTitle = () => {
    if (mode === 'create') return 'Nueva Cotización';
    if (mode === 'view') return `Cotización #${cotizacionId || '---'}`;
    return `Editar Cotización #${cotizacionId || '---'}`;
  };

  // Determinar icono del modal
  const getModalIcon = () => {
    if (mode === 'create') return AddIcon;
    return EditIcon;
  };

  // Handler de guardado que llama al callback externo
  const handleSave = (cotizacion) => {
    console.log('✅ Cotización guardada desde modal:', cotizacion);
    if (onSave) {
      onSave(cotizacion);
    }
  };

  // Handler de cancelación
  const handleCancel = () => {
    console.log('❌ Cotización cancelada desde modal');
    if (onCancel) {
      onCancel();
    }
    onClose();
  };

  // Handler de cierre (volver/cerrar modal)
  const handleClose = () => {
    console.log('🔙 Cerrando modal del cotizador');
    onClose();
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={handleClose} 
      size={size}
      closeOnOverlayClick={false} // Evitar cerrar accidentalmente
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent 
        bg={headerBg}
        maxH="95vh"
        borderRadius={size === 'full' ? 0 : "lg"}
      >
        <ModalHeader 
          borderBottom="1px solid" 
          borderColor={headerBorder}
          py={4}
        >
          <HStack spacing={3}>
            <Icon as={getModalIcon()} color="blue.500" boxSize={5} />
            <Text fontSize="xl" fontWeight="600">
              {getModalTitle()}
            </Text>
          </HStack>
        </ModalHeader>
        
        <ModalCloseButton />
        
        <ModalBody p={0}>
          <CotizadorCore
            persistenceStrategy="prop"
            initialCotizacionId={cotizacionId}
            persistenceContext={{
              store: propStore,
              setStore: setPropStore,
            }}
            mode={mode}
            onSave={handleSave}
            onCancel={handleCancel}
            onClose={handleClose}
            embedded={true}
            hideHeader={false}
            hideBackButton={true}
            clienteInicial={clienteInicial}
            defaultValues={defaultValues}
          />
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default CotizadorModal;
