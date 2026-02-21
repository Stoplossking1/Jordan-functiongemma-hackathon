import * as aesjs from 'aes-js';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type SupportedStorage } from '@supabase/supabase-js';

// https://docs.expo.dev/versions/latest/sdk/crypto/
// https://docs.expo.dev/versions/latest/sdk/crypto/#cryptogetrandomvaluesttypedarray
// import * as Crypto from 'expo-crypto';

// TODO: use these imports when the next expo release makes them available
// copied from https://github.com/expo/expo/blob/main/packages/expo-secure-store/src/byteCounter.ts
const VALUE_BYTES_LIMIT = 2048;

// note this probably could be JS-engine dependent
// inspired by https://stackoverflow.com/a/39488643
function byteCountOverLimit(value: string, limit: number): boolean {
  let bytes = 0;

  for (let i = 0; i < value.length; i++) {
    const codePoint = value.charCodeAt(i);

    // Lone surrogates cannot be passed to encodeURI
    if (codePoint >= 0xd800 && codePoint < 0xe000) {
      if (codePoint < 0xdc00 && i + 1 < value.length) {
        const next = value.charCodeAt(i + 1);

        if (next >= 0xdc00 && next < 0xe000) {
          bytes += 4;
          if (bytes > limit) {
            return true;
          }
          i++;
          continue;
        }
      }
    }

    bytes += codePoint < 0x80 ? 1 : codePoint < 0x800 ? 2 : 3;
    if (bytes > limit) {
      return true;
    }
  }

  return bytes > limit;
}

// https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native?queryGroups=auth-store&auth-store=secure-store

// As Expo's SecureStore does not support values larger than 2048
// bytes, an AES-256 key is generated and stored in SecureStore, while
// it is used to encrypt/decrypt values stored in AsyncStorage.
export class LargeSecureStore implements SupportedStorage {
  private _makeEncryptionKey(): Uint8Array {
    // Crypto.getRandomValues
    const encryptionKey = crypto.getRandomValues(new Uint8Array(256 / 8));
    return encryptionKey;
  }

  private _encrypt(encryptionKey: Uint8Array, value: string): string {
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const encryptedBytes = cipher.encrypt(aesjs.utils.utf8.toBytes(value));
    return aesjs.utils.hex.fromBytes(encryptedBytes);
  }

  private _decrypt(encryptionKey: Uint8Array, valueEncryptedHexString: string): string {
    const cipher = new aesjs.ModeOfOperation.ctr(encryptionKey, new aesjs.Counter(1));
    const decryptedBytes = cipher.decrypt(aesjs.utils.hex.toBytes(valueEncryptedHexString));

    return aesjs.utils.utf8.fromBytes(decryptedBytes);
  }

  async getItem(key: string): Promise<string | null> {
    const valueEncrypted = await AsyncStorage.getItem(key);
    const encryptionKeyHexOrValue = await SecureStore.getItemAsync(key);
    // if there's no encrypted value is the async store, then we assume it was short enough to fully fit into the secure store
    if (!valueEncrypted || !encryptionKeyHexOrValue) {
      return encryptionKeyHexOrValue;
    }

    const encryptionKey = aesjs.utils.hex.toBytes(encryptionKeyHexOrValue);
    return this._decrypt(encryptionKey, valueEncrypted);
  }

  async setItem(key: string, value: string) {
    if (byteCountOverLimit(value, VALUE_BYTES_LIMIT)) {
      const encryptionKey = this._makeEncryptionKey();

      const encrypted = this._encrypt(encryptionKey, value);
      await AsyncStorage.setItem(key, encrypted);
      const encryptionKeyHex = aesjs.utils.hex.fromBytes(encryptionKey);
      await SecureStore.setItemAsync(key, encryptionKeyHex);
    } else {
      // the value fits entirely into the secure store, remove any of it's remains from the async store
      await AsyncStorage.removeItem(key);
      await SecureStore.setItemAsync(key, value);
    }
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
    await SecureStore.deleteItemAsync(key);
  }
}
