# SmartOrder-Glassmorphism

Sistema de cotizaciones moderno construido con **React**, **Chakra UI** y **TypeScript**. Diseñado para ser rápido, seguro y fácil de integrar con backends de gestión comercial.

## Características Principales

- **Gestión de Cotizaciones**: Creación, edición y seguimiento de versiones.
- **Búsqueda Inteligente**: Localización rápida de clientes y artículos.
- **Seguridad**: Configuración centralizada para datos corporativos y protección de endpoints.
- **Diseño Premium**: Interfaz moderna basada en Vision UI, optimizada para la productividad.
- **Inteligencia Artificial (Roadmap)**: Preparado para integración con modelos de lenguaje para carga automática de artículos y análisis de tendencias.
- **TypeScript**: Código robusto y tipado para minimizar errores en producción.

## Inicio Rápido

1. **Instalación**:
   ```bash
   npm install
   ```

2. **Configuración**:
   Copia el archivo `.env.example` a `.env` y configura tus variables de entorno, incluyendo la URL de tu API.

3. **Desarrollo**:
   ```bash
   npm run dev
   ```

## Configuración de la API (Endpoints)

El proyecto utiliza un sistema de endpoints centralizado para mayor seguridad y orden.

1. Localiza el archivo `src/api/endpoints.ts.example`.
2. Crea una copia llamada `src/api/endpoints.ts` (este archivo está configurado en `.gitignore` para no ser subido al repositorio).
3. Configura las rutas de tu API en `src/api/endpoints.ts`.

4. **Producción**:
   ```bash
   npm run build
   ```

## Configuración de Marca

Para personalizar los datos de la empresa, edita el archivo `src/api/config.ts` o utiliza las siguientes variables de entorno:

- `VITE_APP_COMPANY_NAME`
- `VITE_APP_RAZON_SOCIAL`
- `VITE_APP_CUIT`
- `VITE_APP_WEBSITE`

## Licencia

Este proyecto está bajo la licencia MIT. Consulta el archivo `LICENSE` para más detalles.
