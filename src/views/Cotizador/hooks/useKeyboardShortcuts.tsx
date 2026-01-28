import { useEffect, useCallback } from 'react';

/**
 * Hook para manejar atajos de teclado globales o locales
 * @param {Array} shortcuts - Array de objetos { keys: ['Ctrl', 'S'], callback: () => {}, preventDefault: true }
 * @param {boolean} isEnabled - Si los atajos están activos
 */
const useKeyboardShortcuts = (shortcuts = [], isEnabled = true) => {
    const handleKeyDown = useCallback(
        (event) => {
            if (!isEnabled) return;

            shortcuts.forEach(({ keys, callback, preventDefault = true }) => {
                // Verificar modificadores
                const ctrlKey = keys.includes('Ctrl') || keys.includes('Control');
                const altKey = keys.includes('Alt');
                const shiftKey = keys.includes('Shift');
                const metaKey = keys.includes('Meta'); // Windows key / Command key

                if (
                    event.ctrlKey === ctrlKey &&
                    event.altKey === altKey &&
                    event.shiftKey === shiftKey &&
                    event.metaKey === metaKey
                ) {
                    // Verificar tecla principal (la que no es modificador)
                    const mainKey = keys.find(
                        (k) => !['Ctrl', 'Control', 'Alt', 'Shift', 'Meta'].includes(k)
                    );

                    if (
                        mainKey &&
                        (event.key.toLowerCase() === mainKey.toLowerCase() ||
                            event.code === mainKey)
                    ) {
                        if (preventDefault) {
                            event.preventDefault();
                        }
                        callback(event);
                    }
                }
            });
        },
        [shortcuts, isEnabled]
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);
};

export default useKeyboardShortcuts;
