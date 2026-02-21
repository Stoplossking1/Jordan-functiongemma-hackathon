-- Ensure we have a bot entity for conversations
INSERT INTO private.entity (id, entity_type, name)
VALUES (uuid_at(0, 0), 'SYSTEM', 'Conversation Bot')
ON CONFLICT DO NOTHING;

INSERT INTO private.conversation (id, subject, owner_entity_id)
VALUES
(uuid_at(0, 1), 'conversation between users', uuid_at(1, 2)),
(uuid_at(0, 2), 'conversation with bot', uuid_at(1, 2));

INSERT INTO private.conversation_participant (conversation_id, entity_id)
VALUES
-- conversation 1
(uuid_at(0, 1), uuid_at(1, 2)), -- user02
(uuid_at(0, 1), uuid_at(1, 3)), -- user03
-- conversation 2
(uuid_at(0, 2), uuid_at(0, 0)), -- the bot
(uuid_at(0, 2), uuid_at(1, 2))  -- user02
;


INSERT INTO private.conversation_message (id, conversation_id, prev_message_id, author_entity_id, content_text)
VALUES
-- conversation 1
(uuid_at(1, 1), uuid_at(0, 1), null,          uuid_at(1, 2), '0: Hi from user 02'),
(uuid_at(1, 2), uuid_at(0, 1), uuid_at(1, 1), uuid_at(1, 3), '1: Hi back from user 03'),
(uuid_at(1, 3), uuid_at(0, 1), uuid_at(1, 2), uuid_at(1, 2), '2: Hi again from user 02'),

-- conversation 2
(uuid_at(2, 0), uuid_at(0, 2), null,          uuid_at(0, 0), 'I am a builder bot, how can I help'), -- the bot
(uuid_at(2, 1), uuid_at(0, 2), uuid_at(2, 0), uuid_at(1, 2), 'Nice to meet you. Do you have a name?'), -- the user 02
(uuid_at(2, 2), uuid_at(0, 2), uuid_at(2, 1), uuid_at(0, 0), 'Yes, my name is Bot the Builder.'), -- the bot
(uuid_at(2, 3), uuid_at(0, 2), uuid_at(2, 2), uuid_at(1, 2), 'What can you do for me?'); -- the user 02
