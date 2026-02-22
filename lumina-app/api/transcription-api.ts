/**
 * Audio transcription API using Google Gemini
 * Transcribes audio files to text for use with the AI tutor
 */

const GEMINI_API_BASE_URL = 'https://generativelanguage.googleapis.com/v1';
// Use gemini-2.5-flash - the latest stable multimodal model
const GEMINI_MODEL = 'gemini-2.5-flash';

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_IN_MS = 2000;
const MAX_RETRY_DELAY_IN_MS = 10000;

interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

interface TranscriptionError {
  message: string;
  code: string;
}

function getGeminiApiKey(): string | undefined {
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('EXPO_PUBLIC_GEMINI_API_KEY is not set. Available env vars:', Object.keys(process.env).filter(k => k.includes('GEMINI') || k.includes('EXPO_PUBLIC')));
  }
  return apiKey;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(delayInMs: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, delayInMs));
}

/**
 * Extract retry delay from error message if present
 */
function extractRetryDelay(errorMessage: string): number | undefined {
  const match = errorMessage.match(/retry in (\d+(?:\.\d+)?)\s*s/i);
  if (match?.[1]) {
    const seconds = parseFloat(match[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_RETRY_DELAY_IN_MS);
    }
  }
  return undefined;
}

/**
 * Converts a Blob to base64 string
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Gets the mime type from a blob or filename
 */
function getMimeType(blob: Blob, fileName?: string): string {
  if (blob.type) {
    return blob.type;
  }
  
  // Infer from filename
  if (fileName) {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'mp3':
        return 'audio/mpeg';
      case 'm4a':
        return 'audio/mp4';
      case 'wav':
        return 'audio/wav';
      case 'webm':
        return 'audio/webm';
      case 'ogg':
        return 'audio/ogg';
      case 'flac':
        return 'audio/flac';
      default:
        return 'audio/webm';
    }
  }
  
  return 'audio/webm';
}

/**
 * Transcribes audio from a blob using Google Gemini API
 * @param audioBlob - The audio blob to transcribe
 * @param fileName - Optional filename (helps with format detection)
 * @returns The transcription result or throws an error
 */
export async function transcribeAudio(
  audioBlob: Blob,
  fileName?: string,
): Promise<TranscriptionResult> {
  const apiKey = getGeminiApiKey();
  
  if (!apiKey) {
    console.warn('Gemini API key not configured (EXPO_PUBLIC_GEMINI_API_KEY). Skipping transcription.');
    throw {
      message: 'Gemini API key not configured. Please set EXPO_PUBLIC_GEMINI_API_KEY.',
      code: 'API_KEY_MISSING',
    } as TranscriptionError;
  }

  // Convert audio to base64 once
  const base64Audio = await blobToBase64(audioBlob);
  const mimeType = getMimeType(audioBlob, fileName);
  
  console.log('Transcribing audio with Gemini...', { mimeType, size: audioBlob.size });

  let lastError: TranscriptionError | undefined;
  
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Call Gemini API with audio
      const url = `${GEMINI_API_BASE_URL}/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Please transcribe this audio recording exactly as spoken. Only output the transcribed text, nothing else. If the audio describes a math problem, transcribe it accurately including any numbers, equations, or mathematical terms.',
                },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: base64Audio,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message ?? `Gemini API error: ${response.status}`;
        console.error('Gemini API error:', response.status, errorData);
        
        // Check if it's a rate limit error (429)
        if (response.status === 429) {
          const retryDelay = extractRetryDelay(errorMessage) ?? INITIAL_RETRY_DELAY_IN_MS * Math.pow(2, attempt);
          console.log(`Rate limited. Retrying in ${retryDelay}ms (attempt ${attempt + 1}/${MAX_RETRIES})...`);
          await sleep(retryDelay);
          lastError = {
            message: errorMessage,
            code: 'RATE_LIMITED',
          };
          continue;
        }
        
        throw {
          message: errorMessage,
          code: 'GEMINI_API_ERROR',
        } as TranscriptionError;
      }

      const data = await response.json();
      
      // Extract text from Gemini response
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        const finishReason = data.candidates?.[0]?.finishReason;
        if (finishReason === 'SAFETY') {
          throw {
            message: 'Audio content was blocked by safety filters.',
            code: 'SAFETY_BLOCKED',
          } as TranscriptionError;
        }
        throw {
          message: 'No transcription returned from Gemini.',
          code: 'EMPTY_RESPONSE',
        } as TranscriptionError;
      }

      console.log('Transcription successful:', text.substring(0, 100) + '...');
      return {
        text: text.trim(),
      };
    } catch (error) {
      console.error('Transcription error:', error);
      
      // Re-throw if it's already a TranscriptionError (but not rate limit)
      if (error && typeof error === 'object' && 'code' in error) {
        const typedError = error as TranscriptionError;
        if (typedError.code !== 'RATE_LIMITED') {
          throw error;
        }
        lastError = typedError;
      } else {
        throw {
          message: 'Failed to transcribe audio. Please try again.',
          code: 'TRANSCRIPTION_ERROR',
        } as TranscriptionError;
      }
    }
  }
  
  // All retries exhausted
  throw lastError ?? {
    message: 'Failed to transcribe audio after multiple attempts. Please try again later.',
    code: 'RATE_LIMITED',
  } as TranscriptionError;
}

/**
 * Transcribes audio from a URL by first fetching the audio data
 * @param audioUrl - The URL of the audio to transcribe
 * @returns The transcription result or throws an error
 */
export async function transcribeAudioFromUrl(audioUrl: string): Promise<TranscriptionResult> {
  try {
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.statusText}`);
    }
    
    const audioBlob = await response.blob();
    
    // Extract filename from URL if possible
    const urlParts = audioUrl.split('/');
    const fileName = urlParts[urlParts.length - 1]?.split('?')[0];
    
    return transcribeAudio(audioBlob, fileName);
  } catch (error) {
    console.error('Transcription from URL error:', error);
    
    // Re-throw if it's already a TranscriptionError
    if (error && typeof error === 'object' && 'code' in error) {
      throw error;
    }
    
    throw {
      message: 'Failed to transcribe audio from URL. Please try again.',
      code: 'TRANSCRIPTION_URL_ERROR',
    } as TranscriptionError;
  }
}
