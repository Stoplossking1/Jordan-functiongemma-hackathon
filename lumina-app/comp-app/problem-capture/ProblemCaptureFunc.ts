import * as DocumentPicker from 'expo-document-picker';
import type { CameraMode, CameraType } from 'expo-camera';
import { useEffect, useState } from 'react';

import { useCustomCamera, type CustomCameraFunc } from '@/comp-lib/custom-camera/CustomCameraFunc';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';

const CAMERA_MODE: CameraMode = 'picture';
const CAMERA_TYPE: CameraType = 'back';
const IMAGE_DOCUMENT_TYPE = 'image/*';
const CAMERA_WEB_ERROR_MESSAGE = 'Camera is unavailable on web. Upload an image instead.';
const IMAGE_PICKER_ERROR_MESSAGE = 'Could not upload the image. Please try again.';
const EMPTY_IMAGE_ERROR_MESSAGE = 'Selected image is unavailable. Please try again.';
const SUBMIT_IMAGE_ERROR_MESSAGE = 'Could not continue to the tutor. Please try again.';

export interface ProblemCaptureProps {
  isVisible: boolean;
  isSubmitting: boolean;
  externalErrorMessage?: string;
  onCancel: () => void;
  onSubmitImage: (imageUri: string) => void;
}

export interface ProblemCaptureFunc {
  camera: CustomCameraFunc;
  isCameraActive: boolean;
  selectedImageUri?: string;
  isPickingImage: boolean;
  isBusy: boolean;
  errorMessage?: string;
  onStartCamera: () => void;
  onUploadImage: () => void;
  onCancelCamera: () => void;
  onRetake: () => void;
  onUseImage: () => void;
  onCancel: () => void;
}

export function useProblemCapture(props: ProblemCaptureProps): ProblemCaptureFunc {
  const camera = useCustomCamera({ mode: CAMERA_MODE, type: CAMERA_TYPE });
  const { isPlatformNative } = useResponsiveDesign();

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [selectedImageUri, setSelectedImageUri] = useState<string | undefined>(undefined);
  const [isPickingImage, setIsPickingImage] = useState(false);
  const [internalErrorMessage, setInternalErrorMessage] = useState<string | undefined>(undefined);

  const isBusy = props.isSubmitting || isPickingImage;
  const errorMessage = props.externalErrorMessage ?? internalErrorMessage;

  const capturedPhotoUri = camera.photoTaken?.uri;

  useEffect(() => {
    if (!props.isVisible) {
      setIsCameraActive(false);
      setSelectedImageUri(undefined);
      setIsPickingImage(false);
      setInternalErrorMessage(undefined);
    }
  }, [props.isVisible]);

  useEffect(() => {
    const capturedPhotoUriTrimmed = capturedPhotoUri?.trim();
    if (capturedPhotoUriTrimmed == null || capturedPhotoUriTrimmed.length === 0) {
      return;
    }

    setSelectedImageUri(capturedPhotoUriTrimmed);
    setIsCameraActive(false);
    setInternalErrorMessage(undefined);
  }, [capturedPhotoUri]);

  function onStartCamera(): void {
    if (isBusy) {
      return;
    }

    if (!isPlatformNative) {
      setInternalErrorMessage(CAMERA_WEB_ERROR_MESSAGE);
      return;
    }

    setInternalErrorMessage(undefined);
    setSelectedImageUri(undefined);
    setIsCameraActive(true);
    camera.reset();
  }

  async function pickImageAsync(): Promise<void> {
    try {
      setIsPickingImage(true);
      setInternalErrorMessage(undefined);
      setIsCameraActive(false);
      camera.reset();

      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: IMAGE_DOCUMENT_TYPE,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (pickerResult.canceled) {
        return;
      }

      const imageUri = pickerResult.assets?.[0]?.uri?.trim();
      if (imageUri == null || imageUri.length === 0) {
        setInternalErrorMessage(EMPTY_IMAGE_ERROR_MESSAGE);
        return;
      }

      setSelectedImageUri(imageUri);
    } catch (error) {
      console.error('pickImageAsync error:', error);
      setInternalErrorMessage(IMAGE_PICKER_ERROR_MESSAGE);
    } finally {
      setIsPickingImage(false);
    }
  }

  function onUploadImage(): void {
    if (isBusy) {
      return;
    }

    pickImageAsync().catch((error) => {
      console.error('onUploadImage error:', error);
      setInternalErrorMessage(IMAGE_PICKER_ERROR_MESSAGE);
      setIsPickingImage(false);
    });
  }

  function onCancelCamera(): void {
    if (props.isSubmitting) {
      return;
    }

    setIsCameraActive(false);
    camera.reset();
  }

  function onRetake(): void {
    if (isBusy) {
      return;
    }

    setSelectedImageUri(undefined);
    setInternalErrorMessage(undefined);
    onStartCamera();
  }

  function onUseImage(): void {
    if (isBusy) {
      return;
    }

    const imageUri = selectedImageUri?.trim();
    if (imageUri == null || imageUri.length === 0) {
      setInternalErrorMessage(EMPTY_IMAGE_ERROR_MESSAGE);
      return;
    }

    try {
      props.onSubmitImage(imageUri);
    } catch (error) {
      console.error('onUseImage error:', error);
      setInternalErrorMessage(SUBMIT_IMAGE_ERROR_MESSAGE);
    }
  }

  function onCancel(): void {
    if (isBusy) {
      return;
    }

    setIsCameraActive(false);
    setSelectedImageUri(undefined);
    setInternalErrorMessage(undefined);
    camera.reset();
    props.onCancel();
  }

  return {
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
  };
}
