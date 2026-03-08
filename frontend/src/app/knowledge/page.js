'use client';
// knowledge/page.js — RAG Knowledge Base (Wide layout rebuild)
// Left: Search + Results  |  Right: Stats sidebar + Repo chips

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Search, Database, Trash2, RefreshCw,
  Sparkles, AlertCircle, BookOpen, GitCommit,
  ChevronRight, Layers,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ragApi } from '@/lib/api/rag';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────
   ACCENT
───────────────────────────────────────────────────── */
const A  = '#a78bfa';
const AD = 'rgba(167,139,250,0.08)';
const AM = 'rgba(167,139,250,0.2)';

const RISK_MAP = {
  low:      { color: '#00e599', bg: 'rgba(0,229,153,0.10)'   },
  medium:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)'  },
  high:     { color: '#ef4444', bg: 'rgba(239,68,68,0.10)'   },
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.10)'   },
};

/* ─────────────────────────────────────────────────────
   RISK BADGE
───────────────────────────────────────────────────── */
function RiskBadge({ level }) {
  const r = RISK_MAP[(level || '').toLowerCase()] || RISK_MAP.medium;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
      style={{ background: r.bg, color: r.color }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />
      {level}
    </span>
  );
}

/* ─────────────────────────────────────────────────────
   SCORE BAR
───────────────────────────────────────────────────── */
function ScoreBar({ score }) {
  if (score === undefined || score === null) return null;
  const pct   = Math.min(100, Math.max(0, score));
  const color = pct >= 70 ? '#00e599' : pct >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-[2px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div className="h-full rounded-full" style={{ background: color }}
          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} />
      </div>
      <span className="text-[11px] font-mono tabular-nums shrink-0" style={{ color }}>{score}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   RESULT CARD
───────────────────────────────────────────────────── */
function ResultCard({ result, index }) {
  const simPct = result.similarity_score ? Math.round(result.similarity_score * 100) : null;
  const simColor = simPct >= 75 ? '#00e599' : simPct >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl p-5"
      style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {simPct !== null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono"
              style={{ background: `${simColor}12`, color: simColor, border: `1px solid ${simColor}28` }}>
              {simPct}% match
            </span>
          )}
          {result.repository && (
            <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              {result.repository}
            </span>
          )}
        </div>
        {result.risk_level && <RiskBadge level={result.risk_level} />}
      </div>

      <p className="text-[13px] leading-[1.7]" style={{ color: 'rgba(255,255,255,0.65)' }}>
        {result.summary || 'No summary available'}
      </p>

      <div className="mt-3.5 space-y-2">
        {result.overall_score !== null && result.overall_score !== undefined && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.25)', width: '44px' }}>Score</span>
            <ScoreBar score={result.overall_score} />
          </div>
        )}
        {result.commit_hash && (
          <div className="flex items-center gap-2">
            <GitCommit size={10} style={{ color: 'rgba(255,255,255,0.18)' }} />
            <span className="text-[10.5px] font-mono" style={{ color: 'rgba(255,255,255,0.22)' }}>
              {result.commit_hash.slice(0, 12)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   STAT CARD
───────────────────────────────────────────────────── */
function StatCard({ label, value, icon: Icon, color, loading }) {
  return (
    <div className="flex items-center gap-4 p-5 rounded-2xl"
      style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
        <Icon size={18} style={{ color }} />
      </div>
      <div>
        {loading
          ? <div className="h-7 w-12 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
          : <p className="text-[24px] font-black text-white tabular-nums leading-none">{value ?? '—'}</p>
        }
        <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.32)' }}>{label}</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   CLEAR MODAL
───────────────────────────────────────────────────── */
function ClearModal({ onConfirm, onCancel, loading }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onCancel}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl p-6 w-full max-w-sm mx-4"
        style={{ background: 'rgba(12,12,12,0.99)', border: '1px solid rgba(239,68,68,0.2)' }}>
        <p className="text-[15px] font-bold text-white/85 mb-2">Clear Knowledge Base?</p>
        <p className="text-[12.5px] leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.42)' }}>
          All vector embeddings and stored analysis patterns will be permanently deleted.
          The AI will lose its accumulated memory.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>Cancel</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
            style={{ background: '#ef4444', color: '#fff' }}>
            {loading ? 'Clearing…' : 'Clear All'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
export default function KnowledgePage() {
  const [stats,        setStats]        = useState(null);
  const [query,        setQuery]        = useState('');
  const [repoFilter,   setRepoFilter]   = useState('');
  const [results,      setResults]      = useState([]);
  const [searched,     setSearched]     = useState(false);
  const [searching,    setSearching]    = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [clearing,     setClearing]     = useState(false);
  const [showModal,    setShowModal]    = useState(false);

  const loadStats = async () => {
    setLoadingStats(true);
    try { const data = await ragApi.stats(); setStats(data); }
    catch { setStats(null); }
    finally { setLoadingStats(false); }
  };

  useEffect(() => { loadStats(); }, []);

  const handleSearch = async () => {
    if (!query.trim()) return toast.error('Enter a search query');
    setSearching(true); setResults([]); setSearched(false);
    try {
      const data = await ragApi.search({ query, repository_name: repoFilter.trim() || undefined, top_k: 12 });
      const items = data.results || data || [];
      setResults(items); setSearched(true);
      if (items.length === 0) toast.info('No relevant memories found');
    } catch (e) { toast.error(e.message || 'Search failed'); }
    finally { setSearching(false); }
  };

  const handleClear = async () => {
    setClearing(true);
    try { await ragApi.clear(); setStats(null); setResults([]); setSearched(false); toast.success('Knowledge base cleared'); loadStats(); }
    catch (e) { toast.error(e.message || 'Failed'); }
    finally { setClearing(false); setShowModal(false); }
  };

  const totalDocs = stats?.total_documents ?? 0;
  const repoList  = stats?.repositories   ?? [];
  const isEmpty   = !loadingStats && totalDocs === 0;

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: AD, border: `1px solid ${AM}` }}>
            <Brain size={16} style={{ color: A }} />
          </div>
          <div>
            <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">Knowledge Base</h1>
            <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
              AI memory — patterns and insights from every past review
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={loadStats} disabled={loadingStats}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold disabled:opacity-40"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}>
            <RefreshCw size={12} className={loadingStats ? 'animate-spin' : ''} /> Refresh
          </motion.button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => setShowModal(true)}
            disabled={isEmpty || clearing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold disabled:opacity-30"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)', color: '#ef4444' }}>
            <Trash2 size={12} /> Clear All
          </motion.button>
        </div>
      </div>

      {/* ── 2-column layout ── */}
      <div className="grid grid-cols-12 gap-5 items-start">

        {/* ════ LEFT: Search + Results (8 cols) ════ */}
        <div className="col-span-8 space-y-4">

          {/* How RAG works banner */}
          <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
            style={{ background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)' }}>
            <Sparkles size={14} style={{ color: A, marginTop: 2 }} className="shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-white/75">How AI Memory Works</p>
              <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
                Every analysis is automatically stored as vector embeddings (Google Embedding API).
                When you run a new analysis, the AI searches this knowledge base first — making each review smarter than the last.
              </p>
            </div>
          </div>

          {/* Search card */}
          <div className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Search size={14} style={{ color: A }} />
              <h2 className="text-[13px] font-bold text-white/65">Search Memory</h2>
            </div>

            {/* Query input */}
            <div className="flex items-center gap-2 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={13} style={{ color: 'rgba(255,255,255,0.2)' }} className="shrink-0" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. N+1 query issues, authentication vulnerabilities, memory leaks…"
                className="flex-1 bg-transparent text-[13.5px] placeholder:text-white/18 outline-none"
                style={{ color: 'rgba(255,255,255,0.75)' }}
              />
            </div>

            {/* Filter + button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 flex-1 max-w-[220px]"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <BookOpen size={11} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <input value={repoFilter} onChange={e => setRepoFilter(e.target.value)}
                  placeholder="Filter by repo name"
                  className="bg-transparent w-full text-[12.5px] placeholder:text-white/18 outline-none"
                  style={{ color: 'rgba(255,255,255,0.65)' }} />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSearch} disabled={searching || !query.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ background: A, color: '#000' }}>
                {searching ? (
                  <><span className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Searching…</>
                ) : (
                  <><Search size={13} /> Search</>
                )}
              </motion.button>
            </div>
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Tip: Search for patterns like &quot;console.log in production&quot; or &quot;missing error handling&quot;
            </p>
          </div>

          {/* Results */}
          <AnimatePresence>
            {results.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[13px] font-bold text-white/60">Search Results</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums"
                    style={{ background: AD, color: A }}>{results.length} found</span>
                </div>
                {results.map((r, i) => (
                  <ResultCard key={r.document_id || i} result={r} index={i} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty after search */}
          <AnimatePresence>
            {searched && results.length === 0 && !searching && (
              <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="py-16 text-center rounded-2xl"
                style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Search size={32} className="mx-auto mb-4" style={{ color: 'rgba(255,255,255,0.08)' }} />
                <p className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.35)' }}>No relevant memories found</p>
                <p className="text-[12px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Try broader search terms</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty knowledge base */}
          {isEmpty && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="py-20 text-center rounded-2xl"
              style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <motion.div animate={{ scale: [1, 1.07, 1] }} transition={{ duration: 3.5, repeat: Infinity }}>
                <Brain size={48} className="mx-auto mb-5" style={{ color: 'rgba(167,139,250,0.2)' }} />
              </motion.div>
              <p className="text-[14px] font-semibold" style={{ color: 'rgba(255,255,255,0.38)' }}>Knowledge base is empty</p>
              <p className="text-[12px] mt-2 max-w-sm mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.22)' }}>
                Run your first analysis and it will be automatically stored here. The AI gets smarter with every review.
              </p>
              <div className="flex items-center justify-center gap-1.5 mt-5">
                <ChevronRight size={12} style={{ color: 'rgba(167,139,250,0.4)' }} />
                <a href="/repositories" className="text-[12px] font-semibold" style={{ color: 'rgba(167,139,250,0.55)' }}>
                  Go to Repositories to start an analysis
                </a>
              </div>
            </motion.div>
          )}
        </div>

        {/* ════ RIGHT: Stats sidebar (4 cols) ════ */}
        <div className="col-span-4 space-y-4">

          {/* Stat cards */}
          <StatCard label="Total Documents" value={totalDocs} icon={Database} color={A} loading={loadingStats} />
          <StatCard label="Repositories Indexed" value={repoList.length} icon={Layers} color="#06b6d4" loading={loadingStats} />

          {/* Repo list */}
          {repoList.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-5"
              style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
                Indexed Repositories
              </p>
              <div className="flex flex-wrap gap-2">
                {repoList.map((r, i) => (
                  <span key={i} className="text-[11px] px-2.5 py-1 rounded-full"
                    style={{ background: AD, color: A, border: `1px solid ${AM}` }}>
                    {r}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* How to use */}
          <div className="rounded-2xl p-5" style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: 'rgba(255,255,255,0.22)' }}>
              Search Tips
            </p>
            <div className="space-y-2">
              {[
                '"N+1 query performance issues"',
                '"authentication vulnerabilities"',
                '"missing error handling"',
                '"hardcoded credentials"',
                '"memory leak patterns"',
              ].map((tip, i) => (
                <button
                  key={i}
                  onClick={() => setQuery(tip.slice(1, -1))}
                  className="block w-full text-left text-[11.5px] px-3 py-2 rounded-xl transition-all"
                  style={{ color: 'rgba(255,255,255,0.35)', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { e.currentTarget.style.background = AD; e.currentTarget.style.color = A; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; }}
                >
                  {tip}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <ClearModal onConfirm={handleClear} onCancel={() => setShowModal(false)} loading={clearing} />}
      </AnimatePresence>
    </DashboardLayout>
  );
}
