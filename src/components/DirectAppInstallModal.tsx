import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  MessageSquare,
  QrCode,
  Share2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { playConfirm, playBeep } from '../utils/soundEffects';
import { copyToClipboard } from '../utils/mobileDevice';

interface DirectAppInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  deferredPrompt?: any;
  appUrl?: string;
}

export const DirectAppInstallModal: React.FC<DirectAppInstallModalProps> = ({
  isOpen,
  onClose,
  deferredPrompt,
  appUrl = 'https://ais-pre-yoc6z6rqfzxipbxmmqyso7-685472996271.asia-east1.run.app',
}) => {
  const [copied, setCopied] = useState(false);
  const [installing, setInstalling] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : appUrl;
  const targetUrl = appUrl || currentUrl;

  const handleCopyLink = async () => {
    playConfirm();
    await copyToClipboard(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDirectInstall = async () => {
    playBeep(1200, 0.04);
    if (deferredPrompt) {
      setInstalling(true);
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setInstalling(false);
      if (choice.outcome === 'accepted') {
        playConfirm();
        onClose();
      }
    } else {
      handleCopyLink();
      alert('अपने फोन के ब्राउज़र में मेनू (3 बिंदु) पर टैप करके "Add to Home screen" या "Install" चुनें। डायरेक्ट लिंक कॉपी हो गया है!');
    }
  };

  const handleSendToWhatsApp = () => {
    playConfirm();
    const text = encodeURIComponent(`नमस्ते! यह अंकिता AI ऐप का डायरेक्ट लिंक है। इसे अपने फोन के ब्राउज़र में खोलें और "Add to Home screen" दबाएं:\n${targetUrl}`);
    const link = document.createElement('a');
    link.href = `https://wa.me/?text=${text}`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-lg bg-[#020d1a] border-2 border-[#00ff88]/60 rounded-2xl shadow-[0_0_50px_rgba(0,255,136,0.3)] overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#003b2f] to-[#011424] border-b border-[#00ff88]/30">
          <div className="flex items-center gap-2.5 text-[#00ff88]">
            <Download className="w-5 h-5 animate-bounce" />
            <div>
              <span className="font-orbitron font-extrabold tracking-wider text-sm text-white">
                DIRECT MOBILE APP INSTALL // फोन में ऐप इंस्टॉल करें
              </span>
              <div className="text-[10px] text-[#00ff88] font-mono">
                अंकिता AI — होम स्क्रीन पर डायरेक्ट आइकन
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              playBeep(700, 0.04);
              onClose();
            }}
            className="text-[#00ff88] hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 text-xs font-mono text-[#8ffcff] overflow-y-auto">
          {/* Main Hero Card */}
          <div className="p-4 rounded-xl bg-[#001f2f]/80 border border-[#00ff88]/40 space-y-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#003b2f] to-[#00ff88]/30 border border-[#00ff88] mx-auto flex items-center justify-center shadow-[0_0_20px_rgba(0,255,136,0.4)]">
              <Smartphone className="w-8 h-8 text-[#00ff88]" />
            </div>
            <div className="text-base font-orbitron font-bold text-white">
              अंकिता AI को अपने मोबाइल में इंस्टॉल करें
            </div>
            <div className="text-[11px] text-[#8ffcff] max-w-sm mx-auto leading-relaxed">
              इंस्टॉल करने के बाद यह आपके फोन की होम स्क्रीन पर अन्य ऐप्स (WhatsApp, YouTube) की तरह अलग ऐप की तरह खुलेगा!
            </div>
          </div>

          {/* Primary Action: Direct Install Button */}
          <button
            onClick={handleDirectInstall}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-[#00ff88] to-teal-400 text-black font-orbitron font-black text-sm tracking-wider hover:opacity-95 shadow-[0_0_25px_rgba(0,255,136,0.5)] transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5 fill-black" />
            <span>{installing ? 'इंस्टॉल हो रहा है...' : '📲 अभी फोन में ऐप जोड़ें (INSTALL APP)'}</span>
          </button>

          {/* Direct Link Share & Copy */}
          <div className="p-3.5 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-white font-semibold">
              <span>डायरेक्ट ऐप लिंक (DIRECT APP LINK):</span>
              <span className="text-[#00ff88] text-[10px]">PWA READY</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={targetUrl}
                className="flex-1 px-3 py-2 rounded-lg bg-[#000d1a] border border-[#00f0ff]/30 text-[#8ffcff] font-mono text-[11px] focus:outline-none select-all"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/40 text-[#00f0ff] font-orbitron text-xs flex items-center gap-1 transition-all"
                title="Copy Link"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'कॉपी हुआ' : 'कॉपी'}</span>
              </button>
            </div>

            {/* Send to self on WhatsApp button */}
            <button
              onClick={handleSendToWhatsApp}
              className="w-full py-2 px-3 rounded-lg bg-green-600/30 hover:bg-green-600/50 border border-green-500/50 text-green-300 font-orbitron text-xs flex items-center justify-center gap-2 transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5 text-green-400" />
              <span>अपने फोन पर व्हाट्सएप से लिंक भेजें (Share to WhatsApp)</span>
            </button>
          </div>

          {/* 3 Simple Steps on Phone */}
          <div className="p-3.5 rounded-xl bg-[#001424] border border-[#00f0ff]/20 text-[11px] space-y-2 text-[#00b4d8]">
            <div className="text-white font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#00ff88]" />
              <span>फोन पर होम स्क्रीन में जोड़ने के 3 आसान कदम:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1.5 text-cyan-200">
              <li>
                <strong className="text-white">लिंक खोलें:</strong> लिंक को अपने फोन के <strong>Google Chrome</strong> या <strong>Safari</strong> ब्राउज़र में खोलें।
              </li>
              <li>
                <strong className="text-white">मेनू दबाएं:</strong> ऊपर दाईं ओर तीन बिंदुओं <strong>(⋮)</strong> या शेयर आइकन पर टैप करें।
              </li>
              <li>
                <strong className="text-white">होम स्क्रीन पर जोड़ें:</strong> <strong>"Add to Home screen"</strong> या <strong>"Install app"</strong> चुनें। ऐप आपके फोन पर हमेशा के लिए इंस्टॉल हो जाएगी!
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
