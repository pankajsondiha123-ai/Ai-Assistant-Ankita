import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Phone,
  Flashlight,
  Clock,
  Battery,
  FileText,
  ExternalLink,
  Copy,
  Check,
  X,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Globe
} from 'lucide-react';
import { ActiveAction } from '../types';
import { playConfirm, playBeep, playAlert } from '../utils/soundEffects';
import { toggleTorch, dialPhoneNumber, sendSmsMessage, copyToClipboard } from '../utils/mobileDevice';

interface ActiveActionCardProps {
  action: ActiveAction | null;
  onDismiss: () => void;
}

export const ActiveActionCard: React.FC<ActiveActionCardProps> = ({ action, onDismiss }) => {
  const [copied, setCopied] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [torchState, setTorchState] = useState(false);

  useEffect(() => {
    if (!action) return;

    if (action.type === 'timer' && action.payload?.durationSeconds) {
      setTimerSeconds(action.payload.durationSeconds);
      setTimerRunning(true);
    }
  }, [action]);

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerRunning(false);
            playAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  if (!action) return null;

  const handleCopy = async (text: string) => {
    playConfirm();
    await copyToClipboard(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLink = (url: string) => {
    playConfirm();
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const handleToggleTorchAction = async () => {
    playBeep(1200, 0.04);
    const res = await toggleTorch();
    setTorchState(res.state);
  };

  return (
    <div className="w-full max-w-xl mx-auto my-2 p-3 sm:p-4 rounded-2xl bg-[#001428]/95 border-2 border-[#00f0ff] shadow-[0_0_30px_rgba(0,240,255,0.35)] backdrop-blur-md animate-fadeIn select-none font-sans z-30 relative">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#00f0ff]/30 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping" />
          <span className="font-orbitron font-extrabold text-xs sm:text-sm tracking-wider text-white">
            {action.title}
          </span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40">
            कार्य सक्रिय (TASK EXECUTING)
          </span>
        </div>
        <button
          onClick={() => {
            playBeep(700, 0.04);
            onDismiss();
          }}
          className="text-[#00b4d8] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* WHATSAPP & MESSAGING ACTION */}
      {(action.type === 'whatsapp' || action.type === 'sms') && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#000d1a] border border-[#00f0ff]/25 space-y-1.5 text-xs">
            <div className="flex justify-between text-[#00b4d8] font-mono">
              <span>प्राप्तकर्ता (To): <strong className="text-white text-sm">{action.payload?.receiver || 'Contact'}</strong></span>
              <span className="text-[#00ff88] font-bold">{action.type.toUpperCase()}</span>
            </div>
            <div className="text-white text-sm font-sans bg-[#001830] p-2.5 rounded-lg border border-[#00f0ff]/20 break-words">
              "{action.payload?.message_text || action.subtitle}"
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                if (action.actionUrl) {
                  handleOpenLink(action.actionUrl);
                } else {
                  const text = encodeURIComponent(action.payload?.message_text || '');
                  const num = (action.payload?.receiver || '').replace(/\D/g, '');
                  const url = num ? `https://wa.me/${num}?text=${text}` : `https://wa.me/?text=${text}`;
                  handleOpenLink(url);
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-400 hover:opacity-95 text-black font-orbitron font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
            >
              <MessageSquare className="w-4 h-4 fill-black" />
              <span>{action.actionButtonText || 'अभी व्हाट्सएप में खोलें व भेजें'}</span>
            </button>

            {action.payload?.message_text && (
              <button
                onClick={() => {
                  playConfirm();
                  sendSmsMessage(action.payload?.receiver || '', action.payload?.message_text);
                }}
                className="py-2.5 px-3 rounded-xl bg-blue-600/30 hover:bg-blue-600/50 border border-blue-400 text-cyan-200 font-orbitron text-xs flex items-center gap-1.5 transition-all"
                title="Send as SMS"
              >
                <span>SMS भेजें</span>
              </button>
            )}

            <button
              onClick={() => handleCopy(action.payload?.message_text || action.subtitle)}
              className="py-2.5 px-3 rounded-xl bg-[#001f3f] hover:bg-[#002f5f] border border-[#00f0ff]/40 text-[#00f0ff] text-xs font-mono flex items-center gap-1 transition-all"
              title="Copy message text"
            >
              {copied ? <Check className="w-4 h-4 text-[#00ff88]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'कॉपी हो गया' : 'कॉपी'}</span>
            </button>
          </div>
        </div>
      )}

      {/* PHONE CALL ACTION */}
      {action.type === 'call' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#000d1a] border border-[#00f0ff]/25 flex items-center justify-between text-xs">
            <div>
              <div className="text-[#00b4d8] text-[11px] font-mono">संपर्क (Contact):</div>
              <div className="text-white text-base font-bold font-sans">
                {action.payload?.contact_name || action.payload?.phone_number || 'Direct Call'}
              </div>
            </div>
            <Phone className="w-8 h-8 text-[#00ff88] animate-bounce" />
          </div>

          <button
            onClick={() => {
              playConfirm();
              dialPhoneNumber(action.payload?.phone_number || action.payload?.contact_name || '');
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-orbitron font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all"
          >
            <Phone className="w-4 h-4 fill-black" />
            <span>{action.actionButtonText || 'डायलर में कॉल लगाएं (CALL NOW)'}</span>
          </button>
        </div>
      )}

      {/* FLASHLIGHT / TORCH ACTION */}
      {action.type === 'torch' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#000d1a] border border-yellow-500/30 text-xs">
            <div className="flex items-center gap-2 text-yellow-300 font-bold font-mono">
              <Flashlight className="w-5 h-5 text-yellow-300 animate-pulse" />
              <span>{action.subtitle}</span>
            </div>
            <span className="text-[11px] text-[#00ff88]">हार्डवेयर कनेक्टेड</span>
          </div>

          <button
            onClick={handleToggleTorchAction}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-yellow-500 to-amber-400 text-black font-orbitron font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,179,8,0.4)] transition-all"
          >
            <Flashlight className="w-4 h-4 fill-black" />
            <span>टॉर्च स्थिति बदलें (TOGGLE TORCH)</span>
          </button>
        </div>
      )}

      {/* TIMER / COUNTDOWN ACTION */}
      {action.type === 'timer' && (
        <div className="space-y-3 text-center">
          <div className="p-4 rounded-xl bg-[#000d1a] border border-[#00f0ff]/30">
            <div className="text-[10px] text-[#00b4d8] font-mono uppercase tracking-widest mb-1">
              COUNTDOWN TIMER
            </div>
            <div className="text-3xl sm:text-4xl font-orbitron font-extrabold text-white tracking-widest">
              {Math.floor(timerSeconds / 60)
                .toString()
                .padStart(2, '0')}
              :{(timerSeconds % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xs text-[#00ff88] mt-1 font-mono">
              {timerSeconds === 0 ? '⏰ समय समाप्त! (TIME UP)' : timerRunning ? 'टाइमर चल रहा है...' : 'टाइमर रुका हुआ है'}
            </div>
          </div>

          <div className="flex justify-center gap-2">
            <button
              onClick={() => {
                playBeep(1100, 0.04);
                setTimerRunning(!timerRunning);
              }}
              className="px-4 py-2 rounded-xl bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] font-orbitron text-xs flex items-center gap-1.5"
            >
              {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{timerRunning ? 'रोकें (Pause)' : 'शुरू करें (Resume)'}</span>
            </button>
            <button
              onClick={() => {
                playConfirm();
                setTimerSeconds(action.payload?.durationSeconds || 120);
                setTimerRunning(true);
              }}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-[#8ffcff] font-orbitron text-xs flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>रीसेट</span>
            </button>
          </div>
        </div>
      )}

      {/* APP LAUNCH ACTION */}
      {action.type === 'app' && (
        <div className="space-y-3">
          <div className="p-3 rounded-xl bg-[#000d1a] border border-[#00f0ff]/25 text-xs text-white">
            {action.subtitle}
          </div>
          {action.actionUrl && (
            <button
              onClick={() => handleOpenLink(action.actionUrl!)}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-black font-orbitron font-extrabold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>{action.actionButtonText || 'ऐप खोलें (LAUNCH NOW)'}</span>
            </button>
          )}
        </div>
      )}

      {/* SEARCH / WORLD KNOWLEDGE ACTION */}
      {action.type === 'search' && (
        <div className="space-y-2.5">
          <div className="p-3 rounded-xl bg-[#000d1a] border border-[#00f0ff]/25 text-xs text-white leading-relaxed font-sans">
            {action.subtitle}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleOpenLink(`https://www.google.com/search?q=${encodeURIComponent(action.payload?.query || '')}`)}
              className="flex-1 py-2 px-3 rounded-xl bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 border border-[#00f0ff]/40 text-[#00f0ff] font-orbitron text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>गूगल पर देखें (Google Search)</span>
            </button>
            <button
              onClick={() => handleCopy(action.subtitle)}
              className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-[#8ffcff] text-xs font-mono flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'कॉपी' : 'उत्तर कॉपी करें'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
