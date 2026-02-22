import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { mergeDeep } from '../supabase/functions/_shared-client/utils/object-utils.ts';
import { TranslationKeyType, TranslationParams } from './types.ts';

// Import translation resources
import patchedEn from './locales/en.app.json';
import baseEn from './locales/en.lib.json';
import patchedEs from './locales/es.app.json';
import baseEs from './locales/es.lib.json';
import patchedFr from './locales/fr.app.json';
import baseFr from './locales/fr.lib.json';

const enTranslations = mergeDeep(baseEn, patchedEn);
const frTranslations = mergeDeep(baseFr, patchedFr);
const esTranslations = mergeDeep(baseEs, patchedEs);

// Initialize i18next
// eslint-disable-next-line import/no-named-as-default-member
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4', // Required for Android
    resources: {
      en: { translation: enTranslations },
      fr: { translation: frTranslations },
      es: { translation: esTranslations },
    },
    lng: Localization.getLocales()[0]?.languageCode ?? 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  })
  .catch((error) => {
    console.error('i18n init error:', error);
  });

// // Load saved language preference
// AsyncStorage.getItem('userLanguage').then((language) => {
//   if (language) {
//     i18n.changeLanguage(language);
//   }
// });

// // Type-safe language switching function
// export async function changeLanguage(language: string) {
//   await i18n.changeLanguage(language);
//   await AsyncStorage.setItem('userLanguage', language);
// }

// Export typed t function with stringified params
function t<K extends TranslationKeyType>(
  key: K,
  params?: K extends keyof TranslationParams
    ? { [P in keyof TranslationParams[K]]: string | number | boolean }
    : undefined,
): string {
  const stringifiedParams = params
    ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
    : undefined;

  // eslint-disable-next-line import/no-named-as-default-member
  return i18n.t(key, stringifiedParams);
}

// Export i18n instance
export { i18n, t };
