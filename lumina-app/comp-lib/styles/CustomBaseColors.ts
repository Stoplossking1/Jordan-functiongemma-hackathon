// Do not remove ColorPalette import so the AI does not have to do it if it wants to add ColorPalette colors here.
import { ColorPalette } from '@/comp-lib/styles/ColorPalette';
import { ValidCustomColorTheme } from '@/comp-lib/styles/StyleContext';

/**
 * Custom base color definitions with light and dark mode variants
 *
 * IMPORTANT: This file should NOT be modified directly.
 * This file contains the base color definitions that serve as a foundation
 * for custom colors. All custom color modifications should be made in the
 * CustomColors file in the app, which extends and overrides these base colors.
 *
 * The CustomColors file imports and spreads these base colors, allowing
 * developers to add new colors or override existing ones without conflicts.
 *
 * Usage instructions:
 * - Do not modify this file directly
 * - Add new colors or modify existing ones in CustomColors.ts in the app
 * - If possible, color values should reference a shade or tint from the Color Palette
 * - Only use direct hex values if there is no suitable source color
 * - All color keys must be specified for light and dark mode
 */
export interface CustomBaseColor {
  /** Color for successful operations or positive feedback */
  success: string;
  /** Color for warning notifications or cautionary feedback */
  warning: string;
  /** Color for error notifications or negative feedback */
  error: string;
  /** Color for Woz CTA buttons */
  wozCTA: string;
  /** Toast-specific colors */
  toast: {
    text: string;
    successBackground: string;
    warningBackground: string;
    errorBackground: string;
    infoBackground: string;
    successBorder: string;
    warningBorder: string;
    errorBorder: string;
    infoBorder: string;
  };
  cardBackground: string;
  technicalInfoText: string;
  tertiary: string;
  gray: {
    600: string;
  };
}

export interface CustomBaseColorsTheme {
  light: CustomBaseColor;
  dark: CustomBaseColor;
}

export const CustomBaseColors: CustomBaseColorsTheme = {
  light: {
    success: '#89CC89',
    warning: '#FF9800',
    error: '#DC2626',
    wozCTA: '#5156E8',
    toast: {
      text: '#ffffff',
      successBackground: '#10b981',
      warningBackground: '#f59e0b',
      errorBackground: '#ef4444',
      infoBackground: '#6b7280',
      successBorder: '#059669',
      warningBorder: '#d97706',
      errorBorder: '#dc2626',
      infoBorder: '#56595d',
    },
    cardBackground: '#f2f2f2',
    technicalInfoText: ColorPalette.light.baseForeground['+20'],
    tertiary: '#b3b3b3',
    gray: {
      600: '#535862',
    },
  },
  dark: {
    success: '#DAFFDA',
    warning: '#FFD799',
    error: '#D14343',
    wozCTA: '#5156E8',
    toast: {
      text: '#ffffff',
      successBackground: '#059669',
      warningBackground: '#d97706',
      errorBackground: '#dc2626',
      infoBackground: '#4b5563',
      successBorder: '#047857',
      warningBorder: '#b45309',
      errorBorder: '#b91c1c',
      infoBorder: '#374151',
    },
    cardBackground: '#484848',
    technicalInfoText: ColorPalette.dark.baseForeground['+20'],
    tertiary: '#b3b3b3',
    gray: {
      600: '#535862',
    },
  },
};

// Simple compile-time validation - this will error if structure is invalid
const _validation: ValidCustomColorTheme<typeof CustomBaseColors> = CustomBaseColors;
