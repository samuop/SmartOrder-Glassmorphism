---
name: smartorder-forms
description: Patrones de formularios y validación para SmartOrder. Usa esta skill cuando crees o modifiques formularios, validaciones, o hooks de form management.
allowed-tools: Read, Grep, Edit, Write
---

# SmartOrder - Formularios & Validación

Esta skill te guía para crear y mantener formularios siguiendo los patrones establecidos en SmartOrder-Glassmorphism.

## Patrón de Arquitectura de Formularios

### 1. Estructura de Directorios

Para formularios complejos, sigue esta estructura modular:

```
ComponenteFormulario/
├── index.tsx                    # Componente principal (orchestrator)
├── components/                  # Sub-componentes por sección
│   ├── SeccionDatosBasicos.tsx
│   ├── SeccionDireccion.tsx
│   └── SeccionPercepciones.tsx
├── hooks/                       # Hooks personalizados
│   ├── index.tsx               # Re-exports
│   ├── useFormularioForm.tsx   # Hook principal del form
│   ├── useSeccionEspecifica.tsx
│   └── useValidaciones.tsx
├── constants/                   # Catálogos y constantes
│   └── catalogos.tsx
└── utils/                       # Utilidades puras
    └── validaciones.js         # Funciones de validación puras
```

**Ejemplos de referencia en el proyecto:**
- [FormularioClienteOcasional](src/views/Cotizador/components/FormularioClienteOcasional/)
- [ClienteManager](src/views/Cotizador/components/ClienteManager/)

### 2. Componente Principal (index.tsx)

**Responsabilidades:**
- Orquestar sub-componentes
- Manejar submit del formulario
- Gestionar estado global del form
- Integrar con servicios

**Template base:**

```typescript
import { useState } from 'react'
import { Box, VStack, Button, useToast } from '@chakra-ui/react'
import { useFormulario } from './hooks/useFormularioForm'
import SeccionDatosBasicos from './components/SeccionDatosBasicos'
import SeccionDireccion from './components/SeccionDireccion'
import { validarFormulario } from './utils/validaciones'

interface FormularioProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel?: () => void
}

export function Formulario({ initialData, onSubmit, onCancel }: FormularioProps) {
  const toast = useToast()
  const {
    formData,
    updateField,
    updateSection,
    isValid,
    errors,
    reset
  } = useFormulario(initialData)

  const handleSubmit = async () => {
    const validationErrors = validarFormulario(formData)

    if (validationErrors.length > 0) {
      toast({
        title: 'Errores de validación',
        description: validationErrors.join(', '),
        status: 'error',
        duration: 4000
      })
      return
    }

    try {
      await onSubmit(formData)
      toast({
        title: 'Guardado exitoso',
        status: 'success',
        duration: 3000
      })
    } catch (error) {
      toast({
        title: 'Error al guardar',
        description: error.message,
        status: 'error',
        duration: 5000
      })
    }
  }

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        <SeccionDatosBasicos
          data={formData.datosBasicos}
          onChange={(data) => updateSection('datosBasicos', data)}
          errors={errors.datosBasicos}
        />

        <SeccionDireccion
          data={formData.direccion}
          onChange={(data) => updateSection('direccion', data)}
          errors={errors.direccion}
        />

        <HStack justify="flex-end" spacing={4}>
          {onCancel && (
            <Button variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isDisabled={!isValid}
          >
            Guardar
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
```

### 3. Sub-componentes de Sección

**Responsabilidades:**
- Renderizar campos de una sección específica
- Recibir datos y onChange desde el padre
- No manejar estado propio (controlled components)
- Mostrar errores de validación

**Template base:**

```typescript
import { Box, FormControl, FormLabel, Input, FormErrorMessage } from '@chakra-ui/react'

interface SeccionProps {
  data: {
    campo1: string
    campo2: string
  }
  onChange: (data: any) => void
  errors?: Record<string, string>
}

export function SeccionDatosBasicos({ data, onChange, errors = {} }: SeccionProps) {
  const handleChange = (field: string, value: any) => {
    onChange({ ...data, [field]: value })
  }

  return (
    <Box>
      <FormControl isInvalid={!!errors.campo1}>
        <FormLabel>Campo 1</FormLabel>
        <Input
          value={data.campo1}
          onChange={(e) => handleChange('campo1', e.target.value)}
          placeholder="Ingrese campo 1"
        />
        {errors.campo1 && <FormErrorMessage>{errors.campo1}</FormErrorMessage>}
      </FormControl>

      <FormControl isInvalid={!!errors.campo2} mt={4}>
        <FormLabel>Campo 2</FormLabel>
        <Input
          value={data.campo2}
          onChange={(e) => handleChange('campo2', e.target.value)}
          placeholder="Ingrese campo 2"
        />
        {errors.campo2 && <FormErrorMessage>{errors.campo2}</FormErrorMessage>}
      </FormControl>
    </Box>
  )
}

export default SeccionDatosBasicos
```

