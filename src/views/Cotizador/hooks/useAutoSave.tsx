import { useState, useEffect, useCallback, useRef } from 'react';
import cotizadorService from '../../../services/cotizadorService';
import debounce from 'lodash/debounce';
import Cookies from 'js-cookie';

export const useAutoSave = ({ cotizacionId, articulos, hasUnsavedChanges, onRecover }) => {
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState(null);
    const [recoveryAvailable, setRecoveryAvailable] = useState(false);
    const [recoveredData, setRecoveredData] = useState(null);

    // Usar ref para controlar si el autosave está pausado (evita re-renders innecesarios)
    const autosavePausedRef = useRef(false);

    // Obtener usuario actual
    const usuarioId = parseInt(Cookies.get('COD_VENDED')) || 1;

    // Verificar si hay datos recuperables al montar o cuando cambia la cotización
    useEffect(() => {
        // Limpiar estados anteriores al cambiar de cotización
        setRecoveryAvailable(false);
        setRecoveredData(null);

        if (!cotizacionId) return;

        const checkRecovery = async () => {
            try {
                const response = await cotizadorService.obtenerAutosave(cotizacionId);
                if (response && response.success && response.data) {
                    setRecoveredData(response.data);
                    setRecoveryAvailable(true);
                }
            } catch (error) {
                // Silenciar error, es normal si no hay autosave
            }
        };

        checkRecovery();
    }, [cotizacionId]);

    // Función de guardado real
    const saveToBackend = async (currentArticulos) => {
        // Verificar si está pausado
        if (autosavePausedRef.current) {

            return;
        }

        if (!cotizacionId || !usuarioId) return;

        // Solo guardar artículos con cambios pendientes (nuevos, modificados o marcados para eliminar)
        // IMPORTANTE: Incluir el índice actual para poder restaurar la posición exacta
        const articulosConCambios = currentArticulos
            .map((art, index) => ({ ...art, _tempIndex: index }))
            .filter(art =>
                (art._isNew || art._isModified || art._isDeleted) && !art._recovered
            );

        // Debug: ver qué artículos tienen flags
        const articulosConFlags = currentArticulos.filter(art =>
            art._isNew || art._isModified || art._isDeleted || art._recovered
        );


        // Si no hay cambios reales, no guardar
        if (articulosConCambios.length === 0) {

            return;
        }

        try {
            setIsSaving(true);

            await cotizadorService.guardarAutosave(cotizacionId, usuarioId, articulosConCambios);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Autosave failed", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Debounce de 5 segundos
    const debouncedSave = useCallback(
        debounce((currentArticulos) => {
            saveToBackend(currentArticulos);
        }, 5000),
        [cotizacionId, usuarioId]
    );

    // Trigger autosave cuando cambian los artículos y hay cambios sin guardar
    useEffect(() => {
        if (hasUnsavedChanges && articulos.length > 0) {
            // Solo programar si hay artículos con cambios reales (NO solo recuperados)
            // Artículos con _recovered ya fueron recuperados del autosave, no necesitan guardarse de nuevo
            const tieneArticulosConCambiosNuevos = articulos.some(art =>
                (art._isNew || art._isModified || art._isDeleted) && !art._recovered
            );

            if (tieneArticulosConCambiosNuevos) {
                debouncedSave(articulos);
            }
        }
        return () => {
            debouncedSave.cancel();
        }
    }, [articulos, hasUnsavedChanges, debouncedSave]);

    const clearAutosave = async () => {
        // Pausar y cancelar inmediatamente
        autosavePausedRef.current = true;
        debouncedSave.cancel();

        if (!cotizacionId) {
            autosavePausedRef.current = false;
            return;
        }

        // Optimistic UI update
        setRecoveryAvailable(false);
        setRecoveredData(null);

        try {
            await cotizadorService.eliminarAutosave(cotizacionId);
        } catch (error) {
            console.error('🗑️ Error al eliminar autosave:', error);
        }

        // NO re-habilitamos automáticamente aquí
        // El código que llama a clearAutosave debe llamar a resumeAutosave()
        // después de que todas las operaciones hayan terminado
    };

    // Función para re-habilitar el autosave manualmente
    const resumeAutosave = () => {
        autosavePausedRef.current = false;
    };

    const performRecovery = async () => {
        if (recoveredData && onRecover) {
            // Pausar y cancelar inmediatamente
            autosavePausedRef.current = true;
            debouncedSave.cancel();

            // Llamar a onRecover y esperar el resultado
            // onRecover devuelve true si la recuperación fue exitosa, false si no
            const recoverySuccess = await onRecover(recoveredData.articulos, recoveredData.fecha);

            if (recoverySuccess) {
                // Solo eliminar el autosave si la recuperación fue exitosa
                if (cotizacionId) {
                    try {
                        await cotizadorService.eliminarAutosave(cotizacionId);
                    } catch (error) {
                        console.error('🔄 performRecovery: Error al eliminar autosave:', error);
                    }
                }

                setRecoveryAvailable(false);
                setRecoveredData(null);

                // Re-habilitar autosave después de un delay para dar tiempo
                // a que el estado se estabilice
                setTimeout(() => {
                    autosavePausedRef.current = false;
                }, 3000);
            } else {
                // La recuperación falló (ej: no se pudo adquirir bloqueo)
                // Re-habilitar autosave inmediatamente para mantener el estado
                autosavePausedRef.current = false;
            }
        }
    };

    return {
        isSaving,
        lastSaved,
        recoveryAvailable,
        performRecovery,
        clearAutosave,
        resumeAutosave,
        recoveredData
    };
};
