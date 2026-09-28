import React, { useState } from 'react';
import { Shield, Lock, Delete } from 'lucide-react';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface PinLockScreenProps {
  onUnlock: () => void;
}

export const PinLockScreen: React.FC<PinLockScreenProps> = ({ onUnlock }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const correctPin = typeof window !== 'undefined'
    ? localStorage.getItem('ankita_security_pin') || '1234'
    : '1234';

  const handleDigit = (digit: string) => {
    if (pin.length >= 4) return;
    playBeep(1200, 0.04);
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      if (newPin === correctPin) {
        playConfirm();
        onUnlock();
      } else {
        playAlert();
        setError(true);
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 1000);
      }
    }
  };

  const handleDelete = () => {
    playBeep(800, 0.04);
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#010915] text-[#8ffcff] font-sans select-none p-4">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,240,255,0.08)_0,transparent_70%)] pointer-events-none" />

      <div className="w-full max-w-xs space-y-6 text-center relative z-10">
        {/* Shield Icon */}
        <div className="w-16 h-16 rounded-2xl bg-[#00172e] border-2 border-[#00f0ff] mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(0,240,255,0.3)] animate-pulse">
          <Lock className="w-8 h-8 text-[#00ff88]" />
        </div>

        <div>
          <h2 className="text-xl font-bold font-orbitron text-white tracking-wider">
            अंकिता AI सुरक्षित है
          </h2>
          <p className="text-xs text-[#00b4d8] font-mono mt-1">
            कृपया अनलॉक करने के लिए 4-अंकीय पिन दर्ज करें
          </p>
        </div>

        {/* Pin Dots */}
        <div className="flex justify-center gap-4 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all ${
                  error
                    ? 'border-red-500 bg-red-500 animate-bounce'
                    : filled
                    ? 'border-[#00ff88] bg-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.8)] scale-110'
                    : 'border-[#00f0ff]/40 bg-[#001222]'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <div className="text-xs text-red-400 font-mono font-bold animate-pulse">
            ❌ गलत पिन! कृपया पुनः प्रयास करें।
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 font-orbitron font-bold text-lg pt-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-[#001424] hover:bg-[#002844] border border-[#00f0ff]/30 hover:border-[#00f0ff] text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-[#001424] hover:bg-[#002844] border border-[#00f0ff]/30 hover:border-[#00f0ff] text-white flex items-center justify-center transition-all active:scale-90 shadow-sm"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-[#001424] hover:bg-red-500/20 border border-[#00f0ff]/30 text-red-400 hover:text-white flex items-center justify-center transition-all active:scale-90"
            title="Delete"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
