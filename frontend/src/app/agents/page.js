'use client';
// agents/page.js — Multi-Agent Analysis
// Three specialist AI agents (Security, Performance, Architecture)
// run IN PARALLEL via SSE streaming — visualised as a live "war room"

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Layers, GitCommit, Hash,
  Play, CheckCircle, AlertTriangle, ChevronDown,
  Cpu, Activity,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { agentsApi } from '@/lib/api/agents';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────
   AGENT PALETTE
───────────────────────────────────────────────────── */
const AGENTS = [
  {
    id: 'security',
    name: 'Security',
    label: 'OWASP · XSS · Injection · Secrets',
    Icon: Shield,
    color: '#ef4444',
    dimColor: 'rgba(239,68,68,0.08)',
    midColor: 'rgba(239,68,68,0.18)',
  },
  {
    id: 'performance',
    name: 'Performance',
    label: 'N+1 · Memory Leaks · Complexity · I/O',
    Icon: Zap,
    color: '#f59e0b',
    dimColor: 'rgba(245,158,11,0.08)',
    midColor: 'rgba(245,158,11,0.18)',
  },
  {
    id: 'architecture',
    name: 'Architecture',
    label: 'SOLID · Coupling · Patterns · Structure',
    Icon: Layers,
    color: '#06b6d4',
    dimColor: 'rgba(6,182,212,0.08)',
    midColor: 'rgba(6,182,212,0.18)',
  },
];

