---
name: smartorder-api
description: Patrones de API y servicios para SmartOrder. Usa esta skill cuando trabajes con endpoints, HttpClient, servicios, o transformadores de datos.
allowed-tools: Read, Grep, Edit, Write
---

# SmartOrder - API & Servicios

Esta skill define los patrones para trabajar con APIs, servicios y comunicación con el backend en SmartOrder-Glassmorphism.

## Arquitectura de Capas

```
Componente React
    ↓
Hook personalizado (useCotizacion)
    ↓
Servicio (CotizadorService)
    ↓
HttpClient (fetch wrapper)
    ↓
Backend API
```

**Principio clave**: Los componentes NUNCA llaman directamente a HttpClient. Siempre usan servicios.

## HttpClient (src/lib/http.ts)

Wrapper tipado sobre `fetch` nativo sin dependencias externas.

### Características

- Timeout automático (30s por defecto)
- Headers de autenticación automáticos
- Manejo de query params
- Upload/download de archivos
- Gestión de errores centralizada
- Métodos: GET, POST, PUT, PATCH, DELETE

### Métodos Disponibles

```typescript
class HttpClient {
  // GET con query params
  async get<T>(url: string, options?: RequestOptions): Promise<T>

  // POST con body JSON
  async post<T>(url: string, body?: any, options?: RequestOptions): Promise<T>

  // PUT completo
  async put<T>(url: string, body?: any, options?: RequestOptions): Promise<T>

  // PATCH parcial
  async patch<T>(url: string, body?: any, options?: RequestOptions): Promise<T>

  // DELETE
  async delete<T>(url: string, options?: RequestOptions): Promise<T>

  // Upload archivo
  async upload<T>(url: string, formData: FormData, options?: RequestOptions): Promise<T>

  // Download archivo
  async download(url: string, filename?: string, options?: RequestOptions): Promise<void>
}
```

### Ejemplo de Uso Directo (NO RECOMENDADO)

```typescript
import { httpClient } from '@/lib/http'

// ❌ NO hacer esto en componentes
const response = await httpClient.get('/api/cotizaciones')

// ✅ Usar servicios en su lugar
const response = await cotizadorService.listarCotizaciones()
```

### Configuración de Headers

```typescript
// Headers automáticos
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${token}`  // Si existe
}

// Headers personalizados
await httpClient.get('/endpoint', {
  headers: {
    'X-Custom-Header': 'value'
  }
})
```

### Query Params

```typescript
// Opción 1: En la URL
await httpClient.get('/api/cotizaciones?page=1&limit=10')

// Opción 2: En options (recomendado)
await httpClient.get('/api/cotizaciones', {
  params: {
    page: 1,
    limit: 10,
    estado: 'activa'
  }
})
// Resultado: /api/cotizaciones?page=1&limit=10&estado=activa
```

### Manejo de Errores

```typescript
try {
  const data = await httpClient.get('/endpoint')
} catch (error) {
  if (error.response?.status === 404) {
    console.error('No encontrado')
  } else if (error.response?.status === 401) {
    console.error('No autorizado')
  } else {
    console.error('Error:', error.message)
  }
}
```

## Endpoints (src/api/endpoints.ts)

Centralización de todas las rutas de la API.

### Estructura

```typescript
const BASE_URL = 'http://localhost:3000'

export const ENDPOINTS = {
  // Cotizaciones
  cotizaciones: {
    base: '/Cotizador/cotizaciones',
    crear: '/Cotizador/cotizaciones',
    obtener: (id: string) => `/Cotizador/cotizaciones/${id}`,
    actualizar: (id: string) => `/Cotizador/cotizaciones/${id}`,
    eliminar: (id: string) => `/Cotizador/cotizaciones/${id}`,
    duplicar: (id: string) => `/Cotizador/cotizaciones/${id}/duplicar`,
  },

  // Artículos
  articulos: {
    buscar: '/Cotizador/articulos/buscar',
    agregar: (cotizId: string) => `/Cotizador/cotizaciones/${cotizId}/articulos`,
    actualizar: (cotizId: string, artId: number) =>
      `/Cotizador/cotizaciones/${cotizId}/articulos/${artId}`,
    eliminar: (cotizId: string, artId: number) =>
      `/Cotizador/cotizaciones/${cotizId}/articulos/${artId}`,
  },

  // Clientes
  clientes: {
    crear: '/Cotizador/clientes/ocasional',
    buscarPorCuit: (cuit: string) => `/Cotizador/clientes/cuit/${cuit}`,
    buscarPorCodigo: (codigo: string) => `/Cotizador/clientes/${codigo}`,
  },

  // Percepciones
  percepciones: {
    disponibles: '/Cotizador/percepciones/disponibles',
    cliente: (codCliente: string) => `/Cotizador/clientes/${codCliente}/percepciones`,
    calcular: '/Cotizador/percepciones/calcular',
  },
}

