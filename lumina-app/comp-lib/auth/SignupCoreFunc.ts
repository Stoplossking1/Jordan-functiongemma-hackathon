import { useState } from 'react';

import * as Auth from '@/api/auth-api';
import { supabaseClient } from '@/api/supabase-client';
import { t } from '@/i18n';
import { alert } from '@/utils/alert';
import { SignupCoreProps } from './SignupCore.tsx';

export interface SignupCoreFunc {
  appName: string;
  email: string;
  handleSetEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (showPassword: boolean) => void;
  toggleShowPassword: () => void;
  loading: boolean;
  resendingEmailVerify: boolean;
  isPasswordVisible: boolean;
  waitingForEmailVerification: boolean;
  setIsPasswordVisible: (isVisible: boolean) => void;
  onSignUpWithEmailHandler: () => void;
  onResendEmailVerificationHandler: () => void;
  isKeyboardVisible: boolean;
  setIsKeyboardVisible: (isKeyboardVisible: boolean) => void;
}

export function useSignupCore(props: SignupCoreProps): SignupCoreFunc {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendingEmailVerify, setResendingEmailVerify] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [waitingForEmailVerification, setWaitingForEmailVerification] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const appName = t('app.name');

  function handleSetEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
  }

  function toggleShowPassword() {
    setShowPassword(!showPassword);
  }

  async function onSignUpWithEmail() {
    setLoading(true);
    const res = await Auth.signUpWithEmailPassword(supabaseClient, email, password);

    /**
     * "identities" contains the email and other data used to sign up.
     * If it's empty, the user has already signed up and verified their email — they're ready to log in.
     */
    const userAlreadyExists = res.data?.user && res.data.user.identities?.length === 0;

    if (userAlreadyExists) {
      alert(t('auth.accountExists'));
      setLoading(false);
      return;
    }

    if (res.error) {
      alert(res.error.message);
      setLoading(false);
      return;
    }
    if (!res.data?.session) {
      setWaitingForEmailVerification(true);
      setLoading(false);
      return;
    } else if (res.data?.session?.user) {
      props.onSignup?.(res.data?.session);
    }
    setLoading(false);
  }

  function onSignUpWithEmailHandler() {
    onSignUpWithEmail().catch((err) => {
      console.log('onSignUpWithEmail error', err);
    });
  }

  async function onResendEmailVerification(): Promise<void> {
    setResendingEmailVerify(true);
    const res = await Auth.resendVerificationEmail(supabaseClient, email);

    if (res.error) {
      alert(res.error.message);
      setResendingEmailVerify(false);
      return;
    } else {
      alert(t('auth.verifyEmailResentSuccess'), '', [
        {
          text: t('common.close'),
        },
      ]);
    }
    setResendingEmailVerify(false);
  }

  function onResendEmailVerificationHandler() {
    onResendEmailVerification().catch((err) => {
      console.log('onResendEmailVerification error', err);
    });
  }

  return {
    appName,
    email,
    handleSetEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    toggleShowPassword,
    loading,
    isPasswordVisible,
    waitingForEmailVerification,
    resendingEmailVerify,
    setIsPasswordVisible,
    onSignUpWithEmailHandler,
    onResendEmailVerificationHandler,
    isKeyboardVisible,
    setIsKeyboardVisible,
  };
}
