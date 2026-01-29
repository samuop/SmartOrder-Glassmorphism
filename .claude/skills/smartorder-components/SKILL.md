---
name: smartorder-components
description: Arquitectura de componentes para SmartOrder. Usa esta skill cuando crees o refactorices componentes, hooks, contexts, o trabajes con Chakra UI + glassmorphism.
allowed-tools: Read, Grep, Edit, Write
---

# SmartOrder - Arquitectura de Componentes

Esta skill define la arquitectura y patrones para crear componentes en SmartOrder-Glassmorphism, siguiendo el paradigma **UI Shell & Feature Modules** con **Vision UI** sobre **Chakra UI**.

## Paradigma Arquitectónico

### UI Shell (Cáscara de Interfaz)

```
AdminLayout (Shell)
├── Sidebar (persistente)
├── Navbar (persistente)
└── MainPanel (dinámico)
    └── Feature Module (lazy loaded)
        ├── Context Provider
        ├── Custom Hooks
        └── Componentes
```

**Características del Shell:**
- Componentes persistentes (Sidebar, Navbar, Footer)
- Code splitting con React.lazy() y Suspense
- Gestión de rutas dinámica
- Optimizado para First Contentful Paint (FCP)

### Feature Modules (Módulos Verticales)

Cada feature es **desacoplado** y **autónomo**:

```
Feature/
├── index.tsx               # Punto de entrada (lazy loaded)
├── FeatureCore.tsx         # Componente principal
├── context/                # Estado del feature
│   ├── FeatureContext.tsx
│   └── featureReducer.tsx
├── hooks/                  # Lógica de negocio
│   ├── useFeatureData.tsx
│   └── useFeatureActions.tsx
├── components/             # Sub-componentes
│   ├── ComponenteA.tsx
│   └── ComponenteB.tsx
├── domain/                 # Lógica pura (sin React)
│   └── calculations.js
└── utils/                  # Utilidades
    └── helpers.js
```

**Ejemplo de referencia**: [Cotizador](src/views/Cotizador/)

## Arquitectura de Componentes

### 1. Punto de Entrada (index.tsx)

**Responsabilidad**: Lazy loading + props typing + provider setup

```typescript
import React, { Suspense } from 'react'
import { Box, Spinner, Center } from '@chakra-ui/react'
import { FeatureProvider } from './context/FeatureContext'

const FeatureCore = React.lazy(() => import('./FeatureCore'))

interface FeatureProps {
  id?: string
  modo?: 'crear' | 'editar' | 'ver'
  onClose?: () => void
}

export function Feature({ id, modo = 'crear', onClose }: FeatureProps) {
  return (
    <FeatureProvider>
      <Suspense
        fallback={
          <Center h="100vh">
            <Spinner size="xl" color="brand.500" />
          </Center>
        }
      >
        <FeatureCore id={id} modo={modo} onClose={onClose} />
      </Suspense>
    </FeatureProvider>
  )
}

export default Feature
```

### 2. Componente Core (FeatureCore.tsx)

**Responsabilidad**: Orquestación de sub-componentes + lógica de alto nivel

```typescript
import { Box, VStack } from '@chakra-ui/react'
import { useFeatureData } from './hooks/useFeatureData'
import { useFeatureActions } from './hooks/useFeatureActions'
import ComponenteA from './components/ComponenteA'
import ComponenteB from './components/ComponenteB'

interface FeatureCoreProps {
  id?: string
  modo: 'crear' | 'editar' | 'ver'
  onClose?: () => void
}

export function FeatureCore({ id, modo, onClose }: FeatureCoreProps) {
  const { data, isLoading, error } = useFeatureData(id)
  const { guardar, eliminar, actualizar } = useFeatureActions()

  if (isLoading) {
    return <LoadingState />
  }

  if (error) {
    return <ErrorState error={error} />
  }

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <ComponenteA
          data={data}
          onUpdate={actualizar}
          isReadOnly={modo === 'ver'}
        />

        <ComponenteB
          data={data}
          onSave={guardar}
          onCancel={onClose}
        />
      </VStack>
    </Box>
  )
}

export default FeatureCore
```

### 3. Sub-componentes

**Responsabilidad**: UI específica + lógica acotada

```typescript
import { Box, Heading, Text, useColorModeValue } from '@chakra-ui/react'
import type { FeatureData } from '@services/feature.types'

interface ComponenteAProps {
  data: FeatureData
  onUpdate: (data: Partial<FeatureData>) => void
  isReadOnly?: boolean
}

export function ComponenteA({ data, onUpdate, isReadOnly }: ComponenteAProps) {
  // Colores adaptativos dark/light mode
  const bg = useColorModeValue('white', 'navy.800')
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100')
  const textColor = useColorModeValue('gray.700', 'white')

  return (
    <Box
      bg={bg}
      borderRadius="20px"
      p={6}
      border="2px solid"
      borderColor={borderColor}
    >
      <Heading size="md" mb={4} color={textColor}>
        Título de la Sección
      </Heading>

      <Text color={textColor}>
        {data.descripcion}
      </Text>

      {!isReadOnly && (
        <Button
          mt={4}
          onClick={() => onUpdate({ /* cambios */ })}
        >
          Actualizar
        </Button>
      )}
    </Box>
  )
}

export default ComponenteA
```

