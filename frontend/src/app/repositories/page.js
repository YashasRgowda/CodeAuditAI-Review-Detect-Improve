'use client';
// repositories/page.js — Git Command Center
// Royal Wine theme · Full-width list rows · Stagger animations · Live search

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { repositoriesApi } from '@/lib/api/repositories';
import {
  FolderGit2, Search, Plus, ExternalLink, BarChart3,
  Trash2, GitBranch, Calendar, ArrowRight, Github,
} from 'lucide-react';

/* ─────────────────────────────────────────
   Skeleton loader — single row
───────────────────────────────────────── */
function RepoRowSkel() {
  return (
    <div
      className="flex items-center gap-4 px-6 py-5 animate-pulse"
      style={{ borderBottom: '1px solid #141414' }}
    >
      <div className="w-9 h-9 rounded-xl shrink-0" style={{ background: '#161616' }} />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 rounded-full w-48" style={{ background: '#1a1a1a' }} />
        <div className="h-2.5 rounded-full w-28" style={{ background: '#161616' }} />
      </div>
      <div className="flex gap-2 shrink-0">
        <div className="w-16 h-8 rounded-xl" style={{ background: '#161616' }} />
        <div className="w-20 h-8 rounded-xl" style={{ background: '#161616' }} />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Single repository row
───────────────────────────────────────── */
function RepoRow({ repo, index, onDelete }) {
  const [hovered,       setHovered]       = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const nameParts = repo.repo_name?.split('/') || [];
  const owner     = nameParts.length > 1 ? nameParts[0] : '';
  const name      = nameParts.length > 1 ? nameParts[1] : repo.repo_name;

  const added = repo.created_at
    ? new Date(repo.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: index * 0.045, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setDeleteConfirm(false); }}
      className="relative flex items-center gap-4 px-6 py-[18px] group transition-colors duration-150"
      style={{
        borderBottom: '1px solid #141414',
        background: hovered ? 'rgba(159,18,57,0.025)' : 'transparent',
        borderLeft: hovered ? '2px solid rgba(159,18,57,0.50)' : '2px solid transparent',
      }}
    >
      {/* ── Icon ── */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
        style={{
          background: hovered ? 'rgba(159,18,57,0.10)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${hovered ? 'rgba(159,18,57,0.22)' : '#1e1e1e'}`,
        }}
      >
        <FolderGit2 size={15} style={{ color: hovered ? 'rgba(210,70,90,0.85)' : 'rgba(255,255,255,0.30)' }} />
      </div>

      {/* ── Name + meta ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-[3px]">
          {owner && (
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {owner}
              <span style={{ color: 'rgba(255,255,255,0.18)' }}> / </span>
            </span>
          )}
          <span
            className="text-[14px] font-semibold truncate transition-colors duration-150"
            style={{ color: hovered ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.72)' }}
          >
            {name}
          </span>
          {/* GitHub external link */}
          <a
            href={`https://github.com/${repo.repo_name}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150"
          >
            <ExternalLink size={11} style={{ color: 'rgba(255,255,255,0.25)' }} />
          </a>
        </div>
        <div className="flex items-center gap-3">
          {/* Repo ID — prominently shown for use in Quick Analysis */}
          <span
            className="flex items-center gap-1 text-[10.5px] font-mono font-bold px-1.5 py-0.5 rounded-md"
            style={{
              color: 'rgba(159,18,57,0.75)',
              background: 'rgba(159,18,57,0.08)',
              border: '1px solid rgba(159,18,57,0.18)',
            }}
          >
            ID: {repo.id}
          </span>
          <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
            <Calendar size={10} />
            Added {added}
          </span>
          {repo.language && (
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
              <GitBranch size={10} />
              {repo.language}
            </span>
          )}
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150">

        {/* Analyze */}
        <Link href={`/analysis?repo=${repo.id}`}>
          <button
            className="flex items-center gap-1.5 px-3 py-[6px] rounded-xl text-[11.5px] font-semibold transition-all duration-150 cursor-pointer"
            style={{
              background: 'rgba(159,18,57,0.10)',
              border: '1px solid rgba(159,18,57,0.25)',
              color: 'rgba(210,70,90,0.88)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.10)'; }}
          >
            <BarChart3 size={11} />
            Analyze
          </button>
        </Link>

        {/* View */}
        <Link href={`/repositories/${repo.id}`}>
          <button
            className="flex items-center gap-1.5 px-3 py-[6px] rounded-xl text-[11.5px] font-semibold transition-all duration-150 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.55)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'rgba(255,255,255,0.80)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
          >
            View
            <ArrowRight size={10} />
          </button>
        </Link>

        {/* Delete — two-step confirm */}
        {deleteConfirm ? (
          <button
            onClick={() => onDelete(repo.id)}
            className="flex items-center gap-1 px-3 py-[6px] rounded-xl text-[11.5px] font-bold cursor-pointer transition-all duration-150"
            style={{
              background: 'rgba(239,68,68,0.15)',
              border: '1px solid rgba(239,68,68,0.40)',
              color: '#f87171',
            }}
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
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════
   PAGE
═══════════════════════════════════════ */
export default function RepositoriesPage() {
  const { status }               = useSession();
  const router                   = useRouter();
  const [repos,    setRepos]     = useState([]);
  const [loading,  setLoading]   = useState(true);
  const [query,    setQuery]     = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth');
  }, [status, router]);

  useEffect(() => {
    if (status !== 'authenticated') return;
    repositoriesApi.list()
      .then(r => setRepos(Array.isArray(r) ? r : []))
      .catch(() => setRepos([]))
      .finally(() => setLoading(false));
  }, [status]);

  if (status === 'loading') return null;

  const handleDelete = async (id) => {
    try {
      await repositoriesApi.delete(id);
      setRepos(prev => prev.filter(r => r.id !== id));
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const filtered = repos.filter(r =>
    r.repo_name?.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <DashboardLayout>

      {/* ══════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="flex items-start justify-between mb-6"
      >
        {/* Left */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-[22px] font-black text-white/88 leading-none">Your Repositories</h1>
            {/* count badge */}
            {!loading && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 300 }}
                className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                style={{
                  background: 'rgba(159,18,57,0.12)',
                  border: '1px solid rgba(159,18,57,0.25)',
                  color: 'rgba(210,70,90,0.88)',
                }}
              >
                {repos.length}
              </motion.span>
            )}
          </div>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Track, analyze, and manage your connected GitHub codebases
          </p>
        </div>

        {/* Connect Repo CTA */}
        <Link href="/repositories/add">
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
            <Plus size={13} />
            Connect Repository
          </motion.button>
        </Link>
      </motion.div>

      {/* ══════════════════════════════════
          SEARCH BAR
      ══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative mb-4"
      >
        <Search
          size={14}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'rgba(255,255,255,0.22)' }}
        />
        <input
          type="text"
          placeholder="Search repositories..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl text-[13px] outline-none transition-all duration-200"
          style={{
            background: '#0d0d0d',
            border: '1px solid #1e1e1e',
            color: 'rgba(255,255,255,0.70)',
          }}
          onFocus={e => { e.target.style.borderColor = 'rgba(159,18,57,0.35)'; e.target.style.background = '#111'; }}
          onBlur={e => { e.target.style.borderColor = '#1e1e1e'; e.target.style.background = '#0d0d0d'; }}
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

      {/* ══════════════════════════════════
          REPO LIST
      ══════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
        className="rounded-2xl overflow-hidden"
        style={{ background: '#0d0d0d', border: '1px solid #1c1c1c' }}
      >
        {/* List header bar */}
        <div
          className="flex items-center justify-between px-6 py-[13px]"
          style={{ borderBottom: '1px solid #161616', background: '#0a0a0a' }}
        >
          <div className="flex items-center gap-2">
            <Github size={13} style={{ color: 'rgba(159,18,57,0.55)' }} />
            <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'rgba(255,255,255,0.38)' }}>
              {loading ? 'Loading…' : query ? `${filtered.length} of ${repos.length} repos` : `${repos.length} repositories`}
            </span>
          </div>
          <div
            className="w-[6px] h-[6px] rounded-full"
            style={{ background: '#9f1239', boxShadow: '0 0 6px rgba(159,18,57,0.8)' }}
          />
        </div>

        {/* Rows */}
        {loading ? (
          [0,1,2,3].map(i => <RepoRowSkel key={i} />)
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-20">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid #1e1e1e' }}
            >
              <FolderGit2 size={22} style={{ color: 'rgba(255,255,255,0.18)' }} />
            </div>
            <p className="text-[14px] font-semibold mb-1.5" style={{ color: 'rgba(255,255,255,0.50)' }}>
              {query ? `No repos match "${query}"` : 'No repositories connected'}
            </p>
            <p className="text-[12px] mb-6" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {query ? 'Try a different search term' : 'Connect your first GitHub repository to get started'}
            </p>
            {!query && (
              <Link href="/repositories/add">
                <button
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12.5px] font-bold cursor-pointer transition-all duration-150"
                  style={{
                    background: 'rgba(159,18,57,0.10)',
                    border: '1px solid rgba(159,18,57,0.28)',
                    color: 'rgba(210,70,90,0.88)',
                  }}
                >
                  <Plus size={12} />
                  Connect Repository
                </button>
              </Link>
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((repo, i) => (
              <RepoRow
                key={repo.id}
                repo={repo}
                index={i}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        )}
      </motion.div>

    </DashboardLayout>
  );
}
