/**
 * Main container for the NotFound route
 * Friendly 404 error page for when users navigate to a non-existent route
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useNotFoundStyles } from './NotFoundStyles';
import { useNotFound } from './NotFoundFunc';
import { NotFoundProps } from '@/app/+not-found';

export default function NotFoundContainer(props: NotFoundProps): ReactNode {
  const { styles, goHomeButtonStyles } = useNotFoundStyles();
  const { titleMessage, subtitleMessage, goHomeButtonTitle, onGoHomePress } = useNotFound(props);

  const { isPlatformWeb } = useResponsiveDesign();
  const wrapperProps = {};

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.illustrationContainer}>
            <Text allowFontScaling={false} style={styles.illustrationText}>
              🤔
            </Text>
          </View>
          <CustomTextField styles={styles.title} title={titleMessage} />
          <CustomTextField styles={styles.subtitle} title={subtitleMessage} />
          <View style={styles.buttonContainer}>
            <CustomButton
              styles={goHomeButtonStyles}
              title={goHomeButtonTitle}
              onPress={onGoHomePress}
            />
          </View>
        </View>
      </View>
    </OptionalWrapper>
  );
}
