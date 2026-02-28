'use client';
// analysis/quick/page.js — AI Analysis Hub: Quick · Streaming · Full (saves to DB)
// Royal Wine theme · mode toggle · live log · score gauges · recommendations

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Play, Zap, Shield, Wrench, MessageSquare, ChevronRight,
  GitCommit, FileCode, AlertTriangle, CheckCircle, ArrowLeft,
  Database, Radio,
} from 'lucide-react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { analysisApi } from '@/lib/api/analysis';
import { chatApi } from '@/lib/api/chat';
import { toast } from 'sonner';

/* ─────────────────────────────────────────
   Risk badge
───────────────────────────────────────── */
const RISK = {
  low:      { bg: 'rgba(106,171,142,0.12)', border: 'rgba(106,171,142,0.28)', text: '#6aab8e' },
  medium:   { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)',  text: '#f59e0b' },
  high:     { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',   text: '#f87171' },
  critical: { bg: 'rgba(159,18,57,0.14)',  border: 'rgba(159,18,57,0.32)',   text: 'rgba(220,80,100,0.92)' },
};
function RiskBadge({ level }) {
  const r = RISK[level?.toLowerCase()] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.45)' };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.text }}>
      {level}
    </span>
  );
}

/* ─────────────────────────────────────────
   Streaming log line
───────────────────────────────────────── */
function StreamLine({ text, type }) {
  const map = {
    progress: { color: 'rgba(255,255,255,0.45)', icon: '▸' },
    complete: { color: '#6aab8e',                icon: '✓' },
    error:    { color: '#f87171',                icon: '✗' },
  };
  const { color, icon } = map[type] || map.progress;
  return (
    <div className="flex items-start gap-2 text-[11px] font-mono" style={{ color }}>
      <span className="shrink-0 mt-0.5">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

/* ─────────────────────────────────────────
   Recommendation card
───────────────────────────────────────── */
function RecCard({ rec, index }) {
  const isObj    = typeof rec === 'object' && rec !== null;
  const text     = isObj ? (rec.description || rec.text || JSON.stringify(rec)) : rec;
  const severity = isObj ? rec.severity : null;
  const fixable  = isObj && rec.fixable;
  const accents  = { high: 'rgba(239,68,68,0.12)', medium: 'rgba(245,158,11,0.10)', low: 'rgba(106,171,142,0.08)' };
  const borders  = { high: 'rgba(239,68,68,0.22)', medium: 'rgba(245,158,11,0.20)', low: 'rgba(106,171,142,0.18)' };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.28 }}
      className="flex items-start gap-3 p-4 rounded-xl"
      style={{
        background: accents[severity] || 'rgba(255,255,255,0.025)',
        border: `1px solid ${borders[severity] || 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>{text}</p>
        {fixable && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <Wrench size={10} style={{ color: '#6aab8e' }} />
            <span className="text-[10.5px]" style={{ color: '#6aab8e' }}>AI can fix this</span>
          </div>
        )}
      </div>
      {severity && <RiskBadge level={severity} />}
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   PAGE
═══════════════════════════════════════ */
export default function QuickAnalysisPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [repoId,      setRepoId]      = useState('');
  const [commitSha,   setCommitSha]   = useState('');

  // Auto-fill from URL params: /analysis/quick?repo=22&sha=abc1234
  useEffect(() => {
    const r = searchParams.get('repo');
    const s = searchParams.get('sha');
    if (r) setRepoId(r);
    if (s) setCommitSha(s);
  }, [searchParams]);
  const [mode,        setMode]        = useState('quick');
  const [loading,     setLoading]     = useState(false);
  const [result,      setResult]      = useState(null);
  const [streamLines, setStreamLines] = useState([]);
  const [error,       setError]       = useState('');

  /* ── Quick analysis (no DB save) ── */
  const runQuick = async () => {
    if (!repoId || !commitSha) return toast.error('Enter repository ID and commit SHA');
    setLoading(true); setError(''); setResult(null);
    try {
      const data = await analysisApi.quick({ repository_id: parseInt(repoId), commit_sha: commitSha });
      setResult(data);
      toast.success('Analysis complete!');
    } catch (e) { const m = e.message || 'Analysis failed'; setError(m); toast.error(m); }
    finally { setLoading(false); }
  };

  /* ── Full analysis (saves to DB, appears in history) ── */
  const runFull = async () => {
    if (!repoId || !commitSha) return toast.error('Enter repository ID and commit SHA');
    setLoading(true); setError(''); setResult(null);
    try {
      const raw = await analysisApi.full({ repository_id: parseInt(repoId), commit_hash: commitSha });

      // AnalysisResponse nests everything inside changes_data — normalise for display
      const c = raw.changes_data || {};
      const normalised = {
        id:                   raw.id,
        commit_hash:          raw.commit_hash,
        summary:              raw.summary,
        risk_level:           raw.risk_level,
        change_type:          c.change_type          || 'other',
        files_changed:        raw.files_changed       ?? 0,
        lines_added:          raw.lines_added         ?? 0,
        lines_removed:        raw.lines_removed       ?? 0,
        commit_message:       c.commit_message        || '',
        author:               c.author               || '',
        recommendations:      c.recommendations      || [],
        impact_areas:         c.impact_areas         || [],
        security_concerns:    c.security_concerns    || [],
        maintainability_score: raw.maintainability_score ?? 70,
        security_score:       raw.security_score      ?? 100,
        performance_score:    raw.performance_score   ?? 100,
        overall_score:        c.overall_score         ?? 7,
        full_analysis:        c.full_analysis         || '',
        autofix_available:    true,
        _savedId:             raw.id,   // keep for navigation
      };

      setResult(normalised);
      toast.success('Full analysis saved to history!', {
        description: `Analysis #${raw.id} stored — visible in Analysis History`,
        action: {
          label: 'View',
          onClick: () => router.push(`/repositories/${repoId}/analysis/${raw.id}`),
        },
      });
    } catch (e) { const m = e.message || 'Full analysis failed'; setError(m); toast.error(m); }
    finally { setLoading(false); }
  };

  /* ── Streaming analysis ── */
  const runStream = async () => {
    if (!repoId || !commitSha) return toast.error('Enter repository ID and commit SHA');
    setLoading(true); setError(''); setResult(null);
    setStreamLines([{ text: `Starting analysis for ${commitSha.slice(0, 8)}…`, type: 'progress' }]);
    try {
      const res     = await analysisApi.stream({ repository_id: parseInt(repoId), commit_sha: commitSha });
      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n'); buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === 'progress') setStreamLines(p => [...p, { text: ev.message || ev.step, type: 'progress' }]);
            else if (ev.type === 'complete') {
              setResult(ev.result);
              setStreamLines(p => [...p, { text: 'Analysis complete!', type: 'complete' }]);
              toast.success('Analysis complete!');
            } else if (ev.type === 'error') {
              setError(ev.message);
              setStreamLines(p => [...p, { text: ev.message, type: 'error' }]);
            }
          } catch {}
        }
      }
    } catch (e) { const m = e.message || 'Stream failed'; setError(m); toast.error(m); }
    finally { setLoading(false); }
  };

  const handleChat = async () => {
    if (!result?.id) return toast.error('Save analysis first to start chat');
    try {
      const session = await chatApi.start(result.id);
      router.push(`/chat?session=${session.session_id}`);
    } catch { toast.error('Could not start chat session'); }
  };

  /* ── Input field style ── */
  const inputStyle = {
    background: '#0d0d0d', border: '1px solid #222',
    color: 'rgba(255,255,255,0.72)', width: '100%',
    borderRadius: 12, padding: '10px 14px',
    fontSize: 13, outline: 'none', transition: 'border-color 0.15s',
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">

        {/* ── Back + header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mb-6">
          <Link href="/analysis">
            <button className="flex items-center gap-1.5 text-[11.5px] cursor-pointer mb-4 transition-colors duration-150"
              style={{ color: 'rgba(255,255,255,0.28)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; }}>
              <ArrowLeft size={12} /> Analysis Hub
            </button>
          </Link>
          <h1 className="text-[20px] font-black text-white/88 leading-none mb-1">Run Analysis</h1>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Instant AI review of any commit — choose Quick, Streaming, or Full (saves to history)
          </p>
        </motion.div>

        {/* ── Input card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-5 mb-4"
          style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
        >
          {/* Top accent line */}
          <div className="w-full h-[1.5px] rounded-full mb-5" style={{ background: 'linear-gradient(90deg, rgba(159,18,57,0.60), transparent)' }} />

          <div className="grid md:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Repository ID
              </label>
              <input
                value={repoId}
                onChange={e => setRepoId(e.target.value)}
                placeholder="e.g. 20"
                style={inputStyle}
                onFocus={e  => { e.target.style.borderColor = 'rgba(159,18,57,0.40)'; }}
                onBlur={e   => { e.target.style.borderColor = '#222'; }}
              />
            </div>
            <div>
              <label className="block text-[10.5px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Commit SHA
              </label>
              <input
                value={commitSha}
                onChange={e => setCommitSha(e.target.value)}
                placeholder="full or short SHA"
                style={{ ...inputStyle, fontFamily: 'var(--font-mono, monospace)' }}
                onFocus={e  => { e.target.style.borderColor = 'rgba(159,18,57,0.40)'; }}
                onBlur={e   => { e.target.style.borderColor = '#222'; }}
              />
            </div>
          </div>

          {/* Mode toggle + run button */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Mode toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #222' }}>
              {[
                { id: 'quick',  label: 'Quick',     Icon: Zap      },
                { id: 'stream', label: 'Streaming',  Icon: Radio    },
                { id: 'full',   label: 'Full',       Icon: Database },
              ].map((m, idx, arr) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className="flex items-center gap-1.5 px-4 py-2 text-[11.5px] font-semibold cursor-pointer transition-all duration-150"
                  style={{
                    background: mode === m.id ? 'rgba(159,18,57,0.15)' : 'transparent',
                    color: mode === m.id ? 'rgba(220,80,100,0.90)' : 'rgba(255,255,255,0.35)',
                    borderRight: idx < arr.length - 1 ? '1px solid #222' : 'none',
                  }}
                  title={
                    m.id === 'quick'  ? 'Instant result, not saved to history' :
                    m.id === 'stream' ? 'Live SSE stream, not saved to history' :
                    'Saves to Analysis History — viewable anytime'
                  }
                >
                  <m.Icon size={11} /> {m.label}
                </button>
              ))}
            </div>

            {/* Mode hint */}
            {mode === 'full' && (
              <span className="text-[11px] flex items-center gap-1" style={{ color: '#6aab8e' }}>
                <Database size={10} /> Saves to Analysis History
              </span>
            )}

            {/* Run button */}
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={mode === 'stream' ? runStream : mode === 'full' ? runFull : runQuick}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: 'rgba(159,18,57,0.14)', border: '1px solid rgba(159,18,57,0.32)', color: 'rgba(220,80,100,0.92)' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(159,18,57,0.22)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.14)'; }}
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border border-t-transparent animate-spin" style={{ borderColor: 'rgba(220,80,100,0.5)', borderTopColor: 'transparent' }} />
                  Analyzing…
                </>
              ) : (
                <><Play size={12} /> Run Analysis</>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* ── Stream log ── */}
        <AnimatePresence>
          {streamLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl overflow-hidden mb-4"
              style={{ border: '1px solid #1c1c1c', background: '#090909' }}
            >
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #161616' }}>
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: loading ? '#6aab8e' : '#6aab8e',
                    boxShadow: loading ? '0 0 8px rgba(106,171,142,0.6)' : 'none',
                    animation: loading ? 'pulse 1s ease-in-out infinite' : 'none',
                  }}
                />
                <span className="text-[10.5px] font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {loading ? 'Streaming…' : 'Analysis Log'}
                </span>
              </div>
              <div className="p-4 space-y-1.5 max-h-52 overflow-y-auto">
                {streamLines.map((line, i) => <StreamLine key={i} text={line.text} type={line.type} />)}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Error ── */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-start gap-3 p-4 rounded-xl mb-4"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}
          >
            <AlertTriangle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
            <p className="text-[12.5px]" style={{ color: '#f87171' }}>{error}</p>
          </motion.div>
        )}

        {/* ── Result ── */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-4"
            >
              {/* Summary card */}
              <div
                className="rounded-2xl p-5"
                style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderLeft: '3px solid rgba(159,18,57,0.55)' }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(159,18,57,0.10)', border: '1px solid rgba(159,18,57,0.20)' }}>
                      <GitCommit size={14} style={{ color: 'rgba(210,70,90,0.80)' }} />
                    </div>
                    <div>
                      <p className="text-[11px] font-mono mb-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                        {result.commit_hash?.slice(0, 12)}
                      </p>
                      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.40)' }}>
                        {result.author} · {result.change_type}
                      </p>
                    </div>
                  </div>
                  <RiskBadge level={result.risk_level} />
                </div>
                <p className="text-[13px] leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.68)' }}>
                  {result.summary}
                </p>
                <div className="flex items-center gap-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                  <span><FileCode size={10} className="inline mr-1" />{result.files_changed} files</span>
                  <span style={{ color: '#6aab8e' }}>+{result.lines_added}</span>
                  <span style={{ color: '#f87171' }}>-{result.lines_removed}</span>
                </div>
              </div>

              {/* Saved-to-history notice */}
              {result._savedId && (
                <div
                  className="flex items-center justify-between p-3.5 rounded-xl"
                  style={{ background: 'rgba(106,171,142,0.06)', border: '1px solid rgba(106,171,142,0.20)' }}
                >
                  <div className="flex items-center gap-2">
                    <Database size={12} style={{ color: '#6aab8e' }} />
                    <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                      Saved as Analysis <span className="font-mono font-bold" style={{ color: '#6aab8e' }}>#{result._savedId}</span>
                      {' '}— visible in Analysis History
                    </span>
                  </div>
                  <button
                    onClick={() => router.push(`/repositories/${repoId}/analysis/${result._savedId}`)}
                    className="text-[11.5px] font-semibold cursor-pointer transition-colors duration-150"
                    style={{ color: '#6aab8e' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'rgba(106,171,142,1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#6aab8e'; }}
                  >
                    View detail →
                  </button>
                </div>
              )}

              {/* Score gauges */}
              <div className="rounded-2xl p-6" style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] mb-5" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  Quality Scores
                </p>
                <div className="flex items-center justify-around flex-wrap gap-6">
                  <ScoreGauge score={result.overall_score > 10 ? result.overall_score : (result.overall_score || 0) * 10} label="Overall" />
                  <ScoreGauge score={result.security_score || 0}       label="Security" />
                  <ScoreGauge score={result.maintainability_score || 0} label="Maintainability" />
                  <ScoreGauge score={result.performance_score || 0}    label="Performance" />
                </div>
              </div>

              {/* Full Analysis Report — only in Full mode */}
              {result.full_analysis && (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}>
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      AI Analysis Report
                    </p>
                    {result._savedId && (
                      <button
                        onClick={() => router.push(`/repositories/${repoId}/analysis/${result._savedId}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150"
                        style={{ background: 'rgba(159,18,57,0.10)', border: '1px solid rgba(159,18,57,0.22)', color: 'rgba(210,70,90,0.88)' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.18)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.10)'; }}
                      >
                        View Full Detail →
                      </button>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="rounded-xl p-4 overflow-x-auto" style={{ background: '#090909', border: '1px solid #181818' }}>
                      <pre className="text-[12px] leading-relaxed whitespace-pre-wrap font-mono" style={{ color: 'rgba(255,255,255,0.65)' }}>
                        {result.full_analysis}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}>
                  <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                      Recommendations <span style={{ color: 'rgba(255,255,255,0.22)', fontWeight: 400 }}>({result.recommendations.length})</span>
                    </p>
                    <Link href="/autofix">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150"
                        style={{ background: 'rgba(106,171,142,0.10)', border: '1px solid rgba(106,171,142,0.22)', color: '#6aab8e' }}>
                        <Wrench size={10} /> Auto-Fix
                      </button>
                    </Link>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {result.recommendations.map((rec, i) => <RecCard key={i} rec={rec} index={i} />)}
                  </div>
                </div>
              )}

              {/* Security concerns */}
              {result.security_concerns?.length > 0 && (
                <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <div className="px-5 py-3.5" style={{ borderBottom: '1px solid rgba(239,68,68,0.12)', background: 'rgba(239,68,68,0.04)' }}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] flex items-center gap-2" style={{ color: '#f87171' }}>
                      <Shield size={11} /> Security Concerns
                    </p>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.security_concerns.map((c, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12.5px]" style={{ color: 'rgba(255,255,255,0.58)' }}>
                        <AlertTriangle size={12} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat CTA */}
              <div
                className="flex items-center gap-4 p-4 rounded-xl"
                style={{ background: 'rgba(106,171,142,0.05)', border: '1px solid rgba(106,171,142,0.18)' }}
              >
                <MessageSquare size={16} style={{ color: '#6aab8e', flexShrink: 0 }} />
                <div className="flex-1">
                  <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>
                    Have questions about this review?
                  </p>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Start a conversation with AI about this specific analysis
                  </p>
                </div>
                <button
                  onClick={handleChat}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-all duration-150"
                  style={{ background: 'rgba(106,171,142,0.12)', border: '1px solid rgba(106,171,142,0.25)', color: '#6aab8e' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(106,171,142,0.20)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(106,171,142,0.12)'; }}
                >
                  Chat <ChevronRight size={11} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
