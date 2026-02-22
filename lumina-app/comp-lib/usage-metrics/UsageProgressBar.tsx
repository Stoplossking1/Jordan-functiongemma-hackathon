import React, { type ReactNode } from 'react';
import { View, type ViewStyle, type StyleProp, Animated } from 'react-native';

import { type UsageProgressBarBaseStyles, useUsageProgressBarStyles } from './UsageProgressBarStyles';
import { useUsageProgressBar } from './UsageProgressBarFunc';

export interface UsageProgressBarProps {
  percent: number;
  style?: StyleProp<ViewStyle>;
  barColor?: string;
  backgroundColor?: string;
  barStyles?: UsageProgressBarBaseStyles;
}

export function UsageProgressBar(props: UsageProgressBarProps): ReactNode {
  const { animatedPercent } = useUsageProgressBar(props);

  const { styles, animatedBarStyle } = useUsageProgressBarStyles(
    animatedPercent,
    props.barStyles,
    props.barColor,
    props.backgroundColor,
  );

  return (
    <View style={[styles.container, props.style]}>
      <View style={styles.background}>
        <Animated.View style={animatedBarStyle} />
      </View>
    </View>
  );
}
