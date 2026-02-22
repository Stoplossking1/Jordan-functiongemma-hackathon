/**
 * Main container for the Profile route
 */

import { type ReactNode } from 'react';
import { Image, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { FormControl } from '@/comp-lib/form/FormControl';
import { KeyboardAvoidingWrapper } from '@/comp-lib/keyboard-avoiding-wrapper/KeyboardAvoidingWrapper';
import { useProfileStyles } from './ProfileStyles';
import { useProfile } from './ProfileFunc';
import { ProfileProps } from '@/app/onboarding/profile';

const ILLUSTRATION_URL = 'https://images.pexels.com/photos/8500648/pexels-photo-8500648.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function ProfileContainer(props: ProfileProps): ReactNode {
  const { styles, formControlStyles, nextButtonStyles, gradeButtonStyles } = useProfileStyles();
  const {
    controls,
    currentStep,
    totalSteps,
    formState,
    gradeOptions,
    greetingPreview,
    nameError,
    gradeError,
    isSaving,
    handleValueChange,
    onSelectGrade,
    onHandleSubmit,
    getGradeButtonStyle,
  } = useProfile(props);

  const { isPlatformWeb } = useResponsiveDesign();
  const wrapperProps = {};

  const ScrollWrapper = isPlatformWeb ? ScrollView : KeyboardAvoidingWrapper;

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <ScrollWrapper>
        <View style={styles.container}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
            <CustomTextField styles={styles.progressText} title={`Step ${currentStep} of ${totalSteps}`} />
          </View>

          <View style={styles.illustrationContainer}>
            <Image
              source={{ uri: ILLUSTRATION_URL }}
              style={styles.illustration}
              resizeMode="cover"
            />
          </View>

          <View style={styles.pageTitleSection}>
            <CustomTextField styles={styles.title} title={"Hi there! 👋"} />
            <CustomTextField styles={styles.subtitle} title={"Let's get to know you so I can help you better"} />
          </View>

          <View style={styles.contentContainer}>
            {/* Name Input */}
            <View>
              <CustomTextField styles={styles.sectionLabel} title="What should I call you?" />
              {controls.map((control) => (
                <FormControl
                  key={control.data}
                  {...control}
                  value={formState[control.data]}
                  onValueChange={(val) => handleValueChange(control.data, val)}
                  showTextInputErrorStyle={!!nameError}
                  styles={formControlStyles}
                />
              ))}
              {nameError ? <CustomTextField styles={styles.errorText} title={nameError} /> : null}
            </View>

            {/* Greeting Preview */}
            {greetingPreview ? (
              <View style={styles.greetingPreviewContainer}>
                <CustomTextField styles={styles.greetingPreviewEmoji} title="✨" />
                <CustomTextField styles={styles.greetingPreviewText} title={greetingPreview} />
              </View>
            ) : null}

            {/* Grade Selection */}
            <View style={styles.gradeButtonsContainer}>
              <CustomTextField styles={styles.sectionLabel} title="What grade are you in?" />
              <View style={styles.gradeButtonsRow}>
                <CustomButton
                  styles={getGradeButtonStyle(gradeOptions[0].value, gradeButtonStyles)}
                  title={gradeOptions[0].label}
                  onPress={() => onSelectGrade(gradeOptions[0].value)}
                />
                <CustomButton
                  styles={getGradeButtonStyle(gradeOptions[1].value, gradeButtonStyles)}
                  title={gradeOptions[1].label}
                  onPress={() => onSelectGrade(gradeOptions[1].value)}
                />
              </View>
              <View style={styles.gradeButtonsRow}>
                <CustomButton
                  styles={getGradeButtonStyle(gradeOptions[2].value, gradeButtonStyles)}
                  title={gradeOptions[2].label}
                  onPress={() => onSelectGrade(gradeOptions[2].value)}
                />
                <CustomButton
                  styles={getGradeButtonStyle(gradeOptions[3].value, gradeButtonStyles)}
                  title={gradeOptions[3].label}
                  onPress={() => onSelectGrade(gradeOptions[3].value)}
                />
              </View>
              {gradeError ? <CustomTextField styles={styles.errorText} title={gradeError} /> : null}
            </View>
          </View>

          {/* Continue Button */}
          <View style={styles.footerContainer}>
            <CustomButton 
              styles={nextButtonStyles} 
              title="Continue" 
              onPress={onHandleSubmit}
              isLoading={isSaving}
              disabled={isSaving}
            />
          </View>
        </View>
      </ScrollWrapper>
    </OptionalWrapper>
  );
}
