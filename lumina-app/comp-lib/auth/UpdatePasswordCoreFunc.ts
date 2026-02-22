import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import { updateCurrentUserPassword } from '@/api/user-api';
import { t } from '@/i18n';
import { getUrlParamValue } from '@/utils/route-utils';
import { UpdatePasswordCoreProps } from './UpdatePasswordCore';

export interface UpdatePasswordCoreFunc {
  password: string;
  onChangePassword: (password: string) => void;
  matchingPassword: string;
  setMatchingPassword: (matchingPassword: string) => void;
  isLoading: boolean;
  errorMessage: string | undefined;
  isUpdatePasswordSuccess: boolean;
  onUpdatePassword: () => void;
  isKeyboardVisible: boolean;
  setIsKeyboardVisible: (isKeyboardVisible: boolean) => void;
}

export function useUpdatePasswordCore(props: UpdatePasswordCoreProps): UpdatePasswordCoreFunc {
  const { navigateOnPasswordUpdateSuccess } = props;
  const [password, setPassword] = useState('');
  const [matchingPassword, setMatchingPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [isUpdatePasswordSuccess, setSuccess] = useState(false);
  const hashParams = useLocalSearchParams();
  const isSettingUpSupabaseSession = useRef(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  console.debug('[UpdatePassword] Local search params:', hashParams);

  useEffect(() => {
    console.log('[UpdatePassword] Component mounted');

    const setupSession = async () => {
      console.log('[UpdatePassword] Starting setupSession');
      try {
        const hash = getUrlParamValue('#', hashParams);
        const params = Object.fromEntries(new URLSearchParams(hash));
        const { access_token, refresh_token, type } = params;

        if (access_token && refresh_token && type === 'recovery') {
          console.log('[UpdatePassword] Setting up Supabase session');
          await supabaseClient.auth.setSession({
            access_token,
            refresh_token,
          });
          console.log('[UpdatePassword] Supabase session setup complete');
        } else {
          console.log('[UpdatePassword] Invalid recovery link parameters');
          setErrorMessage(t('auth.updatePasswordInvalidRecoveryLink'));
        }
      } catch (err) {
        console.error('[UpdatePassword] Error in setupSession:', err);
        setErrorMessage(t('errors.defaultMessage'));
      }
    };

    if (isSettingUpSupabaseSession.current) {
      console.warn('[UpdatePassword] setupSession already in progress, skipping');
      return;
    }

    isSettingUpSupabaseSession.current = true;
    setupSession().catch((err) => {
      console.error('[UpdatePassword] Unhandled error in setupSession:', err);
      setErrorMessage(t('errors.defaultMessage'));
    });
  }, [hashParams]);

  function onChangePassword(password: string): void {
    setPassword(password);
    setErrorMessage(undefined);
  }

  const handleUpdatePassword = useCallback(
    async function handleUpdatePasswordFunc() {
      if (!password || !matchingPassword) {
        return;
      }

      if (password !== matchingPassword) {
        setErrorMessage(t('auth.passwordsNotMatch'));
        return;
      }

      setIsLoading(true);
      const { error } = await updateCurrentUserPassword(supabaseClient, password);

      if (error) {
        console.log('[UpdatePassword] Error updating password');
        setErrorMessage(t('errors.defaultMessage'));
      } else {
        setSuccess(true);
        navigateOnPasswordUpdateSuccess?.();
      }
      setIsLoading(false);
    },
    [password, matchingPassword, navigateOnPasswordUpdateSuccess],
  );

  function onUpdatePassword() {
    handleUpdatePassword().catch((error) => {
      console.error('handleUpdatePassword error:', error);
    });
  }

  return {
    password,
    onChangePassword,
    matchingPassword,
    setMatchingPassword,
    isLoading,
    errorMessage,
    isUpdatePasswordSuccess,
    onUpdatePassword,
    isKeyboardVisible,
    setIsKeyboardVisible,
  };
}
