import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Camera,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  Search,
  Plus,
  Trash2,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  RefreshCw,
  Send,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface FileAndVisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSpeakText?: (text: string) => void;
  initialTab?: 'document' | 'vision' | 'kb';
}

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  date: string;
}

export const FileAndVisionModal: React.FC<FileAndVisionModalProps> = ({
  isOpen,
  onClose,
  onSpeakText,
  initialTab = 'document',
}) => {
  const [activeTab, setActiveTab] = useState<'document' | 'vision' | 'kb'>(initialTab);

  // Document states
  const [docFile, setDocFile] = useState<{ name: string; size: string; content: string } | null>(null);
  const [docQuery, setDocQuery] = useState('');
  const [docAnswer, setDocAnswer] = useState('');
  const [docLoading, setDocLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Vision & OCR states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState('इस फोटो में क्या दिख रहा है? कृपया प्यार से समझाएं और यदि इसमें कोई टेक्स्ट लिखा है (OCR), तो वह भी पढ़कर बताएं।');
  const [visionResult, setVisionResult] = useState('');
  const [visionLoading, setVisionLoading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // Personal Knowledge Base states
  const [kbItems, setKbItems] = useState<KnowledgeItem[]>(() => {
    try {
      const saved = localStorage.getItem('ankita_personal_kb');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: '1',
        title: 'व्यक्तिगत पहचान (Personal Info)',
        content: 'उपयोगकर्ता: पंकज सोनदिहा। ईमेल: pankajsondiha123@gmail.com। मुख्य प्राथमिक कार्य: सॉफ्टवेयर डेवलपमेंट व पर्सनल ऑटोमेशन।',
        category: 'Personal',
        date: new Date().toLocaleDateString(),
      },
      {
        id: '2',
        title: 'आपातकालीन निर्देश (Emergency Guidelines)',
        content: 'आपातकालीन कॉल नंबर: 112। निकटतम अस्पताल व एम्बुलेंस सेवा तुरंत डायल करें।',
        category: 'Emergency',
        date: new Date().toLocaleDateString(),
      },
    ];
  });
  const [newKbTitle, setNewKbTitle] = useState('');
  const [newKbContent, setNewKbContent] = useState('');
  const [newKbCategory, setNewKbCategory] = useState('Personal');
  const [kbSearch, setKbSearch] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Save Knowledge Base
  const handleSaveKbItem = () => {
    if (!newKbTitle.trim() || !newKbContent.trim()) return;
    playConfirm();
    const newItem: KnowledgeItem = {
      id: Math.random().toString(36).substring(2, 9),
      title: newKbTitle.trim(),
      content: newKbContent.trim(),
      category: newKbCategory,
      date: new Date().toLocaleDateString(),
    };
    const updated = [newItem, ...kbItems];
    setKbItems(updated);
    try {
      localStorage.setItem('ankita_personal_kb', JSON.stringify(updated));
    } catch {}
    setNewKbTitle('');
    setNewKbContent('');
  };

  const handleDeleteKbItem = (id: string) => {
    playBeep(700, 0.04);
    const updated = kbItems.filter((i) => i.id !== id);
    setKbItems(updated);
    try {
      localStorage.setItem('ankita_personal_kb', JSON.stringify(updated));
    } catch {}
  };

  // Document Upload Handler (TXT, MD, PDF, JSON, CSV)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playConfirm();
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setDocFile({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        content: text || '',
      });
      setDocAnswer('');
    };
    reader.readAsText(file);
  };

  // Query Document
  const handleAskDocument = async (customPrompt?: string) => {
    if (!docFile?.content) return;
    const q = customPrompt || docQuery || 'इस दस्तावेज़ का मुख्य सारांश और मुख्य बिंदु समझाएं।';
    setDocLoading(true);
    playConfirm();

    try {
      const res = await fetch('/api/ankita/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_text: docFile.content,
          document_name: docFile.name,
          query: q,
          personal_kb: kbItems.map((k) => `[${k.title}]: ${k.content}`).join('\n'),
        }),
      });
      const data = await res.json();
      const ans = data.answer || 'दस्तावेज़ का विश्लेषण नहीं हो सका।';
      setDocAnswer(ans);
      onSpeakText?.(ans);
    } catch (err: any) {
      setDocAnswer('त्रुटि: दस्तावेज़ का विश्लेषण करते समय समस्या आई।');
    } finally {
      setDocLoading(false);
    }
  };

  // Image Upload Handler (PNG, JPG, WebP)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    playConfirm();
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewImage(event.target?.result as string);
      setVisionResult('');
    };
    reader.readAsDataURL(file);
  };

  // Query Vision & OCR
  const handleAnalyzeVision = async () => {
    if (!previewImage) return;
    setVisionLoading(true);
    playConfirm();

    try {
      const res = await fetch('/api/ankita/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: previewImage,
          prompt: visionPrompt,
        }),
      });
      const data = await res.json();
      const ans = data.analysis || 'छवि का विश्लेषण नहीं हो सका।';
      setVisionResult(ans);
      onSpeakText?.(ans);
    } catch (err: any) {
      setVisionResult('त्रुटि: विज़न स्कैनर से संपर्क नहीं हो पाया।');
    } finally {
      setVisionLoading(false);
    }
  };

  const handleCopyText = async (text: string) => {
    playConfirm();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const filteredKb = kbItems.filter(
    (k) =>
      k.title.toLowerCase().includes(kbSearch.toLowerCase()) ||
      k.content.toLowerCase().includes(kbSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn select-none font-sans">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-[#02182b] to-[#010915] border-2 border-[#00f0ff]/50 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#00f0ff]/25 bg-[#011425]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/50">
              <Sparkles className="w-5 h-5 text-[#00ff88]" />
            </div>
            <div>
              <div className="text-white font-bold font-orbitron text-sm sm:text-base flex items-center gap-2">
                <span>AI फाइल, विज़न व नॉलेज हब</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-[#00ff88] border border-[#00ff88]/30 font-mono">
                  MULTIMODAL INTELLIGENCE
                </span>
              </div>
              <div className="text-[11px] text-[#00b4d8] font-mono">
                DOCUMENTS // OCR VISION // PERSONAL KNOWLEDGE BASE
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

        {/* Tab Switcher */}
        <div className="flex border-b border-[#00f0ff]/20 bg-[#001020] text-xs font-orbitron overflow-x-auto">
          {[
            { id: 'document', label: '📄 दस्तावेज़ व फाइल्स (Documents)', icon: FileText },
            { id: 'vision', label: '👁️ फोटो व OCR विज़न (Vision & OCR)', icon: Eye },
            { id: 'kb', label: '🧠 नॉलेज बेस (Personal KB)', icon: BookOpen },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playBeep(1100, 0.03);
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-2 px-4 py-3 whitespace-nowrap transition-all border-b-2 font-bold ${
                  active
                    ? 'border-[#00ff88] text-[#00ff88] bg-[#00ff88]/10'
                    : 'border-transparent text-[#00b4d8]/70 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs font-mono text-[#8ffcff] flex-1">
          {/* TAB 1: DOCUMENTS & FILES */}
          {activeTab === 'document' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-bold text-sm font-orbitron flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-[#00ff88]" />
                      <span>दस्तावेज़ अपलोड करें (PDF, TXT, MD, CSV, JSON)</span>
                    </div>
                    <div className="text-[11px] text-[#00b4d8]">
                      अंकिता पूरे दस्तावेज़ को पढ़कर आपके किसी भी सवाल का सटीक उत्तर देगी।
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".txt,.md,.pdf,.json,.csv"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-orbitron font-extrabold text-xs flex items-center gap-2 hover:opacity-95 shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
                  >
                    <Upload className="w-4 h-4" />
                    <span>फाइल चुनें (Choose File)</span>
                  </button>
                </div>

                {docFile && (
                  <div className="p-3 rounded-lg bg-[#000d1a] border border-[#00ff88]/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-[#00ff88]" />
                      <div>
                        <div className="text-white font-bold">{docFile.name}</div>
                        <div className="text-[10px] text-[#00b4d8]">{docFile.size} • टेक्स्ट लोड हुआ</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAskDocument('इस दस्तावेज़ का 3 मुख्य बिंदुओं में सारांश बताएं।')}
                      disabled={docLoading}
                      className="px-3 py-1.5 rounded-lg bg-[#002f5e] hover:bg-[#004080] text-[#00f0ff] font-orbitron text-xs flex items-center gap-1"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#00ff88]" />
                      <span>सारांश निकालें</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Ask Question Bar */}
              {docFile && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={docQuery}
                      onChange={(e) => setDocQuery(e.target.value)}
                      placeholder="दस्तावेज़ से कोई भी सवाल पूछें (उदा. मुख्य तारीखें, निष्कर्ष, डेटा)..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#001020] border border-[#00f0ff]/30 text-white font-sans text-xs focus:border-[#00f0ff] focus:outline-none"
                    />
                    <button
                      onClick={() => handleAskDocument()}
                      disabled={docLoading || !docQuery.trim()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-black font-orbitron font-bold text-xs flex items-center gap-1.5 hover:opacity-95 disabled:opacity-40 transition-all"
                    >
                      <Send className="w-4 h-4" />
                      <span>पूछें</span>
                    </button>
                  </div>

                  {/* Preset prompt buttons */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {[
                      'इस दस्तावेज़ के 5 मुख्य बिंदु बताएं',
                      'इसमें उल्लिखित महत्वपूर्ण नाम व तिथियां क्या हैं?',
                      'क्या इसमें कोई कार्यसूची या एक्शन आइटम है?',
                    ].map((p, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setDocQuery(p);
                          handleAskDocument(p);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#001f35] hover:bg-[#002f50] border border-[#00f0ff]/20 text-[#00b4d8] hover:text-white transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Answer display */}
              {docLoading && (
                <div className="p-4 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 text-center animate-pulse">
                  <Sparkles className="w-6 h-6 text-[#00ff88] mx-auto animate-spin mb-2" />
                  <span className="text-white font-orbitron text-xs">
                    अंकिता दस्तावेज़ का गहन विश्लेषण कर रही है...
                  </span>
                </div>
              )}

              {docAnswer && (
                <div className="p-4 rounded-xl bg-[#001222] border-2 border-[#00ff88]/40 space-y-2 shadow-[0_0_20px_rgba(0,255,136,0.15)]">
                  <div className="flex items-center justify-between text-[#00ff88] font-orbitron font-bold text-xs border-b border-[#00ff88]/20 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>अंकिता का विश्लेषण (DOCUMENT ANALYSIS)</span>
                    </span>
                    <button
                      onClick={() => handleCopyText(docAnswer)}
                      className="px-2.5 py-1 rounded bg-[#002f50] text-[#00f0ff] hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'कॉपी हुआ' : 'कॉपी'}</span>
                    </button>
                  </div>
                  <div className="text-white text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                    {docAnswer}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: VISION & OCR */}
          {activeTab === 'vision' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-bold text-sm font-orbitron flex items-center gap-1.5">
                      <Eye className="w-4 h-4 text-[#00ff88]" />
                      <span>फोटो, स्क्रीनशॉट या बिल अपलोड करें (Vision & OCR)</span>
                    </div>
                    <div className="text-[11px] text-[#00b4d8]">
                      फोटो में क्या लिखा है (OCR), वस्तुएं, रंग व दृश्य अंकिता तुरंत समझाएगी।
                    </div>
                  </div>

                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-orbitron font-extrabold text-xs flex items-center gap-2 hover:opacity-95 shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>फोटो चुनें (Upload Photo)</span>
                  </button>
                </div>

                {/* Image Preview */}
                {previewImage && (
                  <div className="relative mx-auto max-w-sm rounded-xl overflow-hidden border-2 border-[#00f0ff]/40 bg-black">
                    <img src={previewImage} alt="Uploaded" className="w-full max-h-64 object-contain mx-auto" />
                  </div>
                )}
              </div>

              {previewImage && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={visionPrompt}
                      onChange={(e) => setVisionPrompt(e.target.value)}
                      placeholder="फोटो के बारे में क्या जानना चाहते हैं?..."
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#001020] border border-[#00f0ff]/30 text-white font-sans text-xs focus:border-[#00f0ff] focus:outline-none"
                    />
                    <button
                      onClick={handleAnalyzeVision}
                      disabled={visionLoading}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-black font-orbitron font-bold text-xs flex items-center gap-1.5 hover:opacity-95 disabled:opacity-40 transition-all shrink-0"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>{visionLoading ? 'स्कैन हो रहा है...' : 'विश्लेषण करें'}</span>
                    </button>
                  </div>

                  {/* Preset prompt buttons */}
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    {[
                      'इस फोटो में लिखा सारा टेक्स्ट (OCR) निकालें',
                      'इस फोटो में क्या-क्या चीजें दिख रही हैं?',
                      'यदि यह कोई रसीद या बिल है, तो कुल रकम बताएं',
                    ].map((p, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setVisionPrompt(p);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#001f35] hover:bg-[#002f50] border border-[#00f0ff]/20 text-[#00b4d8] hover:text-white transition-all"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {visionLoading && (
                <div className="p-4 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 text-center animate-pulse">
                  <Eye className="w-6 h-6 text-[#00ff88] mx-auto animate-bounce mb-2" />
                  <span className="text-white font-orbitron text-xs">
                    जेमिनी विजन न्यूरल स्कैनर छवि का विश्लेषण कर रहा है...
                  </span>
                </div>
              )}

              {visionResult && (
                <div className="p-4 rounded-xl bg-[#001222] border-2 border-[#00ff88]/40 space-y-2 shadow-[0_0_20px_rgba(0,255,136,0.15)]">
                  <div className="flex items-center justify-between text-[#00ff88] font-orbitron font-bold text-xs border-b border-[#00ff88]/20 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      <span>अंकिता का विजुअल विवरण (VISION ANALYSIS & OCR)</span>
                    </span>
                    <button
                      onClick={() => handleCopyText(visionResult)}
                      className="px-2.5 py-1 rounded bg-[#002f50] text-[#00f0ff] hover:text-white flex items-center gap-1 text-[10px]"
                    >
                      {copied ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                      <span>{copied ? 'कॉपी हुआ' : 'कॉपी'}</span>
                    </button>
                  </div>
                  <div className="text-white text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-wrap">
                    {visionResult}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PERSONAL KNOWLEDGE BASE */}
          {activeTab === 'kb' && (
            <div className="space-y-4">
              {/* Add New Knowledge Item */}
              <div className="p-4 rounded-xl bg-[#00172e] border border-[#00f0ff]/30 space-y-3">
                <div className="text-white font-bold text-sm font-orbitron flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#00ff88]" />
                  <span>व्यक्तिगत जानकारी जोड़ें (ADD TO KNOWLEDGE BASE)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={newKbTitle}
                    onChange={(e) => setNewKbTitle(e.target.value)}
                    placeholder="शीर्षक (उदा. कार नंबर, पासपोर्ट, निर्देश)..."
                    className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#000d1a] border border-[#00f0ff]/30 text-white font-sans text-xs focus:border-[#00f0ff] focus:outline-none"
                  />
                  <select
                    value={newKbCategory}
                    onChange={(e) => setNewKbCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#000d1a] border border-[#00f0ff]/30 text-[#00b4d8] font-orbitron text-xs focus:outline-none"
                  >
                    <option value="Personal">व्यक्तिगत (Personal)</option>
                    <option value="Work">काम/ऑफिस (Work)</option>
                    <option value="Medical">स्वास्थ्य (Medical)</option>
                    <option value="Emergency">आपातकालीन (Emergency)</option>
                  </select>
                </div>
                <textarea
                  value={newKbContent}
                  onChange={(e) => setNewKbContent(e.target.value)}
                  placeholder="संपूर्ण जानकारी या विवरण लिखें जो अंकिता हमेशा याद रखे..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-[#000d1a] border border-[#00f0ff]/30 text-white font-sans text-xs focus:border-[#00f0ff] focus:outline-none leading-relaxed"
                />
                <button
                  onClick={handleSaveKbItem}
                  disabled={!newKbTitle.trim() || !newKbContent.trim()}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-orbitron font-extrabold text-xs flex items-center gap-1.5 hover:opacity-95 disabled:opacity-40 transition-all shadow-[0_0_15px_rgba(0,255,136,0.3)]"
                >
                  <Plus className="w-4 h-4" />
                  <span>नॉलेज बेस में सहेजें (SAVE KNOWLEDGE)</span>
                </button>
              </div>

              {/* Search Knowledge Base */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[#00b4d8]" />
                  <input
                    type="text"
                    value={kbSearch}
                    onChange={(e) => setKbSearch(e.target.value)}
                    placeholder="नॉलेज बेस में खोजें..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-[#001020] border border-[#00f0ff]/30 text-white font-sans text-xs focus:border-[#00f0ff] focus:outline-none"
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[11px] text-[#00b4d8] font-mono">
                  <span>संचित ज्ञान रिकॉर्ड्स ({filteredKb.length}):</span>
                  <span>AI मस्तिष्क से कनेक्टेड</span>
                </div>

                {filteredKb.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-[#001122] border border-[#00f0ff]/25 hover:border-[#00f0ff]/50 space-y-1.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white font-sans text-sm">{item.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 font-mono">
                          {item.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{item.date}</span>
                        <button
                          onClick={() => handleDeleteKbItem(item.id)}
                          className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-white/80 font-sans text-xs leading-relaxed break-words">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-[#010e1c] border-t border-[#00f0ff]/20 flex items-center justify-between text-xs font-mono select-none">
          <div className="flex items-center gap-1.5 text-[#00ff88]">
            <span className="w-2 h-2 rounded-full bg-[#00ff88] animate-ping" />
            <span>हार्डवेयर व न्यूरल डेटा सुरक्षित</span>
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
