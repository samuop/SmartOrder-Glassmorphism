/**
 * Constantes para el manejo de clientes en el cotizador
 */

export const TIPO_CLIENTE = {
  HABITUAL: 'H',
  OCASIONAL: 'O',
  POTENCIAL: 'P'
};

export const TIPO_CLIENTE_LABEL = {
  [TIPO_CLIENTE.HABITUAL]: 'Habitual',
  [TIPO_CLIENTE.OCASIONAL]: 'Ocasional',
  [TIPO_CLIENTE.POTENCIAL]: 'Potencial'
};

export const TIPO_CLIENTE_DESCRIPCION = {
  [TIPO_CLIENTE.HABITUAL]: 'Cliente con cuenta corriente y condiciones especiales',
  [TIPO_CLIENTE.OCASIONAL]: 'Cliente sin cuenta corriente (consumidor final)',
  [TIPO_CLIENTE.POTENCIAL]: 'Cliente potencial (prospecto)'
};

/**
 * Campos obligatorios según tipo de cliente
 */
export const CAMPOS_REQUERIDOS = {
  [TIPO_CLIENTE.HABITUAL]: [
    'codigoCliente',
    'cliente',
    'condicion',
    'listaPrecios',
    'talonario',
    'talonarioFactura'
  ],
  [TIPO_CLIENTE.OCASIONAL]: [
    'codigoCliente',
    'cliente',
    'condicion',
    'listaPrecios',
    'talonario',
    'talonarioFactura',
    'tipoDocumento'
  ]
};

/**
 * Opciones de talonario por defecto según tipo de cliente
 */
export const TALONARIO_DEFAULT = {
  [TIPO_CLIENTE.HABITUAL]: {
    pedido: '7',
    factura: '91' // Factura A para empresas
  },
  [TIPO_CLIENTE.OCASIONAL]: {
    pedido: '7',
    factura: '90' // Factura B para consumidor final
  }
};

/**
 * Flags para identificar origen del cliente
 */
export const ORIGEN_CLIENTE = {
  TANGO: 'TANGO',
  CRM: 'CRM',
  NUEVO: 'NUEVO'
};
