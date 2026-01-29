---
name: smartorder-types
description: Sistema de tipos TypeScript para SmartOrder. Usa esta skill cuando definas tipos, interfaces, migraciones JS→TSX, o trabajes con cotizador.types.ts.
allowed-tools: Read, Grep, Edit, Write
---

# SmartOrder - Sistema de Tipos TypeScript

Esta skill define las convenciones de tipos TypeScript para SmartOrder-Glassmorphism.

## Configuración TypeScript

El proyecto usa TypeScript con configuración **flexible**:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "strict": false,        // Permite tipos implícitos
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Ubicación de Tipos

### 1. Tipos de Dominio
**Ubicación**: `src/types/`

```
src/types/
├── index.ts           # Re-exports de todos los tipos
└── cotizador.ts       # Re-export desde services
```

### 2. Tipos de Servicios
**Ubicación**: `src/services/`

- `cotizadorService.ts` - 643 líneas
- `cotizador.types.ts` - **378 líneas** (fuente principal de tipos)

**Referencia principal**: [cotizador.types.ts](src/services/cotizador.types.ts)

## Convenciones de Naming

### Tipos vs Interfaces

```typescript
// ✅ Usar 'type' para datos de dominio
type CotizacionData = {
  id: string
  numero: number
  fecha: Date
  cliente: ClienteData
}

// ✅ Usar 'interface' para contratos (servicios, props)
interface ICotizadorService {
  crearCotizacion(data: CotizacionCreateData): Promise<CotizacionResponse>
  obtenerCotizacion(id: string): Promise<CotizacionResponse>
}

// ✅ Props de componentes
interface ComponenteProps {
  data: CotizacionData
  onSave?: (data: CotizacionData) => void
}
```

### Naming Patterns

| Tipo | Pattern | Ejemplo |
|------|---------|---------|
| Datos de dominio | `<Entidad>Data` | `CotizacionData`, `ArticuloData` |
| Respuesta API | `<Entidad>Response` | `CotizacionResponse` |
| Request API | `<Entidad>CreateData` / `<Entidad>UpdateData` | `CotizacionCreateData` |
| Props | `<Componente>Props` | `CotizadorHeaderProps` |
| State | `<Feature>State` | `CotizadorState` |
| Interfaces de servicio | `I<Servicio>Service` | `ICotizadorService` |
| Enums | `UPPER_SNAKE_CASE` | `TIPO_DOCUMENTO` |

## Estructura de Tipos del Cotizador

### Tipos Core (src/services/cotizador.types.ts)

```typescript
// ============= COTIZACIÓN =============
export interface CotizacionResponse {
  idCot: number
  nroCot: number
  fechaCotizacion: string
  cliente: ClienteEnCotizacion
  articulos: ArticuloEnCotizacion[]
  totales: TotalesCotizacion
  metadatos: MetadatosCotizacion
  estadoActual?: EstadoCotizacion
}

export interface CotizacionCreateData {
  codCliente: string
  razonSocial: string
  direccion: string
  // ... más campos
}

// ============= ARTÍCULO =============
export interface ArticuloEnCotizacion {
  idArticulo: number
  codArticulo: string
  descripcion: string
  cantidad: number
  precioUnitario: number
  descuento: number
  precioFinal: number
  subtotal: number
}

export interface ArticuloCreateData {
  codArticulo: string
  cantidad: number
  descuento?: number
}

// ============= CLIENTE =============
export interface ClienteEnCotizacion {
  codCliente: string
  razonSocial: string
  direccion: string
  cuit: string
  condicionIva: string
  email?: string
  telefono?: string
}

export interface ClienteOcasionalData {
  razonSocial: string
  cuit: string
  direccion: string
  localidad: string
  provincia: string
  codigoPostal: string
  telefono?: string
  email?: string
  condicionIva: string
  tipoDocumento: string
}

// ============= PERCEPCIONES =============
export interface Percepcion {
  id?: number
  tipoImpuesto: 'IVA' | 'IIBB' | 'Municipal'
  codProvincia: string
  alicuota: number
  baseImponible: number
  monto: number
  descripcion: string
}

export interface PercepcionCliente {
  id: number
  codCliente: string
  tipoImpuesto: 'IVA' | 'IIBB'
  codProvincia: string
  alicuota: number
  activa: boolean
  fechaDesde: string
  fechaHasta?: string
}

// ============= TOTALES =============
export interface TotalesCotizacion {
  subtotal: number
  descuentoGlobal: number
  subtotalConDescuento: number
  iva: number
  percepciones: number
  total: number
}

// ============= VERSIONES =============
export interface VersionCotizacion {
  version: number
  fechaCreacion: string
  usuarioCreador: string
  razonCambio: string
  preciosActualizados: boolean
  snapshot: CotizacionResponse
}

// ============= BLOQUEOS =============
export interface BloqueoInfo {
  bloqueado: boolean
  usuarioBloqueador?: string
  fechaBloqueo?: string
  tiempoRestante?: number
}

// ============= FILTROS =============
export interface FiltrosCotizaciones {
  fechaDesde?: string
  fechaHasta?: string
  codCliente?: string
  codVendedor?: string
  estado?: 'activa' | 'anulada' | 'convertida'
  textoBusqueda?: string
  page?: number
  limit?: number
}
```

