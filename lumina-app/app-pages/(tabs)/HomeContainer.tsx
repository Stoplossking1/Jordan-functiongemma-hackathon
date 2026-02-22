/**
 * Main container for the Home route - Lumina's primary screen
 * Features the "Snap a Problem" camera functionality for instant math tutoring
 */

import { type ReactNode } from 'react';
import 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { ProblemCapture } from '@/comp-app/problem-capture/ProblemCapture';
import { useHomeStyles, RecentProblemItemStyles } from './HomeStyles';
import { useHome, RecentProblem, formatMathTopicDisplay } from './HomeFunc';
import { HomeProps } from '@/app/(tabs)/home';

interface RecentProblemItemProps {
  problem: RecentProblem;
  onPress: () => void;
  styles: RecentProblemItemStyles;
  iconColor: string;
}

function RecentProblemItem(props: RecentProblemItemProps): ReactNode {
  return (
    <View style={props.styles.container}>
      <Pressable style={props.styles.pressable} onPress={props.onPress}>
        <View style={props.styles.content}>
          <CustomTextField styles={props.styles.title} title={props.problem.title} />
          <View style={props.styles.metaRow}>
            <CustomTextField styles={props.styles.category} title={formatMathTopicDisplay(props.problem.category)} />
            <CustomTextField styles={props.styles.meta} title={`• ${props.problem.solvedAt}`} />
          </View>
        </View>
        <View style={props.styles.chevron}>
          <Feather name="chevron-right" size={20} color={props.iconColor} />
        </View>
      </Pressable>
    </View>
  );
}

export default function HomeContainer(props: HomeProps): ReactNode {
  const { styles, cameraButtonStyles, chatHistoryButtonStyles, recentProblemItemStyles } = useHomeStyles();
  const { colors } = useStyleContext();
  const {
    displayName,
    streakCount,
    problemsSolvedToday,
    recentProblems,
    onSnapProblem,
    onRecordVoice,
    onTypeProblem,
    isProblemCaptureVisible,
    isSubmittingProblemCapture,
    problemCaptureErrorMessage,
    onCancelProblemCapture,
    onCompleteProblemCapture,
    onReviewProblem,
    onOpenChatHistory,
  } = useHome(props);

  const { isPlatformWeb } = useResponsiveDesign();
  const wrapperProps = { edges: ['top', 'left', 'right'] };

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Greeting and Streak Section */}
          <View style={styles.greetingSection}>
            <View>
              <CustomTextField styles={styles.greeting} title={`Hey ${displayName}!`} />
              <CustomTextField styles={styles.greetingName} title="Ready to learn?" />
            </View>
            <View style={styles.streakContainer}>
              <View style={styles.streakIconContainer}>
                <Feather name="zap" size={16} color={colors.secondaryBackground} />
              </View>
              <CustomTextField styles={styles.streakCount} title={`${streakCount}`} />
              <CustomTextField styles={styles.streakText} title=" day streak" />
            </View>
          </View>

          {/* Quick Actions Section */}
          <View style={styles.quickActionsSection}>
            <View style={styles.quickActionsRow}>
              <Pressable style={styles.quickActionButton} onPress={onRecordVoice}>
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="mic" size={24} color={colors.primaryAccent} />
                </View>
                <CustomTextField styles={styles.quickActionLabel} title="Record" />
              </Pressable>
              <Pressable style={styles.quickActionButton} onPress={onTypeProblem}>
                <View style={styles.quickActionIconContainer}>
                  <Ionicons name="chatbubble-ellipses" size={24} color={colors.primaryAccent} />
                </View>
                <CustomTextField styles={styles.quickActionLabel} title="Type" />
              </Pressable>
            </View>
          </View>

          {/* Hero Camera Button Section */}
          <View style={styles.heroSection}>
            <Pressable
              style={[styles.cameraButtonPressable, isSubmittingProblemCapture ? styles.cameraButtonPressableDisabled : undefined]}
              onPress={onSnapProblem}
              disabled={isSubmittingProblemCapture}
            >
              <View style={styles.cameraButtonOuter}>
                <View style={styles.cameraButtonInner}>
                  {isSubmittingProblemCapture ? (
                    <View style={styles.cameraLoadingContainer}>
                      <ActivityIndicator size="large" color={colors.secondaryBackground} />
                    </View>
                  ) : (
                    <View style={styles.cameraIconContainer}>
                      <Feather name="camera" size={48} color={colors.secondaryBackground} />
                    </View>
                  )}
                </View>
              </View>
            </Pressable>
            <CustomTextField styles={styles.cameraButtonLabel} title="Snap a Problem" />
            {problemCaptureErrorMessage ? (
              <CustomTextField styles={styles.cameraErrorText} title={problemCaptureErrorMessage} />
            ) : undefined}
          </View>

          {/* Stats Card */}
          <View style={styles.statsCard}>
            <CustomTextField styles={styles.statsNumber} title={`${problemsSolvedToday}`} />
            <CustomTextField styles={styles.statsLabel} title="problems solved today" />
          </View>

          {/* Recent Activity Section */}
          <View style={styles.recentSection}>
            <View style={styles.sectionHeader}>
              <CustomTextField styles={styles.sectionTitle} title="Recent Activity" />
            </View>
            {recentProblems.length > 0 ? (
              <View style={styles.recentList}>
                {recentProblems.map((problem) => (
                  <RecentProblemItem
                    key={problem.id}
                    problem={problem}
                    onPress={() => onReviewProblem(problem.id)}
                    styles={recentProblemItemStyles}
                    iconColor={cameraButtonStyles.icon.color as string}
                  />
                ))}
              </View>
            ) : (
              <CustomTextField styles={styles.emptyText} title="No problems solved yet. Snap your first problem!" />
            )}
          </View>

          {/* Chat History Button */}
          <View style={styles.chatHistoryContainer}>
            <CustomButton
              styles={chatHistoryButtonStyles}
              title="Chat History"
              leftIcon={(iconProps) => <Feather name="message-circle" size={iconProps.size} color={iconProps.color as string} />}
              onPress={onOpenChatHistory}
            />
          </View>

          {/* Practice Button */}
          <View style={styles.chatHistoryContainer}>
            <CustomButton
              styles={chatHistoryButtonStyles}
              title="Practice Problems"
              leftIcon={(iconProps) => <Ionicons name="fitness" size={iconProps.size} color={iconProps.color as string} />}
              onPress={() => router.push('/practice')}
            />
          </View>
        </View>
      </ScrollView>
      <ProblemCapture
        isVisible={isProblemCaptureVisible}
        isSubmitting={isSubmittingProblemCapture}
        externalErrorMessage={problemCaptureErrorMessage}
        onCancel={onCancelProblemCapture}
        onSubmitImage={onCompleteProblemCapture}
      />
    </OptionalWrapper>
  );
}
