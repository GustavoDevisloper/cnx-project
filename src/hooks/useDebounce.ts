import { useState, useEffect } from 'react';

/**
 * Hook personalizado para implementar debounce
 * @param value O valor a ser debounced
 * @param delay Tempo de atraso em ms (padrão: 500ms)
 * @returns O valor após o tempo de debounce
 */
function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Configurar o temporizador para atualizar o valor após o atraso
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Limpar o temporizador se o value mudar antes do tempo de debounce
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce; 