import { getLocalStorageAsync, setLocalStorageAsync, StorageKeys } from './LocalStore';

const RETRY_COUNT_INCREMENT = 1;
const RETRY_DELAY_MULTIPLIER = 2;
const RETRY_DELAY_BASE_IN_MS = 2_000;
const RETRY_DELAY_MAX_IN_MS = 60_000;

export const OFFLINE_QUEUE_MAX_RETRY_COUNT = 5;

export interface OfflineQueueMessage {
  messageId: string;
  conversationId: string;
  contentText: string;
  createdAt: string;
  retryCount: number;
  nextRetryAt?: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidRetryCount(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

function isOfflineQueueMessage(value: unknown): value is OfflineQueueMessage {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  const message = value as Record<string, unknown>;
  if (!isNonEmptyString(message.messageId)) {
    return false;
  }
  if (!isNonEmptyString(message.conversationId)) {
    return false;
  }
  if (!isNonEmptyString(message.contentText)) {
    return false;
  }
  if (!isNonEmptyString(message.createdAt)) {
    return false;
  }
  if (!isValidRetryCount(message.retryCount)) {
    return false;
  }

  if (message.nextRetryAt != null && !isNonEmptyString(message.nextRetryAt)) {
    return false;
  }

  return true;
}

function sanitizeOfflineQueue(rawQueue: unknown): OfflineQueueMessage[] {
  if (!Array.isArray(rawQueue)) {
    return [];
  }

  const sanitizedQueue: OfflineQueueMessage[] = [];
  for (const rawItem of rawQueue) {
    if (isOfflineQueueMessage(rawItem)) {
      sanitizedQueue.push(rawItem);
    }
  }
  return sanitizedQueue;
}

async function writeOfflineQueueAsync(queue: OfflineQueueMessage[]): Promise<void> {
  await setLocalStorageAsync<OfflineQueueMessage[]>(StorageKeys.ASSISTANT_OUTBOUND_MESSAGE_QUEUE, queue);
}

export async function readOfflineQueueAsync(): Promise<OfflineQueueMessage[]> {
  const storedQueue = await getLocalStorageAsync<unknown>(StorageKeys.ASSISTANT_OUTBOUND_MESSAGE_QUEUE);
  return sanitizeOfflineQueue(storedQueue);
}

export async function enqueueOfflineQueueMessageAsync(message: OfflineQueueMessage): Promise<boolean> {
  const existingQueue = await readOfflineQueueAsync();
  const duplicateMessage = existingQueue.find((queueItem) => queueItem.messageId === message.messageId);
  if (duplicateMessage != null) {
    return false;
  }

  const nextQueue = [...existingQueue, message];
  await writeOfflineQueueAsync(nextQueue);
  return true;
}

export async function removeOfflineQueueMessageAsync(messageId: string): Promise<void> {
  const existingQueue = await readOfflineQueueAsync();
  const nextQueue = existingQueue.filter((queueItem) => queueItem.messageId !== messageId);
  if (nextQueue.length === existingQueue.length) {
    return;
  }
  await writeOfflineQueueAsync(nextQueue);
}

export async function updateOfflineQueueMessageAsync(message: OfflineQueueMessage): Promise<void> {
  const existingQueue = await readOfflineQueueAsync();
  const nextQueue = existingQueue.map((queueItem) => (queueItem.messageId === message.messageId ? message : queueItem));
  await writeOfflineQueueAsync(nextQueue);
}

function readRetryDelayInMs(retryCount: number): number {
  const multiplierPower = Math.max(retryCount - RETRY_COUNT_INCREMENT, 0);
  const retryDelayInMs = RETRY_DELAY_BASE_IN_MS * Math.pow(RETRY_DELAY_MULTIPLIER, multiplierPower);
  return Math.min(retryDelayInMs, RETRY_DELAY_MAX_IN_MS);
}

export function shouldReplayOfflineQueueMessage(message: OfflineQueueMessage, nowDate: Date): boolean {
  if (message.nextRetryAt == null) {
    return true;
  }

  const nextRetryTimestampInMs = new Date(message.nextRetryAt).getTime();
  if (!Number.isFinite(nextRetryTimestampInMs)) {
    return true;
  }

  return nowDate.getTime() >= nextRetryTimestampInMs;
}

export function hasReachedOfflineQueueRetryLimit(message: OfflineQueueMessage): boolean {
  return message.retryCount >= OFFLINE_QUEUE_MAX_RETRY_COUNT;
}

export function createOfflineQueueRetryMessage(message: OfflineQueueMessage, nowDate: Date): OfflineQueueMessage {
  const nextRetryCount = message.retryCount + RETRY_COUNT_INCREMENT;
  const nextRetryDelayInMs = readRetryDelayInMs(nextRetryCount);
  const nextRetryAtDate = new Date(nowDate.getTime() + nextRetryDelayInMs);

  return {
    ...message,
    retryCount: nextRetryCount,
    nextRetryAt: nextRetryAtDate.toISOString(),
  };
}
