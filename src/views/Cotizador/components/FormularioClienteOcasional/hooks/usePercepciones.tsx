import { useState, useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import cotizadorService from "../../../../../services/cotizadorService";

/**
 * Hook para gestionar las percepciones del cliente ocasional
 */
export const usePercepciones = ({ codProvincia, clienteExistente, modoEdicion }) => {
  const toast = useToast();

  // Estados de percepciones
  const [percepcionesDisponibles, setPercepcionesDisponibles] = useState([]);
  const [percepcionesCliente, setPercepcionesCliente] = useState([]);
  const [isLoadingPercepciones, setIsLoadingPercepciones] = useState(false);

  // Estados del selector
  const [percepcionSeleccionada, setPercepcionSeleccionada] = useState(null);
  const [alicuotasDisponibles, setAlicuotasDisponibles] = useState([]);
  const [alicuotaSeleccionada, setAlicuotaSeleccionada] = useState("");

  // Cargar percepciones disponibles cuando cambia la provincia
  useEffect(() => {
    const cargarPercepcionesDisponibles = async () => {
      if (!codProvincia) {
        setPercepcionesDisponibles([]);
        return;
      }

      setIsLoadingPercepciones(true);
      try {
        // Obtener percepciones de IIBB para la provincia seleccionada
        const responseIIBB = await cotizadorService.obtenerPercepcionesDisponibles('IB', codProvincia);

        // Obtener percepciones de IVA (no dependen de provincia)
        const responseIVA = await cotizadorService.obtenerPercepcionesDisponibles('OT');

        const todasPercepciones = [
          ...(responseIIBB.success ? responseIIBB.data : []),
          ...(responseIVA.success ? responseIVA.data : [])
        ];

        setPercepcionesDisponibles(todasPercepciones);
      } catch (error) {
        console.error('Error al cargar percepciones disponibles:', error);
      } finally {
        setIsLoadingPercepciones(false);
      }
    };

    cargarPercepcionesDisponibles();
  }, [codProvincia]);

  // Cargar percepciones del cliente en modo edición
  useEffect(() => {
    const cargarPercepcionesCliente = async () => {
      if (!modoEdicion || !clienteExistente || !clienteExistente.COD_CLIENT) {
        setPercepcionesCliente([]);
        return;
      }

      try {
        const response = await cotizadorService.obtenerPercepcionesCliente(
          clienteExistente.COD_CLIENT,
          'O' // Cliente Ocasional
        );

        if (response.success) {
          setPercepcionesCliente(response.data || []);
        }
      } catch (error) {
        console.error('Error al cargar percepciones del cliente:', error);
      }
    };

    cargarPercepcionesCliente();
  }, [modoEdicion, clienteExistente]);

  // Cargar alícuotas cuando se selecciona una percepción
  const handlePercepcionChange = async (e) => {
    const percepcionId = parseInt(e.target.value);
    if (!percepcionId) {
      setPercepcionSeleccionada(null);
      setAlicuotasDisponibles([]);
      setAlicuotaSeleccionada("");
      return;
    }

    const percepcion = percepcionesDisponibles.find(p => p.ID_PERCEPCION_VENTAS === percepcionId);
    setPercepcionSeleccionada(percepcion);

    try {
      const response = await cotizadorService.obtenerAlicuotasPercepcion(percepcionId);
      if (response.success) {
        setAlicuotasDisponibles(response.data || []);
      }
    } catch (error) {
      console.error('Error al cargar alícuotas:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las alícuotas de la percepción",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Agregar percepción a la lista del cliente
  const agregarPercepcion = () => {
    if (!percepcionSeleccionada || !alicuotaSeleccionada) {
      toast({
        title: "Datos incompletos",
        description: "Debe seleccionar una percepción y una alícuota",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const alicuotaId = parseInt(alicuotaSeleccionada);
    const alicuota = alicuotasDisponibles.find(a => a.COD_ALICUO === alicuotaId);
    if (!alicuota) return;

    // Verificar si ya existe esta percepción
    const yaExiste = percepcionesCliente.some(
      p => p.COD_IMPUES === percepcionSeleccionada.COD_IMPUES
    );

    if (yaExiste) {
      toast({
        title: "Percepción duplicada",
        description: "Esta percepción ya está asignada al cliente",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const nuevaPercepcion = {
      ID_PERCEPCION_VENTAS: percepcionSeleccionada.ID_PERCEPCION_VENTAS,
      COD_IMPUES: percepcionSeleccionada.COD_IMPUES,
      DESCRIPCION: percepcionSeleccionada.DESCRIPCIO,
      COD_ALICUO: String(alicuota.COD_ALICUO),
      DES_ALICUO: alicuota.DES_ALICUO,
      ALICUOTA_ASIGNADA: parseFloat(alicuota.PORCENTAJE),
      // Determinar BASE_CALCULO según tabla BASE_CALCULO_PERCEPCION de Tango:
      // 1 = Neto gravado (NETO)
      // 3 = Neto gravado + I.V.A. (NETO_IVA)
      // IMPORTANTE: NO asumir por tipo de impuesto. IB puede ser NETO (RI) o NETO_IVA (MON)
      BASE_CALCULO: percepcionSeleccionada.ID_BASE_CALCULO === 3
        ? 'NETO_IVA'
        : 'NETO', // Default si es 1 o no viene
      MIN_NO_IMPONIBLE: percepcionSeleccionada.MIN_NO_IMP,
      MIN_PERCEPCION: percepcionSeleccionada.MIN_IMPUES,
      COD_PROVINCIA: percepcionSeleccionada.COD_PROVIN,
      NOMBRE_PROVINCIA: percepcionSeleccionada.NOMBRE_PRO,
      TIPO_IMPUESTO: percepcionSeleccionada.TIP_IMPUES,
      ES_PERCEPCION: true,
      ACTIVO: true,
      _esNuevo: true,
    };

    setPercepcionesCliente(prev => [...prev, nuevaPercepcion]);

    // Resetear selección
    setPercepcionSeleccionada(null);
    setAlicuotasDisponibles([]);
    setAlicuotaSeleccionada("");

    toast({
      title: "Percepción agregada",
      description: `${nuevaPercepcion.DESCRIPCION} - ${alicuota.DESCRIPCIO}`,
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Eliminar percepción de la lista
  const eliminarPercepcion = (index) => {
    const percepcion = percepcionesCliente[index];

    if (!percepcion) {
      console.error('Percepción no encontrada en el índice:', index);
      return;
    }

    setPercepcionesCliente(prev => prev.filter((_, i) => i !== index));

    toast({
      title: "Percepción eliminada",
      description: percepcion.DESCRIPCION || percepcion.DESCRIPCIO || 'Percepción',
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };

  // Guardar percepciones en el backend
  const guardarPercepciones = async (codigoCliente) => {
    try {
      // Preparar datos de percepciones para enviar al backend
      const percepcionesParaGuardar = percepcionesCliente.map(p => ({
        idPercepcionVentas: p.ID_PERCEPCION_VENTAS,
        codImpuesto: p.COD_IMPUES,
        descripcion: p.DESCRIPCION || p.DESCRIPCIO,
        codAlicuota: p.COD_ALICUO,
        desAlicuota: p.DES_ALICUO,
        alicuotaAsignada: p.ALICUOTA_ASIGNADA,
        baseCalculo: p.BASE_CALCULO,
        minNoImponible: p.MIN_NO_IMPONIBLE,
        minPercepcion: p.MIN_PERCEPCION,
        codProvincia: p.COD_PROVINCIA,
        nombreProvincia: p.NOMBRE_PROVINCIA,
        tipoImpuesto: p.TIPO_IMPUESTO,
        esPercepcion: p.ES_PERCEPCION,
        activo: true,
      }));

      // Reemplazar todas las percepciones del cliente
      await cotizadorService.reemplazarPercepcionesCliente(codigoCliente, percepcionesParaGuardar);

      return { success: true };
    } catch (error) {
      console.error('Error al guardar percepciones:', error);
      toast({
        title: "Advertencia",
        description: "El cliente se guardó pero hubo un error al guardar las percepciones",
        status: "warning",
        duration: 4000,
        isClosable: true,
      });
      return { success: false, error };
    }
  };

  return {
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
  };
};
