import { ViewStyle } from 'react-native';

import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { type AnimatedPercent, PROGRESS_BAR_ANIMATION_CONSTANTS } from './UsageProgressBarFunc';

export interface UsageProgressBarBaseStyles {
  container?: ViewStyle;
  background?: ViewStyle;
  bar?: ViewStyle;
}

export interface UsageProgressBarStyles {
  styles: UsageProgressBarBaseStyles;
  animatedBarStyle: ViewStyle;
}

export function useUsageProgressBarStyles(
  animatedPercent: AnimatedPercent,
  customStyles?: UsageProgressBarBaseStyles,
  barColor?: string,
  backgroundColor?: string,
): UsageProgressBarStyles {
  const { colors, borderRadiusPresets, overrideStyles, createAppPageStyles } = useStyleContext();

  const defaultStyles: UsageProgressBarBaseStyles = {
    container: {
      width: '100%',
    },
    background: {
      height: 8,
      backgroundColor: backgroundColor ?? colors.tertiaryBackground,
      borderRadius: borderRadiusPresets.components,
      overflow: 'hidden',
    },
    bar: {
      height: '100%',
      backgroundColor: barColor ?? colors.primaryAccent,
      borderRadius: borderRadiusPresets.components,
    },
  };

  const animatedBarStyle: ViewStyle = {
    height: '100%',
    width: '100%',
    backgroundColor: barColor ?? colors.primaryAccent,
    borderRadius: borderRadiusPresets.components,
    transform: [
      {
        scaleX: animatedPercent.interpolate({
          inputRange: PROGRESS_BAR_ANIMATION_CONSTANTS.inputRange,
          outputRange: PROGRESS_BAR_ANIMATION_CONSTANTS.outputRange,
          extrapolate: PROGRESS_BAR_ANIMATION_CONSTANTS.extrapolate,
        }),
      },
    ],
    transformOrigin: 'left',
  };

  const styles = overrideStyles(defaultStyles, customStyles);

  return createAppPageStyles<UsageProgressBarStyles>({
    styles,
    animatedBarStyle,
  });
}
