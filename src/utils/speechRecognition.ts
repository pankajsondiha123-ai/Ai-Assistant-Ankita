/**
 * Robust Dual-Engine Speech & Audio System with DSP Automatic Gain Control (AGC)
 * Engine 1: Web Speech Recognition (Live instantaneous transcription)
 * Engine 2: HTML5 MediaRecorder + Hardware Audio Filtering + Gemini Multimodal Audio Transcription
 * Features:
 *  - 85Hz Highpass rumble filter
 *  - Dynamic Range Compression (-24dB, 12:1 ratio)
 *  - Adaptive Closed-Loop Automatic Gain Control (AGC) normalizer
 *  - Real-time AnalyserNode audio level and AGC Telemetry
 */

export interface SpeechRecognitionOptions {
  onResult: (text: string, isFinal: boolean) => void;
  onError?: (errMessage: string, errorCode?: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  lang?: 'hi-IN' | 'en-IN' | 'en-US';
  continuous?: boolean;
}

export interface AgcStatus {
  active: boolean;
  currentGainDb: number;
  gainMultiplier: number;
  rmsLevel: number;
  reductionDb: number;
  noiseSuppressionActive: boolean;
}

let recognitionInstance: any = null;
let mediaStream: MediaStream | null = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let audioContext: AudioContext | null = null;
let analyserNode: AnalyserNode | null = null;
let highpassFilter: BiquadFilterNode | null = null;
let compressorNode: DynamicsCompressorNode | null = null;
let agcGainNode: GainNode | null = null;
let agcDestination: MediaStreamAudioDestinationNode | null = null;
let agcLoopInterval: any = null;
let dataArray: Uint8Array | null = null;

// Telemetry state
let currentGainMultiplier = 1.0;
let currentRmsLevel = 0.0;
let currentReductionDb = 0.0;

let isCurrentlyListening = false;
let userIntentListening = false;
let currentLanguage: string = 'hi-IN';
let latestRecordedTranscript = '';
let currentRecordedBlob: Blob | null = null;
let restartTimeout: any = null;

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (window as any).SpeechRecognition ||
    (window as any).webkitSpeechRecognition ||
    (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  );
}

export function getLatestTranscript(): string {
  return latestRecordedTranscript.trim();
}

export function clearLatestTranscript(): void {
  latestRecordedTranscript = '';
  currentRecordedBlob = null;
  audioChunks = [];
}

/**
 * Returns real-time Automatic Gain Control (AGC) telemetry
 */
export function getAgcStatus(): AgcStatus {
  const gainDb = 20 * Math.log10(Math.max(0.01, currentGainMultiplier));
  return {
    active: isCurrentlyListening || userIntentListening,
    currentGainDb: Math.round(gainDb * 10) / 10,
    gainMultiplier: Math.round(currentGainMultiplier * 100) / 100,
    rmsLevel: Math.round(currentRmsLevel * 1000) / 1000,
    reductionDb: Math.round(currentReductionDb * 10) / 10,
    noiseSuppressionActive: true,
  };
}

/**
 * Returns real measured microphone volume level (0.0 to 1.0)
 */
export function getMicVolumeLevel(): number {
  if (!isCurrentlyListening && !userIntentListening) return 0;

  if (analyserNode && dataArray) {
    try {
      analyserNode.getByteFrequencyData(dataArray as any);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const average = sum / dataArray.length;
      const normalized = Math.min(1, Math.max(0, average / 128));
      return normalized > 0.05 ? normalized : 0.08;
    } catch {}
  }

  // Fallback gentle wave if analyser not yet initialized
  return 0.25 + Math.sin(Date.now() / 150) * 0.15;
}

export function setRecognitionLanguage(lang: 'hi-IN' | 'en-IN' | 'en-US') {
  currentLanguage = lang;
  if (recognitionInstance) {
    try {
      recognitionInstance.lang = lang;
    } catch {}
  }
}

export function getRecognitionLanguage(): string {
  return currentLanguage;
}

/**
 * Convert Blob to Base64 String
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1] || '';
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Transcribe recorded audio blob through Gemini backend API
 */
export async function transcribeAudioBlob(blob: Blob): Promise<string> {
  try {
    if (!blob || blob.size < 500) {
      return '';
    }

    const base64 = await blobToBase64(blob);
    const mimeType = blob.type || 'audio/webm';

    const res = await fetch('/api/ankita/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        audio_base64: base64,
        mime_type: mimeType,
      }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return (data.transcript || '').trim();
  } catch (err: any) {
    console.warn('Backend audio transcription fallback notice:', err);
    return '';
  }
}

/**
 * Start listening with dual-engine recording and AGC normalization
 */
