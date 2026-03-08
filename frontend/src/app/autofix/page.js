'use client';
// autofix/page.js — AI Auto-Fix Generator (Premium Rebuild)
// Side-by-side diff view · Confidence ratings · Per-issue accordion cards
// Fixed API: issue_indices (list) instead of single issue_index

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Sparkles, Copy, Check, AlertTriangle,
  Code, ChevronDown, GitCommit, Hash, FileCode,
  ShieldCheck, Zap, Layers, Activity, CheckCircle,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { autofixApi } from '@/lib/api/autofix';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────────────── */
const A  = '#00e599';
const AD = 'rgba(0,229,153,0.08)';
const AM = 'rgba(0,229,153,0.18)';

const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'cpp', 'php', 'ruby'];

const CONFIDENCE_MAP = {
  high:   { color: '#00e599', bg: 'rgba(0,229,153,0.10)',  border: 'rgba(0,229,153,0.25)',  label: 'High Confidence'   },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.25)', label: 'Medium Confidence' },
  low:    { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.25)',  label: 'Low Confidence'    },
};

const SEVERITY_MAP = {
  high:   { color: '#ef4444', bg: 'rgba(239,68,68,0.10)'   },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'  },
  low:    { color: '#00e599', bg: 'rgba(0,229,153,0.10)'   },
};

const TYPE_MAP = {
  security:        { color: '#ef4444', Icon: ShieldCheck },
  performance:     { color: '#f59e0b', Icon: Zap         },
  architecture:    { color: '#06b6d4', Icon: Layers      },
  maintainability: { color: '#a78bfa', Icon: Activity    },
  bug:             { color: '#fb923c', Icon: AlertTriangle },
  style:           { color: 'rgba(255,255,255,0.35)', Icon: Code },
};

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
      className="flex items-center gap-1.5 transition-colors"
      style={{ color: copied ? A : 'rgba(255,255,255,0.28)' }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
    </button>
  );
}

/* ─────────────────────────────────────────────────────
   CODE PANEL — one side of the diff
───────────────────────────────────────────────────── */
function CodePanel({ code, label, tint, language }) {
  if (!code) return null;
  return (
    <div className="flex flex-col rounded-xl overflow-hidden flex-1" style={{ border: `1px solid ${tint}22`, background: 'rgba(4,4,4,0.95)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5 shrink-0"
        style={{ borderBottom: `1px solid ${tint}15`, background: `${tint}07` }}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: tint, opacity: 0.65 }} />
          <span className="text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: `${tint}99` }}>
            {label}
          </span>
          {language && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.22)' }}>
              {language}
            </span>
          )}
        </div>
        <CopyBtn text={code} />
      </div>
      {/* Code */}
      <pre
        className="flex-1 overflow-x-auto p-4 text-[12.5px] font-mono leading-[1.7] text-white/65"
        style={{ maxHeight: '340px', overflowY: 'auto', scrollbarWidth: 'thin' }}
      >
        {code}
      </pre>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   DIFF VIEW — side-by-side original | fixed
