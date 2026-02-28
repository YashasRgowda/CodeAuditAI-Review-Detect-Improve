'use client';
// analysis/page.js — Analysis Hub
// Royal Wine theme · Stat bar · Full history list · Stagger animations

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { analysisApi } from '@/lib/api/analysis';
import {
  BarChart3, AlertTriangle, CheckCircle, Info,
  Zap, GitCommit, FileCode, ArrowRight, Trash2, Calendar,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Risk badge
───────────────────────────────────────── */
const RISK = {
  low:      { label: 'Low',      bg: 'rgba(106,171,142,0.12)', border: 'rgba(106,171,142,0.28)', text: '#6aab8e' },
  medium:   { label: 'Medium',   bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)',  text: '#f59e0b' },
  high:     { label: 'High',     bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',   text: '#f87171' },
  critical: { label: 'Critical', bg: 'rgba(159,18,57,0.14)',  border: 'rgba(159,18,57,0.32)',   text: 'rgba(220,80,100,0.92)' },
};
function RiskBadge({ level }) {
  const r = RISK[level?.toLowerCase()] || { label: level || '—', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.45)' };
  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
      style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.text }}
    >
      {r.label}
    </span>
  );
}

/* ─────────────────────────────────────────
   Stat card
───────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl px-5 py-4"
      style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {label}
        </p>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: accent + '14', border: `1px solid ${accent}22` }}
        >
          <Icon size={12} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-[26px] font-black leading-none tabular-nums" style={{ color: 'rgba(255,255,255,0.80)' }}>
        {value}
      </p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Analysis list row
───────────────────────────────────────── */
function AnalysisRow({ analysis, index, onDelete }) {
  const [hovered,       setHovered]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const date = analysis.created_at
    ? new Date(analysis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  // repo id might be nested
  const repoId = analysis.repository_id || analysis.repository?.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.04, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDeleteConfirm(false); }}
      className="relative flex items-center gap-4 px-6 py-[17px] group transition-colors duration-150"
      style={{
        borderBottom: '1px solid #141414',
        background: hovered ? 'rgba(159,18,57,0.025)' : 'transparent',
        borderLeft: hovered ? '2px solid rgba(159,18,57,0.50)' : '2px solid transparent',
      }}
    >
      {/* ── Commit icon ── */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
        style={{
          background: hovered ? 'rgba(159,18,57,0.10)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${hovered ? 'rgba(159,18,57,0.22)' : '#1e1e1e'}`,
        }}
      >
        <GitCommit size={14} style={{ color: hovered ? 'rgba(210,70,90,0.85)' : 'rgba(255,255,255,0.28)' }} />
      </div>

      {/* ── Main info ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2.5 mb-[4px]">
          <span
            className="text-[13px] font-semibold font-mono transition-colors duration-150"
            style={{ color: hovered ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.65)' }}
          >
            {analysis.commit_hash?.slice(0, 10) || '—'}
          </span>
          <RiskBadge level={analysis.risk_level} />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            <Calendar size={9} />
            {date}
          </span>
          {analysis.files_changed != null && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              <FileCode size={9} />
              {analysis.files_changed} files
            </span>
          )}
          {analysis.overall_score != null && (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Score: <span style={{ color: 'rgba(255,255,255,0.50)' }}>{analysis.overall_score}</span>
            </span>
          )}
        </div>
      </div>

      {/* ── Summary excerpt ── */}
      {analysis.summary && (
        <p
          className="hidden lg:block text-[11.5px] max-w-[240px] truncate"
          style={{ color: 'rgba(255,255,255,0.30)' }}
        >
          {analysis.summary}
        </p>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {repoId && (
          <Link href={`/repositories/${repoId}/analysis/${analysis.id}`}>
            <button
              className="flex items-center gap-1.5 px-3 py-[6px] rounded-xl text-[11.5px] font-semibold cursor-pointer transition-all duration-150"
              style={{
                background: 'rgba(159,18,57,0.10)',
                border: '1px solid rgba(159,18,57,0.25)',
                color: 'rgba(210,70,90,0.88)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.18)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.10)'; }}
            >
              View
              <ArrowRight size={10} />
            </button>
          </Link>
        )}
        {deleteConfirm ? (
          <button
            onClick={() => onDelete(analysis.id)}
            className="flex items-center gap-1 px-3 py-[6px] rounded-xl text-[11.5px] font-bold cursor-pointer transition-all duration-150"
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.40)', color: '#f87171' }}
          >
            Confirm
          </button>
        ) : (
          <button
            onClick={() => setDeleteConfirm(true)}
            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
            style={{ color: 'rgba(255,255,255,0.22)', border: '1px solid transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.20)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.22)'; e.currentTarget.style.borderColor = 'transparent'; }}
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   PAGE
═══════════════════════════════════════ */
export default function AnalysisPage() {
  const { status }               = useSession();
  const router                   = useRouter();
  const [analyses, setAnalyses]  = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [query,    setQuery]     = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    analysisApi.history()
      .then(d => setAnalyses(Array.isArray(d) ? d : []))
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading') return null;

  const handleDelete = async (id) => {
    try {
      await analysisApi.delete(id);
      setAnalyses(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  // Stats
  const total  = analyses.length;
  const high   = analyses.filter(a => a.risk_level === 'high').length;
  const medium = analyses.filter(a => a.risk_level === 'medium').length;
  const low    = analyses.filter(a => a.risk_level === 'low').length;

  const filtered = analyses.filter(a =>
    a.commit_hash?.toLowerCase().includes(query.toLowerCase()) ||
    a.summary?.toLowerCase().includes(query.toLowerCase())
  );

  const STATS = [
    { label: 'Total Analyses', value: total,  icon: BarChart3,     accent: 'rgba(159,18,57,1)',   delay: 0.06 },
    { label: 'High Risk',      value: high,   icon: AlertTriangle, accent: '#f87171',             delay: 0.10 },
    { label: 'Medium Risk',    value: medium, icon: Info,          accent: '#f59e0b',             delay: 0.14 },
    { label: 'Low Risk',       value: low,    icon: CheckCircle,   accent: '#6aab8e',             delay: 0.18 },
  ];

  return (
    <DashboardLayout>

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between mb-6"
      >
          <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[22px] font-black text-white/88 leading-none">Analysis Hub</h1>
            {!loading && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{ background: 'rgba(159,18,57,0.12)', border: '1px solid rgba(159,18,57,0.25)', color: 'rgba(210,70,90,0.88)' }}
              >
                {total}
              </motion.span>
            )}
          </div>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
            All AI code reviews across your connected repositories
          </p>
        </div>

        <Link href="/analysis/quick">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all duration-150"
            style={{
              background: 'rgba(159,18,57,0.12)',
              border: '1px solid rgba(159,18,57,0.30)',
              color: 'rgba(220,80,100,0.92)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.20)'; e.currentTarget.style.borderColor = 'rgba(159,18,57,0.50)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.12)'; e.currentTarget.style.borderColor = 'rgba(159,18,57,0.30)'; }}
          >
            <Zap size={13} />
            Run Analysis
          </motion.button>
        </Link>
      </motion.div>

      {/* ── Stat bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {STATS.map(s => <StatCard key={s.label} {...s} />)}
        </div>

      {/* ── Search ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.35 }}
        className="relative mb-4"
      >
        <BarChart3
          size={13}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.20)' }}
        />
        <input
          type="text"
          placeholder="Search by commit SHA or summary…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none transition-all duration-200"
          style={{ background: '#0d0d0d', border: '1px solid #1e1e1e', color: 'rgba(255,255,255,0.70)' }}
          onFocus={e  => { e.target.style.borderColor = 'rgba(159,18,57,0.35)'; e.target.style.background = '#111'; }}
          onBlur={e   => { e.target.style.borderColor = '#1e1e1e'; e.target.style.background = '#0d0d0d'; }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] cursor-pointer transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)'; }}
          >
            Clear
          </button>
        )}
      </motion.div>

      {/* ── List ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.26, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        {/* List header */}
        <div
          className="flex items-center justify-between px-6 py-[13px]"
          style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}
        >
          <div className="flex items-center gap-2">
            <GitCommit size={13} style={{ color: 'rgba(159,18,57,0.55)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {loading ? 'Loading…' : query ? `${filtered.length} of ${total} analyses` : `${total} analyses`}
            </span>
          </div>
          <div className="w-[6px] h-[6px] rounded-full" style={{ background: '#9f1239', boxShadow: '0 0 6px rgba(159,18,57,0.8)' }} />
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
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e' }}>
              <BarChart3 size={22} style={{ color: 'rgba(255,255,255,0.18)' }} />
            </div>
            <p className="text-[14px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
              {query ? `No analyses match "${query}"` : 'No analyses yet'}
            </p>
            <p className="text-[12px] mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {query ? 'Try a different search term' : 'Run a quick analysis on any commit to get started'}
            </p>
              {!query && (
              <Link href="/analysis/quick">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold cursor-pointer transition-all duration-150"
                  style={{ background: 'rgba(159,18,57,0.10)', border: '1px solid rgba(159,18,57,0.28)', color: 'rgba(210,70,90,0.88)' }}
                >
                  <Zap size={12} />
                  Run Analysis
                </button>
              </Link>
          )}
        </div>
        ) : (
          <AnimatePresence>
            {filtered.map((a, i) => (
              <AnalysisRow key={a.id} analysis={a} index={i} onDelete={handleDelete} />
            ))}
          </AnimatePresence>
        )}
      </motion.div>

    </DashboardLayout>
  );
}
