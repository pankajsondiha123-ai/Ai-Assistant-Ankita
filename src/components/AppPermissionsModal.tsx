import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Mic,
  Camera,
  MapPin,
  Bell,
  Copy,
  Zap,
  CheckCircle2,
  XCircle,
  AlertCircle,
  X,
  ExternalLink,
  Sparkles,
  Info,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import {
  checkAllPermissions,
  requestMicrophonePermission,
  requestCameraPermission,
  requestGeolocationPermission,
  requestNotificationPermission,
  requestScreenWakeLock,
  requestAllPublicPermissions,
  PermissionsSummary,
  PermissionState
} from '../utils/permissionsManager';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface AppPermissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionsUpdated?: () => void;
}

export const AppPermissionsModal: React.FC<AppPermissionsModalProps> = ({
  isOpen,
  onClose,
  onPermissionsUpdated,
}) => {
  const [summary, setSummary] = useState<PermissionsSummary>({
    microphone: 'prompt',
    camera: 'prompt',
    geolocation: 'prompt',
    notifications: 'prompt',
    clipboard: 'prompt',
    wakeLock: 'prompt',
    allEssentialGranted: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const refreshStatuses = async () => {
    const res = await checkAllPermissions();
    setSummary(res);
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatuses();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const countGranted = [
    summary.microphone,
    summary.notifications,
    summary.geolocation,
    summary.camera,
    summary.clipboard,
    summary.wakeLock,
  ].filter((s) => s === 'granted').length;

  const handleGrantAll = async () => {
    setIsLoading(true);
    playConfirm();
    try {
      const updated = await requestAllPublicPermissions();
      setSummary(updated);
      onPermissionsUpdated?.();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSingleGrant = async (type: string) => {
    playBeep(1200, 0.04);
    setIsLoading(true);
    try {
      if (type === 'microphone') await requestMicrophonePermission();
      else if (type === 'notifications') await requestNotificationPermission();
      else if (type === 'geolocation') await requestGeolocationPermission();
      else if (type === 'camera') await requestCameraPermission();
      else if (type === 'wakeLock') await requestScreenWakeLock();

      const updated = await checkAllPermissions();
      setSummary(updated);
      onPermissionsUpdated?.();
    } finally {
      setIsLoading(false);
    }
  };

  const renderBadge = (state: PermissionState) => {
    if (state === 'granted') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-[#00ff88] border border-[#00ff88]/40 flex items-center gap-1 font-mono">
          <CheckCircle2 className="w-3 h-3 text-[#00ff88]" />
          सक्रिय (GRANTED)
        </span>
      );
    }
    if (state === 'denied') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1 font-mono">
          <XCircle className="w-3 h-3 text-red-400" />
          अवरुद्ध (DENIED)
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1 font-mono">
        <AlertCircle className="w-3 h-3 text-amber-400" />
        स्वीकृति चाहिए (PROMPT)
      </span>
    );
  };

  const permissionsList = [
    {
      id: 'microphone',
      name: 'माइक्रोफ़ोन (Microphone)',
      desc: 'अंकिता से बोलकर बातचीत करने, प्रश्न पूछने और स्वचालित गेन कंट्रोल (AGC) के लिए अनिवार्य।',
      icon: Mic,
      state: summary.microphone,
      essential: true,
      color: 'text-[#00ff88]',
    },
    {
      id: 'notifications',
      name: 'सिस्टम सूचनाएं (Push Notifications)',
      desc: 'टाइमर पूरा होने, रिमाइंडर्स और आवश्यक संदेशों की सूचना पाने के लिए।',
      icon: Bell,
      state: summary.notifications,
      essential: false,
      color: 'text-yellow-400',
    },
    {
      id: 'geolocation',
      name: 'स्थान / GPS (Geolocation)',
      desc: 'आपके शहर का सटीक मौसम, तापमान, और स्थानीय प्रश्नों के त्वरित उत्तर के लिए।',
      icon: MapPin,
      state: summary.geolocation,
      essential: false,
      color: 'text-[#00f0ff]',
    },
    {
      id: 'camera',
      name: 'कैमरा व टॉर्च (Camera / Flashlight)',
      desc: 'मोबाइल की टॉर्च/फ़्लैशलाइट को आवाज से चालू-बंद करने और विजन एचयूडी के लिए।',
      icon: Camera,
      state: summary.camera,
      essential: false,
      color: 'text-purple-400',
    },
    {
      id: 'clipboard',
      name: 'क्लिपबोर्ड (Clipboard Access)',
      desc: 'अंकिता द्वारा जनरेट किया गया कोड और बातचीत को 1-क्लिक में कॉपी करने के लिए।',
      icon: Copy,
      state: summary.clipboard,
      essential: false,
      color: 'text-cyan-300',
    },
    {
      id: 'wakeLock',
      name: 'स्क्रीन वेकलॉक (Keep Screen On)',
      desc: 'लंबी बातचीत या कोड लिखते समय फोन की स्क्रीन को बंद होने से बचाने के लिए।',
      icon: Zap,
      state: summary.wakeLock,
      essential: false,
      color: 'text-amber-400',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#02182b] to-[#010915] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#00f0ff]/25 bg-[#011425]/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff]">
              <Shield className="w-5 h-5 text-[#00ff88]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold font-orbitron text-sm sm:text-base">
                  पब्लिक ऐप अनुमतियां (APP PERMISSIONS)
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff88]/20 text-[#00ff88] font-mono border border-[#00ff88]/40">
                  {countGranted}/6 सक्रिय
                </span>
              </div>
              <div className="text-[11px] text-[#00b4d8] font-mono">
                PUBLIC DOMAIN SECURITY & HARDWARE PERMISSIONS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={refreshStatuses}
              className="p-1.5 rounded-lg bg-[#001f3f] text-[#00f0ff] hover:bg-[#002f5e] transition-colors"
              title="स्थिति रीफ़्रेश करें"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-[#00f0ff]/30 scrollbar-track-transparent">
          {/* Master 1-Click Action Box */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 via-[#002b4d]/50 to-teal-950/40 border border-[#00ff88]/40 shadow-[0_0_20px_rgba(0,255,136,0.15)] flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-sm font-bold text-white font-orbitron">
                <Sparkles className="w-4 h-4 text-[#00ff88] animate-spin" />
                <span>पब्लिक एक्सेस: सभी अनुमतियां चालू करें</span>
              </div>
              <div className="text-xs text-[#8ffcff]/80">
                एक क्लिक में माइक, नोटिफिकेशन, लोकेशन व स्क्रीन लॉक को सक्षम करें।
              </div>
            </div>

            <button
              onClick={handleGrantAll}
              disabled={isLoading}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-[#00ff88] to-teal-400 hover:from-[#33ff9f] hover:to-teal-300 text-black font-orbitron font-extrabold text-xs shadow-[0_0_20px_rgba(0,255,136,0.5)] transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isLoading ? 'चालू हो रहा है...' : 'सभी अनुमतियां Allow करें'}</span>
            </button>
          </div>

          {/* Individual Permission List */}
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-[#00f0ff] font-orbitron tracking-wider flex items-center justify-between">
              <span>अनुमति सूची (INDIVIDUAL PERMISSIONS):</span>
              <span className="text-[10px] text-[#0077b6]">पब्लिक मोड के लिए तैयार</span>
            </div>

            {permissionsList.map((item) => {
              const Icon = item.icon;
              const isGranted = item.state === 'granted';

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 ${
                    isGranted
                      ? 'bg-[#00172e]/70 border-[#00ff88]/30 shadow-[0_0_15px_rgba(0,255,136,0.06)]'
                      : 'bg-[#001122]/90 border-[#00f0ff]/20 hover:border-[#00f0ff]/40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg bg-[#001f3f] border border-[#00f0ff]/20 ${item.color} shrink-0 mt-0.5`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {item.name}
                        </span>
                        {item.essential && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 border border-red-500/30 font-mono">
                            अनिवार्य
                          </span>
                        )}
                        {renderBadge(item.state)}
                      </div>
                      <p className="text-[11px] text-[#8ffcff]/75 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  {/* Single grant button */}
                  {!isGranted && (
                    <button
                      onClick={() => handleSingleGrant(item.id)}
                      disabled={isLoading}
                      className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-[#002b4d] hover:bg-[#004073] border border-[#00f0ff]/40 hover:border-[#00f0ff] text-[#00f0ff] text-xs font-semibold font-orbitron transition-all shrink-0 flex items-center justify-center gap-1 active:scale-95"
                    >
                      <span>अनुमति दें</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help Toggle Guide */}
          <div className="pt-2 border-t border-[#00f0ff]/15">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="w-full py-2 px-3 rounded-lg bg-[#001424] hover:bg-[#001d36] border border-[#00f0ff]/20 flex items-center justify-between text-xs text-[#00b4d8] font-mono transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-[#00f0ff]" />
                <span>ब्राउज़र में अनुमति कैसे Allow करें? (Browser Permission Help)</span>
              </span>
              <span className="text-white font-bold">{showHelp ? '▲ बंद करें' : '▼ देखें'}</span>
            </button>

            {showHelp && (
              <div className="mt-2 p-3 rounded-xl bg-[#000d1a] border border-[#00f0ff]/25 space-y-2 text-xs text-[#e0f7fa]">
                <div className="font-bold text-[#00ff88] font-orbitron">
                  📱 मोबाइल व कंप्यूटर पर अनुमति चालू करने का तरीका:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-[#b0e0e6] leading-relaxed">
                  <li>
                    ब्राउज़र के एड्रेस बार (Address Bar) में ऊपर बाईं ओर बने <strong>ताला (🔒)</strong> या <strong>ट्यूनिंग (Site Settings)</strong> आइकन पर क्लिक करें।
                  </li>
                  <li>
                    <strong>"Permissions"</strong> या <strong>"Site settings"</strong> विकल्प खोलें।
                  </li>
                  <li>
                    <strong>Microphone (माइक)</strong>, <strong>Location (स्थान)</strong> और <strong>Notifications</strong> को <strong>"Allow" (अनुमति दें)</strong> पर सेट करें।
                  </li>
                  <li>
                    पेज को रीफ़्रेश (Reload) करें। अब आप अंकिता से बेरोकटोक आवाज में बात कर सकेंगे!
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 bg-[#010e1c] border-t border-[#00f0ff]/20 flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center gap-1.5 text-[#00ff88]">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span>पब्लिक डोमेन अनुमतियां सुरक्षित</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#00223a] hover:bg-[#00385c] text-white border border-[#00f0ff]/30 text-xs font-orbitron font-semibold transition-colors"
          >
            पूर्ण (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
