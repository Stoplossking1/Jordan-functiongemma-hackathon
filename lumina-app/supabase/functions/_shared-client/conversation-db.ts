import { SupabaseClient } from '@supabase/supabase-js';

import {
  toSmallIntNum,
  toUuidStr,
  type ConversationMessageAssetV1,
  type ConversationMessageAssetWithObjectV1,
  type ConversationMessageV1,
  type ConversationParticipantWithDetailsV1,
  type ConversationV1,
  type ConversationWithContentV1,
  type ConversationWithMessagesAndEntityTypeV1,
  type Database,
  type EntityType,
  type timestamptzstr,
  type uuidstr,
} from './generated-db-types.ts';

// Supabase Storage Bucket that stores conversation message assets, in the format of `[conversations]::{conversationId}/{messageId}/{asset_name}`
export const CONVERSATIONS_BUCKET = 'conversations';

export type RequiredConversationMessage = Required<ConversationMessageV1> & {
  [K in 'id' | 'createdAt' | 'updatedAt' | 'conversationId' | 'authorEntityId']: NonNullable<ConversationMessageV1[K]>;
};

/**
 * A simple message with content, stripped of all metadata.
 * Example:
 * ```ts
 * {
 *  "BOT": "Hello, how can I help you?",
 *  "USER": "I need assistance with my order."
 * }
 * ```
 */
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export type SimpleConversationMessage = {
  [key in EntityType as string]: string | null;
};

// Creates a new conversation with the authenticated user as owner and adds specified participants.
export async function createConversationWithOtherParticipants(
  supabaseClient: SupabaseClient<Database>,
  otherEntityIds: uuidstr[], // other than auth user participants entity ids
): Promise<uuidstr> {
  const res = await supabaseClient.rpc('app:conversation:user:create', {
    otherEntityIds,
  });

  if (res.error) {
    throw res.error;
  }

  return res.data;
}

export async function handleCreateConversationWithOtherParticipants(
  supabaseClient: SupabaseClient<Database>,
  otherParticipantEntityIds: uuidstr[],
): Promise<uuidstr> {
  try {
    const userConversations = await readConversationsWithOtherParticipantsExact(
      supabaseClient,
      otherParticipantEntityIds,
    );

    let chatConversationId: uuidstr;
    if (userConversations && userConversations.length > 0 && userConversations[0].id) {
      chatConversationId = userConversations[0].id;
    } else {
      chatConversationId = await createConversationWithOtherParticipants(supabaseClient, otherParticipantEntityIds);
    }

    return chatConversationId;
  } catch (error) {
    console.error('Error in handleCreateConversationWithOtherParticipants:', error);
    throw error;
  }
}

export async function readConversations(supabaseClient: SupabaseClient<Database>): Promise<ConversationV1[]> {
  const res = await supabaseClient.rpc('app:conversation:user:readAll');

  if (res.error) {
    throw res.error;
  }

  // if there's a profile entry, it will be the only available result
  return res.data ?? [];
}

export async function readConversationsWithOtherParticipantsExact(
  supabaseClient: SupabaseClient<Database>,
  otherParticipantEntityIds: uuidstr[],
): Promise<ConversationV1[]> {
  const res = await supabaseClient.rpc('app:conversation:user:readWithOtherParticipantsExact', {
    otherParticipantEntityIds,
  });

  if (res.error) {
    throw res.error;
  }

  return res.data ?? [];
}

export async function readConversationWithMessagesAndEntityTypes(
  supabaseClient: SupabaseClient<Database>,
  conversationId: uuidstr,
): Promise<ConversationWithMessagesAndEntityTypeV1 | undefined> {
  const res = await supabaseClient.rpc('app:conversation:user:readWithMessagesAndEntityTypes', {
    conversationId,
  });

  if (res.error) {
    throw res.error;
  }

  return res.data ?? undefined;
}

export async function adminReadConversationWithMessagesAndEntityTypes(
  supabaseAdminClient: SupabaseClient<Database>,
  conversationId: uuidstr,
): Promise<ConversationWithMessagesAndEntityTypeV1 | undefined> {
  const res = await supabaseAdminClient.rpc('admin:conversation:readWithMessagesAndEntityTypes', {
    conversationId,
  });

  if (res.error) {
    throw res.error;
  }

  return res.data ?? undefined;
}

export async function readConversationWithContent(
  supabaseClient: SupabaseClient<Database>,
  conversationId: uuidstr,
): Promise<ConversationWithContentV1 | undefined> {
  const res = await supabaseClient.rpc('app:conversation:user:readWithContent', {
    conversationId,
  });

  if (res.error) {
    throw res.error;
  }

  return res.data ?? undefined;
}

