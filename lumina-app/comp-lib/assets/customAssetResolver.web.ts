/**
 * Web only
 *
 * The package react-native does not support web, so to add web support,
 * we install react-native-web and alias react-native to react-native-web
 * in the Webpack bundler (via @expo/webpack-config).
 * However, this doesn't account for deep imports that reach inside of React Native,
 * e.g. react-native/Libraries/Core/Devtools/getDevServer.
 * Sometimes packages will dangerously reach into the internals of react-native
 * which breaks the react-native-web alias, and effectively calls into native
 * globals like __fbBatchedBridgeConfig which don't exist on web.
 *
 * Read more here:
 * https://github.com/expo/fyi/blob/main/fb-batched-bridge-config-web.md
 */
