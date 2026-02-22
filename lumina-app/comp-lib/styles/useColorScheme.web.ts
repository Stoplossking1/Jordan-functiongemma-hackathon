import { useEffect, useState } from 'react';
import { useColorScheme as useRNColorScheme } from 'react-native';

/**
 * To support static rendering, this value needs to be re-calculated on the client side for web
 */
export function useColorScheme(): string | null | undefined {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  // const colorScheme = useRNColorScheme();
  const colorScheme = 'light'; // disable dark mode for now

  if (hasHydrated) {
    return colorScheme;
  }

  return 'light';
}
