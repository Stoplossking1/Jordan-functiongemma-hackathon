import { type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import CustomCamera from '@/comp-lib/custom-camera/CustomCamera';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { useMediaCapture, type MediaCaptureProps, type MediaCaptureMode } from './MediaCaptureFunc';
import { useMediaCaptureStyles } from './MediaCaptureStyles';

const IMAGE_TITLE = 'Snap a Problem';
const IMAGE_SUBTITLE = 'Take a photo or upload one to start solving.';
const VOICE_TITLE = 'Describe Your Problem';
const VOICE_SUBTITLE = 'Record yourself explaining the math problem.';
const IMAGE_PREVIEW_TITLE = 'Use this image?';
const IMAGE_PREVIEW_SUBTITLE = 'Check the image and continue to get help.';
const VOICE_PREVIEW_TITLE = 'Use this recording?';
const VOICE_PREVIEW_SUBTITLE = 'Listen to your recording and continue.';
const PREVIEW_LABEL = 'Problem preview';
const IMAGE_HELP_TEXT = 'Tip: include the full equation in one image.';
const VOICE_HELP_TEXT = 'Tip: clearly describe the problem step by step.';
const PICKING_IMAGE_TEXT = 'Uploading image...';
const PICKING_AUDIO_TEXT = 'Uploading audio...';
const SUBMITTING_TEXT = 'Opening tutor...';
const RECORDING_HINT = 'Tap to start recording';
const RECORDING_ACTIVE_HINT = 'Recording... Tap stop when done';
const TAB_PHOTO = 'Photo';
const TAB_VOICE = 'Voice';

function formatDuration(durationInMs: number): string {
  const totalSeconds = Math.floor(durationInMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function MediaCapture(props: MediaCaptureProps): ReactNode {
  const {
    camera,
    mode,
    isCameraActive,
    isRecording,
    recordingDurationInMs,
    selectedMedia,
    isPickingMedia,
    isBusy,
    errorMessage,
    onSwitchMode,
    onStartCamera,
    onStartRecording,
    onStopRecording,
    onUploadMedia,
    onCancelCapture,
    onRetake,
    onUseMedia,
    onCancel,
  } = useMediaCapture(props);

  const {
    styles,
    captureButtonStyles,
    recordButtonStyles,
    stopButtonStyles,
    uploadButtonStyles,
    cancelButtonStyles,
    continueButtonStyles,
    retakeButtonStyles,
  } = useMediaCaptureStyles();
  const { colors } = useStyleContext();
  const { isPlatformWeb } = useResponsiveDesign();

  const wrapperProps = { edges: ['top', 'left', 'right', 'bottom'] };
  const hasSelectedMedia = selectedMedia != null;
  const isImageMode = mode === 'image';
  const isVoiceMode = mode === 'voice';

  const title = hasSelectedMedia
    ? isImageMode
      ? IMAGE_PREVIEW_TITLE
      : VOICE_PREVIEW_TITLE
    : isImageMode
      ? IMAGE_TITLE
      : VOICE_TITLE;

  const subtitle = hasSelectedMedia
    ? isImageMode
      ? IMAGE_PREVIEW_SUBTITLE
      : VOICE_PREVIEW_SUBTITLE
    : isImageMode
      ? IMAGE_SUBTITLE
      : VOICE_SUBTITLE;

  const helpText = isImageMode ? IMAGE_HELP_TEXT : VOICE_HELP_TEXT;

  const busyText = props.isSubmitting
    ? SUBMITTING_TEXT
    : isPickingMedia
      ? isImageMode
        ? PICKING_IMAGE_TEXT
        : PICKING_AUDIO_TEXT
      : undefined;

  if (!props.isVisible) {
    return null;
  }

  function renderModeTabs(): ReactNode {
    return (
      <View style={styles.modeTabs}>
        <Pressable
          style={[styles.modeTab, isImageMode && styles.modeTabActive]}
          onPress={() => onSwitchMode('image')}
          disabled={isBusy}
        >
          <CustomTextField
            styles={{ ...styles.modeTabText, ...(isImageMode ? styles.modeTabTextActive : {}) }}
            title={TAB_PHOTO}
          />
        </Pressable>
        <Pressable
          style={[styles.modeTab, isVoiceMode && styles.modeTabActive]}
          onPress={() => onSwitchMode('voice')}
          disabled={isBusy}
        >
          <CustomTextField
            styles={{ ...styles.modeTabText, ...(isVoiceMode ? styles.modeTabTextActive : {}) }}
            title={TAB_VOICE}
          />
        </Pressable>
      </View>
    );
  }

  function renderImagePreview(): ReactNode {
    if (!hasSelectedMedia || selectedMedia.type !== 'image') {
      return null;
    }

    return (
      <View style={styles.previewContainer}>
        <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
        <CustomTextField styles={styles.previewLabel} title={PREVIEW_LABEL} />
      </View>
    );
  }

  function renderVoiceRecording(): ReactNode {
    if (hasSelectedMedia) {
      return null;
    }

    return (
      <View style={styles.recordingContainer}>
        <View style={[styles.recordingIndicator, isRecording && styles.recordingIndicatorActive]}>
          <Ionicons name={isRecording ? 'stop' : 'mic'} size={32} color={isRecording ? colors.primaryBackground : colors.primaryAccent} />
        </View>
        <CustomTextField styles={styles.recordingDuration} title={formatDuration(recordingDurationInMs)} />
        <CustomTextField styles={styles.recordingHint} title={isRecording ? RECORDING_ACTIVE_HINT : RECORDING_HINT} />
      </View>
    );
  }

  function renderAudioPreview(): ReactNode {
    if (!hasSelectedMedia || selectedMedia.type !== 'voice') {
      return null;
    }

    const durationText = selectedMedia.durationInMs != null ? formatDuration(selectedMedia.durationInMs) : '00:00';

    return (
      <View style={styles.audioPreviewContainer}>
        <View style={styles.audioPreviewIcon}>
          <Ionicons name="mic" size={24} color={colors.primaryAccent} />
        </View>
        <View>
          <CustomTextField styles={styles.audioPreviewDuration} title={durationText} />
          <CustomTextField styles={styles.previewLabel} title="Voice recording" />
        </View>
      </View>
    );
  }

  function renderImageActions(): ReactNode {
    if (hasSelectedMedia) {
      return (
        <View style={styles.actionRow}>
          <CustomButton title="Retake" onPress={onRetake} disabled={isBusy} styles={retakeButtonStyles} />
          <CustomButton
            title="Continue"
            onPress={onUseMedia}
            disabled={isBusy}
            isLoading={props.isSubmitting}
            styles={continueButtonStyles}
          />
          <CustomButton title="Cancel" onPress={onCancel} disabled={isBusy} styles={cancelButtonStyles} />
        </View>
      );
    }

    return (
      <View style={styles.actionRow}>
        <CustomButton title="Take Photo" onPress={onStartCamera} disabled={isBusy} styles={captureButtonStyles} />
        <CustomButton title="Upload" onPress={onUploadMedia} disabled={isBusy} isLoading={isPickingMedia} styles={uploadButtonStyles} />
        <CustomButton title="Cancel" onPress={onCancel} disabled={isBusy} styles={cancelButtonStyles} />
      </View>
    );
  }

  function renderVoiceActions(): ReactNode {
    if (hasSelectedMedia) {
      return (
        <View style={styles.actionRow}>
          <CustomButton title="Record Again" onPress={onRetake} disabled={isBusy} styles={retakeButtonStyles} />
          <CustomButton
            title="Continue"
            onPress={onUseMedia}
            disabled={isBusy}
            isLoading={props.isSubmitting}
            styles={continueButtonStyles}
          />
          <CustomButton title="Cancel" onPress={onCancel} disabled={isBusy} styles={cancelButtonStyles} />
        </View>
      );
    }

    if (isRecording) {
      return (
        <View style={styles.actionRow}>
          <CustomButton title="Stop Recording" onPress={onStopRecording} styles={stopButtonStyles} />
          <CustomButton title="Cancel" onPress={onCancel} styles={cancelButtonStyles} />
        </View>
      );
    }

    return (
      <View style={styles.actionRow}>
        <CustomButton title="Start Recording" onPress={onStartRecording} disabled={isBusy} styles={recordButtonStyles} />
        <CustomButton title="Upload Audio" onPress={onUploadMedia} disabled={isBusy} isLoading={isPickingMedia} styles={uploadButtonStyles} />
        <CustomButton title="Cancel" onPress={onCancel} disabled={isBusy} styles={cancelButtonStyles} />
      </View>
    );
  }

  return (
    <Modal visible={props.isVisible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onCancel}>
      <OptionalWrapper Wrapper={SafeAreaView} enable={!isPlatformWeb} style={styles.safeArea} wrapperProps={wrapperProps}>
        {isCameraActive ? (
          <View style={styles.cameraContainer}>
            <CustomCamera
              ref={camera.ref}
              mode={camera.mode}
              type={camera.type}
              setType={camera.setType}
              setMode={camera.setMode}
              recording={camera.recording}
              permission={camera.permission}
              onRequestPermission={camera.onRequestPermission}
              onPressShutterButton={camera.onPressShutterButton}
              photoTaken={camera.photoTaken}
              cameraRatio={camera.cameraRatio}
              reset={camera.reset}
              onCancel={onCancelCapture}
            />
          </View>
        ) : (
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.header}>
                <CustomTextField styles={styles.title} title={title} />
                <CustomTextField styles={styles.subtitle} title={subtitle} />
              </View>

              {renderModeTabs()}

              {isImageMode && hasSelectedMedia && renderImagePreview()}
              {isVoiceMode && renderVoiceRecording()}
              {isVoiceMode && renderAudioPreview()}

              {!hasSelectedMedia && !isRecording && <CustomTextField styles={styles.helpText} title={helpText} />}

              {busyText ? (
                <View style={styles.busyContainer}>
                  <ActivityIndicator size="small" color={colors.primaryAccent} />
                  <CustomTextField styles={styles.busyText} title={busyText} />
                </View>
              ) : undefined}

              {errorMessage ? <CustomTextField styles={styles.errorText} title={errorMessage} /> : undefined}
            </View>

            <View style={styles.actionStack}>{isImageMode ? renderImageActions() : renderVoiceActions()}</View>
          </View>
        )}
      </OptionalWrapper>
    </Modal>
  );
}

export type { MediaCaptureProps, MediaCaptureMode, CapturedMedia } from './MediaCaptureFunc';

