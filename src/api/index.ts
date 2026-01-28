/**
 * API - Funciones de API heredadas del proyecto CRM
 *
 * Este archivo contiene stubs para las funciones que el Cotizador
 * importaba del proyecto CRM original.
 *
 * TODO: Implementar estas funciones según las necesidades del nuevo proyecto
 */

import { http } from '@/lib/http'
import { ENDPOINTS } from './endpoints'

// Tipos
export interface Vendedor {
  id: number
  codigo: string
  nombre: string
  email?: string
  activo: boolean
}

export interface ClienteBusqueda {
  id: number
  codigo: string
  razonSocial: string
  cuit: string
  direccion?: string
  localidad?: string
  provincia?: string
}

// ...

/**
 * Obtener lista de vendedores
 * @returns Lista de vendedores activos
 */
export async function getVendedores(): Promise<Vendedor[]> {
  try {
    const response = await http.get<Vendedor[]>(ENDPOINTS.VENDEDORES)
    return response.data
  } catch (error) {
    console.error('Error al obtener vendedores:', error)
    // Retornar array vacío como fallback
    return []
  }
}

/**
 * Buscar clientes por término de búsqueda
 * @param searchTerm - Término de búsqueda (nombre, código, CUIT)
 * @returns Lista de clientes que coinciden
 */
export async function SearchCLI(searchTerm: string): Promise<ClienteBusqueda[]> {
  try {
    const response = await http.get<ClienteBusqueda[]>(ENDPOINTS.CLIENTES_BUSCAR, {
      params: { q: searchTerm },
    })
    return response.data
  } catch (error) {
    console.error('Error al buscar clientes:', error)
    return []
  }
}

// Re-exportar para compatibilidad con imports existentes
export default {
  getVendedores,
  SearchCLI,
}
