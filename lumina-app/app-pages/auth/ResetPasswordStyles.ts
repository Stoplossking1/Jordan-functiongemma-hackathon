import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { ResetPasswordCoreStyles } from '@/comp-lib/auth/ResetPasswordCoreStyles';
import { useLoginStyles } from './LoginStyles';

export interface ResetPasswordStyles {
  resetPasswordCoreStyles: ResetPasswordCoreStyles;
}

export function useResetPasswordStyles(): ResetPasswordStyles {
  const { createAppPageStyles, overrideStyles } = useStyleContext();

  // Inherit styles from the login page to ensure visual consistency between auth pages (Login, Signup, etc)
  const { sharedAuthStyles, sharedTextInputStyles, sharedPrimaryButtonStyles, sharedTertiaryButtonStyles } =
    useLoginStyles();

  const loginMatchedResetPasswordCoreStyles = {
    authBaseStyles: overrideStyles(sharedAuthStyles, {}),
    textInputStyles: overrideStyles(sharedTextInputStyles, {}),
    primaryButtonStyles: overrideStyles(sharedPrimaryButtonStyles, {}),
    tertiaryButtonStyles: overrideStyles(sharedTertiaryButtonStyles, {}),
  };

  return createAppPageStyles<ResetPasswordStyles>({ resetPasswordCoreStyles: loginMatchedResetPasswordCoreStyles });
}
