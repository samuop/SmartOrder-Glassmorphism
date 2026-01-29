# SmartOrder-Glassmorphism - Contexto del Proyecto

Este archivo proporciona contexto general sobre el proyecto SmartOrder-Glassmorphism para Claude Code.

## Resumen del Proyecto

**SmartOrder-Glassmorphism** es una aplicación web moderna para gestión de cotizaciones comerciales, construida con React + TypeScript + Chakra UI, con un diseño glassmorphism distintivo basado en Vision UI.

### Tecnologías Principales

- **Frontend**: React 18.3, TypeScript 5.4
- **UI Framework**: Chakra UI 2.8 + Vision UI (sistema de diseño personalizado)
- **Routing**: React Router DOM 6.24
- **Estado**: Context API + useReducer (sin Redux/Zustand)
- **HTTP**: HttpClient custom (fetch wrapper, sin axios)
- **Build**: Vite 5.2
- **Estilo**: Glassmorphism + Dark/Light mode

### Arquitectura General

El proyecto sigue el paradigma **"UI Shell & Feature Modules"**:

```
App (main.tsx)
  ↓
AdminLayout (Shell: Sidebar + Navbar persistentes)
  ↓
Feature Modules (lazy loaded)
  └── Cotizador (feature principal)
      ├── Context (estado)
      ├── Hooks (lógica)
      ├── Components (UI)
      ├── Services (API)
      └── Domain (lógica pura)
```

### Feature Principal: Cotizador

El módulo de cotizaciones es el núcleo del sistema:

- **Gestión completa**: Crear, editar, duplicar, eliminar cotizaciones
- **Artículos**: Búsqueda, agregado, edición, cálculo de totales
- **Clientes**: Habituales y ocasionales, con percepciones fiscales
- **Versiones**: Historial completo con restauración y combinación
- **Bloqueos**: Prevención de edición concurrente
- **AutoSave**: Guardado automático resiliente
- **Integración Tango**: Sincronización con ERP externo
- **PDF**: Generación y descarga de cotizaciones

## Convenciones de Código

### Estructura de Carpetas

```
src/
├── api/              # Endpoints y configuración
├── components/       # Componentes reutilizables globales
├── hooks/            # Hooks globales
├── layouts/          # Layouts (Admin, Auth, RTL)
├── lib/              # HttpClient y utilidades
├── services/         # Servicios de API + tipos
├── theme/            # Sistema de diseño Chakra UI
├── types/            # Tipos TypeScript globales
├── views/            # Páginas/Features
│   └── Cotizador/   # Feature module principal
└── main.tsx          # Entry point
```

### Naming Conventions

| Tipo | Formato | Ejemplo |
|------|---------|---------|
| Componentes | PascalCase | `CotizadorHeader.tsx` |
| Hooks | camelCase con prefijo `use` | `useCotizacion()` |
| Servicios | camelCase con sufijo `Service` | `cotizadorService` |
| Tipos | PascalCase | `CotizacionData` |
| Interfaces | Prefijo `I` | `ICotizadorService` |
| Constantes | UPPER_SNAKE_CASE | `API_BASE_URL` |

### Path Aliases (tsconfig.json)

```
@ → ./src
@components → ./src/components
@views → ./src/views
@hooks → ./src/hooks
@services → ./src/services
@theme → ./src/theme
@types → ./src/types
```

## Sistema de Diseño

### Vision UI sobre Chakra UI

El proyecto usa **Vision UI**, una capa de diseño sobre Chakra UI con:

- **Glassmorphism**: `backdropFilter: blur(120px)` en cards/modales
- **Gradientes**: Botones y fondos con gradientes lineales
- **Dark Mode**: Navy oscuro (navy.800) en dark, blanco en light
- **Border Radius**: 15-20px (redondeado moderno)
- **Transiciones**: 0.25s cubic-bezier

### Colores Principales

```typescript
// Brand (púrpura)
brand.50 → brand.900

// Navy (dark mode)
navy.700, navy.800, navy.900

// Acentos
cyan.500, green.500, pink.500, teal.500
```

