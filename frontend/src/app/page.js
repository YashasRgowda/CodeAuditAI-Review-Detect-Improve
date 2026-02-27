'use client';
// page.js — Main Dashboard
// Features: animated stat counters, score gauges, recent analysis feed, repo list
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  FolderGit2, BarChart3, Shield, Zap, Plus, ArrowRight,
  TrendingUp, AlertTriangle, CheckCircle, Clock, GitCommit,
  RefreshCw, ExternalLink,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Badge from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/LoadingSpinner';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { repositoriesApi } from '@/lib/api/repositories';
import { analysisApi } from '@/lib/api/analysis';

/* ---- Animated counter ---- */
function AnimatedNumber({ value, prefix = '', suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (value === 0 || started.current) return;
    started.current = true;
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 50));
    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setCount(current);
      if (current >= value) clearInterval(timer);
    }, 18);
    return () => clearInterval(timer);
  }, [value]);

  return <span>{prefix}{count}{suffix}</span>;
}

/* ---- Risk badge ---- */
function RiskBadge({ level }) {
  const map = {
    low:      { variant: 'low',    label: 'Low'    },
    medium:   { variant: 'medium', label: 'Med'    },
    high:     { variant: 'high',   label: 'High'   },
    critical: { variant: 'red',    label: 'Crit'   },
  };
  const { variant, label } = map[level?.toLowerCase()] || map.medium;
  return <Badge variant={variant} dot>{label}</Badge>;
}

/* ---- Stat card ---- */
function StatCard({ title, value, subtitle, icon: Icon, iconColor, trend, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass-card p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-white/35 font-medium mb-1">{title}</p>
          <p className="text-3xl font-black text-white">{value}</p>
          {subtitle && <p className="text-xs text-white/30 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconColor}`}>
          <Icon size={18} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1.5 text-xs">
          <TrendingUp size={12} className="text-emerald-400" />
          <span className="text-emerald-400">{trend}</span>
        </div>
      )}
    </motion.div>
  );
}