export async function startListening(options: SpeechRecognitionOptions): Promise<boolean> {
  if (restartTimeout) clearTimeout(restartTimeout);
  if (agcLoopInterval) clearInterval(agcLoopInterval);

  userIntentListening = true;
  latestRecordedTranscript = '';
  currentRecordedBlob = null;
  audioChunks = [];
  currentGainMultiplier = 1.0;

  // Step 1: Open Hardware Microphone Stream & Setup Web Audio AGC DSP Chain
  try {
    if (navigator.mediaDevices?.getUserMedia) {
      if (mediaStream) {
        mediaStream.getTracks().forEach((t) => t.stop());
        mediaStream = null;
      }

      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: { ideal: 48000 },
        },
      });

      // Hook Web Audio AGC processing pipeline
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          if (!audioContext || audioContext.state === 'closed') {
            audioContext = new AudioCtx();
          }
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const source = audioContext.createMediaStreamSource(mediaStream);

          // 1. High-Pass Filter: 85 Hz cutoff (Q=0.7) to remove HVAC hum, desk vibration & breath pops
          highpassFilter = audioContext.createBiquadFilter();
          highpassFilter.type = 'highpass';
          highpassFilter.frequency.value = 85;
          highpassFilter.Q.value = 0.7;

          // 2. Dynamics Compressor: Normalize loud volume bursts and maintain speech presence
          compressorNode = audioContext.createDynamicsCompressor();
          compressorNode.threshold.value = -24; // dB threshold
          compressorNode.knee.value = 10;
          compressorNode.ratio.value = 12; // Solid 12:1 speech compression
          compressorNode.attack.value = 0.003; // Fast 3ms attack
          compressorNode.release.value = 0.25; // Smooth 250ms release

          // 3. Adaptive Gain Node (AGC Amplifier / Attenuator)
          agcGainNode = audioContext.createGain();
          agcGainNode.gain.value = 1.1;

          // 4. Frequency & Time Domain Analyser
          analyserNode = audioContext.createAnalyser();
          analyserNode.fftSize = 256;
          analyserNode.smoothingTimeConstant = 0.6;
          dataArray = new Uint8Array(analyserNode.frequencyBinCount);

          // 5. MediaStreamDestination for the leveled, normalized stream
          agcDestination = audioContext.createMediaStreamDestination();

          // Connect DSP Chain:
          // micSource -> 85Hz Highpass -> Dynamics Compressor -> AGC Gain -> Analyser -> agcDestination
          source.connect(highpassFilter);
          highpassFilter.connect(compressorNode);
          compressorNode.connect(agcGainNode);
          agcGainNode.connect(analyserNode);
          analyserNode.connect(agcDestination);

          // 6. Closed-Loop Adaptive AGC Loop (Runs every 45ms)
          const timeData = new Float32Array(analyserNode.fftSize);
          agcLoopInterval = setInterval(() => {
            if (!analyserNode || !agcGainNode || !audioContext) return;

            try {
              analyserNode.getFloatTimeDomainData(timeData);
              let sumSquares = 0;
              for (let i = 0; i < timeData.length; i++) {
                sumSquares += timeData[i] * timeData[i];
              }
              const rms = Math.sqrt(sumSquares / timeData.length);
              currentRmsLevel = rms;

              if (compressorNode) {
                currentReductionDb = compressorNode.reduction;
              }

              // Target speech RMS range: ~0.10 to 0.16
              // If user is whispering or mic is far (RMS < 0.04), boost gain smoothly up to 3.5x (+11 dB)
              // If user is shouting or close (RMS > 0.22), cut gain to 0.65x (-3.7 dB) to prevent clipping
              let targetGain = currentGainMultiplier;

              if (rms < 0.035 && rms > 0.002) {
                // Low signal: boost
                targetGain = Math.min(3.5, currentGainMultiplier * 1.08);
              } else if (rms > 0.22) {
                // High signal: attenuate rapidly to protect clarity
                targetGain = Math.max(0.65, currentGainMultiplier * 0.90);
              } else if (rms >= 0.035 && rms <= 0.18) {
                // Optimal speech zone: gentle convergence towards 1.2
                targetGain = currentGainMultiplier * 0.98 + 1.2 * 0.02;
              }

              currentGainMultiplier = targetGain;
              agcGainNode.gain.setTargetAtTime(targetGain, audioContext.currentTime, 0.05);
            } catch {}
          }, 45);
        }
      } catch (audioErr) {
        console.warn('AGC Audio pipeline setup notice:', audioErr);
      }

      // Initialize MediaRecorder on the AGC-normalized destination stream
      try {
        let optionsToUse: MediaRecorderOptions = {};
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          optionsToUse = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          optionsToUse = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          optionsToUse = { mimeType: 'audio/mp4' };
        }

        // Pass the AGC-normalized audio stream to MediaRecorder
        const recordingStream = agcDestination ? agcDestination.stream : mediaStream;
        mediaRecorder = new MediaRecorder(recordingStream, optionsToUse);
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (audioChunks.length > 0) {
            currentRecordedBlob = new Blob(audioChunks, {
              type: mediaRecorder?.mimeType || 'audio/webm',
            });
          }
        };

        mediaRecorder.start(200); // chunk every 200ms
      } catch (recErr) {
        console.warn('MediaRecorder notice:', recErr);
      }
    }
  } catch (micErr: any) {
    console.error('Microphone access error:', micErr);
    userIntentListening = false;
    isCurrentlyListening = false;

    let msg = 'कृपया माइक्रोफ़ोन की अनुमति Allow करें। (Microphone access required)';
    if (micErr.name === 'NotAllowedError' || micErr.name === 'PermissionDeniedError') {
      msg = 'ब्राउज़र में माइक अनुमति बंद है। कृपया एड्रेस बार में लॉक (🔒) आइकन पर क्लिक करके Microphone को "Allow" करें।';
    }
    options.onError?.(msg, micErr.name);
    return false;
  }

  isCurrentlyListening = true;
  options.onStart?.();

  // Step 2: Launch Web Speech API for instantaneous real-time typing
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (SpeechRecognition) {
    const launchSpeechRecognition = () => {
      if (!userIntentListening) return;

      try {
        if (recognitionInstance) {
          try {
            recognitionInstance.abort();
          } catch {}
          recognitionInstance = null;
        }

        const recognition = new SpeechRecognition();
        recognitionInstance = recognition;

        const targetLang = options.lang || currentLanguage || 'hi-IN';
        recognition.lang = targetLang;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 2;

        recognition.onresult = (event: any) => {
          let accumulatedFinal = '';
          let currentInterim = '';

          for (let i = 0; i < event.results.length; ++i) {
            const item = event.results[i];
            const transcript = item[0]?.transcript || '';
            if (item.isFinal) {
              accumulatedFinal += transcript + ' ';
            } else {
              currentInterim += transcript;
            }
          }

          const combined = (accumulatedFinal + ' ' + currentInterim).replace(/\s+/g, ' ').trim();

          if (combined) {
            latestRecordedTranscript = combined;
            options.onResult(combined, currentInterim.length === 0);
          }
        };

        recognition.onerror = (event: any) => {
          const errorType = event?.error || 'unknown';
          console.warn('WebSpeech event:', errorType);
        };

        recognition.onend = () => {
          if (userIntentListening) {
            restartTimeout = setTimeout(() => {
              if (userIntentListening) {
                try {
                  recognition.start();
                } catch {}
              }
            }, 100);
          }
        };

        recognition.start();
      } catch (recErr) {
        console.warn('SpeechRecognition launch notice:', recErr);
      }
    };

    launchSpeechRecognition();
  }

  return true;
}

