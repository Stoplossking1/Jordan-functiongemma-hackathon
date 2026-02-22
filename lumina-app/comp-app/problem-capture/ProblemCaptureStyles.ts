import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { type CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

const PREVIEW_IMAGE_HEIGHT_PX = 220;
const PREVIEW_IMAGE_BORDER_RADIUS_PX = 16;
const CONTENT_MAX_WIDTH_PX = 520;

export interface ProblemCaptureBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  cameraContainer: ViewStyle;
  content: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  previewContainer: ViewStyle;
  previewImage: ImageStyle;
  previewLabel: TextStyle;
  helpText: TextStyle;
  busyContainer: ViewStyle;
  busyText: TextStyle;
  errorText: TextStyle;
  actionStack: ViewStyle;
  actionRow: ViewStyle;
}

export interface ProblemCaptureStyles {
  styles: ProblemCaptureBaseStyles;
  captureButtonStyles: CustomButtonStyles;
  uploadButtonStyles: CustomButtonStyles;
  cancelButtonStyles: CustomButtonStyles;
  continueButtonStyles: CustomButtonStyles;
  retakeButtonStyles: CustomButtonStyles;
}

export function useProblemCaptureStyles(): ProblemCaptureStyles {
  const {
    createAppPageStyles,
    overrideStyles,
    colors,
    spacingPresets,
    typographyPresets,
    borderRadiusPresets,
    buttonPresets,
  } = useStyleContext();

  const styles: ProblemCaptureBaseStyles = {
    safeArea: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
    },
    container: {
      flex: 1,
      backgroundColor: colors.primaryBackground,
      paddingHorizontal: spacingPresets.md2,
      paddingVertical: spacingPresets.md2,
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cameraContainer: {
      flex: 1,
      width: '100%',
      backgroundColor: colors.primaryBackground,
    },
    content: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH_PX,
      gap: spacingPresets.md1,
      alignSelf: 'center',
    },
    header: {
      gap: spacingPresets.xs,
    },
    title: {
      ...typographyPresets.PageTitle,
      color: colors.primaryForeground,
      textAlign: 'left',
    },
    subtitle: {
      ...typographyPresets.Body,
      color: colors.tertiaryForeground,
      textAlign: 'left',
    },
    previewContainer: {
      width: '100%',
      borderRadius: borderRadiusPresets.components,
      overflow: 'hidden',
      backgroundColor: colors.secondaryBackground,
      gap: spacingPresets.sm,
      paddingBottom: spacingPresets.sm,
    },
    previewImage: {
      width: '100%',
      height: PREVIEW_IMAGE_HEIGHT_PX,
      borderRadius: PREVIEW_IMAGE_BORDER_RADIUS_PX,
    },
    previewLabel: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
      textAlign: 'left',
      paddingHorizontal: spacingPresets.sm,
    },
    helpText: {
      ...typographyPresets.Body,
      color: colors.secondaryForeground,
      textAlign: 'left',
    },
    busyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.sm,
      minHeight: 24,
    },
    busyText: {
      ...typographyPresets.Caption,
      color: colors.secondaryForeground,
    },
    errorText: {
      ...typographyPresets.Caption,
      color: colors.customColors.error,
      textAlign: 'left',
    },
    actionStack: {
      width: '100%',
      maxWidth: CONTENT_MAX_WIDTH_PX,
      gap: spacingPresets.sm,
      alignSelf: 'center',
      marginTop: spacingPresets.md1,
    },
    actionRow: {
      width: '100%',
      gap: spacingPresets.sm,
    },
  };

  const captureButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
    },
  });

  const uploadButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      width: '100%',
    },
  });

  const cancelButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      width: '100%',
    },
    text: {
      color: colors.tertiaryForeground,
    },
    icon: {
      color: colors.tertiaryForeground,
    },
  });

  const continueButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
    },
  });

  const retakeButtonStyles = overrideStyles(buttonPresets.Secondary, {
    container: {
      width: '100%',
    },
  });

  return createAppPageStyles<ProblemCaptureStyles>({
    styles,
    captureButtonStyles,
    uploadButtonStyles,
    cancelButtonStyles,
    continueButtonStyles,
    retakeButtonStyles,
  });
}