// Función helper para construir URL completa
export function buildUrl(path: string): string {
  return `${BASE_URL}${path}`
}
```

### Uso en Servicios

```typescript
import { ENDPOINTS, buildUrl } from '@/api/endpoints'

class CotizadorService {
  async obtenerCotizacion(id: string) {
    const url = ENDPOINTS.cotizaciones.obtener(id)
    return httpClient.get<CotizacionResponse>(url)
  }

  async buscarArticulos(codigo: string) {
    return httpClient.get(ENDPOINTS.articulos.buscar, {
      params: { codigo }
    })
  }
}
```

## Estructura de Servicios

### Clase de Servicio

**Ubicación**: `src/services/<entidad>Service.ts`

```typescript
import { httpClient } from '@/lib/http'
import { ENDPOINTS } from '@/api/endpoints'
import type {
  CotizacionResponse,
  CotizacionCreateData,
  CotizacionUpdateData,
  FiltrosCotizaciones
} from './cotizador.types'

class CotizadorService {
  // ============= CRUD BÁSICO =============

  /**
   * Crea una nueva cotización
   */
  async crearCotizacion(data: CotizacionCreateData): Promise<CotizacionResponse> {
    const dataTransformada = this.transformarParaBackend(data)
    const response = await httpClient.post<CotizacionResponse>(
      ENDPOINTS.cotizaciones.crear,
      dataTransformada
    )
    return this.transformarParaFrontend(response)
  }

  /**
   * Obtiene una cotización por ID
   */
  async obtenerCotizacion(id: string): Promise<CotizacionResponse> {
    const response = await httpClient.get<CotizacionResponse>(
      ENDPOINTS.cotizaciones.obtener(id)
    )
    return this.transformarParaFrontend(response)
  }

  /**
   * Lista cotizaciones con filtros
   */
  async listarCotizaciones(
    filtros?: FiltrosCotizaciones
  ): Promise<{ data: CotizacionResponse[]; total: number }> {
    const response = await httpClient.get(ENDPOINTS.cotizaciones.base, {
      params: filtros
    })

    return {
      data: response.data.map(c => this.transformarParaFrontend(c)),
      total: response.total
    }
  }

  /**
   * Actualiza una cotización
   */
  async actualizarCotizacion(
    id: string,
    data: CotizacionUpdateData
  ): Promise<CotizacionResponse> {
    const dataTransformada = this.transformarParaBackend(data)
    const response = await httpClient.patch<CotizacionResponse>(
      ENDPOINTS.cotizaciones.actualizar(id),
      dataTransformada
    )
    return this.transformarParaFrontend(response)
  }

  /**
   * Elimina una cotización
   */
  async eliminarCotizacion(id: string, hardDelete = false): Promise<void> {
    await httpClient.delete(ENDPOINTS.cotizaciones.eliminar(id), {
      params: { hard: hardDelete }
    })
  }

  // ============= TRANSFORMADORES =============

  /**
   * Transforma datos del frontend al formato del backend
   */
  private transformarParaBackend(data: any): any {
    return {
      cod_cliente: data.codCliente,
      razon_social: data.razonSocial,
      fecha_cotizacion: data.fechaCotizacion?.toISOString(),
      // ... más transformaciones
    }
  }

  /**
   * Transforma respuesta del backend al formato del frontend
   */
  private transformarParaFrontend(response: any): CotizacionResponse {
    return {
      idCot: response.id_cot,
      nroCot: response.nro_cot,
      fechaCotizacion: new Date(response.fecha_cotizacion),
      cliente: {
        codCliente: response.cliente.cod_cliente,
        razonSocial: response.cliente.razon_social,
        // ... más transformaciones
      },
      // ... más campos
    }
  }
}

