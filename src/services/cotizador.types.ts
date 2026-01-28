/**
 * Tipos para el Servicio de Cotizador
 *
 * Este archivo define los tipos TypeScript para todas las entidades
 * y respuestas del servicio de cotizaciones.
 */

// ==================== COTIZACIÓN ====================

export type EstadoCotizacion =
  | 'Borrador'
  | 'Enviada'
  | 'Aceptada'
  | 'Rechazada'
  | 'Vencida'
  | 'Convertida'
  | 'Anulada'

export type TipoCotizacion = 'Normal' | 'Proforma' | 'Presupuesto'

export type OrigenVenta = 'Presencial' | 'Web' | 'Telefono' | 'Email'

export type TipoCliente = 'Habitual' | 'Ocasional'

export type Moneda = 'ARS' | 'USD'

export interface CotizacionData {
  id?: number
  numero?: string
  titulo?: string
  estado?: EstadoCotizacion
  talonario?: string
  talonarioFactura?: string
  tipo?: TipoCotizacion
  fechaVigencia?: string
  codCliente?: string
  nombreCliente?: string
  tipoCliente?: TipoCliente
  condicionVenta?: string
  codVendedor?: string
  listaPrecios?: string
  codTransporte?: string
  origenVenta?: OrigenVenta
  bonificacionGeneral?: number
  moneda?: Moneda
  observaciones?: string
  notasInternas?: string
  esPrivada?: boolean
  leyenda2?: string
  leyenda3?: string
  leyenda4?: string
  leyenda5?: string
  creadoPor?: number
  modificadoPor?: number
}

export interface CotizacionResponse {
  id: number
  numero: string
  titulo?: string
  estado: EstadoCotizacion
  fechaCreacion: string
  fechaModificacion?: string
  fechaVigencia?: string
  cliente: ClienteInfo
  articulos: ArticuloResponse[]
  subtotal: number
  bonificacionGeneral: number
  iva: number
  total: number
  moneda: Moneda
  observaciones?: string
  notasInternas?: string
  esPrivada: boolean
  bloqueadoPor?: number
  bloqueadoHasta?: string
  creadoPor: number
  modificadoPor?: number
}

export interface FiltrosCotizacion {
  page?: number
  limit?: number
  estado?: EstadoCotizacion | 'todos'
  clienteId?: number
  codCliente?: string
  creadoPor?: number
  fechaDesde?: string
  fechaHasta?: string
  busqueda?: string
  montoMinimo?: number
  montoMaximo?: number
}

export interface ListaCotizacionesResponse {
  cotizaciones: CotizacionResponse[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ==================== ARTÍCULOS ====================

export interface ArticuloData {
  id?: number
  cotizacionId?: number
  codArticulo: string
  descripcion?: string
  cantidad: number
  precioUnitario: number
  bonificacion?: number
  alicuotaIVA?: number
  observaciones?: string
}

export interface ArticuloResponse {
  id: number
  cotizacionId: number
  codArticulo: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  precioUnitarioConIva: number
  bonificacion: number
  alicuotaIVA: number
  subtotal: number
  subtotalConIva: number
  stock?: number
  observaciones?: string
  orden: number
}

export interface ArticuloBusqueda {
  codigo: string
  descripcion: string
  precioLista: number
  precioVenta: number
  stock: number
  stockDeposito?: number
  alicuotaIVA: number
  unidadMedida: string
  familia?: string
  subfamilia?: string
}

export interface BusquedaArticulosParams {
  busqueda: string
  listaPrecios?: string
  page?: number
  limit?: number
  soloConStock?: boolean
}

export interface BusquedaArticulosResponse {
  articulos: ArticuloBusqueda[]
  total: number
}

// ==================== CLIENTES ====================

export interface ClienteInfo {
  codCliente: string
  razonSocial: string
  cuit?: string
  condicionIva?: string
  direccion?: string
  localidad?: string
  provincia?: string
  codigoPostal?: string
  telefono?: string
  email?: string
  tipoCliente: TipoCliente
}

export interface ClienteOcasionalData {
  tipoDocumento: string
  numeroDocumento: string
  razonSocial: string
  condicionIva: string
  direccion: string
  localidad: string
  provinciaId: number
  codigoPostal: string
  telefono?: string
  email?: string
  // Dirección de entrega
  direccionEntrega?: string
  localidadEntrega?: string
  provinciaEntregaId?: number
  codigoPostalEntrega?: string
  coordenadas?: {
    lat: number
    lng: number
  }
  // Percepciones
  percepciones?: PercepcionCliente[]
  retenciones?: RetencionCliente[]
}

export interface ClienteOcasionalResponse {
  id: number
  codigo: string
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion: string
  localidad: string
  provincia: string
  codigoPostal: string
}

// ==================== BLOQUEOS ====================

export interface BloqueoResponse {
  exito: boolean
  bloqueadoPor?: number
  bloqueadoPorNombre?: string
  bloqueadoHasta?: string
  mensaje?: string
}

// ==================== VERSIONES ====================

export interface VersionCotizacion {
  id: number
  cotizacionId: number
  numeroVersion: number
  fechaCreacion: string
  creadoPor: number
  creadoPorNombre: string
  razonCambio?: string
  esVersionActual: boolean
  datosSnapshot: CotizacionResponse
}

export interface CombinarVersionesParams {
  cotizacionId: number
  versionesIds: number[]
  razonCombinacion?: string
}

// ==================== PERCEPCIONES ====================

export interface Percepcion {
  id: number
  codigo: string
  descripcion: string
  jurisdiccion: string
  alicuota: number
  esProvincial: boolean
}

export interface PercepcionCliente {
  percepcionId: number
  codigo: string
  descripcion: string
  alicuota: number
  activa: boolean
}

export interface RetencionCliente {
  retencionId: number
  codigo: string
  descripcion: string
  alicuota: number
  activa: boolean
}

export interface CalculoPercepcionesResponse {
  percepciones: {
    codigo: string
    descripcion: string
    base: number
    alicuota: number
    monto: number
  }[]
  totalPercepciones: number
}

// ==================== TANGO ====================

export interface PedidoTangoData {
  cotizacionId: number
  fechaEntrega?: string
  observaciones?: string
  depositoId?: number
}

export interface PedidoTangoResponse {
  exito: boolean
  numeroPedido?: string
  mensaje?: string
  errores?: string[]
}

// ==================== PDF ====================

export interface GenerarPdfParams {
  cotizacionId: number
  incluirPrecios?: boolean
  incluirObservaciones?: boolean
  formato?: 'A4' | 'Carta'
}

// ==================== MAESTROS ====================

export interface Provincia {
  id: number
  codigo: string
  nombre: string
}

export interface TipoDocumento {
  id: number
  codigo: string
  descripcion: string
}

export interface CondicionIva {
  id: number
  codigo: string
  descripcion: string
}

export interface CondicionVenta {
  id: number
  codigo: string
  descripcion: string
  diasCredito?: number
}

export interface ListaPrecios {
  id: number
  codigo: string
  descripcion: string
  moneda: Moneda
  activa: boolean
}

export interface Transporte {
  id: number
  codigo: string
  descripcion: string
  activo: boolean
}

export interface Vendedor {
  id: number
  codigo: string
  nombre: string
  email?: string
  activo: boolean
}

export interface Talonario {
  id: number
  codigo: string
  descripcion: string
  tipo: string
  activo: boolean
}

export interface Deposito {
  id: number
  codigo: string
  descripcion: string
  activo: boolean
}

// ==================== ERROR ====================

export interface ServiceError {
  message: string
  code?: string
  status?: number
  details?: Record<string, unknown>
}
