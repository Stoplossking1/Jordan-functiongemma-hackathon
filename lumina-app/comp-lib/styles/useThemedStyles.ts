import { useColorScheme } from './useColorScheme';
import { useMemo } from 'react';
import { type ColorConfig, type ColorPalette } from './StyleContext';
import { DefaultColors } from '@/comp-app/styles/DefaultColors';
import { type CustomColor, CustomColors } from '@/comp-app/styles/CustomColors';

/**
 * Interface for the return value of the useThemedStyles hook
 */
export interface ThemedStylesFunc {
  colors: ColorConfig;
}

export function useThemedStyles(): ThemedStylesFunc {
  // const colorScheme = useColorScheme() ?? 'light';
  const colorScheme = 'light'; // disable dark mode for now

  const appColors: ColorPalette = useMemo(() => DefaultColors[colorScheme], [colorScheme]);
  const customColors: CustomColor = useMemo(() => CustomColors[colorScheme], [colorScheme]);
  const colors = useMemo(() => {
    return {
      ...appColors,
      customColors,
    };
  }, [appColors, customColors]);

  return { colors };
}
