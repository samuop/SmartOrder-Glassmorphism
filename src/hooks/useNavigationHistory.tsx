import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Hook personalizado para manejar navegación con historial
 * Mejora el manejo del botón "atrás" del navegador
 */
export const useNavigationHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Navega a una ruta preservando el estado de origen
   * @param {string} to - Ruta de destino
   * @param {object} options - Opciones adicionales (state, replace, etc)
   */
  const navigateWithHistory = useCallback((to, options = {}) => {
    const state = {
      ...options.state,
      from: location.pathname,
      timestamp: Date.now()
    };

    navigate(to, {
      ...options,
      state
    });
  }, [navigate, location.pathname]);

  /**
   * Vuelve a la página anterior usando el historial del navegador
   * Si hay un "from" en el state, lo usa, sino usa navigate(-1)
   */
  const goBack = useCallback(() => {
    if (location.state?.from) {
      navigate(location.state.from, { replace: true });
    } else {
      navigate(-1);
    }
  }, [navigate, location.state]);

  /**
   * Vuelve a una ruta específica
   * @param {string} to - Ruta de destino
   * @param {boolean} replace - Si debe reemplazar en el historial
   */
  const goBackTo = useCallback((to, replace = true) => {
    navigate(to, { replace });
  }, [navigate]);

  return {
    navigateWithHistory,
    goBack,
    goBackTo,
    from: location.state?.from,
    hasHistory: !!location.state?.from
  };
};
