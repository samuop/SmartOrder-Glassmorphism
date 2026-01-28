/**
 * Validaciones del Cotizador
 * Funciones para validar datos antes de operaciones críticas
 */

/**
 * Resultado de validación
 * @typedef {object} ValidationResult
 * @property {boolean} isValid - Si la validación pasó
 * @property {string|null} error - Mensaje de error si falló
 * @property {string|null} title - Título del error
 */

/**
 * Valida si la cotización puede ser guardada
 * @param {object} cotizacion - Datos de la cotización
 * @param {number|null} cotizacionId - ID de la cotización (null si es nueva)
 * @returns {ValidationResult} Resultado de la validación
 */
export const validarParaGuardar = (cotizacion, cotizacionId) => {
    if (!cotizacionId) {
        return {
            isValid: false,
            title: 'Cliente requerido',
            error: 'Debes confirmar un cliente antes de guardar la cotización',
        };
    }

    if (!cotizacion) {
        return {
            isValid: false,
            title: 'Error',
            error: 'No hay cotización para guardar',
        };
    }

    return { isValid: true, error: null, title: null };
};

/**
 * Valida si la cotización puede convertirse en pedido
 * @param {object} params - Parámetros de validación
 * @param {number|null} params.cotizacionId - ID de la cotización
 * @param {boolean} params.clienteConfirmado - Si el cliente está confirmado
 * @param {object} params.cotizacion - Datos de la cotización
 * @param {array} params.articulos - Lista de artículos
 * @returns {ValidationResult} Resultado de la validación
 */
export const validarParaPedido = ({ cotizacionId, clienteConfirmado, cotizacion, articulos }) => {
    if (!cotizacionId) {
        return {
            isValid: false,
            title: 'Error',
            error: 'No hay cotización para convertir en pedido',
        };
    }

    if (!clienteConfirmado || !cotizacion?.codigoCliente) {
        return {
            isValid: false,
            title: 'Cliente requerido',
            error: 'Debes confirmar un cliente antes de crear un pedido',
        };
    }

    const articulosActivos = articulos.filter(art => !art._isDeleted);
    if (articulosActivos.length === 0) {
        return {
            isValid: false,
            title: 'Sin artículos',
            error: 'Agrega al menos un artículo para crear el pedido',
        };
    }

    return { isValid: true, error: null, title: null };
};

/**
 * Valida si se puede confirmar un cliente
 * @param {object} cotizacion - Datos de la cotización
 * @returns {ValidationResult} Resultado de la validación
 */
export const validarParaConfirmarCliente = (cotizacion) => {
    if (!cotizacion?.codigoCliente) {
        return {
            isValid: false,
            title: 'Cliente requerido',
            error: 'Selecciona un cliente antes de confirmar',
        };
    }

    return { isValid: true, error: null, title: null };
};

/**
 * Valida si se puede generar PDF
 * @param {number|null} cotizacionId - ID de la cotización
 * @param {array} articulos - Lista de artículos
 * @returns {ValidationResult} Resultado de la validación
 */
export const validarParaPDF = (cotizacionId, articulos) => {
    if (!cotizacionId) {
        return {
            isValid: false,
            title: 'Cotización no guardada',
            error: 'Debes guardar la cotización antes de generar el PDF',
        };
    }

    const articulosActivos = articulos.filter(art => !art._isDeleted);
    if (articulosActivos.length === 0) {
        return {
            isValid: false,
            title: 'Sin artículos',
            error: 'Agrega al menos un artículo para generar el PDF',
        };
    }

    return { isValid: true, error: null, title: null };
};

/**
 * Valida datos de artículo antes de agregar
 * @param {object} articulo - Datos del artículo
 * @returns {ValidationResult} Resultado de la validación
 */
export const validarArticulo = (articulo) => {
    if (!articulo) {
        return {
            isValid: false,
            title: 'Error',
            error: 'No se proporcionaron datos del artículo',
        };
    }

    const codigo = articulo.articulo || articulo.codArticu || articulo.codigo;
    if (!codigo) {
        return {
            isValid: false,
            title: 'Código requerido',
            error: 'El artículo debe tener un código',
        };
    }

    if (!articulo.precioSinImp && articulo.precioSinImp !== 0) {
        return {
            isValid: false,
            title: 'Precio requerido',
            error: 'El artículo debe tener un precio',
        };
    }

    return { isValid: true, error: null, title: null };
};

export default {
    validarParaGuardar,
    validarParaPedido,
    validarParaConfirmarCliente,
    validarParaPDF,
    validarArticulo,
};
