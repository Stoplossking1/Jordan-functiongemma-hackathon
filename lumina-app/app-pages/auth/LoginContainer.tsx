/**
 * Login container for Lumina - warm, friendly sign-in experience
 */
import { type ReactNode } from 'react';
import { LoginProps } from '@/app/auth/login';
import LoginCore from '@/comp-lib/auth/LoginCore';
import { useLoginStyles } from './LoginStyles';
import { t } from '@/i18n';
import { useAppRedirection } from '@/comp-app/auth/useAppRedirection';

export default function LoginContainer(props: LoginProps): ReactNode {
  const { loginCoreStyles } = useLoginStyles();
  const { onPostLoginRedirection } = useAppRedirection({
    onNavigateToHome: props.onNavigateToHome,
    onNavigateToOnboarding: props.onNavigateToOnboarding,
  });

  return (
    <LoginCore
      styles={loginCoreStyles}
      wrapInSafeAreaView
      wrapInKeyboardAvoidingView
      showSpinnerOnSubmit
      title="Welcome back!"
      subTitle={t('app.name')}
      onLogin={onPostLoginRedirection}
      onGoToSignupButtonPress={props.onNavigateToSignup}
      onGoToResetPwButtonPress={props.onNavigateToResetPassword}
    />
  );
}
