import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Activity, Radio, Shield, HardDrive, Wifi, Sparkles, Smartphone, Battery } from 'lucide-react';
import { getBatteryTelemetry, BatteryInfo } from '../utils/mobileDevice';

interface SystemTelemetrySidebarProps {
  memoryCount: number;
  sessionSteps: number;
  lastAction?: string;
  onOpenMobile?: () => void;
}

export const SystemTelemetrySidebar: React.FC<SystemTelemetrySidebarProps> = ({
  memoryCount,
  sessionSteps,
  lastAction = 'IDLE',
  onOpenMobile,
}) => {
  const [battery, setBattery] = useState<BatteryInfo>({
    supported: false,
    level: 88,
    charging: false,
    chargingTime: 0,
    dischargingTime: Infinity,
  });

  useEffect(() => {
    getBatteryTelemetry().then(setBattery);
    const interval = setInterval(() => {
      getBatteryTelemetry().then(setBattery);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <aside className="w-64 hidden xl:flex flex-col gap-3 font-mono text-xs select-none">
      {/* Diagnostics Box */}
      <div className="p-3.5 rounded-xl bg-[#02101e]/85 border border-[#00f0ff]/25 backdrop-blur-md shadow-[0_0_20px_rgba(0,180,255,0.1)] space-y-3">
        <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2 text-[#00f0ff] font-orbitron font-bold text-[11px] tracking-wider">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#00ff88] animate-pulse" />
            <span>REACTOR TELEMETRY</span>
          </div>
          <span className="text-[#00ff88] text-[10px]">NOMINAL</span>
        </div>

        {/* Gauges */}
        <div className="space-y-2.5 text-[11px]">
          <div>
            <div className="flex justify-between text-[#00b4d8] mb-1">
              <span>ARC FLUX CAPACITANCE</span>
              <span className="text-white font-bold">99.2%</span>
            </div>
            <div className="h-1.5 w-full bg-[#001f35] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] w-[99.2%] rounded-full shadow-[0_0_8px_#00f0ff]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[#00b4d8] mb-1">
              <span>PLASMA CORE TEMP</span>
              <span className="text-white font-bold">35.4°C</span>
            </div>
            <div className="h-1.5 w-full bg-[#001f35] rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#00ff88] to-[#00f0ff] w-[38%] rounded-full" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-[#00b4d8] mb-1">
              <span>DEVICE BATTERY</span>
              <span className="text-white font-bold">{battery.level}%</span>
            </div>
            <div className="h-1.5 w-full bg-[#001f35] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-[#00ff88] rounded-full"
                style={{ width: `${battery.level}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Neural Stack & Protocol status */}
      <div className="p-3.5 rounded-xl bg-[#02101e]/85 border border-[#00f0ff]/25 backdrop-blur-md shadow-[0_0_20px_rgba(0,180,255,0.1)] space-y-2.5">
        <div className="flex items-center gap-1.5 text-[#00f0ff] font-orbitron font-bold text-[11px] tracking-wider border-b border-[#00f0ff]/20 pb-2">
          <Cpu className="w-3.5 h-3.5" />
          <span>COGNITIVE STATUS</span>
        </div>

        <div className="space-y-1.5 text-[11px] text-[#00b4d8]">
          <div className="flex justify-between">
            <span>Assistant:</span>
            <span className="text-white font-semibold">अंकिता (Ankita)</span>
          </div>
          <div className="flex justify-between">
            <span>Model Core:</span>
            <span className="text-white font-semibold">Gemini Flash AI</span>
          </div>
          <div className="flex justify-between">
            <span>Voice Subsystem:</span>
            <span className="text-white font-semibold">Hindi & Indian Eng.</span>
          </div>
          <div className="flex justify-between">
            <span>World Knowledge:</span>
            <span className="text-[#00ff88] font-bold">100% Comprehensive</span>
          </div>
          <div className="flex justify-between">
            <span>Synaptic Memories:</span>
            <span className="text-[#00ff88] font-bold">{memoryCount} Entries</span>
          </div>
          <div className="flex justify-between">
            <span>Active Session Turns:</span>
            <span className="text-white font-bold">{sessionSteps}</span>
          </div>
        </div>
      </div>

      {/* Mobile Integration Box */}
      <div
        onClick={onOpenMobile}
        className="p-3 rounded-xl bg-[#02101e]/70 border border-[#00ff88]/30 text-[10px] space-y-1.5 cursor-pointer hover:border-[#00ff88] transition-all group"
      >
        <div className="flex items-center justify-between text-[#00ff88]">
          <div className="flex items-center gap-1.5 font-bold">
            <Smartphone className="w-3.5 h-3.5" />
            <span>MOBILE INTEGRATION ACTIVE</span>
          </div>
          <span className="text-[9px] px-1 py-0.5 rounded bg-[#00ff88]/20 group-hover:bg-[#00ff88]/30">
            OPEN
          </span>
        </div>
        <div className="text-[#00b4d8]">
          टॉर्च • बैटरी • जीपीएस • फोन कॉल्स • व्हाट्सएप
        </div>
        <div className="truncate text-[#00ff88] font-mono">LAST: {lastAction}</div>
      </div>
    </aside>
  );
};
