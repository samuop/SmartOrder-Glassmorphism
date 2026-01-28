import { TIPO_CLIENTE } from '../constants';

/**
 * Transforma los datos del cliente desde el formato de Tango al formato del cotizador
 * @param {Object} clienteTango - Cliente en formato Tango
 * @param {string} tipoCliente - Tipo de cliente (H, O)
 * @returns {Object} Cliente en formato cotizador
 */
export const transformarClienteDesdeTango = (clienteTango, tipoCliente) => {
  if (!clienteTango) return null;

  const baseCliente = {
    codigoCliente: clienteTango.COD_CLIENT || '000000',
    cliente: clienteTango.RAZON_SOCI || '',
    tipoCliente: tipoCliente || TIPO_CLIENTE.OCASIONAL,

    // Datos fiscales
    cuit: clienteTango.CUIT || clienteTango.DNI_CUIT || clienteTango.NRO_DOCUM || '',
    tipoDocumento: clienteTango.TIPO_DOC || clienteTango.COD_TIPO_D || '80',

    // Datos de contacto
    telefono: clienteTango.TELEFONO_1 || clienteTango.TELEFONO_MOVIL || clienteTango.TELEFONO || clienteTango.TELEFONOS || '',
    email: clienteTango.E_MAIL || '',

    // Domicilio
    domicilio: clienteTango.DOMICILIO || '',
    localidad: clienteTango.LOCALIDAD || '',
    codigoPostal: clienteTango.COD_POSTAL || '',
    provincia: clienteTango.PROVINCIA || '',
    codProvincia: clienteTango.COD_PROVIN || '',
  };

  // Campos específicos de clientes HABITUALES
  if (tipoCliente === TIPO_CLIENTE.HABITUAL) {
    return {
      ...baseCliente,
      // Condición de venta - usar CÓDIGO (no descripción) para que coincida con el select
      condicion: clienteTango.COND_VTA || '',
      descripcionCondicion: clienteTango.DESCRIPCION_CONDICION || clienteTango.DESC_COND || '',

      // Lista de precios - usar CÓDIGO (no descripción) para que coincida con el select
      listaPrecios: clienteTango.NRO_LISTA || '',
      descripcionListaPrecios: clienteTango.DESCRIPCION_LISTA || clienteTango.NOMBRE_LIS || '',

      bonificacion: clienteTango.PORC_BONIF || 0,
      limiteCredito: clienteTango.LIM_CREDITO || 0,
      saldoCuentaCorriente: clienteTango.SALDO_CC || 0,

      // Saldos
      SALDO_CC: clienteTango.SALDO_CC || 0,
      SALDO_ANT: clienteTango.SALDO_ANT || 0,
      saldoAnterior: clienteTango.SALDO_ANT || 0,

      // Categoría IVA
      ID_CATEGORIA_IVA: clienteTango.ID_CATEGORIA_IVA || null,
      COD_CATEG_IVA: clienteTango.COD_CATEG_IVA || '',
      CATEG_IVA: clienteTango.CATEG_IVA || '',
      CATEG_IVA_ID_AFIP: clienteTango.CATEG_IVA_ID_AFIP || null,

      // Vendedor asignado - priorizar nombre
      codigoVendedor: clienteTango.COD_VENDED || '',
      nombreVendedor: clienteTango.NOMBRE_VENDEDOR || clienteTango.NOMBRE_VEN || clienteTango.NOM_VENDED || '',

      // Transporte preferido - priorizar nombre
      codigoTransporte: clienteTango.COD_TRANSP || '',
      nombreTransporte: clienteTango.NOMBRE_TRANSPORTE || clienteTango.NOMBRE_TRA || clienteTango.NOM_TRANSP || '',

      // Zona de venta - priorizar nombre
      codigoZona: clienteTango.COD_ZONA || '',
      nombreZona: clienteTango.NOMBRE_ZONA || clienteTango.NOM_ZONA || '',

      // Observaciones y notas
      observaciones: clienteTango.OBSERVACIO || '',
      notasInternas: clienteTango.NOTAS || '',
    };
  }

  // Campos específicos de clientes OCASIONALES
  return {
    ...baseCliente,
    // Los ocasionales usan valores por defecto del cotizador
    // Estos campos se establecen en el formulario
  };
};

