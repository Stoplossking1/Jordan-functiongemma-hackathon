import { type ReactNode } from 'react';
import { ActivityIndicator, Image, Modal, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import OptionalWrapper from '@/comp-lib/common/OptionalWrapper';
import CustomCamera from '@/comp-lib/custom-camera/CustomCamera';
import { CustomButton } from '@/comp-lib/core/custom-button/CustomButton';
import { CustomTextField } from '@/comp-lib/core/custom-text-field/CustomTextField';
import { useStyleContext } from '@/comp-lib/styles/StyleContext';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';
import { useProblemCapture, type ProblemCaptureProps } from './ProblemCaptureFunc';
import { useProblemCaptureStyles } from './ProblemCaptureStyles';

const DEFAULT_TITLE = 'Snap a Problem';
const DEFAULT_SUBTITLE = 'Take a photo or upload one to start solving.';
const PREVIEW_TITLE = 'Use this image?';
const PREVIEW_SUBTITLE = 'Check the image and continue to get help.';
const PREVIEW_LABEL = 'Problem preview';
const HELP_TEXT = 'Tip: include the full equation in one image.';
const PICKING_IMAGE_TEXT = 'Uploading image...';
const SUBMITTING_IMAGE_TEXT = 'Opening tutor...';

export function ProblemCapture(props: ProblemCaptureProps): ReactNode {
  const {
    camera,
    isCameraActive,
    selectedImageUri,
    isPickingImage,
    isBusy,
    errorMessage,
    onStartCamera,
    onUploadImage,
    onCancelCamera,
    onRetake,
    onUseImage,
    onCancel,
  } = useProblemCapture(props);
  const { styles, captureButtonStyles, uploadButtonStyles, cancelButtonStyles, continueButtonStyles, retakeButtonStyles } =
    useProblemCaptureStyles();
  const { colors } = useStyleContext();
  const { isPlatformWeb } = useResponsiveDesign();

  const wrapperProps = { edges: ['top', 'left', 'right', 'bottom'] };
  const busyText = props.isSubmitting ? SUBMITTING_IMAGE_TEXT : isPickingImage ? PICKING_IMAGE_TEXT : undefined;
  const hasSelectedImage = selectedImageUri != null;
  const previewImageUri = selectedImageUri ?? '';

  if (!props.isVisible) {
    return null;
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
              onCancel={onCancelCamera}
            />
          </View>
        ) : (
          <View style={styles.container}>
            <View style={styles.content}>
              <View style={styles.header}>
                <CustomTextField styles={styles.title} title={hasSelectedImage ? PREVIEW_TITLE : DEFAULT_TITLE} />
                <CustomTextField styles={styles.subtitle} title={hasSelectedImage ? PREVIEW_SUBTITLE : DEFAULT_SUBTITLE} />
              </View>

              {hasSelectedImage ? (
                <View style={styles.previewContainer}>
                  <Image source={{ uri: previewImageUri }} style={styles.previewImage} />
                  <CustomTextField styles={styles.previewLabel} title={PREVIEW_LABEL} />
                </View>
              ) : (
                <CustomTextField styles={styles.helpText} title={HELP_TEXT} />
              )}

              {busyText ? (
                <View style={styles.busyContainer}>
                  <ActivityIndicator size="small" color={colors.primaryAccent} />
                  <CustomTextField styles={styles.busyText} title={busyText} />
                </View>
              ) : undefined}

              {errorMessage ? <CustomTextField styles={styles.errorText} title={errorMessage} /> : undefined}
            </View>

            <View style={styles.actionStack}>
              {hasSelectedImage ? (
                <View style={styles.actionRow}>
                  <CustomButton title="Retake" onPress={onRetake} disabled={isBusy} styles={retakeButtonStyles} />
                  <CustomButton
                    title="Continue"
                    onPress={onUseImage}
                    disabled={isBusy}
                    isLoading={props.isSubmitting}
                    styles={continueButtonStyles}
                  />
                  <CustomButton title="Cancel" onPress={onCancel} disabled={isBusy} styles={cancelButtonStyles} />
                </View>
              ) : (
                <View style={styles.actionRow}>
                  <CustomButton title="Take Photo" onPress={onStartCamera} disabled={isBusy} styles={captureButtonStyles} />
                  <CustomButton
                    title="Upload"
                    onPress={onUploadImage}
                    disabled={isBusy}
                    isLoading={isPickingImage}
                    styles={uploadButtonStyles}
                  />
                  <CustomButton title="Cancel" onPress={onCancel} disabled={isBusy} styles={cancelButtonStyles} />
                </View>
              )}
            </View>
          </View>
        )}
      </OptionalWrapper>
    </Modal>
  );
}
