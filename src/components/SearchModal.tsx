import React, { useState, useEffect } from 'react';
import { X, Search, Globe, ExternalLink, Sparkles, Database } from 'lucide-react';
import { playBeep } from '../utils/soundEffects';

interface SearchModalProps {
  query: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  query,
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState(query);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const executeSearch = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (e) {
      console.error('Search fetch failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && query) {
      setSearchQuery(query);
      executeSearch(query);
    }
  }, [isOpen, query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#020d1a] border border-[#00f0ff]/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.25)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-gradient-to-r from-[#002b4d] to-[#011424] border-b border-[#00f0ff]/30">
          <div className="flex items-center gap-2.5 text-[#00f0ff]">
            <Search className="w-5 h-5 animate-pulse" />
            <span className="font-orbitron font-bold tracking-wider text-sm">
              GLOBAL_INTELLIGENCE // SEARCH DOSSIER
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
        <div className="p-6 space-y-4 font-rajdhani text-[#8ffcff]">
          {/* Query bar */}
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && executeSearch(searchQuery)}
              placeholder="Query planetary intelligence archives..."
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#001222] border border-[#00f0ff]/30 focus:border-[#00f0ff] text-white font-mono text-sm placeholder:text-[#0077b6]/50 focus:outline-none focus:ring-1 focus:ring-[#00f0ff]/50"
            />
            <button
              onClick={() => {
                playBeep(1200, 0.04);
                executeSearch(searchQuery);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00b4d8] to-[#00f0ff] text-[#001222] font-orbitron font-bold text-xs tracking-wider transition-all"
            >
              QUERY
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-[#00f0ff] font-mono text-xs animate-pulse">
              AGGREGATING QUANTUM SATELLITE FEEDS & DATABASES...
            </div>
          ) : data ? (
            <>
              {/* Executive Summary */}
              <div className="p-4 rounded-xl bg-[#001424] border border-[#00f0ff]/30 space-y-1.5 shadow-inner">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00f0ff]">
                  <Sparkles className="w-4 h-4 text-[#00f0ff]" />
                  <span className="font-bold tracking-wider">J.A.R.V.I.S EXECUTIVE SUMMARY</span>
                </div>
                <p className="text-sm font-sans text-cyan-100 leading-relaxed">
                  {data.summary}
                </p>
              </div>

              {/* Intelligence Stream List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {data.results?.map((res: any, idx: number) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#001020]/90 border border-[#00f0ff]/20 hover:border-[#00f0ff]/50 transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#00b4d8] flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-[#00f0ff]" />
                        {res.source}
                      </span>
                      <a
                        href={res.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-mono text-[#00f0ff] hover:underline flex items-center gap-1"
                      >
                        <span>ACCESS FEED</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-sm font-semibold text-white font-rajdhani">
                      {res.title}
                    </div>
                    <div className="text-xs text-[#8ffcff]/70 font-sans">
                      {res.snippet}
                    </div>
                  </div>
                ))}
              </div>

              {/* Direct Web Open Button */}
              <div className="pt-2 flex justify-end gap-2">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#00f0ff]/15 hover:bg-[#00f0ff]/25 border border-[#00f0ff]/40 text-[#00f0ff] font-orbitron text-xs tracking-wider flex items-center gap-1.5 transition-all"
                >
                  <Globe className="w-4 h-4" />
                  <span>OPEN GOOGLE RESEARCH</span>
                </a>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};
