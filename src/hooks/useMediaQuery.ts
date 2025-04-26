import { useState, useEffect } from 'react';

/**
 * Hook para avaliar uma media query
 * @param query A media query a ser avaliada
 * @returns Um booleano que indica se a media query corresponde ao estado atual
 */
const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // addListener está obsoleto, preferimos usar addEventListener quando disponível
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      // Fallback para navegadores mais antigos
      mediaQuery.addListener(listener);
      return () => mediaQuery.removeListener(listener);
    }
  }, [query]);

  return matches;
};

export default useMediaQuery; 