## Tipos para Componentes

### Props Tipadas

```typescript
// Componente con props obligatorias
interface CotizadorHeaderProps {
  cotizacion: CotizacionResponse
  onSave: () => Promise<void>
  onCancel: () => void
}

export function CotizadorHeader({
  cotizacion,
  onSave,
  onCancel
}: CotizadorHeaderProps) {
  // implementación
}

// Componente con props opcionales
interface ArticulosTableProps {
  articulos: ArticuloEnCotizacion[]
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
  isReadOnly?: boolean
}

export function ArticulosTable({
  articulos,
  onEdit,
  onDelete,
  isReadOnly = false
}: ArticulosTableProps) {
  // implementación
}
```

### Children Props

```typescript
interface CardProps {
  children: React.ReactNode
  title?: string
  bg?: string
}

// O más específico
interface LayoutProps {
  children: React.ReactElement | React.ReactElement[]
}
```

### Event Handlers

```typescript
interface FormProps {
  onSubmit: (data: FormData) => void
  onChange?: (field: string, value: any) => void
  onError?: (error: Error) => void
}

// Con tipos de eventos específicos
interface InputProps {
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}
```

## Tipos para Hooks

### Hook Return Types

```typescript
// Definir el retorno del hook
interface UseCotizacionReturn {
  cotizacion: CotizacionResponse | null
  isLoading: boolean
  error: Error | null
  crearNueva: () => Promise<void>
  guardar: () => Promise<void>
  cargar: (id: string) => Promise<void>
}

export function useCotizacion(): UseCotizacionReturn {
  // implementación
  return {
    cotizacion,
    isLoading,
    error,
    crearNueva,
    guardar,
    cargar
  }
}

// Usar el hook
const { cotizacion, guardar, isLoading } = useCotizacion()
```

### Hooks con Parámetros

```typescript
interface UseArticulosParams {
  cotizacionId: string
  autoSave?: boolean
}

export function useArticulos({
  cotizacionId,
  autoSave = true
}: UseArticulosParams) {
  // implementación
}
```

## Tipos para Contextos

```typescript
// Estado del context
interface CotizadorContextState {
  cotizacionId: string | null
  cotizacion: CotizacionResponse | null
  articulos: ArticuloEnCotizacion[]
  isLoading: boolean
  hasUnsavedChanges: boolean
}

// Acciones del context
interface CotizadorContextActions {
  cargarCotizacion: (id: string) => Promise<void>
  actualizarArticulo: (id: number, data: Partial<ArticuloEnCotizacion>) => void
  eliminarArticulo: (id: number) => void
  guardar: () => Promise<void>
}

// Context completo
interface CotizadorContextValue extends CotizadorContextState {
  actions: CotizadorContextActions
}

// Crear context
const CotizadorContext = createContext<CotizadorContextValue | undefined>(undefined)

// Hook para usar el context
export function useCotizador() {
  const context = useContext(CotizadorContext)
  if (!context) {
    throw new Error('useCotizador debe usarse dentro de CotizadorProvider')
  }
  return context
}
```

