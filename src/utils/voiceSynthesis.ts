/**
 * Voice Synthesis Module for Ankit AI Assistant (अंकित)
 * Optimised for Hindi (hi-IN) and Indian English (en-IN)
 * Features auto-detect, audio unlocking, and sound synthesis fallback
 */

export interface VoiceSettings {
  rate: number; // 0.8 - 1.3
  pitch: number; // 0.8 - 1.3 (1.15 gives natural sweet female tone)
  volume: number; // 0 - 1
  langMode: 'auto' | 'hindi' | 'indian_english' | 'global_english';
  selectedVoiceURI: string | null;
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  lang?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  rate: 1.0,
  pitch: 1.25, // Fresh, youthful, clear and sweet female voice pitch
  volume: 1.0,
  langMode: 'auto',
  selectedVoiceURI: null,
};

let currentUtterance: SpeechSynthesisUtterance | null = null;
let isSpeaking = false;
let voicesCache: SpeechSynthesisVoice[] = [];

// Load stored settings
export function getVoiceSettings(): VoiceSettings {
  try {
    const saved = localStorage.getItem('ankita_voice_settings') || localStorage.getItem('ankit_voice_settings');
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_SETTINGS;
}

export function saveVoiceSettings(settings: Partial<VoiceSettings>) {
  const current = getVoiceSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem('ankita_voice_settings', JSON.stringify(updated));
  } catch {}
  return updated;
}

/**
 * Fetch all available voices and cache them
 */
export function getAllVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !window.speechSynthesis) return [];
  if (voicesCache.length > 0) return voicesCache;

  const voices = window.speechSynthesis.getVoices();
  if (voices && voices.length > 0) {
    voicesCache = voices;
  }
  return voicesCache;
}

// Listen for async voice loading
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    voicesCache = window.speechSynthesis.getVoices();
  };
}

/**
 * Check if text contains Devanagari (Hindi) script
 */
export function containsHindiScript(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Pick the best matching natural female voice for Ankita
 */
export function selectBestVoice(isHindi: boolean): SpeechSynthesisVoice | null {
  const voices = getAllVoices();
  if (!voices || voices.length === 0) return null;

  const settings = getVoiceSettings();

  // If user explicitly picked a voice
  if (settings.selectedVoiceURI) {
    const custom = voices.find((v) => v.voiceURI === settings.selectedVoiceURI);
    if (custom) return custom;
  }

  // 1. Preferred Hindi Female Voices
  if (isHindi || settings.langMode === 'hindi' || settings.langMode === 'auto') {
    // Look for top high-quality natural female Hindi voices first
    const naturalHindiFemale = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') &&
        (v.name.toLowerCase().includes('swara') ||
          v.name.toLowerCase().includes('kalpana') ||
          v.name.toLowerCase().includes('lekha') ||
          v.name.toLowerCase().includes('priya') ||
          v.name.toLowerCase().includes('shruti') ||
          v.name.toLowerCase().includes('google हिन्दी') ||
          v.name.toLowerCase().includes('female'))
    );
    if (naturalHindiFemale) return naturalHindiFemale;

    // Any Hindi voice
    const anyHindi = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('hi') ||
        v.name.toLowerCase().includes('hindi') ||
        v.name.toLowerCase().includes('हिन्दी')
    );
    if (anyHindi) return anyHindi;
  }

  // 2. Look for Indian English Female Voices
  const indianFemaleVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().includes('en-in') &&
      (v.name.toLowerCase().includes('neerja') ||
        v.name.toLowerCase().includes('heera') ||
        v.name.toLowerCase().includes('priya') ||
        v.name.toLowerCase().includes('female'))
  );
  if (indianFemaleVoice) return indianFemaleVoice;

  // 3. High quality natural English female voices
  const naturalFemaleEn = voices.find(
    (v) =>
      v.lang.startsWith('en') &&
      (v.name.toLowerCase().includes('zira') ||
        v.name.toLowerCase().includes('samantha') ||
        v.name.toLowerCase().includes('victoria') ||
        v.name.toLowerCase().includes('karen') ||
        v.name.toLowerCase().includes('jenny') ||
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('moira') ||
        (v.name.toLowerCase().includes('google') && v.name.toLowerCase().includes('female')))
  );
  if (naturalFemaleEn) return naturalFemaleEn;

  // 4. Any English voice
  const anyEn = voices.find((v) => v.lang.startsWith('en'));
  return anyEn || voices[0] || null;
}

