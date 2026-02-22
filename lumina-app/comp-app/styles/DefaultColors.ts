import { ColorPalette } from '@/comp-lib/styles/ColorPalette';
import { ColorTheme } from '@/comp-lib/styles/StyleContext';
/**
 * Default color theme for the application in light and dark modes.
 * Only shade and tint values can be changed, no new colors or changes to direct color values can be made here.
 */
export const DefaultColors: ColorTheme = {
  light: {
    primaryBackground: ColorPalette.light.baseBackground['+40'],
    secondaryBackground: ColorPalette.light.baseBackground['+50'],
    tertiaryBackground: ColorPalette.light.baseBackground['+30'],
    primaryForeground: ColorPalette.light.baseForeground['-50'],
    secondaryForeground: ColorPalette.light.baseForeground['-10'],
    tertiaryForeground: ColorPalette.light.baseForeground['+10'],
    primaryAccent: ColorPalette.light.primaryAccent['0'],
    primaryAccentForeground: ColorPalette.light.primaryAccentForeground['+40'],
    primaryAccentLight: ColorPalette.light.primaryAccent['+30'],
    primaryAccentDark: ColorPalette.light.primaryAccent['-20'],
  },
  dark: {
    primaryBackground: ColorPalette.dark.baseBackground['-10'],
    secondaryBackground: ColorPalette.dark.baseBackground['-20'],
    tertiaryBackground: ColorPalette.dark.baseBackground['0'],
    primaryForeground: ColorPalette.dark.baseForeground['-50'],
    secondaryForeground: ColorPalette.dark.baseForeground['-10'],
    tertiaryForeground: ColorPalette.dark.baseForeground['+10'],
    primaryAccent: ColorPalette.dark.primaryAccent['0'],
    primaryAccentForeground: ColorPalette.dark.primaryAccentForeground['+40'],
    primaryAccentLight: ColorPalette.dark.primaryAccent['+20'],
    primaryAccentDark: ColorPalette.dark.primaryAccent['-20'],
  },
};
