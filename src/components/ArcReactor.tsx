import React, { useEffect, useRef, useState } from 'react';
import { AssistantState } from '../types';
import { playBeep } from '../utils/soundEffects';

interface ArcReactorProps {
  state: AssistantState;
  onClick: () => void;
  audioLevel?: number; // 0 to 1
  size?: number; // e.g. 420
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  state,
  onClick,
  audioLevel = 0,
  size = 420,
}) => {
  const [pulse, setPulse] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic state animations
  useEffect(() => {
    let animationFrameId: number;
    let angle = 0;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      angle += state === 'speaking' ? 0.04 : state === 'listening' ? 0.03 : 0.015;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Draw subtle orbital particle dust
      const particleCount = 24;
      for (let i = 0; i < particleCount; i++) {
        const pAngle = angle * (i % 2 === 0 ? 1 : -1) + (i * Math.PI * 2) / particleCount;
        const radius = 170 + Math.sin(angle * 2 + i) * 12;
        const px = cx + Math.cos(pAngle) * radius;
        const py = cy + Math.sin(pAngle) * radius;
        const alpha = 0.2 + 0.3 * Math.sin(angle * 3 + i);

        ctx.beginPath();
        ctx.arc(px, py, 1.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.fill();
      }

      // Draw radar sweep line if processing or listening
      if (state === 'listening' || state === 'processing') {
        const sweepAngle = angle * 2.5;
        const sweepLen = 145;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(sweepAngle);

        const grad = ctx.createLinearGradient(0, 0, sweepLen, 0);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.8)');
        grad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, sweepLen, -0.25, 0);
        ctx.lineTo(0, 0);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state]);

  // Audio/State pulse scale
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  // Base scale calculation
  const scale = isSpeaking
    ? 1.05 + audioLevel * 0.08
    : isListening
    ? 1.03 + Math.sin(Date.now() / 150) * 0.02
    : isProcessing
    ? 1.02 + Math.sin(Date.now() / 200) * 0.015
    : 1.0;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none group touch-none"
      onClick={() => {
        playBeep(980, 0.05);
        onClick();
      }}
      onContextMenu={(e) => e.preventDefault()}
      title={state === 'listening' ? 'माइक बंद करें और उत्तर पाएं' : 'माइक चालू करें और बोलें'}
      style={{ width: size, height: size }}
    >
      {/* Deep holographic cyan glow halo */}
      <div
        className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none ${
          isSpeaking
            ? 'bg-[radial-gradient(circle,rgba(0,229,255,0.45)_0%,rgba(0,180,255,0.18)_40%,transparent_70%)] filter blur-2xl scale-125'
            : isListening
            ? 'bg-[radial-gradient(circle,rgba(0,255,180,0.4)_0%,rgba(0,210,255,0.18)_40%,transparent_70%)] filter blur-2xl scale-120'
            : isProcessing
            ? 'bg-[radial-gradient(circle,rgba(0,200,255,0.35)_0%,rgba(0,150,255,0.15)_40%,transparent_70%)] filter blur-xl scale-110'
            : 'bg-[radial-gradient(circle,rgba(0,180,255,0.22)_0%,rgba(0,100,255,0.08)_40%,transparent_70%)] filter blur-lg scale-100 group-hover:scale-110'
        }`}
      />

      {/* Canvas for dynamic particles and sweep */}
      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none z-10"
      />

      {/* Main SVG Cybernetic Arc Reactor matching face.png */}
      <div
        className="relative flex items-center justify-center transition-transform duration-300 ease-out z-20"
        style={{ transform: `scale(${scale})` }}
      >
        <svg
          width={size * 0.88}
          height={size * 0.88}
          viewBox="0 0 400 400"
          className="overflow-visible"
        >
          <defs>
            {/* Neon Glow Filters */}
            <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="intense-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Radial Gradient for Arc Reactor Face Core */}
            <radialGradient id="reactor-core-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#001222" />
              <stop offset="50%" stopColor="#001a33" />
              <stop offset="78%" stopColor="#003554" />
              <stop offset="92%" stopColor="#00b4d8" />
              <stop offset="100%" stopColor="#00f0ff" />
            </radialGradient>

            {/* Central Glow Gradient */}
            <radialGradient id="inner-core-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
              <stop offset="40%" stopColor="#0077b6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Outer Ring Tick Marks (Degree calibration) */}
          <g className="animate-[spin_60s_linear_infinite]" style={{ transformOrigin: '200px 200px' }}>
            {Array.from({ length: 48 }).map((_, i) => {
              const deg = i * (360 / 48);
              const isMajor = i % 4 === 0;
              return (
                <line
                  key={i}
                  x1="200"
                  y1={isMajor ? 12 : 18}
                  x2="200"
                  y2={isMajor ? 26 : 24}
                  stroke={isMajor ? '#00f0ff' : '#0077b6'}
                  strokeWidth={isMajor ? 2 : 1}
                  opacity={isMajor ? 0.85 : 0.4}
                  transform={`rotate(${deg} 200 200)`}
                />
              );
            })}
          </g>

          {/* Outer Segmented Rotating HUD Ring */}
          <g
            className={`transition-all ${
              isSpeaking
                ? 'animate-[spin_12s_linear_infinite]'
                : isListening
                ? 'animate-[spin_8s_linear_infinite]'
                : 'animate-[spin_40s_linear_infinite]'
            }`}
            style={{ transformOrigin: '200px 200px' }}
          >
            <circle
              cx="200"
              cy="200"
              r="184"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="1.5"
              strokeDasharray="40 18 12 18"
              opacity="0.6"
              filter="url(#neon-glow)"
            />
          </g>

          {/* Counter-rotating Outer Secondary Ring */}
          <g
            className={`transition-all ${
              isSpeaking
                ? 'animate-[spin_16s_linear_infinite_reverse]'
                : 'animate-[spin_32s_linear_infinite_reverse]'
            }`}
            style={{ transformOrigin: '200px 200px' }}
          >
            <circle
              cx="200"
              cy="200"
              r="174"
              fill="none"
              stroke="#00c8ff"
              strokeWidth="1"
              strokeDasharray="2 10"
              opacity="0.5"
            />
          </g>

          {/* Main Dark Arc Reactor Center Disc (matches face.png) */}
          <circle
            cx="200"
            cy="200"
            r="162"
            fill="url(#reactor-core-bg)"
            stroke="#00f0ff"
            strokeWidth="5"
            filter="url(#neon-glow)"
            className="transition-all duration-300"
          />

          {/* Inner Cyan Glowing Rim Rings (as seen in face.png) */}
          <circle
            cx="200"
            cy="200"
            r="156"
            fill="none"
            stroke="#64e9ff"
            strokeWidth="3.5"
            opacity="0.95"
            filter="url(#intense-glow)"
          />

          <circle
            cx="200"
            cy="200"
            r="147"
            fill="none"
            stroke="#00d4ff"
            strokeWidth="2.5"
            opacity="0.8"
          />

          <circle
            cx="200"
            cy="200"
            r="135"
            fill="none"
            stroke="#0099cc"
            strokeWidth="1.5"
            opacity="0.65"
          />

          <circle
            cx="200"
            cy="200"
            r="120"
            fill="none"
            stroke="#0077b6"
            strokeWidth="1"
            opacity="0.5"
          />

          <circle
            cx="200"
            cy="200"
            r="105"
            fill="none"
            stroke="#005f73"
            strokeWidth="1"
            opacity="0.4"
          />

          <circle
            cx="200"
            cy="200"
            r="90"
            fill="none"
            stroke="#003554"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* Core Ambient Glow */}
          <circle
            cx="200"
            cy="200"
            r="95"
            fill="url(#inner-core-glow)"
          />

          {/* 4 Cybernetic Corner Brackets within circle */}
          <g opacity="0.6">
            {/* Top-Left */}
            <path d="M 120 120 L 132 120 M 120 120 L 120 132" stroke="#00f0ff" strokeWidth="2" fill="none" />
            {/* Top-Right */}
            <path d="M 280 120 L 268 120 M 280 120 L 280 132" stroke="#00f0ff" strokeWidth="2" fill="none" />
            {/* Bottom-Left */}
            <path d="M 120 280 L 132 280 M 120 280 L 120 268" stroke="#00f0ff" strokeWidth="2" fill="none" />
            {/* Bottom-Right */}
            <path d="M 280 280 L 268 280 M 280 280 L 280 268" stroke="#00f0ff" strokeWidth="2" fill="none" />
          </g>

          {/* Iconic J.A.R.V.I.S Center Branding Text */}
          <text
            x="200"
            y="209"
            textAnchor="middle"
            fill="#00f5ff"
            fontFamily="'Orbitron', 'Rajdhani', sans-serif"
            fontWeight="800"
            fontSize="32"
            letterSpacing="6px"
            filter="url(#neon-glow)"
            className="tracking-widest select-none"
          >
            ANKITA
          </text>

          {/* Subtext below branding: Status / Ankita AI */}
          <text
            x="200"
            y="238"
            textAnchor="middle"
            fill="#00ff88"
            fontFamily="'Noto Sans Devanagari', 'Share Tech Mono', sans-serif"
            fontSize="11"
            fontWeight="600"
            letterSpacing="2px"
            opacity="0.9"
          >
            {state === 'speaking'
              ? 'बोल रही हूँ // SPEAKING'
              : state === 'listening'
              ? 'सुन रही हूँ... // LISTENING'
              : state === 'processing'
              ? 'सोच रही हूँ... // THINKING'
              : 'अंकिता AI // सहायिका'}
          </text>

          {/* Upper small HUD indicator */}
          <text
            x="200"
            y="166"
            textAnchor="middle"
            fill="#0077b6"
            fontFamily="'Share Tech Mono', monospace"
            fontSize="9"
            letterSpacing="2px"
            opacity="0.75"
          >
            ARC REACTOR 98.4%
          </text>

          {/* Audio Wave reactive bars radiating from center when speaking or listening */}
          {(isSpeaking || isListening) && (
            <g opacity="0.85">
              {Array.from({ length: 16 }).map((_, i) => {
                const barAngle = (i * 360) / 16;
                const waveHeight = isSpeaking
                  ? 8 + Math.sin(Date.now() / 80 + i) * 12
                  : 4 + Math.sin(Date.now() / 120 + i) * 6;

                return (
                  <line
                    key={i}
                    x1="200"
                    y1={148}
                    x2="200"
                    y2={148 - waveHeight}
                    stroke="#00f0ff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    transform={`rotate(${barAngle} 200 200)`}
                    filter="url(#neon-glow)"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* State badge floating under the reactor */}
      <div
        className={`absolute -bottom-8 flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all text-[11px] font-mono tracking-wider shadow-lg ${
          state === 'listening'
            ? 'bg-[#003b2f]/95 border-[#00ff88] text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.5)] animate-pulse'
            : 'bg-[#001424]/90 border-[#00f0ff]/30 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.2)]'
        }`}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            state === 'listening'
              ? 'bg-[#00ff88] animate-ping'
              : state === 'speaking'
              ? 'bg-[#00f0ff] animate-pulse'
              : state === 'processing'
              ? 'bg-[#ffaa00] animate-spin'
              : 'bg-[#00b4d8]'
          }`}
        />
        <span className="font-semibold">
          {state === 'speaking'
            ? 'बोल रही हूँ [रोकने के लिए क्लिक करें]'
            : state === 'listening'
            ? '🎙️ सुन रही हूँ... [क्लिक कर रोकें व उत्तर पाएं]'
            : state === 'processing'
            ? 'सोच रही हूँ...'
            : 'तैयार [माइक पर क्लिक करें और बोलें]'}
        </span>
      </div>
    </div>
  );
};
