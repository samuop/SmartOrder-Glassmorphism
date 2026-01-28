/**
 * Estrategias de persistencia para el cotizador
 * Permite abstraer cómo se persiste el estado (localStorage, URL, prop, none)
 */

export interface PersistenceContext {
  store?: Record<string, any>;
  setStore?: (updater: (prev: any) => any) => void;
}

export interface PersistenceStrategy {
  get: (key: string, context?: PersistenceContext) => string | null;
  set: (key: string, value: string, context?: PersistenceContext) => void;
  remove: (key: string, context?: PersistenceContext) => void;
}

export const persistenceStrategies: Record<string, PersistenceStrategy> = {
  localStorage: {
    get: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.error('Error al leer de localStorage:', error);
        return null;
      }
    },
    set: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        console.error('Error al escribir en localStorage:', error);
      }
    },
    remove: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
      }
    },
  },

  url: {
    get: (key) => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(key);
      } catch (error) {
        console.error('Error al leer de URL:', error);
        return null;
      }
    },
    set: (key, value) => {
      try {
        const url = new URL(window.location.toString());
        url.searchParams.set(key, value);
        window.history.replaceState({}, '', url.toString());
      } catch (error) {
        console.error('Error al escribir en URL:', error);
      }
    },
    remove: (key) => {
      try {
        const url = new URL(window.location.toString());
        url.searchParams.delete(key);
        window.history.replaceState({}, '', url.toString());
      } catch (error) {
        console.error('Error al eliminar de URL:', error);
      }
    },
  },

  prop: {
    get: (key, context) => {
      if (!context || !context.store) {
        console.warn('Context o store no disponible en estrategia prop');
        return null;
      }
      return context.store[key] ?? null;
    },
    set: (key, value, context) => {
      if (!context || !context.setStore) {
        console.warn('Context o setStore no disponible en estrategia prop');
        return;
      }
      context.setStore(prev => ({ ...prev, [key]: value }));
    },
    remove: (key, context) => {
      if (!context || !context.setStore) {
        console.warn('Context o setStore no disponible en estrategia prop');
        return;
      }
      context.setStore(prev => {
        const newStore = { ...prev };
        delete newStore[key];
        return newStore;
      });
    },
  },

  none: {
    get: () => null,
    set: () => {},
    remove: () => {},
  },
};

/**
 * Hook para usar una estrategia de persistencia
 */
export const usePersistence = (strategy: string = 'localStorage', context?: PersistenceContext) => {
  const selectedStrategy = persistenceStrategies[strategy] || persistenceStrategies.none;

  return {
    get: (key: string) => selectedStrategy.get(key, context),
    set: (key: string, value: string) => selectedStrategy.set(key, value, context),
    remove: (key: string) => selectedStrategy.remove(key, context),
  };
};
