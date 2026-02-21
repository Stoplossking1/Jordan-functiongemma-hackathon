import { createContext, useContext, type ReactNode } from 'react';
import { useThemedStyles } from './useThemedStyles';
import { ComponentStyles, useResponsiveDesign } from './useResponsiveDesign';
import { CustomButtonPresetStyles, useCustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import {
  CustomTextInputPresetStyles,
  useCustomTextInputStyles,
} from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { ScaledSize } from 'react-native';
import { borderRadiusPresets, spacingPresets } from './Styles';
import { mergeDeep } from '@shared/utils/object-utils';
import { CustomColor } from '@/comp-app/styles/CustomColors';
import { TypographyPresetStyles, useTypographyPresetStyles } from './TypographyPresetStyles';
import { TypographyBasePresets } from './TypographyBasePresets';

interface StyleProviderProps {
  children: ReactNode;
  // Any other props your component might need
}

// Constraint to ensure customColors light and dark have the same keys
export type ValidCustomColorTheme<T> = T extends {
  light: infer L;
  dark: infer D;
}
  ? keyof L extends keyof D
    ? keyof D extends keyof L
      ? T
      : never
    : never
  : never;
export interface ColorShades {
  '+50': string;
  '+40': string;
  '+30': string;
  '+20': string;
  '+10': string;
  '0': string;
  '-10': string;
  '-20': string;
  '-30': string;
  '-40': string;
  '-50': string;
}

export interface ColorPaletteShades {
  baseBackground: ColorShades;
  baseForeground: ColorShades;
  primaryAccent: ColorShades;
  primaryAccentForeground: ColorShades;
}

export interface ColorPaletteTheme {
  light: ColorPaletteShades;
  dark: ColorPaletteShades;
}

export interface ColorPalette {
  primaryBackground: string;
  secondaryBackground: string;
  tertiaryBackground: string;
  primaryForeground: string;
  secondaryForeground: string;
  tertiaryForeground: string;
  primaryAccent: string;
  primaryAccentForeground: string;
  primaryAccentLight: string;
  primaryAccentDark: string;
}

export interface ColorTheme {
  light: ColorPalette;
  dark: ColorPalette;
}

export interface ColorConfig extends ColorPalette {
  customColors: CustomColor;
}

export interface BorderRadiusPresets {
  inputElements: number;
  components: number;
}

export interface SpacingPresets {
  xxs: number;
  xs: number;
  sm: number;
  md1: number;
  md2: number;
  lg1: number;
  lg2: number;
  xl: number;
  xxl: number;
  xxxl: number;
}

/**
 * TypeScript interfaces for font configuration
 */

// Interface for an individual font weight
export interface FontWeightDetail {
  name: string;
  italic?: boolean;
}

// Interface for all weights in a font family
export type FontWeights = Record<number, FontWeightDetail>;

// Interface for a single font family
export interface FontFamily {
  link?: string;
  tags?: string[];
  isExpoFont?: boolean;
  expoNpmPackage?: string;
  expoNpmPackageVersion?: string;
  alwaysInclude?: boolean;
  fileExtension?: string;
  weights: FontWeights;
}

// Complete fonts interface
export type Fonts = Record<string, FontFamily>;

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export interface StyleContextType {
  createAppPageStyles: <T extends ComponentStyles>(styles: T) => T;
  scaleProperties: <T extends ComponentStyles>(styles: T) => T;
  dimensions: ScaledSize;
  overrideStyles: <T extends ComponentStyles>(baseStyles: T, customStyles?: DeepPartial<T>) => T;
  colors: ColorConfig;
  typographyPresets: TypographyPresetStyles;
  buttonPresets: CustomButtonPresetStyles;
  textInputPresets: CustomTextInputPresetStyles;
  spacingPresets: SpacingPresets;
  borderRadiusPresets: BorderRadiusPresets;
  scaleStylesObject: <T extends ComponentStyles>(styles: T, fontScale: number, screenScale: number) => T;
}

// Create the context
export const StyleContext = createContext<StyleContextType | undefined>(undefined);

function overrideStyles<T extends ComponentStyles>(baseStyles: T, customStyles?: DeepPartial<T>): T {
  const mergedStyles = customStyles ? mergeDeep(baseStyles, customStyles) : baseStyles;

  return mergedStyles;
}

export function StyleProvider(props: StyleProviderProps): ReactNode {
  const { colors } = useThemedStyles();
  const typographyPresets = useTypographyPresetStyles(colors, TypographyBasePresets);
  const { createAppPageStyles, scaleProperties, dimensions, scaleStylesObject } = useResponsiveDesign();
  const buttonPresets = useCustomButtonStyles(
    colors,
    typographyPresets,
    spacingPresets,
    borderRadiusPresets,
    overrideStyles,
  );
  const textInputPresets = useCustomTextInputStyles(
    colors,
    typographyPresets,
    spacingPresets,
    borderRadiusPresets,
    overrideStyles,
  );

  const styleContextValue: StyleContextType = {
    createAppPageStyles,
    scaleProperties,
    scaleStylesObject,
    overrideStyles,
    dimensions,
    colors,
    typographyPresets,
    buttonPresets,
    textInputPresets,
    spacingPresets,
    borderRadiusPresets: borderRadiusPresets,
  };

  return <StyleContext.Provider value={styleContextValue}>{props.children}</StyleContext.Provider>;
}

// Custom hook for using the style context
export function useStyleContext(): StyleContextType {
  const context = useContext(StyleContext);
  if (!context) {
    throw new Error('useStyleContext must be used within a StyleProvider');
  }
  return context;
}
