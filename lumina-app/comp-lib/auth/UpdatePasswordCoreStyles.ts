import { ViewStyle } from 'react-native';

import { type CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { AuthBaseStyles } from './LoginCoreStyles';

export interface UpdatePasswordCoreStyles {
  authBaseStyles: AuthBaseStyles;
  textInputStyles: CustomTextInputStyles;
  textInputStylesError?: CustomTextInputStyles; // optional for backward compatibility with existing apps
  error?: ViewStyle;
  primaryButtonStyles: CustomButtonStyles;
  tertiaryButtonStyles: CustomButtonStyles;
}
