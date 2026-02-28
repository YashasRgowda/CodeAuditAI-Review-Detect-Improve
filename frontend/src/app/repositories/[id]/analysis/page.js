'use client';
// repositories/[id]/analysis/page.js — Per-repo Analysis History
// Royal Wine theme · List of past AI reviews for a single repository

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { repositoriesApi } from '@/lib/api/repositories';
import { analysisApi }     from '@/lib/api/analysis';
import {
  ArrowLeft, BarChart3, GitCommit, FileCode, Calendar,
  AlertTriangle, Zap, ArrowRight,
} from 'lucide-react';

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
  const r = RISK[level?.toLowerCase()] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.42)' };
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.text }}>
      {level}
    </span>
  );
}

/* ─────────────────────────────────────────
   Analysis row
───────────────────────────────────────── */
function AnalysisRow({ analysis, repoId, index }) {
  const [hovered, setHovered] = useState(false);
  const date = analysis.created_at
    ? new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center gap-4 px-6 py-[17px] group transition-colors duration-150"
      style={{
        borderBottom: '1px solid #141414',
        background: hovered ? 'rgba(159,18,57,0.025)' : 'transparent',
        borderLeft: hovered ? '2px solid rgba(159,18,57,0.50)' : '2px solid transparent',
      }}
    >
      {/* Icon */}
      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
        style={{ background: hovered ? 'rgba(159,18,57,0.10)' : 'rgba(255,255,255,0.03)', border: `1px solid ${hovered ? 'rgba(159,18,57,0.22)' : '#1e1e1e'}` }}>
        <GitCommit size={14} style={{ color: hovered ? 'rgba(210,70,90,0.85)' : 'rgba(255,255,255,0.28)' }} />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-[4px]">
          <span className="text-[13px] font-semibold font-mono transition-colors duration-150"
            style={{ color: hovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.65)' }}>
            {analysis.commit_hash?.slice(0, 10) || '—'}
          </span>
          <RiskBadge level={analysis.risk_level} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            <Calendar size={9} /> {date}
          </span>
          {analysis.files_changed != null && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              <FileCode size={9} /> {analysis.files_changed} files
            </span>
          )}
          {analysis.overall_score != null && (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Score: <span style={{ color: 'rgba(255,255,255,0.48)' }}>{analysis.overall_score}</span>
            </span>
          )}
        </div>
      </div>

      {/* Summary */}
      {analysis.summary && (
        <p className="hidden lg:block text-[11.5px] max-w-[220px] truncate" style={{ color: 'rgba(255,255,255,0.28)' }}>
          {analysis.summary}
        </p>
      )}

      {/* View button */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 shrink-0">
        <Link href={`/repositories/${repoId}/analysis/${analysis.id}`}>
          <button
            className="flex items-center gap-1.5 px-3 py-[6px] rounded-xl text-[11.5px] font-semibold cursor-pointer transition-all duration-150"
            style={{ background: 'rgba(159,18,57,0.10)', border: '1px solid rgba(159,18,57,0.25)', color: 'rgba(210,70,90,0.88)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.10)'; }}
          >
            View <ArrowRight size={10} />
          </button>
        </Link>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   PAGE
═══════════════════════════════════════ */
export default function AnalysisHistoryPage() {
  const { status }               = useSession();
  const router                   = useRouter();
  const { id: repoId }           = useParams();
  const [repo,     setRepo]      = useState(null);
  const [analyses, setAnalyses]  = useState([]);
  const [loading,  setLoading]   = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !repoId) return;
    Promise.all([
      repositoriesApi.get(repoId),
      analysisApi.history(parseInt(repoId)),
    ])
      .then(([r, a]) => { setRepo(r); setAnalyses(Array.isArray(a) ? a : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, repoId]);

  if (status === 'loading') return null;

  /* ── Derived stats ── */
  const high   = analyses.filter(a => a.risk_level === 'high').length;
  const avgScore = analyses.length
    ? Math.round(analyses.reduce((s, a) => s + (a.overall_score || 0), 0) / analyses.length)
    : null;

  return (
    <DashboardLayout>

      {/* ── Back nav ── */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }} className="mb-6">
        <Link href={`/repositories/${repoId}`}>
          <button
            className="flex items-center gap-2 text-[12px] font-medium cursor-pointer transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.30)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.58)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}
          >
            <ArrowLeft size={13} />
            {repo ? repo.repo_name : 'Repository'}
          </button>
        </Link>
      </motion.div>

      {/* ── Repo identity header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-between mb-5 rounded-2xl px-6 py-5 overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderLeft: '3px solid rgba(159,18,57,0.60)' }}
      >
        <div className="absolute left-0 top-0 bottom-0 pointer-events-none" style={{ width: 220, background: 'radial-gradient(ellipse at 0% 50%, rgba(159,18,57,0.07) 0%, transparent 70%)' }} />
        <div className="relative">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Analysis History
          </p>
          <h1 className="text-[18px] font-black text-white/85 leading-none">
            {repo?.repo_name || '…'}
          </h1>
        </div>
        <div className="relative flex items-center gap-5">
          {avgScore !== null && (
            <div className="text-right">
              <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] mb-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Avg Score</p>
              <p className="text-[20px] font-black leading-none tabular-nums" style={{ color: 'rgba(255,255,255,0.80)' }}>{avgScore}</p>
            </div>
          )}
          {analyses.length > 0 && (
            <Link href={`/analysis/quick`}>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all duration-150"
                style={{ background: 'rgba(159,18,57,0.12)', border: '1px solid rgba(159,18,57,0.28)', color: 'rgba(220,80,100,0.90)' }}
              >
                <Zap size={11} /> New Analysis
              </motion.button>
            </Link>
          )}
        </div>
      </motion.div>

      {/* ── Analysis list ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        {/* List header */}
        <div className="flex items-center justify-between px-6 py-[13px]" style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
          <div className="flex items-center gap-2">
            <BarChart3 size={13} style={{ color: 'rgba(159,18,57,0.55)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {loading ? 'Loading…' : `${analyses.length} analyses`}
            </span>
          </div>
          {high > 0 && (
            <span className="flex items-center gap-1.5 text-[10.5px] font-semibold" style={{ color: '#f87171' }}>
              <AlertTriangle size={10} /> {high} high risk
            </span>
          )}
        </div>

        {/* Skeleton */}
        {loading ? (
          [0,1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-5 animate-pulse" style={{ borderBottom: '1px solid #141414' }}>
              <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: '#161616' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full w-36" style={{ background: '#1a1a1a' }} />
                <div className="h-2.5 rounded-full w-24" style={{ background: '#161616' }} />
              </div>
            </div>
          ))
        ) : analyses.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e' }}>
              <BarChart3 size={22} style={{ color: 'rgba(255,255,255,0.18)' }} />
            </div>
            <p className="text-[14px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>No analyses yet</p>
            <p className="text-[12px] mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Run an analysis on any commit to see results here
            </p>
            <Link href="/analysis/quick">
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold cursor-pointer transition-all duration-150"
                style={{ background: 'rgba(159,18,57,0.10)', border: '1px solid rgba(159,18,57,0.28)', color: 'rgba(210,70,90,0.88)' }}
              >
                <Zap size={12} /> Quick Analysis
              </button>
            </Link>
          </div>
        ) : (
          <AnimatePresence>
            {analyses.map((a, i) => <AnalysisRow key={a.id} analysis={a} repoId={repoId} index={i} />)}
          </AnimatePresence>
        )}
      </motion.div>

    </DashboardLayout>
  );
}
