import { type CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { AuthBaseStyles } from './LoginCoreStyles';
import { TextStyle } from 'react-native';

export interface ResetPasswordCoreStyles {
  authBaseStyles: AuthBaseStyles;
  textInputStyles: CustomTextInputStyles;
  primaryButtonStyles: CustomButtonStyles;
  tertiaryButtonStyles: CustomButtonStyles;
  linkText?: TextStyle;
}