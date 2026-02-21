import { useCallback, useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export function useToastFunc(
  isVisible: boolean,
  duration: number,
  onDismiss: () => void,
): {
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  handleDismiss: () => void;
} {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  const handleDismiss = useCallback((): void => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    let timer: number | null = null;

    if (isVisible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      timer = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      // Hide animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isVisible, duration, fadeAnim, slideAnim, handleDismiss]);

  return {
    fadeAnim,
    slideAnim,
    handleDismiss,
  };
}
