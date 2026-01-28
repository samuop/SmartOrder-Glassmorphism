/**
 * Servicios - Punto de entrada
 *
 * Este archivo exporta todos los servicios disponibles con sus tipos.
 * El cotizadorService se importa desde el archivo JS existente mientras
 * se migra gradualmente a TypeScript.
 */

// Re-exportar tipos
export * from './cotizador.types'

// Importar el servicio TS
import cotizadorService from './cotizadorService'

// Importar tipos para type casting
import type {
  CotizacionData,
  CotizacionResponse,
  FiltrosCotizacion,
  ListaCotizacionesResponse,
  ArticuloData,
  ArticuloResponse,
  ArticuloBusqueda,
  BusquedaArticulosParams,
  BusquedaArticulosResponse,
  BloqueoResponse,
  VersionCotizacion,
  CombinarVersionesParams,
  Percepcion,
  CalculoPercepcionesResponse,
  ClienteOcasionalData,
  ClienteOcasionalResponse,
  PedidoTangoData,
  PedidoTangoResponse,
  GenerarPdfParams,
  Provincia,
  TipoDocumento,
  CondicionIva,
  CondicionVenta,
  ListaPrecios,
  Transporte,
  Vendedor,
  Talonario,
  Deposito,
} from './cotizador.types'

/**
 * Interfaz tipada del servicio de cotizador
 *
 * Esta interfaz define los tipos de todas las funciones del servicio.
 * El servicio real viene del archivo JS, pero esta interfaz proporciona
 * autocompletado y verificación de tipos.
 */
export interface ICotizadorService {
  // Cotizaciones
  crearCotizacion(data: CotizacionData): Promise<CotizacionResponse>
  obtenerCotizacion(id: number): Promise<CotizacionResponse>
  listarCotizaciones(filtros?: FiltrosCotizacion): Promise<ListaCotizacionesResponse>
  actualizarCotizacion(id: number, data: Partial<CotizacionData>): Promise<CotizacionResponse>
  eliminarCotizacion(id: number, hardDelete?: boolean): Promise<{ exito: boolean; mensaje: string }>
  duplicarCotizacion(id: number): Promise<CotizacionResponse>

  // Artículos
  agregarArticulo(cotizacionId: number, articulo: ArticuloData): Promise<ArticuloResponse>
  actualizarArticulo(articuloId: number, data: Partial<ArticuloData>): Promise<ArticuloResponse>
  eliminarArticulo(articuloId: number): Promise<{ exito: boolean }>
  reordenarArticulos(cotizacionId: number, ordenIds: number[]): Promise<{ exito: boolean }>
  actualizarArticulosBatch(cotizacionId: number, articulos: ArticuloData[]): Promise<ArticuloResponse[]>

  // Bloqueos
  adquirirBloqueo(cotizacionId: number, usuarioId: number): Promise<BloqueoResponse>
  renovarBloqueo(cotizacionId: number, usuarioId: number): Promise<BloqueoResponse>
  liberarBloqueo(cotizacionId: number, usuarioId: number): Promise<BloqueoResponse>
  verificarBloqueo(cotizacionId: number): Promise<BloqueoResponse>

  // Autosave
  autoGuardarCotizacion(cotizacionId: number, data: Partial<CotizacionData>, articulos: ArticuloData[]): Promise<{ exito: boolean }>

  // Búsqueda de artículos
  buscarArticulos(params: BusquedaArticulosParams): Promise<BusquedaArticulosResponse>

  // Clientes ocasionales
  crearClienteOcasional(data: ClienteOcasionalData): Promise<ClienteOcasionalResponse>
  obtenerClienteOcasional(id: number): Promise<ClienteOcasionalResponse>
  actualizarClienteOcasional(id: number, data: Partial<ClienteOcasionalData>): Promise<ClienteOcasionalResponse>
  vincularClienteOcasionalACotizacion(cotizacionId: number, clienteOcasionalId: number): Promise<{ exito: boolean }>

  // Provincias
  obtenerProvincias(): Promise<Provincia[]>

  // Percepciones
  obtenerPercepciones(): Promise<Percepcion[]>
  obtenerPercepcionesPorProvincia(provinciaId: number): Promise<Percepcion[]>
  calcularPercepciones(clienteId: number, subtotal: number, percepciones: number[]): Promise<CalculoPercepcionesResponse>
  guardarPercepcionesCliente(clienteId: number, percepciones: number[]): Promise<{ exito: boolean }>
  obtenerPercepcionesCliente(clienteId: number): Promise<Percepcion[]>

  // Versiones
  crearVersion(cotizacionId: number, razonCambio?: string): Promise<VersionCotizacion>
  obtenerVersiones(cotizacionId: number): Promise<VersionCotizacion[]>
  restaurarVersion(cotizacionId: number, versionId: number): Promise<CotizacionResponse>
  combinarVersiones(params: CombinarVersionesParams): Promise<CotizacionResponse>
  compararVersiones(versionId1: number, versionId2: number): Promise<{ diferencias: unknown[] }>

  // Tango
  crearPedidoTango(data: PedidoTangoData): Promise<PedidoTangoResponse>
  verificarStockTango(articulos: { codigo: string; cantidad: number }[]): Promise<{ disponible: boolean; detalles: unknown[] }>
  obtenerDepositosTango(): Promise<Deposito[]>

  // PDF
  generarPdf(params: GenerarPdfParams): Promise<Blob>
  descargarPdf(cotizacionId: number): Promise<void>
  enviarPdfPorEmail(cotizacionId: number, email: string): Promise<{ exito: boolean }>

  // Maestros
  obtenerTiposDocumento(): Promise<TipoDocumento[]>
  obtenerCondicionesIva(): Promise<CondicionIva[]>
  obtenerCondicionesVenta(): Promise<CondicionVenta[]>
  obtenerListasPrecios(): Promise<ListaPrecios[]>
  obtenerTransportes(): Promise<Transporte[]>
  obtenerVendedores(): Promise<Vendedor[]>
  obtenerTalonarios(tipo?: string): Promise<Talonario[]>

  // Utilidades
  transformarCotizacionParaBackend(cotizacion: unknown): CotizacionData
  transformarCotizacionParaFrontend(response: unknown): CotizacionResponse
  transformarArticuloParaFrontend(articulo: unknown): ArticuloResponse
}

export { cotizadorService }
export default cotizadorService
