import React, { useState, useEffect, useRef } from 'react';
import {
  GripHorizontal,
  Download,
  Flashlight,
  FlashlightOff,
  Landmark,
  Battery,
  Phone,
  MessageSquare,
  Eye,
  Clock,
  Search,
  CloudSun,
  Minimize2,
  Maximize2,
  Move,
  RotateCcw,
  Sparkles,
  Zap
} from 'lucide-react';
import { playBeep, playConfirm } from '../utils/soundEffects';

interface DraggableActionDockProps {
  onSelectCommand: (cmd: string) => void;
  onToggleTorch: (on: boolean) => void;
  onInstallApp: () => void;
  onOpenVision: () => void;
  onOpenWeather: () => void;
  onOpenSearch: () => void;
  isAdmin?: boolean;
}

export const DraggableActionDock: React.FC<DraggableActionDockProps> = ({
  onSelectCommand,
  onToggleTorch,
  onInstallApp,
  onOpenVision,
  onOpenWeather,
  onOpenSearch,
  isAdmin = false,
}) => {
  const dockRef = useRef<HTMLDivElement | null>(null);

  // Default position: lower section of the screen, floating nicely
  const [position, setPosition] = useState<{ x: number; y: number }>(() => {
    try {
      const saved = localStorage.getItem('ankita_dock_pos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {}
    // Initial responsive default
    const initX = Math.max(16, (typeof window !== 'undefined' ? window.innerWidth : 800) / 2 - 260);
    const initY = Math.max(60, (typeof window !== 'undefined' ? window.innerHeight : 600) - 170);
    return { x: initX, y: initY };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: position.x,
    posY: position.y,
  });

  // Clamp within viewport
  const clampPosition = (x: number, y: number) => {
    const dockEl = dockRef.current;
    const width = dockEl?.offsetWidth || 320;
    const height = dockEl?.offsetHeight || 80;
    const maxX = Math.max(0, window.innerWidth - width - 8);
    const maxY = Math.max(0, window.innerHeight - height - 8);
    return {
      x: Math.min(Math.max(8, x), maxX),
      y: Math.min(Math.max(8, y), maxY),
    };
  };

  // Touch Drag Handling (Finger touch on mobile)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    dragStartRef.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      posX: position.x,
      posY: position.y,
    };
    setIsDragging(true);
    playBeep(900, 0.02);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;
    const newPos = clampPosition(dragStartRef.current.posX + dx, dragStartRef.current.posY + dy);
    setPosition(newPos);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      try {
        localStorage.setItem('ankita_dock_pos', JSON.stringify(position));
      } catch {}
    }
  };

  // Mouse Drag Handling (Desktop click and drag)
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Primary click only
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: position.x,
      posY: position.y,
    };
    setIsDragging(true);
    playBeep(900, 0.02);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - dragStartRef.current.startX;
      const dy = moveEvent.clientY - dragStartRef.current.startY;
      const newPos = clampPosition(dragStartRef.current.posX + dx, dragStartRef.current.posY + dy);
      setPosition(newPos);
    };

    const onMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      try {
        localStorage.setItem('ankita_dock_pos', JSON.stringify(dragStartRef.current.posX));
      } catch {}
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Reset to default position
  const handleResetPos = () => {
    playBeep(1000, 0.03);
    const newPos = {
      x: Math.max(16, window.innerWidth / 2 - 260),
      y: Math.max(60, window.innerHeight - 170),
    };
    setPosition(newPos);
    try {
      localStorage.setItem('ankita_dock_pos', JSON.stringify(newPos));
    } catch {}
  };

  // Keep inside viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={dockRef}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        touchAction: 'none',
      }}
      className={`fixed z-40 transition-shadow select-none ${
        isDragging ? 'cursor-grabbing opacity-90 scale-[1.02]' : 'cursor-default'
      }`}
    >
      {/* MINIMIZED COMPACT FLOATING POD */}
      {isMinimized ? (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          className="flex items-center gap-2 px-3 py-2 rounded-full bg-[#001020]/95 border-2 border-[#00f0ff] shadow-[0_0_25px_rgba(0,240,255,0.45)] backdrop-blur-md cursor-grab active:cursor-grabbing text-xs font-mono text-[#00f0ff]"
        >
          <Move className="w-4 h-4 text-[#00ff88] animate-pulse" />
          <span className="font-bold font-orbitron tracking-wider">ACTION DOCK</span>
          <button
            onClick={() => {
              playConfirm();
              setIsMinimized(false);
            }}
            className="p-1 rounded-full bg-[#002b4d] hover:bg-[#004073] text-white transition-colors"
            title="Expand Control Dock"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        /* EXPANDED FULL DRAGGABLE ACTION POD */
        <div className="w-[94vw] sm:w-[540px] max-w-[560px] rounded-2xl bg-[#001224]/95 border-2 border-[#00f0ff]/70 shadow-[0_0_35px_rgba(0,240,255,0.35)] backdrop-blur-md overflow-hidden text-xs font-mono text-[#8ffcff]">
          {/* DRAGGABLE HEADER RIBBON - Touch & Move with Hand */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            className="px-3 py-1.5 bg-gradient-to-r from-[#001c38] via-[#002f5e] to-[#001c38] border-b border-[#00f0ff]/30 flex items-center justify-between cursor-grab active:cursor-grabbing select-none"
            title="Touch and hold with finger or drag with mouse to move anywhere"
          >
            <div className="flex items-center gap-2">
              <GripHorizontal className="w-4 h-4 text-[#00ff88] animate-pulse" />
              <span className="font-orbitron font-extrabold text-[11px] sm:text-xs text-white tracking-wider flex items-center gap-1.5">
                <span>TOUCH & DRAG DOCK</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40 hidden xs:inline">
                  MOVABLE WITH HAND
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleResetPos}
                className="p-1 rounded hover:bg-white/10 text-[#00b4d8] hover:text-white transition-colors"
                title="Reset Position"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  playBeep(900, 0.02);
                  setIsMinimized(true);
                }}
                className="p-1 rounded hover:bg-white/10 text-[#00b4d8] hover:text-white transition-colors"
                title="Minimize Dock"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ACTION BUTTONS TOOLBOX GRID */}
          <div className="p-2 sm:p-2.5 grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-[220px] overflow-y-auto scrollbar-none">
            {/* 1. INSTALL MOBILE APP (Mobile app ko install karo) */}
            <button
              onClick={() => {
                playConfirm();
                onInstallApp();
              }}
              className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/35 hover:to-teal-500/35 border border-[#00ff88] text-[#00ff88] flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer shadow-[0_0_12px_rgba(0,255,136,0.2)] active:scale-95"
            >
              <Download className="w-4 h-4 text-[#00ff88]" />
              <span className="font-bold text-[10px] leading-tight">Install Mobile App</span>
            </button>

            {/* 2. TORCH ON (Torch on karo) */}
            <button
              onClick={() => {
                playConfirm();
                onToggleTorch(true);
              }}
              className="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/30 border border-amber-400 text-amber-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Flashlight className="w-4 h-4 text-amber-400" />
              <span className="font-bold text-[10px] leading-tight">Torch ON</span>
            </button>

            {/* 3. TORCH OFF (Torch off karo) */}
            <button
              onClick={() => {
                playConfirm();
                onToggleTorch(false);
              }}
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-500/50 text-slate-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <FlashlightOff className="w-4 h-4 text-slate-400" />
              <span className="font-bold text-[10px] leading-tight">Torch OFF</span>
            </button>

            {/* 4. CABINET MINISTERS & PM (Mantri ka naam) */}
            <button
              onClick={() => {
                playBeep(1200, 0.03);
                onSelectCommand('Who are the Prime Minister and key Cabinet Ministers of India? List their names.');
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-[#00f0ff]/40 text-[#00f0ff] flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Landmark className="w-4 h-4 text-[#00f0ff]" />
              <span className="font-bold text-[10px] leading-tight">Ministers & PM</span>
            </button>

            {/* 5. PHONE BATTERY STATUS (Phone ki battery kitna hai) */}
            <button
              onClick={() => {
                playBeep(1200, 0.03);
                onSelectCommand('What is my phone battery percentage and charging status?');
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-emerald-400/40 text-emerald-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="font-bold text-[10px] leading-tight">Battery Level</span>
            </button>

            {/* 6. CALL CONTACT (Call lagao) */}
            <button
              onClick={() => {
                playBeep(1200, 0.03);
                onSelectCommand('Call Dad');
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-cyan-400/40 text-cyan-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Phone className="w-4 h-4 text-cyan-300" />
              <span className="font-bold text-[10px] leading-tight">Call Contact</span>
            </button>

            {/* 7. WHATSAPP MESSAGE */}
            <button
              onClick={() => {
                playBeep(1200, 0.03);
                onSelectCommand('Send WhatsApp message');
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-green-400/40 text-green-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <MessageSquare className="w-4 h-4 text-green-400" />
              <span className="font-bold text-[10px] leading-tight">WhatsApp</span>
            </button>

            {/* 8. VISION / CAMERA OCR */}
            <button
              onClick={() => {
                playConfirm();
                onOpenVision();
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-purple-400/40 text-purple-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Eye className="w-4 h-4 text-purple-400" />
              <span className="font-bold text-[10px] leading-tight">Vision OCR</span>
            </button>

            {/* 9. 2 MINUTE TIMER */}
            <button
              onClick={() => {
                playBeep(1200, 0.03);
                onSelectCommand('Set a 2 minute timer');
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-amber-400/40 text-amber-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span className="font-bold text-[10px] leading-tight">2 Min Timer</span>
            </button>

            {/* 10. GOOGLE SEARCH */}
            <button
              onClick={() => {
                playConfirm();
                onOpenSearch();
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-blue-400/40 text-blue-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Search className="w-4 h-4 text-blue-300" />
              <span className="font-bold text-[10px] leading-tight">Search Web</span>
            </button>

            {/* 11. WEATHER FORECAST */}
            <button
              onClick={() => {
                playConfirm();
                onOpenWeather();
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-sky-400/40 text-sky-300 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <CloudSun className="w-4 h-4 text-sky-300" />
              <span className="font-bold text-[10px] leading-tight">Live Weather</span>
            </button>

            {/* 12. WHO CREATED YOU */}
            <button
              onClick={() => {
                playBeep(1200, 0.03);
                onSelectCommand('Who created you?');
              }}
              className="p-2 rounded-xl bg-[#001f3f] hover:bg-[#002f5e] border border-[#00ff88]/40 text-[#00ff88] flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-[#00ff88]" />
              <span className="font-bold text-[10px] leading-tight">Creator Info</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
