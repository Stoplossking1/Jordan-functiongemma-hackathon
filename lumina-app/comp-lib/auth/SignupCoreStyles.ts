import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { CustomTextInputStyles } from '@/comp-lib/core/custom-text-input/CustomTextInputStyles';
import { AuthBaseStyles } from './LoginCoreStyles';

export interface SignupCoreStyles {
  authBaseStyles: AuthBaseStyles;
  textInputStyles: CustomTextInputStyles;
  primaryButtonStyles: CustomButtonStyles;
  tertiaryButtonStyles: CustomButtonStyles;
}
