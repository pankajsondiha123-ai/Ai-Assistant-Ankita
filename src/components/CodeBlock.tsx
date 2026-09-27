import React, { useState } from 'react';
import { Copy, Check, Code, Terminal, FileCode } from 'lucide-react';
import { playBeep } from '../utils/soundEffects';

interface CodeBlockProps {
  language?: string;
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'code', code }) => {
  const [copied, setCopied] = useState(false);

  const cleanCode = code.trim();
  const lines = cleanCode.split('\n');

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(cleanCode);
    setCopied(true);
    playBeep(1400, 0.04);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple token highlighter for common languages
  const highlightLine = (line: string) => {
    // Comments
    if (/^\s*(#|\/\/|--|\/\*)/.test(line)) {
      return <span className="text-gray-400 italic">{line}</span>;
    }

    // Tokenized rendering
    const parts = line.split(/([a-zA-Z_][a-zA-Z0-9_]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|[0-9]+|[{}()[\],.;:+\-*\/=<>!&|])/g);

    const keywords = new Set([
      'def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'as', 'try', 'except', 'finally', 'with', 'lambda', 'async', 'await', 'pass', 'break', 'continue', 'yield', 'self',
      'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'switch', 'case', 'default', 'new', 'this', 'typeof', 'instanceof', 'void', 'delete', 'throw', 'catch', 'export', 'import', 'default',
      'int', 'float', 'double', 'char', 'void', 'bool', 'string', 'struct', 'typedef', 'public', 'private', 'protected', 'virtual', 'override', 'auto', 'namespace', 'using', 'std', 'vector', 'map', 'include'
    ]);

    const builtins = new Set([
      'print', 'len', 'range', 'str', 'int', 'float', 'list', 'dict', 'set', 'tuple', 'open', 'type', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'sum', 'min', 'max',
      'console', 'log', 'error', 'warn', 'document', 'window', 'Math', 'JSON', 'Promise', 'Array', 'Object', 'String', 'Number', 'Boolean', 'fetch', 'setTimeout', 'setInterval',
      'cout', 'cin', 'endl', 'printf', 'scanf', 'malloc', 'free'
    ]);

    return (
      <>
        {parts.map((part, idx) => {
          if (!part) return null;
          if (keywords.has(part)) {
            return <span key={idx} className="text-[#00f0ff] font-bold">{part}</span>;
          }
          if (builtins.has(part)) {
            return <span key={idx} className="text-[#a78bfa]">{part}</span>;
          }
          if (/^["'`].*["'`]$/.test(part)) {
            return <span key={idx} className="text-[#34d399]">{part}</span>;
          }
          if (/^[0-9]+$/.test(part)) {
            return <span key={idx} className="text-[#fbbf24]">{part}</span>;
          }
          if (/^[{}()[\],.;:]$/.test(part)) {
            return <span key={idx} className="text-[#94a3b8]">{part}</span>;
          }
          return <span key={idx}>{part}</span>;
        })}
      </>
    );
  };

  const displayLang = (language || 'code').toUpperCase();

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-[#00f0ff]/30 bg-[#020d18] shadow-[0_0_20px_rgba(0,180,255,0.15)] font-mono text-xs select-text">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#011424] border-b border-[#00f0ff]/20 text-[11px] select-none">
        <div className="flex items-center gap-1.5 text-[#00f0ff]">
          <FileCode className="w-3.5 h-3.5 text-[#00ff88]" />
          <span className="font-bold font-orbitron tracking-wider text-[#00ff88]">
            {displayLang}
          </span>
          <span className="text-[10px] text-[#0077b6]">({lines.length} lines)</span>
        </div>

        <button
          onClick={handleCopy}
          className={`px-2.5 py-1 rounded flex items-center gap-1.5 transition-all text-[11px] font-semibold ${
            copied
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-[#00223a] hover:bg-[#00385c] text-[#00f0ff] border border-[#00f0ff]/30 hover:border-[#00f0ff]'
          }`}
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>कॉपी हो गया!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>कोड कॉपी करें</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body with Line Numbers */}
      <div className="p-3 overflow-x-auto text-[11px] leading-5 text-[#e0f7fa] scrollbar-thin scrollbar-thumb-[#00f0ff]/30 scrollbar-track-transparent">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, index) => (
              <tr key={index} className="hover:bg-[#00f0ff]/5 transition-colors">
                <td className="w-8 pr-3 text-right text-gray-500 select-none font-mono text-[10px] border-r border-[#00f0ff]/10">
                  {index + 1}
                </td>
                <td className="pl-3 font-mono whitespace-pre break-words">
                  {highlightLine(line)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
