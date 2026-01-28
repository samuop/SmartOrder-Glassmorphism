import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardBody,
  Grid,
  GridItem,
  Text,
  Input,
  Select,
  Radio,
  RadioGroup,
  HStack,
  Heading,
  NumberInput,
  NumberInputField,
  useColorModeValue,
  useColorMode,
  Button,
  VStack,
  Alert,
  AlertIcon,
  Tooltip,
  Flex,
  useDisclosure,
  Switch,
  Badge,
} from "@chakra-ui/react";
import { DeleteIcon, SearchIcon, AddIcon, LockIcon, ViewOffIcon } from "@chakra-ui/icons";
import DatePicker, { registerLocale } from "react-datepicker";
import es from "date-fns/locale/es";
import "react-datepicker/dist/react-datepicker.css";
import BusquedaCliente from "./BusquedaCliente";
import FormularioClienteOcasional from "./FormularioClienteOcasional"; // Ahora usa la estructura modular
import cotizadorService from "../../../services/cotizadorService";
import useKeyboardShortcuts from "../hooks/useKeyboardShortcuts";
import Cookies from 'js-cookie';

// Registrar locale español para el datepicker
registerLocale("es", es);

// Importar módulo de gestión de clientes
import {
  TIPO_CLIENTE,
  useClienteHabitual,
  VistaClienteHabitual
} from "./ClienteManager";

// Función para formatear fecha manualmente a dd/mm/aaaa
const formatearFechaManual = (fecha) => {
  if (!fecha) return '';
  const date = new Date(fecha);
  if (isNaN(date.getTime())) return '';

  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const anio = date.getFullYear();

  return `${dia}/${mes}/${anio}`;
};

// Definir FieldCompact FUERA del componente para evitar recreación
const FieldCompact = ({ label, children }) => (
  <HStack align="center" spacing={2}>
    <Box width="100px" minWidth="80px" display="flex" alignItems="center">
      <Text variant="label">{label}</Text>
    </Box>
    <Box flex="1">{children}</Box>
  </HStack>
);

