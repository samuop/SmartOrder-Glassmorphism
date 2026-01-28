/**
 * Reducer para el estado de UI del Cotizador
 * Consolida los múltiples useState del componente principal
 */

// Tipos de acciones
export const actionTypes = {
    // Vista
    SET_VISTA: 'SET_VISTA',
    SET_ERROR: 'SET_ERROR',

    // Visualización
    TOGGLE_IVA: 'TOGGLE_IVA',
    TOGGLE_DISCOUNT: 'TOGGLE_DISCOUNT',
    SET_SHOW_IVA: 'SET_SHOW_IVA',
    SET_APPLY_DISCOUNT: 'SET_APPLY_DISCOUNT',

    // Precios
    SET_ACTUALIZAR_PRECIOS: 'SET_ACTUALIZAR_PRECIOS',
    SET_PREVIEW_PRECIOS: 'SET_PREVIEW_PRECIOS',
    SET_LOADING_PREVIEW: 'SET_LOADING_PREVIEW',

    // Nueva versión
    SET_RAZON_CAMBIO: 'SET_RAZON_CAMBIO',

    // Percepciones
    SET_PERCEPCIONES: 'SET_PERCEPCIONES',

    // Reset
    RESET: 'RESET',
};

// Estado inicial
export const initialState = {
    // Estado de UI/Vista
    vistaActual: 'lista',
    loadError: null,

    // Switches de visualización (IVA y Descuento)
    showIVA: true,
    applyDiscount: true,

    // Estados para actualización de precios
    actualizarPrecios: false,
    previsualizacionPrecios: null,
    loadingPreview: false,

    // Estado para nueva versión
    razonCambio: '',

    // Percepciones del cliente
    percepcionesCliente: [],
};

/**
 * Reducer principal
 * @param {object} state - Estado actual
 * @param {object} action - Acción a ejecutar { type, payload }
 * @returns {object} Nuevo estado
 */
export const cotizadorReducer = (state, action) => {
    switch (action.type) {
        // Vista
        case actionTypes.SET_VISTA:
            return { ...state, vistaActual: action.payload };

        case actionTypes.SET_ERROR:
            return { ...state, loadError: action.payload };

        // Visualización
        case actionTypes.TOGGLE_IVA:
            return { ...state, showIVA: !state.showIVA };

        case actionTypes.TOGGLE_DISCOUNT:
            return { ...state, applyDiscount: !state.applyDiscount };

        case actionTypes.SET_SHOW_IVA:
            return { ...state, showIVA: action.payload };

        case actionTypes.SET_APPLY_DISCOUNT:
            return { ...state, applyDiscount: action.payload };

        // Precios
        case actionTypes.SET_ACTUALIZAR_PRECIOS:
            return { ...state, actualizarPrecios: action.payload };

        case actionTypes.SET_PREVIEW_PRECIOS:
            return { ...state, previsualizacionPrecios: action.payload };

        case actionTypes.SET_LOADING_PREVIEW:
            return { ...state, loadingPreview: action.payload };

        // Nueva versión
        case actionTypes.SET_RAZON_CAMBIO:
            return { ...state, razonCambio: action.payload };

        // Percepciones
        case actionTypes.SET_PERCEPCIONES:
            return { ...state, percepcionesCliente: action.payload };

        // Reset
        case actionTypes.RESET:
            return { ...initialState };

        default:
            console.warn(`Acción desconocida: ${action.type}`);
            return state;
    }
};

export default cotizadorReducer;
