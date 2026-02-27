'use client';
// CodeBlock.js — Syntax-highlighted code block with copy button
import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Copy, Check } from 'lucide-react';

const theme = {
  'code[class*="language-"]': { color: '#e2e8f0', fontFamily: 'var(--font-jetbrains, monospace)', fontSize: '0.8rem', lineHeight: '1.6' },
  'pre[class*="language-"]': { background: 'transparent', margin: 0, padding: 0, overflow: 'auto' },
  keyword:    { color: '#c792ea' },
  string:     { color: '#c3e88d' },
  comment:    { color: '#546e7a', fontStyle: 'italic' },
  function:   { color: '#82aaff' },
  number:     { color: '#f78c6c' },
  operator:   { color: '#89ddff' },
  punctuation:{ color: '#89ddff' },
  'class-name':{ color: '#ffcb6b' },
  builtin:    { color: '#ffcb6b' },
  boolean:    { color: '#f78c6c' },
  variable:   { color: '#eeffff' },
  property:   { color: '#80cbc4' },
};

export default function CodeBlock({ code, language = 'python', filename, showLineNumbers = true }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-white/8 overflow-hidden bg-[#0d0d0d]">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/6 bg-white/2">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
          </div>
          {filename && (
            <span className="text-xs text-white/35 font-mono">{filename}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors cursor-pointer"
        >
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {/* Code */}
      <div className="p-4 overflow-auto max-h-96">
        <SyntaxHighlighter
          language={language}
          style={theme}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{ color: 'rgba(255,255,255,0.15)', minWidth: '2.5em', paddingRight: '1em', userSelect: 'none' }}
          customStyle={{ background: 'transparent', margin: 0, padding: 0 }}
          wrapLongLines={false}
        >
          {code || ''}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}
