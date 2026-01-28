/**
 * ClienteManager - Módulo unificado para gestión de clientes
 * Maneja tanto clientes habituales como ocasionales con arquitectura separada
 */

// Constantes
export * from './constants';

// Utilidades
export * from './utils/validaciones';
export * from './utils/transformadores';

// Hooks
export { default as useClienteHabitual } from './hooks/useClienteHabitual';

// Componentes
export { default as VistaClienteHabitual } from './components/VistaClienteHabitual';
