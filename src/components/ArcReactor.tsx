import React, { useEffect, useRef } from 'react';
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
  size = 440,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Dynamic Jarvis Solar HUD Canvas: Large Radiating Lines, Solar Flares, Lightning Arcs, Shockwaves
  useEffect(() => {
    let animationFrameId: number;
    let angle = 0;
    let pulseStep = 0;
    let activeLightnings: Array<{ points: Array<{ x: number; y: number }>; alpha: number; color: string }> = [];

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Solar flare particle model
    const solarParticles: Array<{
      dist: number;
      angle: number;
      speed: number;
      size: number;
      color: string;
      life: number;
      maxLife: number;
    }> = [];

    for (let i = 0; i < 48; i++) {
      solarParticles.push({
        dist: 90 + Math.random() * 120,
        angle: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 1.8,
        size: 1.2 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? 'rgba(255, 200, 50,' : 'rgba(0, 240, 255,',
        life: Math.random() * 100,
        maxLife: 70 + Math.random() * 60,
      });
    }

    const render = () => {
      const isSpeaking = state === 'speaking';
      const isListening = state === 'listening';
      const isProcessing = state === 'processing';

      const speedMultiplier = isSpeaking ? 2.5 : isListening ? 2.0 : isProcessing ? 2.8 : 1.0;
      angle += 0.015 * speedMultiplier;
      pulseStep++;

      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.clearRect(0, 0, width, height);

      // 1. Expanding Solar / Jarvis Shockwave Rings
      const ringCount = 3;
      ctx.save();
      for (let r = 0; r < ringCount; r++) {
        const ringProgress = ((pulseStep * 1.5 + r * 70) % 210) / 210;
        const ringRadius = 140 + ringProgress * 95;
        const ringAlpha = (1 - ringProgress) * (isSpeaking ? 0.6 : isListening ? 0.5 : 0.25);

        ctx.beginPath();
        ctx.arc(cx, cy, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = r % 2 === 0 ? `rgba(255, 170, 0, ${ringAlpha})` : `rgba(0, 240, 255, ${ringAlpha})`;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = r % 2 === 0 ? '#ff8800' : '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
      ctx.restore();

      // 2. JARVIS Iconic Large Radiating Lines (चारों साइड बड़ी-बड़ी सी लाइन्स)
      // 4 Cardinal Direction Laser Beams extending all the way out
      const cardinalAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
      ctx.save();
      for (const cardA of cardinalAngles) {
        const beamLength = (width / 2) * (0.88 + (isSpeaking ? audioLevel * 0.15 : 0.05));
        const startR = 150;
        const endR = beamLength;

        const x1 = cx + Math.cos(cardA) * startR;
        const y1 = cy + Math.sin(cardA) * startR;
        const x2 = cx + Math.cos(cardA) * endR;
        const y2 = cy + Math.sin(cardA) * endR;

        const beamGrad = ctx.createLinearGradient(x1, y1, x2, y2);
        beamGrad.addColorStop(0, 'rgba(0, 240, 255, 0.9)');
        beamGrad.addColorStop(0.5, 'rgba(255, 200, 50, 0.7)');
        beamGrad.addColorStop(1, 'rgba(0, 240, 255, 0)');

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = beamGrad;
        ctx.lineWidth = isSpeaking ? 3.5 : 2.5;
        ctx.shadowColor = '#00f0ff';
        ctx.shadowBlur = 12;
        ctx.stroke();

        // Cross-tick marks along cardinal beam
        const tickDist = startR + (endR - startR) * 0.65;
        const tx = cx + Math.cos(cardA) * tickDist;
        const ty = cy + Math.sin(cardA) * tickDist;
        const perpA = cardA + Math.PI / 2;
        const tickLen = 7;

        ctx.beginPath();
        ctx.moveTo(tx - Math.cos(perpA) * tickLen, ty - Math.sin(perpA) * tickLen);
        ctx.lineTo(tx + Math.cos(perpA) * tickLen, ty + Math.sin(perpA) * tickLen);
        ctx.strokeStyle = '#ffea00';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();

      // 3. Audio-Reactive 360-Degree Jarvis Radiating Frequency Spikes
      // "jab vah kuchh bolata Hai To uske Charon or kuchh Na kuchh nikalta rahata Hai"
      const totalRays = 36;
      ctx.save();
      for (let i = 0; i < totalRays; i++) {
        const rayAngle = (i * Math.PI * 2) / totalRays + angle * 0.2;
        const isMajor = i % 4 === 0;

        // Dynamic audio-reactive flare height
        let spikeHeight = isSpeaking
          ? 15 + Math.sin(angle * 4 + i * 2) * 14 + audioLevel * 35
          : isListening
          ? 10 + Math.sin(angle * 3 + i) * 10
          : 6 + Math.sin(angle * 2 + i) * 4;

        if (isMajor) spikeHeight *= 1.4;

        const baseR = 158;
        const startX = cx + Math.cos(rayAngle) * baseR;
        const startY = cy + Math.sin(rayAngle) * baseR;
        const endX = cx + Math.cos(rayAngle) * (baseR + spikeHeight);
        const endY = cy + Math.sin(rayAngle) * (baseR + spikeHeight);

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = isMajor ? 'rgba(255, 230, 80, 0.95)' : 'rgba(0, 240, 255, 0.75)';
        ctx.lineWidth = isMajor ? 2.5 : 1.5;
        ctx.shadowColor = isMajor ? '#ffaa00' : '#00f0ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
      }
      ctx.restore();

      // 4. Random Solar Lightning / Electric Sparks (विद्युत धाराएं)
      if (pulseStep % 16 === 0 && (isSpeaking || isListening || Math.random() > 0.6)) {
        const startA = Math.random() * Math.PI * 2;
        const startR = 120 + Math.random() * 20;
        const endR = 185 + Math.random() * 35;
        const segments = 4;
        const points = [{ x: cx + Math.cos(startA) * startR, y: cy + Math.sin(startA) * startR }];

        let curR = startR;
        let curA = startA;
        for (let s = 1; s <= segments; s++) {
          curR += (endR - startR) / segments;
          curA += (Math.random() - 0.5) * 0.4;
          points.push({ x: cx + Math.cos(curA) * curR, y: cy + Math.sin(curA) * curR });
        }
        activeLightnings.push({
          points,
          alpha: 1.0,
          color: Math.random() > 0.5 ? '#ffea00' : '#00f0ff',
        });
      }

      // Draw and decay active lightning arcs
      ctx.save();
      activeLightnings = activeLightnings.filter((l) => l.alpha > 0.05);
      for (const l of activeLightnings) {
        ctx.beginPath();
        ctx.moveTo(l.points[0].x, l.points[0].y);
        for (let i = 1; i < l.points.length; i++) {
          ctx.lineTo(l.points[i].x, l.points[i].y);
        }
        ctx.strokeStyle = l.color;
        ctx.globalAlpha = l.alpha;
        ctx.lineWidth = 2.0;
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 12;
        ctx.stroke();
        l.alpha -= 0.1;
      }
      ctx.restore();

      // 5. Orbiting Solar & Jarvis Dust Particles
      ctx.save();
      for (const p of solarParticles) {
        p.dist += p.speed * (1 + audioLevel * 1.5);
        p.life++;
        if (p.dist > width * 0.46 || p.life > p.maxLife) {
          p.dist = 90 + Math.random() * 25;
          p.angle = Math.random() * Math.PI * 2;
          p.life = 0;
        }

        const px = cx + Math.cos(p.angle) * p.dist;
        const py = cy + Math.sin(p.angle) * p.dist;
        const opacity = (1 - p.dist / (width * 0.46)) * (1 - p.life / p.maxLife);

        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color} ${Math.max(0, opacity)})`;
        ctx.shadowColor = p.color.includes('255, 200') ? '#ffaa00' : '#00f0ff';
        ctx.shadowBlur = 6;
        ctx.fill();
      }
      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [state, audioLevel]);

  // Audio/State pulse scale
  const isSpeaking = state === 'speaking';
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';

  const scale = isSpeaking
    ? 1.05 + audioLevel * 0.08
    : isListening
    ? 1.03 + Math.sin(Date.now() / 140) * 0.02
    : isProcessing
    ? 1.02 + Math.sin(Date.now() / 180) * 0.015
    : 1.0;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer select-none group touch-none"
      onClick={() => {
        playBeep(980, 0.05);
        onClick();
      }}
      onContextMenu={(e) => e.preventDefault()}
      title={state === 'listening' ? 'Click to stop microphone & process' : 'Click to activate microphone & speak'}
      style={{ width: size, height: size }}
    >
      {/* 1. Subtle Radial Ambient Halo (Keeps original website color tone intact) */}
      <div
        className={`absolute inset-[-10%] rounded-full transition-all duration-700 pointer-events-none filter blur-2xl opacity-60 ${
          isSpeaking
            ? 'bg-[radial-gradient(circle,rgba(255,160,0,0.4)_0%,rgba(0,240,255,0.25)_45%,transparent_75%)] scale-120'
            : isListening
            ? 'bg-[radial-gradient(circle,rgba(0,255,180,0.35)_0%,rgba(255,180,0,0.2)_45%,transparent_75%)] scale-115'
            : 'bg-[radial-gradient(circle,rgba(255,140,0,0.25)_0%,rgba(0,200,255,0.15)_45%,transparent_75%)] scale-105'
        }`}
      />

      {/* 2. Interactive Canvas for Jarvis Beams, Solar Rays & Discharges */}
      <canvas
        ref={canvasRef}
        width={size * 1.2}
        height={size * 1.2}
        className="absolute inset-[-10%] pointer-events-none z-10"
      />

      {/* 3. Main SVG: The Living Sun + Jarvis Arc Reactor with Ultra-Legible ANKITA Name */}
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
            {/* Blazing Solar Glow Filters */}
            <filter id="solar-flare-filter" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="neon-cyan-filter" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Sun Solar Plasma Radial Gradient */}
            <radialGradient id="sun-plasma-sphere" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff8e7" />
              <stop offset="25%" stopColor="#ffea00" />
              <stop offset="55%" stopColor="#ff7700" />
              <stop offset="82%" stopColor="#d90429" />
              <stop offset="98%" stopColor="#660011" />
              <stop offset="100%" stopColor="#1a0005" />
            </radialGradient>

            {/* Center High-Contrast Shield for ANKITA text */}
            <radialGradient id="ankita-shield-bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#010a17" stopOpacity="0.96" />
              <stop offset="65%" stopColor="#02142b" stopOpacity="0.92" />
              <stop offset="90%" stopColor="#03254c" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#00b4d8" stopOpacity="0.4" />
            </radialGradient>

            {/* Solar Flare Corona Arc Gradient */}
            <linearGradient id="solar-flare-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffea00" />
              <stop offset="50%" stopColor="#ff6600" />
              <stop offset="100%" stopColor="#00f0ff" />
            </linearGradient>
          </defs>

          {/* 360-Degree Radiating Jarvis Solar Spikes (सूरज की किरणें व बड़ी लाइन्स) */}
          <g className="animate-[spin_40s_linear_infinite]" style={{ transformOrigin: '200px 200px' }}>
            {Array.from({ length: 32 }).map((_, i) => {
              const deg = i * (360 / 32);
              const isMajor = i % 4 === 0;
              const rayLen = isMajor ? 28 : 16;
              return (
                <line
                  key={`sunray-${i}`}
                  x1="200"
                  y1={200 - 165}
                  x2="200"
                  y2={200 - 165 - rayLen}
                  stroke={isMajor ? '#ffea00' : '#ff7700'}
                  strokeWidth={isMajor ? 2.5 : 1.5}
                  strokeLinecap="round"
                  opacity={isMajor ? 0.95 : 0.65}
                  transform={`rotate(${deg} 200 200)`}
                  filter="url(#solar-flare-filter)"
                />
              );
            })}
          </g>

          {/* Outer Segmented Rotating Jarvis Ring */}
          <g
            className={`transition-all ${
              isSpeaking
                ? 'animate-[spin_10s_linear_infinite]'
                : isListening
                ? 'animate-[spin_7s_linear_infinite]'
                : 'animate-[spin_32s_linear_infinite]'
            }`}
            style={{ transformOrigin: '200px 200px' }}
          >
            <circle
              cx="200"
              cy="200"
              r="184"
              fill="none"
              stroke="#00f0ff"
              strokeWidth="2"
              strokeDasharray="45 16 12 16"
              opacity="0.8"
              filter="url(#neon-cyan-filter)"
            />
          </g>

          {/* Counter-Rotating Solar Corona Ring */}
          <g
            className={`transition-all ${
              isSpeaking
                ? 'animate-[spin_12s_linear_infinite_reverse]'
                : 'animate-[spin_24s_linear_infinite_reverse]'
            }`}
            style={{ transformOrigin: '200px 200px' }}
          >
            <circle
              cx="200"
              cy="200"
              r="172"
              fill="none"
              stroke="#ffaa00"
              strokeWidth="1.8"
              strokeDasharray="6 14"
              opacity="0.85"
              filter="url(#solar-flare-filter)"
            />
          </g>

          {/* Core Solar Sun Disc (जीवंत सूरज का गोलक) */}
          <circle
            cx="200"
            cy="200"
            r="160"
            fill="url(#sun-plasma-sphere)"
            stroke="#ffea00"
            strokeWidth="4"
            filter="url(#solar-flare-filter)"
            className="transition-all duration-300"
          />

          {/* Inner Flaming Corona Rings */}
          <circle
            cx="200"
            cy="200"
            r="148"
            fill="none"
            stroke="#fff275"
            strokeWidth="3"
            opacity="0.9"
          />

          <circle
            cx="200"
            cy="200"
            r="134"
            fill="none"
            stroke="#ff7700"
            strokeWidth="2"
            opacity="0.8"
          />

          <circle
            cx="200"
            cy="200"
            r="118"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.5"
            opacity="0.7"
          />

          {/* High-Contrast Solar Obsidian Shield behind "ANKITA" for crystal-clear readability */}
          <circle
            cx="200"
            cy="200"
            r="98"
            fill="url(#ankita-shield-bg)"
            stroke="#ffea00"
            strokeWidth="2.5"
            filter="url(#solar-flare-filter)"
          />

          {/* Concentric inner HUD cyan ring around text */}
          <circle
            cx="200"
            cy="200"
            r="88"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.5"
            strokeDasharray="20 8 4 8"
            opacity="0.9"
            className="animate-[spin_20s_linear_infinite]"
            style={{ transformOrigin: '200px 200px' }}
          />

          {/* 4 Corner Jarvis HUD Caliper Brackets */}
          <g opacity="0.9">
            {/* Top-Left */}
            <path d="M 145 145 L 158 145 M 145 145 L 145 158" stroke="#00f0ff" strokeWidth="2.5" fill="none" />
            {/* Top-Right */}
            <path d="M 255 145 L 242 145 M 255 145 L 255 158" stroke="#00f0ff" strokeWidth="2.5" fill="none" />
            {/* Bottom-Left */}
            <path d="M 145 255 L 158 255 M 145 255 L 145 242" stroke="#00f0ff" strokeWidth="2.5" fill="none" />
            {/* Bottom-Right */}
            <path d="M 255 255 L 242 255 M 255 255 L 255 242" stroke="#00f0ff" strokeWidth="2.5" fill="none" />
          </g>

          {/* Top Telemetry Tag: Sun Status */}
          <text
            x="200"
            y="152"
            textAnchor="middle"
            fill="#ffea00"
            fontFamily="'Share Tech Mono', monospace"
            fontSize="10"
            fontWeight="bold"
            letterSpacing="2.5px"
            opacity="0.95"
            filter="drop-shadow(0 0 5px rgba(255,180,0,0.8))"
          >
            SOLAR SUN // 5,778 K
          </text>

          {/* PURE VISIBILITY: "ANKITA" Name - Bold, Crystal-Clear, High-Contrast */}
          {/* Background drop shadow text for maximum clarity */}
          <text
            x="200"
            y="206"
            textAnchor="middle"
            fill="#000000"
            fontFamily="'Orbitron', 'Rajdhani', sans-serif"
            fontWeight="900"
            fontSize="34"
            letterSpacing="6px"
            className="tracking-widest select-none"
            stroke="#000000"
            strokeWidth="5"
          >
            ANKITA
          </text>

          {/* Foreground Radiant Text */}
          <text
            x="200"
            y="206"
            textAnchor="middle"
            fill="#ffffff"
            fontFamily="'Orbitron', 'Rajdhani', sans-serif"
            fontWeight="900"
            fontSize="34"
            letterSpacing="6px"
            filter="url(#neon-cyan-filter)"
            className="tracking-widest select-none"
          >
            ANKITA
          </text>

          {/* Subtext: Live Status / Ankita AI */}
          <text
            x="200"
            y="232"
            textAnchor="middle"
            fill="#00ff88"
            fontFamily="'Orbitron', 'Share Tech Mono', sans-serif"
            fontSize="10"
            fontWeight="700"
            letterSpacing="2px"
            filter="drop-shadow(0 0 4px #00ff88)"
          >
            {state === 'speaking'
              ? 'TRANSMITTING AUDIO'
              : state === 'listening'
              ? 'LISTENING ACTIVE...'
              : state === 'processing'
              ? 'PROCESSING DIRECTIVE'
              : 'ANKITA AI // CORE ACTIVE'}
          </text>

          {/* Audio reactive dynamic wave lines leaping from outer perimeter */}
          {(isSpeaking || isListening) && (
            <g opacity="0.95">
              {Array.from({ length: 24 }).map((_, i) => {
                const barAngle = (i * 360) / 24;
                const waveHeight = isSpeaking
                  ? 12 + Math.sin(Date.now() / 60 + i) * 16 + audioLevel * 18
                  : 6 + Math.sin(Date.now() / 90 + i) * 8;

                return (
                  <line
                    key={`wave-${i}`}
                    x1="200"
                    y1={140}
                    x2="200"
                    y2={140 - waveHeight}
                    stroke={i % 2 === 0 ? '#ffea00' : '#00f0ff'}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    transform={`rotate(${barAngle} 200 200)`}
                    filter="url(#neon-cyan-filter)"
                  />
                );
              })}
            </g>
          )}
        </svg>
      </div>

      {/* Floating State Badge under the Heart */}
      <div
        className={`absolute -bottom-9 flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all text-[11px] font-mono tracking-wider shadow-xl ${
          state === 'listening'
            ? 'bg-[#002b1f]/95 border-[#00ff88] text-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.5)] animate-pulse'
            : state === 'speaking'
            ? 'bg-[#291400]/95 border-[#ffaa00] text-[#ffea00] shadow-[0_0_20px_rgba(255,170,0,0.5)]'
            : 'bg-[#001428]/90 border-[#00f0ff]/40 text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.25)]'
        }`}
      >
        <span
          className={`w-2.5 h-2.5 rounded-full ${
            state === 'listening'
              ? 'bg-[#00ff88] animate-ping'
              : state === 'speaking'
              ? 'bg-[#ffea00] animate-pulse'
              : state === 'processing'
              ? 'bg-[#00f0ff] animate-spin'
              : 'bg-[#00b4d8]'
          }`}
        />
        <span className="font-bold">
          {state === 'speaking'
            ? 'SPEAKING [CLICK TO STOP]'
            : state === 'listening'
            ? '🎙️ LISTENING... [CLICK TO ANSWER]'
            : state === 'processing'
            ? 'PROCESSING...'
            : '☀️ ANKITA JARVIS CORE READY [CLICK TO SPEAK]'}
        </span>
      </div>
    </div>
  );
};
