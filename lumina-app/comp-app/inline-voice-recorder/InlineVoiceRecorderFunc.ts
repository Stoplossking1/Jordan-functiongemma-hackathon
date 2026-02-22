/**
 * Business logic for the InlineVoiceRecorder component - handles direct voice recording
 * without modal dialogs for a streamlined user experience
 */

import { Audio } from 'expo-av';
import { useEffect, useState, useRef, useCallback } from 'react';

import { useResponsiveDesign } from '@/comp-lib/styles/useResponsiveDesign';

const RECORDING_ERROR_MESSAGE = 'Could not start recording. Please check microphone permissions.';
const RECORDING_PERMISSION_ERROR = 'Microphone permission is required to record voice.';
const WEB_RECORDING_NOT_SUPPORTED = 'Voice recording is not supported in this browser.';
const EMPTY_RECORDING_ERROR = 'Recording is empty. Please try again.';

const MAX_RECORDING_DURATION_IN_MS = 120000; // 2 minutes
const RECORDING_UPDATE_INTERVAL_IN_MS = 100;

export interface RecordedVoice {
  uri: string;
  mimeType: string;
  durationInMs: number;
}

export interface InlineVoiceRecorderProps {
  isRecording: boolean;
  onRecordingComplete: (recording: RecordedVoice) => void;
  onRecordingError: (error: string) => void;
  onRecordingCancel: () => void;
}

export interface InlineVoiceRecorderFunc {
  isRecordingActive: boolean;
  recordingDurationInMs: number;
  errorMessage: string | undefined;
  onStopRecording: () => void;
  onCancelRecording: () => void;
}

