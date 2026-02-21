// NOTE: This file needs to use the .mjs suffix instead of .ts
// The reason for this is that eslint will load this file through it's own loader in the node_module directory
// and hence our TSX typescript runtime does not get used to load it and transpile to javascript
// once it's loaded it can by itself can import typescript since the TSX runtime will be applied

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import expoConfig from 'eslint-config-expo/flat.js';
// import typescriptParser from '@typescript-eslint/parser';

// import { plugin as postgresql } from './eslint/eslint-plugin-postgresql.ts';

import localPluginDefault from './eslint/custom-rules.ts';
// when transforming the import through TSX, the import unexpectedly lives in the "default" sub-key instead being on the root level
const localPlugin = 'default' in localPluginDefault ? localPluginDefault.default : localPluginDefault;

// Utility function to remove specific plugin definitions from a config to avoid redefinition errors
function removePlugins(config, pluginsToRemove = []) {
  if (Array.isArray(config)) {
    return config.map((c) => removePlugins(c, pluginsToRemove));
  }
  if (config && typeof config === 'object') {
    const { plugins, ...rest } = config;

    // Filter out only the specified plugins
    const filteredPlugins = plugins
      ? Object.keys(plugins).reduce((acc, pluginName) => {
          if (!pluginsToRemove.includes(pluginName)) {
            acc[pluginName] = plugins[pluginName];
          }
          return acc;
        }, {})
      : undefined;

    return {
      ...rest,
      ...(filteredPlugins && Object.keys(filteredPlugins).length > 0 ? { plugins: filteredPlugins } : {}),
    };
  }
  return config;
}

