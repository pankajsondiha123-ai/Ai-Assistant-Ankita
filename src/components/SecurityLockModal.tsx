import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Sliders
} from 'lucide-react';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface SecurityLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPermissions: () => void;
  onLockApp: () => void;
}

export const SecurityLockModal: React.FC<SecurityLockModalProps> = ({
  isOpen,
  onClose,
  onOpenPermissions,
  onLockApp,
}) => {
  const [pinEnabled, setPinEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ankita_pin_enabled') === 'true';
  });
  const [currentPin, setCurrentPin] = useState<string>(() => {
    return localStorage.getItem('ankita_security_pin') || '';
  });
  const [inputPin, setInputPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    return localStorage.getItem('ankita_privacy_mode') === 'true';
  });

  if (!isOpen) return null;

  const handleSavePin = () => {
    if (inputPin.length !== 4 || !/^\d{4}$/.test(inputPin)) {
      setPinError('कृपया ठीक 4 अंकों का पिन दर्ज करें (उदा. 1234)');
      playAlert();
      return;
    }
    if (inputPin !== confirmPin) {
      setPinError('पिन मेल नहीं खाया। कृपया पुनः जाँचें।');
      playAlert();
      return;
    }

    playConfirm();
    localStorage.setItem('ankita_security_pin', inputPin);
    localStorage.setItem('ankita_pin_enabled', 'true');
    setCurrentPin(inputPin);
    setPinEnabled(true);
    setPinError('');
    setPinSuccess('4-अंकीय सुरक्षा पिन सफलतापूर्वक सेट हो गया!');
    setInputPin('');
    setConfirmPin('');
    setTimeout(() => setPinSuccess(''), 3000);
  };

  const handleDisablePin = () => {
    playBeep(700, 0.04);
    localStorage.removeItem('ankita_security_pin');
    localStorage.setItem('ankita_pin_enabled', 'false');
    setCurrentPin('');
    setPinEnabled(false);
    setPinSuccess('सुरक्षा पिन हटा दिया गया है।');
    setTimeout(() => setPinSuccess(''), 3000);
  };

  const handleTogglePrivacyMode = () => {
    playConfirm();
    const next = !privacyMode;
    setPrivacyMode(next);
    localStorage.setItem('ankita_privacy_mode', next ? 'true' : 'false');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#02182b] to-[#010915] border-2 border-[#00f0ff]/50 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#00f0ff]/25 bg-[#011425]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/40">
              <Shield className="w-5 h-5 text-[#00ff88]" />
            </div>
            <div>
              <div className="text-white font-bold font-orbitron text-sm sm:text-base flex items-center gap-2">
                <span>सुरक्षा व प्राइवेसी केंद्र (SECURITY & PRIVACY)</span>
              </div>
              <div className="text-[11px] text-[#00b4d8] font-mono">
                APP LOCK // SENSITIVE DATA ENCRYPTION
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              playBeep(700, 0.04);
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs font-mono text-[#8ffcff] overflow-y-auto">
          {/* Status Chip */}
          <div className="p-3.5 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {pinEnabled ? (
                <Lock className="w-5 h-5 text-[#00ff88]" />
              ) : (
                <Unlock className="w-5 h-5 text-amber-400" />
              )}
              <div>
                <div className="text-white font-bold text-sm font-orbitron">
                  {pinEnabled ? 'ऐप लॉक सक्रिय है (APP LOCK ACTIVE)' : 'ऐप लॉक बंद है (APP LOCK DISABLED)'}
                </div>
                <div className="text-[11px] text-[#00b4d8]">
                  {pinEnabled
                    ? 'अंकिता AI को खोलने के लिए 4-अंकीय पिन आवश्यक है।'
                    : 'कोई भी बिना पिन के सीधे ऐप खोल सकता है।'}
                </div>
              </div>
            </div>

            {pinEnabled && (
              <button
                onClick={() => {
                  playConfirm();
                  onLockApp();
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600/30 hover:bg-red-600/50 border border-red-500/50 text-red-300 font-orbitron text-xs flex items-center gap-1"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>अभी लॉक करें</span>
              </button>
            )}
          </div>

          {/* Setup / Change PIN Section */}
          <div className="p-4 rounded-xl bg-[#001122] border border-[#00f0ff]/25 space-y-3">
            <div className="text-white font-bold text-xs font-orbitron flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#00ff88]" />
              <span>{pinEnabled ? 'पिन बदलें या हटाएं (MANAGE PIN)' : 'नया 4-अंकीय सुरक्षा पिन बनाएं (SET PIN)'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[#00b4d8]">4 अंकों का पिन:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-lg bg-[#000d1a] border border-[#00f0ff]/30 text-white font-mono text-center text-lg tracking-widest focus:border-[#00f0ff] focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#00b4d8]">पिन दोबारा दर्ज करें:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  className="w-full px-3 py-2 rounded-lg bg-[#000d1a] border border-[#00f0ff]/30 text-white font-mono text-center text-lg tracking-widest focus:border-[#00f0ff] focus:outline-none"
                />
              </div>
            </div>

            {pinError && <div className="text-red-400 text-xs font-mono">{pinError}</div>}
            {pinSuccess && <div className="text-[#00ff88] text-xs font-mono font-bold">{pinSuccess}</div>}

            <div className="flex gap-2 pt-1">
              <button
                onClick={handleSavePin}
                className="flex-1 py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-orbitron font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>पिन सहेजें (SAVE PIN)</span>
              </button>

              {pinEnabled && (
                <button
                  onClick={handleDisablePin}
                  className="py-2 px-3 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-orbitron text-xs transition-colors"
                >
                  पिन हटाएं
                </button>
              )}
            </div>
          </div>

          {/* Privacy Mode Toggle */}
          <div className="p-3.5 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-white font-bold text-xs font-orbitron flex items-center gap-1.5">
                {privacyMode ? <EyeOff className="w-4 h-4 text-[#00ff88]" /> : <Eye className="w-4 h-4 text-[#00f0ff]" />}
                <span>गोपनीयता शील्ड (PRIVACY SHIELD)</span>
              </div>
              <div className="text-[11px] text-[#00b4d8]">
                स्क्रीन पर संवेदनशील संदेश और पासवर्ड ब्लर रखें।
              </div>
            </div>

            <button
              onClick={handleTogglePrivacyMode}
              className={`px-3 py-1.5 rounded-lg font-orbitron font-bold text-xs transition-all ${
                privacyMode
                  ? 'bg-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.5)]'
                  : 'bg-[#002f5e] text-[#00f0ff] border border-[#00f0ff]/40'
              }`}
            >
              {privacyMode ? 'सक्रिय (ON)' : 'बंद (OFF)'}
            </button>
          </div>

          {/* App Permissions Matrix Link */}
          <div className="p-3.5 rounded-xl bg-[#001122] border border-[#00f0ff]/25 flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-xs font-orbitron">
                अनुमति प्रबंधक (PERMISSIONS SWITCHBOARD)
              </div>
              <div className="text-[11px] text-[#00b4d8]">
                माइक, कैमरा, जीपीएस व नोटिफिकेशन अनुमति प्रबंधित करें।
              </div>
            </div>
            <button
              onClick={() => {
                playConfirm();
                onOpenPermissions();
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#002b4d] hover:bg-[#00386b] border border-[#00f0ff]/40 text-[#00f0ff] font-orbitron text-xs flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>मैनेज करें</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#010e1c] border-t border-[#00f0ff]/20 flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center gap-1.5 text-[#00ff88]">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span>256-bit लोकल डिवाइस एन्क्रिप्शन</span>
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
