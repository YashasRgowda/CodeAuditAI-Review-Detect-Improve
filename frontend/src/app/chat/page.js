'use client';
// chat/page.js — Premium AI Code Review Chat Interface
// Full two-panel layout: analysis context left, conversation right.
// Features: markdown-aware message rendering, copy-to-clipboard,
//           suggested prompts, typing indicator, session badge.

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Copy, Check, ChevronRight,
  GitCommit, ShieldCheck, Zap, Wrench, AlertTriangle,
  Sparkles, Bot, Hash, Clock, RotateCcw, ArrowUpRight,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { chatApi } from '@/lib/api/chat';
import { analysisApi } from '@/lib/api/analysis';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────
   ACCENT COLOR
───────────────────────────────────────────────────── */
const A = '#00e599';   // primary green
const AD = 'rgba(0,229,153,0.08)';
const AM = 'rgba(0,229,153,0.18)';

/* ─────────────────────────────────────────────────────
   SUGGESTED PROMPTS — chips shown in empty chat
───────────────────────────────────────────────────── */
const PROMPTS = [
  { icon: ShieldCheck,  label: 'Security deep-dive',    text: 'Walk me through every security concern in detail and how to fix each one.' },
  { icon: Zap,          label: 'Performance issues',    text: 'What are the performance bottlenecks and how can I optimize them?' },
  { icon: Wrench,       label: 'How to fix issues',     text: 'Give me step-by-step instructions to fix the top 3 critical issues.' },
  { icon: GitCommit,    label: 'Explain the changes',   text: 'Summarize what this commit actually does and its architectural impact.' },
  { icon: AlertTriangle,label: 'Risk assessment',       text: 'Why is this commit rated as the current risk level? What could go wrong?' },
  { icon: Sparkles,     label: 'Best practices',        text: 'What best practices am I violating and what are the industry standards?' },
];

/* ─────────────────────────────────────────────────────
   TYPING INDICATOR
───────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <div className="flex items-center gap-[5px] px-1 py-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-[6px] h-[6px] rounded-full"
          style={{ background: A }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   COPY BUTTON
───────────────────────────────────────────────────── */
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/8"
      title="Copy"
    >
      {copied
        ? <Check size={11} style={{ color: A }} />
        : <Copy size={11} className="text-white/30" />}
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   SIMPLE CODE BLOCK DETECTOR
   Wraps ```...``` in a styled pre block
