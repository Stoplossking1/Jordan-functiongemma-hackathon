import { TextStyle, ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { CustomButtonStyles } from '@/comp-lib/core/custom-button/CustomButtonStyles';

export interface BannerBaseStyles {
  banner: ViewStyle;
  bannerText: TextStyle;
  button: CustomButtonStyles;
}

export interface BannerStyles {
  styles: BannerBaseStyles;
}

export function useBannerStyles(customStyles?: Partial<BannerBaseStyles>): BannerStyles {
  const { colors, spacingPresets, buttonPresets, overrideStyles } = useStyleContext();

  const baseStyles: BannerBaseStyles = {
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacingPresets.md1,
      backgroundColor: colors.customColors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: 'rgba(0, 0, 0, 0.1)',
    },
    bannerText: {
      marginRight: spacingPresets.md1,
      color: colors.primaryForeground,
    },
    button: overrideStyles(buttonPresets.Primary, {
      container: {
        backgroundColor: colors.primaryForeground,
        margin: 0,
        paddingHorizontal: spacingPresets.md1,
        minHeight: spacingPresets.lg2,
      },
      text: {
        color: colors.primaryBackground,
        fontSize: 13,
      },
    }),
  };

  const styles = overrideStyles(baseStyles, customStyles);

  return {
    styles,
  };
}
