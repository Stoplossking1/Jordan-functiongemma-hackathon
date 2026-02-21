import * as fs from 'fs';
import * as path from 'path';

import { mergeDeep } from '../supabase/functions/_shared-client/utils/object-utils.ts';
import { fileExists } from '../supabase/functions/_shared/file-handlers.ts';
import { formatWithPrettier } from '../utils/format-prettier.ts';
import { buildKeysObject, findTemplateParameters, flattenKeys } from './objectParsing.ts';
import { type NestedStringRecord, type Translation, TranslationSchema } from './translation-schema.ts';

/**
 * Create TypeScript interface from template params
 */
function generateParamsInterface(params: Record<string, string[]>): string {
  const entries = Object.entries(params);
  if (entries.length === 0) {
    return '// No template parameters found in translations\nexport interface TranslationParams {}';
  }

  const interfaceContent = entries
    .map(([key, vals]) => {
      const valEntries = vals.map((val) => `    ${val}: string;`).join('\n');
      return `  '${key}': {\n${valEntries}\n  };`;
    })
    .join('\n');
  return `export interface TranslationParams {\n${interfaceContent}\n}`;
}
export const I18N_DIR_NAME = 'i18n';
export const I18N_LOCALES_NAME = 'locales';
export const I18N_LOCALES_PATH_REL = `${I18N_DIR_NAME}/${I18N_LOCALES_NAME}`;
export const I18N_LIB_LOCALES_SUFFIX = '.lib.json';
export const I18N_APP_LOCALES_SUFFIX = '.app.json';
export const I18N_TYPES_LIB_JSON = 'en.lib.json';
export const I18N_TYPES_APP_JSON = 'en.app.json';
export const I18N_TYPES_PATH_REL = `${I18N_DIR_NAME}/types.ts`;

export function validateLocaleOrThrow(localeLibJsonContent: string): Translation | undefined {
  const localeLibJson = JSON.parse(localeLibJsonContent);
  return TranslationSchema.parse(localeLibJson);
}

function getValidatedContent(localeLibJsonContent?: string): Translation | undefined {
  if (!localeLibJsonContent) return undefined;
  try {
    return validateLocaleOrThrow(localeLibJsonContent);
  } catch (e) {
    console.error(e);
    throw e;
  }
}

async function readLocaleFileContent(rootDir: string, filename: string): Promise<string | undefined> {
  const jsonPath = path.join(rootDir, I18N_LOCALES_PATH_REL, filename);
  const jsonContent = (await fileExists(jsonPath)) ? await fs.promises.readFile(jsonPath, 'utf8') : undefined;
  return jsonContent;
}

/**
 * Gets the final set of English translations.
 * First, find the patched translations. They should be in en.app.json.
 * Second, get the base translations, which should be in en.lib.json.
 * Lastly, merge those translations together, with conflicts being resolved by favoring the patched translations.
 */
export async function generateI18nTypesFileContent(
  rootDir: string,
  localeLibJsonContent?: string,
  localeAppJsonContent?: string,
): Promise<string | undefined> {
  try {
    const translations: NestedStringRecord = mergeDeep(
      getValidatedContent(localeLibJsonContent),
      getValidatedContent(localeAppJsonContent),
    );

    // Get the translations
    // Generate keys object
    const keysObject = buildKeysObject(translations);
    const metadata = findTemplateParameters(translations);

    // Generate the TypeScript code
    const keyTypename = 'TranslationKeyType';
    const tsCode = `// Auto-generated file. Do not modify manually.
   // Generated from ${I18N_TYPES_APP_JSON} and ${I18N_TYPES_LIB_JSON}
   
   // Type for all possible translation keys
   export type ${keyTypename} = ${Object.entries(flattenKeys(keysObject))
     .map(([_, value]) => `'${value}'`)
     .join(' | ')};
   
   // Type for template parameters
   ${generateParamsInterface(metadata)}
   `;
    const types = `
   // Helper type to get parameter type for a specific key
   export type ParamsForKey<K extends TranslationKeyType> = 
     K extends keyof TranslationParams ? TranslationParams[K] : never;

   // Type for the translation function with proper typing
   export interface TypedTFunction {
     // Overloads for the t function
     (key: TranslationKeyType): string;
     <K extends keyof TranslationParams>(key: K, params: TranslationParams[K]): string;
     <K extends TranslationKeyType>(key: K, params?: Record<string, any>): string;
   }
   `;
    const tsCodeWithTypes = tsCode + types;

    // Write the types.ts file
    const typesFilePath = path.join(rootDir, I18N_TYPES_PATH_REL);
    //const typesFilePathAbs = path.resolve(typesFilePath);
    const formattedtsCode = await formatWithPrettier(tsCodeWithTypes, typesFilePath, rootDir);
    return formattedtsCode;
  } catch (error) {
    console.error('Error generating types.ts:', error);
  }
  return undefined;
}

// Main function to generate the types.ts file
export async function generateI18nTypesFile(rootDir: string): Promise<void> {
  try {
    const typesFilePath = path.join(rootDir, I18N_TYPES_PATH_REL);
    // Get the base translations
    const libJsonContent = await readLocaleFileContent(rootDir, I18N_TYPES_LIB_JSON);
    // Get the app translations
    const appJsonContent = await readLocaleFileContent(rootDir, I18N_TYPES_APP_JSON);

    const formattedTsCode = await generateI18nTypesFileContent(rootDir, libJsonContent, appJsonContent);
    if (formattedTsCode) {
      fs.writeFileSync(typesFilePath, formattedTsCode);
      console.log(`Successfully generated types.ts file`);
    }
  } catch (error) {
    console.error('Error generating types.ts:', error);
  }
}