───────────────────────────────────────────────────── */
function MessageContent({ text }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="space-y-2 text-[13.5px] leading-[1.7]">
      {parts.map((part, i) => {
        if (part.startsWith('```')) {
          const code = part.replace(/^```[\w]*\n?/, '').replace(/```$/, '');
          return (
            <pre
              key={i}
              className="rounded-lg p-3 text-[12px] overflow-x-auto font-mono"
              style={{ background: 'rgba(0,229,153,0.05)', border: '1px solid rgba(0,229,153,0.12)', color: 'rgba(255,255,255,0.8)' }}
            >
              {code}
            </pre>
          );
        }
        // Bold: **text**
        const segments = part.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i} className="whitespace-pre-wrap text-white/75">
            {segments.map((s, j) =>
              s.startsWith('**') && s.endsWith('**')
                ? <strong key={j} className="text-white/90 font-semibold">{s.slice(2, -2)}</strong>
                : s
            )}
          </p>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MESSAGE BUBBLE
───────────────────────────────────────────────────── */
function Bubble({ msg, index }) {
  const isUser = msg.role === 'user';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, delay: index * 0.02 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
        style={isUser
          ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }
          : { background: AD, border: `1px solid ${AM}` }}
      >
        {isUser
          ? <span className="text-[10px] font-bold text-white/50">YOU</span>
          : <Bot size={13} style={{ color: A }} />}
      </div>

      {/* Bubble */}
      <div className={`group max-w-[78%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className="px-4 py-3 rounded-2xl"
          style={isUser
            ? { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)', borderBottomRightRadius: '6px' }
            : { background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.07)', borderBottomLeftRadius: '6px' }}
        >
          {isUser
            ? <p className="text-[13.5px] leading-[1.65] text-white/80">{msg.content}</p>
            : <MessageContent text={msg.content} />}
        </div>

        {/* Footer row */}
        <div className={`flex items-center gap-1.5 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          {!isUser && <CopyBtn text={msg.content} />}
          <span className="text-[10px] text-white/18">
            {isUser ? 'You' : 'CodeAuditAI'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   RISK PILL
───────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────
   RISK BADGE — inline chip
───────────────────────────────────────────────────── */
function RiskBadge({ level }) {
  const map = {
    low:      { dot: '#00e599', text: '#00e599',  label: 'Low' },
    medium:   { dot: '#ffb224', text: '#ffb224',  label: 'Medium' },
    high:     { dot: '#ff4c4c', text: '#ff4c4c',  label: 'High' },
    critical: { dot: '#ff4c4c', text: '#ff4c4c',  label: 'Critical' },
  };
  const s = map[(level || '').toLowerCase()] || map.medium;
  return (
    <span className="inline-flex items-center gap-1">
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.dot }} />
      <span className="text-[11px] font-medium" style={{ color: s.text }}>{s.label} risk</span>
    </span>
  );
}

/* ─────────────────────────────────────────────────────
   SLIM SCORE ROW
───────────────────────────────────────────────────── */
function ScoreRow({ label, value }) {
  const pct   = Math.min(100, Math.max(0, value || 0));
  const color = pct >= 80 ? '#00e599' : pct >= 55 ? '#ffb224' : '#ff4c4c';
  return (
    <div className="flex items-center gap-3">
      <span className="w-[88px] shrink-0 text-[11px] text-white/35">{label}</span>
      <div className="flex-1 h-[2px] rounded-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <span className="w-6 text-right text-[11px] font-mono tabular-nums" style={{ color }}>{pct}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   CONTEXT PANEL — single unified card with hairline dividers
───────────────────────────────────────────────────── */
function ContextPanel({ summary }) {
  if (!summary) return null;
  const {
    commit_hash, risk_level, author,
    files_changed, lines_added, lines_removed,
    commit_message, maintainability_score,
    security_score, performance_score,
    recommendations = [], repository_name,
  } = summary;

  const rec = (r) => typeof r === 'string' ? r : r?.description || r?.text || '';
  const DIV = <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '0 -1px' }} />;

  return (
    <div
      className="rounded-xl overflow-hidden overflow-y-auto"
      style={{ border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(8,8,8,0.95)' }}
    >

      {/* ── Header: repo + sha ── */}
      <div className="px-4 pt-4 pb-3.5">
        {repository_name && (
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center text-[9px] font-bold shrink-0"
              style={{ background: AD, color: A }}
            >
              {repository_name[0]?.toUpperCase()}
            </div>
            <span
              className="text-[12px] font-semibold truncate leading-none"
              style={{ color: 'rgba(255,255,255,0.72)' }}
              title={repository_name}
            >
              {repository_name}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {commit_hash && (
            <span className="font-mono text-[11px]" style={{ color: A }}>
              # {commit_hash.slice(0, 7)}
            </span>
          )}
          {risk_level && <RiskBadge level={risk_level} />}
        </div>
      </div>

      {DIV}

      {/* ── Commit message ── */}
      {commit_message && (
        <>
          <div className="px-4 py-3">
            <p className="text-[11.5px] leading-[1.6] text-white/42 line-clamp-3">
              {commit_message}
            </p>
          </div>
          {DIV}
        </>
      )}

      {/* ── Stats row ── */}
      <div className="px-4 py-3 flex items-center gap-0">
        {[
          { v: files_changed, l: 'files' },
          { v: lines_added   ? `+${lines_added}`   : null, l: 'added' },
          { v: lines_removed ? `−${lines_removed}` : null, l: 'removed' },
        ].map(({ v, l }, i) => (
          <div key={l} className="flex-1 flex flex-col items-center">
            <span className="text-[13px] font-semibold text-white/65 tabular-nums leading-none">
              {v ?? '—'}
            </span>
            <span className="text-[9px] text-white/22 mt-1 uppercase tracking-wide">{l}</span>
            {i < 2 && (
              <div
                className="absolute"
                style={{ display: 'none' }}
              />
            )}
          </div>
        ))}
      </div>

      {author && (
        <>
          {DIV}
          <div className="px-4 py-2.5 flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold shrink-0"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
            >
              {author[0]?.toUpperCase()}
            </div>
            <span className="text-[11px] text-white/35 truncate">{author}</span>
          </div>
        </>
      )}

      {DIV}

      {/* ── Quality scores ── */}
      <div className="px-4 py-3.5 space-y-2.5">
        <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] text-white/22 mb-3">Quality</p>
        <ScoreRow label="Security"        value={security_score} />
        <ScoreRow label="Maintainability" value={maintainability_score} />
        <ScoreRow label="Performance"     value={performance_score} />
      </div>

    </div>
  );
}

/* ─────────────────────────────────────────────────────
   EMPTY STATE — before a session starts
───────────────────────────────────────────────────── */
function EmptyState({ analysisId, setAnalysisId, onStart, starting }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">

      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative mb-8"
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center"
          style={{ background: AD, border: `1px solid ${AM}` }}
        >
          <MessageSquare size={34} style={{ color: A }} />
        </div>
        {/* Pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ border: `1px solid ${AM}` }}
          animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-8 max-w-sm"
      >
        <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">
          Chat with your Code Review
        </h2>
        <p className="text-[14px] text-white/40 leading-relaxed">
          Enter an Analysis ID to start a conversation. Ask follow-up questions,
          request fixes, or explore risks — the AI has full context.
        </p>
      </motion.div>

      {/* Start input */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18 }}
        className="w-full max-w-sm mb-10"
      >
        <div
          className="flex items-center gap-2 rounded-xl px-4 py-3"
          style={{ background: 'rgba(10,10,10,0.9)', border: `1px solid rgba(255,255,255,0.09)` }}
        >
          <Hash size={14} className="text-white/25 shrink-0" />
          <input
            value={analysisId}
            onChange={e => setAnalysisId(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && onStart()}
            placeholder="Analysis ID  (e.g. 42)"
            className="flex-1 bg-transparent text-[14px] text-white/80 placeholder:text-white/22 outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            disabled={!analysisId || starting}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: A, color: '#000' }}
          >
            {starting ? (
              <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
            ) : (
              <>Start <ChevronRight size={13} /></>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Prompt chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 }}
        className="w-full max-w-xl"
      >
        <p className="text-center text-[11px] text-white/22 mb-4 uppercase tracking-widest">
          You can ask things like…
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PROMPTS.map(({ icon: Icon, label, text }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-3.5 py-3 rounded-xl cursor-default"
              style={{ background: 'rgba(10,10,10,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: AD }}
              >
                <Icon size={13} style={{ color: A }} />
              </div>
              <div>
                <p className="text-[12px] font-medium text-white/65">{label}</p>
                <p className="text-[10px] text-white/28 leading-snug mt-0.5 line-clamp-1">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MAIN CHAT VIEW
───────────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────────
   FINDINGS BAR — horizontal scrollable recommendation chips
   Sits above the messages area; clicking a chip sends it as a question
───────────────────────────────────────────────────── */
function FindingsBar({ recommendations = [], onSend }) {
  if (!recommendations.length) return null;

  const label = (r) => {
    const text = typeof r === 'string' ? r : r?.description || r?.text || '';
    // Trim to ~48 chars cleanly at a word boundary
    if (text.length <= 48) return text;
    const cut = text.slice(0, 48);
    return cut.slice(0, cut.lastIndexOf(' ') || 48) + '…';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="shrink-0 flex items-center gap-3 px-5 py-2.5"
      style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      {/* Label */}
      <div className="flex items-center gap-1.5 shrink-0">
        <Sparkles size={10} style={{ color: A }} />
        <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Findings
        </span>
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tabular-nums"
          style={{ background: AD, color: A }}
        >
          {recommendations.length}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-4 shrink-0" style={{ background: 'rgba(255,255,255,0.07)' }} />

      {/* Chips — horizontal scroll, no scrollbar */}
      <div
        className="flex items-center gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {recommendations.map((r, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSend(typeof r === 'string' ? r : r?.description || r?.text || '')}
            className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] transition-colors"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.45)',
              whiteSpace: 'nowrap',
            }}
            title="Click to ask AI about this"
          >
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: 'rgba(0,229,153,0.45)' }}
            />
            {label(r)}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   CHAT VIEW
───────────────────────────────────────────────────── */
function ChatView({ sessionId, messages, loading, onSend, onReset, summary }) {
  const [input, setInput]   = useState('');
  const bottomRef           = useRef(null);
  const textareaRef         = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 140) + 'px';
  }, [input]);

  const send = useCallback(() => {
    const msg = input.trim();
    if (!msg || loading) return;
    setInput('');
    onSend(msg);
  }, [input, loading, onSend]);

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const isEmpty = messages.length === 0;

  return (
    <div className="flex-1 flex overflow-hidden gap-5">

      {/* ── LEFT: Analysis context ── */}
      <div className="w-[216px] shrink-0 overflow-y-auto">
        {summary
          ? <ContextPanel summary={summary} />
          : (
            <div
              className="rounded-xl flex items-center justify-center py-10"
              style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,8,0.6)' }}
            >
              <p className="text-[11px] text-white/18">Context loads on start</p>
            </div>
          )
        }
      </div>

      {/* ── RIGHT: Chat ── */}
      <div className="flex-1 flex flex-col rounded-2xl overflow-hidden" style={{ background: 'rgba(6,6,6,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}>

        {/* Chat header bar */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-2 h-2 rounded-full"
              style={{ background: A, boxShadow: `0 0 6px ${A}` }}
            />
            <span className="text-[12px] text-white/50 font-mono truncate max-w-[180px]">
              {sessionId.slice(0, 24)}…
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/25">
              <Clock size={10} />
              2 hr session
            </div>
            <button
              onClick={onReset}
              className="flex items-center gap-1 text-[11px] text-white/25 hover:text-white/50 transition-colors"
              title="New session"
            >
              <RotateCcw size={11} />
              New
            </button>
          </div>
        </div>

        {/* Findings bar — recommendations as clickable chips */}
        <FindingsBar recommendations={summary?.recommendations} onSend={onSend} />

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Empty state inside chat */}
          {isEmpty && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center h-full text-center py-8"
            >
              <Bot size={28} className="mb-4" style={{ color: 'rgba(0,229,153,0.3)' }} />
              <p className="text-[13px] text-white/35 mb-1">Context loaded. Ready to answer.</p>
              <p className="text-[11px] text-white/20">Ask anything about this code review.</p>

              {/* Prompt suggestions */}
              <div className="flex flex-wrap justify-center gap-2 mt-7 max-w-md">
                {PROMPTS.slice(0, 4).map(({ label, text }) => (
                  <button
                    key={label}
                    onClick={() => onSend(text)}
                    className="text-[11.5px] px-3 py-1.5 rounded-full transition-all hover:opacity-80"
                    style={{ background: AD, color: A, border: `1px solid ${AM}` }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Actual messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <Bubble key={i} msg={msg} index={i} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {loading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-start"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                style={{ background: AD, border: `1px solid ${AM}` }}
              >
                <Bot size={13} style={{ color: A }} />
              </div>
              <div
                className="px-4 py-3 rounded-2xl rounded-tl-md"
                style={{ background: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div
            className="flex items-end gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(14,14,14,0.95)', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about this code review… (⏎ send, ⇧⏎ newline)"
              className="flex-1 bg-transparent text-[13.5px] text-white/80 placeholder:text-white/22 outline-none resize-none leading-relaxed"
              style={{ minHeight: '22px', maxHeight: '140px' }}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-opacity disabled:opacity-30"
              style={{ background: A }}
              title="Send"
            >
              <Send size={14} color="#000" />
            </motion.button>
          </div>
          <p className="text-[10px] text-white/15 mt-2 text-center">
            AI can make mistakes — always verify critical security advice with a human reviewer.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE HEADER
───────────────────────────────────────────────────── */
function PageHeader({ sessionActive }) {
  return (
    <div className="flex items-center justify-between mb-5 shrink-0">
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: AD, border: `1px solid ${AM}` }}
        >
          <MessageSquare size={16} style={{ color: A }} />
        </div>
        <div>
          <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">AI Chat</h1>
          <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Multi-turn review with full analysis context
          </p>
        </div>
      </div>

      {/* Badge */}
      {sessionActive && (
        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full"
          style={{ background: AD, border: `1px solid ${AM}` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: A }} />
          <span className="text-[11px] font-medium" style={{ color: A }}>Session Active</span>
        </motion.div>
      )}

      {/* Tip */}
      {!sessionActive && (
        <a
          href="/repositories"
          className="flex items-center gap-1.5 text-[11.5px] text-white/25 hover:text-white/50 transition-colors"
        >
          Find an Analysis ID in Analysis History
          <ArrowUpRight size={11} />
        </a>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   INNER (needs useSearchParams — inside Suspense)
───────────────────────────────────────────────────── */
function ChatInner() {
  const searchParams = useSearchParams();
  const initSession  = searchParams.get('session') || '';

  const [sessionId,  setSessionId]  = useState(initSession);
  const [analysisId, setAnalysisId] = useState('');
  const [messages,   setMessages]   = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [starting,   setStarting]   = useState(false);
  const [summary,    setSummary]    = useState(null);

  // Load existing session history on mount (URL ?session= param case)
  // Note: only restores messages — summary comes from analysisApi.get() in handleStart
  useEffect(() => {
    if (!sessionId) return;
    chatApi.history(sessionId)
      .then(data => {
        setMessages(data.messages || []);
        // do NOT overwrite summary here — analysis_summary from Redis is just a plain string
      })
      .catch(() => {});
  }, [sessionId]);

  const handleStart = async () => {
    if (!analysisId.trim()) return toast.error('Enter an analysis ID');
    setStarting(true);
    try {
      // Start chat session + fetch analysis detail in parallel
      const [chatData, analysisData] = await Promise.allSettled([
        chatApi.start(parseInt(analysisId)),
        analysisApi.get(parseInt(analysisId)),
      ]);

      if (chatData.status === 'rejected') {
        // Parse the API error detail from "HTTP 404: {"detail":"..."}" format
        const raw = chatData.reason?.message || '';
        let detail = 'Could not start session';
        try {
          const jsonPart = raw.includes('{') ? raw.slice(raw.indexOf('{')) : null;
          if (jsonPart) detail = JSON.parse(jsonPart)?.detail || detail;
        } catch { /* ignore */ }
        if (detail.toLowerCase().includes('not found')) {
          detail = 'Analysis not found — enter an Analysis ID (not a Repository ID). Find yours in Analysis History.';
        }
        throw new Error(detail);
      }

      const session = chatData.value;
      setSessionId(session.session_id);
      setMessages([{
        role: 'assistant',
        content: session.message || "I've loaded the full analysis context. What would you like to explore?",
      }]);

      // Populate context panel with analysis metadata (repo name, commit, scores)
      if (analysisData.status === 'fulfilled') {
        setSummary(analysisData.value);
      }

      toast.success('Session started!');
    } catch (e) {
      toast.error(e.message || 'Could not start session');
    } finally {
      setStarting(false);
    }
  };

  const handleSend = useCallback(async (text) => {
    if (!text || !sessionId) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);
    try {
      const res = await chatApi.message(sessionId, text);
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply || res.response }]);
    } catch {
      toast.error('Failed to get response');
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const handleReset = () => {
    setSessionId('');
    setMessages([]);
    setSummary(null);
    setAnalysisId('');
  };

  return (
    <DashboardLayout>
      <div
        className="flex flex-col"
        style={{ height: 'calc(100vh - 7rem)' }}
      >
        <PageHeader sessionActive={!!sessionId} />

        <AnimatePresence mode="wait">
          {!sessionId ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col rounded-2xl overflow-hidden"
              style={{ background: 'rgba(6,6,6,0.85)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <EmptyState
                analysisId={analysisId}
                setAnalysisId={setAnalysisId}
                onStart={handleStart}
                starting={starting}
              />
            </motion.div>
          ) : (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex overflow-hidden"
            >
              <ChatView
                sessionId={sessionId}
                messages={messages}
                loading={loading}
                onSend={handleSend}
                onReset={handleReset}
                summary={summary}
              />
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}

/* ─────────────────────────────────────────────────────
   EXPORT
───────────────────────────────────────────────────── */
export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#000' }}>
        <div className="w-8 h-8 rounded-full border-2 border-t-[#00e599] animate-spin" style={{ borderColor: 'rgba(0,229,153,0.2)', borderTopColor: '#00e599' }} />
      </div>
    }>
      <ChatInner />
    </Suspense>
  );
}