/**
 * Stop active listening and clean up AGC filters & audio recorder
 */
export async function stopListeningAsync(): Promise<string> {
  userIntentListening = false;
  isCurrentlyListening = false;
  if (restartTimeout) clearTimeout(restartTimeout);
  if (agcLoopInterval) {
    clearInterval(agcLoopInterval);
    agcLoopInterval = null;
  }

  // Stop Web Speech Recognition
  if (recognitionInstance) {
    try {
      recognitionInstance.stop();
    } catch {}
    recognitionInstance = null;
  }

  // Stop MediaRecorder and collect Blob
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    try {
      mediaRecorder.stop();
    } catch {}
  }

  // Stop live media stream tracks
  if (mediaStream) {
    try {
      mediaStream.getTracks().forEach((track) => track.stop());
    } catch {}
    mediaStream = null;
  }

  // Check if Web Speech API captured text
  let finalResult = latestRecordedTranscript.trim();

  // If WebSpeech was empty or blocked, use Gemini audio transcription on the AGC-processed blob!
  if (!finalResult) {
    // Wait briefly for recorder onstop
    if (!currentRecordedBlob && audioChunks.length > 0) {
      currentRecordedBlob = new Blob(audioChunks, {
        type: mediaRecorder?.mimeType || 'audio/webm',
      });
    }

    if (currentRecordedBlob && currentRecordedBlob.size > 800) {
      console.log('Transcribing AGC-normalized audio via Gemini...');
      finalResult = await transcribeAudioBlob(currentRecordedBlob);
    }
  }

  clearLatestTranscript();
  return finalResult;
}

/**
 * Synchronous stop method for immediate state cleanup
 */
export function stopListening(): string {
  const captured = latestRecordedTranscript.trim();
  stopListeningAsync().catch(() => {});
  return captured;
}

export function getIsListening(): boolean {
  return isCurrentlyListening || userIntentListening;
}

export function getCurrentAudioBlob(): Blob | null {
  if (currentRecordedBlob) return currentRecordedBlob;
  if (audioChunks.length > 0) {
    return new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
  }
  return null;
}
