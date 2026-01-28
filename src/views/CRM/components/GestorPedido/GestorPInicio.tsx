/**
 * GestorPedido - Stub Component
 *
 * Este componente es un placeholder para el GestorPedido del CRM original.
 * Se usa para gestionar la creación de pedidos desde cotizaciones.
 *
 * TODO: Implementar la funcionalidad completa según las necesidades del proyecto
 */

import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  Text,
  VStack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react'

interface GestorPedidoProps {
  isOpen: boolean
  onClose: () => void
  cotizacion?: any
  onPedidoCreado?: (pedido: any) => void
}

export default function GestorPedido({
  isOpen,
  onClose,
  cotizacion,
  onPedidoCreado,
}: GestorPedidoProps) {
  const bgColor = useColorModeValue('white', 'navy.800')
  const textColor = useColorModeValue('gray.600', 'gray.300')

  const handleCrearPedido = () => {
    // TODO: Implementar la creación de pedido
    console.log('Crear pedido desde cotización:', cotizacion)

    // Simular creación exitosa
    if (onPedidoCreado) {
      onPedidoCreado({
        id: Date.now(),
        numero: `PED-${Date.now()}`,
        cotizacionId: cotizacion?.id,
        estado: 'pendiente',
      })
    }

    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent bg={bgColor}>
        <ModalHeader>Gestor de Pedidos</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <Text color={textColor}>
              Este módulo permite crear pedidos a partir de cotizaciones aprobadas.
            </Text>

            {cotizacion && (
              <Text fontSize="sm" color={textColor}>
                Cotización: #{cotizacion.numero || cotizacion.id}
              </Text>
            )}

            <Text fontSize="sm" color="orange.500">
              ⚠️ Funcionalidad pendiente de implementación
            </Text>

            <Button colorScheme="brand" onClick={handleCrearPedido}>
              Crear Pedido (Demo)
            </Button>
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
