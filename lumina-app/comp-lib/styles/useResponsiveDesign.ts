import {
  type ImageStyle,
  Platform,
  type ScaledSize,
  type TextStyle,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';

export type ComponentStyles<T = object> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle | ComponentStyles<any> };

/**
 * Device type based on screen width
 */
export type DeviceScreenType = 'phone' | 'tablet' | 'desktop';

/**
 * Interface for the return value of the useResponsiveDesign hook
 */
export interface ResponsiveDesignFunc {
  /** The current device dimensions checks */
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;

  /**
   * The current device platform checks
   */
  isPlatformWeb: boolean;
  isPlatformIos: boolean;
  isPlatformAndroid: boolean;
  isPlatformNative: boolean;

  /**
   * Current window dimensions with responsive scale factors
   */
  dimensions: ScaledSize;

  /**
   * Width ratio relative to base design width
   */
  widthRatio: number;

  /**
   * Height ratio relative to base design height
   */
  heightRatio: number;

  /**
   * The current device type based on screen width
   */
  deviceScreenType: DeviceScreenType;

  /**
   * Creates a scaled StyleSheet based on font and screen scaling: Only use in app pages, not in components
   */
  createAppPageStyles: <T extends ComponentStyles>(styles: T) => T;

  /**
   * Returns a scaled style object without using StyleSheet.create
   */
  scaleProperties: <T extends ComponentStyles>(styles: T) => T;

  /**
   * Scales an entire styles object (containing multiple style objects)
   */
  scaleStylesObject: <T extends ComponentStyles>(styles: T, fontScale: number, screenScale: number) => T;
}

/**
 * Web Breakpoints for responsive design
 */
const WEB_MAX_TABLET_WIDTH_PX = 1024;
const WEB_MAX_PHONE_WIDTH_PX = 768;

/**
 * Phone breakpoints for responsive design
 */
const PHONE_BASE_WIDTH_PX = 375;
const PHONE_BASE_HEIGHT_PX = 812;
const PHONE_MIN_WIDTH_PX = 320;
const PHONE_MIN_HEIGHT_PX = 568;
const PHONE_MAX_WIDTH_PX = 400;
const PHONE_MAX_HEIGHT_PX = 900;

// iPhone 12 reference Dimensions
const baseDimensions: ScaledSize = {
  width: PHONE_BASE_WIDTH_PX,
  height: PHONE_BASE_HEIGHT_PX,
  scale: 1,
  fontScale: 1,
};

// Min Screen size: Iphone SE 1st generation
const minDimensions: ScaledSize = {
  width: PHONE_MIN_WIDTH_PX,
  height: PHONE_MIN_HEIGHT_PX,
  scale: PHONE_MIN_HEIGHT_PX / baseDimensions.height,
  fontScale: PHONE_MIN_HEIGHT_PX / baseDimensions.height,
};

const maxDimensions: ScaledSize = {
  width: PHONE_MAX_WIDTH_PX,
  height: PHONE_MAX_HEIGHT_PX,
  scale: PHONE_MAX_HEIGHT_PX / baseDimensions.height,
  fontScale: PHONE_MAX_HEIGHT_PX / baseDimensions.height,
};

const screenProperties = [
  'margin',
  'marginTop',
  'marginBottom',
  'marginLeft',
  'marginRight',
  'marginVertical',
  'marginHorizontal',
];
const fontProperties = [
  'fontSize',
  'lineHeight',
  'letterSpacing',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'top',
  'bottom',
  'left',
  'right',
  'padding',
  'paddingTop',
  'paddingBottom',
  'paddingLeft',
  'paddingRight',
  'paddingVertical',
  'paddingHorizontal',
  'borderRadius',
  'borderTopLeftRadius',
  'borderTopRightRadius',
  'borderBottomLeftRadius',
  'borderBottomRightRadius',
  'scale',
  'gap',
  'rowGap',
  'columnGap',
];

/**
 * Helper function to scale a single style object based on font and screen scaling
 */
