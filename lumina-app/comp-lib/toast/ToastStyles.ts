import { ViewStyle, TextStyle } from 'react-native';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { type ToastType } from './useToast';
import { CustomButtonStyles } from '../core/custom-button/CustomButtonStyles';

interface ColorScheme {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
}

export interface ToastBaseStyles {
  container: ViewStyle;
  content: ViewStyle;
  message: TextStyle;
  closeButton: CustomButtonStyles;
  closeButtonText: TextStyle;
}

export interface ToastStyles {
  styles: ToastBaseStyles;
}

export function useToastStyles(type: ToastType): ToastStyles {
  const {
    createAppPageStyles,
    colors,
    typographyPresets,
    spacingPresets,
    borderRadiusPresets,
    buttonPresets,
    overrideStyles,
  } = useStyleContext();

  const colorSchemes: Record<ToastType, ColorScheme> = {
    success: {
      backgroundColor: colors.customColors.toast.successBackground,
      textColor: colors.customColors.toast.text,
      borderColor: colors.customColors.toast.successBorder,
    },
    error: {
      backgroundColor: colors.customColors.toast.errorBackground,
      textColor: colors.customColors.toast.text,
      borderColor: colors.customColors.toast.errorBorder,
    },
    warning: {
      backgroundColor: colors.customColors.toast.warningBackground,
      textColor: colors.customColors.toast.text,
      borderColor: colors.customColors.toast.warningBorder,
    },
    info: {
      backgroundColor: colors.customColors.toast.infoBackground,
      textColor: colors.customColors.toast.text,
      borderColor: colors.customColors.toast.infoBorder,
    },
  };

  const toastColors = colorSchemes[type];

  const styles: ToastBaseStyles = {
    container: {
      position: 'absolute',
      bottom: spacingPresets.lg1,
      left: spacingPresets.md2,
      right: spacingPresets.md2,
      zIndex: 1000,
      elevation: 5,
      alignItems: 'center',
    },
    content: {
      backgroundColor: toastColors.backgroundColor,
      borderColor: toastColors.borderColor,
      borderWidth: 1,
      borderRadius: borderRadiusPresets.components,
      paddingHorizontal: spacingPresets.md2,
      paddingVertical: spacingPresets.md1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      minHeight: 48,
      width: '100%',
      maxWidth: '100%',
    },
    message: {
      ...typographyPresets.Body,
      color: toastColors.textColor,
      flex: 1,
      marginRight: spacingPresets.sm,
      flexShrink: 1,
    },
    closeButton: overrideStyles(buttonPresets.Tertiary, {
      container: {
        width: 24,
        height: 24,
        borderRadius: borderRadiusPresets.components,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: 0.7,
      },
      text: {
        ...typographyPresets.Caption,
        color: toastColors.textColor,
        fontWeight: 'bold',
      },
    }),
    closeButtonText: {
      ...typographyPresets.Caption,
      color: toastColors.textColor,
      fontWeight: 'bold',
    },
  };

  return createAppPageStyles<ToastStyles>({ styles });
}
