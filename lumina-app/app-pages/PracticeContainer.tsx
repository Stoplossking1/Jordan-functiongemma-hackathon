/**
 * Main container for the Practice route - Practice Problems Interface
 * Generates personalized practice problems based on mistakes and interests
 */

import { type ReactNode } from 'react';
import { View, ScrollView, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { CustomHeader } from '@/comp-lib/custom-header/CustomHeader';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { LatexRenderer } from '@/comp-app/latex-renderer/LatexRenderer';
import { usePracticeStyles, type PracticeBaseStyles, type TopicChipStyles, type PracticeStyles } from './PracticeStyles';
import { usePractice, type DisplayProblem, type MistakeSummary, type SessionStats } from './PracticeFunc';
import { type PracticeProps } from '@/app/practice';
import { type MathTopic } from '@shared/generated-db-types.ts';

interface SessionStatsCardProps {
  stats: SessionStats;
  styles: PracticeBaseStyles;
}

function SessionStatsCard(props: SessionStatsCardProps): ReactNode {
  return (
    <View style={props.styles.statsCard}>
      <View style={props.styles.statsRow}>
        <View style={props.styles.statItem}>
          <CustomTextField title={`${props.stats.problemsAttempted}`} styles={props.styles.statValue} />
          <CustomTextField title="Attempted" styles={props.styles.statLabel} />
        </View>
        <View style={props.styles.statItem}>
          <CustomTextField title={`${props.stats.problemsCorrect}`} styles={props.styles.statValue} />
          <CustomTextField title="Correct" styles={props.styles.statLabel} />
        </View>
        <View style={props.styles.statItem}>
          <CustomTextField title={`${props.stats.accuracy}%`} styles={props.styles.statValue} />
          <CustomTextField title="Accuracy" styles={props.styles.statLabel} />
        </View>
      </View>
    </View>
  );
}

interface MistakeSummaryCardProps {
  mistake: MistakeSummary;
  styles: PracticeBaseStyles;
}

function MistakeSummaryCard(props: MistakeSummaryCardProps): ReactNode {
  return (
    <View style={props.styles.mistakeCard}>
      <View style={props.styles.mistakeTopicRow}>
        <CustomTextField title={props.mistake.topicLabel} styles={props.styles.mistakeTopicLabel} />
        <CustomTextField title={`${props.mistake.unresolvedMistakes} to review`} styles={props.styles.mistakeCount} />
      </View>
      <CustomTextField title={`Most common: ${props.mistake.mostCommonCategory}`} styles={props.styles.mistakeCategory} />
    </View>
  );
}

interface TopicChipProps {
  topic: { value: MathTopic; label: string };
  isSelected: boolean;
  onPress: () => void;
  chipStyles: TopicChipStyles;
}

function TopicChip(props: TopicChipProps): ReactNode {
  return (
    <Pressable
      style={[props.chipStyles.container, props.isSelected ? props.chipStyles.containerSelected : undefined]}
      onPress={props.onPress}
    >
      <CustomTextField
        title={props.topic.label}
        styles={[props.chipStyles.text, props.isSelected ? props.chipStyles.textSelected : undefined]}
      />
    </Pressable>
  );
}

interface ProblemCardProps {
  problem: DisplayProblem;
  showHint: boolean;
  onShowHint: () => void;
  styles: PracticeBaseStyles;
  hintButtonStyles: PracticeStyles['hintButtonStyles'];
}

function ProblemCard(props: ProblemCardProps): ReactNode {
  const { colors } = useStyleContext();

  return (
    <View style={props.styles.problemCard}>
      <View style={props.styles.problemHeader}>
        <View style={props.styles.problemTopicBadge}>
          <CustomTextField title={props.problem.topicLabel} styles={props.styles.problemTopicText} />
        </View>
        <View style={props.styles.problemDifficultyBadge}>
          <CustomTextField title={props.problem.difficultyLabel} styles={props.styles.problemDifficultyText} />
        </View>
        {props.problem.isFromMistake && (
          <View style={props.styles.problemSourceBadge}>
            <CustomTextField title="Based on your mistake" styles={props.styles.problemSourceText} />
          </View>
        )}
      </View>

      <LatexRenderer
        content={props.problem.problemText}
        textColor={colors.primaryForeground}
        fontSize={18}
      />

      {props.showHint && props.problem.hint != null ? (
        <View style={props.styles.hintContainer}>
          <CustomTextField title="💡 Hint" styles={props.styles.hintLabel} />
          <CustomTextField title={props.problem.hint} styles={props.styles.hintText} />
        </View>
      ) : props.problem.hint != null ? (
        <View style={props.styles.buttonContainer}>
          <CustomButton
            title="Show Hint"
            onPress={props.onShowHint}
            styles={props.hintButtonStyles}
            leftIcon={(iconProps) => <Ionicons name="bulb-outline" size={iconProps.size} color={iconProps.color as string} />}
          />
        </View>
      ) : undefined}
    </View>
  );
}

interface SolutionCardProps {
  problem: DisplayProblem;
  isCorrect: boolean | undefined;
  userAnswer: string;
  styles: PracticeBaseStyles;
}

function SolutionCard(props: SolutionCardProps): ReactNode {
  const { colors } = useStyleContext();

  return (
    <View style={props.styles.solutionSection}>
      <View style={props.styles.solutionHeader}>
        <CustomTextField title="Solution" styles={props.styles.solutionLabel} />
        {props.isCorrect != null && (
          <View style={props.isCorrect ? props.styles.correctBadge : props.styles.incorrectBadge}>
            <CustomTextField
              title={props.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
              styles={props.styles.resultBadgeText}
            />
          </View>
        )}
      </View>

      <LatexRenderer
        content={props.problem.solution}
        textColor={colors.primaryAccent}
        fontSize={20}
      />

      {props.problem.solutionSteps.length > 0 && (
        <View style={props.styles.solutionStepsContainer}>
          {props.problem.solutionSteps.map((step, index) => (
            <View key={index} style={props.styles.solutionStepRow}>
              <View style={props.styles.solutionStepNumber}>
                <CustomTextField title={`${index + 1}`} styles={props.styles.solutionStepNumberText} />
              </View>
              <LatexRenderer
                content={step}
                textColor={colors.secondaryForeground}
                fontSize={14}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

interface WelcomeSectionProps {
  hasUnresolvedMistakes: boolean;
  mistakeSummaries: MistakeSummary[];
  onStartPractice: () => void;
  styles: PracticeBaseStyles;
  primaryButtonStyles: PracticeStyles['primaryButtonStyles'];
}

function WelcomeSection(props: WelcomeSectionProps): ReactNode {
  return (
    <View>
      <View style={props.styles.welcomeSection}>
        <CustomTextField title="Practice Mode" styles={props.styles.welcomeTitle} />
        <CustomTextField
          title={props.hasUnresolvedMistakes
            ? 'Review your mistakes with personalized practice problems'
            : 'Practice problems based on your interests'}
          styles={props.styles.welcomeSubtitle}
        />
      </View>

      {props.mistakeSummaries.length > 0 && (
        <View style={props.styles.mistakeSummarySection}>
          <CustomTextField title="Areas to Improve" styles={props.styles.sectionTitle} />
          <CustomTextField title="Based on your recent mistakes" styles={props.styles.sectionSubtitle} />
          {props.mistakeSummaries.map((mistake) => (
            <MistakeSummaryCard key={mistake.topic} mistake={mistake} styles={props.styles} />
          ))}
        </View>
      )}

      <View style={props.styles.buttonContainer}>
        <CustomButton
          title={props.hasUnresolvedMistakes ? 'Start Practice (Review Mistakes)' : 'Start Practice'}
          onPress={props.onStartPractice}
          styles={props.primaryButtonStyles}
          leftIcon={(iconProps) => <Feather name="play" size={iconProps.size} color={iconProps.color as string} />}
        />
      </View>
    </View>
  );
}

export default function PracticeContainer(props: PracticeProps): ReactNode {
  const {
    isLoading,
    isGenerating,
    currentProblem,
    userAnswer,
    showSolution,
    showHint,
    isAnswerCorrect,
    mistakeSummaries,
    sessionStats,
    hasUnresolvedMistakes,
    selectedTopic,
    selectedDifficulty,
    availableTopics,
    difficultyLevels,
    setUserAnswer,
    onStartPractice,
    onSubmitAnswer,
    onShowHint,
    onNextProblem,
    onSelectTopic,
    onSelectDifficulty,
    onGoBack,
  } = usePractice(props);

  const { styles, customHeaderStyles, primaryButtonStyles, secondaryButtonStyles, hintButtonStyles, topicChipStyles } = usePracticeStyles();
  const { colors } = useStyleContext();
  const { isPlatformWeb } = useResponsiveDesign();

  const wrapperProps = { edges: ['top', 'left', 'right'] };

  if (isLoading) {
    return (
      <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
        <View style={styles.container}>
          <CustomHeader
            title="Practice"
            showBackButton={true}
            onGoBack={onGoBack}
            customHeaderStyles={customHeaderStyles}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primaryAccent} />
          </View>
        </View>
      </OptionalWrapper>
    );
  }

  return (
    <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
      <View style={styles.container}>
        <CustomHeader
          title="Practice"
          showBackButton={true}
          onGoBack={onGoBack}
          customHeaderStyles={customHeaderStyles}
        />

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Session Stats (always visible when practicing) */}
          {sessionStats.problemsAttempted > 0 && (
            <SessionStatsCard stats={sessionStats} styles={styles} />
          )}

          {/* Welcome/Start section when no problem is active */}
          {currentProblem == null && !isGenerating ? (
            <WelcomeSection
              hasUnresolvedMistakes={hasUnresolvedMistakes}
              mistakeSummaries={mistakeSummaries}
              onStartPractice={onStartPractice}
              styles={styles}
              primaryButtonStyles={primaryButtonStyles}
            />
          ) : isGenerating ? (
            <View style={styles.generatingContainer}>
              <ActivityIndicator size="large" color={colors.primaryAccent} />
              <CustomTextField title="Generating AI Problem..." styles={styles.generatingText} />
              <CustomTextField title="Creating a personalized problem just for you" styles={styles.generatingSubtext} />
            </View>
          ) : currentProblem != null ? (
            <View>
              {/* Topic and Difficulty Filter */}
              <View style={styles.topicFilterSection}>
                <CustomTextField title="Topic" styles={styles.sectionTitle} />
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicChipsScrollView}>
                  <View style={styles.topicChipsContainer}>
                    <TopicChip
                      topic={{ value: 'FRACTIONS' as MathTopic, label: 'All Topics' }}
                      isSelected={selectedTopic == null}
                      onPress={() => onSelectTopic(undefined)}
                      chipStyles={topicChipStyles}
                    />
                    {availableTopics.map((topic) => (
                      <TopicChip
                        key={topic.value}
                        topic={topic}
                        isSelected={selectedTopic === topic.value}
                        onPress={() => onSelectTopic(topic.value)}
                        chipStyles={topicChipStyles}
                      />
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.topicFilterSection}>
                <CustomTextField title="Difficulty" styles={styles.sectionTitle} />
                <View style={styles.topicChipsContainer}>
                  {difficultyLevels.map((level) => (
                    <TopicChip
                      key={level.value}
                      topic={{ value: 'FRACTIONS' as MathTopic, label: level.label }}
                      isSelected={selectedDifficulty === level.value}
                      onPress={() => onSelectDifficulty(level.value)}
                      chipStyles={topicChipStyles}
                    />
                  ))}
                </View>
              </View>

              {/* Problem Card */}
              <ProblemCard
                problem={currentProblem}
                showHint={showHint}
                onShowHint={onShowHint}
                styles={styles}
                hintButtonStyles={hintButtonStyles}
              />

              {/* Answer Input (when not showing solution) */}
              {!showSolution && (
                <View style={styles.answerSection}>
                  <View style={styles.answerInputContainer}>
                    <TextInput
                      style={styles.answerInput}
                      value={userAnswer}
                      onChangeText={setUserAnswer}
                      placeholder="Enter your answer..."
                      placeholderTextColor={colors.tertiaryForeground}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                  </View>
                </View>
              )}

              {/* Solution Card (when showing solution) */}
              {showSolution && (
                <SolutionCard
                  problem={currentProblem}
                  isCorrect={isAnswerCorrect}
                  userAnswer={userAnswer}
                  styles={styles}
                />
              )}

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {!showSolution ? (
                  <CustomButton
                    title="Check Answer"
                    onPress={onSubmitAnswer}
                    styles={primaryButtonStyles}
                    leftIcon={(iconProps) => <Ionicons name="checkmark-circle" size={iconProps.size} color={iconProps.color as string} />}
                  />
                ) : (
                  <CustomButton
                    title="Next Problem"
                    onPress={onNextProblem}
                    styles={primaryButtonStyles}
                    leftIcon={(iconProps) => <Ionicons name="arrow-forward" size={iconProps.size} color={iconProps.color as string} />}
                  />
                )}
              </View>
            </View>
          ) : undefined}
        </ScrollView>
      </View>
    </OptionalWrapper>
  );
}

