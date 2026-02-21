/** @type {import('expo/metro-config').MetroConfig} */

const path = require('path');

/**
 * When using Sentry, the metro bundler needs to be configured to work with Sentry's source maps.
 * This configuration checks for the presence of the Sentry DSN environment variable and adjusts the configuration accordingly.
 * If Sentry is not being used, it falls back to the default Expo Metro configuration.
 */
const hasSentry = process.env.EXPO_PUBLIC_SENTRY_DSN;

const mapsShim = path.resolve(__dirname, 'comp-lib/shims/ReactNativeMaps.web.tsx');

let config;
if (hasSentry) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getSentryExpoConfig } = require('@sentry/react-native/metro');
  config = getSentryExpoConfig(__dirname);
} else {
  // TODO: Needed until supabase is available with a fix: https://expo.dev/changelog/sdk-53#known-issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getDefaultConfig } = require('expo/metro-config');
  config = getDefaultConfig(__dirname);
}

// We ran into issue: Metro error: Cannot use 'import.meta' outside a module when unstable_enablePackageExports=true
//Fix: Zustand caused the issue: https://github.com/expo/expo/issues/36384#issuecomment-2854467986
config.resolver.unstable_enablePackageExports = true;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
    //? Resolve to its CommonJS entry (fallback to main/index.js)
    return {
      type: 'sourceFile',
      //? require.resolve will pick up the CJS entry (index.js) since "exports" is bypassed
      filePath: require.resolve(moduleName),
    };
  }

  /*
   ** Handle the async-require.js path issue - force local resolution. The async import tried to resolve async-require.js from another app.
   ** E.g. Error: Unable to resolve module /root/apps/valua-antli-525/node_modules/@expo/metro-config/build/async-require.js
   **   from /root/apps/coral-hamst-639/node_modules/@supabase/auth-js/dist/module/lib/helpers.js:
   ** note: a file from coral-hamst-639 tried to import files from valua-antli-525. Both are different apps
   ** alternative solution: remove node_modules, clean npm cache and reinstall node_modules
   */
  if (moduleName.includes('@expo/metro-config/build/async-require.js')) {
    try {
      const path = require('path');
      const localPath = path.join(__dirname, 'node_modules/@expo/metro-config/build/async-require.js');
      return {
        type: 'sourceFile',
        filePath: localPath,
      };
    } catch (error) {
      // Fallback to regular resolution
      return {
        type: 'sourceFile',
        filePath: require.resolve('@expo/metro-config/build/async-require.js'),
      };
    }
  }

  if (platform === 'web' && moduleName === 'react-native-maps') {
    return { type: 'sourceFile', filePath: mapsShim };
  }

  return context.resolveRequest(context, moduleName, platform);
};

//remove unnecessary watchers from dev server
config.resolver.blockList = [
  /.*\/node_modules\/.*\/test\/.*/,
  /.*\/node_modules\/.*\/tests\/.*/,
  /.*\/node_modules\/.*\/docs\/.*/,
  /.*\/node_modules\/.*\/example\/.*/,
  /.*\/node_modules\/.*\/examples\/.*/,
  /.*\/node_modules\/.*\/\.git\/.*/,
  /.*\/\.git\/.*/,
  /.*\/\.vscode\/.*/,
  /.*\/coverage\/.*/,
];

// config.watchFolders = [];

module.exports = config;
