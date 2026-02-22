import React, { type ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';

import { t } from '@/i18n';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';

import { useErrorModalStyles } from './ErrorModalStyles';
import { useErrorModal } from './ErrorModalFunc';
import { ErrorDevInfo } from './ErrorDevInfo';

interface ErrorModalProps {
  projectId?: string;
  onClose: () => void;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

export function ErrorModal(props: ErrorModalProps): ReactNode {
  const { styles, tryAgainButtonStyle, isPhone, isPlatformWeb, isPlatformNative, wrapperProps, moreInfoButtonStyle } =
    useErrorModalStyles();
  const { showMoreInfo, toggleMoreInfo } = useErrorModal(props);

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <View style={styles.container}>
        <View style={[styles.content, !isPhone && styles.contentWeb]}>
          {showMoreInfo ? (
            <ErrorDevInfo error={props.error} errorInfo={props.errorInfo} onHideInfo={toggleMoreInfo} />
          ) : (
            <>
              <View style={styles.iconContainer}>
                <Image
                  source={require('@/assets/images/wizard-error.png')}
                  style={styles.wizardImage}
                  contentFit="contain"
                />
              </View>

              <CustomTextField title={t('errors.wizardErrorTitle')} styles={styles.titleStyle} />

              {isPlatformNative && (
                <CustomTextField title={t('errors.wizardErrorDescription')} styles={styles.subtitleStyle} />
              )}

              {props.projectId && (
                <View style={styles.projectIdContainer}>
                  <CustomTextField
                    title={`${t('errors.projectId')}\n${props.projectId}`}
                    styles={styles.projectIdStyle}
                  />
                </View>
              )}

              <View style={styles.buttonContainer}>
                <CustomButton title={t('errors.refreshApp')} styles={tryAgainButtonStyle} onPress={props.onClose} />
                <CustomButton title={t('errors.moreInfo')} styles={moreInfoButtonStyle} onPress={toggleMoreInfo} />
              </View>
            </>
          )}
        </View>
      </View>
    </OptionalWrapper>
  );
}
