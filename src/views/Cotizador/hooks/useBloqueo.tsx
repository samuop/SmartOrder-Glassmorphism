import { useState, useCallback, useRef, useEffect } from 'react';
import cotizadorService from '../../../services/cotizadorService';

// Intervalo de renovación: 2 minutos (el bloqueo dura 5 min, renovamos antes de que expire)
const RENEWAL_INTERVAL = 2 * 60 * 1000;
// Intervalo de verificación: 30 segundos
const CHECK_INTERVAL = 30 * 1000;

/**
 * Hook para manejar el sistema de bloqueos multiusuario
 * Ahora con renovación automática para evitar expiración mientras se edita
 */
export const useBloqueo = (cotizacionId) => {
  const [isLocked, setIsLocked] = useState(false);
  const [lockedBy, setLockedBy] = useState(null);
  const [lockExpiry, setLockExpiry] = useState(null);
  const [modoEdicion, setModoEdicion] = useState(false);

  const renewalIntervalRef = useRef(null);
  const checkIntervalRef = useRef(null);
  const isReleasingRef = useRef(false);

  /**
   * Renovar bloqueo automáticamente
   */
  const renovarBloqueo = useCallback(async () => {
    if (!cotizacionId || !isLocked) return;

    try {
      const response = await cotizadorService.renovarBloqueo(cotizacionId);

      if (response.success && response.data.locked) {
        setLockExpiry(new Date(response.data.expiresAt));
      } else {
        // El bloqueo expiró o fue tomado por otro usuario
        console.warn('⚠️ No se pudo renovar el bloqueo');
        setIsLocked(false);
        setModoEdicion(false);
        setLockedBy(null);
      }
    } catch (error) {
      console.error('Error al renovar bloqueo:', error);
      // Si falla la renovación, asumir que perdimos el bloqueo
      setIsLocked(false);
      setModoEdicion(false);
    }
  }, [cotizacionId, isLocked]);

  /**
   * Adquirir bloqueo (ahora explícito, no automático)
   */
  const adquirirBloqueo = useCallback(async (id, esNueva = false) => {
    try {
      const response = await cotizadorService.adquirirBloqueo(id || cotizacionId);

      if (response.success && response.data.locked) {
        setIsLocked(true);
        setModoEdicion(true);
        setLockExpiry(new Date(response.data.expiresAt));
        setLockedBy(null);
        return true;
      } else if (response.success && !response.data.locked) {
        setIsLocked(false);
        setModoEdicion(false);
        setLockedBy(response.data.lockedBy);
        setLockExpiry(new Date(response.data.expiresAt));
        console.log('❌ No se pudo adquirir bloqueo. Bloqueado por:', response.data.lockedBy);
        return false;
      }
    } catch (error) {
      console.error('Error al adquirir bloqueo:', error);
      return false;
    }
  }, [cotizacionId]);

  /**
   * Liberar bloqueo
   */
  const liberarBloqueo = useCallback(async () => {
    if (isReleasingRef.current || !isLocked) {
      return;
    }

    isReleasingRef.current = true;

    try {
      await cotizadorService.liberarBloqueo(cotizacionId);
      setIsLocked(false);
      setModoEdicion(false);
      setLockedBy(null);
      setLockExpiry(null);
    } catch (error) {
      console.error('Error al liberar bloqueo:', error);
    } finally {
      setTimeout(() => {
        isReleasingRef.current = false;
      }, 100);
    }
  }, [cotizacionId, isLocked]);

  /**
   * Verificar estado del bloqueo (sin adquirirlo automáticamente)
   */
  const verificarEstadoBloqueo = useCallback(async () => {
    if (!cotizacionId) {
      return;
    }

    try {
      const response = await cotizadorService.verificarBloqueo(cotizacionId);

      if (response.success) {
        if (response.data.locked && response.data.lockedBy) {
          setLockedBy(response.data.lockedBy);
          setLockExpiry(new Date(response.data.expiresAt));
        } else if (!response.data.locked) {
          if (isLocked) {
            console.warn('⚠️ Bloqueo perdido o expirado');
            setIsLocked(false);
            setModoEdicion(false);
          }
          setLockedBy(null);
          setLockExpiry(null);
        }
      }
    } catch (error) {
      console.error('Error al verificar bloqueo:', error);
    }
  }, [cotizacionId, isLocked]);

  /**
   * Resetear estado de bloqueo cuando cambia el cotizacionId
   */
  useEffect(() => {
    // Limpiar intervalos previos
    if (renewalIntervalRef.current) {
      clearInterval(renewalIntervalRef.current);
      renewalIntervalRef.current = null;
    }
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }

    // Resetear estados de bloqueo cuando cambia la cotización
    setIsLocked(false);
    // Para cotizaciones nuevas (sin ID), habilitar modo edición por defecto
    setModoEdicion(!cotizacionId);
    setLockedBy(null);
    setLockExpiry(null);
  }, [cotizacionId]);

  /**
   * Iniciar renovación automática cuando se adquiere el bloqueo
   */
  useEffect(() => {
    if (cotizacionId && isLocked && modoEdicion) {
      // Renovar cada 2 minutos
      renewalIntervalRef.current = setInterval(renovarBloqueo, RENEWAL_INTERVAL);

      // También verificar periódicamente
      checkIntervalRef.current = setInterval(verificarEstadoBloqueo, CHECK_INTERVAL);

      return () => {
        if (renewalIntervalRef.current) {
          clearInterval(renewalIntervalRef.current);
        }
        if (checkIntervalRef.current) {
          clearInterval(checkIntervalRef.current);
        }
      };
    }
  }, [cotizacionId, isLocked, modoEdicion, renovarBloqueo, verificarEstadoBloqueo]);

  /**
   * Liberar bloqueo al desmontar
   */
  useEffect(() => {
    return () => {
      if (cotizacionId && isLocked) {
        liberarBloqueo();
      }
      if (renewalIntervalRef.current) {
        clearInterval(renewalIntervalRef.current);
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [cotizacionId, isLocked, liberarBloqueo]);

  return {
    isLocked,
    lockedBy,
    lockExpiry,
    modoEdicion,
    adquirirBloqueo,
    liberarBloqueo,
    verificarEstadoBloqueo,
    renovarBloqueo,
  };
};
