import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  IS_ONBOARDING_COMPLETED: 'isOnboardingCompleted',
  PUSH_NOTIFICATION_TOKEN: 'pushNotificationToken',
  PUSH_NOTIFICATION_TOKEN_SENT: 'pushNotificationTokenSent',
};

export async function getLocalStorageStringAsync(key: string): Promise<string | undefined> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ?? undefined;
  } catch (error) {
    console.error('Error reading from AsyncStorage:', error);
    return undefined;
  }
}

export async function getLocalStorageAsync<T>(key: string): Promise<T | undefined> {
  try {
    const value = await AsyncStorage.getItem(key);
    return value != null ? JSON.parse(value) : undefined;
  } catch (err) {
    console.error(`Error reading parsed value of ${key} from AsyncStorage`, err);
    return undefined;
  }
}

export async function setLocalStorageStringAsync(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error('Error writing to AsyncStorage:', e);
    throw e;
  }
}

export async function setLocalStorageAsync<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error writing stringify value of ${key} to AsyncStorage`, err);
    throw err;
  }
}

export async function removeLocalStorageAsync(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch (err) {
    console.error(`Error removing value of ${key} from AsyncStorage`, err);
    throw err;
  }
}
