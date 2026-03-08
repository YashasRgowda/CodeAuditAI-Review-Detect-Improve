'use client';
// repositories/[id]/analysis/[analysisId]/page.js — Analysis Detail View
// Royal Wine theme · Score gauges · AI report · Commit info · Auto-fix CTA

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { analysisApi } from '@/lib/api/analysis';
import {
  ArrowLeft, GitCommit, FileCode, Calendar,
  Shield, AlertTriangle, Wrench, MessageSquare, ChevronRight,
  Plus, Minus, Brain, History,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Risk badge
───────────────────────────────────────── */
const RISK = {
  low:      { bg: 'rgba(106,171,142,0.12)', border: 'rgba(106,171,142,0.28)', text: '#6aab8e', glow: 'rgba(106,171,142,0.30)' },
  medium:   { bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)',  text: '#f59e0b', glow: 'rgba(245,158,11,0.25)'  },
  high:     { bg: 'rgba(239,68,68,0.10)',  border: 'rgba(239,68,68,0.28)',   text: '#f87171', glow: 'rgba(239,68,68,0.25)'   },
  critical: { bg: 'rgba(159,18,57,0.14)',  border: 'rgba(159,18,57,0.32)',   text: 'rgba(220,80,100,0.92)', glow: 'rgba(159,18,57,0.30)' },
};
function RiskBadge({ level }) {
  const r = RISK[level?.toLowerCase()] || { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.10)', text: 'rgba(255,255,255,0.42)', glow: 'transparent' };
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider"
      style={{ background: r.bg, border: `1px solid ${r.border}`, color: r.text, boxShadow: `0 0 10px ${r.glow}` }}>
      {level}
    </span>
  );
}

