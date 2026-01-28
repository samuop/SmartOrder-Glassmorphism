import React, { useRef, useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  HStack,
  VStack,
  Box,
  Text,
  Icon,
  Badge,
} from '@chakra-ui/react';
import {
  AttachmentIcon,
  TimeIcon,
  AddIcon,
} from '@chakra-ui/icons';
import { SlSocialDropbox } from "react-icons/sl";
import MapaPedidos from './MapaPedidos';


/**
 * Modal para seleccionar el tipo de pedido a crear
 * @param {boolean} isOpen - Estado de apertura del modal
 * @param {function} onClose - Función para cerrar el modal
 * @param {object} cotizacion - Datos de la cotización actual
 * @param {function} onCrearPedidoTango - Callback para crear pedido en Tango
 * @param {function} onCrearPedidoDeposito - Callback para crear pedido en depósito
 * @param {function} onVerHistorial - Callback para ver el historial de pedidos
 */
const ModalOpcionesPedido = ({
  isOpen,
  onClose,
  cotizacion,
  onCrearPedidoTango,
  onCrearPedidoDeposito,
  onVerHistorial,
}) => {
  const cancelRef = useRef();

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        initialFocusRef={cancelRef}
        size="full"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent borderRadius={0} display="flex" flexDirection="column" h="100vh">
          <ModalHeader fontSize="lg" fontWeight="bold">
            <HStack spacing={4}>
              <HStack spacing={2}>
                <Icon as={SlSocialDropbox} boxSize={6} />
                <Text>Mapa de Pedidos</Text>
              </HStack>
            </HStack>
          </ModalHeader>
          <ModalCloseButton />

          <ModalBody px={1} py={1} flex="1" overflow="auto">
            {/* Mapa Interactivo */}
            <MapaPedidos
              cotizacion={cotizacion}
              onCrearPedidoTango={() => {
                if (cotizacion?.estado !== 'Convertida') {
                  return onCrearPedidoTango();
                }
              }}
              onCrearPedidoDeposito={() => {
                return onCrearPedidoDeposito();
              }}
              onVerDetallePedido={(pedido) => {
                onClose();
                // Al hacer click en un pedido del mapa, abrimos el historial completo (que ya tiene detalles)
                // O idealmente abriríamos un modal de detalles solo de ESE pedido, pero 
                // reutilizamos VerHistorial por ahora que es lo que tenemos.
                onVerHistorial();
              }}
            />
          </ModalBody>

          <ModalFooter pt={2} pb={3}>
            <Button onClick={onClose}>
              Cerrar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModalOpcionesPedido;