// Exportar instancia singleton
export const cotizadorService = new CotizadorService()
export default cotizadorService
```

### Métodos de Servicio por Categoría

#### 1. CRUD Básico
```typescript
crearCotizacion(data)
obtenerCotizacion(id)
listarCotizaciones(filtros)
actualizarCotizacion(id, data)
eliminarCotizacion(id, hardDelete)
```

#### 2. Operaciones Específicas
```typescript
duplicarCotizacion(id)
buscarArticulos(codigo)
generarPdf(cotizacionId, opciones)
```

#### 3. Operaciones Relacionadas
```typescript
agregarArticulo(cotizacionId, articulo)
actualizarArticulo(cotizacionId, articuloId, data)
eliminarArticulo(cotizacionId, articuloId)
```

#### 4. Concurrencia
```typescript
adquirirBloqueo(cotizacionId)
renovarBloqueo(cotizacionId)
liberarBloqueo(cotizacionId)
```

#### 5. Versiones
```typescript
crearVersion(cotizacionId, razon)
obtenerVersiones(cotizacionId)
restaurarVersion(cotizacionId, version)
```

## Transformadores de Datos

Los transformadores convierten entre el formato del backend (snake_case, nombres de campos específicos) y el frontend (camelCase, nombres estandarizados).

### ¿Por qué Transformadores?

1. **Abstracción**: Componentes no necesitan conocer el formato del backend
2. **Migración**: Si cambia el backend, solo se modifica el transformador
3. **Consistencia**: Formato único en todo el frontend

### Patrón de Transformación

```typescript
class MiServicio {
  // Backend → Frontend
  private transformarParaFrontend(backendData: any): FrontendData {
    return {
      // Convertir snake_case a camelCase
      idEntidad: backendData.id_entidad,
      nombreCompleto: backendData.nombre_completo,

      // Convertir strings a Date
      fechaCreacion: new Date(backendData.fecha_creacion),

      // Transformar objetos anidados
      cliente: {
        codigo: backendData.cliente.cod_cliente,
        razon: backendData.cliente.razon_social
      },

      // Transformar arrays
      items: backendData.items.map(item => ({
        id: item.id_item,
        descripcion: item.desc
      }))
    }
  }

  // Frontend → Backend
  private transformarParaBackend(frontendData: FrontendData): any {
    return {
      // Convertir camelCase a snake_case
      id_entidad: frontendData.idEntidad,
      nombre_completo: frontendData.nombreCompleto,

      // Convertir Date a string ISO
      fecha_creacion: frontendData.fechaCreacion.toISOString(),

      // Transformar objetos anidados
      cliente: {
        cod_cliente: frontendData.cliente.codigo,
        razon_social: frontendData.cliente.razon
      },

      // Transformar arrays
      items: frontendData.items.map(item => ({
        id_item: item.id,
        desc: item.descripcion
      }))
    }
  }
}
```

### Helpers de Transformación

```typescript
// utils/transformadores.ts

/**
 * Convierte snake_case a camelCase
 */
export function snakeToCamel(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(snakeToCamel)
  }

  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    acc[camelKey] = snakeToCamel(obj[key])
    return acc
  }, {} as any)
}

/**
 * Convierte camelCase a snake_case
 */
export function camelToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(camelToSnake)
  }

  return Object.keys(obj).reduce((acc, key) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
    acc[snakeKey] = camelToSnake(obj[key])
    return acc
  }, {} as any)
}
```

## Manejo de Errores

### En Servicios

```typescript
class CotizadorService {
  async obtenerCotizacion(id: string): Promise<CotizacionResponse> {
    try {
      const response = await httpClient.get(ENDPOINTS.cotizaciones.obtener(id))
      return this.transformarParaFrontend(response)
    } catch (error) {
      // Enriquecer el error con contexto
      throw new Error(`Error al obtener cotización ${id}: ${error.message}`)
    }
  }
}
```

### En Hooks

```typescript
export function useCotizacion() {
  const [error, setError] = useState<Error | null>(null)
  const toast = useToast()

  const cargar = async (id: string) => {
    try {
      setError(null)
      const data = await cotizadorService.obtenerCotizacion(id)
      setCotizacion(data)
    } catch (err) {
      const error = err as Error
      setError(error)

      toast({
        title: 'Error al cargar cotización',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true
      })
    }
  }

  return { cargar, error }
}
```

### En Componentes

```typescript
export function MiComponente() {
  const { cargar, error } = useCotizacion()

  useEffect(() => {
    cargar('123')
  }, [])

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        <AlertTitle>Error!</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    )
  }

  return <div>Contenido</div>
}
```

## Paginación

### Request con Paginación

```typescript
interface FiltrosCotizaciones {
  page?: number
  limit?: number
  // ... otros filtros
}

