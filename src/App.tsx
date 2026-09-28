import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  Database,
  CloudRain,
  MessageSquare,
  Search,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  AlertCircle,
  Smartphone,
  Sliders,
  Languages,
  Phone,
  Flashlight
} from 'lucide-react';
import {
  AssistantState,
  JarvisIntent,
  JarvisParameters,
  JarvisResponse,
  LogEntry,
  LongTermMemory,
  TemporaryMemory,
} from './types';
import { ArcReactor } from './components/ArcReactor';
import { TerminalLogs } from './components/TerminalLogs';
import { HudHeader } from './components/HudHeader';
import { SystemTelemetrySidebar } from './components/SystemTelemetrySidebar';
import { QuickDirectives } from './components/QuickDirectives';
import { SendMessageModal } from './components/SendMessageModal';
import { WeatherModal } from './components/WeatherModal';
import { SearchModal } from './components/SearchModal';
import { AppLauncherModal } from './components/AppLauncherModal';
import { MemoryModal } from './components/MemoryModal';
import { MobileDeviceCenter } from './components/MobileDeviceCenter';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { ActiveActionCard } from './components/ActiveActionCard';
import { DirectAppInstallModal } from './components/DirectAppInstallModal';
import { AppPermissionsModal } from './components/AppPermissionsModal';
import { FileAndVisionModal } from './components/FileAndVisionModal';
import { SecurityLockModal } from './components/SecurityLockModal';
import { PinLockScreen } from './components/PinLockScreen';
import { AutomationModal } from './components/AutomationModal';
import { processOfflineDirective } from './utils/offlineEngine';
import { requestScreenWakeLock } from './utils/permissionsManager';
import { ActiveAction } from './types';
import {
  speakAnkit,
  stopSpeaking,
  isAnkitSpeaking,
  unlockAudioContext,
} from './utils/voiceSynthesis';
import {
  startListening,
  stopListening,
  stopListeningAsync,
  isSpeechRecognitionSupported,
  getMicVolumeLevel,
  setRecognitionLanguage,
  getRecognitionLanguage,
  getLatestTranscript,
  clearLatestTranscript,
  getIsListening,
} from './utils/speechRecognition';
import {
  toggleTorch,
  getBatteryTelemetry,
  vibrateDevice,
  dialPhoneNumber,
  getDeviceLocation,
} from './utils/mobileDevice';
import {
  playBeep,
  playConfirm,
  playAlert,
  playMicOn,
  playMicOff,
  playBoot,
} from './utils/soundEffects';

const INITIAL_LONG_TERM_MEMORY: LongTermMemory = {
  identity: {
    assistant_name: { value: 'अंकिता (Ankita)' },
    user_name: { value: 'User' },
    role: { value: 'सहेली और सलाहकार (Personal Companion)' },
    language: { value: 'हिन्दी और अंग्रेजी (Hindi & English)' },
  },
  preferences: {
    system_mode: { value: 'पूर्ण मोबाइल एक्सेस (Full Mobile Access)' },
    voice_speed: { value: 'प्राकृतिक (Natural 1.0x)' },
  },
  relationships: {
    family: { name: { value: 'परिवार' }, relation: 'Primary Contacts' },
  },
  emotional_state: {
    current_status: { value: 'उत्साही व तत्पर (Ready & Active)' },
  },
};

const INITIAL_TEMP_MEMORY: TemporaryMemory = {
  pending_intent: null,
  parameters: {},
  current_question: null,
  last_user_text: null,
  last_ai_response: null,
  last_search: null,
  last_opened_app: null,
  conversation_history: [],
};

