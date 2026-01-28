# SmartOrder-Glassmorphism: Arquitectura Modular de Micro-Portal

Este documento describe la arquitectura técnica avanzada del frontend del Proyecto Cotizador, detallando la simbiosis entre el sistema de diseño **Vision UI** y el motor funcional del **Cotizador**.

## 1. Paradigma Arquitectónico: "UI Shell & Feature Modules"

La aplicación sigue una arquitectura de **Cáscara de Interfaz (UI Shell)**. En este patrón, el marco de la aplicación (Sidebar, Navbar, Footer) es un contenedor estático y optimizado que orquestra la carga dinámica de módulos de características independientes.

### Componentes de la Cáscara (`src/layouts/Admin.tsx`)
- **Orquestador Central**: El `AdminLayout` actúa como el nodo raíz de la experiencia de usuario. Gestiona el ciclo de vida de los elementos persistentes.
- **Mecanismo de Inyección de Rutas**: Utiliza un sistema de mapeo dinámico para renderizar el `Sidebar` y el `Navbar`.
- **Code Splitting (Lazy Loading)**: Para optimizar el *First Contentful Paint (FCP)*, los módulos como el Cotizador se cargan mediante `React.lazy()` y `Suspense`, permitiendo que el navegador descargue solo el código necesario para la funcionalidad activa.

## 2. Sistema de Diseño: Vision UI Pro Layer sobre Chakra UI

La estética del proyecto no es accidental, sino el resultado de un **Mapeo de Tokens de Diseño** complejo.

- **Fase de Integración**: Vision UI se inyecta en la aplicación mediante un `ChakraProvider` configurado con un tema extendido (`src/theme/index.ts`).
- **Composición de Estilos**:
  - **Fondos**: Capas de gradientes radiales y lineales aplicadas directamente al `body` mediante estilos globales.
  - **Cards & Glassmorphism**: Uso de `backdrop-filter` y transparencia alfa (`rgba`) para lograr el efecto de cristal.
  - **Atomic Design**: Aprovecha los componentes atómicos de Chakra (Button, Input, Flex) pero con variantes personalizadas (`brand`, `card`, `glass`) que modifican su comportamiento visual sin alterar su lógica funcional.

## 3. Arquitectura del Módulo Cotizador (Feature-Driven)

El Cotizador está diseñado como un **Módulo Vertical Desacoplado**, lo que facilita su mantenimiento y futura migración.

### Patrón de Gestión de Estado: Provider Pattern
- **Eje Central**: `CotizadorProvider` (en `CotizadorContext`). Actúa como una "base de datos en memoria" para el módulo.
- **Inyección de Dependencias**: Cualquier subcomponente (ej. `ArticulosTable`) consume el estado directamente mediante el hook `useCotizadorUI`, eliminando el *Prop Drilling*.

### Composición de Lógica mediante Hooks (SoC)
La lógica de negocio se ha fragmentado siguiendo el principio de **Separación de Preocupaciones (Separation of Concerns)**:
- `useCotizacion`: Ciclo de vida de la entidad cotización (CRUD).
- `useArticulos`: Operaciones aritméticas y manipulación de listas de ítems.
- `useBloqueo`: Lógica de concurrencia y protección de edición.
- `useAutoSave`: Persistencia resiliente ante fallos de sesión.

## 4. Estrategia de Migración: "Vertical Migration Strategy"

El proyecto se encuentra en la **Fase 1: Estructural**, donde los pilares de la arquitectura han sido migrados a TypeScript:

1.  **Tipado de Modelos**: Definición de interfaces en `src/types` para respuestas de API y objetos de negocio.
2.  **Wrappers TypeScript**: El archivo `src/views/Cotizador/index.tsx` actúa como un wrapper tipado que garantiza que los parámetros de entrada y salida del módulo sean consistentes con el resto de la app.
3.  **Refactorización Incremental**: Los archivos `.js` antiguos se mantienen operativos mientras las nuevas funcionalidades se desarrollan exclusivamente en `.tsx`, asegurando cero regresiones durante la modernización.

## 5. Abstracción de Servicios (Layering)

Existe una capa de abstracción clara entre la UI y la API:
- **`cotizadorService.ts`**: Actúa como un **Adapter**. Transforma los datos crudos del backend (planos) en objetos de dominio ricos para el frontend, y viceversa, aislando los componentes de cambios en el contrato de la API.
- **Centralización de Endpoints**: El sistema de `endpoints.ts` permite redirigir el tráfico de la aplicación entre servidores de desarrollo, staging y producción sin modificar un solo componente de la interfaz.
