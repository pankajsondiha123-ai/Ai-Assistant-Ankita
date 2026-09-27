import React, { useState, useEffect } from 'react';
import { X, CloudRain, Sun, Cloud, Wind, Droplets, Compass, ShieldAlert, RefreshCw } from 'lucide-react';
import { playBeep } from '../utils/soundEffects';

interface WeatherModalProps {
  city: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WeatherModal: React.FC<WeatherModalProps> = ({
  city = 'London',
  isOpen,
  onClose,
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchCity, setSearchCity] = useState(city);

  const fetchWeather = async (targetCity: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(targetCity)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Weather fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSearchCity(city || 'London');
      fetchWeather(city || 'London');
    }
  }, [isOpen, city]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#020d1a] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#002b4d] to-[#011424] border-b border-[#00f0ff]/30">
          <div className="flex items-center gap-2.5 text-[#00f0ff]">
            <CloudRain className="w-5 h-5 animate-pulse" />
            <span className="font-orbitron font-bold tracking-wider text-sm">
              METEOROLOGICAL_RADAR // ATMOSPHERIC INTEL
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

        {/* Body */}
        <div className="p-6 space-y-5 font-rajdhani text-[#8ffcff]">
          {/* City Input Bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchWeather(searchCity)}
              placeholder="Query atmospheric telemetry for city..."
              className="flex-1 px-3.5 py-2 rounded-xl bg-[#001222] border border-[#00f0ff]/30 focus:border-[#00f0ff] text-white font-mono text-sm placeholder:text-[#0077b6]/50 focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50"
            />
            <button
              onClick={() => {
                playBeep(1200, 0.04);
                fetchWeather(searchCity);
              }}
              className="px-4 py-2 rounded-xl bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] font-orbitron text-xs tracking-wider flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>SCAN</span>
            </button>
          </div>

          {loading || !data ? (
            <div className="text-center py-12 text-[#00f0ff] font-mono text-xs animate-pulse">
              CALIBRATING SATELLITE DOPPLER RADAR...
            </div>
          ) : (
            <>
              {/* Main Weather Card */}
              <div className="relative p-5 rounded-xl bg-gradient-to-br from-[#001f3f]/60 to-[#001122]/90 border border-[#00f0ff]/30 flex items-center justify-between overflow-hidden shadow-inner">
                {/* Background radar concentric sweep rings */}
                <div className="absolute -right-8 -top-8 w-40 h-40 border border-[#00f0ff]/10 rounded-full animate-ping pointer-events-none" />
                <div className="absolute -right-16 -top-16 w-56 h-56 border border-[#00f0ff]/10 rounded-full pointer-events-none" />

                <div>
                  <div className="text-xs font-mono tracking-widest text-[#00b4d8] uppercase">
                    ORBITAL TELEMETRY // {data.city}
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-5xl font-orbitron font-extrabold text-white">
                      {data.temperatureC}°C
                    </span>
                    <span className="text-lg font-mono text-[#00b4d8]">
                      / {data.temperatureF}°F
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[#00ff88] mt-1 tracking-wide">
                    {data.condition}
                  </div>
                </div>

                <div className="text-right flex flex-col items-end">
                  <div className="w-16 h-16 rounded-full bg-[#00f0ff]/10 border border-[#00f0ff]/30 flex items-center justify-center text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
                    {data.condition.toLowerCase().includes('rain') ? (
                      <CloudRain className="w-8 h-8 animate-bounce" />
                    ) : data.condition.toLowerCase().includes('cloud') ? (
                      <Cloud className="w-8 h-8 animate-pulse" />
                    ) : (
                      <Sun className="w-8 h-8 animate-[spin_20s_linear_infinite]" />
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-[#00b4d8] mt-2">
                    {data.airQuality}
                  </span>
                </div>
              </div>

              {/* Metric Gauges Grid */}
              <div className="grid grid-cols-3 gap-3 font-mono text-xs">
                <div className="p-3 rounded-xl bg-[#001424] border border-[#00f0ff]/20">
                  <div className="flex items-center gap-1.5 text-[#00b4d8] mb-1">
                    <Droplets className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>HUMIDITY</span>
                  </div>
                  <div className="text-lg font-orbitron font-bold text-white">
                    {data.humidity}%
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#001424] border border-[#00f0ff]/20">
                  <div className="flex items-center gap-1.5 text-[#00b4d8] mb-1">
                    <Wind className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>WIND</span>
                  </div>
                  <div className="text-lg font-orbitron font-bold text-white">
                    {data.windSpeedKmH} km/h
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#001424] border border-[#00f0ff]/20">
                  <div className="flex items-center gap-1.5 text-[#00b4d8] mb-1">
                    <Compass className="w-3.5 h-3.5 text-[#00f0ff]" />
                    <span>UV INDEX</span>
                  </div>
                  <div className="text-lg font-orbitron font-bold text-white">
                    {data.uvIndex} (Low)
                  </div>
                </div>
              </div>

              {/* 4-Day Forecast */}
              <div>
                <div className="text-xs font-mono tracking-wider text-[#00b4d8] mb-2">
                  UPCOMING 4-DAY ATMOSPHERIC TIMELINE
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {data.forecast?.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-[#001020] border border-[#00f0ff]/15 text-center font-mono text-[11px]"
                    >
                      <div className="text-[#00b4d8] font-bold">{item.day}</div>
                      <div className="text-sm font-orbitron font-bold text-white my-1">
                        {item.temp}°C
                      </div>
                      <div className="text-[10px] text-[#00ff88] truncate">{item.condition}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
