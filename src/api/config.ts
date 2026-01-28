/**
 * Configuración genérica de la aplicación
 * Permite cambiar el nombre de la empresa y otros datos sensibles
 * de forma centralizada o mediante variables de entorno.
 */

export const APP_CONFIG = {
    COMPANY_NAME: import.meta.env.VITE_APP_COMPANY_NAME || "SmartOrder Glassmorphism",
    RAZON_SOCIAL: import.meta.env.VITE_APP_RAZON_SOCIAL || "Empresa de Servicios S.A.",
    CUIT: import.meta.env.VITE_APP_CUIT || "00-00000000-0",
    WEBSITE: import.meta.env.VITE_APP_WEBSITE || "www.ejemplo.com",
    LEGAL_NOTICE: import.meta.env.VITE_APP_LEGAL_NOTICE || "Este documento es una cotización proforma y no representa una factura legal.",
    WATERMARK_TEXT: import.meta.env.VITE_APP_WATERMARK || "COTIZACIÓN",
};
