/**
 * InlineVoiceRecorder component - displays an inline recording UI
 * that starts recording immediately when shown
 */

import { type ReactNode, useEffect, useRef } from 'react';
import { Animated, View, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { useInlineVoiceRecorder, type InlineVoiceRecorderProps } from './InlineVoiceRecorderFunc';
import { useInlineVoiceRecorderStyles } from './InlineVoiceRecorderStyles';

const RECORDING_HINT = 'Recording... Tap Done when finished';

function formatDuration(durationInMs: number): string {
  const totalSeconds = Math.floor(durationInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function InlineVoiceRecorder(props: InlineVoiceRecorderProps): ReactNode {
  const {
    isRecordingActive,
    recordingDurationInMs,
    errorMessage,
    onStopRecording,
    onCancelRecording,
  } = useInlineVoiceRecorder(props);

  const { styles, stopButtonStyles, cancelButtonStyles } = useInlineVoiceRecorderStyles();
  const { colors } = useStyleContext();

  // Pulse animation for recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRecordingActive) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    return undefined;
  }, [isRecordingActive, pulseAnim]);

  if (!props.isRecording && !isRecordingActive) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.recordingIndicator,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Ionicons name="mic" size={28} color={colors.primaryAccentForeground} />
      </Animated.View>

      <CustomTextField styles={styles.durationText} title={formatDuration(recordingDurationInMs)} />
      <CustomTextField styles={styles.hintText} title={RECORDING_HINT} />

      {errorMessage && (
        <CustomTextField styles={styles.errorText} title={errorMessage} />
      )}

      <View style={styles.actionsContainer}>
        <CustomButton
          title="Done"
          onPress={onStopRecording}
          styles={stopButtonStyles}
        />
        <CustomButton
          title="Cancel"
          onPress={onCancelRecording}
          styles={cancelButtonStyles}
        />
      </View>
    </View>
  );
}

export type { InlineVoiceRecorderProps, RecordedVoice } from './InlineVoiceRecorderFunc';

