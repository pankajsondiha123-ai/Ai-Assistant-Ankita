import React, { useState } from 'react';
import {
  X,
  Database,
  User,
  Heart,
  Users,
  BrainCircuit,
  Trash2,
  Plus,
  Save,
  Download,
  CheckCircle2,
  Layers
} from 'lucide-react';
import { LongTermMemory, TemporaryMemory } from '../types';
import { playBeep, playConfirm, playAlert } from '../utils/soundEffects';

interface MemoryModalProps {
  longTermMemory: LongTermMemory;
  temporaryMemory: TemporaryMemory;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMemory: (newMem: LongTermMemory) => void;
  onResetMemory: () => void;
}

export const MemoryModal: React.FC<MemoryModalProps> = ({
  longTermMemory,
  temporaryMemory,
  isOpen,
  onClose,
  onUpdateMemory,
  onResetMemory,
}) => {
  const [activeTab, setActiveTab] = useState<'longTerm' | 'temporary'>('longTerm');
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [newCategory, setNewCategory] = useState<'identity' | 'preferences' | 'relationships' | 'emotional_state'>('identity');
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newVal.trim()) return;

    const updated: LongTermMemory = JSON.parse(JSON.stringify(longTermMemory));
    if (!updated[newCategory]) {
      updated[newCategory] = {};
    }

    if (newCategory === 'relationships') {
      updated.relationships[newKey.trim()] = { name: { value: newVal.trim() } };
    } else {
      (updated[newCategory] as any)[newKey.trim()] = { value: newVal.trim(), updated_at: new Date().toISOString() };
    }

    onUpdateMemory(updated);
    setNewKey('');
    setNewVal('');
    playConfirm();
  };

  const handleDeleteEntry = (cat: keyof LongTermMemory, key: string) => {
    const updated: LongTermMemory = JSON.parse(JSON.stringify(longTermMemory));
    if (updated[cat]) {
      delete (updated[cat] as any)[key];
      onUpdateMemory(updated);
      playBeep(700, 0.04);
    }
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(longTermMemory, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'jarvis_memory.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setExportSuccess(true);
    playConfirm();
    setTimeout(() => setExportSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#020d1a] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#002b4d] to-[#011424] border-b border-[#00f0ff]/30">
          <div className="flex items-center gap-2.5 text-[#00f0ff]">
            <BrainCircuit className="w-5 h-5 animate-pulse" />
            <span className="font-orbitron font-bold tracking-wider text-sm">
              NEURAL_SYNAPSE_ARCHIVE // MEMORY MANAGER
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

        {/* Tab switcher */}
        <div className="flex border-b border-[#00f0ff]/20 bg-[#001424] text-xs font-orbitron">
          <button
            onClick={() => {
              playBeep(1100, 0.03);
              setActiveTab('longTerm');
            }}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'longTerm'
                ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10'
                : 'border-transparent text-[#00b4d8]/70 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>LONG-TERM MEMORY (PERSISTENT)</span>
          </button>
          <button
            onClick={() => {
              playBeep(1100, 0.03);
              setActiveTab('temporary');
            }}
            className={`flex-1 py-2.5 px-4 text-center transition-all border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'temporary'
                ? 'border-[#00f0ff] text-[#00f0ff] bg-[#00f0ff]/10'
                : 'border-transparent text-[#00b4d8]/70 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>SESSION RUNTIME (TEMPORARY)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto font-rajdhani text-[#8ffcff] space-y-5 flex-1">
          {activeTab === 'longTerm' ? (
            <>
              {/* Quick actions top bar */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#00b4d8]">
                  MEMORY STACK: MEMORY.JSON ACTIVE
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportJson}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] hover:bg-[#00f0ff]/25 flex items-center gap-1.5 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{exportSuccess ? 'DOWNLOADED!' : 'EXPORT JSON'}</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Sir, are you certain you wish to purge all long-term memory archives?')) {
                        onResetMemory();
                        playAlert();
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono text-red-400 hover:bg-red-500/10 border border-red-500/30 flex items-center gap-1.5 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>PURGE ARCHIVE</span>
                  </button>
                </div>
              </div>

              {/* Memory Categories Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Identity */}
                <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-[#00f0ff]">
                    <User className="w-4 h-4" />
                    <span>USER IDENTITY</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.keys(longTermMemory.identity || {}).length === 0 ? (
                      <span className="text-[#0077b6]/60 italic">No identity records found.</span>
                    ) : (
                      Object.entries(longTermMemory.identity).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-[#001f35] p-2 rounded-lg">
                          <span>
                            <span className="text-[#00b4d8]">{k}:</span>{' '}
                            <span className="text-white font-bold">{v?.value}</span>
                          </span>
                          <button
                            onClick={() => handleDeleteEntry('identity', k)}
                            className="text-red-400/60 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Preferences */}
                <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-[#00f0ff]">
                    <Heart className="w-4 h-4" />
                    <span>PREFERENCES</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.keys(longTermMemory.preferences || {}).length === 0 ? (
                      <span className="text-[#0077b6]/60 italic">No preference records found.</span>
                    ) : (
                      Object.entries(longTermMemory.preferences).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-[#001f35] p-2 rounded-lg">
                          <span>
                            <span className="text-[#00b4d8]">{k}:</span>{' '}
                            <span className="text-white font-bold">{v?.value}</span>
                          </span>
                          <button
                            onClick={() => handleDeleteEntry('preferences', k)}
                            className="text-red-400/60 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Relationships */}
                <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-[#00f0ff]">
                    <Users className="w-4 h-4" />
                    <span>RELATIONSHIPS</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.keys(longTermMemory.relationships || {}).length === 0 ? (
                      <span className="text-[#0077b6]/60 italic">No relationship contacts stored.</span>
                    ) : (
                      Object.entries(longTermMemory.relationships).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-[#001f35] p-2 rounded-lg">
                          <span>
                            <span className="text-[#00b4d8]">{k}:</span>{' '}
                            <span className="text-white font-bold">{v?.name?.value || JSON.stringify(v)}</span>
                          </span>
                          <button
                            onClick={() => handleDeleteEntry('relationships', k)}
                            className="text-red-400/60 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Emotional State */}
                <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/25 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-orbitron font-bold text-[#00f0ff]">
                    <BrainCircuit className="w-4 h-4" />
                    <span>EMOTIONAL TELEMETRY</span>
                  </div>
                  <div className="space-y-1.5 font-mono text-xs">
                    {Object.keys(longTermMemory.emotional_state || {}).length === 0 ? (
                      <span className="text-[#0077b6]/60 italic">Calm & nominal.</span>
                    ) : (
                      Object.entries(longTermMemory.emotional_state).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between bg-[#001f35] p-2 rounded-lg">
                          <span>
                            <span className="text-[#00b4d8]">{k}:</span>{' '}
                            <span className="text-white font-bold">{v?.value}</span>
                          </span>
                          <button
                            onClick={() => handleDeleteEntry('emotional_state', k)}
                            className="text-red-400/60 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Add New Memory Entry Form */}
              <form onSubmit={handleAddEntry} className="p-4 rounded-xl bg-[#001122] border border-[#00f0ff]/20 space-y-3">
                <div className="text-xs font-orbitron font-bold text-[#00f0ff] flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>MANUAL SYNAPSE INJECTION</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={newCategory}
                    onChange={(e: any) => setNewCategory(e.target.value)}
                    className="px-3 py-2 rounded-lg bg-[#001a33] border border-[#00f0ff]/30 text-white font-mono text-xs focus:outline-none"
                  >
                    <option value="identity">Identity</option>
                    <option value="preferences">Preference</option>
                    <option value="relationships">Relationship</option>
                    <option value="emotional_state">Emotional</option>
                  </select>
                  <input
                    type="text"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="Key (e.g. name, favorite_food)"
                    className="px-3 py-2 rounded-lg bg-[#001a33] border border-[#00f0ff]/30 text-white font-mono text-xs focus:outline-none"
                  />
                  <input
                    type="text"
                    value={newVal}
                    onChange={(e) => setNewVal(e.target.value)}
                    placeholder="Value (e.g. Tony Stark, Pizza)"
                    className="px-3 py-2 rounded-lg bg-[#001a33] border border-[#00f0ff]/30 text-white font-mono text-xs focus:outline-none"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-[#00f0ff]/20 hover:bg-[#00f0ff]/30 border border-[#00f0ff]/50 text-[#00f0ff] font-orbitron text-xs tracking-wider transition-all"
                  >
                    INJECT RECORD
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* TEMPORARY MEMORY INSPECTION */
            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-2">
                <div className="text-[#00f0ff] font-orbitron font-bold">
                  ACTIVE MULTI-STEP CONVERSATION CONTEXT
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <span className="text-[#00b4d8]">Pending Intent:</span>{' '}
                    <span className="text-white font-bold">
                      {temporaryMemory.pending_intent || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#00b4d8]">Clarification Question:</span>{' '}
                    <span className="text-white font-bold">
                      {temporaryMemory.current_question || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#00b4d8]">Last User Directive:</span>{' '}
                    <span className="text-cyan-200">
                      {temporaryMemory.last_user_text || 'None'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#00b4d8]">Last App Executed:</span>{' '}
                    <span className="text-cyan-200">
                      {temporaryMemory.last_opened_app || 'None'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-2">
                <div className="text-[#00f0ff] font-orbitron font-bold">
                  STORED ACTION PARAMETERS
                </div>
                <pre className="p-3 bg-[#000d1a] rounded-lg border border-[#00f0ff]/15 text-[#8ffcff] overflow-x-auto text-[11px]">
                  {JSON.stringify(temporaryMemory.parameters || {}, null, 2)}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-2">
                <div className="text-[#00f0ff] font-orbitron font-bold">
                  RECENT CONVERSATION BUFFER (LAST 5 TURNS)
                </div>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {temporaryMemory.conversation_history?.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2 rounded-lg border ${
                        msg.role === 'user'
                          ? 'bg-[#001f35] border-[#00f0ff]/30 text-cyan-200'
                          : 'bg-[#002b4d] border-[#00b4d8]/40 text-[#8ffcff]'
                      }`}
                    >
                      <span className="font-bold uppercase text-[10px] text-[#00b4d8]">
                        {msg.role}:
                      </span>{' '}
                      {msg.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
