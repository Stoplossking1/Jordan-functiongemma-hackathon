import React, { ReactNode } from 'react';
import { View, type ImageSourcePropType, SafeAreaView, type TextInputProps } from 'react-native';
import Spinner from 'react-native-loading-spinner-overlay';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextInput } from '@/comp-lib/core/custom-text-input/CustomTextInput';
import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { t } from '@/i18n';
import { UnknownOutputParams } from 'expo-router';
import { CustomTextField } from '../core/custom-text-field/CustomTextField';
import { UpdatePasswordCoreStyles } from './UpdatePasswordCoreStyles';
import { useUpdatePasswordCore } from './UpdatePasswordCoreFunc';
import { AuthKeyboardAvoidingWrapper } from '../auth-keyboard-avoiding-wrapper/AuthKeyboardAvoidingWrapper';
import { ControlError } from '../form/control-error/ControlError';

export interface UpdatePasswordCoreProps {
  styles: UpdatePasswordCoreStyles;
  onCancelButtonPress?: () => void;
  onPasswordUpdatedButtonPress?: () => void;
  navigateOnPasswordUpdateSuccess?: (urlParams?: UnknownOutputParams) => void;
  wrapInSafeAreaView?: boolean;
  wrapInKeyboardAvoidingView?: boolean;
  showSpinnerOnSubmit?: boolean;
  passwordInputLabel?: string;
  passwordInputProps?: TextInputProps;
  showLogo?: boolean;
  logoComponent?: ReactNode;
  logoSource?: ImageSourcePropType;

  // Text customization
  title?: string;
  showTitle?: boolean;
  showDescription?: boolean;
  description?: string;
  updatePasswordButtonTitle?: string;
  cancelButtonTitle?: string;

  // Success state
  showUpdatePasswordSuccessfully?: boolean;
  updatePasswordSuccessTitle?: string;
  updatePasswordSuccessDescription?: string;
  updatePasswordSuccessButtonTitle?: string;
}

export function UpdatePasswordCore(props: UpdatePasswordCoreProps): ReactNode {
  const {
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
  } = useUpdatePasswordCore(props);
  const isSuccessView = isUpdatePasswordSuccess && props.showUpdatePasswordSuccessfully;

  if (isSuccessView) {
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
                  title={props.updatePasswordSuccessTitle ?? 'Password Updated Successfully'}
                  styles={props.styles.authBaseStyles.title}
                />
              </View>
            </View>
            <View style={props.styles.authBaseStyles.middleSection}>
              <CustomTextField
                title={props.updatePasswordSuccessDescription ?? 'Your password has been updated successfully'}
                styles={props.styles.authBaseStyles.subTitle}
              />
            </View>

            <View style={props.styles.authBaseStyles.bottomSection}>
              {props.onPasswordUpdatedButtonPress && (
                <CustomButton
                  onPress={props.onPasswordUpdatedButtonPress}
                  title={props.updatePasswordSuccessButtonTitle ?? t('auth.backToLogin')}
                  styles={props.styles.primaryButtonStyles}
                />
              )}
            </View>
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
          <Spinner visible={isLoading && props.showSpinnerOnSubmit} />

          <View style={props.styles.authBaseStyles.subContainer}>
            <View style={props.styles.authBaseStyles.topSection}>
              {(props.showTitle ?? true) && (
                <CustomTextField
                  title={props.title ?? t('auth.updatePassword')}
                  styles={props.styles.authBaseStyles.title}
                />
              )}
              {props.showDescription && (
                <CustomTextField
                  title={props.description ?? 'Enter your new password below'}
                  styles={props.styles.authBaseStyles.subTitle}
                />
              )}
            </View>

            <View style={props.styles.authBaseStyles.middleSection}>
              <CustomTextInput
                value={password}
                label={props.passwordInputLabel ?? t('auth.newPassword')}
                onChangeText={onChangePassword}
                secureTextEntry={true}
                autoCapitalize="none"
                styles={props.styles.textInputStyles}
                {...props.passwordInputProps}
              />
              <View>
                <CustomTextInput
                  value={matchingPassword}
                  label={props.passwordInputLabel ?? t('auth.confirmNewPassword')}
                  onChangeText={setMatchingPassword}
                  secureTextEntry={true}
                  autoCapitalize="none"
                  styles={{ ...props.styles.textInputStyles, ...props.styles.textInputStylesError }}
                  {...props.passwordInputProps}
                />
                <View style={props.styles.error}>
                  <ControlError title={errorMessage} />
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
                onPress={onUpdatePassword}
                title={props.updatePasswordButtonTitle ?? 'Update Password'}
                styles={props.styles.primaryButtonStyles}
                disabled={isLoading || !password?.trim() || !matchingPassword?.trim()}
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
        </View>
      </OptionalWrapper>
    </OptionalWrapper>
  );
}
