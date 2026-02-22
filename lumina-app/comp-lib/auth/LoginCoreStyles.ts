import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { ColorValue, TextStyle, ViewStyle } from 'react-native';

export interface AuthBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  subContainer: ViewStyle;
  topSection: ViewStyle;
  appName: TextStyle;
  title: TextStyle;
  subTitle: TextStyle;
  iconWrapper: ViewStyle;
  icon: { size: number; color: ColorValue };
  middleSection: ViewStyle;
  bottomSection: ViewStyle;
  bottomSectionKeyboard: ViewStyle;
}

export interface LoginCoreStyles {
  authBaseStyles: AuthBaseStyles;
  primaryButtonStyles: CustomButtonStyles;
  textInputStyles: CustomTextInputStyles;
  tertiaryButtonStyles: CustomButtonStyles;
  resetPasswordButtonStyles: CustomButtonStyles;
}
