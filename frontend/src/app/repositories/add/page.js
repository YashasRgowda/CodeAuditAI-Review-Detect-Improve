'use client';
// repositories/add/page.js — Connect a GitHub repository
// Royal Wine theme · Matches the Repositories Command Center aesthetic

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { repositoriesApi } from '@/lib/api/repositories';
import {
  ArrowLeft, FolderGit2, Github, CheckCircle2, AlertCircle, Loader2,
} from 'lucide-react';

const HOW_IT_WORKS = [
  { step: '01', text: 'We fetch the repository metadata from your GitHub account' },
  { step: '02', text: 'You can analyze commits, pull requests, and code changes' },
  { step: '03', text: 'AI agents review security, performance, and architecture' },
];

export default function AddRepositoryPage() {
  const router          = useRouter();
  const [repoName, setRepoName] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState(false);
  const [focused,  setFocused]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    setLoading(true);
    setError('');
    try {
      await repositoriesApi.add(repoName.trim());
      setSuccess(true);
      setTimeout(() => router.push('/repositories'), 1200);
    } catch {
      setError('Could not connect this repository. Check the name and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">

        {/* ── Back link ── */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-7"
        >
          <Link href="/repositories">
            <button
              className="flex items-center gap-2 text-[12px] font-medium transition-colors duration-150 cursor-pointer"
              style={{ color: 'rgba(255,255,255,0.32)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.32)'; }}
            >
              <ArrowLeft size={13} />
              Back to Repositories
            </button>
          </Link>
        </motion.div>

        {/* ── Page heading ── */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mb-7"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] mb-2"
            style={{ color: 'rgba(159,18,57,0.70)' }}>
            GitHub Integration
          </p>
          <h1 className="text-[22px] font-black text-white/88 leading-none mb-1.5">
            Connect a Repository
          </h1>
          <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
            Link a GitHub repository to start running AI-powered code reviews
          </p>
        </motion.div>

        {/* ── Form card ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-2xl overflow-hidden mb-4"
          style={{ background: '#0d0d0d', border: '1px solid #1e1e1e' }}
        >
          {/* Wine top accent line */}
          <div
            className="absolute top-0 left-0 right-0 h-[1.5px]"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(159,18,57,0.60), transparent)' }}
          />

          <form onSubmit={handleSubmit} className="p-7">

            {/* Input */}
            <div className="mb-6">
              <label className="block text-[11px] font-bold uppercase tracking-[0.16em] mb-3"
                style={{ color: 'rgba(255,255,255,0.45)' }}>
                Repository Name <span style={{ color: 'rgba(159,18,57,0.80)' }}>*</span>
              </label>

              <div
                className="relative flex items-center rounded-xl overflow-hidden transition-all duration-200"
                style={{
                  background: '#080808',
                  border: `1px solid ${focused ? 'rgba(159,18,57,0.40)' : '#1c1c1c'}`,
                  boxShadow: focused ? '0 0 0 3px rgba(159,18,57,0.06)' : 'none',
                }}
              >
                <Github size={14} className="absolute left-4 pointer-events-none"
                  style={{ color: focused ? 'rgba(210,70,90,0.55)' : 'rgba(255,255,255,0.20)' }} />
                <input
                  type="text"
                  value={repoName}
                  onChange={e => { setRepoName(e.target.value); setError(''); }}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="username/repository-name"
                  className="w-full pl-10 pr-4 py-3.5 text-[13.5px] bg-transparent outline-none"
                  style={{ color: 'rgba(255,255,255,0.78)' }}
                  required
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>

              <p className="mt-2 text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
                e.g. <span style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>octocat/Hello-World</span>
              </p>
            </div>

            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 px-4 py-3 rounded-xl mb-5"
                style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)' }}
              >
                <AlertCircle size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                <p className="text-[12px]" style={{ color: '#f87171' }}>{error}</p>
              </motion.div>
            )}

            {/* Success banner */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                style={{ background: 'rgba(106,171,142,0.08)', border: '1px solid rgba(106,171,142,0.25)' }}
              >
                <CheckCircle2 size={14} style={{ color: '#6aab8e' }} />
                <p className="text-[12px]" style={{ color: '#6aab8e' }}>Repository connected! Redirecting…</p>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <motion.button
                type="submit"
                disabled={loading || success || !repoName.trim()}
                whileHover={!loading && !success ? { scale: 1.02 } : {}}
                whileTap={!loading && !success ? { scale: 0.97 } : {}}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[13px] font-bold cursor-pointer transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'rgba(159,18,57,0.14)',
                  border: '1px solid rgba(159,18,57,0.35)',
                  color: 'rgba(220,80,100,0.92)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'rgba(159,18,57,0.22)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(159,18,57,0.14)'; }}
              >
                {loading ? (
                  <><Loader2 size={14} className="animate-spin" /> Connecting…</>
                ) : success ? (
                  <><CheckCircle2 size={14} /> Connected!</>
                ) : (
                  <><FolderGit2 size={14} /> Connect Repository</>
                )}
              </motion.button>

              <Link href="/repositories">
                <button
                  type="button"
                  className="px-5 py-3 rounded-xl text-[13px] font-semibold cursor-pointer transition-all duration-150"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid #1e1e1e',
                    color: 'rgba(255,255,255,0.38)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; }}
                >
                  Cancel
                </button>
              </Link>
            </div>
          </form>
        </motion.div>

        {/* ── How it works ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-6"
          style={{ background: '#0a0a0a', border: '1px solid #181818' }}
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-5"
            style={{ color: 'rgba(255,255,255,0.30)' }}>
            How it works
          </p>
          <div className="space-y-4">
            {HOW_IT_WORKS.map(({ step, text }) => (
              <div key={step} className="flex items-start gap-4">
                <span
                  className="text-[11px] font-black font-mono shrink-0 mt-[1px]"
                  style={{ color: 'rgba(159,18,57,0.55)' }}
                >
                  {step}
                </span>
                <p className="text-[12.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </DashboardLayout>
  );
}