## Gestión de Estado

### Pattern: Provider + Custom Hooks

#### 1. Context (FeatureContext.tsx)

```typescript
import { createContext, useContext, useReducer, ReactNode } from 'react'
import { featureReducer, initialState } from './featureReducer'
import type { FeatureState, FeatureAction } from './featureReducer'

// Contexto de estado (read-only)
const FeatureStateContext = createContext<FeatureState | undefined>(undefined)

// Contexto de dispatch
const FeatureDispatchContext = createContext<React.Dispatch<FeatureAction> | undefined>(undefined)

interface FeatureProviderProps {
  children: ReactNode
}

export function FeatureProvider({ children }: FeatureProviderProps) {
  const [state, dispatch] = useReducer(featureReducer, initialState)

  return (
    <FeatureStateContext.Provider value={state}>
      <FeatureDispatchContext.Provider value={dispatch}>
        {children}
      </FeatureDispatchContext.Provider>
    </FeatureStateContext.Provider>
  )
}

// Hook para acceder al estado
export function useFeatureState() {
  const context = useContext(FeatureStateContext)
  if (context === undefined) {
    throw new Error('useFeatureState debe usarse dentro de FeatureProvider')
  }
  return context
}

// Hook para acceder al dispatch
export function useFeatureDispatch() {
  const context = useContext(FeatureDispatchContext)
  if (context === undefined) {
    throw new Error('useFeatureDispatch debe usarse dentro de FeatureProvider')
  }
  return context
}

// Hook combinado (conveniencia)
export function useFeatureUI() {
  const state = useFeatureState()
  const dispatch = useFeatureDispatch()

  return {
    ...state,
    setVista: (vista: FeatureState['vistaActual']) =>
      dispatch({ type: 'SET_VISTA', payload: vista }),
    setError: (error: string | null) =>
      dispatch({ type: 'SET_ERROR', payload: error }),
    toggleShowDetails: () =>
      dispatch({ type: 'TOGGLE_DETAILS' }),
  }
}
```

#### 2. Reducer (featureReducer.tsx)

```typescript
export interface FeatureState {
  vistaActual: 'lista' | 'editar' | 'ver'
  loadError: string | null
  showDetails: boolean
  isLoading: boolean
}

export type FeatureAction =
  | { type: 'SET_VISTA'; payload: 'lista' | 'editar' | 'ver' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'TOGGLE_DETAILS' }
  | { type: 'SET_LOADING'; payload: boolean }

export const initialState: FeatureState = {
  vistaActual: 'lista',
  loadError: null,
  showDetails: false,
  isLoading: false,
}

export function featureReducer(
  state: FeatureState,
  action: FeatureAction
): FeatureState {
  switch (action.type) {
    case 'SET_VISTA':
      return { ...state, vistaActual: action.payload }

    case 'SET_ERROR':
      return { ...state, loadError: action.payload }

    case 'TOGGLE_DETAILS':
      return { ...state, showDetails: !state.showDetails }

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    default:
      return state
  }
}
```

### Separación de Concerns con Hooks

#### Hook de Datos (useFeatureData.tsx)

**Responsabilidad**: Carga y gestión de datos

```typescript
import { useState, useEffect } from 'react'
import featureService from '@services/featureService'
import type { FeatureData } from '@services/feature.types'

export function useFeatureData(id?: string) {
  const [data, setData] = useState<FeatureData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const cargar = async (featureId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await featureService.obtener(featureId)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      cargar(id)
    }
  }, [id])

  return {
    data,
    isLoading,
    error,
    refetch: () => id && cargar(id),
  }
}
```

#### Hook de Acciones (useFeatureActions.tsx)

**Responsabilidad**: Operaciones CRUD + lógica de negocio

