'use client';
// page.js — Dashboard — "War Room" Bento Layout
// Hero score ring · Animated health bars · Timeline analyses feed · 2×2 action tiles
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FolderGit2, BarChart3, Shield, ArrowRight, Plus, Zap,
  AlertTriangle, GitCommit, ExternalLink, Bot, Wrench,
  MessageSquare, Activity, Database,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { repositoriesApi } from '@/lib/api/repositories';
import { analysisApi } from '@/lib/api/analysis';

/* ─────────────────────────────────────────
   Animated counter (counts up on mount)
───────────────────────────────────────── */
function Counter({ to, delay = 0 }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!to) { setN(0); return; }
    let iv = null;
    const t = setTimeout(() => {
      let cur = 0;
      const step = Math.max(1, Math.ceil(to / 55));
      iv = setInterval(() => {
        cur = Math.min(cur + step, to);
        setN(cur);
        if (cur >= to) clearInterval(iv);
      }, 18);
    }, delay * 1000);
    // Properly clean up both timeout and interval (required for React 18 Strict Mode)
    return () => { clearTimeout(t); if (iv) clearInterval(iv); };
  }, [to, delay]);
  return <span>{n}</span>;
}

/* ─────────────────────────────────────────
   Hero Score Ring — animated SVG circle
───────────────────────────────────────── */
const R_SIZE = 196;
const R_R    = 82;
const R_CIRC = 2 * Math.PI * R_R; // ≈ 515

