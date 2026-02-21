// useAuth.ts
import { useState, useRef, type Ref } from 'react';
import {
  type CameraRatio,
  CameraView,
  type PermissionResponse,
  useCameraPermissions,
  type CameraCapturedPicture,
  type CameraMode,
  type CameraType,
} from 'expo-camera';

export interface CustomCameraProps {
  mode: CameraMode;
  type: CameraType;
  cameraRatio?: CameraRatio;
}

/**
 * Interface for the return value of the useCamera hook
 */
export interface CustomCameraFunc {
  /**
   * Current camera mode (photo or video)
   */
  mode: CameraMode;

  /**
   * Current camera type (front or back)
   */
  type: CameraType;

  /**
   * Sets the active camera type
   */
  setType: (type: CameraType) => void;

  /**
   * Sets the camera mode (photo/video)
   */
  setMode: (mode: CameraMode) => void;

  /**
   * Whether video is actively recording
   */
  recording: boolean;

  /**
   * Camera permission response object
   */
  permission: PermissionResponse | undefined;

  /**
   * Triggers permission request dialog
   */
  onRequestPermission: () => void;

  /**
   * Ref to the CameraView component
   */
  ref: Ref<CameraView> | null;

  /**
   * Handles shutter press — takes photo or records video based on mode
   */
  onPressShutterButton: () => void;

  /**
   * Photo taken using the camera, if any
   */
  photoTaken?: CameraCapturedPicture;

  /**
   * Selected camera aspect ratio
   */
  cameraRatio?: CameraRatio;

  /**
   * Clears captured photo state
   */
  reset: () => void;
}

export function useCustomCamera(props: CustomCameraProps): CustomCameraFunc {
  const [permission, requestPermission] = useCameraPermissions();
  const ref = useRef<CameraView>(null);
  const [mode, setMode] = useState<CameraMode>(props.mode);
  const [type, setType] = useState<CameraType>(props.type);
  const [recording, setRecording] = useState(false);
  const [photoTaken, setPhotoTaken] = useState<CameraCapturedPicture | undefined>();
  const [cameraRatio, setCameraRatioRatio] = useState<CameraRatio | undefined>(props.cameraRatio);

  function reset() {
    setPhotoTaken(undefined);
  }
  async function takePicture() {
    const photo = await ref.current?.takePictureAsync({ imageType: 'jpg', quality: 1, base64: true });
    if (photo) {
      setPhotoTaken(photo);
    }
  }

  async function recordVideo() {
    if (recording) {
      setRecording(false);
      ref.current?.stopRecording();
      return;
    }
    setRecording(true);
    const video = await ref.current?.recordAsync();
  }

  async function pressShutterButton() {
    if (mode === 'picture') {
      await takePicture();
    } else {
      await recordVideo();
    }
  }

  function onPressShutterButton() {
    pressShutterButton().catch((error) => {
      console.error('onPressShutterButton error:', error);
    });
  }

  function onRequestPermission() {
    requestPermission().catch((error) => {
      console.error('onRequestPermission error:', error);
    });
  }

  return {
    permission: permission ?? undefined,
    onRequestPermission,
    ref,
    mode,
    setMode,
    type,
    setType,
    recording,
    onPressShutterButton,
    photoTaken,
    cameraRatio: cameraRatio,
    reset,
  };
}
