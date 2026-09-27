import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calculator,
  FileText,
  Camera,
  Terminal,
  ExternalLink,
  MessageSquare,
  Youtube,
  Globe,
  Github,
  Radio,
  Cpu,
  RefreshCw,
  Layers,
  Save,
  Trash2
} from 'lucide-react';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface AppLauncherModalProps {
  initialApp?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AppLauncherModal: React.FC<AppLauncherModalProps> = ({
  initialApp = 'Calculator',
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<string>('Calculator');

  // Calculator state
  const [calcDisplay, setCalcDisplay] = useState('0');
  const [calcPrev, setCalcPrev] = useState('');
  const [calcOp, setCalcOp] = useState('');

  // Scratchpad / Notes state
  const [notes, setNotes] = useState<string>(() => {
    return localStorage.getItem('jarvis_mission_notes') ||
      'MARK X MISSION LOG:\n- Recalibrate Arc Reactor flux density\n- Optimize telemetry relay\n- Awaiting directives from Sir...';
  });
  const [noteSaved, setNoteSaved] = useState(false);

  // Camera / Vision HUD state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    if (initialApp) {
      if (initialApp.toLowerCase().includes('calc')) setActiveTab('Calculator');
      else if (initialApp.toLowerCase().includes('note')) setActiveTab('Notes');
      else if (initialApp.toLowerCase().includes('cam') || initialApp.toLowerCase().includes('vision')) setActiveTab('Camera HUD');
      else if (initialApp.toLowerCase().includes('terminal')) setActiveTab('Terminal');
      else setActiveTab('All Apps');
    }
  }, [initialApp, isOpen]);

  // Clean up camera stream
  useEffect(() => {
    if (activeTab !== 'Camera HUD' && cameraActive) {
      stopCamera();
    }
  }, [activeTab]);

  const startCamera = async () => {
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
        playConfirm();
      }
    } catch (err: any) {
      setCameraError('Camera access denied or unavailable on device.');
      playAlert();
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Calculator helpers
  const handleCalcNumber = (num: string) => {
    playBeep(900 + parseInt(num || '0') * 50, 0.03);
    setCalcDisplay((prev) => (prev === '0' ? num : prev + num));
  };

  const handleCalcOp = (op: string) => {
    playBeep(1200, 0.04);
    setCalcPrev(calcDisplay);
    setCalcOp(op);
    setCalcDisplay('0');
  };

  const handleCalcEquals = () => {
    playConfirm();
    try {
      const p = parseFloat(calcPrev);
      const c = parseFloat(calcDisplay);
      let res = 0;
      if (calcOp === '+') res = p + c;
      else if (calcOp === '-') res = p - c;
      else if (calcOp === '×') res = p * c;
      else if (calcOp === '÷') res = c !== 0 ? p / c : NaN;
      else res = c;

      setCalcDisplay(String(res));
      setCalcPrev('');
      setCalcOp('');
    } catch {
      setCalcDisplay('ERR');
    }
  };

  const handleCalcClear = () => {
    playBeep(600, 0.04);
    setCalcDisplay('0');
    setCalcPrev('');
    setCalcOp('');
  };

  // Notes save
  const handleSaveNotes = () => {
    localStorage.setItem('jarvis_mission_notes', notes);
    setNoteSaved(true);
    playConfirm();
    setTimeout(() => setNoteSaved(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#020d1a] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#002b4d] to-[#011424] border-b border-[#00f0ff]/30">
          <div className="flex items-center gap-2.5 text-[#00f0ff]">
            <Layers className="w-5 h-5 animate-pulse" />
            <span className="font-orbitron font-bold tracking-wider text-sm">
              SUB_SYSTEM_CONTROLLER // APPS
            </span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              playBeep(700, 0.04);
              onClose();
            }}
            className="text-[#00b4d8] hover:text-[#00f0ff] p-1 rounded-lg hover:bg-[#00f0ff]/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#00f0ff]/20 bg-[#001424] text-xs font-orbitron overflow-x-auto">
          {[
            { id: 'Calculator', label: 'CALCULATOR', icon: Calculator },
            { id: 'Notes', label: 'MISSION NOTES', icon: FileText },
            { id: 'Camera HUD', label: 'VISION HUD', icon: Camera },
            { id: 'All Apps', label: 'APP DIRECTORY', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playBeep(1100, 0.03);
                  setActiveTab(tab.id);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 whitespace-nowrap transition-all border-b-2 ${
                  active
                    ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10 shadow-[inset_0_-2px_6px_rgba(0,240,255,0.3)]'
                    : 'border-transparent text-[#00b4d8]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto font-rajdhani text-[#8ffcff] flex-1">
          {/* CALCULATOR SUB-APP */}
          {activeTab === 'Calculator' && (
            <div className="max-w-xs mx-auto p-5 rounded-2xl bg-[#001424] border border-[#00f0ff]/40 shadow-inner space-y-4">
              {/* Display */}
              <div className="p-4 rounded-xl bg-[#000d1a] border border-[#00f0ff]/30 text-right">
                <div className="text-xs font-mono text-[#00b4d8] h-4">
                  {calcPrev} {calcOp}
                </div>
                <div className="text-3xl font-orbitron font-extrabold text-[#00f0ff] tracking-wider truncate">
                  {calcDisplay}
                </div>
              </div>

              {/* Keypad */}
              <div className="grid grid-cols-4 gap-2 font-orbitron text-sm">
                <button
                  onClick={handleCalcClear}
                  className="col-span-2 py-3 rounded-xl bg-red-500/20 border border-red-500/40 text-red-300 hover:bg-red-500/30 transition-all font-bold"
                >
                  CLEAR
                </button>
                <button
                  onClick={() => handleCalcOp('÷')}
                  className="py-3 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25 transition-all font-bold"
                >
                  ÷
                </button>
                <button
                  onClick={() => handleCalcOp('×')}
                  className="py-3 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25 transition-all font-bold"
                >
                  ×
                </button>

                {['7', '8', '9'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleCalcNumber(n)}
                    className="py-3 rounded-xl bg-[#001f35] border border-[#00f0ff]/20 text-white hover:border-[#00f0ff]/50 transition-all font-semibold"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => handleCalcOp('-')}
                  className="py-3 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25 transition-all font-bold"
                >
                  -
                </button>

                {['4', '5', '6'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleCalcNumber(n)}
                    className="py-3 rounded-xl bg-[#001f35] border border-[#00f0ff]/20 text-white hover:border-[#00f0ff]/50 transition-all font-semibold"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={() => handleCalcOp('+')}
                  className="py-3 rounded-xl bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25 transition-all font-bold"
                >
                  +
                </button>

                {['1', '2', '3'].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleCalcNumber(n)}
                    className="py-3 rounded-xl bg-[#001f35] border border-[#00f0ff]/20 text-white hover:border-[#00f0ff]/50 transition-all font-semibold"
                  >
                    {n}
                  </button>
                ))}
                <button
                  onClick={handleCalcEquals}
                  className="row-span-2 py-3 rounded-xl bg-gradient-to-b from-[#00b4d8] to-[#00f0ff] text-[#001222] font-extrabold hover:opacity-95 transition-all flex items-center justify-center text-lg"
                >
                  =
                </button>

                <button
                  onClick={() => handleCalcNumber('0')}
                  className="col-span-2 py-3 rounded-xl bg-[#001f35] border border-[#00f0ff]/20 text-white hover:border-[#00f0ff]/50 transition-all font-semibold"
                >
                  0
                </button>
                <button
                  onClick={() => handleCalcNumber('.')}
                  className="py-3 rounded-xl bg-[#001f35] border border-[#00f0ff]/20 text-white hover:border-[#00f0ff]/50 transition-all font-semibold"
                >
                  .
                </button>
              </div>
            </div>
          )}

          {/* MISSION NOTES SUB-APP */}
          {activeTab === 'Notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#00b4d8]">
                  AUTONOMOUS SCRATCHPAD // LOCAL STORAGE
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNotes('')}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:bg-red-500/10 border border-red-500/30 flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>CLEAR</span>
                  </button>
                  <button
                    onClick={handleSaveNotes}
                    className="px-4 py-1.5 rounded-lg text-xs font-orbitron bg-[#00f0ff]/20 border border-[#00f0ff]/50 text-[#00f0ff] hover:bg-[#00f0ff]/30 flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{noteSaved ? 'SAVED!' : 'SAVE LOG'}</span>
                  </button>
                </div>
              </div>

              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={12}
                placeholder="Log mission notes, intelligence directives, or task logs..."
                className="w-full p-4 rounded-xl bg-[#001020] border border-[#00f0ff]/30 text-cyan-100 font-mono text-xs leading-relaxed focus:border-[#00f0ff] focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50 shadow-inner"
              />
            </div>
          )}

          {/* VISION HUD / CAMERA SUB-APP */}
          {activeTab === 'Camera HUD' && (
            <div className="space-y-4 text-center">
              <div className="relative mx-auto max-w-md aspect-video rounded-2xl overflow-hidden bg-[#000d1a] border border-[#00f0ff]/40 flex items-center justify-center">
                {/* Simulated HUD facial recognition overlay */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? 'block' : 'hidden'}`}
                />

                {!cameraActive && (
                  <div className="space-y-2 p-6 text-center">
                    <Camera className="w-12 h-12 text-[#00f0ff]/40 mx-auto" />
                    <div className="text-xs font-mono text-[#00b4d8]">
                      OPTICAL SENSORS STANDBY
                    </div>
                    {cameraError && (
                      <div className="text-xs text-red-400 font-mono">
                        {cameraError}
                      </div>
                    )}
                  </div>
                )}

                {/* HUD Crosshairs & Target Box */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
                    <div className="flex justify-between text-[10px] font-mono text-[#00f0ff]">
                      <span>TARGET ACQUIRED: SIR</span>
                      <span>RES: 1080P // 60 FPS</span>
                    </div>

                    <div className="self-center w-36 h-36 border-2 border-dashed border-[#00f0ff]/60 rounded-xl relative animate-pulse flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#00ff88]" />
                      <span className="absolute -bottom-5 text-[9px] font-mono text-[#00ff88] bg-[#001424]/90 px-1 rounded">
                        BIO-METRIC: VERIFIED
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] font-mono text-[#00b4d8]">
                      <span>STARK OPTICS v9.2</span>
                      <span>ENCRYPTED STREAM</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-center gap-3">
                {!cameraActive ? (
                  <button
                    onClick={startCamera}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-[#001222] font-orbitron font-bold text-xs tracking-wider hover:opacity-95 transition-all shadow-[0_0_20px_rgba(0,240,255,0.4)] flex items-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>INITIALIZE OPTICAL STREAM</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="px-6 py-2.5 rounded-xl bg-red-500/20 border border-red-500/50 text-red-300 font-orbitron text-xs tracking-wider hover:bg-red-500/30 transition-all flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>TERMINATE OPTICAL STREAM</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ALL APPS & SYSTEM LAUNCHER DIRECTORY */}
          {activeTab === 'All Apps' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { name: 'WhatsApp Web', icon: MessageSquare, url: 'https://web.whatsapp.com', desc: 'संदेश हब (Messaging)' },
                { name: 'Google Search', icon: Globe, url: 'https://www.google.com', desc: 'विश्व ज्ञान (Search)' },
                { name: 'YouTube', icon: Youtube, url: 'https://www.youtube.com', desc: 'वीडियो फीड (Videos)' },
                { name: 'Google Maps', icon: Globe, url: 'https://maps.google.com', desc: 'नक्शा व नेविगेशन (Maps)' },
                { name: 'Calculator', icon: Calculator, action: () => setActiveTab('Calculator'), desc: 'गणक (Calculator)' },
                { name: 'Mission Notes', icon: FileText, action: () => setActiveTab('Notes'), desc: 'नोट्स और कार्यसूची' },
                { name: 'Vision HUD', icon: Camera, action: () => setActiveTab('Camera HUD'), desc: 'कैमरा स्कैनर' },
              ].map((app, idx) => {
                const Icon = app.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      playConfirm();
                      if (app.action) {
                        app.action();
                      } else if (app.url) {
                        const link = document.createElement('a');
                        link.href = app.url;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.click();
                      }
                    }}
                    className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/25 hover:border-[#00f0ff] hover:bg-[#00f0ff]/10 cursor-pointer transition-all space-y-2 group shadow-sm hover:shadow-[0_0_15px_rgba(0,240,255,0.2)]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="p-2 rounded-lg bg-[#00f0ff]/15 text-[#00f0ff] group-hover:scale-110 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-[#00b4d8]/60 group-hover:text-[#00f0ff]" />
                    </div>
                    <div>
                      <div className="font-orbitron font-semibold text-xs text-white group-hover:text-[#00f0ff]">
                        {app.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#00b4d8]/70">
                        {app.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