/* ─────────────────────────────────────────
   Mini stat tile
───────────────────────────────────────── */
function StatTile({ label, value, icon: Icon, accent, mono = false }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-4 py-3.5" style={{ background: '#0a0a0a', border: '1px solid #1a1a1a' }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: accent + '14', border: `1px solid ${accent}22` }}>
        <Icon size={13} style={{ color: accent }} />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-0.5" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</p>
        <p className={`text-[15px] font-black leading-none tabular-nums ${mono ? 'font-mono' : ''}`} style={{ color: 'rgba(255,255,255,0.78)' }}>{value}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Section header
───────────────────────────────────────── */
function SectionHeader({ icon: Icon, label, right }) {
  return (
    <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
      <div className="flex items-center gap-2">
        {Icon && <Icon size={12} style={{ color: 'rgba(159,18,57,0.60)' }} />}
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.38)' }}>{label}</p>
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE
═══════════════════════════════════════ */
export default function AnalysisDetailsPage() {
  const { status }               = useSession();
  const router                   = useRouter();
  const { id: repoId, analysisId } = useParams();
  const [analysis, setAnalysis]  = useState(null);
  const [loading,  setLoading]   = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !analysisId) return;
    analysisApi.get(analysisId)
      .then(d => setAnalysis(d))
      .catch(() => setAnalysis(null))
      .finally(() => setLoading(false));
  }, [status, analysisId]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 animate-spin"
            style={{ borderColor: 'rgba(159,18,57,0.50)', borderTopColor: 'transparent' }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!analysis) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <p style={{ color: 'rgba(255,255,255,0.40)' }}>Analysis not found</p>
          <Link href={`/repositories/${repoId}/analysis`}>
            <button className="text-[12px] cursor-pointer" style={{ color: 'rgba(159,18,57,0.70)' }}>← Back</button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const date = analysis.created_at
    ? new Date(analysis.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  /* ── Scores ── */
  const overall  = analysis.overall_score > 10 ? analysis.overall_score : (analysis.overall_score || 0) * 10;
  const security = analysis.security_score        || 0;
  const maint    = analysis.maintainability_score || 0;
  const perf     = analysis.performance_score     || 0;

  return (
    <DashboardLayout>

      {/* ── Back nav ── */}
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.28 }} className="mb-6">
        <Link href={`/repositories/${repoId}/analysis`}>
          <button className="flex items-center gap-2 text-[12px] font-medium cursor-pointer transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.30)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.58)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}>
            <ArrowLeft size={13} /> Analysis History
          </button>
        </Link>
      </motion.div>

      {/* ══ Hero card — commit identity + risk ══ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.40, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl p-6 mb-5 overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1e1212', borderLeft: '3px solid rgba(159,18,57,0.65)' }}
      >
        <div className="absolute left-0 top-0 bottom-0 pointer-events-none" style={{ width: 260, background: 'radial-gradient(ellipse at 0% 50%, rgba(159,18,57,0.08) 0%, transparent 70%)' }} />
        <div className="relative flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(159,18,57,0.10)', border: '1px solid rgba(159,18,57,0.20)' }}>
              <GitCommit size={16} style={{ color: 'rgba(210,70,90,0.80)' }} />
            </div>
            <div>
              <p className="text-[12px] font-mono mb-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>
                {analysis.commit_hash}
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {analysis.changes_data?.author || analysis.author || 'Unknown author'}
                {analysis.change_type && ` · ${analysis.change_type}`}
              </p>
            </div>
          </div>
          <RiskBadge level={analysis.risk_level} />
        </div>

        {/* Summary */}
        <p className="relative text-[14px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.70)' }}>
          {analysis.summary}
        </p>

        {/* Diff stats */}
        <div className="relative flex items-center gap-5 text-[12px]">
          <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <FileCode size={12} /> {analysis.files_changed} files changed
          </span>
          <span className="flex items-center gap-1" style={{ color: '#6aab8e' }}>
            <Plus size={11} /> {analysis.lines_added} added
          </span>
          <span className="flex items-center gap-1" style={{ color: '#f87171' }}>
            <Minus size={11} /> {analysis.lines_removed} removed
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>
            <Calendar size={11} /> {date}
          </span>
        </div>
      </motion.div>

      {/* ══ Two-column layout ══ */}
      <div className="flex gap-5">

        {/* ── Left column ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Score gauges */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="rounded-2xl overflow-hidden"
            style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
          >
            <SectionHeader icon={null} label="Quality Scores" />
            <div className="flex items-center justify-around p-6 flex-wrap gap-6">
              <ScoreGauge score={overall}  label="Overall" size={90} />
              <ScoreGauge score={security} label="Security" size={90} />
              <ScoreGauge score={maint}    label="Maintainability" size={90} />
              <ScoreGauge score={perf}     label="Performance" size={90} />
            </div>
          </motion.div>

          {/* AI Analysis Report — full depth interactive layout */}
          {analysis.changes_data?.full_analysis && (() => {
            let parsed = null;
            try { parsed = JSON.parse(analysis.changes_data.full_analysis); } catch {}
            if (!parsed) return null;

            const isPastReview =
              parsed.code_quality_assessment?.toLowerCase().includes('past review') ||
              parsed.summary?.toLowerCase().includes('past review');

            const RISK_META = {
              low:      { color: '#6aab8e', bg: 'rgba(106,171,142,0.10)', label: 'Low Risk'      },
              medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  label: 'Medium Risk'   },
              high:     { color: '#f87171', bg: 'rgba(239,68,68,0.10)',   label: 'High Risk'     },
              critical: { color: '#e11d48', bg: 'rgba(225,29,72,0.10)',   label: 'Critical Risk' },
            };
            const CT_META = {
              bug_fix:     { color: '#f87171', label: 'Bug Fix'     },
              feature:     { color: '#6aab8e', label: 'Feature'     },
              refactor:    { color: '#818cf8', label: 'Refactor'    },
              performance: { color: '#fbbf24', label: 'Performance' },
              docs:        { color: '#22d3ee', label: 'Docs'        },
              other:       { color: 'rgba(255,255,255,0.38)', label: parsed.change_type || 'Other' },
            };
            const rm  = RISK_META[parsed.risk_level?.toLowerCase()] || RISK_META.medium;
            const ctm = CT_META[parsed.change_type]                  || CT_META.other;

            return (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl overflow-hidden"
                style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
              >
                <SectionHeader icon={Brain} label="AI Analysis Report" />

                <div className="p-5 space-y-5">

                  {/* ── RAG memory banner ── */}
                  {isPastReview && (
                    <motion.div
                      initial={{ opacity: 0, x: -6 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.25 }}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
                      style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.20)' }}
                    >
                      <History size={13} style={{ color: '#818cf8', flexShrink: 0 }} />
                      <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                        <span style={{ color: '#818cf8', fontWeight: 700 }}>AI memory active</span>
                        {' '}— patterns found in your past repo reviews informed this analysis.
                      </p>
                    </motion.div>
                  )}

                  {/* ── Change classification row ── */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
                      style={{ background: `${ctm.color}12`, border: `1px solid ${ctm.color}28` }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: ctm.color }} />
                      <span className="text-[12px] font-semibold" style={{ color: ctm.color }}>{ctm.label}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
                      style={{ background: rm.bg, border: `1px solid ${rm.color}30` }}>
                      <Shield size={11} style={{ color: rm.color }} />
                      <span className="text-[12px] font-semibold" style={{ color: rm.color }}>{rm.label}</span>
                    </div>
                    {parsed.overall_score && (
                      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl ml-auto"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.30)' }}>Overall</span>
                        <span className="text-[15px] font-black tabular-nums" style={{ color: 'rgba(255,255,255,0.80)' }}>
                          {parsed.overall_score}<span className="text-[10px] font-normal" style={{ color: 'rgba(255,255,255,0.28)' }}>/10</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* ── Divider ── */}
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />

                  {/* ── AI Summary ── */}
                  {parsed.summary && (
                    <div className="space-y-2">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.15em]"
                        style={{ color: 'rgba(255,255,255,0.25)' }}>Review Summary</p>
                      <p className="text-[13.5px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.75)' }}>
                        {parsed.summary}
                      </p>
                    </div>
                  )}

                  {/* ── Divider ── */}
                  {parsed.code_quality_assessment && (
                    <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                  )}

                  {/* ── Code Quality Deep Dive ── */}
                  {parsed.code_quality_assessment && (
                    <div className="space-y-2">
                      <p className="text-[10.5px] font-bold uppercase tracking-[0.15em]"
                        style={{ color: 'rgba(255,255,255,0.25)' }}>Code Quality Deep Dive</p>
                      <p className="text-[13px] leading-[1.85]" style={{ color: 'rgba(255,255,255,0.62)' }}>
                        {parsed.code_quality_assessment}
                      </p>
                    </div>
                  )}

                  {/* ── Impact areas ── */}
                  {parsed.impact_areas?.length > 0 && (
                    <>
                      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }} />
                      <div className="space-y-2">
                        <p className="text-[10.5px] font-bold uppercase tracking-[0.15em]"
                          style={{ color: 'rgba(255,255,255,0.25)' }}>Areas Affected</p>
                        <div className="grid grid-cols-2 gap-2">
                          {parsed.impact_areas.map((area, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.28 + i * 0.05 }}
                              className="flex items-center gap-2 px-3 py-2 rounded-lg"
                              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'default' }}
                            >
                              <div className="w-1.5 h-1.5 rounded-full shrink-0"
                                style={{ background: 'rgba(255,255,255,0.25)' }} />
                              <span className="text-[12px] capitalize" style={{ color: 'rgba(255,255,255,0.50)' }}>
                                {area.replace(/_/g, ' ')}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </motion.div>
            );
          })()}

          {/* Security concerns */}
          {analysis.security_concerns?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0d0d0d', border: '1px solid rgba(239,68,68,0.18)' }}
            >
              <SectionHeader icon={Shield} label="Security Concerns" />
              <div className="p-4 space-y-2.5">
                {analysis.security_concerns.map((c, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 rounded-xl"
                    style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}>
                    <AlertTriangle size={13} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
                    <p className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.62)' }}>{c}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recommendations */}
          {analysis.recommendations?.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl overflow-hidden"
              style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
            >
              <SectionHeader
                icon={null}
                label={`Recommendations (${analysis.recommendations.length})`}
                right={
                  <Link href="/autofix">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold cursor-pointer transition-all duration-150"
                      style={{ background: 'rgba(106,171,142,0.10)', border: '1px solid rgba(106,171,142,0.22)', color: '#6aab8e' }}>
                      <Wrench size={10} /> Auto-Fix
                    </button>
                  </Link>
                }
              />
              <div className="p-4 space-y-2.5">
                {analysis.recommendations.map((rec, i) => {
                  const isObj = typeof rec === 'object' && rec !== null;
                  const text  = isObj ? (rec.description || rec.text || JSON.stringify(rec)) : rec;
                  const sev   = isObj ? rec.severity : null;
                  const accents = { high: 'rgba(239,68,68,0.07)', medium: 'rgba(245,158,11,0.07)', low: 'rgba(106,171,142,0.06)' };
                  return (
                    <div key={i} className="flex items-start gap-3 p-3.5 rounded-xl"
                      style={{ background: accents[sev] || 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>{i + 1}</span>
                      </div>
                      <p className="text-[12.5px] leading-relaxed flex-1" style={{ color: 'rgba(255,255,255,0.65)' }}>{text}</p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Chat CTA */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-4 p-4 rounded-xl"
            style={{ background: 'rgba(106,171,142,0.05)', border: '1px solid rgba(106,171,142,0.18)' }}
          >
            <MessageSquare size={16} style={{ color: '#6aab8e', flexShrink: 0 }} />
            <div className="flex-1">
              <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'rgba(255,255,255,0.72)' }}>
                Have questions about this review?
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Start an AI chat session about this specific analysis
              </p>
            </div>
            <Link href={`/chat?analysisId=${analysisId}`}>
              <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer transition-all duration-150"
                style={{ background: 'rgba(106,171,142,0.12)', border: '1px solid rgba(106,171,142,0.25)', color: '#6aab8e' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(106,171,142,0.20)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(106,171,142,0.12)'; }}>
                Chat <ChevronRight size={11} />
              </button>
            </Link>
          </motion.div>
        </div>

        {/* ── Right sidebar ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-3"
          style={{ width: 260, flexShrink: 0 }}
        >
          {/* Commit info */}
          <div className="rounded-2xl overflow-hidden" style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}>
            <SectionHeader icon={GitCommit} label="Commit Info" />
            <div className="p-4 space-y-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1.5" style={{ color: 'rgba(255,255,255,0.28)' }}>Hash</p>
                <p className="text-[11.5px] font-mono break-all" style={{ color: 'rgba(255,255,255,0.62)', background: '#0a0a0a', border: '1px solid #181818', borderRadius: 8, padding: '6px 10px' }}>
                  {analysis.commit_hash}
                </p>
              </div>
              {analysis.changes_data?.author && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Author</p>
                  <p className="text-[12px] font-medium" style={{ color: 'rgba(255,255,255,0.60)' }}>{analysis.changes_data.author}</p>
                </div>
              )}
              {analysis.changes_data?.commit_message && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Message</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>{analysis.changes_data.commit_message}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: 'rgba(255,255,255,0.28)' }}>Analysed</p>
                <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.48)' }}>{date}</p>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="space-y-2">
            <StatTile label="Files Changed"  value={analysis.files_changed ?? '—'} icon={FileCode}  accent="rgba(159,18,57,1)" />
            <StatTile label="Lines Added"    value={`+${analysis.lines_added ?? 0}`} icon={Plus}    accent="#6aab8e" />
            <StatTile label="Lines Removed"  value={`-${analysis.lines_removed ?? 0}`} icon={Minus} accent="#f87171" />
            <StatTile label="Security Score" value={`${security}/100`}            icon={Shield}     accent="#f59e0b" />
          </div>
        </motion.div>

      </div>

    </DashboardLayout>
  );
}
