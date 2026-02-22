import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';

import * as Auth from '@/api/auth-api';
import { supabaseClient } from '@/api/supabase-client';
import { t } from '@/i18n';
import { alert } from '@/utils/alert';
import { LoginCoreProps } from './LoginCore.tsx';

export interface LoginCoreFunc {
  appName: string;
  email: string;
  setEmail: (email: string) => void;
  password: string;
  onSetPassword: (password: string) => void;
  showPassword: boolean;
  setShowPassword: (showPassword: boolean) => void;
  toggleShowPassword: () => void;
  loading: boolean;
  isPasswordVisible: boolean;
  setIsPasswordVisible: (isVisible: boolean) => void;
  isAppleAuthAvailable?: boolean;
  onSignInWithEmail: () => void;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  isKeyboardVisible: boolean;
  setIsKeyboardVisible: (isKeyboardVisible: boolean) => void;
}

export function useLoginCore(props: LoginCoreProps): LoginCoreFunc {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isAppleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // disable apple login for now
  const enableAppleLogin = false;

  const appName = t('app.name');

  useEffect(() => {
    async function checkAppleAuthAvailability() {
      if (!enableAppleLogin) {
        return;
      }

      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setAppleAuthAvailable(isAvailable);
    }
    // causing infinite app rerendering
    // TODO: is this necessary here, what were we solving for?
    // signOut();
    checkAppleAuthAvailability().catch((error) => {
      console.error('checkAppleAuthAvailability error:', error);
    });
  }, [enableAppleLogin]);

  function onSetPassword(password: string): void {
    setPassword(password.trim());
  }

  function toggleShowPassword(): void {
    setShowPassword(!showPassword);
  }

  async function signInWithEmail() {
    setLoading(true);
    const res = await Auth.signInWithEmailPassword(supabaseClient, email, password);

    if (res.error) {
      alert(res.error.message);
      setLoading(false);
      return;
    } else if (res.data?.session?.user) {
      props.onLogin?.(res.data?.session);
    }
    setLoading(false);
  }

  function onSignInWithEmail() {
    signInWithEmail().catch((error) => {
      console.error('onSignInWithEmail error:', error);
    });
  }

  async function signInWithApple(): Promise<void> {
    if (!enableAppleLogin) {
      return;
    }

    try {
      const { error } = await Auth.signInWithApple(supabaseClient);
      if (error) return alert(error.message);
    } catch (e) {
      if (e && typeof e === 'object' && 'code' in e) {
        if (e.code === 'ERR_REQUEST_CANCELED') {
          // handle that the user canceled the sign-in flow
        } else {
          // handle other errors
        }
      } else {
        console.error('Unexpected error from Apple SignIn: ', e);
      }
    }
  }

  async function signOut() {
    await Auth.signOut(supabaseClient);
  }

  return {
    appName,
    email,
    setEmail,
    password,
    onSetPassword,
    showPassword,
    setShowPassword,
    toggleShowPassword,
    loading,
    isPasswordVisible,
    setIsPasswordVisible,
    isAppleAuthAvailable,
    onSignInWithEmail,
    signInWithApple,
    signOut,
    isKeyboardVisible,
    setIsKeyboardVisible,
  };
}
