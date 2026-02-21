import type { ColorValue, TextStyle, ViewStyle } from 'react-native';
import { ColorConfig, type BorderRadiusPresets, type SpacingPresets } from '@/comp-lib/styles/StyleContext';
import { TypographyPresetStyles } from '@/comp-lib/styles/TypographyPresetStyles';
import { ComponentStyles } from '@/comp-lib/styles/useResponsiveDesign';

export interface CustomButtonIconProps {
  size?: number;
  color?: ColorValue;
}

export interface CustomButtonStyles {
  container: ViewStyle;
  pressedContainer: ViewStyle;
  disabledContainer: ViewStyle;
  hoveredContainer: ViewStyle;
  iconOnlyContainer: ViewStyle;
  text: TextStyle;
  pressedText: TextStyle;
  disabledText: TextStyle;
  hoveredText: TextStyle;
  /** deprecated property, use `icon` styles instead */
  activityIndicator: {
    size: number | 'small' | 'large';
    color: ColorValue;
  };
  icon: CustomButtonIconProps;
  pressedIcon: CustomButtonIconProps;
  disabledIcon: CustomButtonIconProps;
  hoveredIcon: CustomButtonIconProps;
}

export interface CustomButtonPresetStyles {
  /**
   * Main CTA (e.g., Continue, Submit)
   * Solid background (accent)
   */
  Primary: CustomButtonStyles;
  /**
   * Secondary action (e.g., Back, Cancel)
   * Bordered or ghost outline
   */
  Secondary: CustomButtonStyles;
  /**
   * Passive actions (e.g., Skip, Help)
   * Text only
   */
  Tertiary: CustomButtonStyles;
}

export function useCustomButtonStyles(
  colors: ColorConfig,
  typographyPresets: TypographyPresetStyles,
  spacingPresets: SpacingPresets,
  borderRadiusPresets: BorderRadiusPresets,
  overrideStyles: <T extends ComponentStyles>(baseStyles: T, customStyles?: Partial<T>) => T,
): CustomButtonPresetStyles {
  const Primary: CustomButtonStyles = {
    container: {
      minHeight: 44,
      backgroundColor: colors.primaryAccent,
      borderRadius: borderRadiusPresets.inputElements,
      paddingHorizontal: spacingPresets.md1,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: spacingPresets.sm,
    },
    pressedContainer: {
      opacity: 0.9,
    },
    disabledContainer: {
      opacity: 0.5,
    },
    hoveredContainer: {},
    iconOnlyContainer: {
      paddingHorizontal: 0,
      borderRadius: 9999,
    },
    text: {
      ...typographyPresets.Button,
      color: colors.primaryAccentForeground,
    },
    icon: { size: Number(typographyPresets.Button.lineHeight), color: colors.primaryAccentForeground },
    hoveredIcon: {},
    pressedIcon: {},
    disabledIcon: {},
    pressedText: {},
    disabledText: {},
    hoveredText: {},
    activityIndicator: {
      size: Number(typographyPresets.Button.lineHeight),
      color: colors.primaryAccentForeground,
    },
  };

  const Secondary = overrideStyles(Primary, {
    container: {
      backgroundColor: 'transparent',
      borderColor: colors.primaryAccent,
      borderWidth: 1,
    },
    pressedContainer: {
      opacity: 0.8,
    },
    text: {
      color: colors.primaryAccent,
    },
    icon: { color: colors.primaryAccent },
  });

  const Tertiary: CustomButtonStyles = overrideStyles(Primary, {
    container: {
      backgroundColor: 'transparent',
    },
    pressedContainer: {
      opacity: 0.8,
    },
    text: {
      color: colors.primaryAccent,
    },
    icon: { color: colors.primaryAccent },
  });

  return {
    Primary,
    Secondary,
    Tertiary,
  };
}
