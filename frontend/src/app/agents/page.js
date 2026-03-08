'use client';
// agents/page.js — Multi-Agent War Room (Full Rebuild)
// Full-viewport war room: pulsing glows · cycling messages · EKG lines
// · animated score arcs · terminal log · impressive merged report

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Zap, Layers, GitCommit, Hash,
  Play, CheckCircle, AlertTriangle, ChevronDown,
  Cpu, Activity, Radio, Wifi,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { agentsApi } from '@/lib/api/agents';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────
   AGENT DEFINITIONS
───────────────────────────────────────────────────── */
const AGENTS = [
  {
    id: 'security',
    name: 'Security',
    subtitle: 'OWASP · XSS · Injection · Secrets',
    Icon: Shield,
    color: '#ef4444',
    dim: 'rgba(239,68,68,0.08)',
    mid: 'rgba(239,68,68,0.22)',
    messages: [
      'Scanning OWASP Top 10…',
      'Checking for SQL injection…',
      'Analyzing authentication flows…',
      'Looking for exposed secrets…',
      'Reviewing input validation…',
    ],
  },
  {
    id: 'performance',
    name: 'Performance',
    subtitle: 'N+1 · Memory Leaks · Complexity · I/O',
    Icon: Zap,
    color: '#f59e0b',
    dim: 'rgba(245,158,11,0.08)',
    mid: 'rgba(245,158,11,0.22)',
    messages: [
      'Detecting N+1 query patterns…',
      'Checking memory allocation…',
      'Analyzing async/await patterns…',
      'Profiling algorithmic complexity…',
      'Scanning for blocking I/O…',
    ],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    subtitle: 'SOLID · Coupling · Patterns · Structure',
    Icon: Layers,
    color: '#06b6d4',
    dim: 'rgba(6,182,212,0.08)',
    mid: 'rgba(6,182,212,0.22)',
    messages: [
      'Reviewing SOLID principles…',
      'Analyzing module coupling…',
      'Checking design patterns…',
      'Detecting anti-patterns…',
      'Evaluating code structure…',
    ],
  },
];

/* ─────────────────────────────────────────────────────
   SCAN LINE — sweeps top → bottom when running
───────────────────────────────────────────────────── */
function ScanLine({ color }) {
  return (
    <motion.div
      className="absolute left-0 right-0 h-[1px] pointer-events-none z-10"
      style={{ background: `linear-gradient(90deg, transparent 0%, ${color} 30%, ${color} 70%, transparent 100%)`, opacity: 0.9 }}
      animate={{ top: ['0%', '100%'] }}
      transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
    />
  );
}

/* EKGLine removed — using clean ScanLine only */

