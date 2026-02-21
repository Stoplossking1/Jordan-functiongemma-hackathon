// Do not remove ColorPalette import so the AI does not have to do it if it wants to add ColorPalette colors here.
import { ColorPalette } from '@/comp-lib/styles/ColorPalette';
import { ValidCustomColorTheme } from '@/comp-lib/styles/StyleContext';
import { CustomBaseColor, CustomBaseColors } from '../../comp-lib/styles/CustomBaseColors';

/**
 * Custom color definitions with light and dark mode variants
 * Usage instructions:
 * Developers may change and add colors but only if they are not available in the default Colors object.
 * If possible color values need to reference a shade or tint from the Color Palette. Only if there is no suitable source color use direct hex values.
 * All color keys must be specified for light and dark mode.
 */
export interface CustomColor extends CustomBaseColor {
  // Additional custom colors can be added here
}

export interface CustomColorsTheme {
  light: CustomColor;
  dark: CustomColor;
}

export const CustomColors: CustomColorsTheme = {
  light: {
    ...CustomBaseColors.light,
    // Additional custom colors can be added here
  },
  dark: {
    ...CustomBaseColors.dark,
    // Additional custom colors can be added here
  },
};

// Simple compile-time validation - this will error if structure is invalid
const _validation: ValidCustomColorTheme<typeof CustomColors> = CustomColors;
