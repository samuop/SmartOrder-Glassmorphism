// ============================================
// TIPOS DEL COTIZADOR
// ============================================

// --- Cliente ---
export interface Cliente {
  id: number | null
  codigo: string
  razonSocial: string
  cuit: string
  condicionIva: string
  condicionIvaId: number | null
  email: string
  telefono: string
  direccion: string
  localidad: string
  provincia: string
  provinciaId: number | null
  codigoPostal: string
  observaciones: string
  tipo: 'habitual' | 'ocasional'
  // Campos adicionales para cliente ocasional
  tipoDocumento?: string
  tipoDocumentoId?: number
  numeroDocumento?: string
  // Dirección de entrega
  direccionEntrega?: DireccionEntrega
  // Percepciones y retenciones
  percepciones?: Percepcion[]
  retenciones?: Retencion[]
}

export interface DireccionEntrega {
  calle: string
  numero: string
  piso: string
  departamento: string
  localidad: string
  provincia: string
  provinciaId: number | null
  codigoPostal: string
  observaciones: string
  coordenadas?: {
    lat: number
    lng: number
  }
}

export interface Percepcion {
  id: number
  codigo: string
  descripcion: string
  alicuota: number
  jurisdiccion: string
  activa: boolean
}

export interface Retencion {
  id: number
  codigo: string
  descripcion: string
  alicuota: number
  activa: boolean
}

// --- Artículo ---
export interface Articulo {
  id: number | null
  lineaId: number | null // ID en la cotización
  codigo: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  precioUnitarioConIva: number
  descuento: number
  iva: number
  ivaId: number
  subtotal: number
  subtotalConIva: number
  stock: number
  unidadMedida: string
  observaciones: string
  // Flags internos para tracking de cambios
  _isNew?: boolean
  _isDeleted?: boolean
  _isModified?: boolean
  _originalData?: Partial<Articulo>
}

export interface ArticuloBusqueda {
  id: number
  codigo: string
  descripcion: string
  precioLista: number
  precioListaConIva: number
  stock: number
  iva: number
  ivaId: number
  unidadMedida: string
  familia: string
  subfamilia: string
}

// --- Cotización ---
export interface Cotizacion {
  id: number | null
  numero: string
  fecha: string
  fechaVencimiento: string
  estado: EstadoCotizacion
  cliente: Cliente
  articulos: Articulo[]
  subtotal: number
  descuentoGeneral: number
  descuentoMonto: number
  iva: number
  percepciones: number
  total: number
  observaciones: string
  observacionesInternas: string
  condicionesPago: string
  condicionesEntrega: string
  validezDias: number
  moneda: 'ARS' | 'USD'
  tipoCambio: number
  vendedorId: number | null
  vendedorNombre: string
  sucursalId: number | null
  sucursalNombre: string
  // Versiones
  version: number
  versionActiva: boolean
  // Timestamps
  createdAt: string
  updatedAt: string
  // Metadata
  bloqueadoPor: string | null
  bloqueadoHasta: string | null
  // Legacy compatibility
  N_COTIZ?: string
  nroCotizacion?: string
  VERSION?: number
}

export type EstadoCotizacion =
  | 'borrador'
  | 'pendiente'
  | 'enviada'
  | 'aprobada'
  | 'rechazada'
  | 'vencida'
  | 'convertida' // Convertida a pedido

// --- Versión de Cotización ---
export interface VersionCotizacion {
  id: number
  cotizacionId: number
  numeroVersion: number
  fechaCreacion: string
  creadoPor: number
  creadoPorNombre: string
  razonCambio?: string
  esVersionActual: boolean
  datosSnapshot: any // Usar any temporalmente para evitar cascada de errores de Cotizacion vs CotizacionResponse
  pedidosTango?: any[]
  pedidosDeposito?: any[]
}

// --- Bloqueo ---
export interface Bloqueo {
  cotizacionId: number
  usuarioId: number
  usuarioNombre: string
  fechaInicio: string
  fechaExpiracion: string
  activo: boolean
}

// --- Respuestas API ---
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// --- Filtros ---
export interface FiltrosCotizacion {
  busqueda?: string
  estado?: EstadoCotizacion | 'todos'
  fechaDesde?: string
  fechaHasta?: string
  clienteId?: number
  vendedorId?: number
  page?: number
  pageSize?: number
  orderBy?: string
  orderDir?: 'asc' | 'desc'
}

export interface FiltrosArticulo {
  busqueda?: string
  familiaId?: number
  subfamiliaId?: number
  soloConStock?: boolean
  page?: number
  pageSize?: number
}

// --- Maestros ---
export interface CondicionIva {
  id: number
  codigo: string
  descripcion: string
}

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

export interface Vendedor {
  id: number
  codigo: string
  nombre: string
  email: string
  activo: boolean
  // Legacy compatibility
  COD_VENDED?: string
  NOMBRES?: string
}

export interface Sucursal {
  id: number
  codigo: string
  nombre: string
  direccion: string
  activa: boolean
}

// --- UI State ---
export interface CotizadorUIState {
  vista: 'lista' | 'detalle' | 'edicion'
  showIVA: boolean
  applyDiscount: boolean
  actualizarPrecios: boolean
  previewPrecios: boolean
  loadingPreview: boolean
  razonCambio: string
  percepciones: Percepcion[]
  error: string | null
}

export type CotizadorUIAction =
  | { type: 'SET_VISTA'; payload: CotizadorUIState['vista'] }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_IVA' }
  | { type: 'TOGGLE_DISCOUNT' }
  | { type: 'SET_SHOW_IVA'; payload: boolean }
  | { type: 'SET_APPLY_DISCOUNT'; payload: boolean }
  | { type: 'SET_ACTUALIZAR_PRECIOS'; payload: boolean }
  | { type: 'SET_PREVIEW_PRECIOS'; payload: boolean }
  | { type: 'SET_LOADING_PREVIEW'; payload: boolean }
  | { type: 'SET_RAZON_CAMBIO'; payload: string }
  | { type: 'SET_PERCEPCIONES'; payload: Percepcion[] }
  | { type: 'RESET' }

// --- Configuración ---
export interface CotizadorConfig {
  apiBaseUrl: string
  autoSaveDelay: number // ms
  bloqueoRenewalInterval: number // ms
  bloqueoCheckInterval: number // ms
  defaultValidezDias: number
  defaultCondicionesPago: string
  defaultCondicionesEntrega: string
}

// --- Persistencia ---
export type PersistenceStrategy = 'localStorage' | 'url' | 'prop' | 'none'

export interface PersistenceConfig {
  strategy: PersistenceStrategy
  key?: string // Para localStorage
  paramName?: string // Para URL
}
