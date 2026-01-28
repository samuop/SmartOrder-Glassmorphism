import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
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
  Flex,
  useToast,
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
  Portal,
  Switch,
  Tooltip,
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
  LinkIcon,
  CopyIcon,
  AttachmentIcon,
} from "@chakra-ui/icons";
import { SlSocialDropbox } from "react-icons/sl";
import { FaRobot } from "react-icons/fa";
import ClienteInfo from "./components/ClienteInfo";
import ArticulosTable from "./components/ArticulosTable";
import TotalesResumen from "./components/TotalesResumen";
import ListaCotizaciones from "./components/ListaCotizaciones";
import HistorialVersiones from "./components/HistorialVersiones";
import CombinarVersionesModal from "./components/CombinarVersionesModal";
import HistorialPedidos from "./components/HistorialPedidos";
import GestorPedido from "../CRM/components/GestorPedido/GestorPInicio";
import ModalOpcionesPedido from "./components/ModalOpcionesPedido";
import CotizadorHeader from "./components/CotizadorHeader";
import CotizadorActionBar from "./components/CotizadorActionBar";
import { ClearCotizacionDialog, NuevaVersionDialog } from "./components/CotizadorDialogs";

// Hooks personalizados
import { useCotizacion } from "./hooks/useCotizacion";
import { useArticulos } from "./hooks/useArticulos";
import { useBloqueo } from "./hooks/useBloqueo";
import { useAutoSave } from "./hooks/useAutoSave";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";

import { calcularTotales } from "./utils/calculos";

// Context
import { CotizadorProvider, useCotizadorUI } from "./context/CotizadorContext";

// Services
import cotizadorService from "../../services/cotizadorService";