### Pattern Glassmorphism

```typescript
<Box
  bg="linear-gradient(127.09deg, rgba(6, 11, 40, 0.94)...)"
  backdropFilter="blur(120px)"
  border="2px solid"
  borderColor="rgba(255, 255, 255, 0.125)"
  borderRadius="20px"
>
  {/* Contenido */}
</Box>
```

### Dark/Light Mode

Usar `useColorModeValue` en todos los componentes:

```typescript
const bg = useColorModeValue('white', 'navy.800')
const textColor = useColorModeValue('gray.700', 'white')
```

## Flujo de Trabajo

### 1. Crear Componentes

Para crear nuevos componentes, sigue estos pasos:

1. Definir tipos en `*.types.ts`
2. Crear componente con props tipadas
3. Usar `useColorModeValue` para dark/light mode
4. Aplicar estilos glassmorphism si corresponde
5. Exportar desde index del feature

**Consulta la skill**: `/smartorder-components`

### 2. Formularios

Para crear formularios:

1. Estructura modular (index, components, hooks, utils)
2. Hook principal del form (`useXxxForm`)
3. Sub-componentes por sección
4. Validaciones en `utils/validaciones.js`
5. Integración con servicios

**Consulta la skill**: `/smartorder-forms`

### 3. API y Servicios

Para trabajar con API:

1. Agregar endpoint en `endpoints.ts`
2. Crear/actualizar servicio
3. Definir tipos en `*.types.ts`
4. Implementar transformadores (backend ↔ frontend)
5. Manejo de errores robusto

**Consulta la skill**: `/smartorder-api`

### 4. Tipos TypeScript

Para definir tipos:

1. Ubicación: `src/services/*.types.ts`
2. Naming: `<Entidad>Data`, `<Entidad>Response`, `<Componente>Props`
3. Interfaces para servicios: `I<Servicio>Service`
4. Exportar desde `src/types/index.ts`

**Consulta la skill**: `/smartorder-types`

## Patrones Clave

### Pattern: Provider + Hooks

```typescript
// 1. Context
FeatureProvider
  ├── FeatureStateContext
  └── FeatureDispatchContext

// 2. Hooks
useFeatureState()      // Estado read-only
useFeatureDispatch()   // Dispatcher
useFeatureUI()         // Estado + acciones comunes
useFeatureData()       // Carga de datos
useFeatureActions()    // Operaciones CRUD
```

### Pattern: Feature Module

```
Feature/
├── index.tsx          # Lazy loading + Provider
├── FeatureCore.tsx    # Orquestador
├── context/           # Estado UI
├── hooks/             # Lógica de negocio
├── components/        # Sub-componentes
└── utils/             # Utilidades puras
```

### Pattern: Servicio + Transformadores

```typescript
class XxxService {
  async obtener(id) {
    const response = await httpClient.get(endpoint)
    return this.transformarParaFrontend(response)
  }

  async crear(data) {
    const dataBackend = this.transformarParaBackend(data)
    const response = await httpClient.post(endpoint, dataBackend)
    return this.transformarParaFrontend(response)
  }

  private transformarParaFrontend(data) { /* ... */ }
  private transformarParaBackend(data) { /* ... */ }
}
```

## Integración con Backend

### API Base URL

```typescript
// src/api/endpoints.ts
const BASE_URL = 'http://localhost:3000'
```

### HttpClient

Wrapper sobre fetch nativo:

```typescript
import { httpClient } from '@/lib/http'

// GET
await httpClient.get('/endpoint', { params: { ... } })

// POST
await httpClient.post('/endpoint', body)

// PATCH
await httpClient.patch('/endpoint', partialData)

// DELETE
await httpClient.delete('/endpoint')
```

### Formato de Datos

- **Backend**: snake_case (ej: `cod_cliente`, `fecha_creacion`)
- **Frontend**: camelCase (ej: `codCliente`, `fechaCreacion`)
- **Transformadores**: Conversión automática en servicios

## Estado de Migración TypeScript

**Fase actual**: Fase 1 - Estructural

