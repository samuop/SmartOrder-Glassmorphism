import { useState, useEffect } from "react";
import cotizadorService from "../../../../../services/cotizadorService";

/**
 * Hook para cargar los tipos de documento desde el backend
 */
export const useTiposDocumento = () => {
  const [tiposDocumento, setTiposDocumento] = useState([]);
  const [isLoadingTiposDocumento, setIsLoadingTiposDocumento] = useState(false);

  useEffect(() => {
    const cargarTiposDocumento = async () => {
      setIsLoadingTiposDocumento(true);
      try {
        /* Comentado porque el backend no está listo
        const tipos = await cotizadorService.obtenerTiposDocumento();
        // Asegurar que siempre sea un array
        const tiposArray = Array.isArray(tipos) ? tipos : (tipos?.data || tipos?.tipos || []);
        setTiposDocumento(tiposArray);
        */
        // Valores por defecto
        setTiposDocumento([
          { codigoAFIP: "80", descripcion: "C.U.I.T." },
          { codigoAFIP: "96", descripcion: "D.N.I." },
          { codigoAFIP: "99", descripcion: "Sin Identificar" },
        ]);
      } catch (error) {
        console.error('Error al cargar tipos de documento:', error);
        // Valores por defecto si falla la carga
        setTiposDocumento([
          { codigoAFIP: "80", descripcion: "C.U.I.T." },
          { codigoAFIP: "96", descripcion: "D.N.I." },
          { codigoAFIP: "99", descripcion: "Sin Identificar" },
        ]);
      } finally {
        setIsLoadingTiposDocumento(false);
      }
    };

    cargarTiposDocumento();
  }, []);

  return {
    tiposDocumento,
    isLoadingTiposDocumento,
  };
};