## Tipos para Reducers

```typescript
// Estado del reducer
interface CotizadorUIState {
  vistaActual: 'lista' | 'editar' | 'ver_versiones'
  loadError: string | null
  showIVA: boolean
  applyDiscount: boolean
  actualizarPrecios: boolean
  previsualizacionPrecios: any | null
  loadingPreview: boolean
}

// Acciones del reducer
type CotizadorUIAction =
  | { type: 'SET_VISTA'; payload: 'lista' | 'editar' | 'ver_versiones' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_IVA' }
  | { type: 'TOGGLE_DISCOUNT' }
  | { type: 'SET_PREVIEW'; payload: any }
  | { type: 'CLEAR_PREVIEW' }

// Reducer tipado
function cotizadorReducer(
  state: CotizadorUIState,
  action: CotizadorUIAction
): CotizadorUIState {
  switch (action.type) {
    case 'SET_VISTA':
      return { ...state, vistaActual: action.payload }
    case 'TOGGLE_IVA':
      return { ...state, showIVA: !state.showIVA }
    // ... más casos
    default:
      return state
  }
}
```

## Tipos Utilitarios de TypeScript

### Partial, Pick, Omit

```typescript
// Partial - todos los campos opcionales
type CotizacionUpdate = Partial<CotizacionCreateData>

// Pick - seleccionar campos específicos
type CotizacionResumen = Pick<
  CotizacionResponse,
  'idCot' | 'nroCot' | 'fechaCotizacion' | 'cliente'
>

// Omit - excluir campos
type CotizacionSinId = Omit<CotizacionResponse, 'idCot'>
```

### Record, Readonly

```typescript
// Record - objeto con claves conocidas
type ErroresFormulario = Record<string, string>

// Readonly - inmutable
type CotizacionReadonly = Readonly<CotizacionResponse>
```

### Union Types

```typescript
// Estados
type EstadoCotizacion = 'borrador' | 'activa' | 'anulada' | 'convertida'

// Tipos de documento
type TipoDocumento = 'DNI' | 'CUIT' | 'CUIL' | 'LE' | 'LC' | 'PAS'

// Condición IVA
type CondicionIVA = 'RI' | 'MT' | 'EX' | 'CF'
```

## Migración de JavaScript a TypeScript

### Estrategia de Migración

**Fase 1: Wrapper TypeScript** (actual)
```typescript
// src/views/Cotizador/index.tsx
import CotizadorCore from './CotizadorCore'  // Aún en JS

interface CotizadorV2Props {
  cotizacionId?: string
  modo?: 'crear' | 'editar' | 'ver'
}

export function CotizadorV2({ cotizacionId, modo }: CotizadorV2Props) {
  return <CotizadorCore cotizacionId={cotizacionId} modo={modo} />
}
```

**Fase 2: Migración Incremental**
1. Crear tipos en `.types.ts`
2. Renombrar `.js` → `.tsx`
3. Agregar props tipadas
4. Tipar hooks y funciones
5. Validar con `npm run type-check`

### Template de Migración

**Antes (JS):**
```javascript
// ArticuloRow.js
export function ArticuloRow({ articulo, onEdit, onDelete }) {
  const handleEdit = () => {
    onEdit(articulo.id)
  }

  return (
    <Tr>
      <Td>{articulo.descripcion}</Td>
      <Td isNumeric>{articulo.cantidad}</Td>
      <Td>
        <IconButton icon={<EditIcon />} onClick={handleEdit} />
      </Td>
    </Tr>
  )
}
```

