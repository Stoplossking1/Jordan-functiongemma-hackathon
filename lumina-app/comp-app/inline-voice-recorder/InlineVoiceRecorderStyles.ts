/**
 * Styling for the InlineVoiceRecorder component
 */

import type { TextStyle, ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

export interface InlineVoiceRecorderBaseStyles {
  container: ViewStyle;
  recordingIndicator: ViewStyle;
  recordingIndicatorPulse: ViewStyle;
  durationText: TextStyle;
  hintText: TextStyle;
  actionsContainer: ViewStyle;
  errorText: TextStyle;
}

export interface InlineVoiceRecorderStyles {
  styles: InlineVoiceRecorderBaseStyles;
  stopButtonStyles: CustomButtonStyles;
  cancelButtonStyles: CustomButtonStyles;
}

export function useInlineVoiceRecorderStyles(): InlineVoiceRecorderStyles {
  const { colors, spacingPresets, typographyPresets, buttonPresets, borderRadiusPresets, overrideStyles } = useStyleContext();

  const styles: InlineVoiceRecorderBaseStyles = {
    container: {
      backgroundColor: colors.secondaryBackground,
      borderRadius: borderRadiusPresets.components,
      padding: spacingPresets.md1,
      marginHorizontal: spacingPresets.md2,
      marginVertical: spacingPresets.sm,
      alignItems: 'center',
      gap: spacingPresets.sm,
    },
    recordingIndicator: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryAccent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    recordingIndicatorPulse: {
      opacity: 0.7,
    },
    durationText: {
      ...typographyPresets.Title,
      color: colors.primaryForeground,
      fontWeight: '600',
      fontVariant: ['tabular-nums'],
    },
    hintText: {
      ...typographyPresets.Caption,
      color: colors.tertiaryForeground,
      textAlign: 'center',
    },
    actionsContainer: {
      flexDirection: 'row',
      gap: spacingPresets.md1,
      marginTop: spacingPresets.xs,
    },
    errorText: {
      ...typographyPresets.Caption,
      color: colors.customColors.warning,
      textAlign: 'center',
    },
  };

  const stopButtonStyles = overrideStyles(buttonPresets.Primary, {
    container: {
      paddingHorizontal: spacingPresets.lg1,
      paddingVertical: spacingPresets.sm,
      borderRadius: borderRadiusPresets.components,
      minWidth: 120,
    },
    text: {
      ...typographyPresets.Label,
      fontWeight: '600',
    },
  });

  const cancelButtonStyles = overrideStyles(buttonPresets.Tertiary, {
    container: {
      paddingHorizontal: spacingPresets.md1,
      paddingVertical: spacingPresets.sm,
      borderRadius: borderRadiusPresets.components,
      minWidth: 80,
    },
    text: {
      ...typographyPresets.Label,
      color: colors.tertiaryForeground,
    },
  });

  return {
    styles,
    stopButtonStyles,
    cancelButtonStyles,
  };
}

