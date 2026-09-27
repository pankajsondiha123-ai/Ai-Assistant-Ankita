import React, { useState, useEffect } from 'react';
import { X, Send, MessageSquare, CheckCircle2, Smartphone, ExternalLink, ShieldCheck } from 'lucide-react';
import { JarvisParameters } from '../types';
import { playConfirm, playBeep, playAlert } from '../utils/soundEffects';

interface SendMessageModalProps {
  parameters: JarvisParameters;
  isOpen: boolean;
  onClose: () => void;
  onSend: (params: JarvisParameters) => void;
}

export const SendMessageModal: React.FC<SendMessageModalProps> = ({
  parameters,
  isOpen,
  onClose,
  onSend,
}) => {
  const [receiver, setReceiver] = useState(parameters.receiver || '');
  const [message, setMessage] = useState(parameters.message_text || '');
  const [platform, setPlatform] = useState(parameters.platform || 'WhatsApp');
  const [transmitting, setTransmitting] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    setReceiver(parameters.receiver || '');
    setMessage(parameters.message_text || '');
    setPlatform(parameters.platform || 'WhatsApp');
    setSentSuccess(false);
  }, [parameters, isOpen]);

  if (!isOpen) return null;

  const handleTransmit = () => {
    if (!receiver.trim() || !message.trim()) {
      playAlert();
      return;
    }

    playBeep(1100, 0.08);
    setTransmitting(true);

    setTimeout(() => {
      setTransmitting(false);
      setSentSuccess(true);
      playConfirm();
      onSend({
        receiver,
        message_text: message,
        platform,
      });

      // If WhatsApp or Telegram, offer direct Web launch
      if (platform.toLowerCase().includes('whatsapp')) {
        const text = encodeURIComponent(message);
        // Clean numeric phone number if provided, else open WhatsApp Web
        const cleanNumber = receiver.replace(/\D/g, '');
        const url = cleanNumber ? `https://wa.me/${cleanNumber}?text=${text}` : `https://web.whatsapp.com/send?text=${text}`;
        window.open(url, '_blank');
      } else if (platform.toLowerCase().includes('telegram')) {
        const text = encodeURIComponent(message);
        window.open(`https://t.me/share/url?url=&text=${text}`, '_blank');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#020d1a] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Holographic Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#002b4d] to-[#011424] border-b border-[#00f0ff]/30">
          <div className="flex items-center gap-2.5 text-[#00f0ff]">
            <MessageSquare className="w-5 h-5 animate-pulse" />
            <span className="font-orbitron font-bold tracking-wider text-sm">
              COMMUNICATION_TRANSMITTER // PROTOCOL
            </span>
          </div>
          <button
            onClick={() => {
              playBeep(700, 0.04);
              onClose();
            }}
            className="text-[#00b4d8] hover:text-[#00f0ff] p-1 rounded-lg hover:bg-[#00f0ff]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 font-rajdhani text-[#8ffcff]">
          {sentSuccess ? (
            <div className="text-center py-6 space-y-3">
              <CheckCircle2 className="w-16 h-16 text-[#00ff88] mx-auto animate-bounce" />
              <h3 className="text-xl font-orbitron font-bold text-[#00ff88] tracking-wider">
                TRANSMISSION DISPATCHED
              </h3>
              <p className="text-sm text-cyan-200">
                Message successfully routed to <span className="font-bold text-white">{receiver}</span> via{' '}
                <span className="font-bold text-[#00f0ff]">{platform}</span>.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-xl bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/60 text-[#00f0ff] font-orbitron text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                >
                  DISMISS INTERFACE
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-mono text-[#00b4d8]">
                <ShieldCheck className="w-4 h-4 text-[#00f0ff]" />
                <span>ENCRYPTED SECURE CHANNEL ESTABLISHED</span>
              </div>

              {/* Platform Selector */}
              <div>
                <label className="block text-xs font-mono tracking-wider text-[#00b4d8] mb-1.5">
                  COMMUNICATION PLATFORM
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['WhatsApp', 'Telegram', 'Email'].map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => {
                        playBeep(1000, 0.03);
                        setPlatform(plat);
                      }}
                      className={`py-2 px-3 rounded-lg border text-xs font-orbitron tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        platform.toLowerCase() === plat.toLowerCase()
                          ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                          : 'bg-[#001424]/60 border-[#00f0ff]/20 text-[#00b4d8]/70 hover:border-[#00f0ff]/40'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      {plat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Input */}
              <div>
                <label className="block text-xs font-mono tracking-wider text-[#00b4d8] mb-1.5">
                  RECIPIENT CONTACT / TARGET
                </label>
                <input
                  type="text"
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  placeholder="e.g. Pepper Potts, Tony Stark, +1234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#001222] border border-[#00f0ff]/30 focus:border-[#00f0ff] text-white font-mono text-sm placeholder:text-[#0077b6]/50 focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50 shadow-inner"
                />
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs font-mono tracking-wider text-[#00b4d8] mb-1.5">
                  TRANSMISSION PAYLOAD (MESSAGE)
                </label>
                <textarea
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter transmission payload, Sir..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#001222] border border-[#00f0ff]/30 focus:border-[#00f0ff] text-white font-mono text-sm placeholder:text-[#0077b6]/50 focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50 shadow-inner resize-none"
                />
              </div>

              {/* Progress Bar during transmit */}
              {transmitting && (
                <div className="space-y-1.5 animate-pulse">
                  <div className="flex justify-between text-[11px] font-mono text-[#00f0ff]">
                    <span>TRANSMITTING VIA QUANTUM RELAY...</span>
                    <span>89%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#001a33] rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-[#00f0ff] to-[#00ff88] w-4/5 animate-pulse rounded-full" />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-mono text-[#00b4d8] hover:text-white hover:bg-white/5 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={transmitting || !receiver.trim() || !message.trim()}
                  onClick={handleTransmit}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-[#001222] font-orbitron font-bold text-xs tracking-wider hover:opacity-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                  <span>TRANSMIT MESSAGE</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