**Después (TSX):**
```typescript
// ArticuloRow.tsx
import { Tr, Td, IconButton } from '@chakra-ui/react'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'
import type { ArticuloEnCotizacion } from '@services/cotizador.types'

interface ArticuloRowProps {
  articulo: ArticuloEnCotizacion
  onEdit?: (id: number) => void
  onDelete?: (id: number) => void
}

export function ArticuloRow({ articulo, onEdit, onDelete }: ArticuloRowProps) {
  const handleEdit = () => {
    onEdit?.(articulo.idArticulo)
  }

  const handleDelete = () => {
    onDelete?.(articulo.idArticulo)
  }

  return (
    <Tr>
      <Td>{articulo.descripcion}</Td>
      <Td isNumeric>{articulo.cantidad}</Td>
      <Td>
        <IconButton
          aria-label="Editar"
          icon={<EditIcon />}
          onClick={handleEdit}
          size="sm"
        />
        <IconButton
          aria-label="Eliminar"
          icon={<DeleteIcon />}
          onClick={handleDelete}
          size="sm"
          ml={2}
        />
      </Td>
    </Tr>
  )
}
```

## Generación de Tipos desde API

### Paso 1: Capturar Respuesta

```typescript
// 1. Hacer request en DevTools y copiar JSON response
// 2. Usar herramientas como quicktype.io o json2ts.com

// Ejemplo de respuesta API
const response = {
  "idCot": 123,
  "nroCot": 4567,
  "fechaCotizacion": "2024-01-15",
  "cliente": {
    "codCliente": "CLI001",
    "razonSocial": "Empresa S.A."
  }
}
```

### Paso 2: Generar Tipos

```typescript
// Resultado generado
export interface CotizacionResponse {
  idCot: number
  nroCot: number
  fechaCotizacion: string
  cliente: ClienteEnCotizacion
}

export interface ClienteEnCotizacion {
  codCliente: string
  razonSocial: string
}
```

### Paso 3: Refinar Tipos

```typescript
// Agregar opcionalidad
export interface CotizacionResponse {
  idCot: number
  nroCot: number
  fechaCotizacion: string
  cliente: ClienteEnCotizacion
  observaciones?: string  // Campo opcional
}

// Usar Date en lugar de string
export interface CotizacionData {
  idCot: number
  nroCot: number
  fechaCotizacion: Date  // Transformado desde string
  cliente: ClienteEnCotizacion
}

// Helper de transformación
export function transformarCotizacion(
  response: CotizacionResponse
): CotizacionData {
  return {
    ...response,
    fechaCotizacion: new Date(response.fechaCotizacion)
  }
}
```

## Type Guards

Para validar tipos en runtime:

```typescript
// Type guard
export function isCotizacionResponse(data: any): data is CotizacionResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    'idCot' in data &&
    'nroCot' in data &&
    'cliente' in data
  )
}

// Uso
const response = await fetch('/api/cotizaciones/123')
const data = await response.json()

if (isCotizacionResponse(data)) {
  // TypeScript sabe que data es CotizacionResponse
  console.log(data.idCot)
} else {
  throw new Error('Respuesta inválida')
}
```

## Tipos para Chakra UI

### useColorModeValue

```typescript
import { useColorModeValue } from '@chakra-ui/react'

function MiComponente() {
  const bg = useColorModeValue('white', 'navy.800')
  const textColor = useColorModeValue('gray.700', 'white')

  return <Box bg={bg} color={textColor}>Contenido</Box>
}
```

### Responsive Styles

```typescript
// Array notation
<Box w={['100%', '50%', '33%']} />

// Object notation
<Box w={{ base: '100%', md: '50%', lg: '33%' }} />
```

## Checklist para Definir Tipos

1. [ ] Identificar entidad de dominio
2. [ ] Definir tipo para respuesta API (`<Entidad>Response`)
3. [ ] Definir tipo para creación (`<Entidad>CreateData`)
4. [ ] Definir tipo para actualización (`<Entidad>UpdateData`)
5. [ ] Definir props del componente (`<Componente>Props`)
6. [ ] Agregar tipos opcionales con `?`
7. [ ] Usar union types para valores finitos
8. [ ] Documentar tipos complejos con JSDoc
9. [ ] Exportar desde `src/types/index.ts`
10. [ ] Verificar con `npm run type-check`

## Referencias

- [cotizador.types.ts](src/services/cotizador.types.ts) - 378 líneas de tipos
- [ICotizadorService](src/services/index.ts) - Interfaz del servicio
- [HttpClient](src/lib/http.ts) - Cliente HTTP tipado
