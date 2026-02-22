/**
 * Business logic for Practice screen - generates and manages practice problems
 */

import { useState, useEffect, useCallback, useRef } from 'react';

import { supabaseClient } from '@/api/supabase-client';
import {
  generatePracticeProblem,
  type GeneratedProblem,
} from '@/api/practice-problem-api';
import {
  type MathTopic,
  type DifficultyLevel,
  type PracticeSource,
  type MistakeCategory,
  type PracticeProblemV1,
  type UserMistakeV1,
  type MistakeTopicSummaryV1,
} from '@shared/generated-db-types.ts';
import {
  readUserPreferences,
  readRecentProblemAttempts,
} from '@shared/lumina-db.ts';
import { type PracticeProps } from '@/app/practice';

const TOPIC_LABELS: Record<MathTopic, string> = {
  FRACTIONS: 'Fractions',
  DECIMALS: 'Decimals',
  PERCENTAGES: 'Percentages',
  BASIC_ALGEBRA: 'Algebra',
  WORD_PROBLEMS: 'Word Problems',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  EASY: 'Easy',
  MEDIUM: 'Medium',
  HARD: 'Hard',
};

const MISTAKE_CATEGORY_LABELS: Record<MistakeCategory, string> = {
  COMPUTATIONAL: 'Calculation Error',
  CONCEPTUAL: 'Concept Misunderstanding',
  PROCEDURAL: 'Wrong Method',
  SIGN_ERROR: 'Sign Error',
  UNIT_CONVERSION: 'Unit Conversion',
  MISREAD_PROBLEM: 'Misread Problem',
  INCOMPLETE_SOLUTION: 'Incomplete Solution',
  OTHER: 'Other',
};

export interface DisplayProblem {
  id: string;
  topic: MathTopic;
  topicLabel: string;
  difficulty: DifficultyLevel;
  difficultyLabel: string;
  source: PracticeSource;
  problemText: string;
  hint?: string;
  solution: string;
  solutionSteps: string[];
  isFromMistake: boolean;
  mistakeCategory?: string;
}

export interface MistakeSummary {
  topic: MathTopic;
  topicLabel: string;
  totalMistakes: number;
  unresolvedMistakes: number;
  mostCommonCategory: string;
}

export interface SessionStats {
  problemsAttempted: number;
  problemsCorrect: number;
  accuracy: number;
  totalTimeInMs: number;
}

interface MistakeContext {
  topic: MathTopic;
  category: string;
  description?: string;
  occurrenceCount: number;
}

// Fallback problem templates (used when AI generation fails)
const FALLBACK_TEMPLATES: Record<MathTopic, Array<{ problem: string; solution: string; hint: string; steps: string[] }>> = {
  FRACTIONS: [
    {
      problem: 'Simplify the fraction: \\(\\frac{24}{36}\\)',
      solution: '\\(\\frac{2}{3}\\)',
      hint: 'Find the greatest common divisor (GCD) of 24 and 36',
      steps: ['Find GCD of 24 and 36 = 12', 'Divide both numerator and denominator by 12', '\\(\\frac{24 ÷ 12}{36 ÷ 12} = \\frac{2}{3}\\)'],
    },
  ],
  DECIMALS: [
    {
      problem: 'Convert \\(\\frac{3}{8}\\) to a decimal',
      solution: '0.375',
      hint: 'Divide the numerator by the denominator',
      steps: ['Divide 3 by 8', '3 ÷ 8 = 0.375'],
    },
  ],
  PERCENTAGES: [
    {
      problem: 'What is 25% of 80?',
      solution: '20',
      hint: 'Convert percentage to decimal and multiply',
      steps: ['25% = 0.25', '0.25 × 80 = 20'],
    },
  ],
  BASIC_ALGEBRA: [
    {
      problem: 'Solve for x: 3x + 7 = 22',
      solution: 'x = 5',
      hint: 'Isolate x by doing inverse operations',
      steps: ['Subtract 7 from both sides: 3x = 15', 'Divide both sides by 3: x = 5'],
    },
  ],
  WORD_PROBLEMS: [
    {
      problem: 'A train travels at 60 mph. How far will it travel in 2.5 hours?',
      solution: '150 miles',
      hint: 'Use the formula: distance = speed × time',
      steps: ['Distance = speed × time', 'Distance = 60 × 2.5', 'Distance = 150 miles'],
    },
  ],
};