export default function App() {
  const [state, setState] = useState<AssistantState>('idle');
  const [audioLevel, setAudioLevel] = useState(0);

  // Command input bar
  const [inputText, setInputText] = useState('');
  const [interimSpeech, setInterimSpeech] = useState('');
  const [currentLang, setCurrentLang] = useState<'hi-IN' | 'en-IN'>('hi-IN');

  // Persistent Conversation & Terminal Logs ("एक छत में बातचीत का पूरा रिकॉर्ड")
  const [logs, setLogs] = useState<LogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('ankita_chat_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [
      {
        id: 'init-1',
        type: 'system',
        text: 'ANKITA AI // सिस्टम सक्रिय • अंकिता एआई ऑनलाइन',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      },
      {
        id: 'init-2',
        type: 'ai',
        text: 'नमस्ते! मैं अंकिता हूँ, आपकी पर्सनल एआई असिस्टेंट। मैं आपके सभी काम करने, किसी भी कठिन सवाल को प्यार से समझाने और बड़े से बड़ा कोड लिखने के लिए तैयार हूँ।',
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
      },
    ];
  });
  const [activeTypingText, setActiveTypingText] = useState('');
  const [mobileChatRecordOpen, setMobileChatRecordOpen] = useState(false);

  // Sync chat logs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ankita_chat_logs', JSON.stringify(logs.slice(-100)));
    } catch {}
  }, [logs]);

  // Long-Term & Temporary Memory
  const [longTermMemory, setLongTermMemory] = useState<LongTermMemory>(() => {
    try {
      const saved = localStorage.getItem('ankit_long_term_memory');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_LONG_TERM_MEMORY;
  });

  const [tempMemory, setTempMemory] = useState<TemporaryMemory>(INITIAL_TEMP_MEMORY);

  // Modals state
  const [modalState, setModalState] = useState<{
    sendMessage: boolean;
    weather: boolean;
    search: boolean;
    appLauncher: boolean;
    memory: boolean;
    mobileCenter: boolean;
    voiceSettings: boolean;
    directInstall: boolean;
    permissions: boolean;
    fileVision: boolean;
    fileVisionTab: 'document' | 'vision' | 'kb';
    security: boolean;
    automation: boolean;
    weatherCity: string;
    searchQuery: string;
    launcherApp: string;
    messageParams: JarvisParameters;
  }>({
    sendMessage: false,
    weather: false,
    search: false,
    appLauncher: false,
    memory: false,
    mobileCenter: false,
    voiceSettings: false,
    directInstall: false,
    permissions: false,
    fileVision: false,
    fileVisionTab: 'document',
    security: false,
    automation: false,
    weatherCity: 'New Delhi',
    searchQuery: '',
    launcherApp: 'Calculator',
    messageParams: {},
  });

  // App Lock & PIN state
  const [isAppLocked, setIsAppLocked] = useState<boolean>(() => {
    return localStorage.getItem('ankita_pin_enabled') === 'true';
  });

  // Online / Offline state
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Active Direct Action (WhatsApp, Call, Torch, Timer, etc.)
  const [activeAction, setActiveAction] = useState<ActiveAction | null>(null);

  // PWA beforeinstallprompt handler
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const isListening = state === 'listening';

  // Play boot sound and unlock web audio on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudioContext();
      playBoot();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
    window.addEventListener('click', handleFirstInteraction, { once: true });
    window.addEventListener('touchstart', handleFirstInteraction, { once: true });
    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  // Sync long-term memory to localStorage
  useEffect(() => {
    localStorage.setItem('ankit_long_term_memory', JSON.stringify(longTermMemory));
  }, [longTermMemory]);

  // Audio level updater (either speaking simulation or real microphone input level)
  useEffect(() => {
    let animId: number;
    let interval: any;

    if (state === 'listening') {
      const pollVolume = () => {
        const vol = getMicVolumeLevel();
        setAudioLevel(vol > 0.05 ? vol : Math.random() * 0.15);
        animId = requestAnimationFrame(pollVolume);
      };
      animId = requestAnimationFrame(pollVolume);
    } else if (state === 'speaking') {
      interval = setInterval(() => {
        setAudioLevel(0.25 + Math.random() * 0.75);
      }, 70);
    } else {
      setAudioLevel(0);
    }

    return () => {
      if (animId) cancelAnimationFrame(animId);
      if (interval) clearInterval(interval);
    };
  }, [state]);

  // Typing effect queue for Ankit terminal logs
  const addLog = (type: LogEntry['type'], text: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      type,
      text,
      timestamp: time,
    };

    if (type === 'ai') {
      let index = 0;
      setActiveTypingText('');
      const interval = setInterval(() => {
        index += 2;
        if (index <= text.length) {
          setActiveTypingText(text.slice(0, index));
        } else {
          clearInterval(interval);
          setActiveTypingText('');
          setLogs((prev) => [...prev, newLog]);
        }
      }, 16);
    } else {
      setLogs((prev) => [...prev, newLog]);
    }
  };

  // Main Intent Process Pipeline
  const handleProcessUserDirective = async (rawText: string) => {
    const cleanText = rawText.trim();
    if (!cleanText) return;

    // Check stop / silence commands
    const lower = cleanText.toLowerCase();
    if (['mute', 'quit', 'exit', 'stop', 'quiet', 'silence', 'चुप', 'बंद करो', 'रुक जाओ'].some((c) => lower.includes(c) || cleanText.includes(c))) {
      stopSpeaking();
      stopListening();
      setState('idle');
      setTempMemory((prev) => ({
        ...prev,
        pending_intent: null,
        parameters: {},
        current_question: null,
      }));
      addLog('system', 'ऑडियो व्यवधान: कमांड रोक दी गई (DIRECTIVE TERMINATED)');
      playBeep(500, 0.08);
      return;
    }

    // Direct App Download / Install Command Check
    if (['download', 'install', 'डाउनलोड', 'इंस्टॉल', 'होम स्क्रीन', 'ऐप लिंक'].some((w) => lower.includes(w) || cleanText.includes(w))) {
      setState('speaking');
      const installMsg = 'अंकिता AI का डायरेक्ट मोबाइल ऐप इंस्टॉल पैनल खोल दिया गया है। आप यहाँ से ऐप को सीधा अपने फोन की होम स्क्रीन पर जोड़ सकते हैं।';
      addLog('ai', installMsg);
      setModalState((prev) => ({ ...prev, directInstall: true }));
      speakAnkit(installMsg, { onEnd: () => setState('idle') });
      return;
    }

    // Direct Vision & OCR / Document / Knowledge Base Command Check
    if (['vision', 'ocr', 'फोटो', 'तस्वीर', 'दस्तावेज़', 'document', 'pdf', 'पीडीएफ', 'knowledge', 'नॉलेज बेस', 'फाइल'].some((w) => lower.includes(w) || cleanText.includes(w))) {
      setState('speaking');
      const isVision = ['फोटो', 'तस्वीर', 'vision', 'ocr', 'कैमरा', 'screenshot'].some(w => lower.includes(w) || cleanText.includes(w));
      const isKb = ['knowledge', 'नॉलेज बेस', 'ज्ञान कोष'].some(w => lower.includes(w) || cleanText.includes(w));
      const targetTab: 'document' | 'vision' | 'kb' = isVision ? 'vision' : isKb ? 'kb' : 'document';
      const msg = isVision
        ? 'जी, विज़न स्कैनर और OCR पैनल खोल रही हूँ। आप फोटो या स्क्रीनशॉट अपलोड करके सब समझ सकते हैं।'
        : isKb
        ? 'जी, आपका पर्सनल नॉलेज बेस हब प्रस्तुत है।'
        : 'जी, दस्तावेज़ और PDF रीडर खोल रही हूँ। आप किसी भी फाइल से सवाल पूछ सकते हैं।';
      addLog('ai', msg);
      setModalState((prev) => ({ ...prev, fileVision: true, fileVisionTab: targetTab }));
      speakAnkit(msg, { onEnd: () => setState('idle') });
      return;
    }

    // Direct Automation / Routine Command Check
    if (['routine', 'automation', 'रूटीन', 'ऑटोमेशन', 'शॉर्टकट'].some((w) => lower.includes(w) || cleanText.includes(w))) {
      setState('speaking');
      const autoMsg = 'स्मार्ट ऑटोमेशन व प्री-डिफ़ाइंड रूटीन्स का हब खोल दिया गया है।';
      addLog('ai', autoMsg);
      setModalState((prev) => ({ ...prev, automation: true }));
      speakAnkit(autoMsg, { onEnd: () => setState('idle') });
      return;
    }

    // Direct Security & App Lock Command Check
    if (['lock', 'security', 'पिन', 'पासवर्ड', 'सुरक्षा', 'ऐप लॉक', 'लॉक करो'].some((w) => lower.includes(w) || cleanText.includes(w))) {
      setState('speaking');
      const secMsg = 'सुरक्षा केंद्र व ऐप लॉक सेटिंग्स खोली जा रही हैं।';
      addLog('ai', secMsg);
      setModalState((prev) => ({ ...prev, security: true }));
      speakAnkit(secMsg, { onEnd: () => setState('idle') });
      return;
    }

    // Direct Permissions Command Check
    if (['permission', 'अनुमति', 'परमिशन'].some((w) => lower.includes(w) || cleanText.includes(w))) {
      setState('speaking');
      const permMsg = 'पब्लिक ऐप परमिशन कंट्रोल पैनल प्रस्तुत है।';
      addLog('ai', permMsg);
      setModalState((prev) => ({ ...prev, permissions: true }));
      speakAnkit(permMsg, { onEnd: () => setState('idle') });
      return;
    }

    // Direct New Chat / Reset Chat Command Check
    if (['new chat', 'clear chat', 'नई चैट', 'नया चैट', 'इतिहास मिटाओ', 'डिलीट चैट'].some((w) => lower.includes(w) || cleanText.includes(w))) {
      try {
        localStorage.removeItem('ankita_chat_logs');
      } catch {}
      setLogs([]);
      setActiveTypingText('');
      const clearMsg = 'जी, नई बातचीत शुरू कर दी गई है और पिछला इतिहास साफ़ कर दिया गया है।';
      addLog('system', clearMsg);
      speakAnkit(clearMsg, { onEnd: () => setState('idle') });
      return;
    }

    // Add user text to logs
    addLog('user', cleanText);
    setInputText('');
    setInterimSpeech('');
    setState('processing');

    // Handle parameter answering if pending question
    let effectiveUserText = cleanText;
    let currentParameters = { ...tempMemory.parameters };

    if (tempMemory.current_question) {
      const qParam = tempMemory.current_question;
      currentParameters[qParam] = cleanText;
      effectiveUserText = tempMemory.last_user_text || cleanText;
    }

    try {
      const response = await fetch('/api/ankita/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_text: effectiveUserText,
          memory_block: longTermMemory,
          temp_memory: {
            ...tempMemory,
            parameters: currentParameters,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const result: JarvisResponse = await response.json();
      const { intent, parameters, needs_clarification, text, memory_update } = result;

      // Update Long-Term Memory if present
      if (memory_update && typeof memory_update === 'object') {
        setLongTermMemory((prev) => {
          const next = { ...prev };
          for (const [cat, items] of Object.entries(memory_update)) {
            if (items && typeof items === 'object') {
              (next as any)[cat] = { ...(next as any)[cat], ...items };
            }
          }
          return next;
        });
        addLog('action', `स्मृति अपडेट (MEMORY STORED): [${Object.keys(memory_update).join(', ')}]`);
      }

      // Update Temporary Session Memory
      setTempMemory((prev) => {
        const nextHistory = [
          ...prev.conversation_history,
          { role: 'user' as const, text: cleanText, timestamp: new Date().toISOString() },
          { role: 'ai' as const, text: text, timestamp: new Date().toISOString() },
        ].slice(-6);

        return {
          ...prev,
          pending_intent: needs_clarification ? intent : null,
          parameters: parameters || {},
          current_question: needs_clarification
            ? !parameters?.receiver
              ? 'receiver'
              : !parameters?.message_text
              ? 'message_text'
              : null
            : null,
          last_user_text: cleanText,
          last_ai_response: text,
          conversation_history: nextHistory,
        };
      });

      // Spoken Output & Logs
      setState('speaking');
      addLog('ai', text);

      speakAnkit(text, {
        onStart: () => setState('speaking'),
        onEnd: () => {
          setState('idle');
          routeIntentAction(intent, parameters, needs_clarification);
        },
        onError: () => {
          setState('idle');
          routeIntentAction(intent, parameters, needs_clarification);
        },
      });
    } catch (err: any) {
      console.warn('Network processing failed, switching to local offline AI engine:', err);
      const offlineRes = processOfflineDirective(cleanText);
      setState('speaking');
      addLog('system', '📴 स्थानीय ऑफलाइन AI मस्तिष्क द्वारा निष्पादित (Local Offline Processing)');
      addLog('ai', offlineRes.text);
      speakAnkit(offlineRes.text, {
        onStart: () => setState('speaking'),
        onEnd: () => {
          setState('idle');
          routeIntentAction(offlineRes.intent as any, offlineRes.parameters, false);
        },
        onError: () => {
          setState('idle');
          routeIntentAction(offlineRes.intent as any, offlineRes.parameters, false);
        },
      });
    }
  };

  // Route actions after speaking intent response with direct execution
  const routeIntentAction = async (
    intent: JarvisIntent,
    params: JarvisParameters,
    needsClarification: boolean
  ) => {
    if (needsClarification) {
      playAlert();
      return;
    }

    // 1. Direct Messaging (WhatsApp / SMS Autonomous Secretary Dispatch)
    if (intent === 'send_message') {
      playConfirm();
      vibrateDevice([120, 60, 120]);

      const receiver = params.receiver || params.phone_number || 'Contact';
      const messageText = params.message_text || params.messageText || 'नमस्ते!';
      const platform = params.platform || 'WhatsApp';
      const cleanNumber = receiver.replace(/\D/g, '');
      const fullNumber = cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber;
      const encodedText = encodeURIComponent(messageText);

      let directUrl = fullNumber
        ? `https://wa.me/${fullNumber}?text=${encodedText}`
        : `https://wa.me/?text=${encodedText}`;
      if (platform.toLowerCase() === 'sms') {
        directUrl = cleanNumber ? `sms:${cleanNumber}?body=${encodedText}` : `sms:?body=${encodedText}`;
      } else if (platform.toLowerCase() === 'telegram') {
        directUrl = `https://t.me/share/url?url=&text=${encodedText}`;
      }

      // AUTONOMOUS SECRETARY DISPATCH:
      // Direct deep link launch so the native app opens immediately without user friction!
      try {
        window.location.href = directUrl;
      } catch (e) {
        console.warn('Auto-dispatch link redirection:', e);
      }

      // Display live Autonomous Secretary Action Card
      setActiveAction({
        id: Math.random().toString(36).substring(2, 9),
        type: 'whatsapp',
        title: `⚡ सेक्रेटरी अंकिता: संदेश स्वतः प्रेषित`,
        subtitle: `"${messageText}" ➔ ${receiver}`,
        payload: { receiver, message_text: messageText, platform },
        actionUrl: directUrl,
        actionButtonText: `व्हाट्सएप में पुनः खोलें`,
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
      });

      addLog('action', `⚡ सेक्रेटरी अंकिता: [To: ${receiver}] "${messageText}" संदेश स्वतः व्हाट्सएप/एसएमएस पर प्रेषित किया गया।`);
      return;
    }

    // 2. Direct Phone Call
    if (intent === 'phone_call') {
      playConfirm();
      vibrateDevice([150, 75, 150]);
      const target = params.phone_number || params.contact_name || '112';

      dialPhoneNumber(target);

      setActiveAction({
        id: Math.random().toString(36).substring(2, 9),
        type: 'call',
        title: `📞 कॉल मिलाई जा रही है: ${target}`,
        subtitle: `फोन डायलर खोला गया है`,
        payload: { phone_number: target, contact_name: target },
        actionButtonText: 'डायलर में कॉल लगाएं (CALL NOW)',
        status: 'running',
        timestamp: new Date().toLocaleTimeString(),
      });

      addLog('action', `फोन कॉल आरंभ: ${target}`);
      return;
    }

    // 3. Device Controls (Torch, Battery, Location, Vibration, Camera)
    if (intent === 'device_control') {
      const action = params.action;
      vibrateDevice([100, 50, 100]);

      if (action === 'torch_on' || action === 'torch_off') {
        const torchRes = await toggleTorch(action === 'torch_on');
        addLog('action', torchRes.message);

        setActiveAction({
          id: Math.random().toString(36).substring(2, 9),
          type: 'torch',
          title: action === 'torch_on' ? '🔦 टॉर्च चालू है (Flashlight ON)' : '🔦 टॉर्च बंद है (Flashlight OFF)',
          subtitle: torchRes.message,
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (action === 'check_battery') {
        const b = await getBatteryTelemetry();
        const bText = `आपके फोन की बैटरी अभी ${b.level}% है और चार्जिंग ${b.charging ? 'चालू' : 'सामान्य'} है।`;
        addLog('action', `मोबाइल बैटरी: ${b.level}% (${b.charging ? 'चार्जिंग चालू' : 'डिस्चार्जिंग'})`);

        setActiveAction({
          id: Math.random().toString(36).substring(2, 9),
          type: 'battery',
          title: `🔋 बैटरी स्थिति: ${b.level}%`,
          subtitle: b.charging ? 'चार्जिंग सक्रिय है' : 'सामान्य मोड',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        });

        speakAnkit(bText);
      } else if (action === 'get_location') {
        const loc = await getDeviceLocation();
        addLog('action', `GPS लोकेशन: Lat ${loc.latitude.toFixed(4)}, Lon ${loc.longitude.toFixed(4)}`);

        setActiveAction({
          id: Math.random().toString(36).substring(2, 9),
          type: 'app',
          title: '📍 जीपीएस लोकेशन सक्रिय',
          subtitle: `Lat: ${loc.latitude.toFixed(4)}, Lon: ${loc.longitude.toFixed(4)}`,
          actionUrl: loc.mapsUrl,
          actionButtonText: 'गूगल मैप्स पर लोकेशन देखें',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (action === 'vibrate') {
        vibrateDevice([250, 100, 250]);
        addLog('action', 'मोबाइल में हैप्टिक कंपन उत्पन्न किया गया।');
      } else if (action === 'open_camera') {
        setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Camera HUD' }));
      } else {
        setModalState((prev) => ({ ...prev, mobileCenter: true }));
      }
      return;
    }

    // 4. Timer
    if (intent === 'timer') {
      playConfirm();
      vibrateDevice([100, 50, 100]);
      const dur = params.duration_seconds || 120;

      setActiveAction({
        id: Math.random().toString(36).substring(2, 9),
        type: 'timer',
        title: '⏰ उलटी गिनती टाइमर (Timer Active)',
        subtitle: `${Math.round(dur / 60)} मिनट का टाइमर चालू है`,
        payload: { durationSeconds: dur },
        status: 'running',
        timestamp: new Date().toLocaleTimeString(),
      });

      addLog('action', `टाइमर शुरू: ${dur} सेकंड`);
      return;
    }

    // 5. Notes
    if (intent === 'notes') {
      playConfirm();
      const nText = params.note_text || '';
      try {
        const existing = localStorage.getItem('ankit_mission_notes') || '';
        const updated = `${existing}\n- [${new Date().toLocaleDateString()}] ${nText}`;
        localStorage.setItem('ankit_mission_notes', updated);
      } catch {}

      setActiveAction({
        id: Math.random().toString(36).substring(2, 9),
        type: 'notes',
        title: '📝 नोट सुरक्षित किया गया',
        subtitle: nText,
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
      });

      addLog('action', `नोट सेव हुआ: "${nText}"`);
      return;
    }

    // 6. Open App (Direct Launch - no link requirement)
    if (intent === 'open_app') {
      playConfirm();
      const appName = params.app_name || 'Calculator';

      if (appName.toLowerCase().includes('youtube')) {
        // 1. Immediately open in-app YouTube player modal
        setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'YouTube' }));
        // 2. Also trigger direct navigation/app launch
        try {
          window.location.href = 'https://www.youtube.com';
        } catch {}

        setActiveAction({
          id: Math.random().toString(36).substring(2, 9),
          type: 'app',
          title: '▶️ YouTube सीधे खोला गया',
          subtitle: 'YouTube सक्रिय है (Native App / In-App Player)',
          actionUrl: 'https://www.youtube.com',
          actionButtonText: 'YouTube ऐप पर जाएं',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (appName.toLowerCase().includes('map')) {
        // 1. Immediately open in-app Google Maps Radar modal
        setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Google Maps' }));
        // 2. Also trigger direct navigation/maps launch
        try {
          window.location.href = 'https://maps.google.com';
        } catch {}

        setActiveAction({
          id: Math.random().toString(36).substring(2, 9),
          type: 'app',
          title: '🗺️ Google Maps सीधे खोला गया',
          subtitle: 'Google Maps नेविगेशन सक्रिय है',
          actionUrl: 'https://maps.google.com',
          actionButtonText: 'Google Maps ऐप पर जाएं',
          status: 'completed',
          timestamp: new Date().toLocaleTimeString(),
        });
      } else if (appName.toLowerCase().includes('weather') || appName.toLowerCase().includes('मौसम')) {
        setModalState((prev) => ({ ...prev, weather: true, weatherCity: 'New Delhi' }));
      } else if (appName.toLowerCase().includes('search') || appName.toLowerCase().includes('browser') || appName.toLowerCase().includes('chrome')) {
        setModalState((prev) => ({ ...prev, search: true, searchQuery: 'विश्व ज्ञान' }));
      } else if (appName.toLowerCase().includes('calc') || appName.toLowerCase().includes('गणक')) {
        setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Calculator' }));
      } else if (appName.toLowerCase().includes('cam') || appName.toLowerCase().includes('vision')) {
        setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Camera HUD' }));
      } else if (appName.toLowerCase().includes('note')) {
        setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Notes' }));
      } else {
        setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: appName }));
      }

      addLog('action', `📱 ऐप सीधे लॉन्च: ${appName} सफलतापूर्वक खोला गया।`);
      setTempMemory((prev) => ({ ...prev, last_opened_app: appName }));
      return;
    }

    // 7. Weather
    if (intent === 'weather_report') {
      playConfirm();
      setModalState((prev) => ({
        ...prev,
        weather: true,
        weatherCity: params.city || 'New Delhi',
      }));
      return;
    }

    // 8. World Knowledge / Search
    if (intent === 'search' || intent === 'world_knowledge') {
      playConfirm();
      const q = params.query || params.topic || '';
      setActiveAction({
        id: Math.random().toString(36).substring(2, 9),
        type: 'search',
        title: `🌐 विश्व ज्ञान: ${q}`,
        subtitle: params.answer || `"${q}" के बारे में जानकारी`,
        payload: { query: q },
        status: 'completed',
        timestamp: new Date().toLocaleTimeString(),
      });
      return;
    }
  };

  // Coordinated Smart Automation Routines Runner
  const handleRunRoutine = async (routineId: string) => {
    if (routineId === 'morning') {
      const b = await getBatteryTelemetry();
      const morningMsg = `सुप्रभात पंकज जी! आपका दिन बहुत शुभ और मंगलमय हो। अभी आपके मोबाइल की बैटरी ${b.level}% है और मौसम सुहावना है। आज के महत्वपूर्ण कार्यों के लिए मैं पूरी तरह तैयार हूँ!`;
      addLog('action', '🌅 गुड मॉर्निंग ब्रीफिंग निष्पादित (Morning Briefing Complete)');
      addLog('ai', morningMsg);
      speakAnkit(morningMsg);
    } else if (routineId === 'night') {
      await toggleTorch(false);
      const nightMsg = 'शुभ रात्रि पंकज जी! मैंने टॉर्च बंद कर दी है और 8 घंटे का टाइमर सक्रिय कर दिया है। मीठे सपनों के साथ अच्छी नींद लें!';
      addLog('action', '🌙 नाइट स्लीप रूटीन निष्पादित (Night Sleep Mode)');
      addLog('ai', nightMsg);
      speakAnkit(nightMsg);
      routeIntentAction('timer', { duration_seconds: 8 * 3600 }, false);
    } else if (routineId === 'work') {
      await requestScreenWakeLock();
      const workMsg = 'फोकस मोड सक्रिय! मोबाइल स्क्रीन को ऑन रखा गया है और मिशन नोट्स स्क्रैचपैड खोला जा रहा है।';
      addLog('action', '💼 वर्क/मीटिंग फोकस मोड सक्रिय (Focus Mode On)');
      addLog('ai', workMsg);
      speakAnkit(workMsg);
      setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Notes' }));
    } else if (routineId === 'travel') {
      const loc = await getDeviceLocation();
      const travelMsg = `ट्रैवल मोड चालू! आपकी जीपीएस स्थिति Lat ${loc.latitude.toFixed(4)}, Lon ${loc.longitude.toFixed(4)} है। गूगल मैप्स नेविगेशन तैयार है।`;
      addLog('action', '🚗 ट्रैवल व नेविगेशन मोड सक्रिय (Travel Mode On)');
      addLog('ai', travelMsg);
      speakAnkit(travelMsg);
      setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Google Maps' }));
    } else if (routineId === 'battery_saver') {
      const b = await getBatteryTelemetry();
      await toggleTorch(false);
      const batteryMsg = `बैटरी गार्ड सक्रिय! अभी बैटरी स्तर ${b.level}% है। हार्डवेयर सेंसर स्टैंडबाय पर हैं।`;
      addLog('action', '🔋 बैटरी सेवर रूटीन पूर्ण (Battery Saver Active)');
      addLog('ai', batteryMsg);
      speakAnkit(batteryMsg);
    }
  };

  // Instant Click-to-Activate & Click-to-Stop Dual-Engine Voice Pipeline
  const activeTranscriptRef = useRef<string>('');
  const autoFinishTimerRef = useRef<any>(null);
  const isStoppingVoiceRef = useRef<boolean>(false);

  const startVoiceInput = async () => {
    unlockAudioContext();
    if (state === 'speaking') {
      stopSpeaking();
      setState('idle');
    }

    if (autoFinishTimerRef.current) clearTimeout(autoFinishTimerRef.current);
    activeTranscriptRef.current = '';
    clearLatestTranscript();
    setInterimSpeech('');
    playMicOn();
    setState('listening');
    vibrateDevice([40]);
    addLog('system', '🎙️ माइक्रोफ़ोन सक्रिय: अंकिता आपकी पूरी बात सुन रही है...');

    const started = await startListening({
      lang: currentLang,
      continuous: true,
      onStart: () => {
        setState('listening');
      },
      onResult: (transcript, isFinal) => {
        setInterimSpeech(transcript);
        activeTranscriptRef.current = transcript;
        setInputText(transcript);

        // Auto-finish after 2.8s of silence if user stops speaking and doesn't click again
        if (autoFinishTimerRef.current) clearTimeout(autoFinishTimerRef.current);
        if (transcript.trim()) {
          autoFinishTimerRef.current = setTimeout(() => {
            finishVoiceInput();
          }, 2800);
        }
      },
      onError: (errMsg) => {
        console.warn('Voice notice:', errMsg);
        setState('idle');
        playMicOff();
        addLog('warning', errMsg);
      },
      onEnd: () => {
        setState((prev) => {
          if (prev === 'listening') {
            const captured = (activeTranscriptRef.current || getLatestTranscript()).trim();
            if (captured) {
              setTimeout(() => finishVoiceInput(), 50);
              return 'processing';
            }
            if (getIsListening()) {
              return 'listening';
            }
            return 'idle';
          }
          return prev;
        });
      },
    });

    if (!started) {
      setState('idle');
    }
  };

  const finishVoiceInput = async () => {
    if (isStoppingVoiceRef.current) return;
    isStoppingVoiceRef.current = true;
    if (autoFinishTimerRef.current) clearTimeout(autoFinishTimerRef.current);

    playMicOff();
    vibrateDevice([25]);
    setState('processing');

    try {
      let query = activeTranscriptRef.current.trim();
      const transcribed = await stopListeningAsync();
      if (!query && transcribed) {
        query = transcribed.trim();
      }

      if (query) {
        setInterimSpeech(query);
        setInputText(query);
        await handleProcessUserDirective(query);
      } else {
        setState('idle');
        addLog('warning', 'आवाज स्पष्ट नहीं मिली। कृपया माइक पर क्लिक करके दोबारा बोलें।');
      }
    } catch (err: any) {
      console.warn('Voice finish error:', err);
      setState('idle');
    } finally {
      isStoppingVoiceRef.current = false;
    }
  };

  // Click Toggle: 1st click = Start listening; 2nd click = Turn off & Answer
  const handleToggleVoice = () => {
    if (state === 'listening') {
      finishVoiceInput();
    } else {
      startVoiceInput();
    }
  };

  const handleStopSpeaking = () => {
    stopSpeaking();
    setState('idle');
  };

  const handleLanguageToggle = () => {
    playBeep(1100, 0.03);
    const nextLang = currentLang === 'hi-IN' ? 'en-IN' : 'hi-IN';
    setCurrentLang(nextLang);
    setRecognitionLanguage(nextLang);
  };

  const countMemories =
    Object.keys(longTermMemory.identity || {}).length +
    Object.keys(longTermMemory.preferences || {}).length +
    Object.keys(longTermMemory.relationships || {}).length +
    Object.keys(longTermMemory.emotional_state || {}).length;

  return (
    <div className="relative flex flex-col h-screen w-screen bg-[#02050b] text-[#8ffcff] overflow-hidden select-none font-sans">
      {/* Background Cybernetic Grid & Radial HUD Ambient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(0,180,255,0.12)_0%,transparent_65%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(to_right,#00f0ff_1px,transparent_1px),linear-gradient(to_bottom,#00f0ff_1px,transparent_1px)] bg-[size:48px_48px]"
      />

      {/* Futuristic Scanline Effect */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] opacity-40 z-30" />

      {/* Top HUD Bar */}
      <HudHeader
        onOpenMemory={() => setModalState((prev) => ({ ...prev, memory: true }))}
        onOpenApps={() => setModalState((prev) => ({ ...prev, appLauncher: true, launcherApp: 'Calculator' }))}
        onOpenWeather={() => setModalState((prev) => ({ ...prev, weather: true, weatherCity: 'New Delhi' }))}
        onOpenSearch={() => setModalState((prev) => ({ ...prev, search: true, searchQuery: 'विश्व ज्ञान (World Knowledge)' }))}
        onOpenMobileCenter={() => setModalState((prev) => ({ ...prev, mobileCenter: true }))}
        onOpenVoiceSettings={() => setModalState((prev) => ({ ...prev, voiceSettings: true }))}
        onOpenChatRecord={() => setMobileChatRecordOpen(true)}
        onOpenPermissions={() => setModalState((prev) => ({ ...prev, permissions: true }))}
        onOpenFileVision={() => setModalState((prev) => ({ ...prev, fileVision: true, fileVisionTab: 'document' }))}
        onOpenAutomation={() => setModalState((prev) => ({ ...prev, automation: true }))}
        onOpenSecurity={() => setModalState((prev) => ({ ...prev, security: true }))}
        onNewChat={() => {
          try {
            localStorage.removeItem('ankita_chat_logs');
          } catch {}
          setLogs([]);
          setActiveTypingText('');
          addLog('system', 'नई बातचीत शुरू की गई। पूर्व इतिहास साफ़ हो गया।');
          speakAnkit('जी, नई बातचीत शुरू कर दी गई है। मैं आपकी क्या सेवा करूँ?');
        }}
        onInstallApp={() => setModalState((prev) => ({ ...prev, directInstall: true }))}
        hasInstallPrompt={Boolean(deferredPrompt)}
        isListening={isListening}
        onToggleMic={handleToggleVoice}
        isOnline={isOnline}
        stateText={
          state === 'speaking'
            ? 'बोल रही हूँ (TRANSMIT)'
            : state === 'listening'
            ? 'सुन रही हूँ (LISTENING)'
            : state === 'processing'
            ? 'सोच रही हूँ (PROCESSING)'
            : 'अंकिता AI सक्रिय'
        }
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden p-2 sm:p-3 gap-3 relative z-10">
        {/* Left Telemetry Sidebar */}
        <SystemTelemetrySidebar
          memoryCount={countMemories}
          sessionSteps={tempMemory.conversation_history.length}
          lastAction={tempMemory.last_opened_app || tempMemory.pending_intent || 'IDLE'}
          onOpenMobile={() => setModalState((prev) => ({ ...prev, mobileCenter: true }))}
        />

        {/* Center Main Stage: Arc Reactor + Ankita Core */}
        <main className="flex-1 flex flex-col items-center justify-between relative">
          {/* Top Quick Status Chips */}
          <div className="w-full max-w-4xl flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono text-[#00b4d8] px-2 py-1">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2 h-2 rounded-full ${isOnline ? 'bg-[#00ff88]' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-white font-bold">{isOnline ? 'ANKITA AI ONLINE' : 'OFFLINE LOCAL AI'}</span>
              <span className="text-[10px] text-[#00ff88] hidden sm:inline">// 12-POINT AI HUB</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => {
                  playBeep(1100, 0.03);
                  setModalState((prev) => ({ ...prev, fileVision: true, fileVisionTab: 'vision' }));
                }}
                className="px-2 py-1 rounded-lg bg-[#00223d] hover:bg-[#003866] border border-[#00f0ff]/40 text-[#00f0ff] font-bold text-[11px] flex items-center gap-1 transition-all"
                title="फोटो, विज़न, OCR, PDF व फाइल समझें"
              >
                <span>👁️ विज़न / OCR</span>
              </button>

              <button
                onClick={() => {
                  playBeep(1100, 0.03);
                  setModalState((prev) => ({ ...prev, automation: true }));
                }}
                className="px-2 py-1 rounded-lg bg-[#001f3f] hover:bg-[#002f5e] border border-amber-500/40 text-amber-300 font-bold text-[11px] flex items-center gap-1 transition-all"
                title="स्मार्ट रूटीन्स व ऑटोमेशन"
              >
                <span>⚡ रूटीन्स</span>
              </button>

              <button
                onClick={() => {
                  playBeep(1100, 0.03);
                  setModalState((prev) => ({ ...prev, security: true }));
                }}
                className="px-2 py-1 rounded-lg bg-[#001f3f] hover:bg-[#002f5e] border border-[#00f0ff]/40 text-[#00f0ff] font-bold text-[11px] flex items-center gap-1 transition-all"
                title="सुरक्षा केंद्र व पिन लॉक"
              >
                <span>🔐 सुरक्षा</span>
              </button>

              <button
                onClick={() => {
                  playBeep(1100, 0.03);
                  setModalState((prev) => ({ ...prev, permissions: true }));
                }}
                className="px-2 py-1 rounded-lg bg-[#001f3f] hover:bg-[#002f5e] border border-[#00f0ff]/40 text-[#00f0ff] font-bold text-[11px] flex items-center gap-1 transition-all"
                title="पब्लिक ऐप अनुमतियां (Microphone, GPS, Camera, Notifications)"
              >
                <span>🛡️ ऐप अनुमतियां</span>
              </button>

              {/* Direct Mobile App Install Button right in HUD */}
              <button
                onClick={() => {
                  playBeep(1100, 0.03);
                  setModalState((prev) => ({ ...prev, directInstall: true }));
                }}
                className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-[#00ff88] text-[#00ff88] font-bold text-[11px] flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(0,255,136,0.25)] cursor-pointer"
              >
                <span>📲 फोन में ऐप इंस्टॉल करें</span>
              </button>
            </div>
          </div>

          {/* Central Arc Reactor Display */}
          <div className="relative flex-1 flex flex-col items-center justify-center my-auto">
            <ArcReactor
              state={state}
              onClick={handleToggleVoice}
              audioLevel={audioLevel}
              size={380}
            />

            {/* Interim live speech transcript preview */}
            {interimSpeech && isListening && (
              <div className="mt-8 px-4 py-2 rounded-xl bg-[#001424]/95 border border-[#00ff88]/60 text-xs font-mono text-[#00ff88] animate-pulse shadow-[0_0_20px_rgba(0,255,136,0.3)] max-w-md text-center">
                <span className="text-[#00b4d8]">सुन रही हूँ:</span> "{interimSpeech}"
              </div>
            )}

            {/* Active Direct Execution Action Card (WhatsApp, Call, Timer, Torch, etc.) */}
            <ActiveActionCard
              action={activeAction}
              onDismiss={() => setActiveAction(null)}
            />
          </div>

          {/* Bottom Quick Directives Bar */}
          <div className="w-full max-w-4xl">
            <QuickDirectives
              onSelect={handleProcessUserDirective}
              onStopSpeaking={handleStopSpeaking}
              isSpeaking={state === 'speaking'}
            />
          </div>
        </main>

        {/* Right Conversation & Telemetry Panel (साइड छत) */}
        <aside className="w-80 sm:w-96 lg:w-[420px] flex flex-col h-full hidden lg:flex shrink-0">
          <TerminalLogs
            logs={logs}
            onClear={() => {
              try {
                localStorage.removeItem('ankita_chat_logs');
              } catch {}
              setLogs([]);
            }}
            activeTypingText={activeTypingText}
            onReplaySpeech={(text) => speakAnkit(text)}
          />
        </aside>
      </div>

      {/* Mobile Drawer: Side Chat & Code Record ("साइड छत") */}
      {mobileChatRecordOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/80 backdrop-blur-md animate-fadeIn p-2 sm:p-4">
          <div className="relative w-full max-w-lg h-full mx-auto flex flex-col">
            <TerminalLogs
              logs={logs}
              onClear={() => {
                try {
                  localStorage.removeItem('ankita_chat_logs');
                } catch {}
                setLogs([]);
              }}
              activeTypingText={activeTypingText}
              onReplaySpeech={(text) => speakAnkit(text)}
              onClose={() => setMobileChatRecordOpen(false)}
              isMobileDrawer={true}
            />
          </div>
        </div>
      )}

      {/* Bottom Command Bar */}
      <footer className="relative z-20 border-t border-[#00f0ff]/25 bg-[#010a18]/95 backdrop-blur-md p-2.5 sm:p-3">
        {/* Floating Listening Action Banner */}
        {isListening && (
          <div
            onClick={finishVoiceInput}
            className="max-w-4xl mx-auto mb-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-[#00ff88] to-teal-400 text-black font-orbitron font-extrabold text-xs tracking-wider shadow-[0_0_30px_rgba(0,255,136,0.8)] animate-pulse flex items-center justify-between gap-2 select-none cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-black animate-ping" />
              <span>🎙️ अंकिता सुन रही है... बोलें! (माइक पर दोबारा क्लिक करें उत्तर के लिए)</span>
            </div>
            <span className="px-2.5 py-1 rounded bg-black text-[#00ff88] text-[11px] font-mono tracking-tight font-bold shrink-0">
              उत्तर पाएं ↵
            </span>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (inputText.trim()) {
              playBeep(1300, 0.04);
              handleProcessUserDirective(inputText);
            }
          }}
          className="max-w-4xl mx-auto flex items-center gap-2"
        >
          {/* Mic Button: Click to Activate / Click to Turn Off & Answer */}
          <button
            type="button"
            onClick={handleToggleVoice}
            className={`p-3.5 rounded-xl border transition-all flex items-center justify-center shrink-0 select-none relative cursor-pointer ${
              isListening
                ? 'bg-[#00ff88] border-[#00ff88] text-black shadow-[0_0_30px_rgba(0,255,136,0.8)] scale-110'
                : 'bg-[#001424] border-[#00f0ff]/30 text-[#00b4d8] hover:border-[#00f0ff] hover:text-[#00f0ff]'
            }`}
            title={
              isListening
                ? 'माइक बंद करें और तुरंत उत्तर प्राप्त करें (CLICK TO STOP & ANSWER)'
                : 'माइक सक्रिय करें और बोलें (CLICK TO TALK)'
            }
          >
            {isListening ? (
              <Mic className="w-5 h-5 text-black animate-bounce" />
            ) : (
              <MicOff className="w-5 h-5" />
            )}
          </button>

          {/* Language Switcher Badge (Hindi / English) */}
          <button
            type="button"
            onClick={handleLanguageToggle}
            className="px-2.5 py-2 rounded-xl bg-[#001424] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-white hover:border-[#00f0ff] transition-all text-xs font-mono font-bold flex items-center gap-1 shrink-0"
            title="भाषा बदलें (Toggle Hindi / English)"
          >
            <Languages className="w-3.5 h-3.5 text-[#00ff88]" />
            <span>{currentLang === 'hi-IN' ? '🇮🇳 हिन्दी' : '🌐 EN'}</span>
          </button>

          {/* Command input */}
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? '🎙️ अंकिता आपकी पूरी बात सुन रही है... (बोलकर माइक पर पुनः क्लिक करें)'
                  : 'अंकिता से कुछ भी पूछें या माइक पर क्लिक करें...'
              }
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-[#001222] border border-[#00f0ff]/30 focus:border-[#00f0ff] text-white font-sans text-xs sm:text-sm placeholder:text-[#0077b6]/70 focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50 shadow-inner"
            />
          </div>

          {/* Transmit Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || state === 'processing'}
            className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-[#001222] font-orbitron font-bold text-xs tracking-wider hover:opacity-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-1.5 sm:gap-2 disabled:opacity-35 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">भेजें</span>
          </button>
        </form>
      </footer>

      {/* Interactive Action Modals */}
      <DirectAppInstallModal
        isOpen={modalState.directInstall}
        onClose={() => setModalState((prev) => ({ ...prev, directInstall: false }))}
        deferredPrompt={deferredPrompt}
        appUrl="https://ais-pre-yoc6z6rqfzxipbxmmqyso7-685472996271.asia-east1.run.app"
      />

      <MobileDeviceCenter
        isOpen={modalState.mobileCenter}
        onClose={() => setModalState((prev) => ({ ...prev, mobileCenter: false }))}
        deferredPrompt={deferredPrompt}
        onInstalledApp={() => {
          addLog('action', 'अंकिता AI ऐप मोबाइल पर सफलतापूर्वक इंस्टॉल हुआ!');
          setDeferredPrompt(null);
        }}
      />

      <VoiceSettingsModal
        isOpen={modalState.voiceSettings}
        onClose={() => setModalState((prev) => ({ ...prev, voiceSettings: false }))}
      />

      <AppPermissionsModal
        isOpen={modalState.permissions}
        onClose={() => setModalState((prev) => ({ ...prev, permissions: false }))}
        onPermissionsUpdated={() => {
          addLog('system', 'पब्लिक ऐप अनुमतियां अद्यतित (Permissions updated)');
        }}
      />

      <SendMessageModal
        isOpen={modalState.sendMessage}
        parameters={modalState.messageParams}
        onClose={() => setModalState((prev) => ({ ...prev, sendMessage: false }))}
        onSend={(params) => {
          addLog('action', `संदेश प्रेषित (MESSAGE SENT) to ${params.receiver} via ${params.platform}: "${params.message_text}"`);
        }}
      />

      <WeatherModal
        isOpen={modalState.weather}
        city={modalState.weatherCity}
        onClose={() => setModalState((prev) => ({ ...prev, weather: false }))}
      />

      <SearchModal
        isOpen={modalState.search}
        query={modalState.searchQuery}
        onClose={() => setModalState((prev) => ({ ...prev, search: false }))}
      />

      <AppLauncherModal
        isOpen={modalState.appLauncher}
        initialApp={modalState.launcherApp}
        onClose={() => setModalState((prev) => ({ ...prev, appLauncher: false }))}
      />

      <MemoryModal
        isOpen={modalState.memory}
        longTermMemory={longTermMemory}
        temporaryMemory={tempMemory}
        onClose={() => setModalState((prev) => ({ ...prev, memory: false }))}
        onUpdateMemory={(newMem) => {
          setLongTermMemory(newMem);
          addLog('system', 'अंकित की दीर्घकालिक स्मृति मैन्युअल रूप से अपडेट हुई।');
        }}
        onResetMemory={() => {
          setLongTermMemory({
            identity: {},
            preferences: {},
            relationships: {},
            emotional_state: {},
          });
          addLog('warning', 'सभी संचित स्मृतियां मिटा दी गईं।');
        }}
      />

      {/* Multimodal Files, Documents, Vision, OCR & Personal Knowledge Base */}
      <FileAndVisionModal
        isOpen={modalState.fileVision}
        onClose={() => setModalState((prev) => ({ ...prev, fileVision: false }))}
        initialTab={modalState.fileVisionTab}
        onSpeakText={(text) => speakAnkit(text)}
      />

      {/* Smart Automations & Routines Hub */}
      <AutomationModal
        isOpen={modalState.automation}
        onClose={() => setModalState((prev) => ({ ...prev, automation: false }))}
        onRunRoutine={async (routineName) => {
          setModalState((prev) => ({ ...prev, automation: false }));
          addLog('action', `रूटीन प्रारंभ: ${routineName}`);
          await handleProcessUserDirective(routineName);
        }}
      />

      {/* Security, Privacy & App Lock Settings */}
      <SecurityLockModal
        isOpen={modalState.security}
        onClose={() => setModalState((prev) => ({ ...prev, security: false }))}
        onOpenPermissions={() => {
          setModalState((prev) => ({ ...prev, security: false, permissions: true }));
        }}
        onLockApp={() => {
          setModalState((prev) => ({ ...prev, security: false }));
          setIsAppLocked(true);
          addLog('system', '🔒 ऐप तुरंत लॉक कर दिया गया।');
        }}
      />

      {/* App PIN Lock Screen overlay when locked */}
      {isAppLocked && (
        <PinLockScreen
          onUnlock={() => {
            setIsAppLocked(false);
            addLog('system', '🔓 ऐप सफलतापूर्वक अनलॉक किया गया।');
            speakAnkit('स्वागत है! ऐप अनलॉक हो गया है।');
          }}
        />
      )}
    </div>
  );
}
