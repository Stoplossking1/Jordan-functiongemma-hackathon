-- Grade levels for middle school students (ages 11-15)
CREATE TYPE public.grade_level AS ENUM (
  'GRADE_6',
  'GRADE_7',
  'GRADE_8',
  'GRADE_9'
);

COMMENT ON TYPE public.grade_level IS '
description: Grade levels for middle school students
values:
  GRADE_6: Grade 6 (age 11-12)
  GRADE_7: Grade 7 (age 12-13)
  GRADE_8: Grade 8 (age 13-14)
  GRADE_9: Grade 9 (age 14-15)
';

-- Math topics that students can struggle with or master
CREATE TYPE public.math_topic AS ENUM (
  'FRACTIONS',
  'DECIMALS',
  'PERCENTAGES',
  'BASIC_ALGEBRA',
  'WORD_PROBLEMS'
);

COMMENT ON TYPE public.math_topic IS '
description: Math topics for tutoring
values:
  FRACTIONS: Working with fractions and mixed numbers
  DECIMALS: Decimal operations and conversions
  PERCENTAGES: Percentage calculations and applications
  BASIC_ALGEBRA: Variables, expressions, and simple equations
  WORD_PROBLEMS: Translating word problems into math
';

-- Achievement types that students can earn
CREATE TYPE public.achievement_type AS ENUM (
  'FIRST_PROBLEM_SOLVED',
  'FIVE_DAY_STREAK',
  'TEN_DAY_STREAK',
  'THIRTY_DAY_STREAK',
  'FRACTION_MASTER',
  'DECIMAL_MASTER',
  'PERCENTAGE_MASTER',
  'ALGEBRA_MASTER',
  'WORD_PROBLEM_MASTER',
  'TEN_PROBLEMS_SOLVED',
  'FIFTY_PROBLEMS_SOLVED',
  'HUNDRED_PROBLEMS_SOLVED'
);

COMMENT ON TYPE public.achievement_type IS '
description: Achievement badges that students can earn
values:
  FIRST_PROBLEM_SOLVED: Solved your first math problem
  FIVE_DAY_STREAK: Maintained a 5-day learning streak
  TEN_DAY_STREAK: Maintained a 10-day learning streak
  THIRTY_DAY_STREAK: Maintained a 30-day learning streak
  FRACTION_MASTER: Demonstrated mastery in fractions
  DECIMAL_MASTER: Demonstrated mastery in decimals
  PERCENTAGE_MASTER: Demonstrated mastery in percentages
  ALGEBRA_MASTER: Demonstrated mastery in basic algebra
  WORD_PROBLEM_MASTER: Demonstrated mastery in word problems
  TEN_PROBLEMS_SOLVED: Solved 10 problems total
  FIFTY_PROBLEMS_SOLVED: Solved 50 problems total
  HUNDRED_PROBLEMS_SOLVED: Solved 100 problems total
';

-- Problem solving status
CREATE TYPE public.problem_status AS ENUM (
  'SOLVED',
  'IN_PROGRESS',
  'NEEDS_REVIEW'
);

COMMENT ON TYPE public.problem_status IS '
description: Status of a math problem in a conversation
values:
  SOLVED: Problem solved successfully
  IN_PROGRESS: Problem attempted but not completed
  NEEDS_REVIEW: Problem solved but marked for review
';

-- Media type for user media library
CREATE TYPE public.media_type AS ENUM (
  'IMAGE',
  'VOICE_RECORDING'
);

COMMENT ON TYPE public.media_type IS '
description: Type of media in user library
values:
  IMAGE: Photo or image of a math problem
  VOICE_RECORDING: Voice recording describing a math problem
';

-- Mistake category for detailed tracking
CREATE TYPE public.mistake_category AS ENUM (
  'COMPUTATIONAL',
  'CONCEPTUAL',
  'PROCEDURAL',
  'SIGN_ERROR',
  'UNIT_CONVERSION',
  'MISREAD_PROBLEM',
  'INCOMPLETE_SOLUTION',
  'OTHER'
);

COMMENT ON TYPE public.mistake_category IS '
description: Categories of mistakes for detailed tracking
values:
  COMPUTATIONAL: Arithmetic or calculation errors
  CONCEPTUAL: Misunderstanding of mathematical concepts
  PROCEDURAL: Wrong steps or method used
  SIGN_ERROR: Errors with positive/negative signs
  UNIT_CONVERSION: Errors converting between units
  MISREAD_PROBLEM: Misinterpreting the problem statement
  INCOMPLETE_SOLUTION: Solution not fully completed
  OTHER: Other types of mistakes
';

-- Practice problem difficulty level
CREATE TYPE public.difficulty_level AS ENUM (
  'EASY',
  'MEDIUM',
  'HARD'
);

COMMENT ON TYPE public.difficulty_level IS '
description: Difficulty levels for practice problems
values:
  EASY: Basic problems for beginners
  MEDIUM: Moderate difficulty for practice
  HARD: Challenging problems for mastery
';

-- Practice problem source type
CREATE TYPE public.practice_source AS ENUM (
  'MISTAKE_BASED',
  'INTEREST_BASED',
  'TOPIC_REVIEW',
  'DAILY_CHALLENGE'
);

COMMENT ON TYPE public.practice_source IS '
description: Source/reason for generating a practice problem
values:
  MISTAKE_BASED: Generated based on previous mistakes
  INTEREST_BASED: Generated based on user interests
  TOPIC_REVIEW: Generated for topic review
  DAILY_CHALLENGE: Daily challenge problem
';