### Archivos ya en TypeScript
- `src/main.tsx` ✅
- `src/App.tsx` ✅
- `src/views/Cotizador/index.tsx` ✅ (wrapper)
- `src/services/cotizadorService.ts` ✅
- `src/services/cotizador.types.ts` ✅ (378 líneas)
- `src/lib/http.ts` ✅

### Archivos pendientes de migración
- `src/views/Cotizador/CotizadorCore.tsx` (aún .js)
- Muchos componentes en `src/views/Cotizador/components/` (mix .js/.tsx)
- Utilidades en `src/views/Cotizador/utils/` (aún .js)

### Estrategia de Migración
1. Crear wrappers TypeScript para código JS existente
2. Nuevas features 100% en TypeScript
3. Migración incremental sin regresiones
4. Mantener compatibilidad durante transición

## Testing

**Estado actual**: Sin tests configurados

### Próximos pasos
- Agregar Vitest + React Testing Library
- Tests unitarios para hooks
- Tests de integración para servicios
- Tests de componentes

## Scripts Disponibles

```bash
npm run dev          # Dev server (puerto 3000)
npm run build        # Build producción
npm run build:check  # Type check + build
npm run preview      # Preview build
npm run type-check   # Verificar tipos TypeScript
```

## Recursos de Referencia

### Documentación de Arquitectura
- [frontend_architecture.md](docs/frontend_architecture.md) - Arquitectura técnica detallada

### Archivos Clave
- [CotizadorService](src/services/cotizadorService.ts) - 643 líneas, 86+ métodos
- [cotizador.types.ts](src/services/cotizador.types.ts) - 378 líneas de tipos
- [HttpClient](src/lib/http.ts) - Cliente HTTP custom
- [Endpoints](src/api/endpoints.ts) - 86 endpoints centralizados
- [Theme](src/theme/themeAdmin.tsx) - Sistema de diseño completo

### Features de Referencia
- [Cotizador](src/views/Cotizador/) - Feature module completo
- [FormularioClienteOcasional](src/views/Cotizador/components/FormularioClienteOcasional/) - Patrón de formularios
- [CotizadorContext](src/views/Cotizador/context/CotizadorContext.tsx) - Patrón de Context

## Skills Disponibles

Este proyecto tiene **4 skills personalizadas** configuradas:

1. **`/smartorder-components`** - Arquitectura de componentes, hooks, contexts, Chakra UI + glassmorphism
2. **`/smartorder-forms`** - Patrones de formularios, validaciones, hooks de form management
3. **`/smartorder-api`** - Servicios, HttpClient, endpoints, transformadores
4. **`/smartorder-types`** - Sistema de tipos TypeScript, convenciones, migraciones JS→TSX

**Cómo usar las skills**: Claude las cargará automáticamente cuando sean relevantes, o puedes invocarlas directamente con `/nombre-skill`.

## Notas Importantes

### Principios de Diseño
- **Separación de Concerns**: Components → Hooks → Services → API
- **Type-First**: Definir tipos antes de implementar
- **Glassmorphism**: Efecto de cristal en cards/modales
- **Dark Mode**: Siempre usar `useColorModeValue`
- **Transformadores**: Backend ≠ Frontend (conversión en servicios)

### No Usar
- ❌ Redux/Zustand (usar Context API)
- ❌ Axios (usar HttpClient custom)
- ❌ CSS modules (usar Chakra UI)
- ❌ Inline styles directos (usar props de Chakra)
- ❌ Imports absolutos sin alias (usar @components, @services, etc.)

### Siempre Usar
- ✅ TypeScript para código nuevo
- ✅ Chakra UI para todos los componentes
- ✅ useColorModeValue para colores
- ✅ Path aliases (@components, @services, etc.)
- ✅ Transformadores en servicios
- ✅ Validaciones en utils/ (funciones puras)
- ✅ JSDoc para funciones complejas

---

**Última actualización**: 2026-01-29

Este archivo se actualiza automáticamente cuando la arquitectura del proyecto evoluciona.