const ClienteInfo = ({
  cotizacion,
  setCotizacion,
  onConfirmar,
  onCancelar,
  clienteConfirmado,
  isDisabled,
  desdePerfilCliente = false,
  onPercepcionesActualizadas = null,
  setHasUnsavedChanges = null,
  setRequiereNuevaVersion = null, // Para marcar cambios que requieren nueva versión
  focusRef = null // Nueva prop para manejar foco externamente
}) => {
  const IS_MODULE_DISABLED = false; // 🔒 activar/desactivar módulo

  // Colores Vision UI
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  // Estilos glass para Card
  const cardBg = isDark
    ? 'linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)'
    : 'white';
  const cardBorderColor = isDark ? 'rgba(255, 255, 255, 0.125)' : 'gray.200';

  // Colores adicionales para el componente (fuera del JSX para evitar violación de reglas de hooks)
  const searchBoxBg = isDark ? 'blue.900' : 'blue.50';
  const searchBoxBorderColor = isDark ? 'blue.700' : 'blue.200';
  const searchIconColor = isDark ? 'blue.300' : 'blue.600';
  const searchTitleColor = isDark ? 'blue.100' : 'blue.800';
  const searchTextColor = isDark ? 'gray.300' : 'gray.600';
  const privacyBoxBg = isDark ? 'purple.900' : 'purple.50';
  const privacyBoxBorderColor = isDark ? 'purple.700' : 'purple.200';
  const privacyTitleColor = isDark ? 'purple.200' : 'purple.700';
  const privacyTextColor = isDark ? 'gray.400' : 'gray.600';

  // Estado para mostrar/ocultar búsqueda
  const [mostrarBusqueda, setMostrarBusqueda] = useState(false);

  // Estado para rastrear si el cliente fue cargado desde búsqueda
  const [clienteCargadoDesdeBusqueda, setClienteCargadoDesdeBusqueda] = useState(false);

  // Estado para almacenar el cliente actual completo (para modo edición)
  const [clienteParaEditar, setClienteParaEditar] = useState(null);

  // Modal de cliente ocasional
  const { isOpen: isOpenClienteOcasional, onOpen: onOpenClienteOcasional, onClose: onCloseClienteOcasional } = useDisclosure();

  // Modal de cliente habitual (vista de información)
  const { isOpen: isOpenClienteHabitual, onOpen: onOpenClienteHabitual, onClose: onCloseClienteHabitual } = useDisclosure();

  // Hook para manejar clientes habituales
  const {
    cliente: clienteHabitualDetalle,
    isLoading: isLoadingClienteHabitual,
    percepciones: percepcionesClienteHabitual,
    estadoCuenta,
    cargarClienteHabitual,
  } = useClienteHabitual({
    codigoCliente: cotizacion?.tipoCliente === TIPO_CLIENTE.HABITUAL ? cotizacion?.codigoCliente : null,
    enabled: false // Solo cargar cuando se abre el modal
  });

  // Estados para opciones de Tango
  const [condicionesVenta, setCondicionesVenta] = useState([]);
  const [listasPrecios, setListasPrecios] = useState([]);
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [talonariosPedidos, setTalonariosPedidos] = useState([]);
  const [talonariosFacturas, setTalonariosFacturas] = useState([]);
  const [cargandoMaestros, setCargandoMaestros] = useState(false);

  // Estado para permisos de privacidad
  const [permisosPrivacidad, setPermisosPrivacidad] = useState({
    puedeCrearPrivadas: false,
    puedeVerTodasPrivadas: false,
    cargado: false
  });

  // Refs para navegación con teclado
  const condicionRef = useRef(null);
  const listaPreciosRef = useRef(null);
  const talonarioPedidoRef = useRef(null);
  const talonarioFacturaRef = useRef(null);
  const confirmarRef = useRef(null);

  // Función para manejar Enter - ELIMINADA (Usuario prefiere TAB)

  // Validar si los campos obligatorios están completos
  // Permitir confirmar sin cliente para poder acceder a la tabla de artículos
  const camposCompletos = true;

  // Memoizar callbacks para evitar pérdida de foco
  const handleTipoClienteChange = useCallback((e) => {
    const nuevoTipo = e.target.value;
    const tipoAnterior = cotizacion.tipoCliente;

    // Si selecciona "Seleccionar..." (vacío), limpiar todo
    if (nuevoTipo === '') {
      setCotizacion((prev) => ({
        ...prev,
        tipoCliente: '',
        codigoCliente: '',
        cliente: '',
      }));
      setClienteCargadoDesdeBusqueda(false);
    }
    // Si cambia entre H y O, limpiar datos del cliente
    else if ((tipoAnterior === 'H' && nuevoTipo === 'O') || (tipoAnterior === 'O' && nuevoTipo === 'H')) {
      setCotizacion((prev) => ({
        ...prev,
        tipoCliente: nuevoTipo,
        codigoCliente: nuevoTipo === 'O' ? '000000' : '',
        cliente: '',
      }));
      setClienteCargadoDesdeBusqueda(false);
    } else {
      setCotizacion((prev) => ({
        ...prev,
        tipoCliente: nuevoTipo,
      }));
    }
  }, [setCotizacion, cotizacion.tipoCliente]);

  const handleCodigoClienteChange = useCallback((e) => {
    setCotizacion((prev) => ({
      ...prev,
      codigoCliente: e.target.value.toUpperCase(),
    }));
  }, [setCotizacion]);

  const handleClienteChange = useCallback((e) => {
    setCotizacion((prev) => ({
      ...prev,
      cliente: e.target.value,
    }));
  }, [setCotizacion]);

  const handleOrigenVentaChange = useCallback((val) => {
    setCotizacion((prev) => ({
      ...prev,
      origenVenta: val,
    }));
    // Marcar cambios si la función existe (puede no existir en modo modal)
    setHasUnsavedChanges?.(true);
    setRequiereNuevaVersion?.(true); // Cambio de origen de venta requiere nueva versión
  }, [setCotizacion, setHasUnsavedChanges, setRequiereNuevaVersion]);

  const handleCondicionVentaChange = useCallback((e) => {
    setCotizacion((prev) => ({
      ...prev,
      condicion: e.target.value,
    }));
    // Marcar cambios si la función existe (puede no existir en modo modal)
    setHasUnsavedChanges?.(true);
    setRequiereNuevaVersion?.(true); // Cambio de condición de venta requiere nueva versión
  }, [setCotizacion, setHasUnsavedChanges, setRequiereNuevaVersion]);

  const handleListaPreciosChange = useCallback((e) => {
    setCotizacion((prev) => ({
      ...prev,
      listaPrecios: e.target.value,
    }));
    // Marcar cambios si la función existe (puede no existir en modo modal)
    setHasUnsavedChanges?.(true);
    setRequiereNuevaVersion?.(true); // Cambio de lista de precios requiere nueva versión
  }, [setCotizacion, setHasUnsavedChanges, setRequiereNuevaVersion]);

  const handleTipoDocumentoChange = useCallback((e) => {
    setCotizacion((prev) => ({
      ...prev,
      tipoDocumento: e.target.value,
    }));
    setHasUnsavedChanges?.(true);
  }, [setCotizacion, setHasUnsavedChanges]);

  const handleTalonarioChange = useCallback((e) => {
    setCotizacion((prev) => ({
      ...prev,
      talonario: e.target.value,
    }));
    // Marcar cambios si la función existe (puede no existir en modo modal)
    setHasUnsavedChanges?.(true);
    setRequiereNuevaVersion?.(true); // Cambio de talonario pedido requiere nueva versión
  }, [setCotizacion, setHasUnsavedChanges, setRequiereNuevaVersion]);

  const handleTalonarioFacturaChange = useCallback((e) => {
    setCotizacion((prev) => ({
      ...prev,
      talonarioFactura: e.target.value,
    }));
    // Marcar cambios si la función existe (puede no existir en modo modal)
    setHasUnsavedChanges?.(true);
    setRequiereNuevaVersion?.(true); // Cambio de talonario factura requiere nueva versión
  }, [setCotizacion, setHasUnsavedChanges, setRequiereNuevaVersion]);

  // Handler para cambiar privacidad de la cotización
  const handlePrivacidadChange = useCallback((e) => {
    const esPrivada = e.target.checked;
    setCotizacion((prev) => ({
      ...prev,
      esPrivada: esPrivada,
    }));
    setHasUnsavedChanges?.(true);
  }, [setCotizacion, setHasUnsavedChanges]);

  // Handler para cuando se selecciona un cliente de la búsqueda
  const handleClienteSeleccionado = useCallback(async (cliente) => {
    console.log('🔍 Cliente seleccionado desde búsqueda:', {
      COD_CLIENT: cliente.COD_CLIENT,
      RAZON_SOCI: cliente.RAZON_SOCI,
      DNI_CUIT: cliente.DNI_CUIT,
      tipoDetectado: cliente.COD_CLIENT ? 'HABITUAL' : 'OCASIONAL',
      objetoCompleto: cliente
    });

    if (cliente.COD_CLIENT && cliente.COD_CLIENT !== '000000') {
      // Cliente HABITUAL (H) - tiene código real en Tango
      console.log('✅ Cliente HABITUAL detectado, cargando datos completos desde Tango...');

      try {
        /* Comentado porque el backend no está listo
        // Cargar datos completos del cliente desde Tango
        const clienteCompleto = await cargarClienteHabitual(cliente.COD_CLIENT);

        if (!clienteCompleto) {
          throw new Error('No se pudieron cargar los datos del cliente');
        }

        // Actualizar la cotización con los datos del cliente habitual
        setCotizacion((prev) => {
          // Determinar talonario de factura según categoría IVA
          // Responsable Inscripto (RI) → Factura A (90)
          // Otros (CF, Monotributo, etc.) → Factura B (91)
          const esResponsableInscripto = clienteCompleto.COD_CATEG_IVA === 'RI';
          const talonarioFactura = esResponsableInscripto ? String(90) : String(91);

          const nuevoEstado = {
            ...prev,
            tipoCliente: TIPO_CLIENTE.HABITUAL,
            codigoCliente: clienteCompleto.codigoCliente,
            cliente: clienteCompleto.cliente,

            // Datos comerciales desde Tango
            condicion: clienteCompleto.condicion || prev.condicion,
            listaPrecios: clienteCompleto.listaPrecios || prev.listaPrecios,
            // Solo cargar bonificación del cliente si no hay una ya establecida
            bonificacionGeneral: prev.bonificacionGeneral ?? (clienteCompleto.bonificacion ?? 0),

            // Talonario Factura: Automático según categoría IVA
            // RI (Responsable Inscripto) → 90 - FACTURA ELECTRONICA A
            // Otros → 91 - FACTURA ELECTRONICA B (o mantener el anterior)
            talonarioFactura: talonarioFactura,

            // Datos fiscales
            cuit: clienteCompleto.cuit,
            tipoDocumento: clienteCompleto.tipoDocumento,

            // Categoría IVA (guardar para futuras validaciones)
            categoriaIva: clienteCompleto.CATEG_IVA,
            codigoCategoriaIva: clienteCompleto.COD_CATEG_IVA,

            // Domicilio
            domicilio: clienteCompleto.domicilio,
            localidad: clienteCompleto.localidad,
            codigoPostal: clienteCompleto.codigoPostal,
            provincia: clienteCompleto.provincia,
            codProvincia: clienteCompleto.codProvincia,

            // Logística
            codigoTransporte: clienteCompleto.codigoTransporte,
            codigoZona: clienteCompleto.codigoZona,
          };

          return nuevoEstado;
        });

        // Cargar percepciones si están disponibles
        if (onPercepcionesActualizadas) {
          onPercepcionesActualizadas();
        }
        */
        setCotizacion((prev) => ({
          ...prev,
          tipoCliente: TIPO_CLIENTE.HABITUAL,
          codigoCliente: cliente.COD_CLIENT,
          cliente: cliente.RAZON_SOCI,
          cuit: cliente.DNI_CUIT,
        }));
      } catch (error) {
        console.error('❌ Error al cargar cliente habitual:', error);
        alert('Error al cargar los datos del cliente habitual.\n\n' + error.message);
        return;
      }
    } else {
      // Cliente OCASIONAL (O) de GVA38 (Tango) - sin código, se usa "000000"
      // IMPORTANTE: Sincronizar automáticamente a la tabla CLIENTES (CRM)
      // para que el auto-rellenado funcione en futuras búsquedas
      console.log('🆕 Cliente OCASIONAL detectado, iniciando sincronización...');

      let codigoClienteCRM = '000000'; // Por defecto si falla la sincronización

      try {
        /* Comentado porque el backend no está listo
        console.log('🔄 Sincronizando cliente ocasional de Tango a CRM...');
        console.log('📋 Datos a sincronizar:', cliente);

        // Sincronizar el cliente (copia de Tango → CRM)
        const resultado = await cotizadorService.sincronizarClienteDesdeTango(cliente);

        console.log('✅ Cliente ocasional sincronizado correctamente:', resultado);

        // IMPORTANTE: Usar el COD_CLIENT generado en el CRM (no "000000")
        // Esto permite identificar unívocamente al cliente en la cotización
        if (resultado && resultado.COD_CLIENT) {
          codigoClienteCRM = String(resultado.COD_CLIENT);
          console.log('✅ Usando COD_CLIENT del CRM:', codigoClienteCRM);
        }
        */
      } catch (error) {
        console.error('⚠️ Error al sincronizar cliente ocasional:', error);
        console.error('Stack trace:', error.stack);
        // No bloquear la operación si falla la sincronización
        // El usuario aún puede continuar con la cotización
      }

      setCotizacion((prev) => ({
        ...prev,
        tipoCliente: 'O',
        codigoCliente: codigoClienteCRM, // Usar el código único del CRM
        cliente: cliente.RAZON_SOCI,
        // Valores por defecto para cliente OCASIONAL
        listaPrecios: '10',
        condicion: '10',
        talonarioFactura: '91',
      }));
    }
    setClienteCargadoDesdeBusqueda(true);
    setMostrarBusqueda(false);

    // Marcar cambios sin guardar y requerir nueva versión al cambiar el cliente
    setHasUnsavedChanges?.(true);
    setRequiereNuevaVersion?.(true);

    // Auto-foco en Condición de Venta
    setTimeout(() => {
      if (condicionRef.current) condicionRef.current.focus();
    }, 200);
  }, [setCotizacion, setHasUnsavedChanges, setRequiereNuevaVersion]);

  // Handler para limpiar el cliente y permitir cargar otro
  const handleLimpiarCliente = useCallback(() => {
    setCotizacion((prev) => ({
      ...prev,
      tipoCliente: '',
      codigoCliente: '',
      cliente: '',
    }));
    setClienteCargadoDesdeBusqueda(false);
    setMostrarBusqueda(true);

    // Marcar cambios
    setHasUnsavedChanges?.(true);
    setRequiereNuevaVersion?.(true);
  }, [setCotizacion, setHasUnsavedChanges, setRequiereNuevaVersion]);

  // Handler para cuando se crea/selecciona un cliente ocasional desde el formulario
  const handleClienteOcasionalCreado = useCallback((cliente) => {
    // Usar el COD_CLIENT del CRM (generado automáticamente)
    const codigoClienteCRM = cliente.COD_CLIENT ? String(cliente.COD_CLIENT) : '000000';

    console.log('✅ Cliente ocasional creado/actualizado:', {
      COD_CLIENT: codigoClienteCRM,
      RAZON_SOCI: cliente.RAZON_SOCI,
      TIPO_DOC: cliente.TIPO_DOC
    });

    // Actualizar la cotización con los datos más recientes del cliente
    // Para cliente OCASIONAL: forzar valores específicos (lista 10, condición 10, factura B)
    setCotizacion((prev) => ({
      ...prev,
      tipoCliente: 'O',
      codigoCliente: codigoClienteCRM, // Usar código único del CRM
      cliente: cliente.RAZON_SOCI, // Actualizar con el nombre más reciente
      tipoDocumento: cliente.TIPO_DOC || prev.tipoDocumento || "80", // Tipo de documento del cliente
      // Valores FORZADOS para cliente OCASIONAL
      listaPrecios: '10',
      condicion: '3',
      talonarioFactura: '91', // Factura B para ocasionales
    }));
    setClienteCargadoDesdeBusqueda(true);
    setHasUnsavedChanges?.(true); // Marcar como cambios sin guardar
    onCloseClienteOcasional();
  }, [setCotizacion, onCloseClienteOcasional, setHasUnsavedChanges]);

  // Handler para abrir modal de crear nuevo cliente (modo creación)
  const handleAbrirNuevoCliente = useCallback(() => {
    setClienteParaEditar(null); // Modo creación
    onOpenClienteOcasional();
  }, [onOpenClienteOcasional]);

  // Handler para ver/editar cliente ocasional existente
  const handleVerEditarCliente = useCallback(async () => {
    if (!cotizacion.codigoCliente) {
      return;
    }

    // Cliente HABITUAL - mostrar vista de solo lectura
    if (cotizacion.tipoCliente === TIPO_CLIENTE.HABITUAL) {
      await cargarClienteHabitual(cotizacion.codigoCliente);
      onOpenClienteHabitual();
      return;
    }

    // Cliente OCASIONAL - abrir modal de edición
    if (cotizacion.tipoCliente === TIPO_CLIENTE.OCASIONAL) {
      try {
        /* Comentado porque el backend no está listo
        // Buscar el cliente completo en la base de datos
        const response = await cotizadorService.buscarClientePorCodigo(cotizacion.codigoCliente);

        if (response && response.data) {
          console.log('📋 Cliente cargado para edición:', response.data);
          setClienteParaEditar(response.data);
          onOpenClienteOcasional();
        }
        */
        onOpenClienteOcasional();
      } catch (error) {
        console.error('Error al cargar cliente para edición:', error);
      }
    }
  }, [cotizacion.codigoCliente, cotizacion.tipoCliente, onOpenClienteOcasional, onOpenClienteHabitual, cargarClienteHabitual]);

  // Cargar permisos de privacidad del usuario actual
  useEffect(() => {
    const cargarPermisosPrivacidad = async () => {
      try {
        // Obtener usuario desde cookies
        const usuario = Cookies.get('usuario') || Cookies.get('USUARIO');
        const codVendedor = Cookies.get('COD_VENDED');

        if (!usuario && !codVendedor) {
          // Sin datos de usuario, no cargar permisos
          setPermisosPrivacidad({ puedeCrearPrivadas: false, puedeVerTodasPrivadas: false, cargado: true });
          return;
        }

        const response = await cotizadorService.obtenerMisPermisosPrivacidad(usuario, codVendedor);

        if (response.success && response.data) {
          setPermisosPrivacidad({
            puedeCrearPrivadas: response.data.puedeCrearPrivadas === true || response.data.puedeCrearPrivadas === 1,
            puedeVerTodasPrivadas: response.data.puedeVerTodasPrivadas === true || response.data.puedeVerTodasPrivadas === 1,
            cargado: true
          });
        } else {
          setPermisosPrivacidad({ puedeCrearPrivadas: false, puedeVerTodasPrivadas: false, cargado: true });
        }
      } catch (error) {
        console.error('Error al cargar permisos de privacidad:', error);
        setPermisosPrivacidad({ puedeCrearPrivadas: false, puedeVerTodasPrivadas: false, cargado: true });
      }
    };

    cargarPermisosPrivacidad();
  }, []);

  // Cargar opciones de Tango al montar el componente
  useEffect(() => {
    const cargarOpcionesTango = async () => {
      setCargandoMaestros(true);
      try {
        // Cargar maestros con fallback a arrays vacíos si el backend no está disponible
        const [condiciones, listas, tipos, talonarios, talonariosF] = await Promise.all([
          cotizadorService.obtenerCondicionesVenta().catch(() => []),
          cotizadorService.obtenerListasPrecios().catch(() => []),
          cotizadorService.obtenerTiposDocumento().catch(() => []),
          cotizadorService.obtenerTalonariosPedidos().catch(() => []),
          cotizadorService.obtenerTalonariosFacturas().catch(() => []),
        ]);
        // Ordenar talonarios de factura (90 y 91 primero - Facturas A y B)
        const talonariosFSorted = [...talonariosF].sort((a, b) => {
          const codeA = String(a.codigo || '');
          const codeB = String(b.codigo || '');
          if (codeA === '90') return -1; // FACTURA A primero
          if (codeB === '90') return 1;
          if (codeA === '91') return -1; // FACTURA B segundo
          if (codeB === '91') return 1;
          return 0;
        });

        setCondicionesVenta(Array.isArray(condiciones) ? condiciones : []);
        setListasPrecios(Array.isArray(listas) ? listas : []);
        setTiposDocumento(Array.isArray(tipos) ? tipos : []);
        setTalonariosPedidos(Array.isArray(talonarios) ? talonarios : []);
        setTalonariosFacturas(Array.isArray(talonariosFSorted) ? talonariosFSorted : []);

      } catch (error) {
        console.error('Error al cargar opciones de Tango:', error);
      } finally {
        setCargandoMaestros(false);
      }
    };
    cargarOpcionesTango();
  }, []);

  // Efecto para establecer valores por defecto cuando las opciones se cargan o el estado se reinicia
  // NOTA: NO sobrescribe valores si ya están seteados (ej: desde selección de cliente)
  useEffect(() => {
    if (isDisabled) return;

    setCotizacion(prev => {
      let newState = { ...prev };
      let hasChanges = false;

      // Default Lista de Precios: 10 (solo si no hay valor)
      if (!newState.listaPrecios && listasPrecios.length > 0) {
        if (listasPrecios.some(l => String(l.numero) === '10')) {
          newState.listaPrecios = '10';
          hasChanges = true;
        }
      }

      // Default Talonario Pedido: 7 (busca '7', '07' o número 7)
      // MEJORA: Verificar si el valor actual es válido (existe en la lista). Si no, aplicar default.
      const talonarioActualEsValido = newState.talonario && talonariosPedidos.some(t => String(t.codigo) === String(newState.talonario));

      if (!talonarioActualEsValido && talonariosPedidos.length > 0) {
        const pedidoDefault = talonariosPedidos.find(t => {
          const c = String(t.codigo).trim();
          return c === '7' || c === '07' || parseInt(c) === 7;
        });


        if (pedidoDefault) {
          newState.talonario = String(pedidoDefault.codigo);
          hasChanges = true;
        }
      }

      // Default Talonario Factura: 90 (FACTURA ELECTRONICA A) - solo si no hay valor
      // Si el cliente ya tiene talonarioFactura asignado (ej: ocasional=91, habitual según IVA), respetarlo
      if (!newState.talonarioFactura && talonariosFacturas.length > 0) {
        if (talonariosFacturas.some(t => String(t.codigo) === '90')) {
          newState.talonarioFactura = '90';
          hasChanges = true;
        }
      }

      // Default Condición de Venta: solo si no hay valor (clientes ocasionales usan 10)
      if (!newState.condicion && condicionesVenta.length > 0) {
        if (condicionesVenta.some(c => String(c.codigo) === '1')) {
          newState.condicion = '1'; // Contado por defecto
          hasChanges = true;
        }
      }

      return hasChanges ? newState : prev;
    });
  }, [listasPrecios, talonariosPedidos, talonariosFacturas, condicionesVenta, isDisabled, setCotizacion, cotizacion.listaPrecios, cotizacion.talonario, cotizacion.talonarioFactura, cotizacion.condicion]);

  // Inicializar fecha de validez (1 día por defecto)
  useEffect(() => {
    if (!cotizacion.fechaVigencia && !isDisabled) {
      const manana = new Date();
      manana.setDate(manana.getDate() + 1);
      setCotizacion(prev => ({
        ...prev,
        fechaVigencia: manana.toISOString()
      }));
    }
  }, [cotizacion.fechaVigencia, isDisabled, setCotizacion]);

  // Determinar si los campos son editables según el tipo y si fue cargado desde búsqueda
  const esClienteH = cotizacion.tipoCliente === 'H';
  const esClienteO = cotizacion.tipoCliente === 'O';
  // Si el cliente ya está confirmado, NO se puede editar la info del cliente
  const clienteBloqueado = clienteConfirmado;
  // Los campos de cliente NUNCA son editables directamente - solo desde búsqueda o modal
  const puedeEditarCodigo = false;
  const puedeEditarNombre = false;
  const puedeEditarTipo = false;
  // Mostrar botón limpiar si hay datos de cliente ingresados Y no está confirmado
  const hayDatosCliente = (cotizacion.cliente || cotizacion.codigoCliente) && !clienteConfirmado;

  // Atajos de teclado para botones de acción
  useKeyboardShortcuts([
    { keys: ['F8'], callback: () => hayDatosCliente && handleLimpiarCliente() },
    { keys: ['F6'], callback: () => (esClienteO || esClienteH) && cotizacion.codigoCliente && handleVerEditarCliente() },
    { keys: ['F3'], callback: () => handleAbrirNuevoCliente() }
  ], !isDisabled);

  return (
    <Box position="relative">
      {/* Contenido real */}
      <Box
        aria-disabled={IS_MODULE_DISABLED}
        pointerEvents={IS_MODULE_DISABLED ? "none" : "auto"}
        opacity={IS_MODULE_DISABLED ? 0.55 : 1}
        filter={IS_MODULE_DISABLED ? "grayscale(0.15)" : "none"}
        transition="opacity 0.2s ease, filter 0.2s ease"
      >
        <Card
          bg={cardBg}
          borderRadius="20px"
          border="2px solid"
          borderColor={cardBorderColor}
          backdropFilter={isDark ? 'blur(120px)' : 'none'}
          boxShadow={isDark ? 'none' : '0px 3.5px 5.5px rgba(0, 0, 0, 0.02)'}
        >
          <CardBody>
            {/* Header con título de cotización y fecha */}
            <Flex justify="space-between" align="center" mb={4} gap={4}>
              <Heading size="md" flexShrink={0}>Información del Cliente</Heading>

              {/* Título centrado */}
              <Box flex="1" display="flex" justifyContent="center">
                <Input
                  placeholder="Título de la cotización (opcional)"
                  value={cotizacion?.titulo || ''}
                  onChange={(e) => {
                    setCotizacion(prev => ({ ...prev, titulo: e.target.value }));
                    if (setHasUnsavedChanges) setHasUnsavedChanges(true);
                  }}
                  size="sm"
                  w="100%"
                  maxW="400px"
                  textAlign="center"
                  isDisabled={isDisabled}
                  _placeholder={{ color: 'gray.400', fontStyle: 'italic' }}
                  fontWeight={cotizacion?.titulo ? '500' : 'normal'}
                />
              </Box>

              {/* Contenedor de fechas */}
              <VStack align="flex-end" spacing={2} minW="200px" flexShrink={0}>
                {/* Fecha de Cotización */}
                <HStack spacing={2} align="center">
                  <Text variant="label">
                    Fecha Cotización:
                  </Text>
                  <Text fontSize="md" fontWeight="600">
                    {(() => {
                      // Si cotizacion.fecha ya viene formateado como string dd/mm/aaaa del backend, usarlo directamente
                      if (cotizacion.fecha && typeof cotizacion.fecha === 'string' && cotizacion.fecha.includes('/')) {
                        return cotizacion.fecha;
                      }
                      // Si viene como ISO date, formatearlo
                      if (cotizacion.fecha) {
                        return formatearFechaManual(cotizacion.fecha);
                      }
                      // Fallback: fecha actual
                      return formatearFechaManual(new Date());
                    })()}
                  </Text>
                </HStack>
              </VStack>
            </Flex>

            {/* Botones de acción */}
            {!desdePerfilCliente && !isDisabled && (
              <HStack justify="flex-end" spacing={2} mb={4}>
                {hayDatosCliente && (
                  <Tooltip label="Limpiar datos del cliente (F8)" placement="left">
                    <Button
                      leftIcon={<DeleteIcon />}
                      colorScheme="red"
                      variant="outline"
                      size="sm"
                      onClick={handleLimpiarCliente}
                    >
                      Limpiar Cliente (F8)
                    </Button>
                  </Tooltip>
                )}
                {/* Botón Ver/Editar Cliente - Condicional según tipo */}
                {cotizacion.codigoCliente && (esClienteO || esClienteH) && (
                  <Tooltip
                    label={
                      esClienteH
                        ? "Ver información del cliente habitual (F6)"
                        : "Ver o editar datos del cliente ocasional (F6)"
                    }
                    placement="left"
                  >
                    <Button
                      leftIcon={<SearchIcon />}
                      colorScheme={esClienteH ? "blue" : "orange"}
                      variant="outline"
                      size="sm"
                      onClick={handleVerEditarCliente}
                    >
                      {esClienteH ? "Ver Cliente (F6)" : "Ver/Editar Cliente (F6)"}
                    </Button>
                  </Tooltip>
                )}
                <Tooltip label="Crear nuevo cliente ocasional (F3)" placement="left">
                  <Button
                    leftIcon={<AddIcon />}
                    colorScheme="green"
                    variant="outline"
                    size="sm"
                    onClick={handleAbrirNuevoCliente}
                  >
                    Cargar Ocasional (F3)
                  </Button>
                </Tooltip>
                <Tooltip label="Buscar cliente en la base de datos" placement="left">
                  <Button
                    ref={focusRef} // Asignamos la ref aquí
                    leftIcon={<SearchIcon />}
                    colorScheme="blue"
                    variant={mostrarBusqueda ? "solid" : "outline"}
                    size="sm"
                    onClick={() => setMostrarBusqueda(!mostrarBusqueda)}
                  >
                    {mostrarBusqueda ? "Ocultar Búsqueda" : "Buscar Habitual (F4)"}
                  </Button>
                </Tooltip>
              </HStack>
            )}

            {/* Componente de búsqueda */}
            {mostrarBusqueda && (
              <Box
                mb={4}
                p={5}
                bg={searchBoxBg}
                borderRadius="md"
                border="2px"
                borderColor={searchBoxBorderColor}
                boxShadow="sm"
              >
                <Flex align="center" mb={3} gap={2}>
                  <SearchIcon color={searchIconColor} boxSize={5} />
                  <Text fontSize="md" fontWeight="bold" color={searchTitleColor}>
                    Buscar Cliente en la Base de Datos
                  </Text>
                </Flex>
                <Text fontSize="sm" mb={3} color={searchTextColor}>
                  Busca clientes <strong>Habituales</strong> registrados en Tango por nombre, razón social o código
                </Text>
                <BusquedaCliente
                  onClienteSeleccionado={handleClienteSeleccionado}
                  isDisabled={isDisabled}
                />
              </Box>
            )}

            <Box>
              <Grid templateColumns="1fr 1fr" gap={8} mb={6}>
                {/* Campo Tipo y Código */}
                <GridItem>
                  <Grid templateColumns="1fr 1fr" gap={4}>
                    <GridItem>
                      <FieldCompact label="Tipo" >
                        <Select
                          value={cotizacion.tipoCliente || ""}
                          size="sm"
                          onChange={handleTipoClienteChange}
                          isDisabled={true}
                          pointerEvents="none"
                        >
                          <option value="">Seleccionar...</option>
                          <option value="H">H - Habitual</option>
                          <option value="O">O - Ocasional</option>
                          <option value="P">P - Potencial</option>
                        </Select>
                      </FieldCompact>
                    </GridItem>
                    <GridItem>
                      <FieldCompact label="Código de Cliente" >
                        <Input
                          value={cotizacion.codigoCliente || ""}
                          size="sm"
                          placeholder="Se asigna automáticamente"
                          onChange={handleCodigoClienteChange}
                          maxLength={20}
                          isDisabled={true}
                          isReadOnly={true}
                        />
                      </FieldCompact>
                    </GridItem>
                  </Grid>
                </GridItem>

                {/* Nombre */}
                <GridItem>
                  <FieldCompact label="Nombre del Cliente" >
                    <Input
                      value={cotizacion.cliente || ""}
                      size="sm"
                      placeholder="Seleccione un cliente..."
                      onChange={handleClienteChange}
                      isDisabled={true}
                      isReadOnly={true}
                    />
                  </FieldCompact>
                </GridItem>

                {/* Resto de campos */}
                <GridItem>
                  <FieldCompact label="Condición de Venta" >
                    <Select
                      ref={condicionRef}
                      value={cotizacion.condicion || ""}
                      size="sm"
                      onChange={handleCondicionVentaChange}
                      isDisabled={cargandoMaestros || isDisabled}
                      placeholder={cargandoMaestros ? "Cargando..." : "Seleccionar..."}
                    >
                      {condicionesVenta.map((cond) => (
                        <option key={cond.codigo} value={cond.codigo}>
                          {cond.codigo} - {cond.descripcion}
                        </option>
                      ))}
                    </Select>
                  </FieldCompact>
                </GridItem>

                <GridItem>
                  <FieldCompact label="Código Vendedor" >
                    <Input
                      value={cotizacion.codigoVendedor || ""}
                      size="sm"
                      isReadOnly
                    />
                  </FieldCompact>
                </GridItem>

                <GridItem>
                  <FieldCompact label="Lista de Precios" >
                    <Select
                      ref={listaPreciosRef}
                      value={cotizacion.listaPrecios || ""}
                      size="sm"
                      onChange={handleListaPreciosChange}
                      isDisabled={isDisabled || cargandoMaestros}
                      placeholder={cargandoMaestros ? "Cargando..." : "Seleccionar..."}
                    >
                      {listasPrecios.map((lista) => (
                        <option key={lista.numero} value={lista.numero}>
                          {lista.numero} - {lista.nombre}
                        </option>
                      ))}
                    </Select>
                  </FieldCompact>
                </GridItem>

                <GridItem>
                  <FieldCompact label="Talonario Pedido" >
                    <Select
                      ref={talonarioPedidoRef}
                      value={cotizacion.talonario || ""}
                      size="sm"
                      onChange={handleTalonarioChange}
                      isDisabled={isDisabled || cargandoMaestros}
                      placeholder={cargandoMaestros ? "Cargando..." : "Seleccionar..."}
                    >
                      {talonariosPedidos.map((tal) => (
                        <option key={tal.id} value={tal.codigo}>
                          {tal.codigo} - {tal.descripcion}
                        </option>
                      ))}
                    </Select>
                  </FieldCompact>
                </GridItem>

                <GridItem>
                  <FieldCompact label="Talonario Factura" >
                    <Select
                      ref={talonarioFacturaRef}
                      value={cotizacion.talonarioFactura || ""}
                      size="sm"
                      onChange={handleTalonarioFacturaChange}
                      isDisabled={isDisabled || cargandoMaestros}
                      placeholder={cargandoMaestros ? "Cargando..." : "Seleccionar..."}
                    >
                      {talonariosFacturas.map((tal) => (
                        <option key={tal.id} value={String(tal.codigo)}>
                          {tal.codigo} - {tal.descripcion}
                        </option>
                      ))}
                    </Select>
                  </FieldCompact>
                </GridItem>

                <GridItem>
                  <FieldCompact label="Origen de la venta/cliente" >
                    <Box
                      bg="bg.card"
                      border="1px"
                      borderColor="border.default"
                      borderRadius="lg"
                      p={2}
                      opacity={isDisabled ? 0.6 : 1}
                      cursor={isDisabled ? "not-allowed" : "default"}
                    >
                      <RadioGroup
                        value={
                          cotizacion.origenVenta ||
                          cotizacion.codigoTransporte ||
                          "Presencial"
                        }
                        onChange={handleOrigenVentaChange}
                        isDisabled={isDisabled}
                      >
                        <HStack spacing={4}>
                          <Radio value="Presencial" size="sm" isDisabled={isDisabled}>
                            Presencial
                          </Radio>
                          <Radio value="WhatsApp" size="sm" isDisabled={isDisabled}>
                            WhatsApp
                          </Radio>
                          <Radio value="Correo Electrónico" size="sm" isDisabled={isDisabled}>
                            Correo Electrónico
                          </Radio>
                          <Radio value="Teléfono" size="sm" isDisabled={isDisabled}>
                            Teléfono
                          </Radio>
                        </HStack>
                      </RadioGroup>
                    </Box>
                  </FieldCompact>
                </GridItem>

                <GridItem>
                  <FieldCompact label="Bonificación %" >
                    <NumberInput
                      value={cotizacion.bonificacionGeneral ?? 0}
                      onChange={(valString) => {
                        // Reemplazar coma por punto para consistencia interna
                        const cleanVal = valString.replace(',', '.');

                        // Solo permitir caracteres válidos para un número decimal
                        if (cleanVal !== "" && !/^-?\d*\.?\d*$/.test(cleanVal)) return;

                        setCotizacion(prev => {
                          // Solo marcar cambios si el valor numérico cambió realmente o si se limpió
                          const prevNum = parseFloat(String(prev?.bonificacionGeneral || 0).replace(',', '.'));
                          const newNum = parseFloat(cleanVal || 0);

                          if (prevNum !== newNum) {
                            setHasUnsavedChanges?.(true);
                            setRequiereNuevaVersion?.(true);
                          }
                          return { ...prev, bonificacionGeneral: cleanVal };
                        });
                      }}
                      onBlur={() => {
                        // Si al salir el campo está vacío o es solo un punto, ponerlo en 0
                        if (cotizacion.bonificacionGeneral === "" || cotizacion.bonificacionGeneral === ".") {
                          setCotizacion(prev => ({ ...prev, bonificacionGeneral: 0 }));
                        }
                      }}
                      min={0}
                      max={100}
                      step={0.5}
                      size="sm"
                      isDisabled={isDisabled}
                      minW="90px"
                    >
                      <NumberInputField
                      />
                    </NumberInput>
                  </FieldCompact>
                </GridItem>

                <GridItem>
                  <FieldCompact label="Fecha Validez" >
                    <Box sx={{
                      '.react-datepicker-wrapper': { width: '100%' },
                      '.react-datepicker__input-container': { width: '100%' }
                    }}>
                      <DatePicker
                        selected={(() => {
                          if (!cotizacion.fechaVigencia) return null;
                          try {
                            let fecha;
                            const valor = cotizacion.fechaVigencia;

                            // Si ya incluye 'T', es ISO completo
                            if (valor.includes('T')) {
                              fecha = new Date(valor);
                            }
                            // Si es solo fecha (yyyy-mm-dd), agregar hora
                            else if (valor.match(/^\d{4}-\d{2}-\d{2}$/)) {
                              fecha = new Date(valor + 'T00:00:00');
                            }
                            // Si es timestamp o cualquier otro formato
                            else {
                              fecha = new Date(valor);
                            }

                            return isNaN(fecha.getTime()) ? null : fecha;
                          } catch {
                            return null;
                          }
                        })()}
                        onChange={(date) => {
                          if (date && !isNaN(date.getTime())) {
                            // Convertir a formato ISO (yyyy-mm-dd)
                            const año = date.getFullYear();
                            const mes = String(date.getMonth() + 1).padStart(2, '0');
                            const dia = String(date.getDate()).padStart(2, '0');
                            const fechaISO = `${año}-${mes}-${dia}`;

                            setCotizacion(prev => {
                              if (prev?.fechaVigencia !== fechaISO) {
                                setHasUnsavedChanges?.(true);
                                setRequiereNuevaVersion?.(true);
                              }
                              return { ...prev, fechaVigencia: fechaISO };
                            });
                          }
                        }}
                        dateFormat="dd/MM/yyyy"
                        locale="es"
                        disabled={isDisabled}
                        customInput={
                          <Input
                            size="sm"
                          />
                        }
                        showYearDropdown
                        showMonthDropdown
                        dropdownMode="select"
                        placeholderText="dd/mm/aaaa"
                        isClearable
                      />
                    </Box>
                  </FieldCompact>
                </GridItem>

                {/* Toggle de Privacidad - Solo visible si el usuario tiene permisos */}
                {permisosPrivacidad.puedeCrearPrivadas && (
                  <GridItem colSpan={2}>
                    <Box
                      bg={privacyBoxBg}
                      border="1px"
                      borderColor={privacyBoxBorderColor}
                      borderRadius="md"
                      p={3}
                      mt={2}
                    >
                      <Flex align="center" justify="space-between">
                        <HStack spacing={3}>
                          <ViewOffIcon
                            color={cotizacion.esPrivada ? 'purple.500' : 'gray.400'}
                            boxSize={5}
                          />
                          <Box>
                            <Text
                              fontSize="sm"
                              fontWeight="600"
                              color={privacyTitleColor}
                            >
                              Cotización Privada
                            </Text>
                            <Text fontSize="xs" color={privacyTextColor}>
                              {cotizacion.esPrivada
                                ? (parseInt(cotizacion.creadoPor) === parseInt(Cookies.get('COD_VENDED'))
                                  ? 'Solo tú y los administradores pueden ver esta cotización'
                                  : `Solo los administradores y ${cotizacion.nombreCreador || 'el creador'} pueden ver esta cotización`)
                                : 'Todos los usuarios pueden ver esta cotización'}
                            </Text>
                          </Box>
                        </HStack>
                        <HStack spacing={3}>
                          {cotizacion.esPrivada && (
                            <Badge colorScheme="purple" variant="solid" fontSize="xs">
                              <HStack spacing={1}>
                                <LockIcon boxSize={3} />
                                <Text>PRIVADA</Text>
                              </HStack>
                            </Badge>
                          )}
                          <Switch
                            colorScheme="purple"
                            size="lg"
                            isChecked={cotizacion.esPrivada || false}
                            onChange={handlePrivacidadChange}
                            isDisabled={
                              isDisabled ||
                              (cotizacion.id && // Si ya existe la cotización
                                parseInt(cotizacion.creadoPor) !== parseInt(Cookies.get('COD_VENDED')) && // No soy el creador
                                !permisosPrivacidad.puedeVerTodasPrivadas // No soy administrador
                              )
                            }
                          />
                        </HStack>
                      </Flex>
                    </Box>
                  </GridItem>
                )}
              </Grid>

              {/* Botón de confirmación y mensaje */}
              {!clienteConfirmado && (
                <VStack spacing={3} mt={6} align="stretch">
                  <Alert status="info" borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">
                      Completa el <strong>Código de Cliente</strong> y el <strong>Nombre del Cliente</strong> para continuar.
                    </Text>
                  </Alert>
                  <HStack spacing={3} flexDirection="row-reverse">
                    <Button
                      ref={confirmarRef}
                      colorScheme="blue"
                      size="lg"
                      onClick={onConfirmar}
                      isDisabled={!camposCompletos || isDisabled}
                      flex="2"
                      marginLeft={3}
                      _focus={{
                        boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.6)",
                        transform: "scale(1.02)",
                      }}
                      tabIndex={0}
                    >
                      Confirmar Cliente
                    </Button>
                    <Button
                      leftIcon={<DeleteIcon />}
                      colorScheme="red"
                      variant="outline"
                      size="lg"
                      onClick={onCancelar}
                      flex="1"
                      _focus={{
                        boxShadow: "0 0 0 3px rgba(245, 101, 101, 0.6)",
                        transform: "scale(1.02)",
                      }}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Tab' && !e.shiftKey) {
                          e.preventDefault();
                          if (focusRef && focusRef.current) {
                            focusRef.current.focus();
                          }
                        }
                      }}
                    >
                      Cancelar Cotización
                    </Button>
                  </HStack>
                </VStack>
              )}

            </Box>
          </CardBody>
        </Card>
      </Box>

      {/* Overlay visual */}
      {IS_MODULE_DISABLED && (
        <>
          <Box
            position="absolute"
            inset="0"
            borderRadius="md"
            bgGradient={`
              repeating-linear-gradient(
                90deg,
                rgba(255,255,255,0.08) 0px,
                rgba(255,255,255,0.08) 12px,
                transparent 12px,
                transparent 24px
              )
            `}
            pointerEvents="none"
          />
          <HStack
            position="absolute"
            inset="0"
            alignItems="center"
            justifyContent="center"
            pointerEvents="none"
          >
            <Box
              px={6}
              py={3}
              bg="blackAlpha.700"
              borderRadius="lg"
              boxShadow="lg"
              borderWidth="1px"
              borderColor="#1D2A44"
            >
              <HStack spacing={3}>
                <Text color="yellow.300" fontWeight="700" fontSize="sm">
                  En desarrollo
                </Text>
                <Text color="#94A3B8" fontSize="sm">
                  Esta sección está temporalmente deshabilitada.
                </Text>
              </HStack>
            </Box>
          </HStack>
        </>
      )}

      {/* Modal para crear/editar cliente ocasional */}
      <FormularioClienteOcasional
        isOpen={isOpenClienteOcasional}
        onClose={onCloseClienteOcasional}
        onClienteCreado={handleClienteOcasionalCreado}
        clienteExistente={clienteParaEditar}
        onPercepcionesActualizadas={onPercepcionesActualizadas}
      />

      {/* Modal para ver información de cliente habitual (solo lectura) */}
      <VistaClienteHabitual
        isOpen={isOpenClienteHabitual}
        onClose={onCloseClienteHabitual}
        cliente={clienteHabitualDetalle}
        estadoCuenta={estadoCuenta}
        percepciones={percepcionesClienteHabitual}
        isLoading={isLoadingClienteHabitual}
      />
    </Box>
  );
};

export default ClienteInfo;
