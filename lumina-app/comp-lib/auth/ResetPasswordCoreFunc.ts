import { useState } from 'react';

import type { Route } from 'expo-router';

import * as Auth from '@/api/auth-api';
import { supabaseClient } from '@/api/supabase-client';
import { alert } from '@/utils/alert';
import type { ResetPasswordCoreProps } from './ResetPasswordCore.tsx';
import { Linking } from 'react-native';

export interface ResetPasswordCoreFunc {
  email: string;
  setEmail: (email: string) => void;
  loading: boolean;
  isResetPasswordSuccess: boolean;
  /**
   * Function to trigger the password reset process
   * Sends a reset password email to the provided email address
   */
  onHandleResetPassword: () => void;
  isKeyboardVisible: boolean;
  setIsKeyboardVisible: (isKeyboardVisible: boolean) => void;
  onOpenResetPasswordSentLink: () => void;
}

export function useResetPasswordCore(props: ResetPasswordCoreProps): ResetPasswordCoreFunc {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetPasswordSuccess, setIsResetPasswordSuccess] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  function makeRedirectUrl(): string {
    const bundleUrl = process.env.EXPO_PUBLIC_BUNDLE_URL_SSL;
    const updatePasswordRoute: Route = '/auth/update-password';
    const redirectUrl = `${bundleUrl}${updatePasswordRoute}`;
    console.debug('Made auth update password redirect url:', redirectUrl);
    return redirectUrl;
  }

  async function handleResetPassword() {
    if (!email) return;

    setLoading(true);
    const redirectUrl = makeRedirectUrl();
    const { error } = await Auth.resetPasswordForEmail(supabaseClient, email, redirectUrl);

    if (error) {
      console.error('Error sending reset password email:', error);
      alert('Error sending reset password email');
    } else {
      setIsResetPasswordSuccess(true);
    }
    setLoading(false);
  }

  function onHandleResetPassword() {
    handleResetPassword().catch((error) => {
      console.error('onHandleResetPassword error:', error);
    });
  }

  function onOpenResetPasswordSentLink(): void {
    if (!props.resetPasswordSentLinkUrl) return;
    Linking.openURL(props.resetPasswordSentLinkUrl).catch((error) => {
      console.error('Failed to open reset password instructions link:', error);
    });
  }

  return {  
    email,
    setEmail,
    loading,
    isResetPasswordSuccess,
    onHandleResetPassword,
    isKeyboardVisible,
    setIsKeyboardVisible,
    onOpenResetPasswordSentLink,
  };
}