/**
 * Unlock Web Speech Audio on user gesture
 */
export function unlockAudioContext() {
  if (typeof window === 'undefined') return;
  if (window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
}

/**
 * Stop any active voice synthesis
 */
export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    isSpeaking = false;
    currentUtterance = null;
  } catch (e) {
    console.error('Failed to cancel speech:', e);
  }
}

/**
 * Speak text with Ankit's voice
 */
export function speakAnkit(text: string, options: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onEnd?.();
    return;
  }

  // Stop previous utterance
  stopSpeaking();

  if (!text || !text.trim()) {
    options.onEnd?.();
    return;
  }

  // Resume synthesis if paused by browser
  try {
    window.speechSynthesis.resume();
  } catch {}

  // If text contains long code blocks, replace them with a natural spoken notification
  let speakable = text;
  if (/```[\s\S]*?```/.test(speakable)) {
    speakable = speakable.replace(/```[a-zA-Z0-9_-]*\n([\s\S]*?)```/g, () => {
      return ' (मैंने पूरा कोड साइड में बातचीत रिकॉर्ड में लिख दिया है, आप वहाँ से सीधे कॉपी कर सकते हैं।) ';
    });
  }

  const cleanText = speakable
    .replace(/[\*\_#`]/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .trim();

  const isHindi = containsHindiScript(cleanText);
  const settings = getVoiceSettings();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  currentUtterance = utterance;

  const voice = selectBestVoice(isHindi);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  } else {
    utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
  }

  // Rate & Pitch tuning
  utterance.rate = options.rate ?? settings.rate;
  utterance.pitch = options.pitch ?? settings.pitch;
  utterance.volume = options.volume ?? settings.volume;

  utterance.onstart = () => {
    isSpeaking = true;
    options.onStart?.();
  };

  utterance.onend = () => {
    isSpeaking = false;
    currentUtterance = null;
    options.onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis event:', e);
    isSpeaking = false;
    currentUtterance = null;
    options.onError?.(e);
    options.onEnd?.();
  };

  try {
    window.speechSynthesis.speak(utterance);
    // Extra guard for mobile Chrome: resume immediately
    setTimeout(() => {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 50);
  } catch (err) {
    console.error('Speech synthesis execution error:', err);
    isSpeaking = false;
    options.onEnd?.();
  }
}

/**
 * Quick Test Phrase for verifying sound output
 */
export function testAnkitVoice(lang: 'hi' | 'en' = 'hi', onComplete?: () => void) {
  const phrase =
    lang === 'hi'
      ? 'नमस्ते! मैं अंकिता हूँ, आपकी पर्सनल एआई असिस्टेंट। मेरी आवाज बिल्कुल साफ़ और स्पष्ट है।'
      : 'Hello! I am Ankita, your personal AI assistant. Voice synthesis is fully calibrated and working perfectly.';

  speakAnkit(phrase, {
    onEnd: onComplete,
    onError: onComplete,
  });
}

export function isAnkitSpeaking(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false;
  return isSpeaking || window.speechSynthesis.speaking;
}

// Ankita aliases
export const speakAnkita = speakAnkit;
export const testAnkitaVoice = testAnkitVoice;
export const isAnkitaSpeaking = isAnkitSpeaking;

// Backward compatibility alias
export const speakJarvis = speakAnkit;
export const isJarvisSpeaking = isAnkitSpeaking;
