import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import cotizadorService from '../../../services/cotizadorService';

/**
 * Hook para manejar operaciones con artículos en la cotización
 */
export const useArticulos = ({
  cotizacionId,
  articulos,
  setArticulos,
  isLocked,
  cotizacion,
  setHasUnsavedChanges,
  setRequiereNuevaVersion,
  tienenCambiosReales,
}) => {
  const toast = useToast({ position: 'bottom' });

  /**
   * Determinar si se debe requerir nueva versión (con comparación inteligente)
   */
  const debeRequerirNuevaVersion = useCallback(() => {
    const esNueva = cotizacion?.VERSION === 1 || cotizacion?.VERSION === undefined;
    const tieneArticulosGuardados = articulos.some(art => !art._isNew);

    // Si es nueva o no tiene artículos guardados, no requiere nueva versión
    if (esNueva || !tieneArticulosGuardados) {
      return false;
    }

    // Si tiene cambios reales comparando con el snapshot original, requiere nueva versión
    return tienenCambiosReales ? tienenCambiosReales() : true;
  }, [cotizacion, articulos, tienenCambiosReales]);

  /**
   * Agregar artículo (al final o en posición específica)
   * @param nuevoArticulo - Datos del artículo a agregar
   * @param posicion - Índice donde insertar (opcional, si no se especifica se agrega al final)
   */
  const agregarArticulo = useCallback(async (nuevoArticulo, posicion = null) => {
    // Permitir agregar artículos incluso sin cotizacionId (nuevas cotizaciones)
    // Solo validar bloqueo si ya existe la cotización
    if (cotizacionId && !isLocked) {
      toast({
        title: "Cotización bloqueada",
        description: "No puedes editar esta cotización porque está siendo editada por otro usuario",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const articuloTemporal = {
        id: -Date.now(),
        codArticu: nuevoArticulo.articulo || nuevoArticulo.codArticu || nuevoArticulo.codigo,
        codigo: nuevoArticulo.articulo || nuevoArticulo.codArticu || nuevoArticulo.codigo,
        descripcion: nuevoArticulo.descripcion,
        descAdic: nuevoArticulo.descAdic || '',
        cantidad: nuevoArticulo.cantidad || 1,
        bonif: nuevoArticulo.bonif || 0,
        precioSinImp: nuevoArticulo.precioSinImp,
        iva: nuevoArticulo.iva || 21,
        precioConIva: nuevoArticulo.precioSinImp * (1 + (nuevoArticulo.iva || 21) / 100),
        metadata: nuevoArticulo.metadata || { originalDescripcion: nuevoArticulo.descripcion },
        _isNew: true,
      };

      setArticulos((prev) => {
        // Si se especifica posición, insertar ahí; si no, agregar al final
        if (posicion !== null && posicion >= 0 && posicion <= prev.length) {
          const nuevaLista = [...prev];
          nuevaLista.splice(posicion, 0, articuloTemporal);
          return nuevaLista;
        }
        return [...prev, articuloTemporal];
      });
      setHasUnsavedChanges(true);

      // Toast eliminado - el usuario ya ve el artículo agregado en la tabla
    } catch (error) {
      console.error('Error al agregar artículo:', error);
      toast({
        title: "Error al agregar artículo",
        description: error.message || "No se pudo agregar el artículo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [cotizacionId, isLocked, setArticulos, setHasUnsavedChanges, setRequiereNuevaVersion, debeRequerirNuevaVersion, toast]);

  /**
   * Eliminar artículo
   */
  const eliminarArticulo = useCallback(async (articuloId) => {
    if (!cotizacionId || !isLocked) {
      toast({
        title: "No autorizado",
        description: "No puedes eliminar artículos en este momento",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      const articulo = articulos.find(art => art.id === articuloId);

      if (articulo?._isNew) {
        setArticulos((prev) => prev.filter((art) => art.id !== articuloId));
      } else {
        setArticulos((prev) =>
          prev.map((art) =>
            art.id === articuloId
              ? {
                ...art,
                _isDeleted: true,
                // Quitar _recovered para que el autosave considere esta eliminación
                _recovered: false,
              }
              : art
          )
        );
      }

      setHasUnsavedChanges(true);

      if (debeRequerirNuevaVersion()) {
        setRequiereNuevaVersion(true);
      }

      toast({
        title: "Artículo eliminado",
        description: "El cambio se guardará cuando hagas clic en 'Guardar'",
        status: "info",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error al eliminar artículo:', error);
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar el artículo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [cotizacionId, isLocked, articulos, setArticulos, setHasUnsavedChanges, setRequiereNuevaVersion, debeRequerirNuevaVersion, toast]);

  /**
   * Actualizar artículo
   */
  const actualizarArticulo = useCallback(async (articuloId, cambios) => {
    if (!cotizacionId || !isLocked) return;

    try {
      setArticulos((prev) =>
        prev.map((art) => {
          if (art.id === articuloId) {
            return {
              ...art,
              ...cambios,
              _isModified: !art._isNew,
              // Si el artículo fue recuperado del autosave y ahora se modifica,
              // quitar el flag _recovered para que el autosave lo considere de nuevo
              _recovered: false,
            };
          }
          return art;
        })
      );

      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error al actualizar artículo:', error);
      toast({
        title: "Error al actualizar",
        description: error.message || "No se pudo actualizar el artículo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [cotizacionId, isLocked, setArticulos, setHasUnsavedChanges, setRequiereNuevaVersion, debeRequerirNuevaVersion, toast]);

  /**
   * Reemplazar artículo por otro (mantiene posición y cantidad)
   */
  const reemplazarArticulo = useCallback(async (articuloAnteriorId, nuevoArticulo) => {
    if (cotizacionId && !isLocked) {
      toast({
        title: "Cotización bloqueada",
        description: "No puedes editar esta cotización porque está siendo editada por otro usuario",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setArticulos((prev) =>
        prev.map((art) => {
          if (art.id === articuloAnteriorId) {
            // Si el artículo anterior era nuevo (_isNew), el reemplazo también es nuevo
            // Si el artículo anterior ya existía, marcamos como que necesita ser eliminado y agregado
            const esNuevo = art._isNew;

            return {
              id: art.id, // Mantener el ID para la posición
              codArticu: nuevoArticulo.articulo || nuevoArticulo.codArticu || nuevoArticulo.codigo,
              codigo: nuevoArticulo.articulo || nuevoArticulo.codArticu || nuevoArticulo.codigo,
              descripcion: nuevoArticulo.descripcion,
              descAdic: nuevoArticulo.descAdic || '',
              cantidad: art.cantidad || 1, // Mantener cantidad anterior
              bonif: art.bonif || 0, // Mantener descuento anterior
              precioSinImp: nuevoArticulo.precioSinImp,
              iva: nuevoArticulo.iva || 21,
              precioConIva: nuevoArticulo.precioSinImp * (1 + (nuevoArticulo.iva || 21) / 100),
              metadata: nuevoArticulo.metadata || { originalDescripcion: nuevoArticulo.descripcion },
              _isNew: esNuevo,
              _isReplaced: !esNuevo, // Marcar como reemplazado si no era nuevo
              _isModified: !esNuevo,
              _recovered: false,
            };
          }
          return art;
        })
      );

      setHasUnsavedChanges(true);

      if (debeRequerirNuevaVersion()) {
        setRequiereNuevaVersion(true);
      }
    } catch (error) {
      console.error('Error al reemplazar artículo:', error);
      toast({
        title: "Error al reemplazar",
        description: error.message || "No se pudo reemplazar el artículo",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }, [cotizacionId, isLocked, setArticulos, setHasUnsavedChanges, setRequiereNuevaVersion, debeRequerirNuevaVersion, toast]);

  /**
   * Guardar cambios de artículos
   */
  const guardarCambiosArticulos = useCallback(async () => {
    // 1. Eliminar artículos marcados como eliminados (primero para evitar conflictos de orden)
    const articulosEliminados = articulos.filter(art => art._isDeleted);
    for (const articulo of articulosEliminados) {
      await cotizadorService.eliminarArticulo(cotizacionId, articulo.id);
    }

    // 2. Manejar artículos REEMPLAZADOS (eliminar el viejo + agregar el nuevo)
    // Un artículo reemplazado tiene _isReplaced: true y un ID positivo (existía en BD)
    const articulosReemplazados = articulos.filter(art => art._isReplaced && !art._isDeleted && art.id > 0);
    for (const articulo of articulosReemplazados) {
      // Primero eliminar el artículo original
      await cotizadorService.eliminarArticulo(cotizacionId, articulo.id);

      // Luego agregar el nuevo artículo en la misma posición
      const index = articulos.filter(a => !a._isDeleted).findIndex(a => a.id === articulo.id);
      await cotizadorService.agregarArticulo(cotizacionId, {
        codArticulo: articulo.codArticu || articulo.codigo,
        cantidad: articulo.cantidad || 1,
        descuento: articulo.bonif || 0,
        descripcion: articulo.descripcion,
        precioUnitarioSinImp: articulo.precioSinImp,
        ivaPorcentaje: articulo.iva || 21,
        orden: index !== -1 ? index + 1 : undefined,
        metadata: articulo.metadata,
      });
    }

    // 3. Agregar artículos nuevos (respetando su posición en el array)
    const articulosNuevos = articulos.filter(art => art._isNew && !art._isDeleted);
    for (const articulo of articulosNuevos) {
      // Encontrar el índice real en el array 'articulos' que NO están eliminados
      const index = articulos.filter(a => !a._isDeleted).findIndex(a => a.id === articulo.id);

      await cotizadorService.agregarArticulo(cotizacionId, {
        codArticulo: articulo.codArticu || articulo.codigo,
        cantidad: articulo.cantidad || 1,
        descuento: articulo.bonif || 0,
        descripcion: articulo.descripcion,
        precioUnitarioSinImp: articulo.precioSinImp,
        ivaPorcentaje: articulo.iva || 21,
        orden: index !== -1 ? index + 1 : undefined,
        metadata: articulo.metadata,
      });
    }

    // 4. Actualizar artículos modificados (excluir los reemplazados que ya se manejaron)
    const articulosModificados = articulos.filter(art => art._isModified && !art._isDeleted && !art._isNew && !art._isReplaced);
    for (const articulo of articulosModificados) {
      await cotizadorService.actualizarArticulo(cotizacionId, articulo.id, {
        cantidad: articulo.cantidad,
        descuento: articulo.bonif,
        descripcion: articulo.descripcion,
        metadata: articulo.metadata,
      });
    }

    // 5. Sincronizar el ORDEN de todos los artículos activos en una sola operación
    // Esto es mucho más robusto y evita llamadas múltiples secuenciales
    const activeArticulos = articulos.filter(art => !art._isDeleted);
    const reorderData = activeArticulos
      .map((art, index) => {
        // Para artículos nuevos o reemplazados, no tenemos su ID real aquí,
        // pero el backend ya los insertó con el orden correcto.
        // Solo reordenamos artículos con ID positivo que no fueron reemplazados.
        return {
          id: art.id,
          orden: index + 1
        };
      })
      .filter(item => item.id > 0 && !articulosReemplazados.some(r => r.id === item.id));

    if (reorderData.length > 0) {
      await cotizadorService.reorderArticulos(cotizacionId, reorderData);
    }
  }, [cotizacionId, articulos]);

  return {
    agregarArticulo,
    eliminarArticulo,
    actualizarArticulo,
    reemplazarArticulo,
    guardarCambiosArticulos,
  };
};
