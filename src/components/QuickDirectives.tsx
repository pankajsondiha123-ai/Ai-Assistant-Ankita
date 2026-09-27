import React from 'react';
import {
  CloudRain,
  MessageSquare,
  Calculator,
  Search,
  HelpCircle,
  VolumeX,
  Smartphone,
  Flashlight,
  Battery,
  MapPin,
  Phone,
  Globe
} from 'lucide-react';
import { playBeep } from '../utils/soundEffects';

interface QuickDirectivesProps {
  onSelect: (command: string) => void;
  onStopSpeaking: () => void;
  isSpeaking: boolean;
}

export const QuickDirectives: React.FC<QuickDirectivesProps> = ({
  onSelect,
  onStopSpeaking,
  isSpeaking,
}) => {
  const directives = [
    { label: 'नमस्ते अंकिता, तुम कौन हो?', icon: HelpCircle, color: 'text-[#00ff88]' },
    { label: 'भारत के प्रधानमंत्री कौन हैं?', icon: Globe, color: 'text-[#00f0ff]' },
    { label: 'फोन की बैटरी कितनी है?', icon: Battery, color: 'text-emerald-400' },
    { label: 'टॉर्च चालू करो', icon: Flashlight, color: 'text-yellow-400' },
    { label: 'दुनिया का सबसे ऊंचा पर्वत कौन सा है?', icon: Globe, color: 'text-[#00f0ff]' },
    { label: 'चांद पर सबसे पहले कौन गया?', icon: Search, color: 'text-cyan-300' },
    { label: 'Papa को कॉल लगाओ', icon: Phone, color: 'text-emerald-300' },
    { label: 'WhatsApp पर संदेश भेजो', icon: MessageSquare, color: 'text-green-400' },
    { label: '2 मिनट का टाइमर लगाओ', icon: HelpCircle, color: 'text-amber-400' },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1 px-1 scrollbar-none select-none text-xs font-mono">
      {isSpeaking && (
        <button
          onClick={() => {
            playBeep(600, 0.05);
            onStopSpeaking();
          }}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-red-500/25 border border-red-500/60 text-red-300 font-orbitron hover:bg-red-500/40 transition-all flex items-center gap-1.5 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]"
        >
          <VolumeX className="w-3.5 h-3.5" />
          <span>आवाज बंद करें (STOP)</span>
        </button>
      )}

      <span className="text-[10px] text-[#0077b6] tracking-wider uppercase shrink-0 font-orbitron flex items-center gap-1">
        <Smartphone className="w-3 h-3 text-[#00ff88]" />
        <span>QUICK DIRECTIVES:</span>
      </span>

      {directives.map((dir, idx) => {
        const Icon = dir.icon;
        return (
          <button
            key={idx}
            onClick={() => {
              playBeep(1200, 0.03);
              onSelect(dir.label);
            }}
            className="shrink-0 px-2.5 py-1.5 rounded-lg bg-[#001424] hover:bg-[#00f0ff]/15 border border-[#00f0ff]/25 hover:border-[#00f0ff]/60 text-[#8ffcff] hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Icon className={`w-3.5 h-3.5 ${dir.color}`} />
            <span className="font-sans text-[11px] sm:text-xs">{dir.label}</span>
          </button>
        );
      })}
    </div>
  );
};
