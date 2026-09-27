import React, { useState, useEffect } from 'react';
import {
  Volume2,
  X,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Check,
  Languages
} from 'lucide-react';
import {
  getVoiceSettings,
  saveVoiceSettings,
  getAllVoices,
  testAnkitVoice,
  stopSpeaking,
  VoiceSettings,
} from '../utils/voiceSynthesis';
import { playBeep, playConfirm } from '../utils/soundEffects';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [settings, setSettings] = useState<VoiceSettings>(getVoiceSettings());
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [savedBadge, setSavedBadge] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getVoiceSettings());
      setVoices(getAllVoices());
    }
  }, [isOpen]);

  const handleChange = (key: keyof VoiceSettings, value: any) => {
    const updated = saveVoiceSettings({ [key]: value });
    setSettings(updated);
    setSavedBadge(true);
    setTimeout(() => setSavedBadge(false), 1500);
  };

  const handleTest = (lang: 'hi' | 'en') => {
    playBeep(1200, 0.04);
    setIsTesting(true);
    testAnkitVoice(lang, () => {
      setIsTesting(false);
    });
  };

  const handleReset = () => {
    playConfirm();
    stopSpeaking();
    const defaults: VoiceSettings = {
      rate: 0.98,
      pitch: 1.15,
      volume: 1.0,
      langMode: 'auto',
      selectedVoiceURI: null,
    };
    saveVoiceSettings(defaults);
    setSettings(defaults);
  };

  if (!isOpen) return null;

  // Filter voices into Hindi and English
  const hindiVoices = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('hi') ||
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('हिन्दी')
  );
  const femaleVoices = voices.filter(
    (v) =>
      v.name.toLowerCase().includes('female') ||
      v.name.toLowerCase().includes('swara') ||
      v.name.toLowerCase().includes('kalpana') ||
      v.name.toLowerCase().includes('lekha') ||
      v.name.toLowerCase().includes('priya') ||
      v.name.toLowerCase().includes('shruti') ||
      v.name.toLowerCase().includes('neerja') ||
      v.name.toLowerCase().includes('zira') ||
      v.name.toLowerCase().includes('samantha') ||
      v.name.toLowerCase().includes('victoria') ||
      v.name.toLowerCase().includes('karen') ||
      v.name.toLowerCase().includes('jenny')
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-lg bg-[#020d1a] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#002b4d] to-[#011424] border-b border-[#00f0ff]/30">
          <div className="flex items-center gap-2.5 text-[#00f0ff]">
            <Volume2 className="w-5 h-5 text-[#00f0ff] animate-pulse" />
            <span className="font-orbitron font-bold tracking-wider text-sm text-white">
              FEMALE VOICE CALIBRATION // अंकिता आवाज सेटिंग्स
            </span>
          </div>
          <button
            onClick={() => {
              stopSpeaking();
              playBeep(700, 0.04);
              onClose();
            }}
            className="text-[#00b4d8] hover:text-[#00f0ff] p-1.5 rounded-lg hover:bg-[#00f0ff]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs font-mono text-[#8ffcff] overflow-y-auto">
          {/* Quick Notice */}
          <div className="p-3 rounded-xl bg-[#001424] border border-[#00f0ff]/20 text-[11px] text-[#00b4d8] space-y-1">
            <div className="flex items-center gap-1.5 text-[#00ff88] font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>मधुर व प्राकृतिक आवाज प्रणाली (Natural Realistic Female Voice)</span>
            </div>
            <div>
              अंकिता को एक रियल लड़की और परी की तरह मधुर, स्पष्ट और सौम्य आवाज़ में बोलने के लिए कैलिब्रेट किया गया है।
            </div>
          </div>

          {/* Test Voice Buttons */}
          <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-2.5">
            <div className="text-[11px] font-bold text-white font-orbitron">
              आवाज टेस्ट करें (TEST VOICE NOW):
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTest('hi')}
                disabled={isTesting}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:opacity-90 text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>हिन्दी में टेस्ट करें</span>
              </button>

              <button
                onClick={() => handleTest('en')}
                disabled={isTesting}
                className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-500 hover:opacity-90 text-white font-bold flex items-center justify-center gap-1.5 transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>English Test</span>
              </button>
            </div>
          </div>

          {/* Specific Device Voice Dropdown */}
          {voices.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-[11px] text-white font-semibold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#00f0ff]" />
                <span>डिवाइस की आवाज़ चुनें (Choose Voice):</span>
              </label>
              <select
                value={settings.selectedVoiceURI || ''}
                onChange={(e) => handleChange('selectedVoiceURI', e.target.value || null)}
                className="w-full px-3 py-2 rounded-lg bg-[#001424] border border-[#00f0ff]/30 text-white text-xs font-sans focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="">✨ ऑटो (सर्वश्रेष्ठ मधुर आवाज़ / Recommended)</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Language Preference */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-white font-semibold flex items-center gap-1.5">
              <Languages className="w-3.5 h-3.5 text-[#00f0ff]" />
              <span>भाषा प्राथमिकता (Language Preference):</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'auto', label: 'स्वतः पहचान (Auto Detect)' },
                { id: 'hindi', label: 'हिन्दी प्राथमिकता (Hindi)' },
                { id: 'indian_english', label: 'Indian English' },
                { id: 'global_english', label: 'Global English' },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleChange('langMode', m.id)}
                  className={`py-2 px-2.5 rounded-lg border text-left transition-all ${
                    settings.langMode === m.id
                      ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-white font-bold'
                      : 'bg-[#001424] border-[#00f0ff]/20 text-[#00b4d8] hover:border-[#00f0ff]/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Speed / Rate Slider */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#001424] border border-[#00f0ff]/20">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white font-semibold">बोलने की गति (Speech Rate):</span>
              <span className="text-[#00ff88] font-bold font-mono">{settings.rate.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.35"
              step="0.05"
              value={settings.rate}
              onChange={(e) => handleChange('rate', parseFloat(e.target.value))}
              className="w-full accent-[#00f0ff] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#0077b6]">
              <span>धीमी (Slow 0.75x)</span>
              <span>सामान्य (1.0x)</span>
              <span>तेज़ (Fast 1.35x)</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div className="space-y-1.5 p-3 rounded-xl bg-[#001424] border border-[#00f0ff]/20">
            <div className="flex justify-between items-center text-xs">
              <span className="text-white font-semibold">आवाज की पिच (Voice Pitch):</span>
              <span className="text-[#00ff88] font-bold font-mono">{settings.pitch.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.2"
              step="0.05"
              value={settings.pitch}
              onChange={(e) => handleChange('pitch', parseFloat(e.target.value))}
              className="w-full accent-[#00f0ff] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-[#0077b6]">
              <span>गंभीर (Deeper 0.8)</span>
              <span>सामान्य (1.0)</span>
              <span>हल्की (Higher 1.2)</span>
            </div>
          </div>

          {/* Reset button */}
          <div className="flex items-center justify-between pt-2 border-t border-[#00f0ff]/20">
            <button
              onClick={handleReset}
              className="text-[#00b4d8] hover:text-white flex items-center gap-1.5 text-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>डिफ़ॉल्ट रीसेट करें</span>
            </button>

            {savedBadge && (
              <span className="text-[#00ff88] text-[11px] flex items-center gap-1 animate-fadeIn">
                <Check className="w-3 h-3" />
                <span>सेव हो गया</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