// This code will enable the recommended configuration for linting.
// https://typescript-eslint.io/users/configs/
export default defineConfig(
  eslint.configs.recommended,
  // including expoConfig causes this error:
  // ConfigError: Config "UserConfig[2] > typescript-eslint/base": Key "plugins": Cannot redefine plugin "@typescript-eslint".
  // The problem is that expoConfig includes the TypeScript ESLint plugin, and tseslint.configs.recommendedTypeChecked tries to add it again.
  // We need to strips out the plugins property from expoConfig to prevent the duplicate plugin definition
  ...removePlugins(expoConfig, ['@typescript-eslint']),
  // expoConfig,
  // tseslint.configs.recommended,
  // tseslint.configs.strict,
  // tseslint.configs.stylistic,

  // tseslint.configs.recommended,

  // tseslint.configs.recommendedTypeChecked,
  // tseslint.configs.stylisticTypeChecked,
  {
    // files: ['**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}'],
    ignores: ['**/*.sql'],
    extends: [
      // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslintrc/recommended-type-checked.ts
      ...tseslint.configs.recommendedTypeChecked,
      // https://github.com/typescript-eslint/typescript-eslint/blob/main/packages/eslint-plugin/src/configs/eslintrc/stylistic-type-checked.ts
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: {
          //allowDefaultProject: ['extrafile.ts'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      local: localPlugin,
    },
    rules: {
      // 'local/enforce-file-structure': 'error',
      'local/no-business-logic-in-components': 'error',
      'local/explicit-return-type-when-returns': 'warn',
      // 'local/uppercase-first-declarations': 'warn',
      'local/no-unsafe-supabase-filters': 'warn',
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'react-i18next',
              importNames: ['useTranslation'],
              message: "Use `import { t } from '@/i18n'` instead of useTranslation().",
            },
          ],
        },
      ],
    },
  },
  // TODO: enable this block when the linter is ready
  // {
  //   ...postgresql.configs.recommended,
  //   // files: ['**/*.sql'],
  //   // languageOptions: {
  //   //   parser: postgresql.configs.recommended.languageOptions.parser,
  //   // },
  //   plugins: {
  //     postgresql,
  //   },
  //   rules: {
  //     // Disable JavaScript/TypeScript rules for SQL files
  //     'no-undef': 'off',
  //     ...postgresql.configs.recommended.rules,
  //   },
  // },

  // Custom configuration for specific directories
  // {
  //   files: ['supabase/migrations/**/*.sql'],
  //   languageOptions: {
  //     parser: postgresql.configs.recommended.languageOptions.parser,
  //   },
  //   plugins: {
  //     postgresql,
  //   },
  //   rules: {
  //     'postgresql/no-syntax-error': 'error',
  //     'postgresql/require-limit': 'off', // Disable LIMIT requirement for migration files
  //   },
  // },
  {
    ignores: [
      '.expo',
      '.venv',
      'android/',
      'eslint*',
      'ios/',
      'logs',
      'metro.config.js',
      'babel.config.js',
      'babel',
      'node_modules/**',
      'supabase/functions/tests',
      'supabase/functions/_shared-client/generated-db-types*.ts',
      // deprecated dir, remove once all apps moved over to task-logs
      'request-logs',
      'task-logs',
      'dist/**',
      'build/**',
    ],
  },
  {
    // ignores: ['**/*.sql'],
    rules: {
      // we have just too many of these, eventually would be nice to enable it
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // for cases where we have unknown or any in string templates `${error}`
      '@typescript-eslint/restrict-template-expressions': 'off',

      // this one is just causing a lot of work to make happy
      '@typescript-eslint/no-unused-vars': 'off',
      // using this a lot in tsx components that extend use "extends PropsWithChildren {}"
      '@typescript-eslint/no-empty-object-type': 'off',
      // warns to use type[] vs. Array<type>
      '@typescript-eslint/array-type': 'off',
      //Do not pass children as props. Instead, nest children between the opening and closing tags.eslint
      'react/no-children-prop': 'off',
      // warns if there are both default imports and named imports. We use e.g. the t() functon
      // 'import/no-named-as-default-member': 'off'

      // recommended:
      // such as value?: ReadableStream | any
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      // when we use callbacks that return promises, the async is required even if there's no await
      '@typescript-eslint/require-await': 'off',

      // styles:
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  // {
  // files: ['**/*.{ts,tsx}'],
  // languageOptions: {
  //   parser: typescriptParser,
  //   parserOptions: {
  //     ecmaVersion: 'latest',
  //     sourceType: 'module',
  //     ecmaFeatures: {
  //       jsx: true,
  //     },
  //     project: './tsconfig.json',
  //   },
  // },
  // plugins: {
  //   local: localPlugin,
  // },
  // rules: {
  // TypeScript - Explicit typing
  // '@typescript-eslint/explicit-function-return-type': 'error',
  // '@typescript-eslint/explicit-module-boundary-types': 'error',
  // '@typescript-eslint/no-explicit-any': 'error',
  // Undefined/Null handling
  // '@typescript-eslint/prefer-nullish-coalescing': 'error',
  // '@typescript-eslint/prefer-optional-chain': 'error',
  // eqeqeq: ['error', 'always', { null: 'ignore' }],
  // Function style - prefer regular functions over arrow functions
  // 'func-style': ['error', 'declaration', { allowArrowFunctions: false }],
  // 'prefer-arrow-callback': 'off',
  // Prefer for...of over forEach
  // '@typescript-eslint/prefer-for-of': 'error',
  // Naming conventions
  // '@typescript-eslint/naming-convention': [
  //   'error',
  //   {
  //     selector: 'variable',
  //     format: ['camelCase', 'UPPER_CASE'],
  //   },
  //   {
  //     selector: 'function',
  //     format: ['camelCase'],
  //   },
  //   {
  //     selector: 'parameter',
  //     format: ['camelCase'],
  //   },
  //   {
  //     selector: 'typeLike',
  //     format: ['PascalCase'],
  //   },
  //   {
  //     selector: 'property',
  //     format: ['camelCase'],
  //     filter: {
  //       regex: '^(createdAt|updatedAt|deletedAt)$',
  //       match: false,
  //     },
  //   },
  // ],
  // React - File extensions
  // 'react/jsx-filename-extension': ['error', { extensions: ['.tsx'] }],
  // React - Component return types
  // '@typescript-eslint/explicit-function-return-type': [
  //   'error',
  //   {
  //     allowExpressions: true,
  //     allowTypedFunctionExpressions: true,
  //     allowHigherOrderFunctions: true,
  //     allowDirectConstAssertionInArrowFunctions: true,
  //   },
  // ],
  // React Hooks
  // 'react-hooks/rules-of-hooks': 'error',
  // 'react-hooks/exhaustive-deps': 'warn',
  // Code quality
  // 'no-console': 'warn',
  // 'no-debugger': 'error',
  // 'no-unused-vars': 'off', // Use TypeScript version instead
  // '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  // Consistency
  // 'object-shorthand': 'error',
  // 'prefer-const': 'error',
  // 'no-var': 'error',
  // Custom rules for your guidelines
  // 'local/enforce-file-structure': 'error',
  //      'local/no-business-logic-in-components': 'error',
  //      'local/explicit-return-type-when-returns': 'warn',
  // 'local/uppercase-first-declarations': 'warn',
  //      'local/no-unsafe-supabase-filters': 'warn',
  // },
  // },
  // {
  //   files: ['**/*.tsx'], // specific directories
  //   // files: ['comp-lib/**/*.tsx', 'components/**/*.tsx'], // specific directories
  //   rules: {
  //     '@typescript-eslint/no-require-imports': 'off',
  //   },
  // },
);
