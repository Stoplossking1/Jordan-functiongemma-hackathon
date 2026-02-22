import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';

import { type CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';

const PREVIEW_IMAGE_HEIGHT_PX = 220;
const PREVIEW_IMAGE_BORDER_RADIUS_PX = 16;
const CONTENT_MAX_WIDTH_PX = 520;
const RECORDING_INDICATOR_SIZE_PX = 80;
const MODE_TAB_HEIGHT_PX = 44;

export interface MediaCaptureBaseStyles {
  safeArea: ViewStyle;
  container: ViewStyle;
  cameraContainer: ViewStyle;
  content: ViewStyle;
  header: ViewStyle;
  title: TextStyle;
  subtitle: TextStyle;
  modeTabs: ViewStyle;
  modeTab: ViewStyle;
  modeTabActive: ViewStyle;
  modeTabText: TextStyle;
  modeTabTextActive: TextStyle;
  previewContainer: ViewStyle;
  previewImage: ImageStyle;
  previewLabel: TextStyle;
  recordingContainer: ViewStyle;
  recordingIndicator: ViewStyle;
  recordingIndicatorActive: ViewStyle;
  recordingDuration: TextStyle;
  recordingHint: TextStyle;
  audioPreviewContainer: ViewStyle;
  audioPreviewIcon: ViewStyle;
  audioPreviewDuration: TextStyle;
  helpText: TextStyle;
  busyContainer: ViewStyle;
  busyText: TextStyle;
  errorText: TextStyle;
  actionStack: ViewStyle;
  actionRow: ViewStyle;
}

export interface MediaCaptureStyles {
  styles: MediaCaptureBaseStyles;
  captureButtonStyles: CustomButtonStyles;
  recordButtonStyles: CustomButtonStyles;
  stopButtonStyles: CustomButtonStyles;
  uploadButtonStyles: CustomButtonStyles;
  cancelButtonStyles: CustomButtonStyles;
  continueButtonStyles: CustomButtonStyles;
  retakeButtonStyles: CustomButtonStyles;
}

export function useMediaCaptureStyles(): MediaCaptureStyles {
  const {
    createAppPageStyles,
    overrideStyles,
    colors,
    spacingPresets,
    typographyPresets,
    borderRadiusPresets,
    buttonPresets,
  } = useStyleContext();

  const styles: MediaCaptureBaseStyles = {
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
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.xxs,
      gap: spacingPresets.xxs,
    },
    modeTab: {
      flex: 1,
      height: MODE_TAB_HEIGHT_PX,
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: borderRadiusPresets.components - 2,
    },
    modeTabActive: {
      backgroundColor: colors.primaryBackground,
    },
    modeTabText: {
      ...typographyPresets.Label,
      color: colors.tertiaryForeground,
    },
    modeTabTextActive: {
      color: colors.primaryForeground,
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
    recordingContainer: {
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacingPresets.lg1,
      gap: spacingPresets.md1,
    },
    recordingIndicator: {
      width: RECORDING_INDICATOR_SIZE_PX,
      height: RECORDING_INDICATOR_SIZE_PX,
      borderRadius: RECORDING_INDICATOR_SIZE_PX / 2,
      backgroundColor: colors.secondaryBackground,
      justifyContent: 'center',
      alignItems: 'center',
    },
    recordingIndicatorActive: {
      backgroundColor: colors.customColors.error,
    },
    recordingDuration: {
      ...typographyPresets.Title,
      color: colors.primaryForeground,
      fontVariant: ['tabular-nums'],
    },
    recordingHint: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      textAlign: 'center',
    },
    audioPreviewContainer: {
      width: '100%',
      borderRadius: borderRadiusPresets.components,
      backgroundColor: colors.secondaryBackground,
      padding: spacingPresets.md1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacingPresets.md1,
    },
    audioPreviewIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryAccentLight,
      justifyContent: 'center',
      alignItems: 'center',
    },
    audioPreviewDuration: {
      ...typographyPresets.Label,
      color: colors.primaryForeground,
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

  const recordButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
      backgroundColor: colors.customColors.error,
    },
  });

  const stopButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      width: '100%',
      backgroundColor: colors.customColors.error,
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

  return createAppPageStyles<MediaCaptureStyles>({
    styles,
    captureButtonStyles,
    recordButtonStyles,
    stopButtonStyles,
    uploadButtonStyles,
    cancelButtonStyles,
    continueButtonStyles,
    retakeButtonStyles,
  });
}