/**
 * Transforma los datos de la cotización para enviar a Tango (crear pedido)
 * @param {Object} cotizacion - Datos de la cotización
 * @param {Array} articulos - Artículos de la cotización
 * @returns {Object} Estructura para Tango API
 */
export const transformarCotizacionParaTango = (cotizacion, articulos) => {
  const tipoCliente = cotizacion.tipoCliente || TIPO_CLIENTE.OCASIONAL;

  // Estructura base común
  const pedidoBase = {
    // Datos del cliente
    COD_CLIENT: cotizacion.codigoCliente,
    TIPO_CLIENTE: tipoCliente,

    // Condiciones comerciales
    COD_CONDI: cotizacion.condicion || '',
    NRO_LISTA: cotizacion.listaPrecios || '10',
    TALONARIO: cotizacion.talonario || '7',
    TALONARIO_FACTURA: cotizacion.talonarioFactura || '90',

    // Vendedor
    COD_VENDED: cotizacion.codigoVendedor || '1',

    // Origen de la venta
    ORIGEN_VENTA: cotizacion.origenVenta || 'Presencial',

    // Bonificación general
    PORC_BONIF: cotizacion.bonificacionGeneral || 0,

    // Referencia a cotización
    N_COTIZ: cotizacion.numero || '',
    VERSION_COTIZ: cotizacion.VERSION || 1,

    // Artículos
    items: articulos
      .filter(art => !art._isDeleted)
      .map((art, index) => ({
        linea: index + 1,
        COD_ARTICU: art.codigo || art.codArticu || '',
        DESCRIPCIO: art.descripcion || '',
        CANTIDAD: art.cantidad || 0,
        PRECIO_SIN_IMP: art.precioSinImp || 0,
        PORC_IVA: art.iva || 21,
        PORC_BONIF: art.bonif || 0,
      }))
  };

  // Datos específicos para cliente HABITUAL
  if (tipoCliente === TIPO_CLIENTE.HABITUAL) {
    return {
      ...pedidoBase,
      // Para habituales, Tango usa el código del cliente directamente
      // y obtiene automáticamente sus condiciones comerciales
      RAZON_SOCI: cotizacion.cliente,

      // Transporte (si está especificado)
      COD_TRANSP: cotizacion.codigoTransporte || '',

      // Dirección de entrega (si es diferente a la principal)
      DIRECCION_ENTREGA: cotizacion.direccionEntrega || '',
      LOCALIDAD_ENTREGA: cotizacion.localidadEntrega || '',
    };
  }

  // Datos específicos para cliente OCASIONAL
  if (tipoCliente === TIPO_CLIENTE.OCASIONAL) {
    return {
      ...pedidoBase,
      // Para ocasionales, debemos enviar todos los datos
      RAZON_SOCI: cotizacion.cliente,
      DNI_CUIT: cotizacion.cuit || '',
      TIPO_DOC: cotizacion.tipoDocumento || '80',

      // Domicilio completo
      DOMICILIO: cotizacion.domicilio || '',
      LOCALIDAD: cotizacion.localidad || '',
      COD_POSTAL: cotizacion.codigoPostal || '',
      PROVINCIA: cotizacion.provincia || '',
      COD_PROVIN: cotizacion.codProvincia || '',

      // Contacto
      TELEFONO: cotizacion.telefono || '',
      E_MAIL: cotizacion.email || '',

      // Talonario específico para ocasionales (generalmente Factura B)
      TALONARIO_FACTURA: cotizacion.talonarioFactura || '90',
    };
  }

  return pedidoBase;
};

/**
 * Transforma percepciones del cliente para el cálculo de totales
 * Normaliza tanto percepciones de clientes ocasionales como habituales
 * @param {Array} percepcionesCliente - Percepciones del cliente
 * @param {string} tipoCliente - Tipo de cliente (H o O)
 * @returns {Array} Percepciones formateadas para cálculo
 */
