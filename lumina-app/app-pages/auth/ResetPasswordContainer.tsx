/**
 * Reset Password container that handles password recovery
 */
import { type ReactNode } from 'react';
import { useResetPassword } from './ResetPasswordFunc';

import { ResetPasswordProps } from '@/app/auth/reset-password';
import { ResetPasswordCore } from '@/comp-lib/auth/ResetPasswordCore';
import { useResetPasswordStyles } from './ResetPasswordStyles';

export default function ResetPasswordContainer(props: ResetPasswordProps): ReactNode {
  const resetPassword = useResetPassword(props);
  const { resetPasswordCoreStyles } = useResetPasswordStyles();

  return (
    <ResetPasswordCore
      wrapInSafeAreaView
      wrapInKeyboardAvoidingView
      showDescription
      onResetPasswordSentButtonPress={props.onNavigateToLogin}
      onCancelButtonPress={props.onNavigateToLogin}
      styles={resetPasswordCoreStyles}
    />
  );
}
