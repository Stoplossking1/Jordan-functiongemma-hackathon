-- Seed data for Lumina app

-- Create lumina profiles for test users
INSERT INTO private.lumina_profile (id, grade_level, onboarding_completed)
VALUES
  (uuid_at(1, 1), 'GRADE_7', true),
  (uuid_at(1, 2), 'GRADE_8', true)
ON CONFLICT (id) DO NOTHING;

-- Create user preferences for test users
INSERT INTO private.user_preferences (id, struggle_topics, learning_concerns, notifications_enabled)
VALUES
  (uuid_at(1, 1), ARRAY['FRACTIONS', 'PERCENTAGES']::public.math_topic[], 'I find word problems confusing', true),
  (uuid_at(1, 2), ARRAY['BASIC_ALGEBRA']::public.math_topic[], NULL, true)
ON CONFLICT (id) DO NOTHING;

-- Create user progress for test users
INSERT INTO private.user_progress (id, current_streak, longest_streak, problems_solved_today, total_problems_solved, last_active_date)
VALUES
  (uuid_at(1, 1), 7, 14, 3, 42, CURRENT_DATE),
  (uuid_at(1, 2), 3, 10, 1, 25, CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;

-- Update profile given_name for test users
UPDATE private.profile SET given_name = 'Joe' WHERE id = uuid_at(1, 1) AND given_name IS NULL;
UPDATE private.profile SET given_name = 'Jane' WHERE id = uuid_at(1, 2) AND given_name IS NULL;

-- Create conversations for user 1 (woz@example.com)
INSERT INTO private.conversation (id, owner_entity_id, subject, updated_at)
VALUES
  (uuid_at(100, 1), uuid_at(1, 1), 'Adding fractions', CURRENT_TIMESTAMP - INTERVAL '10 minutes'),
  (uuid_at(100, 2), uuid_at(1, 1), 'Percentage calculation', CURRENT_TIMESTAMP - INTERVAL '1 hour'),
  (uuid_at(100, 3), uuid_at(1, 1), 'Solving for x', CURRENT_TIMESTAMP - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- Add user as participant in their own conversations
INSERT INTO private.conversation_participant (conversation_id, entity_id)
VALUES
  (uuid_at(100, 1), uuid_at(1, 1)),
  (uuid_at(100, 2), uuid_at(1, 1)),
  (uuid_at(100, 3), uuid_at(1, 1))
ON CONFLICT (conversation_id, entity_id) DO NOTHING;

-- Create lumina conversation metadata
INSERT INTO private.lumina_conversation (id, title, topic, status)
VALUES
  (uuid_at(100, 1), '2/3 + 1/4 = ?', 'FRACTIONS', 'SOLVED'),
  (uuid_at(100, 2), '25% of 80', 'PERCENTAGES', 'SOLVED'),
  (uuid_at(100, 3), '3x + 5 = 14', 'BASIC_ALGEBRA', 'SOLVED')
ON CONFLICT (id) DO NOTHING;

-- Add bot entity for math tutor conversations
INSERT INTO private.entity (id, entity_type, name)
VALUES (uuid_at(0, 100), 'BOT', 'Lumina Math Tutor')
ON CONFLICT (id) DO NOTHING;

-- Add bot as participant in user 1's conversations
INSERT INTO private.conversation_participant (conversation_id, entity_id)
VALUES
  (uuid_at(100, 1), uuid_at(0, 100)),
  (uuid_at(100, 2), uuid_at(0, 100)),
  (uuid_at(100, 3), uuid_at(0, 100))
ON CONFLICT (conversation_id, entity_id) DO NOTHING;

-- Add sample conversation messages with solution steps for conversation 1 (fractions)
INSERT INTO private.conversation_message (id, conversation_id, prev_message_id, author_entity_id, content_text, context)
VALUES
  -- User asks about the problem
  (uuid_at(101, 1), uuid_at(100, 1), null, uuid_at(1, 1), 'Can you help me solve 2/3 + 1/4?', null),
  -- Bot responds with solution steps
  (uuid_at(101, 2), uuid_at(100, 1), uuid_at(101, 1), uuid_at(0, 100), 
   'Of course! Let me walk you through adding these fractions step by step.',
   '{"solutionSteps": [{"stepNumber": 1, "explanation": "First, find a common denominator. The LCD of 3 and 4 is 12."}, {"stepNumber": 2, "explanation": "Convert 2/3 to 8/12 (multiply top and bottom by 4)."}, {"stepNumber": 3, "explanation": "Convert 1/4 to 3/12 (multiply top and bottom by 3)."}, {"stepNumber": 4, "explanation": "Now add: 8/12 + 3/12 = 11/12"}]}'::jsonb),
  -- Bot celebration message
  (uuid_at(101, 3), uuid_at(100, 1), uuid_at(101, 2), uuid_at(0, 100),
   '',
   '{"isCelebration": true, "celebrationText": "🎉 Great job! The answer is 11/12"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Add sample conversation messages for conversation 2 (percentages)
INSERT INTO private.conversation_message (id, conversation_id, prev_message_id, author_entity_id, content_text, context)
VALUES
  (uuid_at(102, 1), uuid_at(100, 2), null, uuid_at(1, 1), 'What is 25% of 80?', null),
  (uuid_at(102, 2), uuid_at(100, 2), uuid_at(102, 1), uuid_at(0, 100),
   'Let me show you how to calculate percentages!',
   '{"solutionSteps": [{"stepNumber": 1, "explanation": "25% means 25 out of 100, or 25/100 = 0.25"}, {"stepNumber": 2, "explanation": "Multiply: 0.25 × 80 = 20"}, {"stepNumber": 3, "explanation": "So 25% of 80 is 20"}]}'::jsonb),
  (uuid_at(102, 3), uuid_at(100, 2), uuid_at(102, 2), uuid_at(0, 100),
   '',
   '{"isCelebration": true, "celebrationText": "🎉 You got it! 25% of 80 = 20"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Add sample conversation messages for conversation 3 (algebra)
INSERT INTO private.conversation_message (id, conversation_id, prev_message_id, author_entity_id, content_text, context)
VALUES
  (uuid_at(103, 1), uuid_at(100, 3), null, uuid_at(1, 1), 'How do I solve 3x + 5 = 14?', null),
  (uuid_at(103, 2), uuid_at(100, 3), uuid_at(103, 1), uuid_at(0, 100),
   'Great question! Let me guide you through solving for x.',
   '{"solutionSteps": [{"stepNumber": 1, "explanation": "Start with: 3x + 5 = 14"}, {"stepNumber": 2, "explanation": "Subtract 5 from both sides: 3x = 14 - 5 = 9"}, {"stepNumber": 3, "explanation": "Divide both sides by 3: x = 9 ÷ 3 = 3"}, {"stepNumber": 4, "explanation": "Check: 3(3) + 5 = 9 + 5 = 14 ✓"}]}'::jsonb),
  (uuid_at(103, 3), uuid_at(100, 3), uuid_at(103, 2), uuid_at(0, 100),
   '',
   '{"isCelebration": true, "celebrationText": "🎉 Awesome work! x = 3"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Create streak history for user 1
INSERT INTO private.streak_history (user_id, date, problems_solved, was_active)
SELECT 
  uuid_at(1, 1),
  (CURRENT_DATE - make_interval(days => n))::date,
  (CASE WHEN n < 7 THEN floor(random() * 5 + 1)::int ELSE 0 END),
  (n < 7)
FROM generate_series(0, 13) AS n
ON CONFLICT (user_id, date) DO NOTHING;

-- Create some topic mastery records for user 1
INSERT INTO private.topic_mastery (user_id, topic, mastery_percentage, problems_attempted, problems_correct)
VALUES
  (uuid_at(1, 1), 'FRACTIONS', 75.0, 20, 15),
  (uuid_at(1, 1), 'PERCENTAGES', 60.0, 10, 6),
  (uuid_at(1, 1), 'BASIC_ALGEBRA', 80.0, 15, 12)
ON CONFLICT (user_id, topic) DO NOTHING;

-- Award some achievements to user 1
INSERT INTO private.achievement (user_id, achievement_type, is_new)
VALUES
  (uuid_at(1, 1), 'FIRST_PROBLEM_SOLVED', false),
  (uuid_at(1, 1), 'FIVE_DAY_STREAK', false),
  (uuid_at(1, 1), 'TEN_PROBLEMS_SOLVED', false)
ON CONFLICT (user_id, achievement_type) DO NOTHING;
