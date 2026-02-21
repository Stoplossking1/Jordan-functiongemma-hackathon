/**
 * Signup Container that handles account creation
 */
import { type ReactNode } from 'react';
import { useSignup } from './SignupFunc';

import { SignupProps } from '@/app/auth/signup';
import SignupCore from '@/comp-lib/auth/SignupCore';
import { useSignupStyles } from './SignupStyles';
import { t } from '@/i18n';

export default function SignupContainer(props: SignupProps): ReactNode {
  const { signupCoreStyles } = useSignupStyles();
  const { onSignup } = useSignup(props);

  return (
    <SignupCore
      styles={signupCoreStyles}
      onGoToLoginButtonPress={props.onNavigateToLogin}
      onSignup={onSignup}
      showSpinnerOnSubmit
      title={t('auth.createAnAccount')}
      wrapInSafeAreaView
      wrapInKeyboardAvoidingView
    />
  );
}