function generateProblemFromMistake(mistake: UserMistakeV1): DisplayProblem | undefined {
  const topic = mistake.topic;
  if (topic == null) {
    return undefined;
  }

  // Generate a similar problem based on the mistake
  const templates = FALLBACK_TEMPLATES[topic];
  if (templates == null || templates.length < 1) {
    return undefined;
  }

  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: `generated-${mistake.id}`,
    topic,
    topicLabel: TOPIC_LABELS[topic],
    difficulty: 'MEDIUM',
    difficultyLabel: DIFFICULTY_LABELS.MEDIUM,
    source: 'MISTAKE_BASED',
    problemText: template.problem,
    hint: template.hint,
    solution: template.solution,
    solutionSteps: template.steps,
    isFromMistake: true,
    mistakeCategory: mistake.mistakeCategory != null ? MISTAKE_CATEGORY_LABELS[mistake.mistakeCategory] : undefined,
  };
}

function convertGeneratedProblemToDisplay(generated: GeneratedProblem, isFromMistake: boolean = false): DisplayProblem {
  const difficultyMap: Record<number, DifficultyLevel> = {
    1: 'EASY',
    2: 'EASY',
    3: 'MEDIUM',
    4: 'HARD',
    5: 'HARD',
  };
  const difficulty = difficultyMap[generated.difficulty] ?? 'MEDIUM';

  return {
    id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    topic: generated.topic,
    topicLabel: TOPIC_LABELS[generated.topic] ?? generated.topic,
    difficulty,
    difficultyLabel: DIFFICULTY_LABELS[difficulty],
    source: isFromMistake ? 'MISTAKE_BASED' : 'INTEREST_BASED',
    problemText: generated.problem,
    hint: generated.hint,
    solution: generated.solution,
    solutionSteps: generated.steps,
    isFromMistake,
  };
}

function generateFallbackProblem(topic: MathTopic, difficulty: DifficultyLevel = 'MEDIUM'): DisplayProblem | undefined {
  const templates = FALLBACK_TEMPLATES[topic];
  if (templates == null || templates.length < 1) {
    return undefined;
  }

  const template = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: `fallback-${topic}-${Date.now()}`,
    topic,
    topicLabel: TOPIC_LABELS[topic] ?? topic,
    difficulty,
    difficultyLabel: DIFFICULTY_LABELS[difficulty],
    source: 'INTEREST_BASED',
    problemText: template.problem,
    hint: template.hint,
    solution: template.solution,
    solutionSteps: template.steps,
    isFromMistake: false,
  };
}

function convertPracticeProblemToDisplay(problem: PracticeProblemV1): DisplayProblem {
  const topic = problem.topic ?? 'FRACTIONS';
  const difficulty = problem.difficulty ?? 'MEDIUM';

  return {
    id: problem.id,
    topic,
    topicLabel: TOPIC_LABELS[topic],
    difficulty,
    difficultyLabel: DIFFICULTY_LABELS[difficulty],
    source: problem.source ?? 'TOPIC_REVIEW',
    problemText: problem.problemText ?? '',
    hint: problem.hint ?? undefined,
    solution: problem.solution ?? '',
    solutionSteps: problem.solutionSteps ?? [],
    isFromMistake: problem.source === 'MISTAKE_BASED',
    mistakeCategory: undefined,
  };
}

export function formatTopicLabel(topic: MathTopic): string {
  return TOPIC_LABELS[topic] ?? topic;
}