async listarCotizaciones(filtros: FiltrosCotizaciones = {}) {
  const { page = 1, limit = 20, ...otrosFiltros } = filtros

  const response = await httpClient.get(ENDPOINTS.cotizaciones.base, {
    params: {
      page,
      limit,
      ...otrosFiltros
    }
  })

  return {
    data: response.data.map(this.transformarParaFrontend),
    total: response.total,
    page: response.page,
    totalPages: Math.ceil(response.total / limit)
  }
}
```

### Hook con Paginación

```typescript
export function usePaginacion<T>(
  fetchFn: (page: number, limit: number) => Promise<{ data: T[]; total: number }>
) {
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  const cargar = async () => {
    setIsLoading(true)
    try {
      const result = await fetchFn(page, limit)
      setData(result.data)
      setTotal(result.total)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [page])

  const nextPage = () => setPage(p => p + 1)
  const prevPage = () => setPage(p => Math.max(1, p - 1))
  const goToPage = (p: number) => setPage(p)

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    isLoading,
    nextPage,
    prevPage,
    goToPage,
    refetch: cargar
  }
}

// Uso
const { data, page, totalPages, nextPage, prevPage } = usePaginacion(
  (page, limit) => cotizadorService.listarCotizaciones({ page, limit })
)
```

## Caché y Optimización

### Cache Simple con useMemo

```typescript
export function useCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<CotizacionResponse[]>([])

  // Cache de búsqueda
  const buscar = useMemo(() => {
    return (termino: string) => {
      return cotizaciones.filter(c =>
        c.cliente.razonSocial.toLowerCase().includes(termino.toLowerCase())
      )
    }
  }, [cotizaciones])

  return { cotizaciones, buscar }
}
```

### Debounce en Búsquedas

```typescript
import { debounce } from 'lodash'

export function useBusqueda() {
  const [resultados, setResultados] = useState([])

  const buscar = useMemo(
    () =>
      debounce(async (termino: string) => {
        if (termino.length < 3) return

        const results = await cotizadorService.buscarArticulos(termino)
        setResultados(results)
      }, 300),
    []
  )

  useEffect(() => {
    return () => buscar.cancel()
  }, [])

  return { resultados, buscar }
}
```

## Upload de Archivos

```typescript
async uploadArchivo(file: File): Promise<{ url: string }> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('tipo', 'cotizacion')

  return httpClient.upload<{ url: string }>(
    ENDPOINTS.archivos.upload,
    formData
  )
}

// Uso en componente
const handleFileUpload = async (file: File) => {
  try {
    const result = await cotizadorService.uploadArchivo(file)
    console.log('Archivo subido:', result.url)
  } catch (error) {
    console.error('Error:', error)
  }
}
```

## Download de Archivos

```typescript
async descargarPdf(cotizacionId: string): Promise<void> {
  const filename = `cotizacion_${cotizacionId}.pdf`

  await httpClient.download(
    ENDPOINTS.cotizaciones.pdf(cotizacionId),
    filename
  )
}

// Uso
<Button onClick={() => cotizadorService.descargarPdf('123')}>
  Descargar PDF
</Button>
```

## Testing de Servicios

```typescript
// vitest
import { describe, it, expect, vi } from 'vitest'
import { httpClient } from '@/lib/http'
import cotizadorService from './cotizadorService'

// Mock del httpClient
vi.mock('@/lib/http', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}))

describe('CotizadorService', () => {
  it('debe obtener una cotización', async () => {
    const mockResponse = {
      id_cot: 123,
      nro_cot: 456
    }

    vi.mocked(httpClient.get).mockResolvedValue(mockResponse)

    const result = await cotizadorService.obtenerCotizacion('123')

    expect(result.idCot).toBe(123)
    expect(result.nroCot).toBe(456)
    expect(httpClient.get).toHaveBeenCalledWith('/Cotizador/cotizaciones/123')
  })
})
```

## Checklist para Crear un Nuevo Servicio

1. [ ] Definir tipos en `<servicio>.types.ts`
2. [ ] Agregar endpoints en `endpoints.ts`
3. [ ] Crear clase de servicio
4. [ ] Implementar métodos CRUD básicos
5. [ ] Agregar transformadores (backend ↔ frontend)
6. [ ] Implementar métodos específicos
7. [ ] Manejo de errores robusto
8. [ ] Exportar instancia singleton
9. [ ] Documentar métodos con JSDoc
10. [ ] Crear tests unitarios

## Referencias

- [HttpClient](src/lib/http.ts) - Cliente HTTP
- [Endpoints](src/api/endpoints.ts) - 86 endpoints definidos
- [CotizadorService](src/services/cotizadorService.ts) - 643 líneas
- [cotizador.types.ts](src/services/cotizador.types.ts) - 378 líneas de tipos
