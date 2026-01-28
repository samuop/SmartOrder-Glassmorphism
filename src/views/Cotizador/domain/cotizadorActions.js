/**
 * Acciones de negocio del Cotizador
 * Funciones puras que manejan la lógica de negocio sin dependencias de React
 */

/**
 * Prepara los datos de la cotización para guardar en backend
 * @param {object} cotizacion - Datos de la cotización del frontend
 * @param {array} articulos - Lista de artículos
 * @returns {object} Datos formateados para el backend
 */
export const prepararDatosGuardado = (cotizacion, articulos) => {
    const articulosActivos = articulos.filter(art => !art._isDeleted);

    return {
        cotizacion: {
            ...cotizacion,
            // Campos adicionales que pueda necesitar el backend
        },
        articulos: articulosActivos.map(art => ({
            codArticulo: art.codArticu || art.codigo,
            cantidad: art.cantidad || 1,
            descuento: art.bonif || 0,
            descripcion: art.descripcion,
            precioUnitarioSinImp: art.precioSinImp,
            ivaPorcentaje: art.iva || 21,
        })),
    };
};

/**
 * Prepara los datos para crear un pedido desde la cotización
 * @param {object} cotizacion - Datos de la cotización
 * @param {array} articulos - Lista de artículos
 * @returns {object} Datos formateados para crear pedido
 */
export const prepararDatosPedido = (cotizacion, articulos) => {
    const articulosActivos = articulos.filter(art => !art._isDeleted);

    return {
        cotizacionId: cotizacion.ID || cotizacion.id,
        cliente: {
            codigo: cotizacion.tipoCliente === 'H' ? cotizacion.codigoCliente : '000000',
            razonSocial: cotizacion.cliente,
            tipo: cotizacion.tipoCliente,
        },
        articulos: articulosActivos.map(art => ({
            codigo: art.codigo || art.codArticu,
            cantidad: art.cantidad,
            descripcion: art.descripcion,
        })),
        version: cotizacion.VERSION || 1,
    };
};

/**
 * Compara artículos originales con actuales para determinar si hay cambios reales
 * @param {array} originales - Snapshot de artículos originales
 * @param {array} actuales - Artículos actuales
 * @returns {boolean} true si hay cambios significativos
 */
export const compararArticulosParaVersion = (originales, actuales) => {
    // Si no hay originales, no hay con qué comparar
    if (!originales || originales.length === 0) {
        return false;
    }

    // Filtrar artículos activos (no eliminados)
    const articulosActivos = actuales.filter(art => !art._isDeleted);

    // Si hay artículos nuevos, hay cambio
    const articulosNuevos = articulosActivos.filter(art => art._isNew);
    if (articulosNuevos.length > 0) {
        return true;
    }

    // Crear mapas para comparación eficiente
    const originalesMap = new Map();
    originales.forEach(art => originalesMap.set(art.id, art));

    const actualesGuardados = articulosActivos.filter(art => !art._isNew);

    // Comparar cantidad de artículos
    if (actualesGuardados.length !== originales.length) {
        return true;
    }

    // Campos a comparar
    const camposImportantes = ['codigo', 'descripcion', 'cantidad', 'bonif', 'precioSinImp', 'iva'];

    // Comparar cada artículo
    for (const artActual of actualesGuardados) {
        const artOriginal = originalesMap.get(artActual.id);

        if (!artOriginal) {
            return true;
        }

        for (const campo of camposImportantes) {
            const valorActual = String(artActual[campo] ?? '');
            const valorOriginal = String(artOriginal[campo] ?? '');

            if (valorActual !== valorOriginal) {
                return true;
            }
        }
    }

    return false;
};

/**
 * Calcula si una cotización tiene cambios que requieren una nueva versión
 * @param {object} cotizacion - Cotización actual
 * @param {array} articulos - Artículos actuales
 * @param {array} articulosOriginales - Snapshot de artículos originales
 * @returns {boolean} true si requiere nueva versión
 */
export const requiereNuevaVersionCalculo = (cotizacion, articulos, articulosOriginales) => {
    // Si es versión 1 o nueva, no requiere nueva versión
    const esNueva = cotizacion?.VERSION === 1 || cotizacion?.VERSION === undefined;
    const tieneArticulosGuardados = articulos.some(art => !art._isNew && !art._isDeleted);

    if (esNueva || !tieneArticulosGuardados) {
        return false;
    }

    return compararArticulosParaVersion(articulosOriginales, articulos);
};

/**
 * Genera el texto descriptivo del estado de la cotización
 * @param {object} params - Parámetros del estado
 * @returns {string} Texto descriptivo
 */
export const getEstadoTexto = ({ cotizacionId, modoEdicion, lockedBy }) => {
    if (!cotizacionId) {
        return '🆕 Selecciona un cliente para comenzar';
    }
    if (modoEdicion) {
        return '✏️ Modo Edición Activo';
    }
    if (lockedBy) {
        return `Solo lectura - Editando: ${lockedBy.nombre || 'otro usuario'}`;
    }
    return 'Solo lectura - Click en "Editar" para modificar';
};

export default {
    prepararDatosGuardado,
    prepararDatosPedido,
    compararArticulosParaVersion,
    requiereNuevaVersionCalculo,
    getEstadoTexto,
};
