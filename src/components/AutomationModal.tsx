import React, { useState } from 'react';
import {
  Zap,
  Sun,
  Moon,
  Briefcase,
  Compass,
  BatteryCharging,
  Play,
  CheckCircle2,
  Clock,
  X,
  Sparkles
} from 'lucide-react';
import { playConfirm, playBeep } from '../utils/soundEffects';

interface AutomationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunRoutine: (routineName: string) => void;
}

export interface RoutineItem {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  actions: string[];
}

export const AutomationModal: React.FC<AutomationModalProps> = ({
  isOpen,
  onClose,
  onRunRoutine,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);

  if (!isOpen) return null;

  const routines: RoutineItem[] = [
    {
      id: 'morning',
      title: '🌅 गुड मॉर्निंग ब्रीफिंग (Morning Briefing)',
      subtitle: 'सुबह की मधुर शुभकामना, आज का मौसम, बैटरी स्थिति व दिन की प्रेरणा।',
      icon: Sun,
      color: 'text-amber-400 bg-amber-500/20 border-amber-500/30',
      actions: ['मौसम रिपोर्ट स्कैन', 'बैटरी व नेटवर्क चेक', 'पॉजिटिव प्रेरणा संदेश', 'वॉइस ब्रीफिंग'],
    },
    {
      id: 'night',
      title: '🌙 नाइट स्लीप रूटीन (Night Routine)',
      subtitle: 'टॉर्च बंद करना, रात का 8 घंटे का अलार्म टाइमर लगाना और शांत मोड।',
      icon: Moon,
      color: 'text-indigo-400 bg-indigo-500/20 border-indigo-500/30',
      actions: ['फ़्लैशलाइट/टॉर्च बंद', '8 घंटे का टाइमर चालू', 'शांत ऑडियो मोड', 'शुभ रात्रि शुभकामना'],
    },
    {
      id: 'work',
      title: '💼 वर्क / मीटिंग फोकस मोड (Focus Mode)',
      subtitle: 'स्क्रीन को हमेशा चालू रखना (WakeLock) और मिशन नोट्स स्क्रैचपैड खोलना।',
      icon: Briefcase,
      color: 'text-[#00f0ff] bg-[#00f0ff]/20 border-[#00f0ff]/30',
      actions: ['स्क्रीन वेकलॉक ऑन', 'मिशन नोट्स ओपन', 'क्लिपबोर्ड रेडी', 'डिस्टर्बेंस फ्री मोड'],
    },
    {
      id: 'travel',
      title: '🚗 ट्रैवल व नेविगेशन मोड (Travel Mode)',
      subtitle: 'लाइव जीपीएस स्थिति, गूगल मैप्स रडार और नज़दीकी स्थान जानकारी।',
      icon: Compass,
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30',
      actions: ['GPS लोकेशन फेच', 'गूगल मैप्स रडार लॉन्च', 'मौसम अलर्ट', 'ट्रैवल असिस्टेंस'],
    },
    {
      id: 'battery_saver',
      title: '🔋 बैटरी सेवर रूटीन (Battery Guard)',
      subtitle: 'बैटरी का स्तर चेक करना और अनावश्यक हार्डवेयर सेंसर को स्टैंडबाय पर रखना।',
      icon: BatteryCharging,
      color: 'text-teal-300 bg-teal-500/20 border-teal-500/30',
      actions: ['बैटरी स्तर व हेल्थ स्कैन', 'कैमरा व टॉर्च ऑफ', 'पावर सेविंग सुझाव'],
    },
  ];

  const handleExecute = (id: string) => {
    playConfirm();
    setRunningId(id);
    onRunRoutine(id);
    setTimeout(() => {
      setRunningId(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-xl bg-gradient-to-b from-[#02182b] to-[#010915] border-2 border-[#00f0ff]/50 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#00f0ff]/25 bg-[#011425]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/50">
              <Zap className="w-5 h-5 text-[#00ff88]" />
            </div>
            <div>
              <div className="text-white font-bold font-orbitron text-sm sm:text-base flex items-center gap-2">
                <span>स्मार्ट ऑटोमेशन व रूटीन हब</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00ff88] border border-[#00ff88]/30 font-mono">
                  ONE-TAP MACROS
                </span>
              </div>
              <div className="text-[11px] text-[#00b4d8] font-mono">
                AUTONOMOUS MULTI-STEP ASSISTANT WORKFLOWS
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 font-sans flex-1">
          <div className="text-xs text-[#8ffcff] font-mono mb-2">
            एक टैप में कई सारे कार्य एक साथ स्वचालित रूप से करवाएं:
          </div>

          {routines.map((routine) => {
            const Icon = routine.icon;
            const isRunning = runningId === routine.id;

            return (
              <div
                key={routine.id}
                className="p-3.5 rounded-xl bg-[#001424] border border-[#00f0ff]/25 hover:border-[#00f0ff]/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl border ${routine.color} shrink-0 mt-0.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-white font-bold font-orbitron text-xs sm:text-sm group-hover:text-[#00f0ff] transition-colors">
                      {routine.title}
                    </div>
                    <p className="text-xs text-[#00b4d8] leading-relaxed">
                      {routine.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {routine.actions.map((act, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded bg-[#000d1a] border border-[#00f0ff]/20 text-cyan-200 font-mono"
                        >
                          • {act}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleExecute(routine.id)}
                  disabled={isRunning}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-orbitron font-extrabold text-xs flex items-center justify-center gap-1.5 hover:opacity-95 shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all shrink-0 active:scale-95 disabled:opacity-50"
                >
                  {isRunning ? (
                    <>
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      <span>चालू हो रहा है...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>रूटीन चलाएं</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-[#010e1c] border-t border-[#00f0ff]/20 flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center gap-1.5 text-[#00ff88]">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span>ऑटोमेशन इंजन सक्रिय</span>
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