export const transformarPercepcionesParaCalculo = (percepcionesCliente, tipoCliente = 'O') => {
  if (!percepcionesCliente || !Array.isArray(percepcionesCliente)) {
    return [];
  }



  return percepcionesCliente.map(p => {
    // Para clientes HABITUALES (H), las percepciones vienen de Tango con estructura diferente
    if (tipoCliente === 'H') {
      // TIP_IMPUES de Tango: 'IB' = Ingresos Brutos, 'OT' = Otros
      const tipoImpuesto = p.TIP_IMPUES || 'OTRO';
      
      // Mapear ID_BASE_CALCULO según tabla BASE_CALCULO_PERCEPCION de Tango:
      // 1 = Neto gravado (NETO)
      // 3 = Neto gravado + I.V.A. (NETO_IVA)
      // IMPORTANTE: NO asumir por tipo de impuesto (IB puede ser NETO o NETO_IVA)
      let baseCalculo = 'NETO'; // Default
      if (p.ID_BASE_CALCULO === 3 || p.ID_BASE_CALCULO === '3') {
        baseCalculo = 'NETO_IVA';
      } else if (p.ID_BASE_CALCULO === 1 || p.ID_BASE_CALCULO === '1') {
        baseCalculo = 'NETO';
      }
      
      return {
        COD_IMPUES: p.COD_IMPUES || p.codigoImpuesto,
        DESCRIPCION: p.DESCRIPCION || p.descripcion,
        ALICUOTA_ASIGNADA: parseFloat(p.ALICUOTA || p.alicuota || 0),
        TIPO_IMPUESTO: tipoImpuesto,
        BASE_CALCULO: baseCalculo,
        MIN_NO_IMPONIBLE: parseFloat(p.MIN_NO_IMP || 0),
        MIN_PERCEPCION: parseFloat(p.MIN_IMPUES || 0),
      };
    }
    
    // Para clientes OCASIONALES (O), mantener estructura actual
    const resultado = {
      COD_IMPUES: p.COD_PERCEP || p.COD_IMPUES || p.codigo || p.codigoImpuesto,
      DESCRIPCION: p.DESCRIPCION || p.descripcion,
      ALICUOTA_ASIGNADA: parseFloat(p.ALICUOTA_ASIGNADA || p.ALICUOTA || p.alicuota || 0),
      TIPO_IMPUESTO: p.TIPO_IMPUESTO || p.tipo || 'OTRO',
      BASE_CALCULO: p.BASE_CALCULO || p.SOBRE || p.sobre || 'NETO',
      MIN_NO_IMPONIBLE: p.MIN_NO_IMPONIBLE || 0,
      MIN_PERCEPCION: p.MIN_PERCEPCION || 0,
    };
    
    return resultado;
  });
};

/**
 * Extrae información resumida del cliente para mostrar en UI
 * @param {Object} cliente - Cliente completo
 * @returns {Object} Información resumida
 */
export const extraerResumenCliente = (cliente) => {
  if (!cliente) return null;

  return {
    codigo: cliente.codigoCliente || cliente.COD_CLIENT,
    nombre: cliente.cliente || cliente.RAZON_SOCI,
    tipo: cliente.tipoCliente || detectarTipoCliente(cliente),
    cuit: cliente.cuit || cliente.DNI_CUIT,
    localidad: cliente.localidad || cliente.LOCALIDAD,
    condicion: cliente.condicion || cliente.COD_CONDI,
    listaPrecios: cliente.listaPrecios || cliente.NRO_LISTA,
  };
};

/**
 * Detecta el tipo de cliente basado en su código
 * @param {Object} cliente - Datos del cliente
 * @returns {string} Tipo de cliente (H, O, P)
 */
const detectarTipoCliente = (cliente) => {
  const codigo = cliente.codigoCliente || cliente.COD_CLIENT;

  if (!codigo || codigo === '000000') {
    return TIPO_CLIENTE.OCASIONAL;
  }

  return TIPO_CLIENTE.HABITUAL;
};
