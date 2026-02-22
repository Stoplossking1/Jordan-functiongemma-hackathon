/**
 * Signup Styles that handle account creation styles
 */
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { SignupCoreStyles } from '@/comp-lib/auth/SignupCoreStyles';
import { useLoginStyles } from './LoginStyles';

export interface SignupStyles {
  signupCoreStyles: SignupCoreStyles;
}

export function useSignupStyles(): SignupStyles {
  const { createAppPageStyles, overrideStyles } = useStyleContext();

  // Inherit styles from the login page to ensure visual consistency between auth pages (Login, Signup, etc)
  const { sharedAuthStyles, sharedTextInputStyles, sharedPrimaryButtonStyles, sharedTertiaryButtonStyles } =
    useLoginStyles();

  const loginMatchedSignupCoreStyles = {
    authBaseStyles: overrideStyles(sharedAuthStyles, {}),
    textInputStyles: overrideStyles(sharedTextInputStyles, {}),
    primaryButtonStyles: overrideStyles(sharedPrimaryButtonStyles, {}),
    tertiaryButtonStyles: overrideStyles(sharedTertiaryButtonStyles, {}),
  };

  return createAppPageStyles<SignupStyles>({ signupCoreStyles: loginMatchedSignupCoreStyles });
}
