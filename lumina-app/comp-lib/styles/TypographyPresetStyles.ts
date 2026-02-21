import { ColorConfig } from '@/comp-lib/styles/StyleContext';
import type { TextStyle } from 'react-native';

export interface TypographyBaseStyle extends TextStyle {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontStyle?: 'normal' | 'italic';
}

export interface TypographyBaseStyles {
  Slogan: TypographyBaseStyle;
  PageTitle: TypographyBaseStyle;
  Title: TypographyBaseStyle;
  Subtitle: TypographyBaseStyle;
  Body: TypographyBaseStyle;
  Label: TypographyBaseStyle;
  Input: TypographyBaseStyle;
  Caption: TypographyBaseStyle;
  Button: TypographyBaseStyle;
}
/**
 * This interface defines the Preset (example) text styles for the app.
 * These styles are used to ensure consistent typography across the application.
 * The styles are based on the provided color palette and typography presets.
 * The implementing component should pick one of the styles from this interface and use it directly or customize it further.
 */
export interface TypographyPresetStyles {
  /** Used for app intro, splash screens */
  Slogan: TextStyle;

  /** Used for screen titles, top-level headers */
  PageTitle: TextStyle;

  /** Used for section headers, card headers */
  Title: TextStyle;

  /** Used for descriptive subheadings */
  Subtitle: TextStyle;

  /** Used for main paragraph content, instructions */
  Body: TextStyle;

  /** Used for input labels, small titles */
  Label: TextStyle;

  /** Used inside text input fields */
  Input: TextStyle;

  /** Used for helper text, tooltips, secondary annotations */
  Caption: TextStyle;

  /** Used for text on buttons */
  Button: TextStyle;
}

export function useTypographyPresetStyles(
  colors: ColorConfig,
  typographyBaseStyles: TypographyBaseStyles,
): TypographyPresetStyles {
  const Slogan: TextStyle = {
    ...typographyBaseStyles.Slogan,
    color: colors.primaryAccent,
  };

  const PageTitle: TextStyle = {
    ...typographyBaseStyles.PageTitle,
    color: colors.primaryAccent,
  };

  const Title: TextStyle = {
    ...typographyBaseStyles.Title,
    color: colors.primaryForeground,
  };

  const Subtitle: TextStyle = {
    ...typographyBaseStyles.Subtitle,
    color: colors.secondaryForeground,
  };

  const Body: TextStyle = {
    ...typographyBaseStyles.Body,
    color: colors.tertiaryForeground,
  };
  const Label: TextStyle = {
    ...typographyBaseStyles.Label,
    color: colors.secondaryForeground,
  };

  const Input: TextStyle = {
    ...typographyBaseStyles.Input,
    color: colors.secondaryForeground,
  };

  const Caption: TextStyle = {
    ...typographyBaseStyles.Caption,
    color: colors.tertiaryForeground,
  };

  const Button: TextStyle = {
    ...typographyBaseStyles.Button,
  };

  return {
    Slogan,
    PageTitle,
    Title,
    Subtitle,
    Body,
    Label,
    Input,
    Caption,
    Button,
  };
}