```typescript
import { useState } from 'react'
import { useToast } from '@chakra-ui/react'
import featureService from '@services/featureService'
import type { FeatureData, FeatureCreateData } from '@services/feature.types'

export function useFeatureActions() {
  const [isSaving, setIsSaving] = useState(false)
  const toast = useToast()

  const crear = async (data: FeatureCreateData): Promise<FeatureData | null> => {
    setIsSaving(true)

    try {
      const result = await featureService.crear(data)

      toast({
        title: 'Creado exitosamente',
        status: 'success',
        duration: 3000,
      })

      return result
    } catch (error) {
      toast({
        title: 'Error al crear',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
      return null
    } finally {
      setIsSaving(false)
    }
  }

  const actualizar = async (
    id: string,
    data: Partial<FeatureData>
  ): Promise<boolean> => {
    setIsSaving(true)

    try {
      await featureService.actualizar(id, data)

      toast({
        title: 'Actualizado exitosamente',
        status: 'success',
        duration: 3000,
      })

      return true
    } catch (error) {
      toast({
        title: 'Error al actualizar',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
      return false
    } finally {
      setIsSaving(false)
    }
  }

  const eliminar = async (id: string): Promise<boolean> => {
    try {
      await featureService.eliminar(id)

      toast({
        title: 'Eliminado exitosamente',
        status: 'success',
        duration: 3000,
      })

      return true
    } catch (error) {
      toast({
        title: 'Error al eliminar',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
      return false
    }
  }

  return {
    crear,
    actualizar,
    eliminar,
    isSaving,
  }
}
```

## Sistema de Diseño: Chakra UI + Vision UI

### Colores y Tokens

```typescript
import { useColorModeValue } from '@chakra-ui/react'

function MiComponente() {
  // Colores adaptativos (light mode / dark mode)
  const bg = useColorModeValue('white', 'navy.800')
  const textColor = useColorModeValue('gray.700', 'white')
  const borderColor = useColorModeValue('gray.200', 'whiteAlpha.100')
  const cardBg = useColorModeValue('white', 'navy.700')

  return <Box bg={bg} color={textColor} borderColor={borderColor} />
}
```

### Paleta de Colores Principal

```typescript
// Brand (púrpura gradiente)
brand.50 → brand.900

// Navy (dark mode)
navy.50 → navy.900

// Acentos
cyan.500, green.500, pink.500, teal.500
```

### Glassmorphism Pattern

```typescript
<Box
  bg="linear-gradient(127.09deg, rgba(6, 11, 40, 0.94) 19.41%, rgba(10, 14, 35, 0.49) 76.65%)"
  backdropFilter="blur(120px)"
  border="2px solid"
  borderColor="rgba(255, 255, 255, 0.125)"
  borderRadius="20px"
  p={6}
>
  {/* Contenido con efecto de vidrio */}
</Box>
```

### Cards

**Estilo 1: Card Básico**
```typescript
import { Card, CardHeader, CardBody } from '@components/Card'

<Card>
  <CardHeader>
    <Heading size="md">Título</Heading>
  </CardHeader>
  <CardBody>
    <Text>Contenido</Text>
  </CardBody>
</Card>
```

**Estilo 2: Card con Glassmorphism**
```typescript
<Box
  bg={useColorModeValue('white', 'navy.800')}
  backdropFilter="blur(120px)"
  borderRadius="20px"
  p={6}
  boxShadow="0px 3.5px 5.5px rgba(0, 0, 0, 0.02)"
>
  <Heading size="md" mb={4}>Título</Heading>
  <Text>Contenido</Text>
</Box>
```

### Botones

```typescript
// Botón primary (brand)
<Button colorScheme="brand" size="md">
  Guardar
</Button>

// Botón con gradiente
<Button
  bg="linear-gradient(135deg, brand.400 0%, brand.600 100%)"
  color="white"
  _hover={{
    bg: 'linear-gradient(135deg, brand.500 0%, brand.700 100%)',
  }}
>
  Acción Principal
</Button>

// Botón ghost
<Button variant="ghost" colorScheme="gray">
  Cancelar
</Button>

// Botón outline
<Button variant="outline" colorScheme="brand">
  Ver Más
</Button>
```

### Inputs y Forms

```typescript
<FormControl>
  <FormLabel
    fontWeight="bold"
    fontSize="sm"
    color={useColorModeValue('gray.700', 'white')}
  >
    Campo
  </FormLabel>
  <Input
    variant="outline"
    borderRadius="15px"
    fontSize="sm"
    bg={useColorModeValue('white', 'navy.800')}
    borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
    _focus={{
      borderColor: 'brand.500',
      boxShadow: '0 0 0 1px brand.500'
    }}
  />
</FormControl>
```

### Tablas

```typescript
import { Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react'

<Table variant="simple">
  <Thead>
    <Tr>
      <Th
        color={useColorModeValue('gray.600', 'gray.400')}
        borderColor={useColorModeValue('gray.200', 'whiteAlpha.100')}
      >
        Columna 1
      </Th>
      <Th>Columna 2</Th>
    </Tr>
  </Thead>
  <Tbody>
    {data.map((row) => (
      <Tr key={row.id}>
        <Td>{row.campo1}</Td>
        <Td>{row.campo2}</Td>
      </Tr>
    ))}
  </Tbody>
</Table>
```

### Modales

