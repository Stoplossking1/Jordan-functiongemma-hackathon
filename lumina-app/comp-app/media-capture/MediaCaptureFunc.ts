/**
 * Business logic for the MediaCapture component - handles both image and voice capture
 */

import * as DocumentPicker from 'expo-document-picker';
import { Audio } from 'expo-av';
import type { CameraMode, CameraType } from 'expo-camera';
import { useEffect, useState, useRef, useCallback } from 'react';

import { useCustomCamera, type CustomCameraFunc } from '@/comp-lib/custom-camera/CustomCameraFunc';
import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';

const CAMERA_MODE: CameraMode = 'picture';
const CAMERA_TYPE: CameraType = 'back';
const IMAGE_DOCUMENT_TYPE = 'image/*';
const AUDIO_DOCUMENT_TYPE = 'audio/*';
const CAMERA_WEB_ERROR_MESSAGE = 'Camera is unavailable on web. Upload an image instead.';
const IMAGE_PICKER_ERROR_MESSAGE = 'Could not upload the image. Please try again.';
const AUDIO_PICKER_ERROR_MESSAGE = 'Could not upload the audio. Please try again.';
const EMPTY_MEDIA_ERROR_MESSAGE = 'Selected media is unavailable. Please try again.';
const SUBMIT_MEDIA_ERROR_MESSAGE = 'Could not continue to the tutor. Please try again.';
const RECORDING_ERROR_MESSAGE = 'Could not start recording. Please check microphone permissions.';
const RECORDING_PERMISSION_ERROR = 'Microphone permission is required to record voice.';
const WEB_RECORDING_NOT_SUPPORTED = 'Voice recording is not supported in this browser.';

const MAX_RECORDING_DURATION_IN_MS = 120000; // 2 minutes
const RECORDING_UPDATE_INTERVAL_IN_MS = 100;

export type MediaCaptureMode = 'image' | 'voice';

export interface CapturedMedia {
  uri: string;
  type: MediaCaptureMode;
  fileName?: string;
  mimeType?: string;
  durationInMs?: number;
}

export interface MediaCaptureProps {
  isVisible: boolean;
  isSubmitting: boolean;
  initialMode?: MediaCaptureMode;
  externalErrorMessage?: string;
  onCancel: () => void;
  onSubmitMedia: (media: CapturedMedia) => void;
}

export interface MediaCaptureFunc {
  camera: CustomCameraFunc;
  mode: MediaCaptureMode;
  isCameraActive: boolean;
  isRecording: boolean;
  recordingDurationInMs: number;
  selectedMedia?: CapturedMedia;
  isPickingMedia: boolean;
  isBusy: boolean;
  errorMessage?: string;
  onSwitchMode: (mode: MediaCaptureMode) => void;
  onStartCamera: () => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onUploadMedia: () => void;
  onCancelCapture: () => void;
  onRetake: () => void;
  onUseMedia: () => void;
  onCancel: () => void;
}

