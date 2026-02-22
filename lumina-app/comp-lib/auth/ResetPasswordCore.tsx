import React, { ReactNode } from 'react';
import { View, SafeAreaView, type TextInputProps } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextInput } from '@/comp-lib/core/custom-text-input/CustomTextInput';
import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { t } from '@/i18n';
import { UnknownOutputParams } from 'expo-router';
import { CustomTextField } from '../core/custom-text-field/CustomTextField';
import { ResetPasswordCoreStyles } from './ResetPasswordCoreStyles';
import { useResetPasswordCore } from './ResetPasswordCoreFunc';
import { AuthKeyboardAvoidingWrapper } from '../auth-keyboard-avoiding-wrapper/AuthKeyboardAvoidingWrapper';

export interface ResetPasswordCoreProps {
  /** Custom styles to override the default styling of the Reset Password component */
  styles: ResetPasswordCoreStyles;
  onCancelButtonPress?: () => void;
  onResetPasswordSentButtonPress?: () => void;
  navigateOnPasswordResetSuccess?: (urlParams?: UnknownOutputParams) => void;
  wrapInSafeAreaView?: boolean;
  wrapInKeyboardAvoidingView?: boolean;
  showSpinnerOnSubmit?: boolean;
  emailInputProps?: TextInputProps;

  /** Optional title (fallback to default if not provided) */
  title?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  /** Optional description to show under the email field (fallback to default if not provided) */
  description?: string;
  resetPasswordButtonTitle?: string;
  cancelButtonTitle?: string;

  /** Title shown when reset password sent */
  resetPasswordSentTitle?: string;
  /** Instruction  when reset password sent (can include `{email}` placeholder, fallback to default if not provided) */
  resetPasswordSentInstruction?: string;
  resetPasswordSentButtonTitle?: string;
  resetPasswordSentNote?: string;
  resetPasswordSentLinkText?: string;
  resetPasswordSentLinkUrl?: string;
}

export function ResetPasswordCore(props: ResetPasswordCoreProps): ReactNode {
  const {
    email,
    setEmail,
    loading,
    isResetPasswordSuccess,
    onHandleResetPassword,
    isKeyboardVisible,
    setIsKeyboardVisible,
    onOpenResetPasswordSentLink,
  } = useResetPasswordCore(props);

  if (isResetPasswordSuccess) {
    return (
      <OptionalWrapper
        Wrapper={SafeAreaView}
        enable={props.wrapInSafeAreaView}
        style={props.styles.authBaseStyles.safeArea}
      >
        <View style={props.styles.authBaseStyles.container}>
          <View style={props.styles.authBaseStyles.subContainer}>
            <View style={props.styles.authBaseStyles.topSection}>
              <View>
                <CustomTextField
                  title={props.resetPasswordSentTitle ?? t('auth.resetPasswordSentTitle')}
                  styles={props.styles.authBaseStyles.title}
                />
              </View>
            </View>
            <View style={props.styles.authBaseStyles.middleSection}>
              <CustomTextField
                title={
                  (props.resetPasswordSentInstruction ?? '').replace('{email}', email) ||
                  t('auth.resetPasswordSentDescription', { email })
                }
                styles={props.styles.authBaseStyles.subTitle}
              />
              {props.resetPasswordSentNote && (
                <CustomTextField title={props.resetPasswordSentNote} styles={props.styles.authBaseStyles.subTitle} />
              )}
              {props.resetPasswordSentLinkText && props.resetPasswordSentLinkUrl && (
                <CustomTextField
                  title={props.resetPasswordSentLinkText}
                  styles={props.styles.linkText ?? props.styles.authBaseStyles.subTitle}
                  onPress={onOpenResetPasswordSentLink}
                />
              )}
            </View>
          </View>

          <View style={props.styles.authBaseStyles.bottomSection}>
            {props.onResetPasswordSentButtonPress && (
              <CustomButton
                onPress={props.onResetPasswordSentButtonPress}
                title={props.resetPasswordSentButtonTitle ?? t('auth.backToLogin')}
                styles={props.styles.primaryButtonStyles}
              />
            )}
          </View>
        </View>
      </OptionalWrapper>
    );
  }

  return (
    <OptionalWrapper
      Wrapper={SafeAreaView}
      enable={props.wrapInSafeAreaView}
      style={props.styles.authBaseStyles.safeArea}
    >
      <OptionalWrapper
        Wrapper={AuthKeyboardAvoidingWrapper}
        enable={props.wrapInKeyboardAvoidingView}
        wrapperProps={{ onKeyboardWillShowChange: setIsKeyboardVisible }}
      >
        <View style={props.styles.authBaseStyles.container}>
          <Spinner visible={loading && props.showSpinnerOnSubmit} />

          <View style={props.styles.authBaseStyles.subContainer}>
            {((props.showTitle ?? true) || props.showDescription) && (
              <View style={props.styles.authBaseStyles.topSection}>
                {(props.showTitle ?? true) && (
                  <CustomTextField
                    title={props.title ?? t('auth.resetPassword')}
                    styles={props.styles.authBaseStyles.title}
                  />
                )}
                {props.showDescription && (
                  <CustomTextField
                    title={props.description ?? t('auth.resetPasswordDescription')}
                    styles={props.styles.authBaseStyles.subTitle}
                  />
                )}
              </View>
            )}

            <View style={props.styles.authBaseStyles.middleSection}>
              <View>
                <CustomTextInput
                  value={email}
                  label={t('auth.email')}
                  placeholder={t('auth.email')}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  styles={props.styles.textInputStyles}
                  {...props.emailInputProps}
                />
              </View>
            </View>
          </View>

          <View
            style={
              isKeyboardVisible
                ? props.styles.authBaseStyles.bottomSectionKeyboard
                : props.styles.authBaseStyles.bottomSection
            }
          >
            <CustomButton
              onPress={onHandleResetPassword}
              title={props.resetPasswordButtonTitle ?? t('auth.resetPassword')}
              styles={props.styles.primaryButtonStyles}
              disabled={loading || !email?.trim()}
            />
            {props.onCancelButtonPress && !isKeyboardVisible && (
              <CustomButton
                onPress={props.onCancelButtonPress}
                title={props.cancelButtonTitle ?? t('auth.backToLogin')}
                styles={props.styles.tertiaryButtonStyles}
              />
            )}
          </View>
        </View>
      </OptionalWrapper>
    </OptionalWrapper>
  );
}
