import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  VStack,
  HStack,
  Divider,
  Badge,
  Heading,
  Text,
  useColorModeValue,
  useColorMode,
  Flex,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Icon,
  IconButton,
  FormControl,
  FormLabel,
  Textarea,
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import {
  DeleteIcon,
  DownloadIcon,
  CheckIcon,
  WarningIcon,
  LockIcon,
  UnlockIcon,
  ArrowBackIcon,
  TimeIcon,
  AddIcon,
  EditIcon,
  CopyIcon,
} from "@chakra-ui/icons";

// Components
import ClienteInfo from "./components/ClienteInfo";
import ArticulosTable from "./components/ArticulosTable";
import TotalesResumen from "./components/TotalesResumen";
import HistorialVersiones from "./components/HistorialVersiones";
import CombinarVersionesModal from "./components/CombinarVersionesModal";
import GestorPedido from "../CRM/components/GestorPedido/GestorPInicio";

// Hooks personalizados
import { useCotizacion } from "./hooks/useCotizacion";
import { useArticulos } from "./hooks/useArticulos";
import { useBloqueo } from "./hooks/useBloqueo";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";

// Utilidades
import { generarPDFCotizacion } from "./utils/pdfGenerator";
import { calcularTotales } from "./utils/calculos";
import { transformarPercepcionesParaCalculo } from "./components/ClienteManager/utils/transformadores";

// Services
import cotizadorService from "../../services/cotizadorService";
import Cookies from 'js-cookie';

/**
 * CotizadorCore - Componente núcleo del cotizador
 * Puede ser usado en modo standalone o embebido (modal/página)
 * 
 * @param {object} props
 * @param {string} props.persistenceStrategy - Estrategia de persistencia ('localStorage', 'url', 'prop', 'none')
 * @param {number} props.initialCotizacionId - ID inicial de cotización
 * @param {object} props.persistenceContext - Contexto para estrategia 'prop'
 * @param {function} props.onSave - Callback al guardar exitosamente
 * @param {function} props.onCancel - Callback al cancelar
 * @param {function} props.onClose - Callback al cerrar (volver)
 * @param {boolean} props.embedded - Modo embebido (sin navegación propia)
 * @param {boolean} props.hideHeader - Ocultar header (útil para modales)
 * @param {boolean} props.hideBackButton - Ocultar botón volver
 * @param {object} props.clienteInicial - Datos del cliente a pre-cargar {id, nombre, dni}
 * @param {object} props.defaultValues - Valores por defecto para nueva cotización
 * @param {string} props.mode - Modo de apertura: 'create' | 'edit' | 'view'
 */
