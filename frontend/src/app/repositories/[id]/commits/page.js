'use client';
// repositories/[id]/commits/page.js — Commit History
// Cognac Amber theme (Rolls-Royce interior palette) · Clean architectural layout

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CommitListItem from '@/components/repository/CommitListItem';
import { repositoriesApi } from '@/lib/api/repositories';
import { ArrowLeft, GitCommit, Zap, GitBranch } from 'lucide-react';

// ── Cognac amber palette ─────────────────────────────────────────────────
const A = {
  full:   '#b8732a',
  glow:   'rgba(184,115,42,0.18)',
  border: 'rgba(184,115,42,0.28)',
  text:   'rgba(220,165,88,0.92)',
  faint:  'rgba(184,115,42,0.07)',
  pulse:  'rgba(184,115,42,0.90)',
};

export default function CommitsPage() {
  const { status }            = useSession();
  const router                = useRouter();
  const { id: repoId }        = useParams();
  const [repo,    setRepo]    = useState(null);
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !repoId) return;
    Promise.all([
      repositoriesApi.get(repoId),
      repositoriesApi.commits(repoId),
    ])
      .then(([r, c]) => { setRepo(r); setCommits(Array.isArray(c) ? c : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, repoId]);

  if (status === 'loading') return null;

  const [owner, name] = repo?.repo_name?.includes('/')
    ? repo.repo_name.split('/')
    : ['', repo?.repo_name || ''];

  const filtered = commits.filter(c =>
    !search ||
    c.message?.toLowerCase().includes(search.toLowerCase()) ||
    c.sha?.toLowerCase().includes(search.toLowerCase()) ||
    c.author?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardLayout>

      {/* ── Back nav ── */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.26 }}
        className="mb-5"
      >
        <Link href={`/repositories/${repoId}`}>
          <button
            className="flex items-center gap-1.5 text-[12px] font-medium cursor-pointer transition-colors duration-150"
            style={{ color: 'rgba(255,255,255,0.28)' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.52)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; }}
          >
            <ArrowLeft size={12} />
            {repo?.repo_name || 'Repository'}
          </button>
        </Link>
      </motion.div>

      {/* ── Hero header strip ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="relative rounded-2xl overflow-hidden mb-5"
        style={{
          background: '#0d0d0d',
          border: '1px solid #1c1c1c',
          borderLeft: `3px solid ${A.border}`,
        }}
      >
        {/* radial amber glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 0% 50%, rgba(184,115,42,0.06) 0%, transparent 55%)` }} />

        <div className="relative flex items-center justify-between px-6 py-5">
          {/* Left: identity */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: A.faint, border: `1px solid ${A.border}` }}>
              <GitBranch size={16} style={{ color: A.text }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5"
                style={{ color: 'rgba(255,255,255,0.28)' }}>
                Commit History
              </p>
              <h1 className="text-[18px] font-black leading-none">
                {owner && <span style={{ color: 'rgba(255,255,255,0.45)' }}>{owner}&nbsp;/&nbsp;</span>}
                <span style={{ color: 'rgba(255,255,255,0.88)' }}>{name || '…'}</span>
              </h1>
            </div>
          </div>

          {/* Right: count + action */}
          <div className="flex items-center gap-4">
            {!loading && (
              <div className="text-right">
                <p className="text-[20px] font-black leading-none" style={{ color: A.text }}>
                  {commits.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}>
                  commits
                </p>
              </div>
            )}

            <div className="w-px h-10" style={{ background: '#1e1e1e' }} />

            <Link href="/analysis/quick">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all duration-150"
                style={{ background: A.faint, border: `1px solid ${A.border}`, color: A.text }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(184,115,42,0.14)'; e.currentTarget.style.borderColor = 'rgba(184,115,42,0.45)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = A.faint; e.currentTarget.style.borderColor = A.border; }}
              >
                <Zap size={11} /> Quick Analysis
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Search bar ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="mb-4"
      >
        <div className="relative">
          <GitCommit size={13}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.22)' }}
          />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by message, SHA, or author…"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[12.5px] outline-none transition-all duration-150"
            style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              color: 'rgba(255,255,255,0.72)',
              '::placeholder': { color: 'rgba(255,255,255,0.25)' },
            }}
            onFocus={e => { e.currentTarget.style.borderColor = A.border; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(184,115,42,0.06)`; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
      </motion.div>

      {/* ── Commit list panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >

        {/* ── Panel header ── */}
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}
        >
          <div className="flex items-center gap-2">
            <GitCommit size={12} style={{ color: A.dim || 'rgba(184,115,42,0.50)' }} />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              {loading
                ? 'Loading…'
                : search
                ? `${filtered.length} of ${commits.length} commits`
                : `${commits.length} commits`}
            </span>
          </div>
          {/* amber pulse dot */}
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: A.full, boxShadow: `0 0 5px ${A.glow}` }} />
        </div>

        {/* ── Loading skeleton ── */}
        {loading ? (
          [0,1,2,3,4].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse"
              style={{ borderBottom: '1px solid #141414' }}>
              <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: '#161616' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full w-2/3" style={{ background: '#1a1a1a' }} />
                <div className="h-2.5 rounded-full w-48" style={{ background: '#161616' }} />
              </div>
              <div className="w-20 h-7 rounded-xl" style={{ background: '#161616' }} />
            </div>
          ))
        ) : commits.length === 0 ? (

          /* ── Empty state ── */
          <div className="flex flex-col items-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid #1e1e1e' }}>
              <GitCommit size={22} style={{ color: 'rgba(255,255,255,0.16)' }} />
            </div>
            <p className="text-[14px] font-semibold mb-1.5"
              style={{ color: 'rgba(255,255,255,0.48)' }}>No commits found</p>
            <p className="text-[12px]"
              style={{ color: 'rgba(255,255,255,0.24)' }}>
              This repository has no recent commits visible
            </p>
          </div>

        ) : filtered.length === 0 ? (

          /* ── No search results ── */
          <div className="flex flex-col items-center py-16">
            <p className="text-[13px] font-semibold mb-1"
              style={{ color: 'rgba(255,255,255,0.42)' }}>
              No commits match "{search}"
            </p>
            <button
              onClick={() => setSearch('')}
              className="text-[11px] mt-2 cursor-pointer"
              style={{ color: A.text }}
            >
              Clear search
            </button>
          </div>

        ) : (
          /* ── Commit rows ── */
          <AnimatePresence>
            {filtered.map((commit, i) => (
              <CommitListItem
                key={commit.sha}
                commit={commit}
                repoId={repoId}
                index={i}
              />
            ))}
          </AnimatePresence>
        )}

      </motion.div>

    </DashboardLayout>
  );
}
