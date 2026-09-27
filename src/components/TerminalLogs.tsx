import React, { useEffect, useRef, useState } from 'react';
import { LogEntry } from '../types';
import {
  Terminal,
  Trash2,
  Copy,
  Check,
  Volume2,
  Search,
  Download,
  MessageSquare,
  Activity,
  ArrowDown,
  Sparkles,
  Sliders,
  Cpu,
  Bot,
  User,
  X
} from 'lucide-react';
import { playBeep, playConfirm } from '../utils/soundEffects';
import { getAgcStatus, AgcStatus } from '../utils/speechRecognition';
import { CodeBlock } from './CodeBlock';

interface TerminalLogsProps {
  logs: LogEntry[];
  onClear: () => void;
  activeTypingText?: string;
  onReplaySpeech?: (text: string) => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const TerminalLogs: React.FC<TerminalLogsProps> = ({
  logs,
  onClear,
  activeTypingText = '',
  onReplaySpeech,
  onClose,
  isMobileDrawer = false,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'telemetry'>('chat');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [agcTelemetry, setAgcTelemetry] = useState<AgcStatus>(getAgcStatus());

  // Poll AGC Telemetry for live display
  useEffect(() => {
    const timer = setInterval(() => {
      setAgcTelemetry(getAgcStatus());
    }, 250);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, activeTypingText, autoScroll, activeTab]);

  const handleCopySingle = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    playBeep(1400, 0.04);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleCopyAll = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] ${l.type.toUpperCase() === 'AI' ? 'ANKITA' : l.type.toUpperCase()}: ${l.text}`)
      .join('\n\n');
    navigator.clipboard.writeText(text);
    setAllCopied(true);
    playBeep(1400, 0.04);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const handleExportChat = () => {
    playConfirm();
    const formatted = logs
      .map((l) => `### [${l.timestamp}] ${l.type === 'ai' ? 'अंकिता (ANKITA AI)' : l.type === 'user' ? 'आप (YOU)' : l.type.toUpperCase()}\n${l.text}`)
      .join('\n\n---\n\n');

    const header = `# अंकिता AI — बातचीत एवं कोड रिकॉर्ड (Conversation Record)\nदिनांक: ${new Date().toLocaleDateString('hi-IN')}\n\n---\n\n`;
    const blob = new Blob([header + formatted], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ankita_AI_Chat_Record_${Date.now()}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Helper to parse message text into normal paragraphs and CodeBlock segments
  const renderMessageContent = (text: string) => {
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const segments: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      // Preceding text before code block
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        segments.push(
          <div key={`txt-${lastIndex}`} className="whitespace-pre-wrap leading-relaxed">
            {textBefore}
          </div>
        );
      }

      // Code block
      const lang = match[1] || 'code';
      const code = match[2];
      segments.push(
        <CodeBlock key={`code-${match.index}`} language={lang} code={code} />
      );

      lastIndex = match.index + match[0].length;
    }

    // Remaining text after last code block
    if (lastIndex < text.length) {
      const remaining = text.substring(lastIndex);
      segments.push(
        <div key={`txt-end`} className="whitespace-pre-wrap leading-relaxed">
          {remaining}
        </div>
      );
    }

    return segments.length > 0 ? segments : <div className="whitespace-pre-wrap">{text}</div>;
  };