### 4. Hook Principal del Formulario

**Responsabilidades:**
- Gestionar estado completo del formulario
- Proveer funciones para actualizar datos
- Validación en tiempo real
- Estado de carga/guardado

**Template base:**

```typescript
import { useState, useCallback, useMemo } from 'react'

interface FormState {
  datosBasicos: {
    campo1: string
    campo2: string
  }
  direccion: {
    calle: string
    ciudad: string
  }
}

const initialState: FormState = {
  datosBasicos: {
    campo1: '',
    campo2: ''
  },
  direccion: {
    calle: '',
    ciudad: ''
  }
}

export function useFormulario(initialData?: Partial<FormState>) {
  const [formData, setFormData] = useState<FormState>({
    ...initialState,
    ...initialData
  })

  const [errors, setErrors] = useState<Record<string, any>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateField = useCallback((section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }, [])

  const updateSection = useCallback((section: string, data: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: data
    }))
  }, [])

  const reset = useCallback(() => {
    setFormData(initialState)
    setErrors({})
  }, [])

  // Validación simple
  const isValid = useMemo(() => {
    return formData.datosBasicos.campo1.length > 0 &&
           formData.datosBasicos.campo2.length > 0
  }, [formData])

  return {
    formData,
    updateField,
    updateSection,
    errors,
    setErrors,
    isValid,
    isSubmitting,
    setIsSubmitting,
    reset
  }
}
```

### 5. Hooks Especializados

Para lógica específica de una sección (ej: cargar provincias, tipos de documento):

```typescript
import { useState, useEffect } from 'react'
import cotizadorService from '@services/cotizadorService'

export function useProvincias() {
  const [provincias, setProvincias] = useState([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const cargarProvincias = async () => {
      setIsLoading(true)
      try {
        const data = await cotizadorService.obtenerProvincias()
        setProvincias(data)
      } catch (error) {
        console.error('Error cargando provincias:', error)
      } finally {
        setIsLoading(false)
      }
    }

    cargarProvincias()
  }, [])

  const buscarPorCodigo = (codigo: string) => {
    return provincias.find(p => p.codigo === codigo)
  }

  return { provincias, isLoading, buscarPorCodigo }
}
```

### 6. Validaciones (utils/validaciones.js)

**Principios:**
- Funciones puras (sin side effects)
- Retornan array de errores o booleano
- Reutilizables entre componentes
- Sin dependencias de React

```javascript
/**
 * Valida que un CUIT sea válido
 */
export function validarCuit(cuit) {
  if (!cuit) return false

  const cuitLimpio = cuit.replace(/[-\s]/g, '')
  if (cuitLimpio.length !== 11) return false

  // Algoritmo de validación de CUIT
  const [checkDigit, ...rest] = cuitLimpio.split('').map(Number).reverse()
  const total = rest.reduce(
    (acc, cur, index) => acc + cur * (2 + (index % 6)),
    0
  )
  const mod11 = 11 - (total % 11)

  return checkDigit === (mod11 === 11 ? 0 : mod11)
}

/**
 * Valida campos requeridos de un formulario
 */
export function validarCamposRequeridos(data, camposRequeridos) {
  const errores = []

  camposRequeridos.forEach(campo => {
    if (!data[campo] || data[campo].toString().trim() === '') {
      errores.push(`El campo ${campo} es requerido`)
    }
  })

  return errores
}

/**
 * Valida email
 */
export function validarEmail(email) {
  if (!email) return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}
```

### 7. Constantes y Catálogos

Para opciones de selects, tipos de documento, etc:

```typescript
// constants/catalogos.tsx
export const TIPOS_DOCUMENTO = [
  { codigo: 'DNI', descripcion: 'DNI' },
  { codigo: 'CUIT', descripcion: 'CUIT' },
  { codigo: 'CUIL', descripcion: 'CUIL' },
  { codigo: 'LE', descripcion: 'Libreta de Enrolamiento' },
  { codigo: 'LC', descripcion: 'Libreta Cívica' },
  { codigo: 'PAS', descripcion: 'Pasaporte' }
]

export const CONDICIONES_IVA = [
  { codigo: 'RI', descripcion: 'Responsable Inscripto' },
  { codigo: 'MT', descripcion: 'Monotributista' },
  { codigo: 'EX', descripcion: 'Exento' },
  { codigo: 'CF', descripcion: 'Consumidor Final' }
]
```