───────────────────────────────────────────────────── */
function DiffView({ original, fixed, language }) {
  if (!original && !fixed) return null;
  return (
    <div>
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
        Code Diff
      </p>
      <div className="flex gap-3">
        <CodePanel code={original} label="Original" tint="#ef4444" language={language} />
        <CodePanel code={fixed}    label="Fixed"    tint="#00e599" language={language} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   CONFIDENCE BADGE
───────────────────────────────────────────────────── */
function ConfidenceBadge({ level }) {
  const c = CONFIDENCE_MAP[(level || '').toLowerCase()] || CONFIDENCE_MAP.medium;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
      {c.label}
    </span>
  );
}

/* ─────────────────────────────────────────────────────
   CUSTOM FIX RESULT
   Response shape: { file_name, language, original_code,
                     fixed_code, explanation, confidence,
                     additional_suggestions }
───────────────────────────────────────────────────── */
function CustomFixResult({ result }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Meta row */}
      <div
        className="flex items-center justify-between px-5 py-4 rounded-2xl"
        style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: AD, border: `1px solid ${AM}` }}
          >
            <FileCode size={16} style={{ color: A }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white/85">
              {result.file_name || 'untitled'}
            </p>
            <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {result.language}
            </p>
          </div>
        </div>
        <ConfidenceBadge level={result.confidence} />
      </div>

      {/* Explanation */}
      {result.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(0,229,153,0.04)', border: '1px solid rgba(0,229,153,0.12)' }}
        >
          <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] mb-3" style={{ color: 'rgba(0,229,153,0.55)' }}>
            What Changed & Why
          </p>
          <p className="text-[13px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.62)' }}>
            {result.explanation}
          </p>
        </motion.div>
      )}

      {/* Side-by-side diff */}
      {(result.original_code || result.fixed_code) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl p-5"
          style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <DiffView
            original={result.original_code}
            fixed={result.fixed_code}
            language={result.language}
          />
        </motion.div>
      )}

      {/* Additional suggestions */}
      {result.additional_suggestions?.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              Additional Suggestions
            </p>
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
              {result.additional_suggestions.length}
            </span>
          </div>
          <div className="p-4 space-y-2">
            {result.additional_suggestions.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-[5px]" style={{ background: A, opacity: 0.6 }} />
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>{s}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   SINGLE FIX CARD — for commit mode, one per issue
   CodeFix shape: { issue_title, issue_type, severity,
                    file_name, original_code, fixed_code,
                    explanation, confidence }
───────────────────────────────────────────────────── */
function FixCard({ fix, index }) {
  const [expanded, setExpanded] = useState(false);
  const typeInfo = TYPE_MAP[(fix.issue_type || '').toLowerCase()] || TYPE_MAP.bug;
  const { Icon } = typeInfo;
  const sev = SEVERITY_MAP[(fix.severity || '').toLowerCase()] || SEVERITY_MAP.medium;
  const lang = fix.file_name?.split('.').pop() || '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.3 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(8,8,8,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Card header */}
      <div className="flex items-center gap-4 px-5 py-4">
        {/* Type icon */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${typeInfo.color}12`, border: `1px solid ${typeInfo.color}28` }}
        >
          <Icon size={15} style={{ color: typeInfo.color }} />
        </div>

        {/* Title + meta badges */}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white/80 truncate">
            {fix.issue_title || `Fix #${index + 1}`}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {fix.issue_type && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                style={{ background: `${typeInfo.color}12`, color: typeInfo.color }}
              >
                {fix.issue_type}
              </span>
            )}
            {fix.severity && (
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium capitalize"
                style={{ background: sev.bg, color: sev.color }}
              >
                {fix.severity}
              </span>
            )}
            {fix.file_name && (
              <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
                {fix.file_name}
              </span>
            )}
          </div>
        </div>

        {/* Confidence + expand toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <ConfidenceBadge level={fix.confidence} />
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(255,255,255,0.3)', background: expanded ? 'rgba(255,255,255,0.05)' : 'transparent' }}
          >
            <ChevronDown
              size={14}
              style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
            />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              {fix.explanation && (
                <div className="pt-4">
                  <p className="text-[9.5px] font-semibold uppercase tracking-[0.12em] mb-2" style={{ color: 'rgba(0,229,153,0.5)' }}>
                    Explanation
                  </p>
                  <p className="text-[12.5px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {fix.explanation}
                  </p>
                </div>
              )}
              {(fix.original_code || fix.fixed_code) && (
                <DiffView original={fix.original_code} fixed={fix.fixed_code} language={lang} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   COMMIT FIX RESULT
   AutoFixResponse: { commit_hash, total_issues_found,
                      total_fixes_generated, fixes, summary }
───────────────────────────────────────────────────── */
function CommitFixResult({ result }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Summary bar */}
      <div
        className="flex items-center gap-5 px-5 py-4 rounded-2xl"
        style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: AD, border: `1px solid ${AM}` }}>
            <CheckCircle size={16} style={{ color: A }} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-white/85">
              {result.total_fixes_generated} fix{result.total_fixes_generated !== 1 ? 'es' : ''} generated
            </p>
            {result.commit_hash && (
              <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
                {result.commit_hash.slice(0, 12)}
              </p>
            )}
          </div>
        </div>

        <div className="w-px h-10 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

        <div className="flex items-center gap-6">
          {[
            { label: 'Found',   value: result.total_issues_found,    color: 'rgba(255,255,255,0.65)' },
            { label: 'Fixed',   value: result.total_fixes_generated, color: A                        },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className="text-[20px] font-black tabular-nums leading-none" style={{ color }}>{value}</p>
              <p className="text-[9px] uppercase tracking-[0.12em] mt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>{label}</p>
            </div>
          ))}
        </div>

        {result.summary && (
          <>
            <div className="w-px h-10 shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <p className="flex-1 text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
              {result.summary.slice(0, 130)}{result.summary.length > 130 ? '…' : ''}
            </p>
          </>
        )}
      </div>

      {/* Individual fix cards */}
      {result.fixes?.length > 0 && (
        <div className="space-y-3">
          {result.fixes.map((fix, i) => (
            <FixCard key={i} fix={fix} index={i} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   STYLED INPUT FIELD
───────────────────────────────────────────────────── */
function Field({ label, children, hint }) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-2">
        <label className="text-[9.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          {label}
        </label>
        {hint && <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.18)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

const inputStyle = {
  background: 'rgba(255,255,255,0.03)',
  border: '1px solid rgba(255,255,255,0.08)',
  color: 'rgba(255,255,255,0.75)',
};

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
export default function AutoFixPage() {
  const [mode,         setMode]         = useState('custom');
  const [repoId,       setRepoId]       = useState('');
  const [commitSha,    setCommitSha]    = useState('');
  const [issueIndices, setIssueIndices] = useState('');
  const [customCode,   setCustomCode]   = useState('');
  const [issueDesc,    setIssueDesc]    = useState('');
  const [language,     setLanguage]     = useState('python');
  const [fileName,     setFileName]     = useState('');
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);

  const runFix = async () => {
    setLoading(true);
    setResult(null);
    try {
      let data;
      if (mode === 'custom') {
        if (!customCode.trim() || !issueDesc.trim()) {
          toast.error('Provide code and issue description');
          return;
        }
        data = await autofixApi.fixCustom({
          code_snippet:      customCode,
          issue_description: issueDesc,
          language,
          file_name: fileName || 'untitled',
        });
      } else {
        if (!repoId || !commitSha) {
          toast.error('Provide Repository ID and Commit SHA');
          return;
        }
        const indices = issueIndices
          ? issueIndices.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n))
          : [];
        data = await autofixApi.fixIssue({
          repository_id: parseInt(repoId),
          commit_sha:    commitSha,
          issue_indices: indices,
        });
      }
      setResult({ mode, data });
      toast.success('Fix generated!');
    } catch (e) {
      toast.error(e.message || 'Failed to generate fix');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: AD, border: `1px solid ${AM}` }}
          >
            <Wrench size={16} style={{ color: A }} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">Auto-Fix</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              AI generates the exact corrected code — you review, approve, and apply
            </p>
          </div>
        </div>

        {/* ── Human-in-the-loop banner ── */}
        <div
          className="flex items-start gap-3 px-5 py-4 rounded-2xl"
          style={{ background: 'rgba(0,229,153,0.04)', border: '1px solid rgba(0,229,153,0.12)' }}
        >
          <Sparkles size={14} style={{ color: A, marginTop: 2 }} className="shrink-0" />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
              Human-in-the-Loop Design
            </p>
            <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
              AI suggests the fix with a confidence rating. Review the side-by-side diff and read the explanation —
              then copy and apply only when satisfied. You stay in control.
            </p>
          </div>
        </div>

        {/* ── Mode toggle ── */}
        <div
          className="flex rounded-xl overflow-hidden w-fit"
          style={{ border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(8,8,8,0.9)' }}
        >
          {[{ id: 'custom', label: 'Custom Code' }, { id: 'commit', label: 'From Commit' }].map((m, i) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setResult(null); }}
              className="px-5 py-2.5 text-[13px] font-semibold transition-all cursor-pointer"
              style={{
                color:      mode === m.id ? A : 'rgba(255,255,255,0.3)',
                background: mode === m.id ? AD : 'transparent',
                borderRight: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* ── Input card ── */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          {mode === 'custom' ? (
            <>
              <Field label="Paste Your Code">
                <textarea
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  placeholder="Paste the code that has an issue..."
                  rows={9}
                  className="w-full text-[13px] font-mono placeholder:text-white/18 outline-none resize-none leading-[1.7] rounded-xl px-4 py-3"
                  style={inputStyle}
                />
              </Field>

              <Field label="Describe the Issue">
                <input
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runFix()}
                  placeholder="e.g. This function has an N+1 query problem inside the loop"
                  className="w-full text-[13px] placeholder:text-white/18 outline-none rounded-xl px-4 py-2.5"
                  style={inputStyle}
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Language">
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    className="w-full text-[13px] outline-none rounded-xl px-4 py-2.5 capitalize"
                    style={inputStyle}
                  >
                    {LANGUAGES.map(l => (
                      <option key={l} value={l} className="bg-[#111] capitalize">{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Filename" hint="(optional)">
                  <input
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    placeholder="e.g. user_service.py"
                    className="w-full text-[13px] font-mono placeholder:text-white/18 outline-none rounded-xl px-4 py-2.5"
                    style={inputStyle}
                  />
                </Field>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-3 gap-4">
              <Field label="Repository ID">
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={inputStyle}
                >
                  <Hash size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <input
                    value={repoId}
                    onChange={e => setRepoId(e.target.value)}
                    placeholder="e.g. 26"
                    className="bg-transparent w-full text-[13px] placeholder:text-white/18 outline-none tabular-nums"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  />
                </div>
              </Field>
              <Field label="Commit SHA">
                <div
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                  style={inputStyle}
                >
                  <GitCommit size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  <input
                    value={commitSha}
                    onChange={e => setCommitSha(e.target.value)}
                    placeholder="full commit SHA"
                    className="bg-transparent w-full text-[13px] font-mono placeholder:text-white/18 outline-none"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  />
                </div>
              </Field>
              <Field label="Issue Indices" hint="(blank = fix all)">
                <input
                  value={issueIndices}
                  onChange={e => setIssueIndices(e.target.value)}
                  placeholder="e.g. 0, 1, 2"
                  className="w-full text-[13px] placeholder:text-white/18 outline-none rounded-xl px-4 py-2.5"
                  style={inputStyle}
                />
              </Field>
            </div>
          )}

          {/* Generate button */}
          <div className="pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={runFix}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: A, color: '#000' }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Generating Fix…
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Fix
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* ── Result section ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              key="result"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {result.mode === 'custom'
                ? <CustomFixResult result={result.data} />
                : <CommitFixResult result={result.data} />
              }
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
