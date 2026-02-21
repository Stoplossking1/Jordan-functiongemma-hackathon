/**
 * Main container for the Index route - Welcome landing page
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useIndexStyles } from './IndexStyles';
import { useIndex } from './IndexFunc';
import { IndexProps } from '@/app/index';

interface ValuePropositionItemProps {
  iconName: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  styles: {
    container: object;
    iconContainer: object;
    textContainer: object;
    title: object;
    description: object;
    iconSize: number;
    iconColor: string;
  };
}

function ValuePropositionItem(props: ValuePropositionItemProps): ReactNode {
  return (
    <View style={props.styles.container}>
      <View style={props.styles.iconContainer}>
        <Feather
          name={props.iconName}
          size={props.styles.iconSize}
          color={props.styles.iconColor}
        />
      </View>
      <View style={props.styles.textContainer}>
        <CustomTextField styles={props.styles.title} title={props.title} />
        <CustomTextField styles={props.styles.description} title={props.description} />
      </View>
    </View>
  );
}

export default function IndexContainer(props: IndexProps): ReactNode {
  const {
    styles,
    primaryButtonStyles,
    secondaryButtonStyles,
    valuePropositionItemStyles,
  } = useIndexStyles();
  const { appName, tagline, subtitle, valuePropositions } = useIndex(props);

  const { isPlatformWeb } = useResponsiveDesign();
  const wrapperProps = {};

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/8197527/pexels-photo-8197527.jpeg?auto=compress&cs=tinysrgb&h=650&w=940' }}
              style={styles.heroImage}
              contentFit="cover"
            />
          </View>

          <View style={styles.contentContainer}>
            <CustomTextField styles={styles.appName} title={appName} />
            <CustomTextField styles={styles.tagline} title={tagline} />
            <CustomTextField styles={styles.subtitle} title={subtitle} />

            <View style={styles.valuePropositionsContainer}>
              {valuePropositions.map((item) => (
                <ValuePropositionItem
                  key={item.id}
                  iconName={item.iconName}
                  title={item.title}
                  description={item.description}
                  styles={valuePropositionItemStyles}
                />
              ))}
            </View>

            <View style={styles.buttonsContainer}>
              <CustomButton
                styles={primaryButtonStyles}
                title="Get Started"
                onPress={() => props.onNavigateToSignup()}
              />
              <CustomButton
                styles={secondaryButtonStyles}
                title="I have an account"
                onPress={() => props.onNavigateToLogin()}
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </OptionalWrapper>
  );
}