/* ─────────────────────────────────────────────────────
   SCORE ARC — animated circular score
───────────────────────────────────────────────────── */
function ScoreArc({ score, color, size = 80 }) {
  const r = (size / 2) - 7;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score || 0));
  const dash = (pct / 100) * circ;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    let start = 0;
    const step = Math.ceil(pct / 40);
    const iv = setInterval(() => {
      start = Math.min(start + step, pct);
      setDisplayed(start);
      if (start >= pct) clearInterval(iv);
    }, 25);
    return () => clearInterval(iv);
  }, [pct]);

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 6px ${color}90)` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[18px] font-black tabular-nums leading-none" style={{ color }}>{displayed}</span>
        <span className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>score</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   AGENT CARD
───────────────────────────────────────────────────── */
function AgentCard({ agent, status, report }) {
  const { Icon, color, dim, mid, name, subtitle, messages } = agent;
  const [expanded, setExpanded] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);

  const isIdle     = status === 'idle';
  const isRunning  = status === 'running';
  const isComplete = status === 'complete';
  const isError    = status === 'error';

  // Cycle through status messages while running
  useEffect(() => {
    if (!isRunning) { setMsgIdx(0); return; }
    const iv = setInterval(() => setMsgIdx(i => (i + 1) % messages.length), 2200);
    return () => clearInterval(iv);
  }, [isRunning, messages.length]);

  const getText = (v) => typeof v === 'string' ? v : v?.description || v?.text || '';

  const borderColor = isError   ? 'rgba(239,68,68,0.4)'
    : isRunning   ? mid
    : isComplete  ? `${color}35`
    : 'rgba(255,255,255,0.07)';

  const bgGradient = isRunning
    ? `linear-gradient(160deg, ${dim} 0%, rgba(5,5,5,0.98) 60%)`
    : isComplete
    ? `linear-gradient(160deg, ${dim} 0%, rgba(5,5,5,0.98) 75%)`
    : 'rgba(8,8,8,0.95)';

  return (
    <motion.div
      className="relative flex flex-col rounded-2xl overflow-hidden"
      style={{
        background: bgGradient,
        border: `1px solid ${borderColor}`,
        boxShadow: isComplete ? `0 0 20px ${dim}` : 'none',
      }}
      animate={{ minHeight: isRunning ? 200 : 260 }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Pulsing glow overlay — isolated so it doesn't conflict with size animation */}
      {isRunning && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          animate={{
            boxShadow: [
              `0 0 30px ${dim}, 0 0 60px ${dim}`,
              `0 0 50px ${color}25, 0 0 100px ${dim}`,
              `0 0 30px ${dim}, 0 0 60px ${dim}`,
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Top accent bar when complete */}
      {isComplete && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="h-[2px] w-full shrink-0 origin-left"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />
      )}

      {/* Scan line when running */}
      {isRunning && <ScanLine color={color} />}

      <div className="flex flex-col flex-1 p-6 gap-5">

        {/* ── Header ── */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Icon box */}
            <div
              className="rounded-2xl flex items-center justify-center shrink-0 relative"
              style={{
                width: 52, height: 52,
                background: dim,
                border: `1px solid ${isIdle ? 'rgba(255,255,255,0.07)' : mid}`,
              }}
            >
              {isRunning && (
                <motion.div
                  className="absolute inset-0 rounded-2xl"
                  animate={{ scale: [1, 1.12, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ background: mid }}
                />
              )}
              <Icon size={22} style={{ color: isIdle ? 'rgba(255,255,255,0.25)' : color, position: 'relative', zIndex: 1 }} />
            </div>

            <div>
              <p className="text-[15px] font-bold" style={{ color: isIdle ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)' }}>
                {name}
              </p>
              <p className="text-[10.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{subtitle}</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-2 shrink-0">
            {isRunning ? (
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.span
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: color }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.1, 0.7] }}
                    transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.22 }}
                  />
                ))}
              </div>
            ) : (
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{ background: isComplete ? color : isError ? '#ef4444' : 'rgba(255,255,255,0.15)' }}
                animate={isComplete ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] } : {}}
                transition={{ duration: 2.5, repeat: Infinity }}
              />
            )}
            <span className="text-[11px] font-semibold" style={{
              color: isRunning ? color : isComplete ? color : isError ? '#ef4444' : 'rgba(255,255,255,0.2)',
            }}>
              {isIdle ? 'Waiting' : isRunning ? 'Scanning' : isComplete ? 'Done' : 'Error'}
            </span>
          </div>
        </div>

        {/* ── Running state: cycling message ── */}
        {isRunning && (
          <motion.div
            key={msgIdx}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-center gap-2"
          >
            <Radio size={11} style={{ color, opacity: 0.7 }} className="shrink-0" />
            <p className="text-[12px] font-mono" style={{ color: 'rgba(255,255,255,0.45)' }}>
              {messages[msgIdx]}
            </p>
          </motion.div>
        )}

        {/* ── Complete: score + summary ── */}
        {isComplete && report && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-start gap-5"
          >
            {report.score !== undefined && (
              <ScoreArc score={report.score} color={color} size={76} />
            )}
            {report.summary && (
              <p className="text-[12.5px] leading-[1.75] flex-1" style={{ color: 'rgba(255,255,255,0.52)' }}>
                {report.summary.slice(0, 160)}{report.summary.length > 160 ? '…' : ''}
              </p>
            )}
          </motion.div>
        )}

        {/* ── Idle: placeholder lines ── */}
        {isIdle && (
          <div className="space-y-2 flex-1 flex flex-col justify-end">
            {[70, 90, 50, 75].map((w, i) => (
              <div key={i} className="h-[2px] rounded-full" style={{ width: `${w}%`, background: 'rgba(255,255,255,0.03)' }} />
            ))}
          </div>
        )}

        {/* ── Bottom fade separator when running ── */}
        {isRunning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mt-auto h-[1px] w-full rounded-full"
            style={{ background: `linear-gradient(90deg, transparent, ${color}55, transparent)` }}
          />
        )}

        {/* ── Expand findings button ── */}
        {isComplete && report && (report.issues?.length || report.recommendations?.length) ? (
          <div className="mt-auto">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors w-fit"
              style={{ color: 'rgba(255,255,255,0.3)' }}
            >
              <ChevronDown
                size={13}
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}
              />
              {expanded ? 'Hide findings' : `View ${(report.issues?.length || 0) + (report.recommendations?.length || 0)} findings`}
            </button>

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden mt-3"
                >
                  <div
                    className="rounded-xl p-4 space-y-2"
                    style={{ background: 'rgba(0,0,0,0.5)', border: `1px solid ${mid}` }}
                  >
                    {report.issues?.slice(0, 4).map((issue, i) => (
                      <motion.div
                        key={`i${i}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex gap-2 items-start"
                      >
                        <AlertTriangle size={10} className="shrink-0 mt-[3px]" style={{ color }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.48)' }}>
                          {getText(issue)}
                        </p>
                      </motion.div>
                    ))}
                    {report.recommendations?.slice(0, 3).map((rec, i) => (
                      <motion.div
                        key={`r${i}`}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: (report.issues?.length || 0) * 0.05 + i * 0.05 }}
                        className="flex gap-2 items-start"
                      >
                        <CheckCircle size={10} className="shrink-0 mt-[3px]" style={{ color: '#00e599' }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
                          {getText(rec)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   TERMINAL STREAM LOG
───────────────────────────────────────────────────── */
function StreamLog({ lines }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' });
  }, [lines]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-xl overflow-hidden"
      style={{ border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(3,3,3,0.97)' }}
    >
      <div className="flex items-center gap-2.5 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex gap-1.5">
          {['rgba(255,95,87,0.6)', 'rgba(254,188,46,0.6)', 'rgba(40,200,64,0.6)'].map((c, i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
          ))}
        </div>
        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.2)' }}>agent.log</span>
        <span className="ml-auto text-[10px] font-mono" style={{ color: 'rgba(0,229,153,0.4)' }}>
          {lines.length} events
        </span>
      </div>
      <div ref={ref} className="px-4 py-3 space-y-1 max-h-32 overflow-y-auto font-mono" style={{ scrollbarWidth: 'none' }}>
        {lines.map((line, i) => (
          <motion.p
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[11px] leading-relaxed flex items-start gap-2"
            style={{
              color: line.startsWith('✓') ? '#00e599' : line.startsWith('▸') ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.28)',
            }}
          >
            <span className="shrink-0" style={{ color: 'rgba(255,255,255,0.12)', minWidth: '20px' }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {line}
          </motion.p>
        ))}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   SCORE BAR — for merged report
───────────────────────────────────────────────────── */
function MergedScoreBar({ label, value, color }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.42)' }}>{label}</span>
        <span className="text-[14px] font-black font-mono tabular-nums" style={{ color }}>{pct}</span>
      </div>
      <div className="h-[3px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 8px ${color}70` }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   MERGED REPORT
───────────────────────────────────────────────────── */
function MergedReport({ merged }) {
  const getText = (v) => typeof v === 'string' ? v : v?.description || v?.text || '';
  const rawOverall = merged.overall_score;
  const overall100 = rawOverall !== undefined ? (rawOverall <= 10 ? rawOverall * 10 : rawOverall) : undefined;
  const archScore  = merged.agent_reports?.architecture?.score ?? merged.maintainability_score;

  const scores = [
    { label: 'Overall Score', value: overall100,              color: '#00e599' },
    { label: 'Security',      value: merged.security_score,   color: '#ef4444' },
    { label: 'Performance',   value: merged.performance_score,color: '#f59e0b' },
    { label: 'Architecture',  value: archScore,               color: '#06b6d4' },
  ].filter(s => s.value !== undefined);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4"
    >
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,229,153,0.1)', border: '1px solid rgba(0,229,153,0.22)' }}
        >
          <Activity size={13} style={{ color: '#00e599' }} />
        </div>
        <h2 className="text-[14px] font-bold text-white/80">Merged Report</h2>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'rgba(0,229,153,0.1)', color: '#00e599', border: '1px solid rgba(0,229,153,0.2)' }}
        >
          3 agents
        </span>
      </div>

      {/* Scores + Summary */}
      <div className="grid grid-cols-12 gap-4">
        {scores.length > 0 && (
          <div
            className="col-span-4 rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(8,8,8,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[9.5px] font-bold uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Quality Scores
            </p>
            <div className="space-y-4">
              {scores.map(s => <MergedScoreBar key={s.label} {...s} />)}
            </div>
          </div>
        )}
        {merged.summary && (
          <div
            className="col-span-8 rounded-2xl p-6"
            style={{ background: 'rgba(8,8,8,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[9.5px] font-bold uppercase tracking-[0.15em] mb-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Analysis Summary
            </p>
            <p className="text-[13.5px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.6)' }}>
              {merged.summary}
            </p>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {merged.recommendations?.length > 0 && (
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'rgba(8,8,8,0.95)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <p className="text-[13px] font-bold text-white/70">All Recommendations</p>
            <span className="text-[11px] font-mono" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {merged.recommendations.length}
            </span>
          </div>
          <div className="p-5 grid grid-cols-2 gap-3">
            {merged.recommendations.map((rec, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
              >
                <span className="text-[10px] font-mono font-bold w-5 shrink-0 mt-[2px] text-right"
                  style={{ color: 'rgba(255,255,255,0.15)' }}>
                  {i + 1}
                </span>
                <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.58)' }}>
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
  const [repoId,  setRepoId]  = useState('');
  const [sha,     setSha]     = useState('');
  const [loading, setLoading] = useState(false);
  const [status,  setStatus]  = useState({ security: 'idle', performance: 'idle', architecture: 'idle' });
  const [reports, setReports] = useState({});
  const [merged,  setMerged]  = useState(null);
  const [log,     setLog]     = useState([]);

  const allDone    = Object.values(status).every(s => s === 'complete');
  const anyRunning = Object.values(status).some(s => s === 'running');

  const toAgentKey = (name = '') => name.toLowerCase().replace('agent', '').trim();

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
      if (!res.ok) {
        const errText = await res.text();
        let detail = `HTTP ${res.status}`;
        try { detail = JSON.parse(errText).detail || detail; } catch { /* raw text */ }
        throw new Error(detail);
      }

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = '';
      let sseEvent = 'message';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          if (line.startsWith('event: ')) { sseEvent = line.slice(7).trim(); continue; }
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (sseEvent === 'progress') {
              const { step, message } = payload;
              setLog(p => [...p, `▸ ${message || step || ''}`]);
              if (step === 'agents_launch' || step === 'agents_running') {
                setStatus({ security: 'running', performance: 'running', architecture: 'running' });
              }
            } else if (sseEvent === 'agent_complete') {
              const key = toAgentKey(payload.agent);
              if (['security', 'performance', 'architecture'].includes(key)) {
                setStatus(p => ({ ...p, [key]: 'complete' }));
              }
              setLog(p => [...p, `✓ ${payload.agent} — ${payload.status === 'success' ? 'complete' : 'done'}`]);
            } else if (sseEvent === 'complete') {
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
      <div className="flex flex-col gap-5" style={{ minHeight: 'calc(100vh - 8rem)' }}>

        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
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
          </div>

          {/* Live / Complete badge */}
          <AnimatePresence mode="wait">
            {anyRunning && !allDone && (
              <motion.div
                key="live"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                style={{ background: 'rgba(0,229,153,0.08)', border: '1px solid rgba(0,229,153,0.2)' }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#00e599' }}
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span className="text-[11px] font-bold" style={{ color: '#00e599' }}>LIVE</span>
              </motion.div>
            )}
            {allDone && (
              <motion.div
                key="done"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                style={{ background: 'rgba(0,229,153,0.08)', border: '1px solid rgba(0,229,153,0.2)' }}
              >
                <CheckCircle size={13} style={{ color: '#00e599' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#00e599' }}>Analysis complete</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input bar ── */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-end gap-4">
            {/* Repo ID */}
            <div style={{ width: 140 }}>
              <label className="text-[9.5px] font-bold uppercase tracking-[0.14em] block mb-2" style={{ color: 'rgba(255,255,255,0.22)' }}>
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
              <label className="text-[9.5px] font-bold uppercase tracking-[0.14em] block mb-2" style={{ color: 'rgba(255,255,255,0.22)' }}>
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
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: '#00e599', color: '#000' }}
            >
              {loading ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Running…
                </>
              ) : (
                <><Play size={14} fill="#000" /> Run All Agents</>
              )}
            </motion.button>
          </div>

          {/* Agent indicator pills */}
          <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            {AGENTS.map(({ id, name, color, Icon }) => (
              <div key={id} className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{
                    background: status[id] === 'idle' ? 'rgba(255,255,255,0.04)' : `${color}18`,
                    border: `1px solid ${status[id] === 'idle' ? 'rgba(255,255,255,0.07)' : `${color}35`}`,
                  }}
                >
                  <Icon size={11} style={{ color: status[id] === 'idle' ? 'rgba(255,255,255,0.2)' : color }} />
                </div>
                <span className="text-[11px] font-medium" style={{ color: status[id] === 'idle' ? 'rgba(255,255,255,0.2)' : color }}>
                  {name}
                </span>
                {id !== 'architecture' && (
                  <span className="text-[9px] mx-0.5" style={{ color: 'rgba(255,255,255,0.1)' }}>·</span>
                )}
              </div>
            ))}
            <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.16)' }}>
              Executes in parallel via asyncio
            </span>
          </div>
        </div>

        {/* ── 3 Agent Cards — fill remaining height ── */}
        <div className="grid grid-cols-3 gap-4 flex-1">
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
        <AnimatePresence>
          {log.length > 0 && <StreamLog key="streamlog" lines={log} />}
        </AnimatePresence>

        {/* ── Merged report ── */}
        <AnimatePresence>
          {merged && <MergedReport key="merged" merged={merged} />}
        </AnimatePresence>

      </div>
    </DashboardLayout>
  );
}
