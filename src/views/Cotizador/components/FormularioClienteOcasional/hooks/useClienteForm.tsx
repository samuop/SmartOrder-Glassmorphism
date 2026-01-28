import { useState, useEffect, useCallback } from "react";
import { useToast } from "@chakra-ui/react";
import cotizadorService from "../../../../../services/cotizadorService";
import { FORM_DEFAULTS, DNI_GENERICO_DEFAULT } from "../constants/catalogos";
import {
  validarFormulario,
  formatearDocumento,
  detectarTipoDocumento,
  normalizarDocumento,
  mapearClienteAFormulario,
  esDniGenerico
} from "../utils/validaciones";

/**
 * Hook para gestionar el formulario del cliente ocasional
 */
export const useClienteForm = ({ isOpen, clienteExistente, modoEdicion, provincias = [] }) => {
  const toast = useToast();

  // Estado del formulario
  const [formData, setFormData] = useState(FORM_DEFAULTS);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [clienteCargadoCodigo, setClienteCargadoCodigo] = useState(null); // Para rastrear si se cargó un cliente existente

  // Verificación de CUIT
  const [isCheckingCuit, setIsCheckingCuit] = useState(false);
  const [clienteEncontradoPorCuit, setClienteEncontradoPorCuit] = useState(null);

  // Resetear/cargar formulario al abrir
  useEffect(() => {
    if (isOpen) {
      if (modoEdicion && clienteExistente) {
        // MODO EDICIÓN: Cargar datos del cliente existente
        setFormData(mapearClienteAFormulario(clienteExistente));
        setClienteCargadoCodigo(clienteExistente.COD_CLIENT || null);
      } else {
        // MODO CREACIÓN: Formulario vacío
        setFormData(FORM_DEFAULTS);
        setClienteCargadoCodigo(null);
      }
      setErrors({});
      setClienteEncontradoPorCuit(null);
    }
  }, [isOpen, modoEdicion, clienteExistente]);

  // Verificar documento (DNI/CUIT/CUIL)
  const verificarDocumento = useCallback(async (documento) => {
    // Normalizar documento (quitar guiones y espacios)
    const documentoNormalizado = normalizarDocumento(documento);

    if (!documentoNormalizado || documentoNormalizado.length < 7) {
      setClienteEncontradoPorCuit(null);
      return;
    }

    // NO buscar si es un DNI genérico (00000000, etc.)
    // Estos DNIs se usan cuando el usuario no tiene el documento real
    if (esDniGenerico(documentoNormalizado)) {
      console.log('📋 DNI genérico detectado, no se buscará cliente existente:', documentoNormalizado);
      setClienteEncontradoPorCuit(null);
      return;
    }

    setIsCheckingCuit(true);
    try {
      // Buscar por documento normalizado
      const response = await cotizadorService.buscarClientePorCuit(documentoNormalizado);
      if (response.existe) {
        setClienteEncontradoPorCuit(response.data);
      } else {
        setClienteEncontradoPorCuit(null);
      }
    } catch (error) {
      console.error('Error al verificar documento:', error);
    } finally {
      setIsCheckingCuit(false);
    }
  }, []);

  // Debounce para verificar documento
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.dniCuit && !modoEdicion) {
        verificarDocumento(formData.dniCuit);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.dniCuit, verificarDocumento, modoEdicion]);

  // Handler de cambio de campos
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Convertir a mayúsculas los campos de texto importantes
    let processedValue = value;
    if (['razonSocial', 'nombreContacto', 'domicilio', 'localidad', 'direccionEntrega', 'localidadEntrega'].includes(name)) {
      processedValue = value.toUpperCase();
    }
    
    // Si es el campo de provincia, también guardar el nombre
    if (name === 'codProvincia' && value) {
      const provinciaSeleccionada = provincias.find(p => p.value === value);
      const nombreProvincia = provinciaSeleccionada ? provinciaSeleccionada.label : '';
      
      setFormData(prev => ({
        ...prev,
        [name]: processedValue,
        nombreProvincia: nombreProvincia.toUpperCase()
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: processedValue
      }));
    }

    // Limpiar error del campo
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Formatear documento (DNI/CUIT) mientras se escribe y auto-detectar tipo
  const handleDocumentoChange = (e) => {
    const value = e.target.value;
    const formattedValue = formatearDocumento(value);

    // Auto-detectar tipo de documento
    const tipoDetectado = detectarTipoDocumento(formattedValue);

    setFormData(prev => ({
      ...prev,
      dniCuit: formattedValue,
      tipoDoc: tipoDetectado
    }));

    if (errors.dniCuit) {
      setErrors(prev => ({ ...prev, dniCuit: null }));
    }
  };

  // Mantener alias para compatibilidad
  const handleCuitChange = handleDocumentoChange;

  // Validar formulario
  const validar = () => {
    const nuevosErrores = validarFormulario(formData);
    setErrors(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Guardar cliente
  const guardarCliente = async () => {
    if (!validar()) {
      return { success: false };
    }

    setIsLoading(true);

    try {
      let response;
      let codigoCliente;
      let esActualizacion = false;

      // Preparar datos para enviar
      // Si el DNI está vacío, usar el valor por defecto para Tango
      const datosParaGuardar = {
        ...formData,
        dniCuit: formData.dniCuit.trim() || DNI_GENERICO_DEFAULT
      };

      // Determinar si es actualización o creación
      // Puede ser actualización si:
      // 1. Está en modo edición con clienteExistente
      // 2. Se cargó un cliente existente desde "Usar este" (clienteCargadoCodigo)
      const codClienteParaActualizar =
        (modoEdicion && clienteExistente?.COD_CLIENT) || clienteCargadoCodigo;

      if (codClienteParaActualizar) {
        // MODO ACTUALIZACIÓN: Actualizar cliente existente
        console.log('📝 Actualizando cliente existente:', codClienteParaActualizar);
        response = await cotizadorService.actualizarClienteOcasional(codClienteParaActualizar, datosParaGuardar);
        codigoCliente = codClienteParaActualizar;
        esActualizacion = true;
      } else {
        // MODO CREACIÓN: Crear nuevo cliente
        console.log('✨ Creando nuevo cliente con DNI:', datosParaGuardar.dniCuit);
        response = await cotizadorService.crearClienteOcasional(datosParaGuardar);
        codigoCliente = response.data.COD_CLIENT;
      }

      if (response.success) {
        return {
          success: true,
          data: response.data,
          codigoCliente,
          esNuevo: !esActualizacion && response.esNuevo,
          esActualizacion
        };
      }

      return { success: false };
    } catch (error) {
      console.error('Error al guardar cliente:', error);
      
      // Mensaje de error más específico
      let mensajeError = "No se pudo guardar el cliente";
      
      if (error.message) {
        if (error.message.includes('DNI/CUIT')) {
          mensajeError = error.message;
        } else if (error.message.includes('razón social')) {
          mensajeError = error.message;
        } else if (error.message.includes('UNIQUE KEY') || error.message.includes('duplicate key')) {
          mensajeError = "Ya existe un cliente con estos datos. Verifica el DNI/CUIT ingresado.";
        } else {
          mensajeError = error.message;
        }
      }
      
      toast({
        title: "Error al guardar",
        description: mensajeError,
        status: "error",
        duration: 6000,
        isClosable: true,
      });
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  // Usar cliente existente encontrado por CUIT
  const usarClienteExistente = () => {
    if (clienteEncontradoPorCuit) {
      return {
        ...clienteEncontradoPorCuit,
        esNuevo: false
      };
    }
    return null;
  };

  return {
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
  };
};
