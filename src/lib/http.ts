/**
 * HTTP Client - Wrapper tipado sobre fetch nativo
 * Reemplazo de axios con mejor tipado y sin dependencias externas
 */

import Cookies from 'js-cookie'

// ============================================
// TIPOS
// ============================================

export interface HttpConfig {
  baseURL?: string
  timeout?: number
  headers?: Record<string, string>
}

export interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>
  timeout?: number
}

export interface HttpResponse<T = unknown> {
  data: T
  status: number
  statusText: string
  headers: Headers
  ok: boolean
}

export class HttpError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: unknown,
    public response: Response
  ) {
    super(`HTTP Error ${status}: ${statusText}`)
    this.name = 'HttpError'
  }
}

// ============================================
// HTTP CLIENT CLASS
// ============================================

export class HttpClient {
  private baseURL: string
  private defaultTimeout: number
  private defaultHeaders: Record<string, string>

  constructor(config: HttpConfig = {}) {
    this.baseURL = config.baseURL || ''
    this.defaultTimeout = config.timeout || 30000
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  // Construir URL con query params
  private buildURL(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(endpoint, this.baseURL || window.location.origin)

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    return url.toString()
  }

  // Obtener headers con auth
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders }

    // Agregar token de autenticación si existe
    const token = Cookies.get('auth_token') || Cookies.get('token')
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    return headers
  }

  // Request genérico
  async request<T = unknown>(
    method: string,
    endpoint: string,
    data?: unknown,
    config: RequestConfig = {}
  ): Promise<HttpResponse<T>> {
    const { params, timeout = this.defaultTimeout, headers: customHeaders, ...fetchConfig } = config

    const url = this.buildURL(endpoint, params)
    const headers = this.getHeaders(customHeaders as Record<string, string>)

    // Preparar body - solo para métodos que lo permiten y si hay datos
    let body: string | FormData | undefined
    const methodsWithBody = ['POST', 'PUT', 'PATCH', 'DELETE']
    if (data !== undefined && data !== null && methodsWithBody.includes(method.toUpperCase())) {
      if (data instanceof FormData) {
        body = data
        // No enviar Content-Type para FormData (el browser lo pone automáticamente)
        delete headers['Content-Type']
      } else {
        body = JSON.stringify(data)
      }
    }

    // Crear AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
        ...fetchConfig,
      })

      clearTimeout(timeoutId)

      // Parsear respuesta
      let responseData: T
      const contentType = response.headers.get('Content-Type') || ''

      if (contentType.includes('application/json')) {
        responseData = await response.json()
      } else if (contentType.includes('text/')) {
        responseData = (await response.text()) as T
      } else if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
        responseData = (await response.blob()) as T
      } else {
        // Intentar JSON primero, fallback a text
        const text = await response.text()
        try {
          responseData = JSON.parse(text)
        } catch {
          responseData = text as T
        }
      }

      // Manejar errores HTTP
      if (!response.ok) {
        throw new HttpError(response.status, response.statusText, responseData, response)
      }

      return {
        data: responseData,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        ok: response.ok,
      }
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof HttpError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${timeout}ms`)
        }
        throw error
      }

      throw new Error('Unknown error occurred')
    }
  }

  // Métodos HTTP
  async get<T = unknown>(endpoint: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('GET', endpoint, undefined, config)
  }

  async post<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('POST', endpoint, data, config)
  }

  async put<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', endpoint, data, config)
  }

  async patch<T = unknown>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('PATCH', endpoint, data, config)
  }

  async delete<T = unknown>(endpoint: string, config?: RequestConfig): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', endpoint, undefined, config)
  }

  // Método para descargar archivos
  async download(endpoint: string, filename: string, config?: RequestConfig): Promise<void> {
    const response = await this.request<Blob>('GET', endpoint, undefined, {
      ...config,
      headers: {
        ...config?.headers,
        Accept: 'application/pdf,application/octet-stream,*/*',
      },
    })

    // Crear link de descarga
    const url = window.URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  // Método para subir archivos
  async upload<T = unknown>(
    endpoint: string,
    file: File | File[],
    fieldName = 'file',
    additionalData?: Record<string, string>,
    config?: RequestConfig
  ): Promise<HttpResponse<T>> {
    const formData = new FormData()

    if (Array.isArray(file)) {
      file.forEach((f, i) => formData.append(`${fieldName}[${i}]`, f))
    } else {
      formData.append(fieldName, file)
    }

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    return this.request<T>('POST', endpoint, formData, config)
  }
}

// ============================================
// INSTANCIA POR DEFECTO
// ============================================

// Crear instancia con la URL base del backend
// TODO: Configurar desde variables de entorno
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export const http = new HttpClient({
  baseURL: API_BASE_URL,
  timeout: 30000,
})

// Export default para compatibilidad
export default http