export function useInlineVoiceRecorder(props: InlineVoiceRecorderProps): InlineVoiceRecorderFunc {
  const { isPlatformNative, isPlatformWeb } = useResponsiveDesign();

  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [recordingDurationInMs, setRecordingDurationInMs] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);

  // Native recording refs
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Web recording refs
  const webMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const webMediaStreamRef = useRef<MediaStream | null>(null);

  const stopRecordingCleanup = useCallback((): void => {
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
  }, []);

  // Web audio recording
  const startWebRecordingAsync = useCallback(async (): Promise<void> => {
    try {
      // Check if MediaRecorder is supported
      if (typeof window === 'undefined' || !navigator.mediaDevices || !window.MediaRecorder) {
        setErrorMessage(WEB_RECORDING_NOT_SUPPORTED);
        props.onRecordingError(WEB_RECORDING_NOT_SUPPORTED);
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

      setErrorMessage(undefined);
      setRecordingDurationInMs(0);

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecordingActive(true);

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
        setErrorMessage(RECORDING_PERMISSION_ERROR);
        props.onRecordingError(RECORDING_PERMISSION_ERROR);
      } else {
        setErrorMessage(RECORDING_ERROR_MESSAGE);
        props.onRecordingError(RECORDING_ERROR_MESSAGE);
      }
      setIsRecordingActive(false);
    }
  }, [props]);

  const stopWebRecordingAsync = useCallback(async (): Promise<void> => {
    return new Promise((resolve) => {
      try {
        if (recordingIntervalRef.current != null) {
          clearInterval(recordingIntervalRef.current);
          recordingIntervalRef.current = null;
        }

        const mediaRecorder = webMediaRecorderRef.current;
        if (mediaRecorder == null || mediaRecorder.state === 'inactive') {
          setIsRecordingActive(false);
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
            setIsRecordingActive(false);

            if (audioBlob.size === 0) {
              setErrorMessage(EMPTY_RECORDING_ERROR);
              props.onRecordingError(EMPTY_RECORDING_ERROR);
              resolve();
              return;
            }

            props.onRecordingComplete({
              uri: audioUrl,
              mimeType: mediaRecorder.mimeType || 'audio/webm',
              durationInMs: currentDuration,
            });
            resolve();
          } catch (error) {
            console.error('mediaRecorder.onstop error:', error);
            setErrorMessage(RECORDING_ERROR_MESSAGE);
            props.onRecordingError(RECORDING_ERROR_MESSAGE);
            setIsRecordingActive(false);
            resolve();
          }
        };

        mediaRecorder.stop();
      } catch (error) {
        console.error('stopWebRecordingAsync error:', error);
        setErrorMessage(RECORDING_ERROR_MESSAGE);
        props.onRecordingError(RECORDING_ERROR_MESSAGE);
        setIsRecordingActive(false);
        resolve();
      }
    });
  }, [recordingDurationInMs, props]);

  // Native audio recording
  const startNativeRecordingAsync = useCallback(async (): Promise<void> => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status !== 'granted') {
        setErrorMessage(RECORDING_PERMISSION_ERROR);
        props.onRecordingError(RECORDING_PERMISSION_ERROR);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      setErrorMessage(undefined);
      setRecordingDurationInMs(0);

      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);

      recordingRef.current = recording;
      setIsRecordingActive(true);

      // Start duration timer
      const startTime = Date.now();
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setRecordingDurationInMs(elapsed);

        // Auto-stop at max duration
        if (elapsed >= MAX_RECORDING_DURATION_IN_MS) {
          stopNativeRecordingAsync().catch(console.error);
        }
      }, RECORDING_UPDATE_INTERVAL_IN_MS);
    } catch (error) {
      console.error('startNativeRecordingAsync error:', error);
      setErrorMessage(RECORDING_ERROR_MESSAGE);
      props.onRecordingError(RECORDING_ERROR_MESSAGE);
      setIsRecordingActive(false);
    }
  }, [props]);

  const stopNativeRecordingAsync = useCallback(async (): Promise<void> => {
    try {
      if (recordingIntervalRef.current != null) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }

      if (recordingRef.current == null) {
        setIsRecordingActive(false);
        return;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      const status = await recordingRef.current.getStatusAsync();
      const durationInMs = status.durationMillis ?? recordingDurationInMs;

      recordingRef.current = null;
      setIsRecordingActive(false);

      if (uri == null || uri.trim().length === 0) {
        setErrorMessage(EMPTY_RECORDING_ERROR);
        props.onRecordingError(EMPTY_RECORDING_ERROR);
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });

      props.onRecordingComplete({
        uri: uri.trim(),
        mimeType: 'audio/m4a',
        durationInMs,
      });
    } catch (error) {
      console.error('stopNativeRecordingAsync error:', error);
      setErrorMessage(RECORDING_ERROR_MESSAGE);
      props.onRecordingError(RECORDING_ERROR_MESSAGE);
      setIsRecordingActive(false);
    }
  }, [recordingDurationInMs, props]);

  // Start recording when isRecording prop becomes true
  useEffect(() => {
    if (props.isRecording && !isRecordingActive) {
      if (isPlatformNative) {
        startNativeRecordingAsync().catch(console.error);
      } else {
        startWebRecordingAsync().catch(console.error);
      }
    }
  }, [props.isRecording, isRecordingActive, isPlatformNative, startNativeRecordingAsync, startWebRecordingAsync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecordingCleanup();
    };
  }, [stopRecordingCleanup]);

  function onStopRecording(): void {
    if (!isRecordingActive) {
      return;
    }

    if (isPlatformWeb && webMediaRecorderRef.current != null) {
      stopWebRecordingAsync().catch(console.error);
    } else {
      stopNativeRecordingAsync().catch(console.error);
    }
  }

  function onCancelRecording(): void {
    stopRecordingCleanup();
    setIsRecordingActive(false);
    setRecordingDurationInMs(0);
    setErrorMessage(undefined);
    props.onRecordingCancel();
  }

  return {
    isRecordingActive,
    recordingDurationInMs,
    errorMessage,
    onStopRecording,
    onCancelRecording,
  };
}

