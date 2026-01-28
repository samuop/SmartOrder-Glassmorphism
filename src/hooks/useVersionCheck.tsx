import { useState, useEffect, useCallback, useRef } from 'react';

const CHECK_INTERVAL = 20 * 60 * 1000; // 20 minutos
const FIRST_CHECK_DELAY = 3 * 60 * 1000; // 3 minutos
  
// 🧪 MODO DE PRUEBA: Cambia a true para probar en desarrollo
const TEST_MODE = false;

export const useVersionCheck = (hasUnsavedChanges = false) => {
  const [hasUpdate, setHasUpdate] = useState(TEST_MODE); // Si TEST_MODE está activo, mostrar de inmediato
  const [currentHash, setCurrentHash] = useState(null);
  const [latestHash, setLatestHash] = useState(null);
  const intervalRef = useRef(null);
  const firstCheckDone = useRef(false); // Para saber si ya pasó el primer chequeo de 3 minutos

  const extractHashFromManifest = (manifest) => {
    try {
      const mainJsPath = manifest.files['main.js'];
      // "/static/js/main.b0a7663e.js" → extraer "b0a7663e"
      const match = mainJsPath.match(/main\.([a-f0-9]+)\.js/);
      return match ? match[1] : null;
    } catch (error) {
      console.error('Error al extraer hash del manifest:', error);
      return null;
    }
  };

  const checkVersion = useCallback(async () => {
    // 🧪 Si está en modo de prueba, no hacer nada (ya se muestra el banner)
    if (TEST_MODE) {
      console.log('🧪 MODO DE PRUEBA ACTIVO - Banner de actualización visibleasdasdas');
      return;
    }

    if (hasUnsavedChanges) {
    
      return;
    }

    try {
      // Agregar timestamp para evitar caché del navegador
      const response = await fetch(`/asset-manifest.json?t=${Date.now()}`);
      const manifest = await response.json();

      const hash = extractHashFromManifest(manifest);
      if (!hash) return;

      setLatestHash(hash);

      // Obtener hash guardado
      const savedHash = localStorage.getItem('app_build_hash');

      if (!savedHash) {
        // Primera vez, guardar y no notificar
        localStorage.setItem('app_build_hash', hash);
        setCurrentHash(hash);
      } else if (savedHash !== hash) {
        // Hash diferente, hay actualización
       
        setCurrentHash(savedHash);
        setHasUpdate(true);
      } else {
        setCurrentHash(savedHash);
      }
    } catch (error) {
      console.error('Error al verificar versión:', error);
    }
  }, [hasUnsavedChanges]);

  const updateNow = useCallback(() => {
    // 🧪 En modo de prueba, solo ocultar el banner
    if (TEST_MODE) {
     
      setHasUpdate(false);
      return;
    }

    if (latestHash) {
      localStorage.setItem('app_build_hash', latestHash);
      window.location.reload(true); // Hard reload
    }
  }, [latestHash]);

  const dismissUpdate = useCallback(() => {
    setHasUpdate(false);
    // 🧪 En modo de prueba, volver a mostrar después de 3 segundos para seguir probando
    if (TEST_MODE) {
      setTimeout(() => {
       
        setHasUpdate(true);
      }, 3000);
    }
    // En producción: Volverá a verificar en 1 hora
  }, []);

  // Verificar al montar
  useEffect(() => {
    checkVersion();
  }, [checkVersion]);

  // Sistema de verificación periódica con dos intervalos
  useEffect(() => {
    // Primera verificación después de 3 minutos
    const firstCheckTimeout = setTimeout(() => {
  
      checkVersion();
      firstCheckDone.current = true;
      
      // Después de la primera verificación, iniciar verificaciones cada 1 hora
      intervalRef.current = setInterval(() => {
    
        checkVersion();
      }, CHECK_INTERVAL);
    }, FIRST_CHECK_DELAY);

    return () => {
      clearTimeout(firstCheckTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [checkVersion]);

  return {
    hasUpdate,
    currentHash,
    latestHash,
    checkVersion,
    updateNow,
    dismissUpdate,
  };
};