```typescript
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from '@chakra-ui/react'

function MiComponente() {
  const { isOpen, onOpen, onClose } = useDisclosure()

  return (
    <>
      <Button onClick={onOpen}>Abrir Modal</Button>

      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent
          bg={useColorModeValue('white', 'navy.800')}
          borderRadius="20px"
        >
          <ModalHeader>Título del Modal</ModalHeader>
          <ModalBody>
            <Text>Contenido del modal</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancelar
            </Button>
            <Button colorScheme="brand">Confirmar</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}
```

## Layouts y Composición

### MainPanel Pattern

```typescript
import { MainPanel, PanelContent, PanelContainer } from '@components/Layout'

<MainPanel>
  <PanelContent>
    <PanelContainer>
      {/* Tu contenido */}
    </PanelContainer>
  </PanelContent>
</MainPanel>
```

### Flex Layout

```typescript
// Horizontal con espaciado
<Flex justify="space-between" align="center" gap={4}>
  <Box>Izquierda</Box>
  <Box>Derecha</Box>
</Flex>

// Vertical
<VStack spacing={6} align="stretch">
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</VStack>

// Grid
<Grid templateColumns="repeat(3, 1fr)" gap={6}>
  <Box>Celda 1</Box>
  <Box>Celda 2</Box>
  <Box>Celda 3</Box>
</Grid>
```

### Responsive Design

```typescript
// Breakpoints: base (móvil), md (tablet), lg (desktop), xl (wide)

<Box
  w={{ base: '100%', md: '50%', lg: '33%' }}
  p={{ base: 4, md: 6, lg: 8 }}
  fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
>
  Contenido responsivo
</Box>

// Display condicional
<Box display={{ base: 'none', md: 'block' }}>
  Visible solo en tablet y desktop
</Box>
```

## Convenciones de Imports

```typescript
// 1. React
import { useState, useEffect, useMemo } from 'react'

// 2. Chakra UI
import { Box, Button, Flex, Text, useColorModeValue, useToast } from '@chakra-ui/react'
import { EditIcon, DeleteIcon } from '@chakra-ui/icons'

// 3. Router
import { useNavigate, useParams } from 'react-router-dom'

// 4. Componentes locales
import ComponenteA from './components/ComponenteA'
import ComponenteB from './components/ComponenteB'

// 5. Hooks
import { useFeatureData } from './hooks/useFeatureData'
import { useFeatureActions } from './hooks/useFeatureActions'

// 6. Servicios
import featureService from '@services/featureService'

// 7. Tipos
import type { FeatureData, FeatureProps } from '@services/feature.types'

// 8. Utils
import { calcularTotal } from './utils/calculos'
```

## Performance y Optimización

### React.memo para Componentes Puros

```typescript
import { memo } from 'react'

interface ItemProps {
  data: ItemData
  onEdit: (id: string) => void
}

export const Item = memo(function Item({ data, onEdit }: ItemProps) {
  return (
    <Box>
      <Text>{data.nombre}</Text>
      <Button onClick={() => onEdit(data.id)}>Editar</Button>
    </Box>
  )
})
```

### useCallback para Callbacks

```typescript
const handleEdit = useCallback((id: string) => {
  setSelectedId(id)
  onOpen()
}, [onOpen])

const handleSave = useCallback(async (data: FormData) => {
  await featureService.actualizar(id, data)
  refetch()
}, [id, refetch])
```

### useMemo para Cálculos Costosos

```typescript
const itemsFiltrados = useMemo(() => {
  return items.filter(item =>
    item.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )
}, [items, busqueda])

const total = useMemo(() => {
  return items.reduce((acc, item) => acc + item.precio, 0)
}, [items])
```

## Checklist para Crear un Feature Module

1. [ ] Crear estructura de carpetas (index, core, context, hooks, components)
2. [ ] Definir tipos en `feature.types.ts`
3. [ ] Crear Context + Reducer para UI state
4. [ ] Implementar hook de datos (useFeatureData)
5. [ ] Implementar hook de acciones (useFeatureActions)
6. [ ] Crear componente Core (orquestador)
7. [ ] Crear sub-componentes con glassmorphism
8. [ ] Agregar lazy loading en index.tsx
9. [ ] Integrar con servicios
10. [ ] Agregar manejo de errores y loading states
11. [ ] Implementar dark/light mode con useColorModeValue
12. [ ] Optimizar con memo/useCallback/useMemo

## Referencias de Código

- [Cotizador Feature](src/views/Cotizador/) - Feature module completo
- [CotizadorContext](src/views/Cotizador/context/CotizadorContext.tsx) - Context pattern
- [useCotizacion](src/views/Cotizador/hooks/useCotizacion.tsx) - Hook de datos
- [AdminLayout](src/layouts/Admin.tsx) - UI Shell
- [Theme](src/theme/themeAdmin.tsx) - Sistema de diseño completo
