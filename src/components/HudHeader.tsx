import React, { useState, useEffect } from 'react';
import {
  Shield,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Database,
  Layers,
  Maximize2,
  Minimize2,
  Radio,
  Cpu,
  Zap,
  Clock,
  Smartphone,
  Sliders,
  Download,
  MessageSquare,
  ShieldCheck,
  FileText,
  Lock,
  Wifi,
  WifiOff,
  PlusCircle
} from 'lucide-react';
import { isSoundEnabled, setSoundEnabled, playBeep } from '../utils/soundEffects';

interface HudHeaderProps {
  onOpenMemory: () => void;
  onOpenApps: () => void;
  onOpenWeather: () => void;
  onOpenSearch: () => void;
  onOpenMobileCenter: () => void;
  onOpenVoiceSettings: () => void;
  onOpenChatRecord?: () => void;
  onOpenPermissions?: () => void;
  onOpenFileVision?: () => void;
  onOpenAutomation?: () => void;
  onOpenSecurity?: () => void;
  onNewChat?: () => void;
  onInstallApp?: () => void;
  hasInstallPrompt?: boolean;
  isListening: boolean;
  onToggleMic: () => void;
  isOnline?: boolean;
  stateText: string;
}

export const HudHeader: React.FC<HudHeaderProps> = ({
  onOpenMemory,
  onOpenApps,
  onOpenWeather,
  onOpenSearch,
  onOpenMobileCenter,
  onOpenVoiceSettings,
  onOpenChatRecord,
  onOpenPermissions,
  onOpenFileVision,
  onOpenAutomation,
  onOpenSecurity,
  onNewChat,
  onInstallApp,
  hasInstallPrompt = false,
  isListening,
  onToggleMic,
  isOnline = true,
  stateText,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [soundOn, setSoundOn] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) playBeep(1200, 0.04);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <header className="relative w-full z-20 border-b border-[#00f0ff]/20 bg-[#010814]/90 backdrop-blur-md px-3 sm:px-4 py-2.5 flex items-center justify-between text-[#00f0ff] select-none font-mono">
      {/* Top subtle HUD scanning bar line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent opacity-80" />

      {/* Left branding */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#001f3f] border border-[#00f0ff]/50 shadow-[0_0_12px_rgba(0,240,255,0.3)]">
          <Zap className="w-4 h-4 text-[#00ff88] animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="font-orbitron font-extrabold tracking-wider text-white text-sm sm:text-base">
              ANKITA AI
            </span>
            <span className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 font-mono">
              अंकिता v12.0
            </span>
          </div>
          <div className="text-[10px] text-[#00b4d8]/80 font-mono tracking-widest hidden md:block">
            UNIVERSAL INTELLIGENCE & MOBILE ASSISTANT
          </div>
        </div>
      </div>

      {/* Center Telemetry Status */}
      <div className="hidden lg:flex items-center gap-5 text-xs text-[#00b4d8]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
          <span className="text-white font-semibold">CORE:</span>
          <span className="text-[#00ff88]">99.2% STABLE</span>
        </div>

        {/* Online / Offline indicator */}
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono ${
          isOnline
            ? 'bg-emerald-950/40 border-[#00ff88]/40 text-[#00ff88]'
            : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
        }`}>
          {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5 text-amber-400" />}
          <span>{isOnline ? 'ONLINE AI' : 'OFFLINE MODE'}</span>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span className="text-white font-bold tracking-wider">{timeStr}</span>
        </div>

        <div className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[#001b33] border border-[#00f0ff]/20">
          <Shield className="w-3 h-3 text-[#00f0ff]" />
          <span className="text-cyan-200">{stateText}</span>
        </div>
      </div>

      {/* Right Action buttons */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* New Chat Button */}
        {onNewChat && (
          <button
            onClick={() => {
              playBeep(1200, 0.03);
              onNewChat();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#001b33] border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#002f5e] hover:border-[#00ff88] transition-all flex items-center gap-1.5 text-xs font-orbitron font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            title="नई चैट व इतिहास साफ़ करें (New Chat)"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#00ff88]" />
            <span className="hidden xl:inline">NEW CHAT</span>
          </button>
        )}

        {/* Multimodal Files, Vision, OCR & Knowledge Base */}
        {onOpenFileVision && (
          <button
            onClick={() => {
              playBeep(1100, 0.03);
              onOpenFileVision();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#00223d] border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#003866] hover:border-[#00ff88] transition-all flex items-center gap-1.5 text-xs font-orbitron font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            title="फाइल, पीडीएफ, फोटो विज़न, OCR व पर्सनल नॉलेज बेस"
          >
            <FileText className="w-3.5 h-3.5 text-[#00ff88]" />
            <span className="hidden sm:inline">विज़न/फाइल</span>
          </button>
        )}

        {/* Smart Automations & Routines */}
        {onOpenAutomation && (
          <button
            onClick={() => {
              playBeep(1100, 0.03);
              onOpenAutomation();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#001b3a] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all flex items-center gap-1 text-xs font-orbitron"
            title="स्मार्ट ऑटोमेशन व प्री-डिफ़ाइंड रूटीन्स (Morning, Night, SOS, Work)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden xl:inline">रूटीन्स</span>
          </button>
        )}

        {/* Security & App Lock */}
        {onOpenSecurity && (
          <button
            onClick={() => {
              playBeep(1100, 0.03);
              onOpenSecurity();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#001b3a] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all flex items-center gap-1 text-xs font-orbitron"
            title="सुरक्षा केंद्र व ऐप लॉक (PIN / Privacy Lock)"
          >
            <Lock className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="hidden xl:inline">सुरक्षा</span>
          </button>
        )}
        {/* Public App Permissions Button */}
        {onOpenPermissions && (
          <button
            onClick={() => {
              playBeep(1100, 0.03);
              onOpenPermissions();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#001f3f] border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00386b] hover:border-[#00ff88] transition-all flex items-center gap-1.5 text-xs font-orbitron font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            title="पब्लिक ऐप अनुमतियां (Microphone, Camera, GPS, Notifications)"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#00ff88]" />
            <span className="hidden sm:inline">अनुमतियां</span>
          </button>
        )}

        {/* Side Chat Record & Code Button */}
        {onOpenChatRecord && (
          <button
            onClick={() => {
              playBeep(1100, 0.03);
              onOpenChatRecord();
            }}
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#002b4d]/60 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/20 hover:border-[#00f0ff] transition-all flex items-center gap-1 text-xs font-orbitron font-semibold shadow-[0_0_12px_rgba(0,240,255,0.2)]"
            title="पूरी बातचीत का रिकॉर्ड व कोड देखें (Side Chat & Code Record)"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#00ff88]" />
            <span className="hidden sm:inline">CHAT RECORD</span>
          </button>
        )}

        {/* Mobile Command Center Button */}
        <button
          onClick={() => {
            playBeep(1100, 0.03);
            onOpenMobileCenter();
          }}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-[#00ff88]/15 border border-[#00ff88]/40 text-[#00ff88] hover:bg-[#00ff88]/25 transition-all flex items-center gap-1.5 text-xs font-orbitron"
          title="Open Mobile Controls (Battery, Torch, GPS, Call, SMS)"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">MOBILE</span>
        </button>

        {/* Voice Calibrate Button */}
        <button
          onClick={() => {
            playBeep(1100, 0.03);
            onOpenVoiceSettings();
          }}
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-[#001424] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all flex items-center gap-1 text-xs font-orbitron"
          title="Adjust Voice Speed, Pitch & Test Sound"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span className="hidden md:inline">VOICE</span>
        </button>

        {/* Mic Toggle Button */}
        <button
          onClick={onToggleMic}
          className={`px-2 sm:px-2.5 py-1.5 rounded-lg border text-xs font-orbitron tracking-wider flex items-center gap-1.5 transition-all ${
            isListening
              ? 'bg-[#00ff88]/20 border-[#00ff88] text-[#00ff88] shadow-[0_0_15px_rgba(0,255,136,0.3)] animate-pulse'
              : 'bg-[#001424] border-[#00f0ff]/30 text-[#00b4d8] hover:border-[#00f0ff]'
          }`}
          title={isListening ? 'Microphone Active (Click to pause)' : 'Microphone Inactive (Click to listen)'}
        >
          {isListening ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isListening ? 'LISTENING' : 'MIC'}</span>
        </button>

        {/* Memory Inspector Button */}
        <button
          onClick={() => {
            playBeep(1100, 0.03);
            onOpenMemory();
          }}
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-[#001424] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all flex items-center gap-1 text-xs font-orbitron"
          title="Inspect Neural Memory"
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">MEMORY</span>
        </button>

        {/* Subsystems / Apps */}
        <button
          onClick={() => {
            playBeep(1100, 0.03);
            onOpenApps();
          }}
          className="p-1.5 sm:px-2 sm:py-1.5 rounded-lg bg-[#001424] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-[#00f0ff] hover:border-[#00f0ff] transition-all flex items-center gap-1 text-xs font-orbitron"
          title="Subsystem Apps (Calculator, Camera, Notes)"
        >
          <Layers className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">APPS</span>
        </button>

        {/* PWA Direct App Install Button */}
        <button
          onClick={() => {
            playBeep(1100, 0.03);
            if (onInstallApp) onInstallApp();
          }}
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/25 to-teal-400/25 border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff88]/30 transition-all flex items-center gap-1 text-xs font-orbitron font-bold shadow-[0_0_15px_rgba(0,255,136,0.3)]"
          title="Install App to Phone Home Screen"
        >
          <Download className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">ऐप इंस्टॉल</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          className="p-1.5 rounded-lg bg-[#001424] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-[#00f0ff] transition-all"
          title={soundOn ? 'Mute HUD SFX' : 'Enable HUD SFX'}
        >
          {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
        </button>

        {/* Fullscreen */}
        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded-lg bg-[#001424] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-[#00f0ff] transition-all hidden sm:block"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
