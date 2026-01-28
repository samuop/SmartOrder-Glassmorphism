// Utilidades de validación para el formulario de cliente ocasional

import { TIPO_DOC_CODES, DNIS_GENERICOS } from '../constants/catalogos';

/**
 * Normaliza un DNI/CUIT/CUIL eliminando guiones, espacios y caracteres no numéricos
 * @param {string} value - Valor a normalizar
 * @returns {string} - Solo números
 */
export const normalizarDocumento = (value) => {
  if (!value) return '';
  return value.replace(/[^0-9]/g, '');
};

/**
 * Auto-detecta el tipo de documento según la cantidad de dígitos
 * @param {string} value - Valor ingresado
 * @returns {number} - Código de tipo de documento (80=CUIT, 96=DNI, 99=Sin identificar)
 */
export const detectarTipoDocumento = (value) => {
  const numeros = normalizarDocumento(value);
  const longitud = numeros.length;

  if (longitud === 0) {
    return TIPO_DOC_CODES.SIN_IDENTIFICAR;
  } else if (longitud >= 7 && longitud <= 8) {
    return TIPO_DOC_CODES.DNI;
  } else if (longitud === 11) {
    return TIPO_DOC_CODES.CUIT;
  } else {
    return TIPO_DOC_CODES.SIN_IDENTIFICAR;
  }
};

/**
 * Verifica si un DNI es genérico (placeholder común usado cuando no se tiene el real)
 * @param {string} documento - DNI/CUIT a verificar
 * @returns {boolean} - true si es un DNI genérico
 */
export const esDniGenerico = (documento) => {
  const normalizado = normalizarDocumento(documento);
  return DNIS_GENERICOS.includes(normalizado);
};

/**
 * Valida el formulario completo del cliente
 * @param {Object} formData - Datos del formulario
 * @returns {Object} - Objeto con errores { campo: mensaje }
 */
export const validarFormulario = (formData) => {
  const errores = {};

  // Validar razón social
  if (!formData.razonSocial.trim()) {
    errores.razonSocial = "La razón social es requerida";
  }

  // Validar CUIT/DNI/CUIL - AHORA ES OPCIONAL
  // Si está vacío, se usará el valor por defecto "00000000" al guardar
  if (formData.dniCuit.trim()) {
    const numeroLimpio = normalizarDocumento(formData.dniCuit);
    const longitud = numeroLimpio.length;

    // Solo validar formato si se ingresó algo
    if (longitud > 0 && longitud < 7) {
      errores.dniCuit = "Debe tener al menos 7 dígitos o dejarlo vacío";
    } else if (longitud === 7 || longitud === 8) {
      // DNI válido
    } else if (longitud === 11) {
      // CUIT/CUIL válido
    } else if (longitud > 8 && longitud < 11) {
      errores.dniCuit = "Formato inválido (debe ser DNI de 7-8 dígitos o CUIT de 11 dígitos)";
    } else if (longitud > 11) {
      errores.dniCuit = "Demasiados dígitos";
    }
  }
  // Validar domicilio principal
  if (!formData.domicilio || !formData.domicilio.trim()) {
    errores.domicilio = "El domicilio principal es requerido";
  }

  // Validar email
  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errores.email = "El email no es válido";
  }

  return errores;
};

/**
 * Formatea un documento (DNI o CUIT) mientras se escribe
 * Auto-detecta si es DNI o CUIT según la cantidad de dígitos y formatea en consecuencia
 * @param {string} value - Valor ingresado
 * @returns {string} - Documento formateado (DNI sin formato o CUIT como XX-XXXXXXXX-X)
 */
export const formatearDocumento = (value) => {
  let numeros = normalizarDocumento(value);
  const longitud = numeros.length;

  // Si tiene 7-8 dígitos, es DNI (sin formato especial)
  if (longitud <= 8) {
    return numeros.slice(0, 8);
  }

  // Si tiene 9+ dígitos, es CUIT/CUIL (formato XX-XXXXXXXX-X)
  if (longitud > 2) {
    numeros = numeros.slice(0, 2) + '-' + numeros.slice(2);
  }
  if (longitud > 10) {
    numeros = numeros.slice(0, 11) + '-' + numeros.slice(11);
  }
  // Limitar a 14 caracteres (11 dígitos + 2 guiones)
  if (numeros.length > 14) {
    numeros = numeros.slice(0, 14);
  }

  return numeros;
};

/**
 * @deprecated Usar formatearDocumento en su lugar
 */
export const formatearCuit = formatearDocumento;

/**
 * Mapea los datos del cliente de backend a formato del formulario
 * @param {Object} cliente - Cliente desde backend
 * @returns {Object} - Datos formateados para el formulario
 */
export const mapearClienteAFormulario = (cliente) => {
  return {
    razonSocial: cliente.RAZON_SOCI || "",
    nombreContacto: cliente.NOMBRE_CONTACTO || "",
    dniCuit: cliente.DNI_CUIT || "",
    tipoDoc: cliente.TIPO_DOC || 80,
    domicilio: cliente.DOMICILIO || "",
    localidad: cliente.LOCALIDAD || "",
    codigoPostal: cliente.COD_POSTAL || "",
    codProvincia: cliente.COD_PROVIN || "",
    nombreProvincia: cliente.NOMBRE_PRO || "",
    codPais: cliente.COD_PAIS || "AR",
    identifTributaria: cliente.IDENT_TRIBUT || "CUIT",
    nroIngresosBrutos: cliente.NRO_ING_BRUT || "",
    categoriaIva: cliente.CATEG_IVA || "CF",
    rg1817: cliente.RG_1817 || "",
    rg1817Vto: cliente.RG_1817_VTO ? cliente.RG_1817_VTO.split('T')[0] : "",
    rg1817NroCertif: cliente.RG_1817_NRO_CERTIF || "",
    sobreTasa: cliente.SOBRE_TASA || "N",
    porcExclusion: cliente.PORC_EXCLUSION?.toString() || "0.00",
    liquidaImpInterno: cliente.LIQUIDA_IMP_INT || "N",
    discriminaImpInt: cliente.DISCRIM_IMP_INT || "N",
    sobreTasaImpInt: cliente.SOBRE_TASA_IMP_INT || "N",
    email: cliente.E_MAIL || "",
    telefono: cliente.TELEFONO_1 || "",
    fax: cliente.FAX || "",
    paginaWeb: cliente.PAG_WEB || "",
    actividad: cliente.ACTIVIDAD || "",
    rubroCom: cliente.RUBRO_COM || "",
    direccionEntrega: cliente.DIR_ENTREGA || "",
    provinciaEntrega: cliente.PROV_ENTREGA || "",
    localidadEntrega: cliente.LOC_ENTREGA || "",
    codigoPostalEntrega: cliente.CP_ENTREGA || "",
    telefonoEntrega: cliente.TEL_ENTREGA || "",
    faxEntrega: cliente.FAX_ENTREGA || "",
    observaciones: cliente.OBSERVACIONES || "",
  };
};