export function useMediaCapture(props: MediaCaptureProps): MediaCaptureFunc {
  const camera = useCustomCamera({ mode: CAMERA_MODE, type: CAMERA_TYPE });
  const { isPlatformNative, isPlatformWeb } = useResponsiveDesign();

  const [mode, setMode] = useState<MediaCaptureMode>(props.initialMode ?? 'image');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDurationInMs, setRecordingDurationInMs] = useState(0);
  const [selectedMedia, setSelectedMedia] = useState<CapturedMedia | undefined>(undefined);
  const [isPickingMedia, setIsPickingMedia] = useState(false);
  const [internalErrorMessage, setInternalErrorMessage] = useState<string | undefined>(undefined);

  // Native recording refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Web recording refs
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const webMediaStreamRef = useRef<MediaStream | null>(null);

  const isBusy = props.isSubmitting || isPickingMedia || isRecording;
  const errorMessage = props.externalErrorMessage ?? internalErrorMessage;

  const capturedPhotoUri = camera.photoTaken?.uri;

  // Reset state when modal is closed
  useEffect(() => {
    if (!props.isVisible) {
      setMode(props.initialMode ?? 'image');
      setIsCameraActive(false);
      setIsRecording(false);
      setRecordingDurationInMs(0);
      setSelectedMedia(undefined);
      setIsPickingMedia(false);
      setInternalErrorMessage(undefined);
      stopRecordingCleanup();
    }
  }, [props.isVisible, props.initialMode]);

  // Handle captured photo from camera
  useEffect(() => {
    const capturedPhotoUriTrimmed = capturedPhotoUri?.trim();
    if (capturedPhotoUriTrimmed == null || capturedPhotoUriTrimmed.length === 0) {
      return;
    }

    setSelectedMedia({
      uri: capturedPhotoUriTrimmed,
      type: 'image',
      mimeType: 'image/jpeg',
    });
    setIsCameraActive(false);
    setInternalErrorMessage(undefined);
  }, [capturedPhotoUri]);

  function stopRecordingCleanup(): void {
    // Clear interval timer
    if (recordingIntervalRef.current != null) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    // Native cleanup
    if (recordingRef.current != null) {
      recordingRef.current.stopAndUnloadAsync().catch(console.error);
      recordingRef.current = null;
    }

    // Web cleanup
    if (webMediaRecorderRef.current != null) {
      if (webMediaRecorderRef.current.state !== 'inactive') {
        webMediaRecorderRef.current.stop();
      }
      webMediaRecorderRef.current = null;
    }
    if (webMediaStreamRef.current != null) {
      webMediaStreamRef.current.getTracks().forEach((track) => track.stop());
      webMediaStreamRef.current = null;
    }
    webAudioChunksRef.current = [];
  }

  function onSwitchMode(newMode: MediaCaptureMode): void {
    if (isBusy) {
      return;
    }

    setMode(newMode);
    setSelectedMedia(undefined);
    setIsCameraActive(false);
    setInternalErrorMessage(undefined);
    camera.reset();
  }

  function onStartCamera(): void {
    if (isBusy) {
      return;
    }

    if (!isPlatformNative) {
      setInternalErrorMessage(CAMERA_WEB_ERROR_MESSAGE);
      return;
    }

    setInternalErrorMessage(undefined);
    setSelectedMedia(undefined);
    setIsCameraActive(true);
    camera.reset();
  }

  // Web audio recording
  const startWebRecordingAsync = useCallback(async (): Promise<void> => {
    try {
      // Check if MediaRecorder is supported
      if (typeof window === 'undefined' || !navigator.mediaDevices || !window.MediaRecorder) {
        setInternalErrorMessage(WEB_RECORDING_NOT_SUPPORTED);
        return;
      }

      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      webMediaStreamRef.current = stream;

      // Determine the best supported MIME type
      const mimeTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          break;
        }
      }

      const mediaRecorder = new MediaRecorder(stream, selectedMimeType ? { mimeType: selectedMimeType } : undefined);
      webMediaRecorderRef.current = mediaRecorder;
      webAudioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          webAudioChunksRef.current.push(event.data);
        }
      };

      setInternalErrorMessage(undefined);
      setSelectedMedia(undefined);
      setRecordingDurationInMs(0);

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);

      // Start duration timer
      const startTime = Date.now();
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingDurationInMs(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_RECORDING_DURATION_IN_MS) {
          stopWebRecordingAsync().catch(console.error);
        }
      }, RECORDING_UPDATE_INTERVAL_IN_MS);
    } catch (error) {
      console.error('startWebRecordingAsync error:', error);
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        setInternalErrorMessage(RECORDING_PERMISSION_ERROR);
      } else {
        setInternalErrorMessage(RECORDING_ERROR_MESSAGE);
      }
      setIsRecording(false);
    }
  }, []);

  const stopWebRecordingAsync = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (recordingIntervalRef.current != null) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        const mediaRecorder = webMediaRecorderRef.current;
        if (mediaRecorder == null || mediaRecorder.state === 'inactive') {
          setIsRecording(false);
          resolve();
          return;
        }

        const currentDuration = recordingDurationInMs;

        mediaRecorder.onstop = () => {
          try {
            const audioBlob = new Blob(webAudioChunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);

            // Stop all tracks
            if (webMediaStreamRef.current != null) {
              webMediaStreamRef.current.getTracks().forEach((track) => track.stop());
              webMediaStreamRef.current = null;
            }

            webMediaRecorderRef.current = null;
            webAudioChunksRef.current = [];
            setIsRecording(false);

            if (audioBlob.size === 0) {
              setInternalErrorMessage(EMPTY_MEDIA_ERROR_MESSAGE);
              resolve();
              return;
            }

            setSelectedMedia({
              uri: audioUrl,
              type: 'voice',
              mimeType: mediaRecorder.mimeType || 'audio/webm',
              durationInMs: currentDuration,
            });
            resolve();
          } catch (error) {
            console.error('mediaRecorder.onstop error:', error);
            setInternalErrorMessage(RECORDING_ERROR_MESSAGE);
            setIsRecording(false);
            resolve();
          }
        };

        mediaRecorder.stop();
      } catch (error) {
        console.error('stopWebRecordingAsync error:', error);
        setInternalErrorMessage(RECORDING_ERROR_MESSAGE);
        setIsRecording(false);
        resolve();
      }
    });
  }, [recordingDurationInMs]);

  // Native audio recording
  const startRecordingAsync = useCallback(async (): Promise<void> => {
    try {
      if (!isPlatformNative) {
        // Use web recording instead
        await startWebRecordingAsync();
        return;
      }

      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setInternalErrorMessage(RECORDING_PERMISSION_ERROR);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setInternalErrorMessage(undefined);
      setSelectedMedia(undefined);
      setRecordingDurationInMs(0);

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      recordingRef.current = recording;
      setIsRecording(true);

      // Start duration timer
      const startTime = Date.now();
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingDurationInMs(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_RECORDING_DURATION_IN_MS) {
          stopRecordingAsync().catch(console.error);
        }
      }, RECORDING_UPDATE_INTERVAL_IN_MS);
    } catch (error) {
      console.error('startRecordingAsync error:', error);
      setInternalErrorMessage(RECORDING_ERROR_MESSAGE);
      setIsRecording(false);
    }
  }, [isPlatformNative, startWebRecordingAsync]);

  const stopRecordingAsync = useCallback(async (): Promise<void> => {
    try {
      // Handle web recording
      if (isPlatformWeb && webMediaRecorderRef.current != null) {
        await stopWebRecordingAsync();
        return;
      }

      // Handle native recording
      if (recordingIntervalRef.current != null) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      if (recordingRef.current == null) {
        setIsRecording(false);
        return;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      const durationInMs = status.durationMillis ?? recordingDurationInMs;

      recordingRef.current = null;
      setIsRecording(false);

      if (uri == null || uri.trim().length === 0) {
        setInternalErrorMessage(EMPTY_MEDIA_ERROR_MESSAGE);
        return;
      }

      setSelectedMedia({
        uri: uri.trim(),
        type: 'voice',
        mimeType: 'audio/m4a',
        durationInMs,
      });

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
    } catch (error) {
      console.error('stopRecordingAsync error:', error);
      setInternalErrorMessage(RECORDING_ERROR_MESSAGE);
      setIsRecording(false);
    }
  }, [recordingDurationInMs, isPlatformWeb, stopWebRecordingAsync]);

  function onStartRecording(): void {
    if (isBusy) {
      return;
    }

    startRecordingAsync().catch((error) => {
      console.error('onStartRecording error:', error);
      setInternalErrorMessage(RECORDING_ERROR_MESSAGE);
    });
  }

  function onStopRecording(): void {
    stopRecordingAsync().catch((error) => {
      console.error('onStopRecording error:', error);
      setInternalErrorMessage(RECORDING_ERROR_MESSAGE);
    });
  }

  async function pickMediaAsync(): Promise<void> {
    try {
      setIsPickingMedia(true);
      setInternalErrorMessage(undefined);
      setIsCameraActive(false);
      camera.reset();

      const documentType = mode === 'image' ? IMAGE_DOCUMENT_TYPE : AUDIO_DOCUMENT_TYPE;
      const pickerResult = await DocumentPicker.getDocumentAsync({
        type: documentType,
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (pickerResult.canceled) {
        return;
      }

      const asset = pickerResult.assets?.[0];
      const mediaUri = asset?.uri?.trim();
      if (mediaUri == null || mediaUri.length === 0) {
        setInternalErrorMessage(EMPTY_MEDIA_ERROR_MESSAGE);
        return;
      }

      setSelectedMedia({
        uri: mediaUri,
        type: mode,
        fileName: asset?.name,
        mimeType: asset?.mimeType ?? undefined,
      });
    } catch (error) {
      console.error('pickMediaAsync error:', error);
      const errorMsg = mode === 'image' ? IMAGE_PICKER_ERROR_MESSAGE : AUDIO_PICKER_ERROR_MESSAGE;
      setInternalErrorMessage(errorMsg);
    } finally {
      setIsPickingMedia(false);
    }
  }

  function onUploadMedia(): void {
    if (isBusy) {
      return;
    }

    pickMediaAsync().catch((error) => {
      console.error('onUploadMedia error:', error);
      const errorMsg = mode === 'image' ? IMAGE_PICKER_ERROR_MESSAGE : AUDIO_PICKER_ERROR_MESSAGE;
      setInternalErrorMessage(errorMsg);
      setIsPickingMedia(false);
    });
  }

  function onCancelCapture(): void {
    if (props.isSubmitting) {
      return;
    }

    if (isRecording) {
      stopRecordingCleanup();
      setIsRecording(false);
      setRecordingDurationInMs(0);
    }

    setIsCameraActive(false);
    camera.reset();
  }

  function onRetake(): void {
    if (isBusy) {
      return;
    }

    setSelectedMedia(undefined);
    setInternalErrorMessage(undefined);
    setRecordingDurationInMs(0);

    if (mode === 'image') {
      onStartCamera();
    }
  }

  function onUseMedia(): void {
    if (isBusy) {
      return;
    }

    if (selectedMedia == null || selectedMedia.uri.trim().length === 0) {
      setInternalErrorMessage(EMPTY_MEDIA_ERROR_MESSAGE);
      return;
    }

    try {
      props.onSubmitMedia(selectedMedia);
    } catch (error) {
      console.error('onUseMedia error:', error);
      setInternalErrorMessage(SUBMIT_MEDIA_ERROR_MESSAGE);
    }
  }

  function onCancel(): void {
    if (isBusy && !isRecording) {
      return;
    }

    stopRecordingCleanup();
    setIsCameraActive(false);
    setIsRecording(false);
    setRecordingDurationInMs(0);
    setSelectedMedia(undefined);
    setInternalErrorMessage(undefined);
    camera.reset();
    props.onCancel();
  }

  return {
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
  };
}

