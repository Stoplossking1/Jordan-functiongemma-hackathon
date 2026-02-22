import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { UsageProgressBarProps } from './UsageProgressBar';

const PROGRESS_BAR_ANIMATION_DURATION = 800;

export type AnimatedPercent = Animated.Value | Animated.AnimatedInterpolation<number>;

export type ProgressBarAnimationConstants = {
  inputRange: number[];
  outputRange: number[];
  extrapolate: 'clamp' | 'extend';
};

export const PROGRESS_BAR_ANIMATION_CONSTANTS: ProgressBarAnimationConstants = {
  inputRange: [0, 100],
  outputRange: [0, 1],
  extrapolate: 'clamp',
};

export interface UsageProgressBarFunc {
  animatedPercent: Animated.Value;
}

export function useUsageProgressBar(props: UsageProgressBarProps): UsageProgressBarFunc {
  const percent = Math.max(0, Math.min(100, props.percent));
  const animatedPercent = useRef(new Animated.Value(percent)).current;

  useEffect(() => {
    Animated.timing(animatedPercent, {
      toValue: percent,
      duration: PROGRESS_BAR_ANIMATION_DURATION,
      useNativeDriver: false,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent]);

  return {
    animatedPercent,
  };
}