  // Filter logs based on search query
  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return log.text.toLowerCase().includes(q) || log.type.toLowerCase().includes(q);
  });

  // Conversation logs only (User & AI)
  const conversationLogs = filteredLogs.filter((l) => l.type === 'user' || l.type === 'ai');

  return (
    <div className="flex flex-col h-full bg-[#020a14]/95 border border-[#00f0ff]/30 rounded-2xl overflow-hidden shadow-[0_0_35px_rgba(0,180,255,0.18)] backdrop-blur-xl">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-[#02182b] to-[#011424] border-b border-[#00f0ff]/25 select-none">
        <div className="flex items-center gap-2 text-[#00f0ff]">
          <MessageSquare className="w-4 h-4 text-[#00ff88] animate-pulse" />
          <span className="font-bold tracking-wider font-orbitron text-xs text-white">
            SIDE CHAT // बातचीत छत व रिकॉर्ड
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00f0ff]/15 text-[#00f0ff] font-mono font-bold border border-[#00f0ff]/30">
            {conversationLogs.length} संदेश
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Export conversation */}
          <button
            onClick={handleExportChat}
            className="p-1.5 rounded-lg bg-[#001f3f] hover:bg-[#00386b] text-[#00f0ff] border border-[#00f0ff]/30 transition-all text-xs"
            title="पूरी बातचीत और कोड फ़ाइल डाउनलोड करें (Export Chat)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Copy all */}
          <button
            onClick={handleCopyAll}
            className="p-1.5 rounded-lg bg-[#001f3f] hover:bg-[#00386b] text-[#00b4d8] hover:text-white border border-[#00f0ff]/30 transition-all text-xs"
            title="पूरी बातचीत कॉपी करें"
          >
            {allCopied ? <Check className="w-3.5 h-3.5 text-[#00ff88]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>

          {/* Clear */}
          <button
            onClick={() => {
              playBeep(600, 0.05);
              onClear();
            }}
            className="p-1.5 rounded-lg hover:bg-red-500/20 text-[#00b4d8] hover:text-red-400 transition-colors"
            title="इतिहास साफ़ करें"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* Close for mobile drawer */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="बंद करें"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabs: Conversation Record vs AGC Telemetry */}
      <div className="flex border-b border-[#00f0ff]/20 bg-[#011222] p-1.5 gap-1.5 text-xs font-mono select-none">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'chat'
              ? 'bg-[#00f0ff]/20 border border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              : 'text-[#00b4d8] hover:bg-white/5 border border-transparent'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 text-[#00ff88]" />
          <span>बातचीत रिकॉर्ड (Chat Record)</span>
        </button>

        <button
          onClick={() => setActiveTab('telemetry')}
          className={`flex-1 py-1.5 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'telemetry'
              ? 'bg-[#00f0ff]/20 border border-[#00f0ff] text-white shadow-[0_0_15px_rgba(0,240,255,0.3)]'
              : 'text-[#00b4d8] hover:bg-white/5 border border-transparent'
          }`}
        >
          <Activity className="w-3.5 h-3.5 text-[#00f0ff]" />
          <span>AGC व टेलीमेट्री (AGC / Logs)</span>
        </button>
      </div>

      {/* Search Input Bar (Chat tab only) */}
      {activeTab === 'chat' && (
        <div className="p-2 border-b border-[#00f0ff]/15 bg-[#010e1c]">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 absolute left-2.5 text-[#0077b6]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="रिकॉर्ड व कोड में खोजें (Search chat & code)..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[#001529] border border-[#00f0ff]/20 focus:border-[#00f0ff] text-xs text-white placeholder:text-[#0077b6] focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 text-xs text-gray-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <div
        ref={containerRef}
        className="flex-1 p-3 overflow-y-auto space-y-3 font-sans text-xs scrollbar-thin scrollbar-thumb-[#00f0ff]/30 scrollbar-track-transparent select-text"
      >
        {activeTab === 'chat' ? (
          <>
            {conversationLogs.length === 0 && !activeTypingText && (
              <div className="text-center py-12 text-[#0077b6] space-y-2 select-none">
                <Bot className="w-10 h-10 mx-auto text-[#00f0ff]/40 animate-pulse" />
                <div className="text-sm font-semibold text-white font-orbitron">
                  बातचीत का रिकॉर्ड यहाँ सुरक्षित रहेगा
                </div>
                <div className="text-xs text-[#00b4d8]/80 max-w-xs mx-auto">
                  आप जो भी बोलेंगे या पूछेंगे, और अंकिता जो भी जवाब व कोड देगी, वह सब इस साइड छत में हमेशा सुरक्षित रहेगा।
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {conversationLogs.map((log) => {
              const isUser = log.type === 'user';
              const hasCode = /```[\s\S]*?```/.test(log.text);

              return (
                <div
                  key={log.id}
                  className={`flex flex-col gap-1.5 p-3 rounded-xl border transition-all ${
                    isUser
                      ? 'bg-gradient-to-br from-[#002b4d]/40 to-[#00172e]/60 border-[#00f0ff]/40 ml-4 shadow-[0_0_15px_rgba(0,240,255,0.08)]'
                      : 'bg-gradient-to-br from-[#001d33]/70 to-[#020b17]/90 border-[#00ff88]/30 mr-2 shadow-[0_0_20px_rgba(0,255,136,0.08)]'
                  }`}
                >
                  {/* Message Top Bar */}
                  <div className="flex items-center justify-between text-[11px] pb-1.5 border-b border-white/5 select-none">
                    <div className="flex items-center gap-1.5">
                      {isUser ? (
                        <>
                          <div className="w-5 h-5 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] flex items-center justify-center text-[#00f0ff]">
                            <User className="w-3 h-3" />
                          </div>
                          <span className="font-bold text-[#00f0ff] font-orbitron">
                            आप (YOU)
                          </span>
                        </>
                      ) : (
                        <>
                          <div className="w-5 h-5 rounded-full bg-[#00ff88]/20 border border-[#00ff88] flex items-center justify-center text-[#00ff88]">
                            <Sparkles className="w-3 h-3" />
                          </div>
                          <span className="font-bold text-[#00ff88] font-orbitron">
                            अंकिता AI
                          </span>
                        </>
                      )}
                      <span className="text-[#0077b6] text-[10px] font-mono">
                        {log.timestamp}
                      </span>
                    </div>

                    {/* Action buttons on message */}
                    <div className="flex items-center gap-1">
                      {!isUser && onReplaySpeech && (
                        <button
                          onClick={() => onReplaySpeech(log.text)}
                          className="p-1 rounded hover:bg-[#00f0ff]/15 text-[#00b4d8] hover:text-[#00ff88] transition-colors"
                          title="इस उत्तर को दोबारा बोलकर सुनें (Listen Voice)"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleCopySingle(log.id, log.text)}
                        className="p-1 rounded hover:bg-[#00f0ff]/15 text-[#00b4d8] hover:text-[#00f0ff] transition-colors"
                        title="पूरा संदेश कॉपी करें"
                      >
                        {copiedId === log.id ? (
                          <Check className="w-3.5 h-3.5 text-[#00ff88]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Message Content with Markdown & CodeBlock support */}
                  <div className="text-[12px] text-[#e0f7fa] leading-relaxed break-words">
                    {renderMessageContent(log.text)}
                  </div>
                </div>
              );
            })}

            {/* Active Streaming / Typing Text */}
            {activeTypingText && (
              <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-gradient-to-br from-[#001d33]/70 to-[#020b17]/90 border border-[#00ff88]/40 mr-2 animate-pulse">
                <div className="flex items-center gap-1.5 text-[11px] pb-1 border-b border-white/5 select-none text-[#00ff88]">
                  <Sparkles className="w-3 h-3 animate-spin" />
                  <span className="font-bold font-orbitron">अंकिता उत्तर तैयार कर रही है...</span>
                </div>
                <div className="text-[12px] text-[#8ffcff] leading-relaxed break-words">
                  {renderMessageContent(activeTypingText)}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Telemetry & AGC Tab */
          <div className="space-y-3 font-mono text-xs text-[#8ffcff]">
            {/* AGC Live Card */}
            <div className="p-3 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 space-y-2 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
              <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-1.5">
                <div className="flex items-center gap-1.5 text-[#00ff88] font-bold font-orbitron">
                  <Sliders className="w-3.5 h-3.5 text-[#00ff88]" />
                  <span>AUTOMATIC GAIN CONTROL (AGC)</span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  agcTelemetry.active ? 'bg-emerald-500/20 text-[#00ff88] border border-[#00ff88]/40 animate-pulse' : 'bg-gray-800 text-gray-400'
                }`}>
                  {agcTelemetry.active ? 'सक्रिय (ACTIVE)' : 'तैयार (STANDBY)'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded bg-[#001122] border border-[#00f0ff]/10">
                  <div className="text-[#0077b6] text-[10px]">Applied Gain:</div>
                  <div className="text-white font-bold font-orbitron text-sm">
                    {agcTelemetry.currentGainDb > 0 ? `+${agcTelemetry.currentGainDb}` : agcTelemetry.currentGainDb} dB
                  </div>
                  <div className="text-[10px] text-[#00ff88]">
                    ({agcTelemetry.gainMultiplier}x Multiplier)
                  </div>
                </div>

                <div className="p-2 rounded bg-[#001122] border border-[#00f0ff]/10">
                  <div className="text-[#0077b6] text-[10px]">Microphone RMS Level:</div>
                  <div className="text-white font-bold font-orbitron text-sm">
                    {agcTelemetry.rmsLevel}
                  </div>
                  <div className="text-[10px] text-[#00b4d8]">
                    Threshold: -24 dB
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-1 text-[11px] text-[#00b4d8]">
                <div className="flex items-center justify-between">
                  <span>85Hz High-Pass Rumble Filter:</span>
                  <span className="text-[#00ff88] font-bold">सक्रिय (85Hz Cutoff)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Dynamic Range Compression:</span>
                  <span className="text-[#00ff88] font-bold">12:1 Ratio Normalizer</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Echo & Noise Suppression:</span>
                  <span className="text-[#00ff88] font-bold">सक्रिय (Hardware On)</span>
                </div>
              </div>
            </div>

            {/* All System Event Logs */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold text-white font-orbitron flex items-center justify-between">
                <span>सिस्टम टेलीमेट्री इवेंट्स ({logs.length}):</span>
              </div>

              <div className="space-y-1 text-[11px] font-mono">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-1.5 rounded bg-[#001122] border border-[#00f0ff]/10 flex items-start gap-2"
                  >
                    <span className="text-[#0077b6] text-[10px] shrink-0 font-mono">
                      [{log.timestamp}]
                    </span>
                    <span className={`px-1 rounded text-[9px] font-bold shrink-0 ${
                      log.type === 'action'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : log.type === 'warning'
                        ? 'bg-red-500/20 text-red-300'
                        : log.type === 'user'
                        ? 'bg-[#00f0ff]/20 text-[#00f0ff]'
                        : 'bg-emerald-500/20 text-[#00ff88]'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                    <span className="text-[#e0f7fa] break-words flex-1">
                      {log.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Status Footer */}
      <div className="px-3.5 py-1.5 bg-[#01101e] border-t border-[#00f0ff]/20 flex items-center justify-between text-[10px] font-mono text-[#0077b6] select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
          <span>ANKITA // AGC & CHAT ENGINE READY</span>
        </div>
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`flex items-center gap-1 hover:text-white transition-colors ${
            autoScroll ? 'text-[#00ff88]' : 'text-gray-500'
          }`}
        >
          <ArrowDown className="w-3 h-3" />
          <span>{autoScroll ? 'ऑटो-स्क्रॉल ऑन' : 'ऑटो-स्क्रॉल बंद'}</span>
        </button>
      </div>
    </div>
  );
};