/* ---- Score gauges row ---- */
function ScoresRow({ analyses }) {
  if (!analyses?.length) return null;

  const latest = analyses[0];
  const avgScore = (n, key) => {
    const vals = analyses.slice(0, n).map(a => a[key]).filter(Boolean);
    return vals.length ? Math.round(vals.reduce((s, v) => s + v, 0) / vals.length) : 0;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-sm font-semibold text-white/80">Average Scores (last 10 reviews)</h2>
        <Badge variant="cyan">Live</Badge>
      </div>
      <div className="flex items-center justify-around flex-wrap gap-6">
        <ScoreGauge score={avgScore(10, 'overall_score')}       label="Overall"        size={80} />
        <ScoreGauge score={avgScore(10, 'security_score')}      label="Security"       size={80} />
        <ScoreGauge score={avgScore(10, 'maintainability_score')}label="Maintainability" size={80} />
        <ScoreGauge score={avgScore(10, 'performance_score')}   label="Performance"    size={80} />
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repos, setRepos] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    async function load() {
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
    }
    load();
  }, [status]);

  if (status === 'loading') return null;

  const totalIssues = analyses.reduce((acc, a) => acc + (a.recommendations?.length || 0), 0);
  const highRisk = analyses.filter(a => a.risk_level === 'high' || a.risk_level === 'critical').length;

  return (
    <DashboardLayout>
      {/* Welcome banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-xl font-bold text-white mb-0.5">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'Dev'} 👋
          </h1>
          <p className="text-sm text-white/35">
            {repos.length} repositories tracked · {analyses.length} analyses completed
          </p>
        </div>
        <Link
          href="/analysis"
          className="flex items-center gap-2 bg-violet-600/15 hover:bg-violet-600/25 border border-violet-500/30 text-violet-300 text-sm font-medium px-4 py-2 rounded-lg transition-all"
        >
          <BarChart3 size={15} />
          View All
        </Link>
      </motion.div>

      {/* Stat cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[0,1,2,3].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Repositories"
            value={<AnimatedNumber value={repos.length} />}
            subtitle="GitHub repos tracked"
            icon={FolderGit2}
            iconColor="bg-violet-500/10 text-violet-400"
            delay={0}
          />
          <StatCard
            title="Analyses Done"
            value={<AnimatedNumber value={analyses.length} />}
            subtitle="Total AI reviews"
            icon={BarChart3}
            iconColor="bg-cyan-500/10 text-cyan-400"
            trend={`${analyses.length > 0 ? 'Active' : 'Ready'}`}
            delay={0.08}
          />
          <StatCard
            title="Issues Found"
            value={<AnimatedNumber value={totalIssues} />}
            subtitle="Recommendations given"
            icon={AlertTriangle}
            iconColor="bg-amber-500/10 text-amber-400"
            delay={0.16}
          />
          <StatCard
            title="High Risk"
            value={<AnimatedNumber value={highRisk} />}
            subtitle="Commits need attention"
            icon={Shield}
            iconColor={highRisk > 0 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}
            delay={0.24}
          />
        </div>
      )}

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">

        {/* Score gauges — takes 2 columns */}
        <div className="lg:col-span-2 space-y-5">
          {!loading && <ScoresRow analyses={analyses} />}

          {/* Recent Analyses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/6">
              <h2 className="text-sm font-semibold text-white/80">Recent Analyses</h2>
              <Link href="/analysis" className="text-xs text-white/30 hover:text-white/60 flex items-center gap-1 transition-colors">
                View all <ArrowRight size={12} />
              </Link>
            </div>

            {loading ? (
              <div className="p-4 space-y-3">
                {[0,1,2].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : analyses.length === 0 ? (
              <div className="py-16 text-center">
                <BarChart3 size={32} className="text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30">No analyses yet</p>
                <p className="text-xs text-white/20 mt-1">Add a repo and run your first analysis</p>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {analyses.slice(0, 8).map((analysis, i) => (
                  <motion.div
                    key={analysis.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/2 transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/4 flex items-center justify-center shrink-0">
                      <GitCommit size={12} className="text-white/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white/80 truncate">{analysis.summary?.slice(0, 70) || 'Analysis result'}...</p>
                      <p className="text-xs text-white/30 mt-0.5 font-mono">{analysis.commit_hash?.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <RiskBadge level={analysis.risk_level} />
                      {analysis.overall_score > 0 && (
                        <span className={`text-xs font-bold ${analysis.overall_score >= 8 ? 'text-emerald-400' : analysis.overall_score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                          {analysis.overall_score}/10
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column — repos + quick actions */}
        <div className="space-y-5">
          {/* Quick actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <h2 className="text-sm font-semibold text-white/80 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {[
                { href: '/repositories/add', icon: Plus,         label: 'Add Repository',      color: 'hover:bg-violet-500/8 hover:border-violet-500/20' },
                { href: '/analysis',         icon: BarChart3,     label: 'Run Analysis',         color: 'hover:bg-cyan-500/8 hover:border-cyan-500/20'   },
                { href: '/agents',           icon: Zap,           label: 'Multi-Agent Review',   color: 'hover:bg-amber-500/8 hover:border-amber-500/20'  },
                { href: '/autofix',          icon: CheckCircle,   label: 'Get Auto-Fix',         color: 'hover:bg-emerald-500/8 hover:border-emerald-500/20' },
              ].map(action => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border border-white/5 text-white/60 hover:text-white/90 transition-all duration-200 cursor-pointer ${action.color}`}>
                      <Icon size={14} />
                      <span className="text-xs font-medium">{action.label}</span>
                      <ArrowRight size={12} className="ml-auto opacity-40" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Repositories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/6">
              <h2 className="text-sm font-semibold text-white/80">Repositories</h2>
              <Link href="/repositories/add" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
                <Plus size={12} /> Add
              </Link>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {[0,1,2].map(i => <SkeletonCard key={i} />)}
              </div>
            ) : repos.length === 0 ? (
              <div className="py-12 text-center px-4">
                <FolderGit2 size={28} className="text-white/10 mx-auto mb-3" />
                <p className="text-sm text-white/30 mb-3">No repos yet</p>
                <Link href="/repositories/add" className="text-xs text-violet-400 hover:text-violet-300">Add your first repo →</Link>
              </div>
            ) : (
              <div className="divide-y divide-white/4">
                {repos.slice(0, 6).map((repo, i) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.45 + i * 0.06 }}
                  >
                    <Link href={`/repositories/${repo.id}`}>
                      <div className="flex items-center gap-3 px-5 py-3 hover:bg-white/2 transition-colors group">
                        <div className="w-7 h-7 rounded-lg bg-white/4 flex items-center justify-center shrink-0">
                          <FolderGit2 size={12} className="text-violet-400/70" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white/75 truncate">{repo.name}</p>
                          <p className="text-xs text-white/25 truncate">{repo.full_name}</p>
                        </div>
                        <ExternalLink size={11} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