function CotizadorCore({
  persistenceStrategy = 'localStorage',
  initialCotizacionId = null,
  persistenceContext = null,
  mode = 'edit',
  onSave = null,
  onCancel = null,
  onClose = null,
  embedded = false,
  hideHeader = false,
  hideBackButton = false,
  clienteInicial = null,
  defaultValues = null,
}) {
  // Estados de UI
  const [loadError, setLoadError] = useState(null);
  const [razonCambio, setRazonCambio] = useState('');
  const [percepcionesCliente, setPercepcionesCliente] = useState([]);

  // Hooks personalizados con estrategia configurable
  const {
    cotizacionId,
    cotizacion,
    articulos,
    isLoading,
    isSaving,
    hasUnsavedChanges,
    clienteConfirmado,
    requiereNuevaVersion,
    setCotizacionId,
    setArticulos,
    setIsLoading,
    setIsSaving,
    setHasUnsavedChanges,
    setRequiereNuevaVersion,
    crearNuevaCotizacion,
    cargarCotizacion,
    limpiarCotizacion,
    actualizarCotizacion,
    confirmarCliente,
  } = useCotizacion({
    persistenceStrategy,
    initialCotizacionId,
    persistenceContext,
    onPersist: (id, cotizacion) => {
      console.log('📌 Cotización persistida:', id);
    },
    onLoad: (cotizacionData) => {
      console.log('📂 Cotización cargada:', cotizacionData.ID);
    },
  });

  const {
    isLocked,
    lockedBy,
    modoEdicion: modoEdicionBloqueo,
    adquirirBloqueo,
    liberarBloqueo,
    verificarEstadoBloqueo,
  } = useBloqueo(cotizacionId);

  // Para nuevas cotizaciones (sin ID), siempre modo edición
  const modoEdicion = !cotizacionId ? true : modoEdicionBloqueo;

  const {
    agregarArticulo,
    eliminarArticulo,
    actualizarArticulo,
    reemplazarArticulo,
    guardarCambiosArticulos,
  } = useArticulos({
    cotizacionId,
    articulos,
    setArticulos,
    isLocked,
    cotizacion,
    setHasUnsavedChanges,
    setRequiereNuevaVersion,
    tienenCambiosReales,
  });

  // Hooks de Chakra UI
  const { isOpen: isOpenClearDialog, onOpen: onOpenClearDialog, onClose: onCloseClearDialog } = useDisclosure();
  const { isOpen: isOpenHistorial, onOpen: onOpenHistorial, onClose: onCloseHistorial } = useDisclosure();
  const { isOpen: isOpenCombinar, onOpen: openCombinarModal, onClose: closeCombinarModal } = useDisclosure();
  const { isOpen: isOpenNuevaVersion, onOpen: onOpenNuevaVersion, onClose: onCloseNuevaVersion } = useDisclosure();
  const { isOpen: isOpenGestorPedido, onOpen: onOpenGestorPedido, onClose: onCloseGestorPedido } = useDisclosure();
  const [versionesParaCombinar, setVersionesParaCombinar] = useState([]);
  const cancelRef = useRef();
  const toast = useToast();

  // Ref para guardar snapshot original de artículos
  const articulosOriginalesRef = useRef([]);

  // Refs para gestión de foco
  const clienteSearchBtnRef = useRef(null);
  const articulosTableRef = useRef(null); // Ref para la tabla de artículos

  // Ref para controlar que el useEffect de carga solo se ejecute una vez
  const hasLoadedRef = useRef(false);

  // Definir Atajos de Teclado Globales
  useKeyboardShortcuts([
    {
      // F10 o Ctrl+S: Guardar
      keys: ['Control', 's'],
      callback: () => {
        if (!isLocked && cotizacionId) return; // Solo si está editando
        guardarCotizacion();
      }
    },
    {
      keys: ['F10'],
      callback: () => {
        if (!isLocked && cotizacionId) return;
        guardarCotizacion();
      }
    },
    {
      // Ctrl+P: Imprimir/PDF
      keys: ['Control', 'p'],
      callback: () => {
        // La generación de PDF ahora se maneja desde el backend
        toast({
          title: "Info",
          description: "La generación de PDF se ha movido al backend",
          status: "info",
          duration: 3000,
        });
      }
    },
    {
      // F4: Buscar Cliente (Focus en botón de búsqueda)
      keys: ['F4'],
      callback: () => {
        if (clienteSearchBtnRef.current) {
          clienteSearchBtnRef.current.focus();
          clienteSearchBtnRef.current.click(); // Opcional: abrir búsqueda directamente
        }
      }
    },
    {
      // F2: Focus en Tabla o Agregar Artículo
      keys: ['F2'],
      callback: () => {
        // Si hay una función expuesta en la tabla para recibir foco, usarla
        if (articulosTableRef.current && articulosTableRef.current.focus) {
          articulosTableRef.current.focus();
        }
      }
    }
  ], true);

  /**
   * Wrapper para actualizar cotización Y marcar cambios sin guardar
   * Solo marca cambios si el cliente ya está confirmado (evita marcar en carga inicial)
   */
  const actualizarCotizacionConCambios = useCallback((nuevaCotizacion) => {
    actualizarCotizacion(nuevaCotizacion);
    // Solo marcar cambios si el cliente YA está confirmado (evita marca durante carga inicial)
    if (clienteConfirmado && cotizacionId) {
      setHasUnsavedChanges(true);
    }
  }, [actualizarCotizacion, setHasUnsavedChanges, clienteConfirmado, cotizacionId]);

  /**
   * Comparar si realmente hubo cambios significativos en los artículos
   */
  const tienenCambiosReales = useCallback(() => {
    if (articulosOriginalesRef.current.length === 0) return false;

    const originalesMap = new Map();
    articulosOriginalesRef.current.forEach(art => originalesMap.set(art.id, art));

    const actualesMap = new Map();
    const articulosActuales = articulos.filter(art => !art._isDeleted && !art._isNew);
    articulosActuales.forEach(art => actualesMap.set(art.id, art));

    const articulosNuevos = articulos.filter(art => art._isNew && !art._isDeleted);
    if (articulosNuevos.length > 0) return true;

    if (actualesMap.size !== originalesMap.size) return true;

    for (const [id, artActual] of actualesMap) {
      const artOriginal = originalesMap.get(id);
      if (!artOriginal) return true;

      const camposImportantes = ['codigo', 'descripcion', 'cantidad', 'bonif', 'precioSinImp', 'iva'];
      for (const campo of camposImportantes) {
        if (String(artActual[campo] ?? '') !== String(artOriginal[campo] ?? '')) {
          return true;
        }
      }
    }

    return false;
  }, [articulos]);

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Fondos con efecto glass para modo oscuro
  const cardBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.16)' : 'gray.200';
  const primaryColor = isDark ? 'white' : 'gray.800';
  const labelColor = isDark ? 'gray.400' : 'gray.600';
  const hoverBg = isDark ? 'whiteAlpha.100' : 'gray.50';

  // ==================== EFECTOS ====================

  useEffect(() => {
    // Prevenir ejecuciones múltiples
    if (hasLoadedRef.current) {
      return;
    }

    // PRIORIDAD 1: Si hay initialCotizacionId, cargar cotización existente
    if (initialCotizacionId) {
      hasLoadedRef.current = true;
      const cargar = async () => {
        setIsLoading(true);
        try {
          /* Comentado porque el backend no está listo
          // Primero adquirir el bloqueo si es modo edit (antes de cargar)
          if (mode === 'edit') {
            console.log('🔓 Adquiriendo bloqueo para edición...');
            const bloqueado = await adquirirBloqueo(initialCotizacionId);
            if (!bloqueado) {
              console.warn('⚠️ No se pudo adquirir el bloqueo');
              setLoadError('No se pudo adquirir el bloqueo. La cotización está siendo editada por otro usuario.');
              setIsLoading(false);
              return;
            }
          }

          // Luego cargar la cotización
          await cargarCotizacion(initialCotizacionId);
          */

          // Si es modo view, solo verificar estado
          if (mode === 'view') {
            // await verificarEstadoBloqueo();
          }
        } catch (error) {
          console.error('Error al cargar cotización inicial:', error);
          setLoadError(error.message);
        } finally {
          setIsLoading(false);
        }
      };
      cargar();
    }
    // PRIORIDAD 2: Si NO hay initialCotizacionId pero hay clienteInicial, crear nueva
    else if (!cotizacionId && clienteInicial) {
      hasLoadedRef.current = true;
      // Modo crear: inicializar cotización nueva con cliente pre-cargado
      console.log('🆕 Inicializando cotización nueva con cliente:', clienteInicial);

      // Obtener código de vendedor desde cookies
      const codigoVendedor = Cookies.get('COD_VENDED') || '01';

      const cotizacionNueva = {
        tipoCliente: clienteInicial.tipo || 'H',
        codigoCliente: clienteInicial.id || '',
        cliente: clienteInicial.nombre || '',
        dni: clienteInicial.dni || '',
        codigoVendedor: codigoVendedor, // Desde cookies
        condicion: '1', // Condición de venta por defecto (editable)
        listaPrecios: '10', // Lista de precios por defecto (editable)
        origenVenta: 'Presencial', // Origen por defecto (editable)
        observaciones: defaultValues?.observaciones || '',
      };
      actualizarCotizacion(cotizacionNueva);

      // Marcar cliente como confirmado si viene pre-cargado (sin mostrar toast)
      if (clienteInicial.id && clienteInicial.nombre) {
        confirmarCliente(true); // true = silent mode, no mostrar toast
      }
    }

    return () => {
      if (cotizacionId && isLocked) {
        liberarBloqueo();
      }
    };
  }, [initialCotizacionId, clienteInicial, mode]);

  useEffect(() => {
    if (cotizacionId && articulos.length > 0 && articulosOriginalesRef.current.length === 0) {
      const articulosLimpios = articulos.filter(art => !art._isDeleted && !art._isNew);
      articulosOriginalesRef.current = JSON.parse(JSON.stringify(articulosLimpios));
    }
  }, [cotizacionId, articulos.length]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Cargar percepciones del cliente cuando está confirmado
  useEffect(() => {
    const cargarPercepcionesDelCliente = async () => {
      if (!clienteConfirmado || !cotizacion?.codigoCliente) {
        setPercepcionesCliente([]);
        return;
      }

      try {
        console.log('🔍 Obteniendo percepciones para cliente:', {
          codigo: cotizacion.codigoCliente,
          tipo: cotizacion.tipoCliente
        });

        /* Comentado porque el backend no está listo
        const response = await cotizadorService.obtenerPercepcionesCliente(
          cotizacion.codigoCliente,
          cotizacion.tipoCliente || 'O'
        );

        console.log('📡 Respuesta del backend de percepciones:', response);

        if (response.success) {
          console.log('📦 Data recibida del backend:', response.data);

          // Transformar percepciones para que tengan estructura correcta
          const percepcionesTransformadas = transformarPercepcionesParaCalculo(
            response.data || [],
            cotizacion.tipoCliente || 'O'
          );

          console.log('✅ Percepciones transformadas:', percepcionesTransformadas);
          console.log('📋 Primera percepción transformada:', percepcionesTransformadas[0]);

          setPercepcionesCliente(percepcionesTransformadas);
        } else {
          console.log('⚠️ Response.success es false');
        }
        */
        setPercepcionesCliente([]);
      } catch (error) {
        console.error('Error al cargar percepciones del cliente:', error);
        setPercepcionesCliente([]);
      }
    };

    cargarPercepcionesDelCliente();
  }, [clienteConfirmado, cotizacion?.codigoCliente]);

  // ==================== FUNCIONES PRINCIPALES ====================

  const guardarCotizacion = async () => {
    if (isSaving) return;
    setIsSaving(true);

    try {
      let idCotizacion = cotizacionId;

      // Si no hay cotizacionId, crear una nueva cotización
      if (!cotizacionId) {
        console.log('🆕 Creando nueva cotización...', cotizacion);
        const datosCotizacion = cotizadorService.transformarCotizacionParaBackend(cotizacion);
        console.log('📤 Datos a enviar:', datosCotizacion);

        const cotizacionCreada = await cotizadorService.crearCotizacion(datosCotizacion);
        console.log('📥 Respuesta del servidor:', cotizacionCreada);

        // Intentar obtener el ID de diferentes estructuras posibles
        const nuevoId = cotizacionCreada?.id ||
          cotizacionCreada?.ID ||
          cotizacionCreada?.data?.id ||
          cotizacionCreada?.data?.ID;

        if (!nuevoId) {
          console.error('❌ No se encontró ID en la respuesta:', cotizacionCreada);
          throw new Error('Error al crear cotización - No se recibió ID');
        }

        idCotizacion = nuevoId;
        setCotizacionId(nuevoId);

        // Guardar artículos en la cotización recién creada
        if (articulos.length > 0) {
          // Filtrar artículos que no estén eliminados y ordenar por su posición actual
          const articulosAGuardar = articulos.filter(art => !art._isDeleted);

          for (let i = 0; i < articulosAGuardar.length; i++) {
            const articulo = articulosAGuardar[i];
            const articuloData = {
              codArticulo: articulo.codigo || articulo.codArticu,
              descripcion: articulo.descripcion,
              cantidad: parseFloat(articulo.cantidad) || 1,
              precioUnitarioSinImp: parseFloat(articulo.precioSinImp) || 0,
              descuento: parseFloat(articulo.bonif) || 0,
              ivaPorcentaje: parseFloat(articulo.iva) || 21,
              orden: i + 1, // Asignar orden secuencial
            };
            await cotizadorService.agregarArticulo(idCotizacion, articuloData);
          }
        }

        // Recargar cotización con artículos
        await cargarCotizacion(idCotizacion);
        setHasUnsavedChanges(false);
        setIsSaving(false);

        // Callback externo (mostrará el toast en el componente padre)
        if (onSave) {
          const cotizacionFinal = await cotizadorService.obtenerCotizacion(idCotizacion);
          onSave(cotizacionFinal);
        }

        return;
      }

      const tieneArticulosGuardados = articulos.some(art => !art._isNew && !art._isDeleted);
      const esNueva = !tieneArticulosGuardados;
      const hayCambiosReales = tienenCambiosReales();

      if (!esNueva && tieneArticulosGuardados && hayCambiosReales) {
        setRazonCambio('');
        onOpenNuevaVersion();
        setIsSaving(false);
        return;
      }

      if (!hayCambiosReales) {
        setRequiereNuevaVersion(false);
      }

      await guardarCambiosArticulos();

      const datosActualizados = cotizadorService.transformarCotizacionParaBackend(cotizacion);
      const response = await cotizadorService.actualizarCotizacion(idCotizacion, datosActualizados);

      if (response.success) {
        const cotizacionActualizada = await cargarCotizacion(idCotizacion);
        setHasUnsavedChanges(false);

        if (cotizacionActualizada && cotizacionActualizada.articulos) {
          const articulosLimpios = cotizacionActualizada.articulos.map(art =>
            cotizadorService.transformarArticuloParaFrontend(art)
          );
          articulosOriginalesRef.current = JSON.parse(JSON.stringify(articulosLimpios));
        }

        toast({
          title: "Cotización guardada",
          description: "Los cambios se guardaron correctamente",
          status: "success",
          duration: 3000,
          position: "top",
        });

        // Callback externo
        if (onSave) {
          onSave(cotizacionActualizada || cotizacion);
        }
      }
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar los cambios",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const confirmarNuevaVersion = async () => {
    if (isSaving) return;
    onCloseNuevaVersion();
    setIsSaving(true);

    try {
      const responseVersion = await cotizadorService.crearVersion(cotizacionId, razonCambio);

      if (responseVersion.success) {
        await guardarCambiosArticulos();

        const datosActualizados = cotizadorService.transformarCotizacionParaBackend(cotizacion);
        await cotizadorService.actualizarCotizacion(cotizacionId, datosActualizados);

        const cotizacionActualizada = await cargarCotizacion(cotizacionId);

        setRequiereNuevaVersion(false);
        setHasUnsavedChanges(false);

        if (cotizacionActualizada && cotizacionActualizada.articulos) {
          const articulosLimpios = cotizacionActualizada.articulos.map(art =>
            cotizadorService.transformarArticuloParaFrontend(art)
          );
          articulosOriginalesRef.current = JSON.parse(JSON.stringify(articulosLimpios));
        }

        toast({
          title: "Nueva versión creada",
          description: `Versión ${responseVersion.data.VERSION} creada exitosamente`,
          status: "success",
          duration: 4000,
        });

        if (onSave) {
          onSave(cotizacionActualizada || cotizacion);
        }
      }
    } catch (error) {
      console.error('Error al crear nueva versión:', error);
      toast({
        title: "Error al crear versión",
        description: error.message || "No se pudo crear la nueva versión",
        status: "error",
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLimpiarCotizacion = async () => {
    try {
      if (cotizacionId && isLocked) {
        await liberarBloqueo();
      }

      limpiarCotizacion();
      onCloseClearDialog();

      if (onClose) {
        onClose();
      }

      toast({
        title: "Cotización cerrada",
        status: "info",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error al limpiar cotización:', error);
    }
  };

  const cancelarCotizacion = async () => {
    if (window.confirm('¿Estás seguro que deseas cancelar esta cotización?')) {
      try {
        if (cotizacionId) {
          await cotizadorService.eliminarCotizacion(cotizacionId, true);
        }

        if (cotizacionId && isLocked) {
          await liberarBloqueo();
        }

        limpiarCotizacion();

        if (onCancel) {
          onCancel();
        }

        toast({
          title: "Cotización cancelada",
          status: "success",
          duration: 3000,
        });
      } catch (error) {
        console.error('Error al cancelar cotización:', error);
        toast({
          title: "Error al cancelar",
          description: error.message,
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  const copiarLinkCotizacion = () => {
    if (!cotizacionId) return;

    const url = `${window.location.origin}${window.location.pathname}?id=${cotizacionId}`;

    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copiado",
        description: "El enlace se copió al portapapeles",
        status: "success",
        duration: 2000,
        position: "bottom-right",
      });
    });
  };

  const generarPDF = () => {
    // La funcionalidad de generación de PDF local ha sido removida
    // debido a que ahora se delega al backend para mayor seguridad y consistencia.
    toast({
      title: "Funcionalidad movida",
      description: "El PDF ahora se genera directamente desde el servidor",
      status: "info",
      duration: 3000,
    });
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH={embedded ? "400px" : "100vh"}>
        <VStack spacing={4}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text color={labelColor}>Cargando cotización...</Text>
        </VStack>
      </Flex>
    );
  }

  if (loadError) {
    return (
      <Flex justify="center" align="center" minH={embedded ? "400px" : "100vh"} p={8}>
        <Alert status="error" variant="subtle" borderRadius="lg" maxW="500px">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">Error al cargar cotización</AlertTitle>
          <AlertDescription>{loadError}</AlertDescription>
          {onClose && (
            <Button mt={4} onClick={onClose}>Cerrar</Button>
          )}
        </Alert>
      </Flex>
    );
  }

  if (!cotizacion) {
    return (
      <Flex justify="center" align="center" minH={embedded ? "400px" : "100vh"} p={4}>
        <Text color={labelColor}>No hay cotización cargada</Text>
      </Flex>
    );
  }

  // Preparar datos del cliente con percepciones para el cálculo de totales
  console.log('🎯 CotizadorCore - clienteConfirmado:', clienteConfirmado);
  console.log('🎯 CotizadorCore - cotizacion.codigoCliente:', cotizacion?.codigoCliente);
  console.log('🎯 CotizadorCore - percepcionesCliente:', percepcionesCliente);

  const clienteParaTotales = clienteConfirmado && cotizacion?.codigoCliente ? {
    codCliente: cotizacion.codigoCliente,
    percepciones: percepcionesCliente
  } : null;

  console.log('🎯 CotizadorCore - clienteParaTotales:', clienteParaTotales);

  const totalesCalculados = calcularTotales(cotizacion, articulos, clienteParaTotales);

  return (
    <Box p={embedded ? 4 : 8} minH={embedded ? "auto" : "100vh"} pt={embedded ? 4 : 24}>
      <VStack spacing={6} align="stretch" maxW="1400px" mx="auto">
        {/* Header Principal */}
        {!hideHeader && (
          <Box>
            <Flex align="center" justify="space-between" mb={4}>
              <HStack spacing={4}>
                {!hideBackButton && onClose && (
                  <IconButton
                    icon={<ArrowBackIcon />}
                    variant="ghost"
                    onClick={async () => {
                      if (hasUnsavedChanges && !window.confirm('Hay cambios sin guardar. ¿Salir?')) return;
                      await liberarBloqueo();
                      limpiarCotizacion();
                      onClose();
                    }}
                    aria-label="Volver"
                  />
                )}
                <Box>
                  <Heading size="xl" color={primaryColor} fontWeight="600" mb={1}>
                    {cotizacion.numero ? `Cotización ${cotizacion.numero}` : 'Nueva Cotización'}
                  </Heading>
                  <Text fontSize="sm" color={labelColor}>
                    {modoEdicion
                      ? '✏️ Modo Edición Activo'
                      : lockedBy
                        ? `🔒 Solo lectura - Editando: ${lockedBy.nombre}`
                        : '👁️ Solo lectura'
                    }
                  </Text>
                </Box>
              </HStack>
              <HStack spacing={3}>
                {!modoEdicion && !lockedBy && (
                  <Button
                    leftIcon={<EditIcon />}
                    colorScheme="blue"
                    size="md"
                    onClick={() => adquirirBloqueo(cotizacionId)}
                  >
                    Editar
                  </Button>
                )}

                {modoEdicion && (
                  <Button
                    leftIcon={<LockIcon />}
                    variant="outline"
                    size="md"
                    onClick={async () => {
                      if (hasUnsavedChanges && !window.confirm('Cambios sin guardar. ¿Salir?')) return;
                      await liberarBloqueo();
                    }}
                  >
                    Dejar de Editar
                  </Button>
                )}

                <Badge colorScheme={modoEdicion ? "green" : "red"} px={3} py={1} borderRadius="md">
                  <Icon as={modoEdicion ? UnlockIcon : LockIcon} mr={1} />
                  {modoEdicion ? 'Editando' : 'Bloqueada'}
                </Badge>
                <Badge colorScheme="teal" px={3} py={1} borderRadius="md">
                  Versión {cotizacion.VERSION || 1}
                </Badge>
                {hasUnsavedChanges && (
                  <Badge colorScheme="orange" px={3} py={1} borderRadius="md">
                    <Icon as={WarningIcon} mr={1} />
                    Sin guardar
                  </Badge>
                )}
                <Button
                  leftIcon={<TimeIcon />}
                  size="sm"
                  variant="outline"
                  onClick={onOpenHistorial}
                >
                  Historial
                </Button>
              </HStack>
            </Flex>
            <Divider borderColor={borderColor} />
          </Box>
        )}

        {/* Información del Cliente */}
        <ClienteInfo
          cotizacion={cotizacion}
          setCotizacion={actualizarCotizacion}
          onConfirmar={confirmarCliente}
          onCancelar={cancelarCotizacion}
          clienteConfirmado={clienteConfirmado}
          isDisabled={!modoEdicion}
          desdePerfilCliente={!!clienteInicial}
          setHasUnsavedChanges={setHasUnsavedChanges}
          focusRef={clienteSearchBtnRef}
        />

        {/* Tabla de Artículos */}
        {clienteConfirmado && (
          <ArticulosTable
            ref={articulosTableRef}
            articulos={articulos.filter(art => !art._isDeleted)}
            setArticulos={setArticulos}
            agregarArticulo={agregarArticulo}
            eliminarArticulo={eliminarArticulo}
            onLimpiarCotizacion={onOpenClearDialog}
            isDisabled={!modoEdicion}
            onArticuloChange={actualizarArticulo}
            onReplaceArticle={reemplazarArticulo}
          />
        )}

        {/* Totales */}
        {clienteConfirmado && (
          <TotalesResumen
            totales={totalesCalculados}
            cotizacion={cotizacion}
            onUpdateCotizacion={actualizarCotizacion}
            isDisabled={mode === 'view'}
          />
        )}

        {/* Botones de Acción */}
        <Flex justify="flex-end" pt={4} pb={2}>
          <HStack spacing={3}>
            <Button
              leftIcon={<CopyIcon />}
              variant="outline"
              colorScheme="purple"
              onClick={copiarLinkCotizacion}
            >
              Copiar Link
            </Button>
            <Button
              leftIcon={<DownloadIcon />}
              variant="outline"
              colorScheme="green"
              onClick={generarPDF}
              isDisabled={articulos.length === 0}
            >
              PDF
            </Button>
            <Button
              leftIcon={<AddIcon />}
              variant="outline"
              colorScheme="orange"
              onClick={() => {
                console.log('🔍 DEBUG - Abriendo GestorPedido');
                console.log('cotizacionId:', cotizacionId);
                console.log('cotizacion:', cotizacion);
                console.log('articulos:', articulos);
                onOpenGestorPedido();
              }}
              isDisabled={!cotizacionId || articulos.length === 0}
            >
              Crear Pedido Depósito
            </Button>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={guardarCotizacion}
              isLoading={isSaving}
              isDisabled={!modoEdicion || (!hasUnsavedChanges && !requiereNuevaVersion)}
              leftIcon={(hasUnsavedChanges || requiereNuevaVersion) ? undefined : <CheckIcon />}
            >
              {(hasUnsavedChanges || requiereNuevaVersion) ? 'Guardar' : 'Guardado'}
            </Button>
          </HStack>
        </Flex>
      </VStack>

      {/* Diálogos */}
      <AlertDialog isOpen={isOpenClearDialog} leastDestructiveRef={cancelRef} onClose={onCloseClearDialog}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>Cerrar Cotización</AlertDialogHeader>
            <AlertDialogBody>¿Cerrar la cotización actual?</AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseClearDialog}>Cancelar</Button>
              <Button colorScheme="blue" onClick={handleLimpiarCotizacion} ml={3}>Cerrar</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      <HistorialVersiones
        isOpen={isOpenHistorial}
        onClose={onCloseHistorial}
        cotizacionId={cotizacionId}
        modoEdicion={modoEdicion}
        onOpenCombinar={(versiones) => {
          setVersionesParaCombinar(versiones);
          onCloseHistorial();
          openCombinarModal();
        }}
        onRestaurar={async (versionRestaurada) => {
          await cargarCotizacion(versionRestaurada.ID);
          setRequiereNuevaVersion(false);
          toast({ title: "Versión restaurada", status: "success", duration: 4000 });
        }}
      />

      <CombinarVersionesModal
        isOpen={isOpenCombinar}
        onClose={closeCombinarModal}
        cotizacionId={cotizacionId}
        versiones={versionesParaCombinar}
        onCombinacionExitosa={async (cotizacionActualizada) => {
          const cotData = await cargarCotizacion(cotizacionActualizada.ID);
          // Adquirir bloqueo de la nueva versión combinada
          await adquirirBloqueo(cotizacionActualizada.ID);
          // Resetear flags ya que la combinación ya creó una nueva versión
          setHasUnsavedChanges(false);
          setRequiereNuevaVersion(false);

          // Actualizar snapshot de artículos originales con los artículos de la versión combinada
          // Esto evita que tienenCambiosReales() detecte diferencias falsas
          if (cotData && cotData.articulos) {
            const articulosLimpios = cotData.articulos.map(art =>
              cotizadorService.transformarArticuloParaFrontend(art)
            );
            articulosOriginalesRef.current = JSON.parse(JSON.stringify(articulosLimpios));
            console.log('📸 Snapshot actualizado después de combinar versiones:', articulosLimpios.length, 'artículos');
          }

          closeCombinarModal();
          toast({
            title: "Versiones combinadas",
            description: "Se ha creado una nueva versión con los cambios combinados",
            status: "success",
            duration: 4000,
          });
        }}
      />

      {isOpenGestorPedido && (() => {
        console.log('📊 Renderizando GestorPedido - cotizacion completa:', cotizacion);
        console.log('📊 cotizacionId:', cotizacionId);
        console.log('📊 cotizacion?.numero:', cotizacion?.numero);
        console.log('📊 cotizacion?.fecha:', cotizacion?.fecha);
        console.log('📊 cotizacion?.cliente:', cotizacion?.cliente);
        console.log('📊 cotizacion?.codigoCliente:', cotizacion?.codigoCliente);
        console.log('📊 cotizacion?.codigoVendedor:', cotizacion?.codigoVendedor);
        return null;
      })()}
      <GestorPedido
        isOpen={isOpenGestorPedido}
        onClose={() => {
          console.log('🔍 Cerrando GestorPedido');
          onCloseGestorPedido();
        }}
        item={{
          N_COTIZ: cotizacionId || cotizacion?.numero || cotizacion?.id,
          FECHA: cotizacion?.fecha,
          COD_CLIENT: cotizacion?.codigoCliente,
          RAZON_SOCI: cotizacion?.cliente
        }}
        tempInfoCli={{
          COD_CLIENT: cotizacion?.codigoCliente,
          RAZON_SOCI: cotizacion?.cliente,
          NOMBRES: cotizacion?.codigoVendedor,
          // Los siguientes campos los llenará el usuario en el formulario de transporte si son necesarios
          DOMICILIO: '',
          LOCALIDAD: '',
          NOMBRE_PRO: ''
        }}
        onPedidoCreated={(contacto) => {
          console.log('✅ Pedido creado vía:', contacto);
          toast({
            title: "Pedido creado exitosamente",
            description: `Pedido creado vía ${contacto || 'sistema'}`,
            status: "success",
            duration: 5000,
            isClosable: true
          });
          onCloseGestorPedido();
        }}
      />

      <AlertDialog isOpen={isOpenNuevaVersion} leastDestructiveRef={cancelRef} onClose={onCloseNuevaVersion} size="lg">
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader>
              <HStack>
                <Icon as={TimeIcon} color="blue.500" />
                <Text>Crear Nueva Versión</Text>
              </HStack>
            </AlertDialogHeader>
            <AlertDialogBody>
              <VStack spacing={4} align="stretch">
                <Alert status="info" borderRadius="md">
                  <AlertIcon />
                  <Box>
                    <AlertTitle fontSize="sm">Cambios detectados</AlertTitle>
                    <AlertDescription fontSize="xs">Se creará una nueva versión</AlertDescription>
                  </Box>
                </Alert>
                <Wrap spacing={2}>
                  {['Modificación de artículos', 'Adición de artículos', 'Eliminación de artículos', 'Actualización de precios'].map(motivo => (
                    <WrapItem key={motivo}>
                      <Badge
                        colorScheme="blue"
                        px={3}
                        py={1.5}
                        borderRadius="full"
                        cursor="pointer"
                        onClick={() => setRazonCambio(motivo)}
                      >
                        {motivo}
                      </Badge>
                    </WrapItem>
                  ))}
                </Wrap>
                <FormControl>
                  <FormLabel fontSize="sm">Motivo (opcional):</FormLabel>
                  <Textarea
                    placeholder="Motivo personalizado..."
                    value={razonCambio}
                    onChange={(e) => setRazonCambio(e.target.value)}
                    size="sm"
                    rows={3}
                  />
                </FormControl>
              </VStack>
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onCloseNuevaVersion}>Cancelar</Button>
              <Button colorScheme="blue" onClick={confirmarNuevaVersion} ml={3}>Crear Versión</Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}

export default CotizadorCore;