## Patrones de Chakra UI para Formularios

### FormControl con validación

```typescript
<FormControl isRequired isInvalid={!!errors.campo}>
  <FormLabel>Nombre del Campo</FormLabel>
  <Input
    value={value}
    onChange={handleChange}
    placeholder="Placeholder"
  />
  {errors.campo && (
    <FormErrorMessage>{errors.campo}</FormErrorMessage>
  )}
  <FormHelperText>Texto de ayuda opcional</FormHelperText>
</FormControl>
```

### Select con opciones

```typescript
<FormControl>
  <FormLabel>Provincia</FormLabel>
  <Select
    value={value}
    onChange={(e) => handleChange(e.target.value)}
    placeholder="Seleccione una provincia"
  >
    {provincias.map(prov => (
      <option key={prov.codigo} value={prov.codigo}>
        {prov.descripcion}
      </option>
    ))}
  </Select>
</FormControl>
```

### Textarea

```typescript
<FormControl>
  <FormLabel>Observaciones</FormLabel>
  <Textarea
    value={value}
    onChange={handleChange}
    placeholder="Ingrese observaciones"
    rows={4}
  />
</FormControl>
```

### Checkbox

```typescript
<Checkbox
  isChecked={value}
  onChange={(e) => handleChange(e.target.checked)}
>
  Aceptar términos y condiciones
</Checkbox>
```

### DatePicker (react-datepicker)

```typescript
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'

<FormControl>
  <FormLabel>Fecha</FormLabel>
  <DatePicker
    selected={fecha}
    onChange={(date) => setFecha(date)}
    dateFormat="dd/MM/yyyy"
    customInput={<Input />}
  />
</FormControl>
```

## Integración con Servicios

### Crear registro

```typescript
const handleSubmit = async (data: FormData) => {
  try {
    const resultado = await cotizadorService.crearClienteOcasional(data)

    toast({
      title: 'Cliente creado exitosamente',
      status: 'success'
    })

    onSuccess?.(resultado)
  } catch (error) {
    toast({
      title: 'Error al crear cliente',
      description: error.message,
      status: 'error'
    })
  }
}
```

### Actualizar registro

```typescript
const handleUpdate = async (id: string, data: FormData) => {
  try {
    await cotizadorService.actualizarClienteOcasional(id, data)

    toast({
      title: 'Cliente actualizado',
      status: 'success'
    })
  } catch (error) {
    toast({
      title: 'Error al actualizar',
      description: error.message,
      status: 'error'
    })
  }
}
```

## Checklist para Crear un Nuevo Formulario

1. [ ] Crear estructura de carpetas (index, components, hooks, utils, constants)
2. [ ] Definir tipos/interfaces para el form data
3. [ ] Crear hook principal del formulario (useXxxForm)
4. [ ] Implementar funciones de validación puras en utils
5. [ ] Crear sub-componentes por sección
6. [ ] Crear hooks especializados si es necesario (ej: useProvincias)
7. [ ] Implementar componente principal (orchestrator)
8. [ ] Integrar con servicios (crear/actualizar)
9. [ ] Agregar toasts para feedback
10. [ ] Manejar estados de carga/error
11. [ ] Testear validaciones edge cases

## Convenciones de Naming

- **Componente principal**: `FormularioXxx` o simplemente el nombre del feature
- **Sub-componentes**: `Seccion<Nombre>` (ej: `SeccionDatosBasicos`)
- **Hook principal**: `use<Nombre>Form` (ej: `useClienteForm`)
- **Hooks especializados**: `use<Recurso>` (ej: `useProvincias`, `useTiposDocumento`)
- **Validaciones**: `validar<Campo>` o `validar<Entidad>` (ej: `validarCuit`, `validarFormulario`)

## Referencias de Código

Para más detalles, revisa estos archivos existentes:

- [FormularioClienteOcasional](src/views/Cotizador/components/FormularioClienteOcasional/index.tsx)
- [useClienteForm](src/views/Cotizador/components/FormularioClienteOcasional/hooks/useClienteForm.tsx)
- [SeccionDatosBasicos](src/views/Cotizador/components/FormularioClienteOcasional/components/SeccionDatosBasicos.tsx)
- [validaciones.js](src/views/Cotizador/components/FormularioClienteOcasional/utils/validaciones.js)
