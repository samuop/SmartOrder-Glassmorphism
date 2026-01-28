import { HttpClient } from '../lib/http';
import Cookies from 'js-cookie';
import {
  CotizacionData,
  CotizacionResponse,
  FiltrosCotizacion,
  ListaCotizacionesResponse,
  ArticuloData,
  ArticuloResponse,
  BloqueoResponse,
  VersionCotizacion,
  CombinarVersionesParams,
  ClienteOcasionalData,
  ClienteOcasionalResponse,
  Provincia,
  Percepcion,
  CalculoPercepcionesResponse,
  CondicionVenta,
  ListaPrecios,
  TipoDocumento,
  Transporte,
  Deposito,
  Talonario,
  CondicionIva,
  BusquedaArticulosParams,
  BusquedaArticulosResponse,
  PedidoTangoData,
  PedidoTangoResponse,
  GenerarPdfParams
} from './cotizador.types';
import { ENDPOINTS } from '../api/endpoints';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class CotizadorService {
  private http: HttpClient;

  constructor() {
    this.http = new HttpClient({
      baseURL: API_BASE_URL,
    });
  }

  // ==================== COTIZACIONES ====================

  async crearCotizacion(data: CotizacionData): Promise<CotizacionResponse> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<CotizacionResponse>('POST', ENDPOINTS.COTIZACIONES, {
      creadoPor: usuarioId,
      origenVenta: data.origenVenta || 'Presencial',
      talonario: data.talonario,
      talonarioFactura: data.talonarioFactura,
      tipo: data.tipo,
      fechaVigencia: data.fechaVigencia,
      codCliente: data.codCliente,
      nombreCliente: data.nombreCliente,
      tipoCliente: data.tipoCliente,
      condicionVenta: data.condicionVenta,
      codVendedor: data.codVendedor,
      listaPrecios: data.listaPrecios,
      codTransporte: data.codTransporte,
      bonificacionGeneral: data.bonificacionGeneral || 0,
      moneda: data.moneda || 'ARS',
      observaciones: data.observaciones,
      notasInternas: data.notasInternas,
      esPrivada: data.esPrivada,
    });
    return response.data;
  }

  async obtenerCotizacion(id: number): Promise<CotizacionResponse> {
    const timestamp = new Date().getTime();
    const usuarioActual = Cookies.get('COD_VENDED');
    const response = await this.http.request<CotizacionResponse>('GET', ENDPOINTS.COTIZACION_BY_ID(id), null, {
      params: { usuarioActual, _t: timestamp },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
    return response.data;
  }

  async listarCotizaciones(filtros: FiltrosCotizacion = {}): Promise<ListaCotizacionesResponse> {
    const usuarioActual = Cookies.get('COD_VENDED');
    const params: Record<string, any> = { ...filtros };
    if (usuarioActual) params.usuarioActual = usuarioActual;

    const response = await this.http.request<ListaCotizacionesResponse>('GET', ENDPOINTS.COTIZACIONES, null, {
      params
    });
    return response.data;
  }

  async actualizarCotizacion(id: number, data: Partial<CotizacionData>): Promise<CotizacionResponse> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<CotizacionResponse>('PATCH', ENDPOINTS.COTIZACION_BY_ID(id), {
      ...data,
      modificadoPor: usuarioId,
    }, {
      timeout: 15000
    });
    return response.data;
  }

  async eliminarCotizacion(id: number, hardDelete = false): Promise<{ success: boolean; message: string }> {
    const response = await this.http.request<any>('DELETE', ENDPOINTS.COTIZACION_BY_ID(id), null, {
      params: hardDelete ? { hard: 'true' } : {}
    });
    return response.data;
  }

  async duplicarCotizacion(id: number): Promise<CotizacionResponse> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<CotizacionResponse>('POST', ENDPOINTS.DUPLICAR_COTIZACION(id), {
      usuarioId
    });
    return response.data;
  }

  // ==================== ARTÍCULOS ====================

  async agregarArticulo(cotizacionId: number, articulo: any): Promise<ArticuloResponse> {
    const response = await this.http.request<ArticuloResponse>('POST', ENDPOINTS.ARTICULOS(cotizacionId), {
      codArticulo: articulo.codArticulo,
      cantidad: parseFloat(articulo.cantidad) || 1,
      descuento: parseFloat(articulo.descuento) || 0,
      descripcion: articulo.descripcion,
      precioUnitarioSinImp: articulo.precioUnitarioSinImp,
      ivaPorcentaje: articulo.ivaPorcentaje,
      orden: articulo.orden,
      metadata: articulo.metadata,
    });
    return response.data;
  }

  async actualizarArticulo(cotizacionId: number, articuloId: number, data: any): Promise<ArticuloResponse> {
    const response = await this.http.request<ArticuloResponse>('PATCH', ENDPOINTS.ARTICULO_BY_ID(cotizacionId, articuloId), data);
    return response.data;
  }

  async reorderArticulos(cotizacionId: number, articulos: any[]): Promise<any> {
    const response = await this.http.request<any>('POST', ENDPOINTS.REORDER_ARTICULOS(cotizacionId), { articulos });
    return response.data;
  }

  async eliminarArticulo(cotizacionId: number, articuloId: number): Promise<any> {
    const response = await this.http.request<any>('DELETE', ENDPOINTS.ARTICULO_BY_ID(cotizacionId, articuloId));
    return response.data;
  }

  // ==================== BLOQUEOS ====================

  async adquirirBloqueo(cotizacionId: number): Promise<BloqueoResponse> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<BloqueoResponse>('POST', ENDPOINTS.LOCK(cotizacionId), { usuarioId });
    return response.data;
  }

  async liberarBloqueo(cotizacionId: number): Promise<any> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<any>('DELETE', ENDPOINTS.LOCK(cotizacionId), { usuarioId });
    return response.data;
  }

  async verificarBloqueo(cotizacionId: number): Promise<BloqueoResponse> {
    const response = await this.http.request<BloqueoResponse>('GET', ENDPOINTS.LOCK(cotizacionId));
    return response.data;
  }

  async renovarBloqueo(cotizacionId: number): Promise<BloqueoResponse> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<BloqueoResponse>('PUT', ENDPOINTS.LOCK(cotizacionId), { usuarioId });
    return response.data;
  }

  // ==================== AUTOSAVE ====================

  async guardarAutosave(cotizacionId: number, usuarioId: number, articulos: any[]): Promise<any> {
    try {
      const response = await this.http.request<any>('POST', ENDPOINTS.AUTOSAVE(cotizacionId), { usuarioId, articulos });
      return response.data;
    } catch (error) {
      console.error('Error al guardar autosave:', error);
      return null;
    }
  }

  async obtenerAutosave(cotizacionId: number): Promise<any> {
    try {
      const response = await this.http.request<any>('GET', ENDPOINTS.AUTOSAVE(cotizacionId));
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async eliminarAutosave(cotizacionId: number): Promise<any> {
    try {
      const response = await this.http.request<any>('DELETE', ENDPOINTS.AUTOSAVE(cotizacionId));
      return response.data;
    } catch (error) {
      console.error('Error al eliminar autosave:', error);
      return null;
    }
  }

  // ==================== BÚSQUEDA DE ARTÍCULOS ====================

  async buscarArticulos(codigo: string): Promise<any[]> {
    const response = await this.http.request<any[]>('GET', ENDPOINTS.SEARCH_ARTICULOS, null, {
      params: { code: codigo }
    });
    return response.data;
  }

  // ==================== CLIENTES OCASIONALES ====================

  async crearClienteOcasional(datos: ClienteOcasionalData): Promise<ClienteOcasionalResponse> {
    const response = await this.http.request<ClienteOcasionalResponse>('POST', ENDPOINTS.CLIENTE_OCASIONAL, datos);
    return response.data;
  }

  async actualizarClienteOcasional(codigo: string, datos: Partial<ClienteOcasionalData>): Promise<ClienteOcasionalResponse> {
    const response = await this.http.request<ClienteOcasionalResponse>('PUT', ENDPOINTS.CLIENTE_OCASIONAL_BY_CODE(codigo), datos);
    return response.data;
  }

  async buscarClientePorCuit(cuit: string): Promise<ClienteOcasionalResponse | null> {
    const response = await this.http.request<ClienteOcasionalResponse | null>('GET', ENDPOINTS.SEARCH_CLIENTE_OCASIONAL, null, {
      params: { cuit }
    });
    return response.data;
  }

  async buscarClientePorCodigo(codigo: string): Promise<ClienteOcasionalResponse | null> {
    const response = await this.http.request<ClienteOcasionalResponse | null>('GET', ENDPOINTS.SEARCH_CLIENTE_OCASIONAL, null, {
      params: { codigo }
    });
    return response.data;
  }

  async buscarClientesOcasionales(termino: string, limit = 20): Promise<ClienteOcasionalResponse[]> {
    const response = await this.http.request<ClienteOcasionalResponse[]>('GET', ENDPOINTS.CLIENTE_OCASIONAL, null, {
      params: { q: termino, limit }
    });
    return response.data;
  }

  async sincronizarClienteDesdeTango(clienteTango: any): Promise<any> {
    const datosParaCRM = {
      razonSocial: clienteTango.RAZON_SOCI,
      dniCuit: clienteTango.DNI_CUIT,
      tipoDoc: clienteTango.TIPO_DOC || 80,
      domicilio: clienteTango.DOMICILIO || null,
      localidad: clienteTango.LOCALIDAD || null,
      codProvincia: clienteTango.COD_PROVIN || null,
      email: clienteTango.E_MAIL || null,
      telefono: clienteTango.TELEFONO_1 || null,
      categoriaIva: this._mapearCondicionIVA(clienteTango.COD_IMPUES || clienteTango.DESCRIPCIO),
    };

    const response = await this.crearClienteOcasional(datosParaCRM as any);
    return response;
  }

  private _mapearCondicionIVA(codigoODescripcion: any): string {
    if (!codigoODescripcion) return 'CF';
    const texto = String(codigoODescripcion).toUpperCase();
    const mapeo: Record<string, string> = {
      'RI': 'RI', 'RESPONSABLE INSCRIPTO': 'RI', 'RESPONSABLE INSCRITO': 'RI',
      'CF': 'CF', 'CONSUMIDOR FINAL': 'CF',
      'EX': 'EX', 'EXENTO': 'EX',
      'MO': 'MO', 'MONOTRIBUTO': 'MO',
      'NI': 'NI', 'NO INSCRIPTO': 'NI',
      'NC': 'NC', 'NO CATEGORIZADO': 'NC',
    };
    for (const [clave, valor] of Object.entries(mapeo)) {
      if (texto.includes(clave)) return valor;
    }
    return 'CF';
  }

  // ==================== PROVINCIAS ====================

  async obtenerProvincias(): Promise<Provincia[]> {
    const response = await this.http.request<Provincia[]>('GET', ENDPOINTS.PROVINCIAS);
    return response.data;
  }

  // ==================== PERCEPCIONES ====================

  async obtenerPercepcionesDisponibles(tipoImpuesto: string | null = null, codProvincia: string | null = null): Promise<Percepcion[]> {
    const params: Record<string, any> = {};
    if (tipoImpuesto) params.tipoImpuesto = tipoImpuesto;
    if (codProvincia) params.codProvincia = codProvincia;
    const response = await this.http.request<Percepcion[]>('GET', ENDPOINTS.PERCEPCIONES_DISPONIBLES, null, { params });
    return response.data;
  }

  async obtenerAlicuotasPercepcion(idPercepcion: number): Promise<any[]> {
    const response = await this.http.request<any[]>('GET', ENDPOINTS.PERCEPCIONES_BY_ID(idPercepcion));
    return response.data;
  }

  async obtenerPercepcionesAplicables(datosCliente: any): Promise<Percepcion[]> {
    const response = await this.http.request<Percepcion[]>('POST', ENDPOINTS.PERCEPCIONES_APLICABLES, datosCliente);
    return response.data;
  }

  async calcularPercepciones(cliente: any, totalNeto: number, totalIva = 0, totalOtrosConceptos = 0): Promise<CalculoPercepcionesResponse> {
    const response = await this.http.request<CalculoPercepcionesResponse>('POST', ENDPOINTS.CALCULAR_PERCEPCIONES, {
      cliente, totalNeto, totalIva, totalOtrosConceptos
    });
    return response.data;
  }

  async obtenerPercepcionesCliente(codCliente: string, tipo = 'O'): Promise<Percepcion[]> {
    const url = tipo === 'H'
      ? ENDPOINTS.PERCEPCIONES_CLIENTE_HABITUAL(codCliente)
      : ENDPOINTS.PERCEPCIONES_CLIENTE(codCliente);
    const response = await this.http.request<Percepcion[]>('GET', url, null, {
      params: tipo !== 'H' ? { tipo } : {}
    });
    return response.data;
  }

  async crearPercepcionCliente(codCliente: string, percepcion: any): Promise<any> {
    const response = await this.http.request<any>('POST', ENDPOINTS.PERCEPCIONES_CLIENTE(codCliente), percepcion);
    return response.data;
  }

  async actualizarPercepcionCliente(codCliente: string, percepcionId: number, datos: any): Promise<any> {
    const response = await this.http.request<any>('PUT', ENDPOINTS.PERCEPCION_BY_ID(codCliente, percepcionId), datos);
    return response.data;
  }

  async eliminarPercepcionCliente(codCliente: string, percepcionId: number): Promise<any> {
    const response = await this.http.request<any>('DELETE', ENDPOINTS.PERCEPCION_BY_ID(codCliente, percepcionId));
    return response.data;
  }

  async reemplazarPercepcionesCliente(codCliente: string, percepciones: any[]): Promise<any> {
    const response = await this.http.request<any>('PUT', ENDPOINTS.REEMPLAZAR_PERCEPCIONES(codCliente), { percepciones });
    return response.data;
  }

  async buscarProvinciaPorCodigo(codigo: string): Promise<Provincia> {
    const response = await this.http.request<Provincia>('GET', ENDPOINTS.PROVINCIA_BY_CODE(codigo));
    return response.data;
  }

  // ==================== VERSIONES ====================

  async crearVersion(cotizacionId: number, razonCambio: string, actualizarPrecios = false): Promise<VersionCotizacion> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<VersionCotizacion>('POST', ENDPOINTS.CREATE_VERSION(cotizacionId), {
      razonCambio, usuarioId, actualizarPrecios
    });
    return response.data;
  }

  async obtenerPreciosActuales(cotizacionId: number): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.PRECIOS_ACTUALES(cotizacionId));
    return response.data;
  }

  async obtenerVersiones(cotizacionId: number): Promise<VersionCotizacion[]> {
    const response = await this.http.request<VersionCotizacion[]>('GET', ENDPOINTS.VERSIONS(cotizacionId));
    return response.data;
  }

  async restaurarVersion(cotizacionId: number, versionNumero: number, razonRestauracion: string, actualizarPrecios = false): Promise<CotizacionResponse> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<CotizacionResponse>('POST', ENDPOINTS.RESTAURAR_VERSION(cotizacionId), {
      versionNumero, usuarioId, razonRestauracion, actualizarPrecios
    });
    return response.data;
  }

  async analizarVersionesParaCombinar(cotizacionId: number, versionA: number, versionB: number): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.ANALIZAR_VERSIONES(cotizacionId), null, {
      params: { versionA, versionB }
    });
    return response.data;
  }

  async combinarVersiones(cotizacionId: number, datosCombinacion: any): Promise<CotizacionResponse> {
    const usuarioId = parseInt(Cookies.get('COD_VENDED') || '1');
    const response = await this.http.request<CotizacionResponse>('POST', ENDPOINTS.COMBINAR_VERSIONES(cotizacionId), {
      ...datosCombinacion, usuarioId
    });
    return response.data;
  }

  // ==================== INTEGRACIÓN TANGO ====================

  async crearPedidoDesdeCotizacion(cotizacionId: number): Promise<any> {
    const response = await this.http.request<any>('POST', ENDPOINTS.PEDIDOS_DESDE_COTIZACION(cotizacionId), {}, {
      timeout: 60000
    });
    return response.data;
  }

  async obtenerHistorialPedidos(cotizacionId: number): Promise<any> {
    const timestamp = new Date().getTime();
    const response = await this.http.request<any>('GET', ENDPOINTS.PEDIDOS_HISTORIAL_BY_COTIZACION_ID(cotizacionId), null, {
      params: { _t: timestamp },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    return response.data;
  }

  async obtenerHistorialPorNroCotizacion(nroCotizacion: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.PEDIDOS_HISTORIAL_BY_NRO(nroCotizacion));
    return response.data;
  }

  async buscarPedidoPorNumero(nroPedido: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.PEDIDO_HISTORIAL_BY_NRO_PEDIDO(nroPedido));
    return response.data;
  }

  async obtenerDetallesPedidoTango(nroPedido: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.DETALLES_TANGO(nroPedido));
    return response.data;
  }

  // ==================== PDF ====================

  async generarPdf(cotizacionId: number, opciones: any = {}): Promise<any> {
    const response = await this.http.request<any>('POST', ENDPOINTS.GENERAR_PDF(cotizacionId), {
      mostrarConIVA: opciones.mostrarConIVA !== undefined ? opciones.mostrarConIVA : true,
      aplicarDescuento: opciones.aplicarDescuento !== undefined ? opciones.aplicarDescuento : true
    }, {
      params: { regenerar: 'true' }
    });
    return response.data;
  }

  getPdfUrl(cotizacionId: number): string {
    return ENDPOINTS.PDF(cotizacionId);
  }

  getPdfVersionUrl(cotizacionId: number, version: number): string {
    return ENDPOINTS.PDF_VERSION(cotizacionId, version);
  }

  async descargarPdfActual(cotizacionId: number): Promise<void> {
    const response = await fetch(ENDPOINTS.PDF(cotizacionId));
    const blob = await response.blob();
    this._downloadBlob(blob, response.headers.get('content-disposition') || 'cotizacion.pdf');
  }

  async descargarPdfVersion(cotizacionId: number, version: number, mostrarConIVA = true, aplicarDescuento = true, regenerar = false): Promise<boolean> {
    const params = new URLSearchParams({
      mostrarConIVA: String(mostrarConIVA),
      aplicarDescuento: String(aplicarDescuento),
      regenerar: String(regenerar)
    });
    const response = await fetch(`${ENDPOINTS.PDF_VERSION(cotizacionId, version)}?${params.toString()}`);
    const blob = await response.blob();
    this._downloadBlob(blob, response.headers.get('content-disposition') || `cotizacion_${cotizacionId}_v${version}.pdf`);
    return true;
  }

  private _downloadBlob(blob: Blob, contentDisposition: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.body.appendChild(document.createElement('a'));
    link.href = url;

    let fileName = 'archivo.pdf';
    const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (fileNameMatch && fileNameMatch[1]) {
      fileName = fileNameMatch[1].replace(/['"]/g, '').replace(/_+$/, '').trim();
      if (!fileName.endsWith('.pdf')) fileName += '.pdf';
    }

    link.setAttribute('download', fileName);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  // ==================== MAESTROS TANGO ====================

  async obtenerCondicionesVenta(): Promise<CondicionVenta[]> {
    const response = await this.http.request<CondicionVenta[]>('GET', ENDPOINTS.TANGO_CONDICIONES_VENTA);
    return response.data;
  }

  async obtenerListasPrecios(): Promise<ListaPrecios[]> {
    const response = await this.http.request<ListaPrecios[]>('GET', ENDPOINTS.TANGO_LISTAS_PRECIOS);
    return response.data;
  }

  async obtenerTiposDocumento(): Promise<TipoDocumento[]> {
    const response = await this.http.request<TipoDocumento[]>('GET', ENDPOINTS.TANGO_TIPOS_DOCUMENTO);
    return response.data;
  }

  async obtenerTransportistas(): Promise<Transporte[]> {
    const response = await this.http.request<Transporte[]>('GET', ENDPOINTS.TANGO_TRANSPORTISTAS);
    return response.data;
  }

  async obtenerDepositos(): Promise<Deposito[]> {
    const response = await this.http.request<Deposito[]>('GET', ENDPOINTS.TANGO_DEPOSITOS);
    return response.data;
  }

  async obtenerTalonariosPedidos(): Promise<Talonario[]> {
    const response = await this.http.request<Talonario[]>('GET', ENDPOINTS.TANGO_TALONARIOS_PEDIDOS);
    return response.data;
  }

  async obtenerTalonariosFacturas(): Promise<Talonario[]> {
    const response = await this.http.request<Talonario[]>('GET', ENDPOINTS.TANGO_TALONARIOS_FACTURAS);
    return response.data;
  }

  async obtenerDetallesDepositosCotizacion(nroCotizacion: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.DEPOSITO_DETALLES_COTIZACION, null, {
      params: { nroCotizacion, _t: Date.now() }
    });
    return response.data;
  }

  async obtenerDetallesPedidoDeposito(idPed: number, dpto: string): Promise<any> {
    try {
      const response = await this.http.request<any>('GET', ENDPOINTS.DEPOSITO_DETALLES_ARTICULOS, null, {
        params: { idPed, dpto, _t: Date.now() }
      });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async obtenerRelacionesPedidosFacturasRemitos(nrosPedidos: string[]): Promise<any[]> {
    const response = await this.http.request<any[]>('POST', ENDPOINTS.RELACIONES_COMPROBANTES, { nrosPedidos });
    return response.data;
  }

  async obtenerDetallesFactura(nroFactura: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.FACTURA_DETALLES(nroFactura));
    return response.data;
  }

  async obtenerDetallesRemito(nroRemito: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.REMITO_DETALLES(nroRemito));
    return response.data;
  }

  // ==================== PRIVACIDAD ====================

  async obtenerMisPermisosPrivacidad(usuario: string | null = null, codVendedor: string | null = null): Promise<any> {
    try {
      const params: any = {};
      if (usuario) params.usuario = usuario;
      if (codVendedor) params.codVendedor = codVendedor;
      const response = await this.http.request<any>('GET', ENDPOINTS.MIS_PERMISOS, null, { params });
      return response.data;
    } catch (error) {
      return { success: true, data: { puedeCrearPrivadas: false, puedeVerTodasPrivadas: false } };
    }
  }

  // ... (otros métodos de privacidad)

  // ==================== CLIENTES HABITUALES ====================

  async obtenerClienteHabitual(codigoCliente: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.CLIENTE_HABITUAL(codigoCliente));
    return response.data;
  }

  async obtenerEstadoCuentaCliente(codigoCliente: string): Promise<any> {
    const response = await this.http.request<any>('GET', ENDPOINTS.ESTADO_CUENTA_CLIENTE(codigoCliente));
    return response.data;
  }

  // ==================== UTILIDADES ====================

  private _extraerCodigo(valor: any): string | null {
    if (!valor) return null;
    const valorStr = String(valor).trim();
    return valorStr.includes(' - ') ? valorStr.split(' - ')[0].trim() : valorStr;
  }

  transformarCotizacionParaBackend(cotizacion: any): CotizacionData {
    return {
      titulo: cotizacion.titulo || null,
      talonario: cotizacion.talonario ? String(cotizacion.talonario) : cotizacion.talonario,
      talonarioFactura: cotizacion.talonarioFactura ? String(cotizacion.talonarioFactura) : cotizacion.talonarioFactura,
      tipo: cotizacion.tipo,
      fechaVigencia: this._parseDate(cotizacion.fechaVigencia || cotizacion.vigencia),
      codCliente: cotizacion.codigoCliente,
      nombreCliente: cotizacion.cliente,
      tipoCliente: cotizacion.tipoCliente || 'H',
      condicionVenta: this._extraerCodigo(cotizacion.condicion),
      codVendedor: cotizacion.codigoVendedor,
      listaPrecios: this._extraerCodigo(cotizacion.listaPrecios),
      codTransporte: cotizacion.codigoTransporte || "1",
      bonificacionGeneral: parseFloat(cotizacion.bonificacionGeneral ?? cotizacion.bonificacion ?? 0),
      moneda: this._transformarMoneda(cotizacion.moneda),
      observaciones: cotizacion.observaciones,
      origenVenta: cotizacion.origenVenta || 'Presencial',
      leyenda2: cotizacion.leyendas?.leyenda2 || null,
      leyenda3: cotizacion.leyendas?.leyenda3 || null,
      leyenda4: cotizacion.leyendas?.leyenda4 || null,
      leyenda5: cotizacion.leyendas?.leyenda5 || null,
      esPrivada: cotizacion.esPrivada === true,
      creadoPor: parseInt(Cookies.get('COD_VENDED') || '1'),
    };
  }

  private _parseDate(dateString: string): string | null {
    if (!dateString) return null;
    if (dateString.includes('T') || dateString.includes('-')) {
      const date = new Date(dateString);
      return !isNaN(date.getTime()) ? date.toISOString() : null;
    }
    const [day, month, year] = dateString.split('/');
    if (day && month && year) return new Date(parseInt(year), parseInt(month) - 1, parseInt(day)).toISOString();
    return null;
  }

  private _transformarMoneda(monedaFrontend: string): any {
    const mapeo: any = { 'C Corriente': 'ARS', 'Dolar': 'USD', 'Euro': 'EUR' };
    return mapeo[monedaFrontend] || 'ARS';
  }

  // (Agregar más transformadores si es necesario)
}

const cotizadorService = new CotizadorService();
export default cotizadorService;
