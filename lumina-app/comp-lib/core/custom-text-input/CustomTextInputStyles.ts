import { TextStyle, ViewStyle } from 'react-native';
import { BorderRadiusPresets, ColorConfig, SpacingPresets } from '../../styles/StyleContext';
import { ComponentStyles } from '@/comp-lib/styles/useResponsiveDesign';
import { TypographyPresetStyles } from '@/comp-lib/styles/TypographyPresetStyles';

export const DEFAULT_SINGLELINE_INPUT_HEIGHT = 40;
export const DEFAULT_INPUT_ICON_SIZE = 16;

export interface CustomTextInputStyles {
  /**
   * View that wraps the Input Container and Label
   */
  wrapper?: ViewStyle;
  /**
   * View that has optional left and right icons and input
   * Default "borderRadius: borderRadiusPresets.inputElements" and "height: 40px"
   */
  container?: ViewStyle;
  focused?: ViewStyle;
  error?: ViewStyle;
  disabled?: ViewStyle;
  /**
   * Input element styles
   * It takes the height of the Container
   * Avoid paddingVertical and paddingHorizontal
   */
  input?: TextStyle;
  inputFocused?: TextStyle;
  label?: TextStyle;
  errorText?: TextStyle;
  /** Default "marginRight: spacingPresets.sm" */
  iconLeftContainer?: ViewStyle;
  iconLeftSize?: number;
  iconLeftColor?: string;
  /** Default "marginLeft: spacingPresets.xs" */
  iconRightContainer?: ViewStyle;
  iconRightSize?: number;
  iconRightColor?: string;
  /**  Placeholder text color used across presets */
  placeholderTextColor?: string;
}

/**
 * Presets for custom text inputs
 */
export interface CustomTextInputPresetStyles {
  /**
   * Standard single-line input
   * Border box
   */
  DefaultInput: CustomTextInputStyles;
  /**
   * Notes, long description
   * Expandable height
   */
  MultilineInput: CustomTextInputStyles;

  /**
   * Minimal input (email, password)
   * Only bottom border
   */
  BottomLineInput: CustomTextInputStyles;
}
export function useCustomTextInputStyles(
  colors: ColorConfig,
  typographyPresets: TypographyPresetStyles,
  spacingPresets: SpacingPresets,
  borderRadiusPresets: BorderRadiusPresets,
  overrideStyles: <T extends ComponentStyles>(baseStyles: T, customStyles?: Partial<T>) => T,
): CustomTextInputPresetStyles {
  const DefaultInput: CustomTextInputStyles = {
    wrapper: {
      flexDirection: 'column',
    },
    container: {
      flexDirection: 'row',
      justifyContent: 'flex-start',
      alignItems: 'stretch',
      borderRadius: borderRadiusPresets.inputElements,
      paddingHorizontal: spacingPresets.md1,
      borderWidth: 1,
      borderColor: colors.secondaryForeground,
      minHeight: DEFAULT_SINGLELINE_INPUT_HEIGHT,
    },
    focused: {
      borderColor: colors.primaryAccent,
    },
    error: {
      borderColor: colors.customColors?.error ?? 'red',
    },
    disabled: {
      opacity: 0.5,
    },
    input: {
      ...typographyPresets.Input,
      paddingVertical: 0,
      color: colors.primaryForeground,
      flex: 1, // required for keyboard focus
      outlineWidth: 0, // disable the browser’s native focus outline on web
    },
    label: {
      ...typographyPresets.Label,
      marginBottom: spacingPresets.xs,
    },
    errorText: {
      ...typographyPresets.Label,
      marginTop: spacingPresets.xs,
      color: colors.customColors?.error ?? 'red',
    },
    iconLeftContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: spacingPresets.sm,
    },
    iconLeftSize: DEFAULT_INPUT_ICON_SIZE,
    iconLeftColor: colors.secondaryForeground,
    iconRightContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: spacingPresets.sm,
    },
    iconRightSize: DEFAULT_INPUT_ICON_SIZE,
    iconRightColor: colors.secondaryForeground,
    placeholderTextColor: colors.tertiaryForeground,
  };

  const MultilineInput: CustomTextInputStyles = overrideStyles(DefaultInput, {
    container: {
      /**
       * Default height for multiline input (2 lines) + include padding vertical
       * minHeight used to allow autogrow
       * to restrict autogrow use height
       */
      minHeight: (typographyPresets.Input.lineHeight ?? 0) * 2 + 2 * spacingPresets.sm,
      height: 'auto',
    },
    input: {
      paddingVertical: spacingPresets.sm,
      textAlignVertical: 'top',
    },
  });

  const BottomLineInput: CustomTextInputStyles = overrideStyles(DefaultInput, {
    container: {
      borderRadius: 0,
      borderWidth: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.secondaryForeground,
    },
    label: {
      ...typographyPresets.Label,
    },
  });

  return { DefaultInput, MultilineInput, BottomLineInput };
}
