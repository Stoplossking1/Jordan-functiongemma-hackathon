/**
 * Main container for the Progress route
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, ScrollView, View } from 'react-native';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { t } from '@/i18n';
import { useProgressStyles } from './ProgressStyles';
import { useProgress } from './ProgressFunc';
import { ProgressProps } from '@/app/(tabs)/progress';

export default function ProgressContainer(props: ProgressProps): ReactNode {
  const { styles, primaryActionButtonStyles, secondaryActionButtonStyles } = useProgressStyles();
  const {
    isLoading,
    errorMessage,
    isEmpty,
    statItems,
    focusTopicInsight,
    strongTopicInsight,
    achievementSummary,
    streakSummary,
    onRetry,
    onContinuePractice,
  } = useProgress(props);

  const { isPlatformWeb } = useResponsiveDesign();
  const wrapperProps = { edges: ['top', 'left', 'right'] };
  const showProgressContent = !isLoading && errorMessage == null && !isEmpty;

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          <View style={styles.headerSection}>
            <CustomTextField styles={styles.title} title="Progress" />
            <CustomTextField styles={styles.description} title="Track your streaks, mastery, and badges in one place." />
          </View>

          {isLoading ? (
            <View style={styles.stateCard}>
              <ActivityIndicator size="small" />
              <CustomTextField styles={styles.stateTitle} title="Loading progress..." />
              <CustomTextField styles={styles.stateDescription} title="Pulling your latest learning stats." />
            </View>
          ) : null}

          {errorMessage != null ? (
            <View style={styles.stateCard}>
              <CustomTextField styles={styles.stateTitle} title="Progress unavailable" />
              <CustomTextField styles={styles.stateDescription} title={errorMessage} />
              <View style={styles.stateActionContainer}>
                <CustomButton styles={secondaryActionButtonStyles} title={t('errors.tryAgain')} onPress={onRetry} />
              </View>
            </View>
          ) : null}

          {isEmpty && !isLoading && errorMessage == null ? (
            <View style={styles.stateCard}>
              <CustomTextField styles={styles.stateTitle} title="No progress yet" />
              <CustomTextField
                styles={styles.stateDescription}
                title="Start with one practice problem and your progress summary will appear here."
              />
            </View>
          ) : null}

          {showProgressContent ? (
            <>
              <View style={styles.section}>
                <CustomTextField styles={styles.sectionTitle} title="At a glance" />
                <View style={styles.statsGrid}>
                  {statItems.map((statItem) => (
                    <View key={statItem.id} style={styles.statCard}>
                      <CustomTextField styles={styles.statTitle} title={statItem.title} />
                      <CustomTextField styles={styles.statValue} title={statItem.value} />
                      <CustomTextField styles={styles.statHelperText} title={statItem.helperText} />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <CustomTextField styles={styles.sectionTitle} title="Topic insights" />
                {focusTopicInsight != null ? (
                  <View style={styles.summaryCard}>
                    <CustomTextField styles={styles.summaryTitle} title="Focus topic" />
                    <CustomTextField styles={styles.summaryValue} title={focusTopicInsight.label} />
                    <CustomTextField
                      styles={styles.summaryDetails}
                      title={`${focusTopicInsight.masteryText} • ${focusTopicInsight.attemptsText}`}
                    />
                  </View>
                ) : null}
                {strongTopicInsight != null ? (
                  <View style={styles.summaryCard}>
                    <CustomTextField styles={styles.summaryTitle} title="Strong topic" />
                    <CustomTextField styles={styles.summaryValue} title={strongTopicInsight.label} />
                    <CustomTextField
                      styles={styles.summaryDetails}
                      title={`${strongTopicInsight.masteryText} • ${strongTopicInsight.attemptsText}`}
                    />
                  </View>
                ) : null}
              </View>

              <View style={styles.section}>
                <CustomTextField styles={styles.sectionTitle} title="Milestones" />
                <View style={styles.summaryCard}>
                  <CustomTextField styles={styles.summaryTitle} title={achievementSummary.title} />
                  <CustomTextField styles={styles.summaryValue} title={achievementSummary.value} />
                  <CustomTextField styles={styles.summaryDetails} title={achievementSummary.details} />
                </View>
                <View style={styles.summaryCard}>
                  <CustomTextField styles={styles.summaryTitle} title={streakSummary.title} />
                  <CustomTextField styles={styles.summaryValue} title={streakSummary.value} />
                  <CustomTextField styles={styles.summaryDetails} title={streakSummary.details} />
                </View>
              </View>
            </>
          ) : null}

          <View style={styles.actionSection}>
            <CustomButton styles={primaryActionButtonStyles} title="Practice now" onPress={onContinuePractice} />
          </View>
        </View>
      </ScrollView>
    </OptionalWrapper>
  );
}
