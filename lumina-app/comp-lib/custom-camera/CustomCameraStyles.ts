import { TextStyle, ViewStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '../core/custom-button/CustomButtonStyles';

/** interface for the base styles directly used on the component */
export interface CustomCameraBaseStyles {
  /** Container style for the main component wrapper */
  container: ViewStyle;
  /** Text style for message display */
  message: TextStyle;
  /** Style for the camera preview container */
  cameraContainer: ViewStyle;
  /** Style for the camera component itself */
  camera: ViewStyle;
  /** Style for the back navigation button */
  backButton: ViewStyle;
  /** Style for the container holding the shutter button */
  shutterContainer: ViewStyle;
  /** Style for the outer part of the shutter button */
  shutterBtn: ViewStyle;
  /** Style for the inner part of the shutter button */
  shutterBtnInner: ViewStyle;
}

/**
 * Interface for the return value of the useCustomCamera hook
 */
export interface CustomCameraStyles {
  /**
   * Styles object containing all component styles
   */
  styles: CustomCameraBaseStyles;
  /**
   * Typography presets for consistent text styling across the component
   */
  permissionButtonStyles: CustomButtonStyles;
}

export function useCustomCameraStyles(): CustomCameraStyles {
  const { createAppPageStyles, typographyPresets, buttonPresets, spacingPresets, overrideStyles, colors } =
    useStyleContext();
  const styles: CustomCameraBaseStyles = {
    container: {
      flex: 1,
      justifyContent: 'center',
      marginBottom: 0,
      marginTop: 0,
      paddingBottom: 0,
    },
    message: {
      ...typographyPresets.Body,
      textAlign: 'center',
      paddingBottom: spacingPresets.sm,
    },

    cameraContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: 'black',
    },
    camera: {
      flex: 1,
      width: '100%',
      backgroundColor: 'black',
    },
    backButton: {
      position: 'absolute',
      top: spacingPresets.sm,
      left: spacingPresets.sm,
      width: 24,
      height: 24,
    },
    shutterContainer: {
      position: 'absolute',
      bottom: 44,
      left: 0,
      width: '100%',
      alignItems: 'center',
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: spacingPresets.lg2,
    },
    shutterBtn: {
      backgroundColor: 'transparent',
      borderWidth: 5,
      borderColor: 'white',
      width: 85,
      height: 85,
      borderRadius: 45,
      alignItems: 'center',
      justifyContent: 'center',
    },
    shutterBtnInner: {
      width: 70,
      height: 70,
      borderRadius: 50,
    },
  };

  const permissionButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      borderRadius: 9999,
      alignSelf: 'stretch',
    },
    text: {
      ...typographyPresets.Body,
    },
  });
  return createAppPageStyles<CustomCameraStyles>({
    styles,
    permissionButtonStyles,
  });
}
