/**
 * To build the bundle with embedded assets, use the following command:
 *
 * ```bash
 * # E.g. ios platform
 * npx expo export:embed --platform ios --bundle-output ./dist/main.bundle --sourcemap-output ./dist/map.json --sourcemap-sources-root ./dist --assets-dest ./dist --dev false
 * ```
 */

import { PixelRatio } from 'react-native';

// @ts-expect-error - Using internal React Native modules
import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';

/**
 * PackagerAsset type definition matching React Native's internal type
 * Source: node_modules/react-native/Libraries/Image/AssetSourceResolver.js
 */
type AssetDestPathResolver = 'android' | 'generic';
interface PackagerAsset {
  __packager_asset: boolean;
  fileSystemLocation: string;
  httpServerLocation: string;
  width?: number;
  height?: number;
  scales: number[];
  hash: string;
  name: string;
  type: string;
  resolver?: AssetDestPathResolver;
}

/**
 * AssetSourceResolver type definition matching React Native's internal type
 * Source: node_modules/react-native/Libraries/Image/AssetSourceResolver.js
 */
interface AssetSourceResolver {
  serverUrl: string;
  jsbundleUrl: string;
  asset: PackagerAsset;
  fromSource: (source: string) => ResolvedAssetSource;
}

/**
 * ResolvedAssetSource type definition matching React Native's internal type
 * Source: node_modules/react-native/Libraries/Image/AssetSourceResolver.js
 */
export type ResolvedAssetSource = {
  __packager_asset: boolean;
  width?: number;
  height?: number;
  uri: string;
  scale: number;
};

// From: '@react-native/assets-registry/path-support';
function getBasePath(asset: PackagerAsset): string {
  const basePath = asset.httpServerLocation;
  return basePath.startsWith('/') ? basePath.slice(1) : basePath;
}

// From: 'react-native/Libraries/Image/AssetUtils';
export function pickScale(scales: Array<number>, deviceScale?: number): number {
  const requiredDeviceScale = deviceScale ?? PixelRatio.get();

  // Packager guarantees that `scales` array is sorted
  for (const scale of scales) {
    if (scale >= requiredDeviceScale) {
      return scale;
    }
  }

  // If nothing matches, device scale is larger than any available
  // scales, so we return the biggest one. Unless the array is empty,
  // in which case we default to 1
  return scales[scales.length - 1] ?? 1;
}

/**
 * Checks if the app is running in development mode with Metro dev server
 */
function isDev(): boolean {
  return __DEV__;
}

/**
 * Constructs the scaled asset path for a given asset
 * This matches the structure created by expo export:embed
 *
 * Example: assets/images/icon@2x.png
 */
function getScaledAssetPath(asset: PackagerAsset): string {
  const scale = pickScale(asset.scales, PixelRatio.get());
  const scaleSuffix = scale === 1 ? '' : `@${scale}x`;
  const assetDir = getBasePath(asset);
  return `${assetDir}/${asset.name}${scaleSuffix}.${asset.type}`;
}

function getBundleDirname(bundleUrl: string): string {
  return bundleUrl.substring(0, bundleUrl.lastIndexOf('/'));
}

/**
 * Constructs the full CDN URL for an asset
 */
function getCDNAssetURL(serverOrigin: string, bundleUrl: string, asset: PackagerAsset): string {
  const assetPath = getScaledAssetPath(asset);
  const bundleDirname = getBundleDirname(bundleUrl);

  const source = `${bundleDirname}/${assetPath}`;
  return source;
}

/**
 * Custom asset source transformer
 * This is called by React Native's asset resolution system for each asset
 */
function customAssetTransformer(resolver: AssetSourceResolver): ResolvedAssetSource | undefined {
  const asset = resolver.asset;
  const serverUrl = resolver.serverUrl;
  const bundleUrl = resolver.jsbundleUrl;

  if (!asset || !serverUrl || !bundleUrl || isDev()) {
    // Invalid asset or server URL, fall back to default resolution
    return undefined;
  }

  try {
    // Construct CDN URL
    const cdnUrl = getCDNAssetURL(serverUrl, bundleUrl, asset);

    // Create resolved asset source using the resolver's fromSource method
    // This ensures proper scaling and metadata
    const resolvedSource = resolver.fromSource(cdnUrl);
    console.debug(`[CDN Asset Resolver] Resolved ${asset.name}.${asset.type} to ${resolvedSource.uri}`);
    return resolvedSource;
  } catch (error) {
    // If CDN resolution fails, fall back to default
    console.error(`[CDN Asset Resolver] Failed to resolve ${asset.name}.${asset.type} from CDN:`, error);
    return undefined;
  }
}

/**
 * Initialize the CDN asset resolver
 * This must be called early in app initialization
 */
export function initializeCDNAssetResolver(): void {
  if (isDev()) {
    console.log('[CDN Asset Resolver] Dev environment detected, skipping custom CDN asset resolution.');
    return;
  }

  resolveAssetSource.setCustomSourceTransformer(customAssetTransformer);
  console.log('[CDN Asset Resolver] Custom CDN asset resolver initialized.');
}

// Auto-initialize when this module is imported
initializeCDNAssetResolver();
