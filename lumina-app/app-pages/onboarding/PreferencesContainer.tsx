/**
 * Main container for the Preferences route
 */

import { type ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { t } from '@/i18n';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomHeader } from '@/comp-lib/custom-header/CustomHeader';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { CustomTextInput } from '@/comp-lib/core/custom-text-input/CustomTextInput';
import { KeyboardAvoidingWrapper } from '@/comp-lib/keyboard-avoiding-wrapper/KeyboardAvoidingWrapper';
import { usePreferencesStyles, type TopicChipStyles } from './PreferencesStyles';
import { usePreferences, type MathTopicOption } from './PreferencesFunc';
import { PreferencesProps } from '@/app/onboarding/preferences';
import { type MathTopic } from '@shared/generated-db-types';

interface TopicChipProps {
  option: MathTopicOption;
  isSelected: boolean;
  onPress: (value: MathTopic) => void;
  styles: TopicChipStyles;
}

function TopicChip(props: TopicChipProps): ReactNode {
  const { option, isSelected, onPress, styles } = props;

  return (
    <Pressable
      onPress={() => onPress(option.value)}
      style={[styles.chip, isSelected && styles.chipSelected]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
    >
      <CustomTextField
        styles={[styles.chipText, isSelected && styles.chipTextSelected]}
        title={option.label}
      />
    </Pressable>
  );
}

export default function PreferencesContainer(props: PreferencesProps): ReactNode {
  const { styles, topicChipStyles, concernsInputStyles, nextButtonStyles, headerStyles } = usePreferencesStyles();
  const {
    topicOptions,
    selectedTopics,
    concernsText,
    concernsMaxLength,
    currentStep,
    totalSteps,
    topicError,
    isSubmitEnabled,
    onToggleTopic,
    onConcernsChange,
    onHandleSubmit,
  } = usePreferences(props);

  const { isPlatformWeb } = useResponsiveDesign();

  const ScrollWrapper = isPlatformWeb ? ScrollView : KeyboardAvoidingWrapper;

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea}>
      <ScrollWrapper>
        <CustomHeader
          showBackButton={true}
          onGoBack={props.onGoBack}
          SubtitleComponent={
            <CustomTextField
              styles={headerStyles.progressText}
              title={`${t('onboarding.step')} ${currentStep} / ${totalSteps}`}
            />
          }
        />
        <View style={styles.container}>
          <View style={styles.pageTitleSection}>
            <CustomTextField styles={styles.title} title={"What would you like help with?"} />
            <CustomTextField styles={styles.subtitle} title={"Select the topics you find tricky. I'll focus on these!"} />
          </View>

          <View style={styles.contentContainer}>
            {/* Topic Selection */}
            <View>
              <CustomTextField styles={styles.sectionLabel} title="Tap all that apply" />
              <View style={styles.topicsContainer}>
                {topicOptions.map((option) => (
                  <TopicChip
                    key={option.value}
                    option={option}
                    isSelected={selectedTopics.includes(option.value)}
                    onPress={onToggleTopic}
                    styles={topicChipStyles}
                  />
                ))}
              </View>
              {topicError ? (
                <CustomTextField styles={styles.errorText} title={topicError} />
              ) : null}
            </View>

            {/* Optional Concerns */}
            <View style={styles.concernsSection}>
              <CustomTextField styles={styles.sectionLabel} title="Anything else? (optional)" />
              <CustomTextInput
                value={concernsText}
                onChangeText={onConcernsChange}
                placeholder="E.g., I get confused with negative numbers..."
                multiline={true}
                maxLength={concernsMaxLength}
                styles={concernsInputStyles}
              />
              <CustomTextField
                styles={styles.characterCount}
                title={`${concernsText.length}/${concernsMaxLength}`}
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.buttonContainer}>
            <CustomButton
              styles={nextButtonStyles}
              title={"Let's Go!"}
              onPress={onHandleSubmit}
              disabled={!isSubmitEnabled}
            />
          </View>
        </View>
      </ScrollWrapper>
    </OptionalWrapper>
  );
}
