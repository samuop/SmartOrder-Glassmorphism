import { TIPO_CLIENTE, CAMPOS_REQUERIDOS } from '../constants';

/**
 * Valida si un cliente cumple con los campos requeridos según su tipo
 * @param {Object} cliente - Datos del cliente
 * @param {string} tipoCliente - Tipo de cliente (H, O, P)
 * @returns {Object} { isValid: boolean, errors: string[] }
 */
export const validarCliente = (cliente, tipoCliente) => {
  const errors = [];
  const camposRequeridos = CAMPOS_REQUERIDOS[tipoCliente] || [];

  camposRequeridos.forEach(campo => {
    if (!cliente[campo] || cliente[campo].trim() === '') {
      errors.push(`El campo ${campo} es obligatorio`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Valida formato de CUIT/DNI
 * @param {string} cuit - CUIT o DNI a validar
 * @returns {boolean}
 */
export const validarCUIT = (cuit) => {
  if (!cuit) return false;

  // Remover guiones y espacios
  const cuitLimpio = cuit.replace(/[-\s]/g, '');

  // Debe tener 11 dígitos para CUIT o 8 para DNI
  if (cuitLimpio.length !== 11 && cuitLimpio.length !== 8) {
    return false;
  }

  return /^\d+$/.test(cuitLimpio);
};

/**
 * Formatea CUIT con guiones (XX-XXXXXXXX-X)
 * @param {string} cuit - CUIT sin formato
 * @returns {string} CUIT formateado
 */
export const formatearCUIT = (cuit) => {
  if (!cuit) return '';

  const cuitLimpio = cuit.replace(/[-\s]/g, '');

  if (cuitLimpio.length === 11) {
    return `${cuitLimpio.slice(0, 2)}-${cuitLimpio.slice(2, 10)}-${cuitLimpio.slice(10)}`;
  }

  return cuitLimpio;
};

/**
 * Determina si un cliente es habitual u ocasional
 * @param {Object} cliente - Datos del cliente
 * @returns {string} 'H' | 'O' | 'P'
 */
export const detectarTipoCliente = (cliente) => {
  // Si tiene COD_CLIENT real (no '000000'), es habitual
  if (cliente.COD_CLIENT && cliente.COD_CLIENT !== '000000') {
    return TIPO_CLIENTE.HABITUAL;
  }

  // Si tiene código 000000 o no tiene código, es ocasional
  if (!cliente.COD_CLIENT || cliente.COD_CLIENT === '000000') {
    return TIPO_CLIENTE.OCASIONAL;
  }

  // Por defecto, ocasional
  return TIPO_CLIENTE.OCASIONAL;
};

/**
 * Valida si los datos del cliente están completos para confirmar
 * @param {Object} cotizacion - Datos de la cotización
 * @returns {boolean}
 */
export const clienteEstaCompleto = (cotizacion) => {
  if (!cotizacion) return false;

  const camposBasicos = cotizacion.codigoCliente &&
                       cotizacion.codigoCliente.trim() !== '' &&
                       cotizacion.cliente &&
                       cotizacion.cliente.trim() !== '';

  return camposBasicos;
};

/**
 * Compara dos objetos de cliente para detectar cambios
 * @param {Object} clienteA - Cliente A
 * @param {Object} clienteB - Cliente B
 * @returns {boolean} true si son diferentes
 */
export const clientesHanCambiado = (clienteA, clienteB) => {
  if (!clienteA && !clienteB) return false;
  if (!clienteA || !clienteB) return true;

  const camposComparar = ['codigoCliente', 'cliente', 'tipoCliente', 'condicion', 'listaPrecios'];

  return camposComparar.some(campo => clienteA[campo] !== clienteB[campo]);
};
