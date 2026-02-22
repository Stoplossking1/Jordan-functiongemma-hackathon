/**
 * Update Password container that handles password updating
 */
import { type ReactNode } from 'react';
import { useUpdatePassword } from './UpdatePasswordFunc';

import { UpdatePasswordProps } from '@/app/auth/update-password';
import { UpdatePasswordCore } from '@/comp-lib/auth/UpdatePasswordCore';
import { useUpdatePasswordStyles } from './UpdatePasswordStyles';
import { t } from '@/i18n';

export default function UpdatePasswordContainer(props: UpdatePasswordProps): ReactNode {
  useUpdatePassword(props);
  const { updatePasswordStyles } = useUpdatePasswordStyles();

  return (
    <UpdatePasswordCore
      wrapInSafeAreaView
      wrapInKeyboardAvoidingView
      styles={updatePasswordStyles}
      showUpdatePasswordSuccessfully
      updatePasswordSuccessDescription={t('auth.updatePasswordSuccessDescription')}
    />
  );
}
