import { useState, useCallback, useEffect } from 'react';
import cotizadorService from '../../../../../services/cotizadorService';
import { transformarClienteDesdeTango, transformarPercepcionesParaCalculo } from '../utils/transformadores';
import { TIPO_CLIENTE } from '../constants';

/**
 * Hook para manejar la lógica de clientes habituales
 * Carga información completa desde Tango incluyendo:
 * - Condiciones comerciales
 * - Límites de crédito
 * - Vendedor asignado
 * - Transporte preferido
 * - Percepciones
 * - Historial de compras (opcional)
 */
export const useClienteHabitual = ({ codigoCliente, enabled = true }) => {
  const [cliente, setCliente] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [percepciones, setPercepciones] = useState([]);
  const [estadoCuenta, setEstadoCuenta] = useState(null);

  /**
   * Cargar datos completos del cliente habitual desde Tango
   */
  const cargarClienteHabitual = useCallback(async (codigo) => {
    if (!codigo || codigo === '000000') {
      setError('Código de cliente inválido');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Obtener datos básicos del cliente desde Tango
      const response = await cotizadorService.obtenerClienteHabitual(codigo);

      if (!response.success || !response.data) {
        throw new Error(response.error || 'Cliente no encontrado');
      }

      const clienteTango = response.data;

      // 2. Transformar datos al formato del cotizador
      const clienteTransformado = transformarClienteDesdeTango(
        clienteTango,
        TIPO_CLIENTE.HABITUAL
      );

      setCliente(clienteTransformado);

      // 3. Cargar percepciones del cliente (en paralelo)
      cargarPercepcionesCliente(codigo, clienteTango.COD_PROVIN);

      // 4. Cargar estado de cuenta corriente (opcional)
      cargarEstadoCuenta(codigo);

      return clienteTransformado;
    } catch (err) {
      console.error('❌ Error al cargar cliente habitual:', err);
      setError(err.message || 'Error al cargar cliente');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Cargar percepciones fiscales del cliente
   */
  const cargarPercepcionesCliente = useCallback(async (codigo, codProvincia) => {
    try {
      const response = await cotizadorService.obtenerPercepcionesCliente(codigo, TIPO_CLIENTE.HABITUAL);

      if (response.success && response.data) {
        // Normalizar percepciones para que sean compatibles con el cálculo de totales
        const percepcionesNormalizadas = transformarPercepcionesParaCalculo(response.data, TIPO_CLIENTE.HABITUAL);
        setPercepciones(percepcionesNormalizadas);
      } else {
        setPercepciones([]);
      }
    } catch (err) {
      console.warn('⚠️ No se pudieron cargar las percepciones del cliente:', err);
      setPercepciones([]);
    }
  }, []);

  /**
   * Cargar estado de cuenta corriente del cliente
   */
  const cargarEstadoCuenta = useCallback(async (codigo) => {
    try {
      const response = await cotizadorService.obtenerEstadoCuentaCliente(codigo);

      if (response.success && response.data) {
        setEstadoCuenta(response.data);
      }
    } catch (err) {
      console.warn('⚠️ No se pudo cargar el estado de cuenta:', err);
      setEstadoCuenta(null);
    }
  }, []);

  /**
   * Verificar si el cliente tiene crédito disponible
   */
  const tieneCredito = useCallback(() => {
    if (!estadoCuenta) return true; // Si no hay info, permitir

    const saldo = estadoCuenta.saldo || 0;
    const limite = estadoCuenta.limiteCredito || 0;

    // Si no tiene límite establecido, permitir
    if (limite === 0) return true;

    // Verificar si está dentro del límite
    return saldo < limite;
  }, [estadoCuenta]);

  /**
   * Obtener información de crédito disponible
   */
  const getCreditoDisponible = useCallback(() => {
    if (!estadoCuenta) return null;

    const saldo = estadoCuenta.saldo || 0;
    const limite = estadoCuenta.limiteCredito || 0;
    const disponible = limite - saldo;

    return {
      saldo,
      limite,
      disponible,
      porcentajeUsado: limite > 0 ? (saldo / limite) * 100 : 0
    };
  }, [estadoCuenta]);

  /**
   * Validar si se puede crear un pedido para este cliente
   */
  const validarPedido = useCallback((montoTotal) => {
    const errors = [];

    // Verificar crédito disponible
    if (estadoCuenta && estadoCuenta.limiteCredito > 0) {
      const creditoInfo = getCreditoDisponible();

      if (creditoInfo.disponible < montoTotal) {
        errors.push(
          `Crédito insuficiente. Disponible: $${creditoInfo.disponible.toFixed(2)}, Requerido: $${montoTotal.toFixed(2)}`
        );
      }
    }

    // Verificar si el cliente está activo
    if (cliente && cliente.estado === 'INACTIVO') {
      errors.push('El cliente está inactivo');
    }

    // Verificar si tiene deuda vencida
    if (estadoCuenta && estadoCuenta.deudaVencida > 0) {
      errors.push(`El cliente tiene deuda vencida: $${estadoCuenta.deudaVencida.toFixed(2)}`);
    }

    return {
      valido: errors.length === 0,
      errores: errors
    };
  }, [cliente, estadoCuenta, getCreditoDisponible]);

  /**
   * Refrescar datos del cliente
   */
  const refrescarCliente = useCallback(() => {
    if (cliente && cliente.codigoCliente) {
      cargarClienteHabitual(cliente.codigoCliente);
    }
  }, [cliente, cargarClienteHabitual]);

  // Auto-cargar cuando el código cambia
  useEffect(() => {
    if (enabled && codigoCliente && codigoCliente !== '000000') {
      cargarClienteHabitual(codigoCliente);
    }
  }, [codigoCliente, enabled, cargarClienteHabitual]);

  return {
    cliente,
    isLoading,
    error,
    percepciones,
    estadoCuenta,
    tieneCredito,
    getCreditoDisponible,
    validarPedido,
    cargarClienteHabitual,
    refrescarCliente,
  };
};

export default useClienteHabitual;
