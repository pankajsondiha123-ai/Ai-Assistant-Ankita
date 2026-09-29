import React, { useState } from 'react';
import {
  User,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  X,
  Crown,
  UserPlus,
  ArrowRight
} from 'lucide-react';
import { AppUser } from '../types';
import { playConfirm, playAlert, playBeep } from '../utils/soundEffects';

interface UserAuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  currentUser: AppUser | null;
  onUserLoginSuccess: (user: AppUser, isOperator?: boolean) => void;
  onUserLogout: () => void;
  onOpenAdminDashboard?: () => void;
  onSpeak?: (text: string) => void;
  isMandatory?: boolean; // When true, cannot close until logged in
}

export const UserAuthModal: React.FC<UserAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserLoginSuccess,
  onUserLogout,
  onOpenAdminDashboard,
  onSpeak,
  isMandatory = false,
}) => {
  // Tabs: 'register' (Step 1) or 'login' (Step 2)
  const [authStep, setAuthStep] = useState<'register' | 'login'>('register');

  // Form Fields (Empty by default, user must enter their own Gmail & Password)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Status & Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen && !isMandatory) return null;

  // Handle Registration (Step 1)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('कृपया Gmail और पासवर्ड दोनों भरें।');
      return;
    }

    if (password !== confirmPassword) {
      playAlert();
      setErrorMsg('पासवर्ड और पासवर्ड पुष्टि एक समान नहीं हैं।');
      return;
    }

    if (password.length < 4) {
      playAlert();
      setErrorMsg('पासवर्ड कम से कम 4 अक्षरों का होना आवश्यक है।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
          name: name.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'पंजीकरण विफल रहा। कृपया पुनः प्रयास करें।');
      }

      playConfirm();
      // Requirement: Register first, then login with the same Gmail and password
      setSuccessNotice(
        `✅ पंजीकरण सफल हुआ! अब कृपया नीचे अपना वही पासवर्ड दर्ज करके 'लॉगिन' करें ताकि वेबसाइट अनलॉक हो सके।`
      );
      onSpeak?.('पंजीकरण सफल हुआ! अब कृपया अपने Gmail और पासवर्ड से लॉगिन करें।');

      // Automatically switch to Step 2 (Login) and keep the registered email filled
      setAuthStep('login');
      setPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      playAlert();
      setErrorMsg(err.message || 'पंजीकरण में त्रुटि आई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Login (Step 2)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      setErrorMsg('कृपया Gmail और पासवर्ड दोनों दर्ज करें।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'लॉगिन विफल। कृपया सही Gmail और पासवर्ड दर्ज करें।');
      }

      playConfirm();
      const user = data.user as AppUser;

      // Strict admin restriction: ONLY bhajanfeel4@gmail.com is authorized as Admin
      const isSpecialAdmin =
        user.email.toLowerCase() === 'bhajanfeel4@gmail.com' && (user.role === 'admin' || data.isOperator);

      onUserLoginSuccess(user, isSpecialAdmin);

      if (isSpecialAdmin) {
        setSuccessNotice('👑 ऑपरेटर पावर सक्रिय! आपको पूर्ण एडमिन अधिकार दिए गए हैं।');
        onSpeak?.('स्वागत है आदित्य! आपको ऑपरेटर पावर और एडमिन पैनल मिल गया है।');
      } else {
        setSuccessNotice(`स्वागत है, ${user.name}! अंकिता AI पूर्णतः अनलॉक है।`);
        onSpeak?.(`नमस्ते ${user.name}! मैं अंकिता हूँ, आपकी सेवा में तैयार हूँ।`);
      }

      setTimeout(() => {
        onClose?.();
      }, 900);
    } catch (err: any) {
      playAlert();
      setErrorMsg(err.message || 'लॉगिन में त्रुटि हुई।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-fadeIn">
      {/* Sleek Cybernetic Cyan Ambient (Restores original website theme) */}
      <div className="relative w-full max-w-lg rounded-2xl bg-[#010815] border border-[#00f0ff]/50 shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col overflow-hidden font-mono text-[#8ffcff]">
        {/* Holographic Top Banner line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00f0ff] to-transparent shadow-[0_0_12px_#00f0ff]" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#00f0ff]/20 bg-[#001428]/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#001f3f] border border-[#00f0ff]/60 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.3)]">
              {currentUser ? (
                <User className="w-5 h-5 text-[#00ff88]" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-[#00f0ff]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-white font-orbitron font-bold text-base tracking-wider">
                  {currentUser
                    ? 'USER PROFILE & STATUS'
                    : isMandatory
                    ? 'ANKITA AI ACCESS GATEWAY'
                    : 'AUTHENTICATION'}
                </h3>
                {isMandatory && !currentUser && (
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 border border-[#00f0ff] text-[#00f0ff] text-[10px] font-bold">
                    पंजीकरण अनिवार्य
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#00b4d8] font-sans">
                {currentUser
                  ? 'सक्रिय खाता व प्रमाणीकरण स्थिति'
                  : 'वेबसाइट का उपयोग करने के लिए पहले रजिस्टर करें, फिर लॉगिन करें।'}
              </p>
            </div>
          </div>

          {/* Close button only visible when user is ALREADY logged in */}
          {currentUser && onClose && (
            <button
              onClick={() => {
                playBeep(1000, 0.02);
                onClose();
              }}
              className="p-1.5 rounded-lg bg-[#001f3f] hover:bg-[#002f5e] border border-[#00f0ff]/30 text-[#00b4d8] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto max-h-[80vh]">
          {currentUser ? (
            /* Logged In View */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#001428] border border-[#00f0ff]/30 space-y-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base ${
                      currentUser.email.toLowerCase() === 'bhajanfeel4@gmail.com'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]'
                        : 'bg-[#001f3f] text-[#00ff88] border border-[#00ff88]/40'
                    }`}
                  >
                    {currentUser.email.toLowerCase() === 'bhajanfeel4@gmail.com' ? (
                      <Crown className="w-6 h-6 text-amber-400" />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm flex items-center gap-1.5">
                      <span>{currentUser.name}</span>
                      {currentUser.email.toLowerCase() === 'bhajanfeel4@gmail.com' && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-400/20 text-amber-300 border border-amber-400 text-[10px] font-bold">
                          👑 SUPER ADMIN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#00b4d8]">{currentUser.email}</div>
                    <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
                      <span>
                        सक्रिय (ONLINE) •{' '}
                        {currentUser.email.toLowerCase() === 'bhajanfeel4@gmail.com'
                          ? 'ADMIN OPERATOR'
                          : 'STANDARD USER'}
                      </span>
                    </div>
                  </div>
                </div>

                {currentUser.email.toLowerCase() === 'bhajanfeel4@gmail.com' ? (
                  <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-400/40 text-amber-300 text-xs font-sans">
                    ⚡ <strong>ऑपरेटर पावर सक्रिय:</strong> आपके पास संपूर्ण सिस्टम सेटिंग्स, पंजीकृत यूजर सूची और लाइव ऑडिट लॉग्स का पूर्ण नियंत्रण है।
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-[#001a33] border border-[#00f0ff]/20 text-[#8ffcff] text-xs font-sans">
                    ✅ <strong>सत्यापित सदस्य:</strong> आप अंकिता AI वॉयस, टेक्स्ट, विज़न OCR और डिवाइसेज का सुरक्षित उपयोग कर रहे हैं।
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2 pt-1">
                {currentUser.email.toLowerCase() === 'bhajanfeel4@gmail.com' && onOpenAdminDashboard && (
                  <button
                    onClick={() => {
                      onClose?.();
                      onOpenAdminDashboard();
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-400 text-black font-orbitron font-extrabold text-xs tracking-wider shadow-[0_0_15px_rgba(251,191,36,0.3)] hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4 text-black" />
                    <span>OPEN ADMIN DASHBOARD</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    playBeep(900, 0.04);
                    onUserLogout();
                  }}
                  className="w-full py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>खाता लॉगआउट करें (LOGOUT)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Mandatory Auth Flow: Step 1 (Register) -> Step 2 (Login) */
            <div className="space-y-4">
              {/* Step Flow Ribbon */}
              <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-[#001428] border border-[#00f0ff]/30">
                <button
                  type="button"
                  onClick={() => {
                    playBeep(1100, 0.02);
                    setAuthStep('register');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-orbitron font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authStep === 'register'
                      ? 'bg-gradient-to-r from-[#00b4d8] to-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.4)] font-extrabold'
                      : 'text-[#00b4d8] hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>1. REGISTER (रजिस्टर)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playBeep(1100, 0.02);
                    setAuthStep('login');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-orbitron font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    authStep === 'login'
                      ? 'bg-gradient-to-r from-[#00b4d8] to-[#00ff88] text-black shadow-[0_0_15px_rgba(0,255,136,0.4)] font-extrabold'
                      : 'text-[#00b4d8] hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>2. LOGIN (लॉगिन)</span>
                </button>
              </div>

              {/* Requirement Hint Banner */}
              <div className="p-3 rounded-xl bg-[#001a33] border border-[#00f0ff]/40 text-[#8ffcff] text-xs font-sans flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#00ff88] shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <strong className="text-white">अनिवार्य प्रक्रिया:</strong> पहले अपना Gmail और पासवर्ड डालकर <strong>रजिस्टर</strong> करें, फिर उसी Gmail से <strong>लॉगिन</strong> करें ताकि आप अंकिता AI का उपयोग कर सकें।
                </div>
              </div>

              {/* Error Alert */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/70 border border-red-500/70 text-red-300 text-xs flex items-center gap-2 font-sans">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Success Alert */}
              {successNotice && (
                <div className="p-3 rounded-xl bg-emerald-950/70 border border-[#00ff88] text-[#00ff88] text-xs flex items-center gap-2 font-sans">
                  <CheckCircle2 className="w-4 h-4 text-[#00ff88] shrink-0" />
                  <span>{successNotice}</span>
                </div>
              )}

              {/* STEP 1: REGISTRATION FORM */}
              {authStep === 'register' && (
                <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[#00b4d8] mb-1 font-sans font-bold">
                      आपका पूरा नाम (Full Name) *:
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Pankaj Kumar"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#000d1a] border border-[#00f0ff]/40 text-white placeholder:text-[#004f6e] focus:border-[#00ff88] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[#00b4d8] mb-1 font-sans font-bold">
                      Gmail / ईमेल (Gmail ID) *:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#000d1a] border border-[#00f0ff]/40 text-white placeholder:text-[#004f6e] focus:border-[#00ff88] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[#00b4d8] mb-1 font-sans font-bold">
                      पासवर्ड बनाएं (Create Password) *:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#000d1a] border border-[#00f0ff]/40 text-white placeholder:text-[#004f6e] focus:border-[#00ff88] focus:outline-none pr-10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00b4d8] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#00b4d8] mb-1 font-sans font-bold">
                      पासवर्ड की पुष्टि (Confirm Password) *:
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#000d1a] border border-[#00f0ff]/40 text-white placeholder:text-[#004f6e] focus:border-[#00ff88] focus:outline-none transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00b4d8] via-[#00f0ff] to-[#00ff88] text-black font-orbitron font-extrabold text-xs tracking-wider shadow-[0_0_20px_rgba(0,255,136,0.35)] hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <ArrowRight className="w-4 h-4 text-black" />
                    )}
                    <span>STEP 1: REGISTER ACCOUNT (पंजीकरण करें)</span>
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        playBeep(1100, 0.02);
                        setAuthStep('login');
                      }}
                      className="text-xs text-[#00b4d8] hover:text-white underline font-sans cursor-pointer"
                    >
                      पहले से पंजीकृत हैं? सीधे लॉगिन करें (Already Registered? Login)
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: LOGIN FORM */}
              {authStep === 'login' && (
                <form onSubmit={handleLogin} className="space-y-3.5 text-xs">
                  <div>
                    <label className="block text-[#00b4d8] mb-1 font-sans font-bold">
                      पंजीकृत Gmail (Registered Gmail ID) *:
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#000d1a] border border-[#00f0ff]/40 text-white placeholder:text-[#004f6e] focus:border-[#00ff88] focus:outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[#00b4d8] mb-1 font-sans font-bold">
                      पासवर्ड (Password) *:
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#000d1a] border border-[#00f0ff]/40 text-white placeholder:text-[#004f6e] focus:border-[#00ff88] focus:outline-none pr-10 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#00b4d8] hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#00b4d8] via-[#00f0ff] to-[#00ff88] text-black font-orbitron font-extrabold text-xs tracking-wider shadow-[0_0_20px_rgba(0,255,136,0.35)] hover:opacity-95 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-black" />
                    )}
                    <span>STEP 2: LOGIN & UNLOCK ANKITA AI (प्रवेश करें)</span>
                  </button>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        playBeep(1100, 0.02);
                        setAuthStep('register');
                      }}
                      className="text-xs text-[#00b4d8] hover:text-white underline font-sans cursor-pointer"
                    >
                      नया खाता बनाना है? यहाँ रजिस्टर करें (Go to Register)
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
