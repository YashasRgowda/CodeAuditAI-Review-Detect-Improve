'use client';
// repositories/[id]/page.js — Repository Detail Page
// Royal Wine theme · Matches the Command Center aesthetic

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { repositoriesApi } from '@/lib/api/repositories';
import {
  ArrowLeft, FolderGit2, GitCommit, GitPullRequest,
  BarChart3, ExternalLink, Calendar, Hash,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Quick action card
───────────────────────────────────────── */
function ActionCard({ href, icon: Icon, label, desc, accent, delay }) {
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link href={href}>
        <div
          className="relative rounded-2xl p-5 cursor-pointer transition-all duration-200 group overflow-hidden"
          style={{
            background: hovered ? '#101010' : '#0d0d0d',
            border: `1px solid ${hovered ? accent + '30' : '#1c1c1c'}`,
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          {/* Top accent line on hover */}
          <div
            className="absolute top-0 left-0 right-0 h-[1.5px] transition-opacity duration-200"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent}70, transparent)`,
              opacity: hovered ? 1 : 0,
            }}
          />

          <div className="flex items-center gap-4">
            {/* Icon box */}
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200"
              style={{
                background: hovered ? accent + '18' : 'rgba(255,255,255,0.03)',
                border: `1px solid ${hovered ? accent + '30' : '#1e1e1e'}`,
              }}
            >
              <Icon size={18} style={{ color: hovered ? accent : 'rgba(255,255,255,0.28)' }} />
            </div>

            {/* Text */}
            <div>
              <p
                className="text-[14px] font-bold leading-none mb-1.5 transition-colors duration-150"
                style={{ color: hovered ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.68)' }}
              >
                {label}
              </p>
              <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {desc}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ─────────────────────────────────────────
   Meta info row
───────────────────────────────────────── */
function MetaRow({ icon: Icon, label, value, mono = false }) {
  return (
    <div className="flex items-start gap-3 py-4" style={{ borderBottom: '1px solid #141414' }}>
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: 'rgba(159,18,57,0.08)', border: '1px solid rgba(159,18,57,0.14)' }}
      >
        <Icon size={12} style={{ color: 'rgba(159,18,57,0.60)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] mb-1" style={{ color: 'rgba(255,255,255,0.32)' }}>
          {label}
        </p>
        <p
          className={`text-[13px] font-semibold truncate ${mono ? 'font-mono' : ''}`}
          style={{ color: 'rgba(255,255,255,0.72)' }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   PAGE
═══════════════════════════════════════ */
export default function RepositoryDetailsPage() {
  const { status }              = useSession();
  const router                  = useRouter();
  const { id: repoId }          = useParams();
  const [repo,    setRepo]      = useState(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !repoId) return;
    repositoriesApi.get(repoId)
      .then(d => setRepo(d))
      .catch(() => setRepo(null))
      .finally(() => setLoading(false));
  }, [status, repoId]);

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'rgba(159,18,57,0.50)', borderTopColor: 'transparent' }} />
        </div>
      </DashboardLayout>
    );
  }

  if (!repo) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <FolderGit2 size={28} style={{ color: 'rgba(255,255,255,0.15)' }} />
          <p style={{ color: 'rgba(255,255,255,0.40)' }}>Repository not found</p>
          <Link href="/repositories">
            <button className="text-[12px] cursor-pointer" style={{ color: 'rgba(159,18,57,0.70)' }}>
              ← Back to Repositories
            </button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  const nameParts = repo.repo_name?.split('/') || [];
  const owner     = nameParts.length > 1 ? nameParts[0] : '';
  const name      = nameParts.length > 1 ? nameParts[1] : repo.repo_name;
  const added     = repo.created_at
    ? new Date(repo.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';

  const ACTIONS = [
    {
      href: `/repositories/${repoId}/commits`,
      icon: GitCommit,
      label: 'Commits',
      desc: 'Browse full commit history',
      accent: '#b8732a',          // Cognac Amber — Rolls-Royce leather
    },
    {
      href: `/repositories/${repoId}/pull-requests`,
      icon: GitPullRequest,
      label: 'Pull Requests',
      desc: 'Review open & merged PRs',
      accent: '#6aab8e',          // Sage Jade Green
    },
    {
      href: `/repositories/${repoId}/analysis`,
      icon: BarChart3,
      label: 'Analysis History',
      desc: 'View all past AI reviews',
      accent: '#9f1239',          // Royal Wine — primary brand accent
    },
  ];

  return (
    <DashboardLayout>

      {/* ── Back nav ── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.28 }}
        className="mb-6"
      >
        <Link href="/repositories">
          <button
            className="flex items-center gap-2 text-[12px] font-medium cursor-pointer transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.30)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.58)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}
          >
            <ArrowLeft size={13} />
            Repositories
          </button>
        </Link>
      </motion.div>

      {/* ── Repo identity header ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex items-center justify-between mb-6 rounded-2xl px-6 py-5 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0e0a0b 0%, #0d0d0d 100%)',
          border: '1px solid #1e1212',
          borderLeft: '3px solid rgba(159,18,57,0.65)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute left-0 top-0 bottom-0 pointer-events-none"
          style={{ width: 280, background: 'radial-gradient(ellipse at 0% 50%, rgba(159,18,57,0.08) 0%, transparent 70%)' }}
        />

        {/* Name */}
        <div className="relative flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'rgba(159,18,57,0.10)', border: '1px solid rgba(159,18,57,0.20)' }}
          >
            <FolderGit2 size={16} style={{ color: 'rgba(210,70,90,0.80)' }} />
          </div>
          <div>
            {owner && (
              <p className="text-[11px] font-medium mb-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {owner}
              </p>
            )}
            <h1 className="text-[20px] font-black text-white/88 leading-none">{name}</h1>
          </div>
        </div>

        {/* GitHub link */}
        <a
          href={`https://github.com/${repo.repo_name}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all duration-150 cursor-pointer"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.40)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.40)'; }}
        >
          <ExternalLink size={12} />
          Open on GitHub
        </a>
      </motion.div>

      {/* ── Two-column layout ── */}
      <div className="flex gap-5">

        {/* Left: meta info */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl overflow-hidden"
          style={{ width: 300, flexShrink: 0, background: '#0d0d0d', border: '1px solid #1c1c1c' }}
        >
          {/* Card header */}
          <div
            className="px-5 py-3.5"
            style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Repository Info
            </p>
          </div>
          {/* Meta rows */}
          <div className="px-5">
            <MetaRow icon={Hash}     label="Repository"  value={repo.repo_name}  mono />
            <MetaRow icon={Calendar} label="Connected"   value={added} />
            {repo.language && (
              <MetaRow icon={FolderGit2} label="Language" value={repo.language} />
            )}
          </div>
        </motion.div>

        {/* Right: action cards */}
        <div className="flex-1 grid grid-cols-1 gap-3">
          {ACTIONS.map((a, i) => (
            <ActionCard key={a.href} {...a} delay={0.16 + i * 0.07} />
          ))}
        </div>

      </div>

    </DashboardLayout>
  );
}