/* ─────────────────────────────────────────────────────
   LIVE SCAN LINE — animated while running
───────────────────────────────────────────────────── */
function ScanLine({ color }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[1px] pointer-events-none"
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${color} 40%, ${color} 60%, transparent 100%)`,
        opacity: 0.7,
      }}
      animate={{ top: ['2%', '98%'] }}
      transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* ─────────────────────────────────────────────────────
   THINKING DOTS
───────────────────────────────────────────────────── */
function ThinkingDots({ color }) {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className="w-1 h-1 rounded-full"
          style={{ background: color }}
          animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.1, 0.8] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SCORE ARC — small circular score display
───────────────────────────────────────────────────── */
function ScoreArc({ score, color, size = 52 }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score || 0));
  const dash = (pct / 100) * circ;
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <span className="absolute text-[12px] font-bold tabular-nums" style={{ color }}>
        {pct}
      </span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   AGENT CARD
───────────────────────────────────────────────────── */
function AgentCard({ agent, status, report }) {
  const { Icon, color, dimColor, midColor, name, label } = agent;
  const [expanded, setExpanded] = useState(false);

  const isIdle     = status === 'idle';
  const isRunning  = status === 'running';
  const isComplete = status === 'complete';
  const isError    = status === 'error';

  const statusLabel = { idle: 'Waiting', running: 'Scanning', complete: 'Done', error: 'Error' }[status] || 'Waiting';

  const getText = (v) => typeof v === 'string' ? v : v?.description || v?.text || '';

  return (
    <motion.div
      layout
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: isRunning
          ? `linear-gradient(160deg, ${dimColor} 0%, rgba(6,6,6,0.95) 60%)`
          : isComplete
          ? `linear-gradient(160deg, ${dimColor} 0%, rgba(6,6,6,0.95) 70%)`
          : 'rgba(8,8,8,0.9)',
        border: `1px solid ${isIdle ? 'rgba(255,255,255,0.07)' : isError ? 'rgba(239,68,68,0.3)' : midColor}`,
        boxShadow: isRunning ? `0 0 28px ${dimColor}, 0 0 2px ${midColor}` : 'none',
        minHeight: '180px',
      }}
      transition={{ duration: 0.35 }}
    >
      {/* Scan line when running */}
      {isRunning && <ScanLine color={color} />}

      {/* Completed top accent bar */}
      {isComplete && (
        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }} />
      )}

      <div className="p-5 flex flex-col gap-4 flex-1">

        {/* Header row */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: dimColor,
                border: `1px solid ${isIdle ? 'rgba(255,255,255,0.07)' : midColor}`,
                boxShadow: (isRunning || isComplete) ? `0 0 12px ${dimColor}` : 'none',
              }}
            >
              <Icon size={16} style={{ color: isIdle ? 'rgba(255,255,255,0.3)' : color }} />
            </div>

            {/* Title + desc */}
            <div>
              <p className="text-[13px] font-semibold" style={{ color: isIdle ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.88)' }}>
                {name}
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{label}</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isRunning
              ? <ThinkingDots color={color} />
              : <motion.span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background: isComplete ? color : isError ? '#ef4444' : 'rgba(255,255,255,0.18)',
                  }}
                  animate={isComplete ? { scale: [1, 1.4, 1], opacity: [1, 0.6, 1] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                />
            }
            <span
              className="text-[10px] font-medium"
              style={{ color: isRunning ? color : isComplete ? color : isError ? '#ef4444' : 'rgba(255,255,255,0.25)' }}
            >
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Score + summary when complete */}
        {isComplete && report && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-start gap-4"
          >
            {report.score !== undefined && (
              <ScoreArc score={report.score} color={color} />
            )}
            {report.summary && (
              <p className="text-[11.5px] leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {report.summary.slice(0, 120)}{report.summary.length > 120 ? '…' : ''}
              </p>
            )}
          </motion.div>
        )}

        {/* Expand toggle for details */}
        {isComplete && report && (report.issues?.length || report.recommendations?.length) ? (
          <>
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-[11px] transition-colors w-fit"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <ChevronDown
                size={12}
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              />
              {expanded ? 'Hide' : `View ${(report.issues?.length || 0) + (report.recommendations?.length || 0)} findings`}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden"
                >
                  <div
                    className="rounded-xl p-3.5 space-y-2"
                    style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${midColor}` }}
                  >
                    {report.issues?.slice(0, 3).map((issue, i) => (
                      <div key={`i${i}`} className="flex gap-2 items-start">
                        <AlertTriangle size={10} className="shrink-0 mt-[3px]" style={{ color }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {getText(issue)}
                        </p>
                      </div>
                    ))}
                    {report.recommendations?.slice(0, 3).map((rec, i) => (
                      <div key={`r${i}`} className="flex gap-2 items-start">
                        <CheckCircle size={10} className="shrink-0 mt-[3px]" style={{ color: '#00e599' }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                          {getText(rec)}
                        </p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : null}

        {/* Idle placeholder lines */}
        {isIdle && (
          <div className="space-y-2 mt-auto">
            {[60, 80, 45].map((w, i) => (
              <div key={i} className="h-[2px] rounded-full" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   STREAM LOG — terminal-style
───────────────────────────────────────────────────── */
function StreamLog({ lines }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);

  if (!lines.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(4,4,4,0.95)' }}
    >
      {/* Terminal header */}
      <div
        className="flex items-center gap-2 px-4 py-2.5"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>agent.log</span>
      </div>

      <div ref={ref} className="px-4 py-3 space-y-1 max-h-28 overflow-y-auto font-mono">
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] leading-relaxed"
            style={{
              color: line.startsWith('✓')
                ? '#00e599'
                : line.startsWith('▸')
                ? 'rgba(255,255,255,0.5)'
                : 'rgba(255,255,255,0.3)',
            }}
          >
            <span style={{ color: 'rgba(255,255,255,0.15)' }}>{String(i + 1).padStart(2, '0')} </span>
            {line}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   MERGED SCORE BAR
───────────────────────────────────────────────────── */
function MergedScoreBar({ label, value, color }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
        <span className="text-[12px] font-bold font-mono tabular-nums" style={{ color }}>{pct}</span>
      </div>
      <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}60` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MERGED REPORT SECTION
───────────────────────────────────────────────────── */
function MergedReport({ merged }) {
  const getText = (v) => typeof v === 'string' ? v : v?.description || v?.text || '';

  // overall_score from backend is 1-10 scale → normalise to 0-100
  const rawOverall = merged.overall_score;
  const overall100 = rawOverall !== undefined
    ? (rawOverall <= 10 ? rawOverall * 10 : rawOverall)
    : undefined;

  // architecture_score lives in agent_reports.architecture.score
  const archScore = merged.agent_reports?.architecture?.score ?? merged.maintainability_score;

  const scores = [
    { label: 'Overall',       value: overall100,              color: '#00e599' },
    { label: 'Security',      value: merged.security_score,   color: '#ef4444' },
    { label: 'Performance',   value: merged.performance_score,color: '#f59e0b' },
    { label: 'Architecture',  value: archScore,               color: '#06b6d4' },
  ].filter(s => s.value !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,229,153,0.1)', border: '1px solid rgba(0,229,153,0.2)' }}
        >
          <Activity size={13} style={{ color: '#00e599' }} />
        </div>
        <h2 className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
          Merged Report
        </h2>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
          style={{ background: 'rgba(0,229,153,0.1)', color: '#00e599', border: '1px solid rgba(0,229,153,0.2)' }}
        >
          3 agents
        </span>
      </div>

      {/* Scores + Summary in 2-col */}
      <div className="grid grid-cols-5 gap-4">

        {/* Scores — left 2 cols */}
        {scores.length > 0 && (
          <div
            className="col-span-2 rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Quality Scores
            </p>
            <div className="space-y-3">
              {scores.map(s => <MergedScoreBar key={s.label} {...s} />)}
            </div>
          </div>
        )}

        {/* Summary — right 3 cols */}
        {merged.summary && (
          <div
            className="col-span-3 rounded-2xl p-5"
            style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Summary
            </p>
            <p className="text-[13px] leading-[1.75]" style={{ color: 'rgba(255,255,255,0.58)' }}>
              {merged.summary}
            </p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {merged.recommendations?.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
          >
            <p className="text-[12px] font-semibold" style={{ color: 'rgba(255,255,255,0.65)' }}>
              All Recommendations
            </p>
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {merged.recommendations.length}
            </span>
          </div>
          <div className="p-4 space-y-2">
            {merged.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 px-3.5 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span
                  className="text-[10px] font-mono font-bold w-5 shrink-0 mt-[2px] text-right"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  {i + 1}
                </span>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {getText(rec)}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
export default function AgentsPage() {
  const [repoId,    setRepoId]    = useState('');
  const [sha,       setSha]       = useState('');
  const [loading,   setLoading]   = useState(false);
  const [status,    setStatus]    = useState({ security: 'idle', performance: 'idle', architecture: 'idle' });
  const [reports,   setReports]   = useState({});
  const [merged,    setMerged]    = useState(null);
  const [log,       setLog]       = useState([]);

  const allDone  = Object.values(status).every(s => s === 'complete');
  const anyRunning = Object.values(status).some(s => s === 'running');

  // Map "SecurityAgent" → "security", "PerformanceAgent" → "performance", etc.
  const toAgentKey = (name = '') =>
    name.toLowerCase().replace('agent', '').trim();

  // Normalize per-agent raw report to a standard {score, summary, issues, recommendations} shape
  const normalizeReport = (key, raw) => {
    if (!raw) return null;
    if (key === 'security') return {
      score: raw.score,
      summary: raw.threat_summary,
      issues: (raw.vulnerabilities || []).map(v => v?.description || v?.type || String(v)),
      recommendations: raw.secure_coding_practices || [],
    };
    if (key === 'performance') return {
      score: raw.score,
      summary: raw.performance_summary,
      issues: (raw.issues || []).map(i => i?.description || i?.type || String(i)),
      recommendations: raw.optimization_opportunities || [],
    };
    if (key === 'architecture') return {
      score: raw.score,
      summary: raw.architecture_summary,
      issues: (raw.anti_patterns_found || []).map(x => x?.description || String(x)),
      recommendations: raw.architecture_recommendations || raw.tech_debt_items || [],
    };
    return raw;
  };

  const runAgents = async () => {
    if (!repoId || !sha) return toast.error('Enter Repository ID and Commit SHA');
    setLoading(true);
    setMerged(null);
    setReports({});
    setLog([]);
    setStatus({ security: 'idle', performance: 'idle', architecture: 'idle' });

    try {
      const res = await agentsApi.stream({ repository_id: parseInt(repoId), commit_sha: sha });

      // Surface HTTP errors (404 repo not found, 500, etc.) immediately
      if (!res.ok) {
        const errText = await res.text();
        let detail = `HTTP ${res.status}`;
        try { detail = JSON.parse(errText).detail || detail; } catch { /* raw text */ }
        throw new Error(detail);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      // Track the current SSE named event type (sits on the `event:` line BEFORE `data:`)
      let sseEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          // Named SSE event line — remember it for the next data line
          if (line.startsWith('event: ')) {
            sseEvent = line.slice(7).trim();
            continue;
          }
          if (!line.startsWith('data: ')) continue;

          try {
            const payload = JSON.parse(line.slice(6));

            if (sseEvent === 'progress') {
              const { step, message } = payload;
              setLog(p => [...p, `▸ ${message || step || ''}`]);
              // When agents are about to start — mark all as running
              if (step === 'agents_launch' || step === 'agents_running') {
                setStatus({ security: 'running', performance: 'running', architecture: 'running' });
              }
            } else if (sseEvent === 'agent_complete') {
              // payload only has { agent, status, message, progress } — no report data yet
              const key = toAgentKey(payload.agent);
              if (['security', 'performance', 'architecture'].includes(key)) {
                setStatus(p => ({ ...p, [key]: 'complete' }));
              }
              setLog(p => [...p, `✓ ${payload.agent} — ${payload.status === 'success' ? 'complete' : 'done'}`]);
            } else if (sseEvent === 'complete') {
              // payload.result is the full merged report
              // Extract per-agent reports and normalise field names for AgentCard display
              const agentReports = payload.result?.agent_reports || {};
              setReports({
                security:     normalizeReport('security',     agentReports.security),
                performance:  normalizeReport('performance',  agentReports.performance),
                architecture: normalizeReport('architecture', agentReports.architecture),
              });
              setMerged(payload.result);
              setStatus({ security: 'complete', performance: 'complete', architecture: 'complete' });
              setLog(p => [...p, '✓ All agents complete — results merged']);
              toast.success('Multi-agent analysis complete!');
            }
          } catch { /* malformed SSE line — skip */ }

          // Reset event type after consuming the data line
          sseEvent = 'message';
        }
      }
    } catch (e) {
      AGENTS.forEach(a => setStatus(p => ({ ...p, [a.id]: 'error' })));
      toast.error(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(0,229,153,0.08)', border: '1px solid rgba(0,229,153,0.18)' }}
          >
            <Cpu size={16} style={{ color: '#00e599' }} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">Multi-Agent Analysis</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              3 specialist AI agents run in parallel — Security · Performance · Architecture
            </p>
          </div>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-auto flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(0,229,153,0.08)', border: '1px solid rgba(0,229,153,0.2)' }}
            >
              <CheckCircle size={12} style={{ color: '#00e599' }} />
              <span className="text-[11px] font-medium" style={{ color: '#00e599' }}>Analysis complete</span>
            </motion.div>
          )}
        </div>

        {/* ── Input card ── */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-end gap-4">
            {/* Repo ID */}
            <div className="w-36">
              <label className="text-[9.5px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Repo ID
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <Hash size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <input
                  value={repoId}
                  onChange={e => setRepoId(e.target.value)}
                  placeholder="e.g. 26"
                  className="bg-transparent w-full text-[13px] text-white/80 placeholder:text-white/18 outline-none tabular-nums"
                />
              </div>
            </div>

            {/* Commit SHA */}
            <div className="flex-1">
              <label className="text-[9.5px] font-semibold uppercase tracking-widest block mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                Commit SHA
              </label>
              <div
                className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                <GitCommit size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <input
                  value={sha}
                  onChange={e => setSha(e.target.value)}
                  placeholder="full commit SHA"
                  className="bg-transparent w-full text-[13px] font-mono text-white/80 placeholder:text-white/18 outline-none"
                />
              </div>
            </div>

            {/* Run button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={runAgents}
              disabled={loading || !repoId || !sha}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: '#00e599', color: '#000' }}
            >
              {loading
                ? <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Running…
                  </>
                : <><Play size={14} fill="#000" /> Run All Agents</>
              }
            </motion.button>
          </div>

          {/* Agent indicator pills */}
          <div className="flex items-center gap-2 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {AGENTS.map(({ id, name, color, Icon }) => (
              <div key={id} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center"
                  style={{
                    background: status[id] === 'idle' ? 'rgba(255,255,255,0.04)' : `${color}18`,
                    border: `1px solid ${status[id] === 'idle' ? 'rgba(255,255,255,0.07)' : `${color}30`}`,
                  }}
                >
                  <Icon size={10} style={{ color: status[id] === 'idle' ? 'rgba(255,255,255,0.2)' : color }} />
                </div>
                <span className="text-[10px]" style={{ color: status[id] === 'idle' ? 'rgba(255,255,255,0.2)' : color }}>
                  {name}
                </span>
                {id !== 'architecture' && (
                  <span className="text-[9px] mx-1" style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
                )}
              </div>
            ))}
            <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.18)' }}>
              Executes in parallel via asyncio
            </span>
          </div>
        </div>

        {/* ── Agent cards ── */}
        <div className="grid grid-cols-3 gap-4">
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              status={status[agent.id]}
              report={reports[agent.id]}
            />
          ))}
        </div>

        {/* ── Stream log ── */}
        <StreamLog lines={log} />

        {/* ── Merged result ── */}
        <AnimatePresence>
          {merged && <MergedReport key="merged" merged={merged} />}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