function CotizadorV2() {
  const navigate = useNavigate();
  const location = useLocation();

  // Estados de UI desde Context
  const {
    vistaActual,
    loadError,
    razonCambio,
    percepcionesCliente,
    showIVA,
    applyDiscount,
    actualizarPrecios,
    previsualizacionPrecios,
    loadingPreview,
    setVista,
    setError,
    setRazonCambio,
    setPercepciones,
    setShowIVA,
    setApplyDiscount,
    setActualizarPrecios,
    setPreviewPrecios,
    setLoadingPreview,
  } = useCotizadorUI();

  // Toast debe declararse temprano porque se usa en varios callbacks
  const toast = useToast({ position: 'bottom' });

  // Hooks personalizados
  // Usar estrategia 'localStorage' para mantener compatibilidad con comportamiento actual
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
    inicializarNuevaCotizacion,
    crearNuevaCotizacion,
    cargarCotizacion,
    limpiarCotizacion,
    actualizarCotizacion,
    confirmarCliente,
  } = useCotizacion({
    persistenceStrategy: 'localStorage', // Estrategia por defecto para standalone
  });

  const {
    isLocked,
    lockedBy,
    modoEdicion,
    adquirirBloqueo,
    liberarBloqueo,
    verificarEstadoBloqueo,
  } = useBloqueo(cotizacionId);

  // Ref para tienenCambiosReales (se define más abajo pero se necesita en useArticulos)
  const tienenCambiosRealesRef = useRef(() => false);

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
    tienenCambiosReales: () => tienenCambiosRealesRef.current(),
  });

  // Autosave Hook
  // Devuelve true si la recuperación fue exitosa, false si no (ej: bloqueo no disponible)
  const handleRecovery = useCallback(async (recoveredArticulos, fecha) => {
    // Verificar si podemos editar antes de recuperar
    if (!modoEdicion) {
      // Verificar si la cotización está bloqueada por otro usuario
      if (lockedBy) {
        toast({
          title: "No se puede recuperar",
          description: `La cotización está siendo editada por ${lockedBy.nombre || 'otro usuario'}. No puedes recuperar los cambios hasta que termine.`,
          status: "warning",
          duration: 5000,
          isClosable: true,
        });
        return false; // Recuperación fallida
      }

      // Intentar adquirir el bloqueo
      const bloqueoAdquirido = await adquirirBloqueo(cotizacionId);
      if (!bloqueoAdquirido) {
        toast({
          title: "No se puede recuperar",
          description: "No se pudo adquirir el bloqueo de edición. Otro usuario puede estar editando la cotización.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
        return false; // Recuperación fallida
      }
    }

    // Mergear artículos recuperados con los actuales
    // El autosave solo guarda artículos con cambios (_isNew, _isModified, _isDeleted)
    // Debemos mantener los artículos guardados y agregar/actualizar los del autosave
    setArticulos(currentArticulos => {
      // Obtener artículos guardados (sin flags de cambio)
      const articulosGuardados = currentArticulos.filter(art =>
        !art._isNew && !art._isModified && !art._isDeleted
      );

      // Marcar artículos recuperados visualmente
      const articulosRecuperadosMarcados = recoveredArticulos.map(a => ({
        ...a,
        _recovered: true
      }));

      // Crear un mapa de IDs de artículos recuperados para detectar modificaciones
      const idsRecuperados = new Set(
        articulosRecuperadosMarcados
          .filter(a => a.id && !a._isNew)
          .map(a => a.id)
      );

      // Filtrar artículos guardados que no fueron modificados en el autosave
      const articulosGuardadosSinModificar = articulosGuardados.filter(art =>
        !idsRecuperados.has(art.id)
      );

      // Combinar: guardados sin modificar + recuperados (nuevos y modificados)
      // Usar _tempIndex para insertar los recuperados en la posición correcta
      const articulosMergeados = [...articulosGuardadosSinModificar];

      // Ordenar por _tempIndex de forma ascendente para que los splices sean correctos
      const recuperadosOrdenados = [...articulosRecuperadosMarcados].sort((a, b) =>
        (a._tempIndex ?? 0) - (b._tempIndex ?? 0)
      );

      recuperadosOrdenados.forEach(art => {
        const indexToInsert = art._tempIndex !== undefined ? art._tempIndex : articulosMergeados.length;
        // Asegurarse de no insertar fuera de los límites (aunque _tempIndex debería ser válido)
        const safeIndex = Math.min(indexToInsert, articulosMergeados.length);
        articulosMergeados.splice(safeIndex, 0, art);
      });

      console.log('🔄 Recovery merge (with order):', {
        guardadosOriginales: articulosGuardados.length,
        guardadosSinModificar: articulosGuardadosSinModificar.length,
        recuperados: recoveredArticulos.length,
        resultado: articulosMergeados.length
      });

      return articulosMergeados;
    });

    setHasUnsavedChanges(true);

    toast({
      title: "Datos recuperados",
      description: `Se han restaurado ${recoveredArticulos.length} artículos del autosave (${new Date(fecha).toLocaleString()}).`,
      status: "info",
      duration: 5000,
      isClosable: true,
    });

    return true; // Recuperación exitosa
  }, [setArticulos, setHasUnsavedChanges, toast, modoEdicion, lockedBy, adquirirBloqueo, cotizacionId]);

  const {
    isSaving: isAutoSaving,
    lastSaved: lastAutoSaved,
    recoveryAvailable,
    performRecovery,
    clearAutosave,
    resumeAutosave
  } = useAutoSave({
    cotizacionId,
    articulos,
    hasUnsavedChanges,
    onRecover: handleRecovery
  });

  // Hooks de Chakra UI
  const { isOpen: isOpenClearDialog, onOpen: onOpenClearDialog, onClose: onCloseClearDialog } = useDisclosure();
  const { isOpen: isOpenHistorial, onOpen: onOpenHistorial, onClose: onCloseHistorial } = useDisclosure();
  const { isOpen: isOpenHistorialPedidos, onOpen: onOpenHistorialPedidos, onClose: onCloseHistorialPedidos } = useDisclosure();
  const { isOpen: isOpenNuevaVersion, onOpen: onOpenNuevaVersion, onClose: onCloseNuevaVersion } = useDisclosure();
  const { isOpen: isOpenGestorPedido, onOpen: onOpenGestorPedido, onClose: onCloseGestorPedido } = useDisclosure();
  const { isOpen: isOpenOpcionesPedido, onOpen: onOpenOpcionesPedido, onClose: onCloseOpcionesPedido } = useDisclosure();
  const { isOpen: isOpenCombinar, onOpen: openCombinarModal, onClose: closeCombinarModal } = useDisclosure();
  const [versionesParaCombinar, setVersionesParaCombinar] = useState([]);
  const cancelRef = useRef();

  // Ref para guardar snapshot original de artículos (para comparación inteligente de versiones)
  const articulosOriginalesRef = useRef([]);

  // Refs para gestión de foco (Keyboard Navigation)
  const clienteSearchBtnRef = useRef(null);
  const articulosTableRef = useRef(null);

  // Definir Atajos de Teclado Globales
  useKeyboardShortcuts([
    {
      // F4: Crear Nueva (si no hay cot) o Buscar Cliente (si hay)
      keys: ['F4'],
      callback: () => {
        if (!cotizacion) {
          handleCrearNueva();
        } else if (clienteSearchBtnRef.current) {
          clienteSearchBtnRef.current.focus();
          clienteSearchBtnRef.current.click();
        }
      }
    },
    {
      // F10 o Ctrl+S: Guardar
      keys: ['Control', 's'],
      callback: () => {
        if (!cotizacionId) return;
        guardarCotizacion();
      }
    },
    {
      keys: ['F10'],
      callback: () => {
        if (!cotizacionId) return;
        guardarCotizacion();
      }
    },
    {
      // Ctrl+P: Imprimir/PDF
      keys: ['Control', 'p'],
      callback: () => {
        if (cotizacionId && articulos.length > 0) generarPDF();
      }
    },
    {
      // F2: Focus en Tabla o Agregar Artículo
      keys: ['F2'],
      callback: () => {
        if (cotizacion && articulosTableRef.current && articulosTableRef.current.focus) {
          articulosTableRef.current.focus();
        }
      }
    }
  ], true);

  /**
   * Comparar si realmente hubo cambios significativos en los artículos
   */
  const tienenCambiosReales = useCallback(() => {
    // Si no hay snapshot original, no hay con qué comparar
    if (articulosOriginalesRef.current.length === 0) {
      return false;
    }

    // Crear mapas por ID para comparación eficiente
    const originalesMap = new Map();
    articulosOriginalesRef.current.forEach(art => {
      originalesMap.set(art.id, art);
    });

    const actualesMap = new Map();
    const articulosActuales = articulos.filter(art => !art._isDeleted);
    articulosActuales.forEach(art => {
      // Ignorar artículos nuevos en la comparación de tamaño
      if (!art._isNew) {
        actualesMap.set(art.id, art);
      }
    });

    // Si hay artículos nuevos, hay cambio
    const articulosNuevos = articulosActuales.filter(art => art._isNew);
    if (articulosNuevos.length > 0) {
      return true;
    }

    // Comparar cantidad de artículos guardados
    if (actualesMap.size !== originalesMap.size) {
      return true;
    }

    // Comparar cada artículo actual con su original
    for (const [id, artActual] of actualesMap) {
      const artOriginal = originalesMap.get(id);

      if (!artOriginal) {
        return true;
      }

      // Comparar campos importantes (ignorar flags internos)
      const camposImportantes = ['codigo', 'descripcion', 'cantidad', 'bonif', 'precioSinImp', 'iva'];
      for (const campo of camposImportantes) {
        // Convertir a string para comparación más robusta
        const valorActual = String(artActual[campo] ?? '');
        const valorOriginal = String(artOriginal[campo] ?? '');

        if (valorActual !== valorOriginal) {
          return true;
        }
      }
    }

    return false;
  }, [articulos]);

  // Actualizar el ref cuando tienenCambiosReales cambie
  useEffect(() => {
    tienenCambiosRealesRef.current = tienenCambiosReales;
  }, [tienenCambiosReales]);

  // Colores del tema - Vision UI (el fondo transparente viene de la variante "pageContainer" del tema)
  const cardBg = useColorModeValue("white", "linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)");
  const borderColor = useColorModeValue("gray.200", "rgba(255, 255, 255, 0.125)");
  const primaryColor = useColorModeValue("gray.800", "white");
  const labelColor = useColorModeValue("gray.600", "gray.400");
  const accentColor = useColorModeValue("blue.500", "blue.400");

  // Sincronizar vista y cotización con URL (detectar cambios en URL por navegación)
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const idFromUrl = urlParams.get('id');

    if (idFromUrl) {
      const idNumerico = parseInt(idFromUrl);

      // Si hay ID en URL y es diferente al actual, cargar esa cotización
      if (idNumerico !== cotizacionId) {
        cargarCotizacion(idNumerico);
        verificarEstadoBloqueo();
      }

      // Cambiar a vista detalle
      setVista('detalle');
    } else {
      // Si no hay ID en URL, volver a lista
      if (cotizacionId) {
        // Limpiar cotización actual
        if (isLocked) {
          liberarBloqueo();
        }
        limpiarCotizacion();
      }
      setVista('lista');
    }
  }, [location.search]);

  useEffect(() => {
    const inicializar = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const idFromUrl = urlParams.get('id');

      if (idFromUrl) {
        setIsLoading(true);
        setError(null);
        setVista('detalle'); // Asegurar que se muestre la vista de detalle

        try {
          await cargarCotizacion(parseInt(idFromUrl));
          await verificarEstadoBloqueo();
        } catch (error) {
          console.error('Error en inicialización:', error);
          setError(error.message || 'Error al inicializar cotización');
          localStorage.removeItem('cotizacion_actual_id');
          navigate('/admin/cotizador', { replace: true });

          toast({
            title: "Error al cargar cotización",
            description: error.message || 'No se pudo cargar la cotización',
            status: "error",
            duration: 5000,
            isClosable: true,
          });
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
        setVista('lista'); // Si no hay ID, mostrar lista
      }
    };

    inicializar();

    return () => {
      if (cotizacionId && isLocked) {
        liberarBloqueo();
      }
    };
  }, []);

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
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Efecto para ajustar el switch de IVA cuando cambia el talonario de factura
  // Si el talonario es "90" (factura B para consumidor final), mostrar sin IVA por defecto
  useEffect(() => {
    if (cotizacion?.talonarioFactura === '90') {
      setShowIVA(false);
    } else if (cotizacion?.talonarioFactura) {
      // Para otros talonarios (A, etc), mostrar con IVA
      setShowIVA(true);
    }
  }, [cotizacion?.talonarioFactura]);

  // Función para cargar percepciones del cliente (puede llamarse manualmente)
  const cargarPercepcionesDelCliente = useCallback(async () => {
    if (!clienteConfirmado || !cotizacion?.codigoCliente) {
      setPercepciones([]);
      return;
    }

    try {
      const response = await cotizadorService.obtenerPercepcionesCliente(
        cotizacion.codigoCliente,
        cotizacion.tipoCliente || 'O'
      );

      if (response.success) {
        setPercepciones(response.data || []);

      }
    } catch (error) {
      console.error('Error al cargar percepciones del cliente:', error);
      setPercepciones([]);
    }
  }, [clienteConfirmado, cotizacion?.codigoCliente, cotizacion?.tipoCliente]);

  // Cargar percepciones del cliente cuando está confirmado
  useEffect(() => {
    cargarPercepcionesDelCliente();
  }, [cargarPercepcionesDelCliente]);

  // Efecto para auto-enfocar la tabla cuando se confirma el cliente (Smart Flow)
  useEffect(() => {
    if (clienteConfirmado && articulosTableRef.current) {
      setTimeout(() => {
        if (articulosTableRef.current && articulosTableRef.current.focus) {
          articulosTableRef.current.focus();
        }
      }, 100);
    }
  }, [clienteConfirmado]);


  const guardarCotizacion = async () => {
    // Si no hay cotizacionId, el usuario no confirmó el cliente
    if (!cotizacionId) {
      toast({
        title: "Cliente requerido",
        description: "Debes confirmar un cliente antes de guardar la cotización",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setIsSaving(true);

    try {
      const tieneArticulosGuardados = articulos.some(art => !art._isNew && !art._isDeleted);
      const esNueva = !tieneArticulosGuardados;
      const hayCambiosReales = tienenCambiosReales();

      // Requiere nueva versión si hay cambios en artículos O si se marcó explícitamente (ej: bonificación general, fecha validez)
      const debeCrearNuevaVersion = !esNueva && tieneArticulosGuardados && (hayCambiosReales || requiereNuevaVersion);

      if (debeCrearNuevaVersion) {
        setRazonCambio('');
        onOpenNuevaVersion();
        setIsSaving(false);
        return;
      }

      if (!hayCambiosReales && !requiereNuevaVersion) {
        setRequiereNuevaVersion(false);
      }

      await guardarCambiosArticulos();

      const datosActualizados = cotizadorService.transformarCotizacionParaBackend(cotizacion);
      const response = await cotizadorService.actualizarCotizacion(cotizacionId, datosActualizados);

      if (response.success) {
        // 1. Limpiar estado de cambios no guardados y autosave inmediatamente
        setHasUnsavedChanges(false);
        await clearAutosave();

        // 2. Recargar datos actualizados desde el backend
        const cotizacionActualizada = await cargarCotizacion(cotizacionId);

        if (cotizacionActualizada && cotizacionActualizada.articulos) {
          const articulosLimpios = cotizacionActualizada.articulos.map(art =>
            cotizadorService.transformarArticuloParaFrontend(art)
          );
          articulosOriginalesRef.current = JSON.parse(JSON.stringify(articulosLimpios));
          console.log('📸 Snapshot actualizado después de guardar:', articulosLimpios.length, 'artículos');
        }

        // 3. Re-habilitar autosave DESPUÉS de que todo haya terminado
        // Usamos un pequeño delay para asegurar que el estado se estabilizó
        setTimeout(() => {
          resumeAutosave();
        }, 1000);

        toast({
          title: "Cotización guardada",
          description: "Los cambios se guardaron correctamente",
          status: "success",
          duration: 3000,
          isClosable: true,
          position: "bottom",
        });
      }
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      toast({
        title: "Error al guardar",
        description: error.message || "No se pudieron guardar los cambios",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // En caso de error, también re-habilitar autosave para no dejarlo bloqueado
      resumeAutosave();
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Cargar previsualización de cambios de precios
   */
  const cargarPrevisualizacionPrecios = async () => {
    setLoadingPreview(true);
    try {
      const response = await cotizadorService.obtenerPreciosActuales(cotizacionId);

      if (response.success) {
        setPreviewPrecios(response.data);

        // Mostrar toast si hay artículos sin precio
        if (response.data.resumen.sinPrecio > 0) {
          toast({
            title: "Algunos artículos sin precio actual",
            description: `${response.data.resumen.sinPrecio} artículos mantendrán su precio histórico`,
            status: "warning",
            duration: 5000,
            isClosable: true,
          });
        }
      }
    } catch (error) {
      console.error('Error al cargar preview de precios:', error);
      toast({
        title: "Error al consultar precios",
        description: "No se pudo obtener la previsualización. Se continuará sin ella.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const confirmarNuevaVersion = async () => {
    onCloseNuevaVersion();
    setIsSaving(true);

    try {
      const responseVersion = await cotizadorService.crearVersion(
        cotizacionId,
        razonCambio,
        actualizarPrecios
      );

      if (responseVersion.success) {
        await guardarCambiosArticulos();

        const datosActualizados = cotizadorService.transformarCotizacionParaBackend(cotizacion);
        await cotizadorService.actualizarCotizacion(cotizacionId, datosActualizados);

        // Limpiar autosave después de guardar exitosamente
        setHasUnsavedChanges(false);
        await clearAutosave();

        const cotizacionActualizada = await cargarCotizacion(cotizacionId);

        setRequiereNuevaVersion(false);

        // Actualizar snapshot después de crear nueva versión
        if (cotizacionActualizada && cotizacionActualizada.articulos) {
          const articulosLimpios = cotizacionActualizada.articulos.map(art =>
            cotizadorService.transformarArticuloParaFrontend(art)
          );
          articulosOriginalesRef.current = JSON.parse(JSON.stringify(articulosLimpios));
          console.log('📸 Snapshot actualizado después de nueva versión:', articulosLimpios.length, 'artículos');
        }

        // Re-habilitar autosave DESPUÉS de que todo haya terminado
        setTimeout(() => {
          resumeAutosave();
        }, 1000);

        // Mensaje mejorado si se actualizaron precios
        const mensaje = actualizarPrecios
          ? `Versión ${responseVersion.data.VERSION} creada con precios actualizados`
          : `Versión ${responseVersion.data.VERSION} creada y guardada exitosamente`;

        toast({
          title: "Nueva versión creada",
          description: mensaje,
          status: "success",
          duration: 4000,
          isClosable: true,
        });

        // Limpiar estado de preview
        setActualizarPrecios(false);
        setPreviewPrecios(null);
      }
    } catch (error) {
      console.error('Error al crear nueva versión:', error);
      toast({
        title: "Error al crear versión",
        description: error.message || "No se pudo crear la nueva versión",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      // En caso de error, también re-habilitar autosave
      resumeAutosave();
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

      toast({
        title: "Cotización cerrada",
        description: "Puedes crear una nueva o cargar otra existente",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al limpiar cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo cerrar la cotización",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const cancelarCotizacion = async () => {
    if (window.confirm('¿Estás seguro que deseas cancelar esta cotización? Esta acción no se puede deshacer.')) {
      try {
        if (cotizacionId) {
          await cotizadorService.eliminarCotizacion(cotizacionId, true);
        }

        if (cotizacionId && isLocked) {
          await liberarBloqueo();
        }

        limpiarCotizacion();

        toast({
          title: "Cotización cancelada",
          description: "La cotización ha sido eliminada",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        console.error('Error al cancelar cotización:', error);
        toast({
          title: "Error al cancelar",
          description: error.message || "No se pudo cancelar la cotización",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleCrearNueva = async () => {
    // Liberar bloqueo si existe de una cotización anterior
    if (cotizacionId && isLocked) {
      await liberarBloqueo();
    }

    // Resetear flags de cambios
    setHasUnsavedChanges(false);
    setRequiereNuevaVersion(false);

    // Limpiar snapshot de artículos originales para evitar comparaciones falsas
    articulosOriginalesRef.current = [];

    const codigoVendedor = Cookies.get('COD_VENDED') || "1";

    // Inicializar cotización en estado local (sin crear en backend)
    // La cotización se creará en el backend cuando se confirme el cliente
    inicializarNuevaCotizacion(codigoVendedor);

    // Limpiar URL (no hay ID todavía)
    navigate('/admin/cotizador', { replace: true });

    // Cambiar a vista de detalle
    setVista('detalle');
  };

  /**
   * Manejar confirmación de cliente
   * Si es una cotización nueva (sin ID), crear en backend al confirmar cliente
   */
  const handleConfirmarCliente = async () => {
    // Si ya tiene ID, solo confirmar cliente localmente
    if (cotizacionId) {
      confirmarCliente();
      return;
    }

    // Si no hay cliente seleccionado, solo confirmar localmente para acceder a artículos
    // (sin crear en backend todavía)
    if (!cotizacion?.codigoCliente) {
      confirmarCliente();
      return;
    }

    setIsSaving(true);

    try {
      console.log('🆕 Creando cotización en backend al confirmar cliente...', cotizacion);
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

      setCotizacionId(nuevoId);

      // Actualizar URL con el nuevo ID
      navigate(`?id=${nuevoId}`, { replace: true });

      // Adquirir bloqueo para la cotización recién creada
      await adquirirBloqueo(nuevoId, true);

      // Confirmar cliente localmente (sin toast)
      confirmarCliente(true);

      // Recargar cotización desde backend para sincronizar
      await cargarCotizacion(nuevoId);

    } catch (error) {
      console.error('Error al crear cotización:', error);
      toast({
        title: "Error al crear cotización",
        description: error.message || "No se pudo crear la cotización",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const copiarLinkCotizacion = () => {
    if (!cotizacionId) return;

    const url = `${window.location.origin}${window.location.pathname}?id=${cotizacionId}`;

    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "Link copiado",
        description: "El enlace de la cotización se copió al portapapeles",
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    }).catch((err) => {
      console.error('Error al copiar:', err);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    });
  };

  const generarPDF = async () => {
    try {
      setIsSaving(true);

      // Llamar al backend para generar y guardar el PDF
      // Enviar el estado del switch showIVA y applyDiscount
      const response = await cotizadorService.generarPdf(cotizacionId, {
        mostrarConIVA: showIVA,
        aplicarDescuento: applyDiscount
      });

      if (response.success) {
        // Descargar el PDF generado
        await cotizadorService.descargarPdfActual(cotizacionId);

        toast({
          title: "PDF generado",
          description: `PDF guardado exitosamente - Versión ${cotizacion.VERSION} ${showIVA ? '(con IVA)' : '(sin IVA)'}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast({
        title: "Error al generar PDF",
        description: error.message || "No se pudo generar el PDF",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const crearPedidoTango = async () => {
    if (!cotizacionId) {
      toast({
        title: "Error",
        description: "No hay cotización para convertir en pedido",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (!clienteConfirmado || !cotizacion?.codigoCliente) {
      toast({
        title: "Cliente requerido",
        description: "Debes confirmar un cliente antes de crear un pedido",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (articulos.length === 0) {
      toast({
        title: "Sin artículos",
        description: "Agrega al menos un artículo para crear el pedido",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    if (hasUnsavedChanges) {
      const confirmar = window.confirm(
        'Hay cambios sin guardar. ¿Deseas guardar la cotización antes de crear el pedido?'
      );
      if (confirmar) {
        await guardarCotizacion();
      } else {
        return;
      }
    }

    try {
      setIsSaving(true);

      const resultado = await cotizadorService.crearPedidoDesdeCotizacion(cotizacionId);

      console.log('📦 Resultado recibido:', resultado);

      // Verificar si la respuesta tiene succeeded: false (error de Tango)
      if (resultado.succeeded === false) {
        const errorMessages = resultado.exceptionInfo?.messages || [];
        const errorDetails = resultado.exceptionInfo?.detailMessages || [];
        const allErrors = [...errorMessages, ...errorDetails].join('\n');

        toast({
          title: resultado.exceptionInfo?.title || "Error al crear pedido",
          description: allErrors || resultado.message || "No se pudo crear el pedido en Tango",
          status: "error",
          duration: 10000,
          isClosable: true,
          position: "bottom",
        });
        return; // Salir sin recargar
      }

      // Verificar si la respuesta tiene succeeded: true (éxito de Tango)
      if (resultado.succeeded === true) {
        const pedidoNumero = resultado.savedId || resultado.pedido?.numero || 'Sin número';

        toast({
          title: resultado.reintentoFCE ? "¡Pedido FCE creado!" : "¡Pedido creado exitosamente!",
          description: resultado.reintentoFCE
            ? `Pedido #${pedidoNumero} creado automáticamente con Factura de Crédito Electrónica.`
            : `Pedido #${pedidoNumero} creado en Tango`,
          status: "success",
          duration: 7000,
          isClosable: true,
          position: "bottom",
        });

        // Recargar cotización para actualizar el estado
        await cargarCotizacion(cotizacionId);
        return;
      }

      // Formato de respuesta legacy (success/error)
      if (resultado.success) {
        const pedidoNumero = resultado.pedido?.numero || resultado.savedId || 'Sin número';

        toast({
          title: resultado.reintentoFCE ? "¡Pedido FCE creado!" : "¡Pedido creado exitosamente!",
          description: resultado.reintentoFCE
            ? `Pedido #${pedidoNumero} creado automáticamente con Factura de Crédito Electrónica.`
            : `Pedido #${pedidoNumero} creado en Tango`,
          status: "success",
          duration: 7000,
          isClosable: true,
          position: "bottom",
        });

        await cargarCotizacion(cotizacionId);
        return;
      }

      // Si llegamos aquí, algo salió mal
      throw new Error(resultado.error || resultado.message || 'Error desconocido al crear pedido');

    } catch (error) {
      console.error('Error al crear pedido en Tango:', error);

      toast({
        title: "Error al crear pedido",
        description: error.message || "No se pudo crear el pedido en Tango. Verifica la configuración.",
        status: "error",
        duration: 7000,
        isClosable: true,
        position: "bottom",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportarArticulos = async (articulosImportados) => {
    try {
      // Agregar cada artículo importado a la cotización
      for (const art of articulosImportados) {
        await agregarArticulo(art);
      }

      toast({
        title: "Importación exitosa",
        description: `Se agregaron ${articulosImportados.length} artículos`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al importar artículos:', error);
      toast({
        title: "Error al importar",
        description: error.message || "No se pudieron agregar los artículos",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // ==================== RENDER ====================

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="transparent">
        <VStack spacing={4}>
          <Spinner size="xl" color={accentColor} thickness="4px" />
          <Text color={labelColor}>Cargando cotización...</Text>
        </VStack>
      </Flex>
    );
  }

  if (loadError) {
    return (
      <Flex justify="center" align="center" minH="100vh" bg="transparent" p={8}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          maxW="500px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Error al cargar cotización
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            {loadError}
          </AlertDescription>
          <HStack spacing={3} mt={4}>
            <Button
              colorScheme="blue"
              onClick={() => {
                setError(null);
                navigate('/admin/cotizador', { replace: true });
                setVista('lista');
              }}
            >
              Volver al historial
            </Button>
            <Button
              variant="outline"
              colorScheme="blue"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </HStack>
        </Alert>
      </Flex>
    );
  }

  if (vistaActual === 'lista') {
    return <ListaCotizaciones
      onSeleccionar={async (id) => {
        await cargarCotizacion(id);
        // Actualizar la URL con el ID de la cotización usando navigate
        // NO usar replace para que se agregue al historial
        navigate(`?id=${id}`);
        // NO adquirir bloqueo automáticamente - abrir en modo lectura
        setVista('detalle');
      }}
      onNueva={async () => {
        await handleCrearNueva();
        setVista('detalle');
      }}
      onVolver={() => {
        // Mantener en la lista al hacer volver
        navigate('/admin/cotizador', { replace: true });
      }}
    />;
  }

  if (!cotizacion) {
    // Si no hay cotización cargada, mostrar el historial directamente
    return <ListaCotizaciones
      onSeleccionar={async (id) => {
        await cargarCotizacion(id);
        // NO usar replace para que se agregue al historial
        navigate(`?id=${id}`);
        setVista('detalle');
      }}
      onNueva={async () => {
        await handleCrearNueva();
        setVista('detalle');
      }}
      onVolver={() => {
        navigate('/admin/cotizador', { replace: true });
      }}
    />;
  }

  // Preparar datos del cliente con percepciones para el cálculo de totales
  const clienteParaTotales = clienteConfirmado && cotizacion?.codigoCliente ? {
    codCliente: cotizacion.codigoCliente,
    percepciones: percepcionesCliente
  } : null;

  const totalesCalculados = calcularTotales(cotizacion, articulos, clienteParaTotales);

  return (
    <Box variant="pageContainer" p={8} pt={24}>
      <VStack spacing={6} align="stretch" maxW="1400px" mx="auto">
        {/* Header Principal */}
        <CotizadorHeader
          cotizacion={cotizacion}
          cotizacionId={cotizacionId}
          modoEdicion={modoEdicion}
          isLocked={isLocked}
          lockedBy={lockedBy}
          hasUnsavedChanges={hasUnsavedChanges}
          requiereNuevaVersion={requiereNuevaVersion}
          onBack={async () => {
            if (hasUnsavedChanges) {
              const confirmarDescarte = window.confirm(
                "Tienes cambios sin guardar. ¿Estás seguro de que deseas salir y DESCARTAR los cambios?"
              );

              if (!confirmarDescarte) {
                return; // Usuario canceló, se queda en la pantalla
              }
              // Usuario confirmó descartar, continuamos con la salida...
            }

            if (isLocked) {
              await liberarBloqueo();
            }
            limpiarCotizacion();
            navigate('/admin/cotizador');
          }}
          onEdit={async () => {
            const resultado = await adquirirBloqueo(cotizacionId);
            if (!resultado) {
              toast({
                title: "No se pudo editar",
                description: `La cotización está siendo editada por ${lockedBy?.nombre || 'otro usuario'}`,
                status: "warning",
                duration: 4000,
                isClosable: true,
              });
            }
          }}
          onStopEdit={async () => {
            if (hasUnsavedChanges) {
              const confirmar = window.confirm('Hay cambios sin guardar. ¿Deseas salir del modo edición sin guardar?');
              if (!confirmar) return;
            }
            await liberarBloqueo();
          }}
          onOpenHistorial={onOpenHistorial}
        />

        {/* Alerta de Autosave Recuperable */}
        {recoveryAvailable && (
          <Alert status="warning" mb={4} borderRadius="md">
            <Icon as={FaRobot} mr={3} w={6} h={6} color="orange.400" />
            <Box flex="1">
              <AlertTitle>Recuperación disponible</AlertTitle>
              <AlertDescription display="block">
                Hay una versión no guardada de esta cotización ({lastAutoSaved ? new Date(lastAutoSaved).toLocaleTimeString() : 'reciente'}).
              </AlertDescription>
            </Box>
            <HStack>
              <Button size="sm" colorScheme="orange" onClick={performRecovery}>
                Recuperar
              </Button>
              <Button size="sm" variant="ghost" onClick={clearAutosave}>
                Descartar
              </Button>
            </HStack>
          </Alert>
        )}

        {/* Alerta si está bloqueada */}
        {!isLocked && lockedBy && (
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            <Box flex="1">
              <AlertTitle>Cotización bloqueada</AlertTitle>
              <AlertDescription display="block">
                Esta cotización está siendo editada por {lockedBy.nombre}.
                Podrás editarla cuando termine o cuando expire el bloqueo.
              </AlertDescription>
            </Box>
          </Alert>
        )}

        {/* Información del Cliente */}
        <ClienteInfo
          cotizacion={cotizacion}
          setCotizacion={actualizarCotizacion}
          onConfirmar={handleConfirmarCliente}
          onCancelar={cancelarCotizacion}
          clienteConfirmado={clienteConfirmado}
          isDisabled={!modoEdicion}
          onPercepcionesActualizadas={cargarPercepcionesDelCliente}
          setHasUnsavedChanges={setHasUnsavedChanges}
          setRequiereNuevaVersion={setRequiereNuevaVersion}
          focusRef={clienteSearchBtnRef}
        />


        {/* Tabla de Artículos */}
        {clienteConfirmado && (
          <ArticulosTable
            articulos={articulos.filter(art => !art._isDeleted)}
            setArticulos={setArticulos}
            agregarArticulo={agregarArticulo}
            eliminarArticulo={eliminarArticulo}
            onLimpiarCotizacion={onOpenClearDialog}
            isDisabled={!modoEdicion}
            onArticuloChange={actualizarArticulo}
            onReplaceArticle={reemplazarArticulo}
            ref={articulosTableRef}
            showIVA={showIVA}
            applyDiscount={applyDiscount}
            onShowIVAChange={setShowIVA}
            onApplyDiscountChange={setApplyDiscount}
          />
        )}

        {/* Totales */}
        {clienteConfirmado && (
          <TotalesResumen
            totales={totalesCalculados}
            cotizacion={cotizacion}
            onUpdateCotizacion={actualizarCotizacion}
            isDisabled={!modoEdicion}
            setHasUnsavedChanges={setHasUnsavedChanges}
          />
        )}

        {/* Botones de Acción */}
        <CotizadorActionBar
          cotizacionId={cotizacionId}
          articulos={articulos.filter(art => !art._isDeleted)}
          showIVA={showIVA}
          applyDiscount={applyDiscount}
          modoEdicion={modoEdicion}
          hasUnsavedChanges={hasUnsavedChanges}
          requiereNuevaVersion={requiereNuevaVersion}
          clienteConfirmado={clienteConfirmado}
          isSaving={isSaving}
          onCopyLink={copiarLinkCotizacion}
          onGeneratePDF={generarPDF}
          onOpenPedidos={onOpenOpcionesPedido}
          onSave={guardarCotizacion}
        />
      </VStack>

      {/* Diálogo de Confirmación para Limpiar */}
      <ClearCotizacionDialog
        isOpen={isOpenClearDialog}
        onClose={onCloseClearDialog}
        onConfirm={handleLimpiarCotizacion}
      />

      <HistorialVersiones
        isOpen={isOpenHistorial}
        onClose={onCloseHistorial}
        cotizacionId={cotizacionId}
        modoEdicion={modoEdicion}
        showIVA={showIVA}
        applyDiscount={applyDiscount}
        onOpenCombinar={(versiones) => {
          setVersionesParaCombinar(versiones);
          onCloseHistorial();
          openCombinarModal();
        }}
        onRestaurar={async (versionRestaurada) => {
          await cargarCotizacion(versionRestaurada.ID);
          setRequiereNuevaVersion(false);

          toast({
            title: "Versión restaurada",
            description: `Se ha restaurado la versión ${versionRestaurada.VERSION}`,
            status: "success",
            duration: 4000,
            isClosable: true,
          });
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

      {/* Modal de Historial de Pedidos */}
      <HistorialPedidos
        isOpen={isOpenHistorialPedidos}
        onClose={onCloseHistorialPedidos}
        cotizacionId={cotizacionId}
      />

      {/* Modal de Opciones de Pedido */}
      <ModalOpcionesPedido
        isOpen={isOpenOpcionesPedido}
        onClose={onCloseOpcionesPedido}
        cotizacion={cotizacion}
        onCrearPedidoTango={crearPedidoTango}
        onCrearPedidoDeposito={() => {
          onCloseOpcionesPedido();
          onOpenGestorPedido();
        }}
        onVerHistorial={onOpenHistorialPedidos}
      />

      {/* Modal de Gestor de Pedido para Depósito */}
      {isOpenGestorPedido && (
        <Portal>
          <GestorPedido
            isOpen={isOpenGestorPedido}
            onClose={onCloseGestorPedido}
            item={{
              N_COTIZ: cotizacion?.numero,
              FECHA: cotizacion?.fecha,
              COD_CLIENT: cotizacion.tipoCliente == "H" ? cotizacion?.codigoCliente : "000000",
              RAZON_SOCI: cotizacion?.cliente,
              VERSION: cotizacion?.VERSION || 1,
              ID: cotizacionId
            }}
            isRecordatorio={false}
            origenVenta={cotizacion?.origenVenta}
            articulos={articulos
              .filter(art => !art._isDeleted)
              .map(a => ({
                codigo: a.codigo || a.codArticu || a.codigoArticulo || a.COD_ARTICU || a.cod || '',
                cantidad: a.cantidad ?? a.cantPed ?? a.cantCotizada ?? a.cant ?? 0,
                descripcion: a.descripcion || a.DESCRIPCIO || a.desc || ''
              }))}

            tempInfoCli={{
              COD_CLIENT: cotizacion.tipoCliente == "H" ? cotizacion?.codigoCliente : "000000",
              RAZON_SOCI: cotizacion?.cliente,
              NOMBRES: cotizacion?.vendedor
            }}
            onPedidoCreated={() => {
              // El GestorPedidoModal ya muestra su propio toast
              onCloseGestorPedido();
            }}
          />
        </Portal>
      )}

      {/* Modal de Nueva Versión */}
      <NuevaVersionDialog
        isOpen={isOpenNuevaVersion}
        onClose={() => {
          onCloseNuevaVersion();
          setIsSaving(false);
        }}
        onConfirm={confirmarNuevaVersion}
        razonCambio={razonCambio}
        onRazonChange={setRazonCambio}
        actualizarPrecios={actualizarPrecios}
        onActualizarPreciosChange={setActualizarPrecios}
        previsualizacionPrecios={previsualizacionPrecios}
        loadingPreview={loadingPreview}
        onLoadPreview={cargarPrevisualizacionPrecios}
      />
    </Box>
  );
}

// Wrapper con Provider para inyectar Context
function CotizadorWithProvider() {
  return (
    <CotizadorProvider>
      <CotizadorV2 />
    </CotizadorProvider>
  );
}

export default CotizadorWithProvider;