export function usePractice(props: PracticeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentProblem, setCurrentProblem] = useState<DisplayProblem | undefined>(undefined);
  const [userAnswer, setUserAnswer] = useState('');
  const [showSolution, setShowSolution] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean | undefined>(undefined);
  const [mistakeSummaries, setMistakeSummaries] = useState<MistakeSummary[]>([]);
  const [mistakeContexts, setMistakeContexts] = useState<MistakeContext[]>([]);
  const [sessionStats, setSessionStats] = useState<SessionStats>({
    problemsAttempted: 0,
    problemsCorrect: 0,
    accuracy: 0,
    totalTimeInMs: 0,
  });
  const [pendingProblems, setPendingProblems] = useState<DisplayProblem[]>([]);
  const [interestTopics, setInterestTopics] = useState<MathTopic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<MathTopic | undefined>(undefined);
  const [hasUnresolvedMistakes, setHasUnresolvedMistakes] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<number>(2);

  const problemStartTimeRef = useRef<number>(Date.now());

  const loadPracticeData = useCallback(async function loadPracticeDataAsync(): Promise<void> {
    try {
      setIsLoading(true);

      // Load user preferences and recent problem attempts
      const [preferences, recentAttempts] = await Promise.all([
        readUserPreferences(supabaseClient),
        readRecentProblemAttempts(supabaseClient, 20),
      ]);

      // Set interest topics from preferences (use struggle topics as interest areas)
      const interests = preferences?.struggleTopics ?? [];
      setInterestTopics(interests.length > 0 ? interests : ['FRACTIONS', 'DECIMALS', 'BASIC_ALGEBRA']);

      // Analyze recent attempts to find areas that need practice
      // (problems where wasCorrectFirstTry is false)
      const incorrectAttempts = recentAttempts.filter((a) => !a.wasCorrectFirstTry && a.topic != null);
      
      if (incorrectAttempts.length > 0) {
        // Group by topic to create mistake summaries and contexts
        const topicCounts: Record<string, { total: number; topic: MathTopic }> = {};
        for (const attempt of incorrectAttempts) {
          if (attempt.topic != null) {
            if (topicCounts[attempt.topic] == null) {
              topicCounts[attempt.topic] = { total: 0, topic: attempt.topic };
            }
            topicCounts[attempt.topic].total++;
          }
        }

        const summaries: MistakeSummary[] = Object.values(topicCounts).map((item) => ({
          topic: item.topic,
          topicLabel: TOPIC_LABELS[item.topic] ?? item.topic,
          totalMistakes: item.total,
          unresolvedMistakes: item.total,
          mostCommonCategory: 'Needs Practice',
        }));

        // Create mistake contexts for AI generation
        const contexts: MistakeContext[] = Object.values(topicCounts).map((item) => ({
          topic: item.topic,
          category: 'Previous incorrect attempts',
          description: `Student got ${item.total} problems wrong in this topic recently`,
          occurrenceCount: item.total,
        }));

        setMistakeSummaries(summaries);
        setMistakeContexts(contexts);
        setHasUnresolvedMistakes(summaries.length > 0);
      }
    } catch (error) {
      console.error('loadPracticeData error:', error);
      // Set defaults even on error so UI still works
      setInterestTopics(['FRACTIONS', 'DECIMALS', 'BASIC_ALGEBRA']);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(function initPractice(): void {
    loadPracticeData().catch((error) => {
      console.error('initPractice error:', error);
    });
  }, [loadPracticeData]);

  const generateNextProblem = useCallback(async function generateNextProblemAsync(): Promise<void> {
    // Reset state
    setUserAnswer('');
    setShowSolution(false);
    setShowHint(false);
    setIsAnswerCorrect(undefined);
    problemStartTimeRef.current = Date.now();
    setIsGenerating(true);

    try {
      // First, check if there are pending problems
      if (pendingProblems.length > 0) {
        const nextProblem = pendingProblems[0];
        setCurrentProblem(nextProblem);
        setPendingProblems((prev) => prev.slice(1));
        setIsGenerating(false);
        return;
      }

      // Determine topic to use
      const topicsToUse = selectedTopic != null ? [selectedTopic] : interestTopics;
      const targetTopic = topicsToUse.length > 0
        ? topicsToUse[Math.floor(Math.random() * topicsToUse.length)]
        : 'FRACTIONS';

      // Check if we have mistake context for this topic
      const mistakeContext = mistakeContexts.find((m) => m.topic === targetTopic);

      try {
        // Try to generate AI problem
        const aiProblem = await generatePracticeProblem(
          targetTopic,
          selectedDifficulty,
          mistakeContext,
          mistakeContext == null ? `practicing ${TOPIC_LABELS[targetTopic] ?? targetTopic}` : undefined,
        );
        
        const displayProblem = convertGeneratedProblemToDisplay(aiProblem, mistakeContext != null);
        setCurrentProblem(displayProblem);
      } catch (aiError) {
        console.warn('AI generation failed, using fallback:', aiError);
        // Fallback to template problem
        const fallbackProblem = generateFallbackProblem(targetTopic, 'MEDIUM');
        if (fallbackProblem != null) {
          setCurrentProblem(fallbackProblem);
        }
      }
    } catch (error) {
      console.error('generateNextProblem error:', error);
    } finally {
      setIsGenerating(false);
    }
  }, [pendingProblems, interestTopics, selectedTopic, mistakeContexts, selectedDifficulty]);

  function onStartPractice(): void {
    // Generate the first problem
    generateNextProblemAsync().catch((error) => {
      console.error('onStartPractice error:', error);
    });
  }

  async function generateNextProblemAsync(): Promise<void> {
    await generateNextProblem();
  }

  function onSubmitAnswer(): void {
    if (currentProblem == null || userAnswer.trim() === '') {
      return;
    }

    const timeSpentInMs = Date.now() - problemStartTimeRef.current;

    // Simple answer checking (normalize and compare)
    const normalizedUserAnswer = userAnswer.toLowerCase().replace(/\s+/g, '').replace(/\$/g, '');
    const normalizedSolution = currentProblem.solution.toLowerCase().replace(/\s+/g, '').replace(/\$/g, '').replace(/\\[()]/g, '');

    const isCorrect = normalizedUserAnswer === normalizedSolution ||
      normalizedSolution.includes(normalizedUserAnswer) ||
      normalizedUserAnswer.includes(normalizedSolution.replace(/[^0-9.-]/g, ''));

    setIsAnswerCorrect(isCorrect);
    setShowSolution(true);

    // Update session stats locally
    setSessionStats((prev) => {
      const newAttempted = prev.problemsAttempted + 1;
      const newCorrect = prev.problemsCorrect + (isCorrect ? 1 : 0);
      return {
        problemsAttempted: newAttempted,
        problemsCorrect: newCorrect,
        accuracy: Math.round((newCorrect / newAttempted) * 100),
        totalTimeInMs: prev.totalTimeInMs + timeSpentInMs,
      };
    });
  }

  function onShowHint(): void {
    setShowHint(true);
  }

  function onNextProblem(): void {
    generateNextProblemAsync().catch((error) => {
      console.error('onNextProblem error:', error);
    });
  }

  function onSelectTopic(topic: MathTopic | undefined): void {
    setSelectedTopic(topic);
  }

  function onSelectDifficulty(difficulty: number): void {
    setSelectedDifficulty(Math.max(1, Math.min(5, difficulty)));
  }

  function onGoBack(): void {
    props.onGoBack();
  }

  const availableTopics: Array<{ value: MathTopic; label: string }> = [
    { value: 'FRACTIONS', label: 'Fractions' },
    { value: 'DECIMALS', label: 'Decimals' },
    { value: 'PERCENTAGES', label: 'Percentages' },
    { value: 'BASIC_ALGEBRA', label: 'Algebra' },
    { value: 'WORD_PROBLEMS', label: 'Word Problems' },
  ];

  const difficultyLevels: Array<{ value: number; label: string }> = [
    { value: 1, label: 'Very Easy' },
    { value: 2, label: 'Easy' },
    { value: 3, label: 'Medium' },
    { value: 4, label: 'Hard' },
    { value: 5, label: 'Very Hard' },
  ];

  return {
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
  };
}