export async function readConversationMessageAssets(
  supabaseClient: SupabaseClient<Database>,
  conversationMessageId: uuidstr,
): Promise<ConversationMessageAssetWithObjectV1[] | undefined> {
  const res = await supabaseClient.rpc('app:conversation:message:asset:user:readAllWithObject', {
    conversationMessageId,
  });

  if (res.error) {
    throw res.error;
  }
  return res.data?.length ? res.data : undefined;
}

export function validateConversationMessageWithDefaults(
  message: ConversationMessageV1 | null | undefined,
  createdAt: timestamptzstr,
): message is RequiredConversationMessage {
  if (message == null) throw new Error('message missing');
  // if (message.authorEntityId == null) throw new Error('message.authorEntityId missing');
  // if (message.contentText == null) throw new Error('message.contentText missing');
  // if (message.conversationId == null) throw new Error('message.conversationId missing');
  message.id ??= toUuidStr(crypto.randomUUID());
  message.createdAt ??= createdAt;
  message.updatedAt ??= createdAt;
  return validateConversationMessage(message);
}

export function validateConversationMessage(
  message?: ConversationMessageV1 | null,
): message is RequiredConversationMessage {
  if (message == null) throw new Error('message missing');
  if (message.id == null) throw new Error('id missing');
  if (message.createdAt == null) throw new Error('createdAt missing');
  if (message.updatedAt == null) throw new Error('updatedAt missing');
  if (message.authorEntityId == null) throw new Error('authorEntityId missing');
  if (message.conversationId == null) throw new Error('conversationId missing');
  return true;
}

export function validateConversationMessageAssetsWithDefaults(
  attachedAssets: Partial<ConversationMessageAssetV1>[] | null | undefined,
  conversationMessageId: uuidstr,
  createdAt: timestamptzstr,
): attachedAssets is ConversationMessageAssetV1[] {
  if (attachedAssets?.length) {
    for (const [i, asset] of attachedAssets.entries()) {
      asset.id ??= toUuidStr(crypto.randomUUID());
      asset.createdAt ??= createdAt;
      asset.updatedAt ??= createdAt;
      asset.conversationMessageId ??= conversationMessageId;
      if (asset.objectId == null) throw new Error('asset.objectId missing');
      asset.orderIndex ??= toSmallIntNum(i);
    }
  }
  return true;
}

export async function createMessage(
  supabaseClient: SupabaseClient<Database>,
  conversationId: uuidstr,
  contentText: string,
  botEntityId: uuidstr,
  prevMessageId?: uuidstr,
): Promise<ConversationMessageV1> {
  const res = await supabaseClient.rpc('app:conversation:message:create', {
    conversationId: conversationId,
    contentText: contentText,
    botEntityId: botEntityId,
    prevMessageId: prevMessageId,
  });

  if (res.error) {
    throw new Error(`Failed to insert bot message: ${res.error.message}`);
  }

  if (!res.data) {
    throw new Error('Access denied: User is not an active participant in this conversation');
  }

  return res.data;
}

export async function upsertConversationMessagesWithAssets(
  supabaseClient: SupabaseClient<Database>,
  messages: ConversationMessageV1[],
  attachedAssets?: ConversationMessageAssetV1[],
): Promise<{ messageCount: number; assetCount: number }[]> {
  const res = await supabaseClient.rpc('app:conversation:message:upsertAllWithAssets', {
    messages: messages,
    assets: attachedAssets ?? [],
  });
  if (res.error) {
    throw res.error;
  }
  return res.data;
}

// Flattens a conversation into a simple array of messages with content.
export function flattenConversationWithContent(
  conversation?: ConversationWithMessagesAndEntityTypeV1,
): SimpleConversationMessage[] {
  if (!conversation?.messages) return [];

  // Transform and sort messages
  return conversation.messages
    .sort((a, b) => {
      const dateA = new Date(a.message?.createdAt ?? 0).getTime();
      const dateB = new Date(b.message?.createdAt ?? 0).getTime();
      return dateA - dateB;
    })
    .map((message) => ({
      [message.entityType as string]: message.message?.contentText ?? '',
    }));
}

// Finds the entity type for a given participant in a conversation.
export function findEntityTypeForParticipant(
  participants: ConversationParticipantWithDetailsV1[] | undefined,
  entityId: uuidstr,
): EntityType | undefined {
  for (const participant of participants ?? []) {
    if (participant.participant?.entityId === entityId) {
      return participant.entityType ?? undefined;
    }
  }
  return undefined;
}
