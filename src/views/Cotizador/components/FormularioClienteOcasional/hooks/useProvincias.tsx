import { useState, useEffect } from "react";
import { useToast } from "@chakra-ui/react";
import cotizadorService from "../../../../../services/cotizadorService";

/**
 * Hook para cargar y gestionar las provincias desde TANGO
 */
export const useProvincias = () => {
  const [provincias, setProvincias] = useState([]);
  const [isLoadingProvincias, setIsLoadingProvincias] = useState(false);
  const toast = useToast();

  useEffect(() => {
    const cargarProvincias = async () => {
      setIsLoadingProvincias(true);
      try {
        /* Comentado porque el backend no está listo
        const response = await cotizadorService.obtenerProvincias();
        if (response.success) {
          // Mapear al formato que usa el formulario
          const provinciasMapeadas = response.data.map(prov => ({
            value: prov.COD_PROVIN,
            label: prov.NOMBRE_PRO
          }));
          setProvincias(provinciasMapeadas);
        }
        */
        // Datos Mock para el FrontEnd sin BackEnd
        setProvincias([
          { value: "0", label: "Capital Federal" },
          { value: "1", label: "Buenos Aires" },
          { value: "2", label: "Catamarca" },
          { value: "3", label: "Córdoba" },
          { value: "4", label: "Corrientes" },
          { value: "5", label: "Entre Ríos" },
          { value: "6", label: "Jujuy" },
          { value: "7", label: "Mendoza" },
          { value: "8", label: "La Rioja" },
          { value: "9", label: "Salta" },
          { value: "10", label: "San Juan" },
          { value: "11", label: "San Luis" },
          { value: "12", label: "Santa Fe" },
          { value: "13", label: "Santiago del Estero" },
          { value: "14", label: "Tucumán" },
          { value: "16", label: "Chaco" },
          { value: "17", label: "Chubut" },
          { value: "18", label: "Formosa" },
          { value: "19", label: "Misiones" },
          { value: "20", label: "Neuquén" },
          { value: "21", label: "La Pampa" },
          { value: "22", label: "Río Negro" },
          { value: "23", label: "Santa Cruz" },
          { value: "24", label: "Tierra del Fuego" }
        ]);
      } catch (error) {
        console.error('Error al cargar provincias:', error);
        toast({
          title: "Advertencia",
          description: "No se pudieron cargar las provincias. Intente nuevamente.",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoadingProvincias(false);
      }
    };

    cargarProvincias();
  }, []);

  return { provincias, isLoadingProvincias };
};
