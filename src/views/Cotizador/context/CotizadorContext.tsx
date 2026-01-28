import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { cotizadorReducer, initialState, actionTypes } from './cotizadorReducer';

/**
 * Context para el estado de UI del Cotizador
 * Maneja estados de visualización y configuración que no son específicos de la cotización
 */
const CotizadorContext = createContext(null);
const CotizadorDispatchContext = createContext(null);

/**
 * Provider que envuelve el cotizador y provee estado global
 */
export const CotizadorProvider = ({ children }) => {
    const [state, dispatch] = useReducer(cotizadorReducer, initialState);

    // Memoizar el estado para evitar re-renders innecesarios
    const memoizedState = useMemo(() => state, [state]);

    return (
        <CotizadorContext.Provider value={memoizedState}>
            <CotizadorDispatchContext.Provider value={dispatch}>
                {children}
            </CotizadorDispatchContext.Provider>
        </CotizadorContext.Provider>
    );
};

/**
 * Hook para acceder al estado del cotizador
 * @returns {object} Estado actual del cotizador
 */
export const useCotizadorState = () => {
    const context = useContext(CotizadorContext);
    if (context === null) {
        throw new Error('useCotizadorState debe usarse dentro de un CotizadorProvider');
    }
    return context;
};

/**
 * Hook para acceder al dispatch del cotizador
 * @returns {function} Función dispatch
 */
export const useCotizadorDispatch = () => {
    const context = useContext(CotizadorDispatchContext);
    if (context === null) {
        throw new Error('useCotizadorDispatch debe usarse dentro de un CotizadorProvider');
    }
    return context;
};

/**
 * Hook combinado para estado + acciones comunes
 * Provee helpers para las acciones más frecuentes
 */
export const useCotizadorUI = () => {
    const state = useCotizadorState();
    const dispatch = useCotizadorDispatch();

    const actions = useMemo(() => ({
        // Vista
        setVista: (vista) => dispatch({ type: actionTypes.SET_VISTA, payload: vista }),

        // Error
        setError: (error) => dispatch({ type: actionTypes.SET_ERROR, payload: error }),
        clearError: () => dispatch({ type: actionTypes.SET_ERROR, payload: null }),

        // Visualización IVA/Descuento
        toggleIVA: () => dispatch({ type: actionTypes.TOGGLE_IVA }),
        toggleDiscount: () => dispatch({ type: actionTypes.TOGGLE_DISCOUNT }),
        setShowIVA: (show) => dispatch({ type: actionTypes.SET_SHOW_IVA, payload: show }),
        setApplyDiscount: (apply) => dispatch({ type: actionTypes.SET_APPLY_DISCOUNT, payload: apply }),

        // Precios
        setActualizarPrecios: (actualizar) => dispatch({ type: actionTypes.SET_ACTUALIZAR_PRECIOS, payload: actualizar }),
        setPreviewPrecios: (preview) => dispatch({ type: actionTypes.SET_PREVIEW_PRECIOS, payload: preview }),
        setLoadingPreview: (loading) => dispatch({ type: actionTypes.SET_LOADING_PREVIEW, payload: loading }),

        // Nueva versión
        setRazonCambio: (razon) => dispatch({ type: actionTypes.SET_RAZON_CAMBIO, payload: razon }),

        // Percepciones
        setPercepciones: (percepciones) => dispatch({ type: actionTypes.SET_PERCEPCIONES, payload: percepciones }),

        // Reset
        reset: () => dispatch({ type: actionTypes.RESET }),
    }), [dispatch]);

    return { ...state, ...actions };
};

// Re-exportar tipos de acciones para uso externo
export { actionTypes } from './cotizadorReducer';
