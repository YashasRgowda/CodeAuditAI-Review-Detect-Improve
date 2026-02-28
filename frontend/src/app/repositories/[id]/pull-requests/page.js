'use client';
// repositories/[id]/pull-requests/page.js — Pull Requests
// Sage Jade Green accent · Filter tabs · Matches dashboard aesthetic

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PullRequestCard from '@/components/repository/PullRequestCard';
import { repositoriesApi } from '@/lib/api/repositories';
import { api } from '@/lib/api';
import {
  ArrowLeft, GitPullRequest, GitMerge, GitBranchPlus,
  Search,
} from 'lucide-react';

// ── Palette ─────────────────────────────────────────────────────────────
const G = {
  full:   '#6aab8e',
  border: 'rgba(106,171,142,0.28)',
  text:   'rgba(130,200,168,0.90)',
  faint:  'rgba(106,171,142,0.07)',
};

const FILTERS = [
  { key: 'all',    label: 'All' },
  { key: 'open',   label: 'Open' },
  { key: 'closed', label: 'Closed' },
  { key: 'merged', label: 'Merged' },
];

export default function PullRequestsPage() {
  const { status }            = useSession();
  const router                = useRouter();
  const { id: repoId }        = useParams();
  const [repo,    setRepo]    = useState(null);
  const [prs,     setPrs]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState('all');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated' || !repoId) return;
    Promise.all([
      repositoriesApi.get(repoId),
      repositoriesApi.pullRequests(repoId),
    ])
      .then(([r, p]) => { setRepo(r); setPrs(Array.isArray(p) ? p : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, repoId]);

  if (status === 'loading') return null;

  /* ── Filter + search ─────────────────────────────────── */
  const filtered = prs.filter(pr => {
    const state = pr.state?.toLowerCase() || 'open';
    if (filter !== 'all' && state !== filter) return false;
    if (!search) return true;
    return (
      pr.title?.toLowerCase().includes(search.toLowerCase()) ||
      pr.user?.toLowerCase().includes(search.toLowerCase()) ||
      String(pr.number).includes(search)
    );
  });

  const countFor = (key) =>
    key === 'all' ? prs.length : prs.filter(p => p.state?.toLowerCase() === key).length;

  const handleAnalyze = async (pr) => {
    try {
      const result = await api.quickPRAnalysis({
        repo_full_name: repo?.repo_name,
        pr_number: pr.number,
      });
      alert(`PR Analysis Complete!\nRisk: ${result.risk_level}\n${result.summary}`);
    } catch {
      alert('PR analysis failed — check backend connection');
    }
  };

  const [owner, name] = repo?.repo_name?.includes('/')
    ? repo.repo_name.split('/')
    : ['', repo?.repo_name || ''];

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
          borderLeft: `3px solid ${G.border}`,
        }}
      >
        {/* radial sage glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(106,171,142,0.05) 0%, transparent 55%)' }} />

        <div className="relative flex items-center justify-between px-6 py-5">
          {/* Left: identity */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: G.faint, border: `1px solid ${G.border}` }}>
              <GitPullRequest size={16} style={{ color: G.text }} />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-0.5"
                style={{ color: 'rgba(255,255,255,0.28)' }}>
                Pull Requests
              </p>
              <h1 className="text-[18px] font-black leading-none">
                {owner && <span style={{ color: 'rgba(255,255,255,0.45)' }}>{owner}&nbsp;/&nbsp;</span>}
                <span style={{ color: 'rgba(255,255,255,0.88)' }}>{name || '…'}</span>
              </h1>
            </div>
          </div>

          {/* Right: stat cluster */}
          {!loading && (
            <div className="flex items-center gap-5">
              {/* open count */}
              <div className="text-center">
                <p className="text-[20px] font-black leading-none" style={{ color: G.text }}>
                  {countFor('open')}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}>open</p>
              </div>
              <div className="w-px h-8" style={{ background: '#1e1e1e' }} />
              {/* merged count */}
              <div className="text-center">
                <p className="text-[20px] font-black leading-none"
                  style={{ color: 'rgba(167,139,250,0.80)' }}>
                  {countFor('merged')}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}>merged</p>
              </div>
              <div className="w-px h-8" style={{ background: '#1e1e1e' }} />
              {/* total */}
              <div className="text-center">
                <p className="text-[20px] font-black leading-none text-white/60">
                  {prs.length}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-[0.12em] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.28)' }}>total</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Search + Filter row ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-center gap-3 mb-4 flex-wrap"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={12}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(255,255,255,0.22)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, author or number…"
            className="w-full rounded-xl pl-9 pr-4 py-2.5 text-[12.5px] outline-none transition-all duration-150"
            style={{
              background: '#0d0d0d',
              border: '1px solid #1e1e1e',
              color: 'rgba(255,255,255,0.72)',
            }}
            onFocus={e => { e.currentTarget.style.borderColor = G.border; e.currentTarget.style.boxShadow = 'inset 0 0 0 1px rgba(106,171,142,0.08)'; }}
            onBlur={e => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl p-1"
          style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}>
          {FILTERS.map(f => {
            const active = filter === f.key;
            const cnt    = countFor(f.key);
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11.5px] font-semibold cursor-pointer transition-all duration-150"
                style={{
                  background: active ? G.faint : 'transparent',
                  border: `1px solid ${active ? G.border : 'transparent'}`,
                  color: active ? G.text : 'rgba(255,255,255,0.38)',
                }}
              >
                {f.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-md tabular-nums"
                  style={{
                    background: active ? 'rgba(106,171,142,0.14)' : 'rgba(255,255,255,0.06)',
                    color: active ? G.text : 'rgba(255,255,255,0.30)',
                  }}
                >
                  {cnt}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* ── PR list panel ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.18, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >

        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-3"
          style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}>
          <div className="flex items-center gap-2">
            <GitPullRequest size={12} style={{ color: 'rgba(106,171,142,0.50)' }} />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.18em]"
              style={{ color: 'rgba(255,255,255,0.35)' }}>
              {loading
                ? 'Loading…'
                : search || filter !== 'all'
                ? `${filtered.length} of ${prs.length} pull requests`
                : `${prs.length} pull requests`}
            </span>
          </div>
          {/* sage pulse dot */}
          <div className="w-1.5 h-1.5 rounded-full"
            style={{ background: G.full, boxShadow: `0 0 5px ${G.glow || 'rgba(106,171,142,0.40)'}` }} />
        </div>

        {/* ── Loading skeleton ── */}
        {loading ? (
          [0,1,2,3].map(i => (
            <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse"
              style={{ borderBottom: '1px solid #141414' }}>
              <div className="w-8 h-8 rounded-xl shrink-0" style={{ background: '#161616' }} />
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-full w-3/5" style={{ background: '#1a1a1a' }} />
                <div className="h-2.5 rounded-full w-40" style={{ background: '#161616' }} />
              </div>
              <div className="w-24 h-7 rounded-xl" style={{ background: '#161616' }} />
            </div>
          ))
        ) : prs.length === 0 ? (

          /* ── Empty state ── */
          <div className="flex flex-col items-center py-20">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: G.faint, border: `1px solid ${G.border}` }}>
              <GitPullRequest size={22} style={{ color: 'rgba(106,171,142,0.40)' }} />
            </div>
            <p className="text-[14px] font-semibold mb-1.5"
              style={{ color: 'rgba(255,255,255,0.50)' }}>
              No pull requests found
            </p>
            <p className="text-[12px]"
              style={{ color: 'rgba(255,255,255,0.25)' }}>
              This repository has no open pull requests
            </p>
          </div>

        ) : filtered.length === 0 ? (

          /* ── No search results ── */
          <div className="flex flex-col items-center py-16">
            <p className="text-[13px] font-semibold mb-1"
              style={{ color: 'rgba(255,255,255,0.42)' }}>
              No pull requests match your filter
            </p>
            <button
              onClick={() => { setSearch(''); setFilter('all'); }}
              className="text-[11px] mt-2 cursor-pointer"
              style={{ color: G.text }}
            >
              Clear filters
            </button>
          </div>

        ) : (
          /* ── PR rows ── */
          <AnimatePresence>
            {filtered.map((pr, i) => (
              <PullRequestCard
                key={pr.id || pr.number}
                pullRequest={pr}
                onAnalyze={handleAnalyze}
                index={i}
              />
            ))}
          </AnimatePresence>
        )}

      </motion.div>

    </DashboardLayout>
  );
}
