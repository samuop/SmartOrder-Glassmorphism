import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import cotizadorService from '../../../services/cotizadorService';
import { usePersistence } from '../strategies/persistenceStrategies';

/**
 * Hook personalizado para manejar la lógica de cotizaciones
 * @param {object} config - Configuración del hook
 * @param {string} config.persistenceStrategy - Estrategia de persistencia ('localStorage', 'url', 'prop', 'none')
 * @param {number} config.initialCotizacionId - ID inicial de cotización (para modo embebido)
 * @param {object} config.persistenceContext - Contexto para estrategia 'prop' (store y setStore)
 * @param {function} config.onPersist - Callback cuando se persiste el ID
 * @param {function} config.onLoad - Callback cuando se carga una cotización
 */
export const useCotizacion = ({
  persistenceStrategy = 'localStorage',
  initialCotizacionId = null,
  persistenceContext = null,
  onPersist = null,
  onLoad = null,
} = {}) => {
  const [cotizacionId, setCotizacionId] = useState(initialCotizacionId);
  const [cotizacion, setCotizacion] = useState(null);
  const [articulos, setArticulos] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [clienteConfirmado, setClienteConfirmado] = useState(false);
  const [requiereNuevaVersion, setRequiereNuevaVersion] = useState(false);
  
  const toast = useToast({ position: 'bottom' });
  const persistence = usePersistence(persistenceStrategy, persistenceContext);

  /**
   * Inicializar nueva cotización en estado local (sin crear en backend)
   * La cotización se creará en el backend cuando se guarde por primera vez
   */
  const inicializarNuevaCotizacion = useCallback((codigoVendedor) => {
    const cotizacionNueva = {
      titulo: "",
      talonario: "8",
      talonarioFactura: "",
      tipo: "Pedida",
      codigoCliente: "",
      cliente: "",
      tipoCliente: "H", // Habitual por defecto
      condicion: "1", // Contado por defecto
      codigoVendedor: codigoVendedor || "1",
      listaPrecios: "10",
      codigoTransporte: "1",
      vigencia: new Date(Date.now() + 86400000 * 30).toLocaleDateString('es-AR'),
      bonificacion: "0.00",
      moneda: "C Corriente",
      observaciones: "",
      origenVenta: "Presencial",
    };

    setCotizacionId(null); // Sin ID hasta que se guarde en backend
    setCotizacion(cotizacionNueva);
    setArticulos([]);
    setClienteConfirmado(false);

    // Limpiar persistencia previa
    persistence.remove('cotizacion_actual_id');

    toast({
      title: "Nueva cotización",
      description: "Selecciona un cliente para comenzar",
      status: "info",
      duration: 3000,
      isClosable: true,
    });

    return cotizacionNueva;
  }, [toast, persistence]);

  /**
   * Crear nueva cotización en el backend
   * Esta función ahora solo se usa internamente cuando se guarda por primera vez
   */
  const crearNuevaCotizacion = useCallback(async (codigoVendedor) => {
    try {
      const datosIniciales = cotizadorService.transformarCotizacionParaBackend({
        titulo: "",
        talonario: "8",
        talonarioFactura: "",
        tipo: "Pedida",
        codigoCliente: "",
        cliente: "",
        condicion: "1", // Contado por defecto
        codigoVendedor: codigoVendedor || "1",
        listaPrecios: "10",
        codigoTransporte: "1",
        vigencia: new Date(Date.now() + 86400000 * 30).toLocaleDateString('es-AR'),
        bonificacion: "0.00",
        moneda: "C Corriente",
        observaciones: "",
      });

      const response = await cotizadorService.crearCotizacion(datosIniciales);

      if (response.success) {
        const cotizacionCreada = response.data;
        const nuevoId = cotizacionCreada.ID;

        setCotizacionId(nuevoId);
        setCotizacion(cotizadorService.transformarCotizacionParaFrontend(cotizacionCreada));
        setArticulos([]);
        setClienteConfirmado(false);

        // Persistir usando la estrategia configurada
        persistence.set('cotizacion_actual_id', nuevoId.toString());

        // Callback de persistencia personalizada
        if (onPersist) {
          onPersist(nuevoId, cotizacionCreada);
        }

        toast({
          title: "Cotización creada",
          description: `Nº ${cotizacionCreada.NRO_COTIZACION}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        return nuevoId;
      }
    } catch (error) {
      console.error('Error al crear cotización:', error);
      throw error;
    }
  }, [toast, persistence, onPersist]);

  /**
   * Cargar cotización existente
   */
  const cargarCotizacion = useCallback(async (id) => {
    try {
      const response = await cotizadorService.obtenerCotizacion(id);

      if (response.success) {
        const cotizacionData = response.data;
     
        setCotizacionId(cotizacionData.ID);
        setCotizacion(cotizadorService.transformarCotizacionParaFrontend(cotizacionData));

        const articulosTransformados = (cotizacionData.articulos || []).map(art =>
          cotizadorService.transformarArticuloParaFrontend(art)
        );
        setArticulos(articulosTransformados);
        setClienteConfirmado(true);
        
        // Persistir usando la estrategia configurada
        persistence.set('cotizacion_actual_id', id.toString());
        
        // Callback de carga personalizada
        if (onLoad) {
          onLoad(cotizacionData);
        }

        return cotizacionData;
      }
    } catch (error) {
      console.error('Error al cargar cotización:', error);
      throw error;
    }
  }, [persistence, onLoad]);

  /**
   * Limpiar cotización
   */
  const limpiarCotizacion = useCallback(() => {
    setCotizacionId(null);
    setCotizacion(null);
    setArticulos([]);
    setHasUnsavedChanges(false);
    setClienteConfirmado(false);
    setRequiereNuevaVersion(false);
    
    // Limpiar usando la estrategia configurada
    persistence.remove('cotizacion_actual_id');
  }, [persistence]);

  /**
   * Actualizar cotización
   * Soporta tanto objetos directos como funciones updater
   * NO marca cambios sin guardar porque el auto-guardado del cliente lo maneja
   */
  const actualizarCotizacion = useCallback((nuevaCotizacionOUpdater) => {
    if (typeof nuevaCotizacionOUpdater === 'function') {
      // Si es una función updater, pasarla directamente a setCotizacion
      setCotizacion(nuevaCotizacionOUpdater);
    } else {
      // Si es un objeto, usarlo directamente
      setCotizacion(nuevaCotizacionOUpdater);
    }
    // NO setear hasUnsavedChanges aquí - el auto-guardado del cliente se encarga
    // Los cambios en artículos se marcan en useArticulos
  }, []);

  /**
   * Confirmar cliente
   * @param {boolean} silent - Si es true, no muestra el toast
   */
  const confirmarCliente = useCallback((silent = false) => {
    setClienteConfirmado(true);
    if (!silent) {
      toast({
        title: "Cliente confirmado",
        description: "Ahora puedes agregar artículos a la cotización",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  return {
    // Estados
    cotizacionId,
    cotizacion,
    articulos,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    clienteConfirmado,
    requiereNuevaVersion,
    
    // Setters
    setCotizacionId,
    setCotizacion,
    setArticulos,
    setIsLoading,
    setIsSaving,
    setHasUnsavedChanges,
    setClienteConfirmado,
    setRequiereNuevaVersion,
    
    // Funciones
    inicializarNuevaCotizacion,
    crearNuevaCotizacion,
    cargarCotizacion,
    limpiarCotizacion,
    actualizarCotizacion,
    confirmarCliente,
  };
};