function HeroRing({ score }) {
  const dash  = (score / 100) * R_CIRC;
  const color = score >= 80 ? '#6aab8e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const glow  = score >= 80 ? 'rgba(106,171,142,0.40)'
              : score >= 60 ? 'rgba(245,158,11,0.45)'
              : 'rgba(239,68,68,0.45)';

  return (
    <div className="relative flex items-center justify-center" style={{ width: R_SIZE, height: R_SIZE }}>
      <svg width={R_SIZE} height={R_SIZE} className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        {/* Outer glow ring */}
        <circle cx={R_SIZE/2} cy={R_SIZE/2} r={R_R + 6} fill="none"
          stroke="rgba(159,18,57,0.06)" strokeWidth={1} />
        {/* Track */}
        <circle cx={R_SIZE/2} cy={R_SIZE/2} r={R_R} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth={10} />
        {/* Wine ghost fill (full circle, very dim) */}
        <circle cx={R_SIZE/2} cy={R_SIZE/2} r={R_R} fill="none"
          stroke="rgba(159,18,57,0.08)" strokeWidth={10}
          strokeDasharray={R_CIRC} strokeDashoffset={0} />
        {/* Score arc */}
        <motion.circle
          cx={R_SIZE/2} cy={R_SIZE/2} r={R_R}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={R_CIRC}
          initial={{ strokeDashoffset: R_CIRC }}
          animate={{ strokeDashoffset: R_CIRC - dash }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1], delay: 0.5 }}
          style={{ filter: `drop-shadow(0 0 10px ${glow})` }}
        />
      </svg>

      {/* Center content */}
      <div className="relative flex flex-col items-center select-none">
        <motion.span
          initial={{ opacity: 0, scale: 0.65 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="font-black leading-none tabular-nums"
          style={{ fontSize: 54, color }}
        >
          {score}
        </motion.span>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-[10px] font-bold uppercase tracking-[0.18em] mt-1"
          style={{ color: 'rgba(255,255,255,0.40)' }}
        >
          / 100
        </motion.span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Horizontal health bar
───────────────────────────────────────── */
function HealthBar({ label, score, delay }) {
  const color = score >= 80 ? '#6aab8e' : score >= 60 ? '#f59e0b' : '#ef4444';
  return (
    <div>
      <div className="flex items-center justify-between mb-[7px]">
        <span className="text-[13px] text-white/62 font-medium">{label}</span>
        <span className="text-[14px] font-black tabular-nums" style={{ color }}>{score || '—'}</span>
      </div>
      <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color, boxShadow: `0 0 6px ${color}55` }}
          initial={{ width: '0%' }}
          animate={{ width: `${score || 0}%` }}
          transition={{ duration: 1.3, ease: [0.4, 0, 0.2, 1], delay }}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Risk pill
───────────────────────────────────────── */
function RiskPill({ level }) {
  const map = {
    low:      { c: '#6aab8e', bg: 'rgba(106,171,142,0.08)'  },
    medium:   { c: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
    high:     { c: '#ef4444', bg: 'rgba(239,68,68,0.10)'  },
    critical: { c: '#ef4444', bg: 'rgba(239,68,68,0.14)'  },
  };
  const r = map[level?.toLowerCase()] || map.medium;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap uppercase tracking-wide"
      style={{ color: r.c, background: r.bg }}
    >
      {level || 'medium'}
    </span>
  );
}

/* ─────────────────────────────────────────
   Skeleton
───────────────────────────────────────── */
function Skel({ className = '' }) {
  return <div className={`rounded-xl bg-white/[0.03] animate-pulse ${className}`} />;
}

/* ─────────────────────────────────────────
   Stat card
───────────────────────────────────────── */
function StatCard({ title, value, icon: Icon, accent, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
      className="relative rounded-2xl p-5 overflow-hidden"
      style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
    >
      <div
        className="absolute top-0 left-4 right-4 h-[1.5px]"
        style={{ background: `linear-gradient(90deg, transparent, ${accent}90, transparent)` }}
      />
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{title}</p>
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accent}10`, border: `1px solid ${accent}20` }}
        >
          <Icon size={14} style={{ color: accent }} />
        </div>
      </div>
      <p className="text-[36px] font-black text-white leading-none">{value}</p>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Card shell (shared wrapper)
───────────────────────────────────────── */
function Card({ children, className = '', style = {}, delay = 0, accentLine = false }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={`relative rounded-2xl overflow-hidden ${className}`}
      style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', ...style }}
    >
      {accentLine && (
        <div
          className="absolute top-0 left-0 right-0 h-[1.5px]"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(159,18,57,0.55), transparent)' }}
        />
      )}
      {children}
    </motion.div>
  );
}

function CardHeader({ title, icon: Icon, right }) {
  return (
    <div
      className="flex items-center justify-between px-5 py-[14px]"
      style={{ borderBottom: '1px solid #181818' }}
    >
      <div className="flex items-center gap-2.5">
        {Icon && <Icon size={14} style={{ color: 'rgba(159,18,57,0.65)' }} />}
        <p className="text-[13px] font-bold text-white/60">{title}</p>
      </div>
      {right}
    </div>
  );
}

/* ═══════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════ */
export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos,    setRepos]    = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    (async () => {
      try {
        const [r, a] = await Promise.all([
          repositoriesApi.list().catch(() => []),
          analysisApi.history().catch(() => []),
        ]);
        setRepos(Array.isArray(r) ? r : []);
        setAnalyses(Array.isArray(a) ? a : []);
      } finally {
        setLoading(false);
      }
    })();
  }, [status]);

  if (status === 'loading') return null;

  const hour      = new Date().getHours();
  const greeting  = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = session?.user?.name?.split(' ')[0] || 'Dev';
  const fullName  = session?.user?.name || 'Developer';

  // AnalysisResponse keeps scores at top level but overall_score lives inside changes_data
  const getField = (a, key) => a[key] ?? a.changes_data?.[key];

  const avg = (key) => {
    const vals = analyses.slice(0, 10).map(a => getField(a, key)).filter(v => v != null && v > 0);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  };

  const overallAvgRaw = avg('overall_score');
  // overall_score is stored out of 10 by the AI — normalise to /100 for display
  const overallAvg    = overallAvgRaw > 10 ? overallAvgRaw : overallAvgRaw * 10;
  const highRisk      = analyses.filter(a => ['high', 'critical'].includes(a.risk_level?.toLowerCase())).length;
  // recommendations live inside changes_data for full analyses
  const totalIssues = analyses.reduce((acc, a) => {
    const recs = a.recommendations ?? a.changes_data?.recommendations ?? [];
    return acc + (Array.isArray(recs) ? recs.length : 0);
  }, 0);

  const ACTIONS = [
    { href: '/analysis', icon: BarChart3,    label: 'Analysis',    desc: 'AI review commit'  },
    { href: '/agents',   icon: Bot,           label: 'Multi-Agent', desc: '3 specialist AIs'  },
    { href: '/autofix',  icon: Wrench,        label: 'Auto-Fix',    desc: 'Generate fix'       },
    { href: '/chat',     icon: MessageSquare, label: 'AI Chat',     desc: 'Ask about code'    },
  ];

  return (
    <DashboardLayout>

      {/* ══════════════════════════════════════
          WELCOME BAR — identity + live stats
      ══════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-between mb-7 rounded-2xl overflow-hidden px-7 py-5"
        style={{
          background: 'linear-gradient(135deg, #0e0a0b 0%, #0d0d0d 60%, #0c0a0b 100%)',
          border: '1px solid #1e1212',
          borderLeft: '3px solid rgba(159,18,57,0.70)',
        }}
      >
        {/* Subtle wine radial behind the name */}
        <div
          className="absolute left-0 top-0 bottom-0 pointer-events-none"
          style={{
            width: 340,
            background: 'radial-gradient(ellipse at 0% 50%, rgba(159,18,57,0.09) 0%, transparent 70%)',
          }}
        />

        {/* ── LEFT: greeting label + name ── */}
        <div className="relative">
          <p
            className="font-bold uppercase tracking-[0.18em] mb-2"
            style={{ fontSize: 15, color: 'rgba(159,18,57,0.80)' }}
          >
            {greeting}
          </p>
          <h2
            className="font-black leading-none tracking-tight"
            style={{ fontSize: 24, color: 'rgba(255,255,255,0.72)' }}
          >
            {fullName}
          </h2>
        </div>

        {/* ── RIGHT: live stat chips + CTA ── */}
        <div className="relative flex items-center gap-3">
          {/* Repos chip */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1f1f1f' }}
          >
            <FolderGit2 size={13} style={{ color: 'rgba(159,18,57,0.55)' }} />
            <span className="text-[22px] font-black tabular-nums text-white/80 leading-none">
              {loading ? '—' : repos.length}
            </span>
            <span className="text-[13px] font-semibold text-white/50 ml-0.5">repos</span>
          </div>

          {/* Analyses chip */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1f1f1f' }}
          >
            <Database size={13} style={{ color: 'rgba(159,18,57,0.55)' }} />
            <span className="text-[22px] font-black tabular-nums text-white/80 leading-none">
              {loading ? '—' : analyses.length}
            </span>
            <span className="text-[13px] font-semibold text-white/50 ml-0.5">analyses</span>
          </div>

          {/* Divider */}
          <div className="w-px h-8 mx-1" style={{ background: '#222' }} />

          {/* New Analysis CTA */}
          <Link href="/analysis">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold cursor-pointer transition-all duration-150"
              style={{
                background: 'rgba(159,18,57,0.12)',
                border: '1px solid rgba(159,18,57,0.32)',
                color: 'rgba(220,80,100,0.92)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background  = 'rgba(159,18,57,0.20)';
                e.currentTarget.style.borderColor = 'rgba(159,18,57,0.55)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background  = 'rgba(159,18,57,0.12)';
                e.currentTarget.style.borderColor = 'rgba(159,18,57,0.32)';
              }}
            >
              <Zap size={13} />
              New Analysis
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* ══════════════════════
          TOP BENTO ROW
          [Hero ring | 4 stats + health bars]
      ══════════════════════ */}
      <div className="flex gap-5 mb-5 relative z-10">

        {/* ── HERO SCORE CARD ── */}
      <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center justify-between rounded-2xl overflow-hidden relative py-8 px-6"
          style={{
            width: 264,
            minHeight: 358,
            background: '#090909',
            border: '1px solid #1e1e1e',
            flexShrink: 0,
          }}
        >
          {/* Wine radial spotlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 48%, rgba(159,18,57,0.11) 0%, transparent 65%)' }}
          />
          {/* Wine top line */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(159,18,57,0.7), transparent)' }}
          />

          <div className="relative w-full text-center">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.48)' }}>
              Overall Health
            </p>
        </div>

          <div className="relative">
            {loading
              ? <div className="w-[196px] h-[196px] rounded-full animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
              : <HeroRing score={overallAvg || 0} />
            }
          </div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="relative flex flex-col items-center gap-2"
          >
            {!loading && analyses.length > 0 && (
              <>
                <RiskPill level={
                  overallAvg >= 80 ? 'low' :
                  overallAvg >= 60 ? 'medium' : 'high'
                } />
                <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                  avg of last {Math.min(analyses.length, 10)} analyses
                </p>
              </>
            )}
            {!loading && analyses.length === 0 && (
              <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.42)' }}>
                Run an analysis to<br />see your score
              </p>
            )}
          </motion.div>
        </motion.div>

        {/* ── RIGHT COLUMN: Stats row + Health bars ── */}
        <div className="flex-1 flex flex-col gap-5 min-w-0">

          {/* 4 stat cards */}
          <div className="grid grid-cols-4 gap-4">
            {loading ? (
              [0,1,2,3].map(i => <Skel key={i} className="h-[94px]" />)
            ) : (
              <>
                <StatCard title="Repositories"  value={<Counter to={repos.length}    delay={0}    />} icon={FolderGit2}   accent="#9f1239" delay={0}    />
                <StatCard title="Analyses"       value={<Counter to={analyses.length} delay={0.07} />} icon={BarChart3}    accent="#9f1239" delay={0.07} />
                <StatCard title="Issues Found"   value={<Counter to={totalIssues}     delay={0.14} />} icon={AlertTriangle} accent="#f59e0b" delay={0.14} />
                <StatCard title="High Risk"      value={<Counter to={highRisk}        delay={0.21} />} icon={Shield}        accent={highRisk > 0 ? '#ef4444' : '#9f1239'} delay={0.21} />
              </>
            )}
          </div>

          {/* Code health bars */}
          <Card accentLine delay={0.22} className="flex-1 p-5">
            <div className="flex items-center justify-between mb-6">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.52)' }}>
                Code Health
              </p>
              <span
                className="flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full"
                style={{ color: 'rgba(159,18,57,0.75)', background: 'rgba(159,18,57,0.08)', border: '1px solid rgba(159,18,57,0.18)' }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ background: '#9f1239', boxShadow: '0 0 4px rgba(159,18,57,0.9)', animation: 'glow-pulse 2s ease-in-out infinite' }}
                />
                Live
              </span>
            </div>
            {loading ? (
              <div className="space-y-5">{[0,1,2,3].map(i => <Skel key={i} className="h-7" />)}</div>
            ) : analyses.length === 0 ? (
              <p className="text-[12px] text-center py-4" style={{ color: 'rgba(255,255,255,0.42)' }}>
                No data yet — run your first analysis
              </p>
            ) : (
              <div className="space-y-5">
                <HealthBar label="Security"        score={avg('security_score')}        delay={0.45} />
                <HealthBar label="Maintainability" score={avg('maintainability_score')} delay={0.55} />
                <HealthBar label="Performance"     score={avg('performance_score')}     delay={0.65} />
                <HealthBar label="Overall"         score={overallAvg}                   delay={0.75} />
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* ══════════════════════
          BOTTOM BENTO ROW
          [Timeline feed (2/3) | Actions + Repos (1/3)]
      ══════════════════════ */}
      <div className="grid grid-cols-3 gap-5 relative z-10">

        {/* ── ANALYSES TIMELINE FEED ── */}
        <Card delay={0.3} accentLine className="col-span-2">
          <CardHeader
            title="Recent Analyses"
            icon={Activity}
            right={
              <Link href="/analysis" className="flex items-center gap-1 text-[11px] transition-colors duration-150 hover:text-white/60" style={{ color: 'rgba(255,255,255,0.42)' }}>
                View all <ArrowRight size={11} />
              </Link>
            }
          />

          {loading ? (
            <div className="p-4 space-y-3">{[0,1,2,3,4].map(i => <Skel key={i} className="h-[46px]" />)}</div>
          ) : analyses.length === 0 ? (
            <div className="flex flex-col items-center py-14">
              <GitCommit size={28} className="mb-3" style={{ color: 'rgba(255,255,255,0.08)' }} />
              <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.42)' }}>No analyses yet</p>
              <Link href="/analysis">
                <span
                  className="text-[11px] px-4 py-1.5 rounded-full border transition-all duration-150"
                  style={{ color: 'rgba(255,255,255,0.30)', borderColor: 'rgba(255,255,255,0.08)' }}
                >
                  Run first analysis →
                </span>
              </Link>
              </div>
            ) : (
            <div className="relative">
              {/* Timeline spine */}
              <div
                className="absolute left-[34px] top-0 bottom-0 w-px"
                style={{ background: 'linear-gradient(to bottom, rgba(159,18,57,0.35) 0%, rgba(159,18,57,0.08) 85%, transparent 100%)' }}
              />

              {analyses.slice(0, 8).map((a, i) => {
                const dotColor = a.risk_level === 'low'  ? '#6aab8e'
                               : a.risk_level === 'high' || a.risk_level === 'critical' ? '#ef4444'
                               : '#f59e0b';
                return (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.38 + i * 0.05 }}
                    className="flex items-center gap-4 px-4 py-[13px] group transition-colors duration-150 hover:bg-white/[0.018]"
                    style={{ borderBottom: i < Math.min(analyses.length, 8) - 1 ? '1px solid #141414' : 'none' }}
                  >
                    {/* Timeline dot (z-10 to sit above the spine line) */}
                    <div
                      className="w-[9px] h-[9px] rounded-full shrink-0 z-10 ml-[21px]"
                      style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}88` }}
                    />

                    {/* Commit hash */}
                    <span
                      className="text-[11px] font-mono shrink-0 px-2 py-[3px] rounded"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.32)' }}
                    >
                      {a.commit_hash?.slice(0, 7) || '—'}
                    </span>

                    {/* Summary */}
                    <p className="flex-1 text-[13px] text-white/52 truncate min-w-0 group-hover:text-white/70 transition-colors duration-150">
                      {a.summary?.slice(0, 70) || 'Analysis complete'}
                    </p>

                    {/* Risk + score */}
                    <div className="flex items-center gap-3 shrink-0">
                      <RiskPill level={a.risk_level} />
                      {(() => {
                        const raw = getField(a, 'overall_score');
                        if (!raw) return null;
                        // Normalise: AI returns score out of 10
                        const sc = raw > 10 ? raw : raw * 10;
                        return (
                          <span
                            className="text-[13px] font-black font-mono tabular-nums w-10 text-right"
                            style={{
                              color: sc >= 80 ? '#6aab8e' : sc >= 60 ? '#f59e0b' : '#ef4444',
                            }}
                          >
                            {sc}
                          </span>
                        );
                      })()}
                    </div>
                  </motion.div>
                );
              })}
              </div>
            )}
        </Card>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-4">

          {/* Quick Actions 2×2 grid */}
          <Card delay={0.38} accentLine>
            <CardHeader title="Quick Actions" />
            <div className="grid grid-cols-2">
              {ACTIONS.map((action, i) => {
                const Icon = action.icon;
                const isBottom = i >= 2;
                const isRight  = i % 2 !== 0;
                return (
                  <Link key={action.href} href={action.href}>
                    <motion.div
                      whileHover={{ background: 'rgba(159,18,57,0.06)' }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-2.5 p-4 cursor-pointer group"
                      style={{
                        borderBottom: !isBottom ? '1px solid #181818' : 'none',
                        borderRight:  !isRight  ? '1px solid #181818' : 'none',
                      }}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center"
                        style={{ background: 'rgba(159,18,57,0.08)', border: '1px solid rgba(159,18,57,0.18)' }}
                      >
                        <Icon size={16} style={{ color: 'rgba(180,55,78,0.85)' }} />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-white/60 group-hover:text-white/80 transition-colors leading-tight">
                          {action.label}
                        </p>
                        <p className="text-[10.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.42)' }}>
                          {action.desc}
                        </p>
                    </div>
                    </motion.div>
                  </Link>
                );
              })}
            </div>
          </Card>

          {/* Repositories */}
          <Card delay={0.46} accentLine className="flex-1">
            <CardHeader
              title="Repositories"
              right={
                <Link href="/repositories/add">
                  <span className="flex items-center gap-1 text-[11px] transition-colors" style={{ color: 'rgba(159,18,57,0.60)' }}>
                    <Plus size={11} /> Add
                  </span>
              </Link>
              }
            />

            {loading ? (
              <div className="p-3 space-y-2">{[0,1,2].map(i => <Skel key={i} className="h-[38px]" />)}</div>
            ) : repos.length === 0 ? (
              <div className="flex flex-col items-center py-8">
                <FolderGit2 size={22} className="mb-2" style={{ color: 'rgba(255,255,255,0.08)' }} />
                <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.42)' }}>No repos connected</p>
              </div>
            ) : (
              repos.slice(0, 6).map((repo, i) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  >
                    <Link href={`/repositories/${repo.id}`}>
                    <div
                      className="flex items-center gap-3 px-5 py-[11px] hover:bg-white/[0.025] group transition-colors duration-150"
                      style={{ borderBottom: i < Math.min(repos.length, 6) - 1 ? '1px solid #141414' : 'none' }}
                    >
                      <FolderGit2 size={13} style={{ color: 'rgba(159,18,57,0.48)', flexShrink: 0 }} />
                      <p className="flex-1 text-[13px] text-white/52 truncate group-hover:text-white/75 transition-colors">
                        {repo.repo_name}
                      </p>
                      <ExternalLink size={10} className="transition-colors" style={{ color: 'rgba(255,255,255,0.12)' }} />
                      </div>
                    </Link>
                  </motion.div>
              ))
            )}
          </Card>

        </div>
      </div>

    </DashboardLayout>
  );
}
