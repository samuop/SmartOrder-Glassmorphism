import React, { useCallback } from "react";
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
  Alert,
  AlertIcon,
  Box,
  useColorModeValue,
  useToast,
} from "@chakra-ui/react";
import { AddIcon, CheckIcon } from "@chakra-ui/icons";

// Hooks
import { useProvincias, useClienteForm, usePercepciones, useTiposDocumento } from "./hooks";

// Utils
import { mapearClienteAFormulario } from "./utils/validaciones";

// Componentes de secciones
import SeccionDatosBasicos from "./components/SeccionDatosBasicos";
import SeccionDomicilioPrincipal from "./components/SeccionDomicilioPrincipal";
import SeccionRetenciones from "./components/SeccionRetenciones";
import SeccionDireccionEntrega from "./components/SeccionDireccionEntrega";
import SeccionPercepciones from "./components/SeccionPercepciones";

const FormularioClienteOcasional = ({
  isOpen,
  onClose,
  onClienteCreado,
  clienteExistente = null,
  onPercepcionesActualizadas
}) => {
  const toast = useToast();

  // Determinar si estamos en modo edición o creación
  const modoEdicion = Boolean(clienteExistente);

  // Colores
  const cardBg = useColorModeValue("white", "#2D3748");
  const labelColor = useColorModeValue("gray.600", "gray.400");

  // Hook de provincias
  const { provincias, isLoadingProvincias } = useProvincias();

  // Hook de tipos de documento
  const { tiposDocumento, isLoadingTiposDocumento } = useTiposDocumento();

  // Hook del formulario de cliente
  const {
    formData,
    setFormData,
    errors,
    isLoading,
    isCheckingCuit,
    clienteEncontradoPorCuit,
    clienteCargadoCodigo,
    setClienteCargadoCodigo,
    handleChange,
    handleCuitChange,
    guardarCliente,
    usarClienteExistente,
  } = useClienteForm({ isOpen, clienteExistente, modoEdicion, provincias });

  // Hook de percepciones
  const {
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
    guardarPercepciones,
  } = usePercepciones({
    codProvincia: formData.codProvincia,
    clienteExistente,
    modoEdicion
  });

  // Handler cuando se selecciona dirección principal de OpenStreetMap
  const handleDomicilioPlaceSelected = useCallback((placeData) => {
    console.log('📍 Dirección principal seleccionada de OpenStreetMap:', placeData);

    const codigoProvincia = placeData.provinceShort;
    
    // Buscar el nombre de la provincia correspondiente al código
    const provinciaEncontrada = provincias.find(p => p.value === codigoProvincia);
    const nombreProvincia = provinciaEncontrada ? provinciaEncontrada.label.toUpperCase() : '';

    setFormData(prev => ({
      ...prev,
      domicilio: (placeData.fullAddress || placeData.formattedAddress || '').toUpperCase(),
      localidad: (placeData.locality || '').toUpperCase(),
      codigoPostal: placeData.postalCode || '',
      codProvincia: codigoProvincia || '',
      nombreProvincia: nombreProvincia,
    }));

    console.log('✅ Datos autocompletados:', {
      domicilio: placeData.fullAddress,
      localidad: placeData.locality,
      CP: placeData.postalCode,
      codigoProvincia: codigoProvincia,
      nombreProvincia: nombreProvincia
    });
  }, [setFormData, provincias]);

  // Handler cuando se selecciona dirección de entrega de OpenStreetMap
  const handleDomicilioEntregaPlaceSelected = useCallback((placeData) => {
    console.log('📍 Dirección de entrega seleccionada de OpenStreetMap:', placeData);

    const codigoProvincia = placeData.provinceShort;

    setFormData(prev => ({
      ...prev,
      direccionEntrega: (placeData.fullAddress || placeData.formattedAddress || '').toUpperCase(),
      localidadEntrega: (placeData.locality || '').toUpperCase(),
      codigoPostalEntrega: placeData.postalCode || '',
      provinciaEntrega: codigoProvincia || '',
    }));

    console.log('✅ Datos de entrega autocompletados:', {
      direccion: placeData.fullAddress,
      localidad: placeData.locality,
      CP: placeData.postalCode,
      provincia: `${placeData.province} → ${codigoProvincia}`
    });
  }, [setFormData]);

  // Usar cliente existente encontrado por CUIT
  const handleUsarClienteExistente = () => {
    const cliente = usarClienteExistente();
    if (cliente) {
      // Cargar los datos del cliente en el formulario usando el mapper
      const datosFormulario = mapearClienteAFormulario(cliente);
      setFormData(datosFormulario);
      
      // Guardar el código del cliente para que al guardar se actualice en lugar de crear
      setClienteCargadoCodigo(cliente.COD_CLIENT);

      toast({
        title: "Cliente cargado",
        description: `Se han cargado los datos de ${cliente.RAZON_SOCI}. Revisa la información y presiona Guardar.`,
        status: "info",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  // Guardar cliente y percepciones
  const handleGuardar = async () => {
    // 1. Guardar cliente
    const resultadoCliente = await guardarCliente();

    if (!resultadoCliente.success) {
      return;
    }

    // 2. Guardar percepciones
    const resultadoPercepciones = await guardarPercepciones(resultadoCliente.codigoCliente);

    // 3. Notificar al componente padre
    if (resultadoPercepciones.success && onPercepcionesActualizadas) {
      onPercepcionesActualizadas();
    }

    // 4. Actualizar cotización con datos del cliente (tanto en creación como en edición)
    // Esto asegura que los cambios se reflejen en el cotizador
    onClienteCreado(resultadoCliente.data);

    onClose();

    // Determinar el mensaje apropiado según el tipo de operación
    let titulo, descripcion;
    if (resultadoCliente.esActualizacion) {
      titulo = "Cliente actualizado";
      descripcion = `Se ha actualizado el cliente ${resultadoCliente.data.RAZON_SOCI}`;
    } else if (resultadoCliente.esNuevo) {
      titulo = "Cliente creado";
      descripcion = `Se ha creado el cliente ${resultadoCliente.data.RAZON_SOCI}`;
    } else {
      titulo = "Cliente encontrado";
      descripcion = `Se ha seleccionado el cliente existente ${resultadoCliente.data.RAZON_SOCI}`;
    }

    toast({
      title: titulo,
      description: descripcion,
      status: "success",
      duration: 4000,
      isClosable: true,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" isCentered scrollBehavior="inside">
      <ModalOverlay backdropFilter="blur(2px)" />
      <ModalContent bg={cardBg} maxW="1200px" maxH="90vh">
        <ModalHeader py={3} borderBottom="1px" borderColor={useColorModeValue("gray.200", "gray.600")}>
          <HStack spacing={3}>
            <AddIcon color={modoEdicion ? "orange.500" : "blue.500"} boxSize={4} />
            <Text fontSize="lg" fontWeight="600">
              {modoEdicion ? "Ver/Editar Cliente Ocasional" : "Nuevo Cliente Ocasional"}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton size="md" />

        <ModalBody py={4} px={6}>
          <VStack spacing={5} align="stretch">
            {/* Alerta de cliente existente - Solo en modo creación */}
            {clienteEncontradoPorCuit && !modoEdicion && (
              <Alert status="warning" borderRadius="md" py={2}>
                <AlertIcon boxSize={4} />
                <Box flex="1">
                  <HStack>
                    <Text fontSize="sm">Cliente existente: <strong>{clienteEncontradoPorCuit.RAZON_SOCI}</strong></Text>
                    <Button
                      size="xs"
                      colorScheme="orange"
                      variant="solid"
                      onClick={handleUsarClienteExistente}
                    >
                      Usar este →
                    </Button>
                  </HStack>
                </Box>
              </Alert>
            )}

            {/* SECCIÓN 1: Datos Básicos */}
            <SeccionDatosBasicos
              formData={formData}
              errors={errors}
              isCheckingCuit={isCheckingCuit}
              handleChange={handleChange}
              handleCuitChange={handleCuitChange}
              tiposDocumento={tiposDocumento}
              isLoadingTiposDocumento={isLoadingTiposDocumento}
            />

            <Divider my={2} borderColor={useColorModeValue("gray.300", "gray.600")} />

            {/* SECCIÓN 2: Domicilio Principal */}
            <SeccionDomicilioPrincipal
              formData={formData}
              errors={errors}
              provincias={provincias}
              isLoadingProvincias={isLoadingProvincias}
              handleChange={handleChange}
              onDomicilioPlaceSelected={handleDomicilioPlaceSelected}
            />

           

            {/* SECCIÓN 4: Dirección de Entrega */}
            <SeccionDireccionEntrega
              formData={formData}
              provincias={provincias}
              isLoadingProvincias={isLoadingProvincias}
              handleChange={handleChange}
              onDomicilioEntregaPlaceSelected={handleDomicilioEntregaPlaceSelected}
            />

            {/* SECCIÓN 5: Percepciones Fiscales */}
            <SeccionPercepciones
              codProvincia={formData.codProvincia}
              percepcionesDisponibles={percepcionesDisponibles}
              percepcionesCliente={percepcionesCliente}
              isLoadingPercepciones={isLoadingPercepciones}
              percepcionSeleccionada={percepcionSeleccionada}
              alicuotasDisponibles={alicuotasDisponibles}
              alicuotaSeleccionada={alicuotaSeleccionada}
              setAlicuotaSeleccionada={setAlicuotaSeleccionada}
              handlePercepcionChange={handlePercepcionChange}
              agregarPercepcion={agregarPercepcion}
              eliminarPercepcion={eliminarPercepcion}
            />


             {/* SECCIÓN 3: Retenciones e Impuestos Internos */}
            <SeccionRetenciones
              formData={formData}
              handleChange={handleChange}
            />
          </VStack>
        </ModalBody>

        <ModalFooter py={3} borderTop="1px" borderColor={useColorModeValue("gray.200", "gray.600")}>
          <HStack spacing={3} width="100%" justifyContent="flex-end">
            <Button size="md" variant="ghost" onClick={onClose} px={6}>
              Cancelar
            </Button>
            <Button
              size="md"
              colorScheme={modoEdicion ? "orange" : "blue"}
              onClick={handleGuardar}
              isLoading={isLoading}
              loadingText={modoEdicion ? "Actualizando..." : "Guardando..."}
              leftIcon={<CheckIcon />}
              px={8}
              fontWeight="600"
            >
              {modoEdicion ? "Actualizar Cliente" : "Guardar y Seleccionar"}
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FormularioClienteOcasional;