function scaleStyleObject(style: ComponentStyles, fontScale: number, screenScale: number): ComponentStyles {
  if (typeof style !== 'object' || Array.isArray(style) || style === null) {
    return style;
  }

  const scaledStyle: Record<string, any> = {};

  for (const [key, value] of Object.entries(style)) {
    if (key === 'transform' && Array.isArray(value)) {
      // Handle transform arrays properly
      scaledStyle[key] = value;
    } else if (Array.isArray(value) && value.length && (typeof value[0] === 'string' || typeof value[0] === 'number')) {
      // Handle array for "LinearGradient" "colors" and "locations" prop properly, e.g. "<LinearGradient colors={styles.gradientColors} locations={styles.gradientLocations} />"
      scaledStyle[key] = value;
    } else if (typeof value === 'object' && value !== null) {
      // Recursively scale nested style objects
      scaledStyle[key] = scaleStyleObject(value, fontScale, screenScale);
    } else if (typeof value === 'number') {
      if (fontProperties.includes(key)) {
        scaledStyle[key] = value * fontScale;
      } else if (screenProperties.includes(key)) {
        scaledStyle[key] = value * screenScale;
      } else {
        scaledStyle[key] = value;
      }
    } else {
      scaledStyle[key] = value;
    }
  }

  return scaledStyle;
}

/**
 * Helper function to scale an entire styles object (containing multiple style objects)
 * Now handles nested style objects at any depth
 */
function scaleStylesObject<T extends ComponentStyles>(styles: T, fontScale: number, screenScale: number): T {
  const scaledStyles: any = {};

  for (const key in styles) {
    const style = styles[key];
    if (typeof style === 'object' && style !== null) {
      scaledStyles[key] = scaleStyleObject(style, fontScale, screenScale);
    } else {
      scaledStyles[key] = style;
    }
  }

  return scaledStyles;
}

export function useResponsiveDesign(): ResponsiveDesignFunc {
  const windowDimensions = useWindowDimensions();
  const widthRatio = windowDimensions.width / baseDimensions.width;
  const heightRatio = windowDimensions.height / baseDimensions.height;

  const isPlatformWeb = Platform.OS === 'web';
  const isPlatformAndroid = Platform.OS === 'android';
  const isPlatformIos = Platform.OS === 'ios';
  const isPlatformNative = isPlatformAndroid || isPlatformIos;

  const isPhone = windowDimensions.width <= WEB_MAX_PHONE_WIDTH_PX;
  const isTablet = windowDimensions.width > WEB_MAX_PHONE_WIDTH_PX && windowDimensions.width <= WEB_MAX_TABLET_WIDTH_PX;
  const isDesktop = windowDimensions.width > WEB_MAX_TABLET_WIDTH_PX;
  const screenScale = Math.max(minDimensions.scale, Math.min(maxDimensions.scale, Math.min(widthRatio, heightRatio)));

  const allowFontScaling = false;

  const fontScale = Math.max(screenScale, allowFontScaling ? windowDimensions.fontScale : 1);

  const dimensions: ScaledSize = {
    width: windowDimensions.width,
    height: windowDimensions.height,
    scale: screenScale,
    fontScale: fontScale,
  };

  const deviceScreenType =
    windowDimensions.width < WEB_MAX_PHONE_WIDTH_PX
      ? 'phone'
      : windowDimensions.width < WEB_MAX_TABLET_WIDTH_PX
        ? 'tablet'
        : 'desktop';

  // These functions don't need memoization in React 19
  const createAppPageStyles = <T extends ComponentStyles>(styles: T): T => {
    // return styles;
    const scaledStyles = scaleStylesObject(styles, fontScale, screenScale);
    return scaledStyles;
  };

  const scaleProperties = <T extends ComponentStyles>(styles: T): T => {
    return scaleStylesObject(styles, fontScale, screenScale);
  };

  return {
    isPhone,
    isTablet,
    isDesktop,
    isPlatformWeb,
    isPlatformIos,
    isPlatformAndroid,
    isPlatformNative,
    dimensions,
    widthRatio,
    heightRatio,
    deviceScreenType,
    createAppPageStyles,
    scaleProperties,
    scaleStylesObject,
  };
}
