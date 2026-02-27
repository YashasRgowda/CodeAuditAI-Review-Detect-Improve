'use client';
// knowledge/page.js — RAG Knowledge Base
// Browse and search the AI's accumulated memory from past reviews
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Database, Trash2, RefreshCw, Sparkles, AlertCircle } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { ragApi } from '@/lib/api/rag';
import { toast } from 'sonner';

/* ---- Memory stat card ---- */
function MemoryStat({ label, value, icon: Icon, color }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-xl border border-white/8 bg-white/2">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={18} />
      </div>
      <div>
        <p className="text-2xl font-black text-white">{value ?? '—'}</p>
        <p className="text-xs text-white/35 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ---- Search result card ---- */
function ResultCard({ result, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className="p-5 rounded-2xl border border-white/8 bg-white/2 hover:bg-white/3 hover:border-white/12 transition-all"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400" />
          <span className="text-xs text-white/35 font-mono">
            Similarity: {result.similarity_score ? `${(result.similarity_score * 100).toFixed(0)}%` : '—'}
          </span>
        </div>
        {result.risk_level && (
          <Badge variant={result.risk_level === 'low' ? 'low' : result.risk_level === 'high' ? 'high' : 'medium'} dot>
            {result.risk_level}
          </Badge>
        )}
      </div>
      <p className="text-sm text-white/70 leading-relaxed mb-3">
        {result.summary || result.content || 'No summary available'}
      </p>
      {result.commit_hash && (
        <p className="text-xs font-mono text-white/25">commit: {result.commit_hash?.slice(0, 12)}</p>
      )}
      {result.patterns?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {result.patterns.slice(0, 5).map((p, i) => (
            <span key={i} className="text-xs bg-white/4 border border-white/8 rounded-full px-2 py-0.5 text-white/40">{p}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function KnowledgePage() {
  const [stats, setStats]     = useState(null);
  const [query, setQuery]     = useState('');
  const [repoId, setRepoId]   = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true);
  const [clearing, setClearing] = useState(false);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await ragApi.stats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const handleSearch = async () => {
    if (!query.trim()) return toast.error('Enter a search query');
    setSearching(true);
    setResults([]);
    try {
      const data = await ragApi.search({
        query,
        repository_id: repoId ? parseInt(repoId) : undefined,
        top_k: 10,
      });
      setResults(data.results || data || []);
      if ((data.results || data || []).length === 0) toast.info('No relevant memories found');
    } catch (e) {
      toast.error(e.message || 'Search failed');
    } finally {
      setSearching(false);
    }
  };

  const handleClear = async () => {
    if (!confirm('Clear ALL knowledge base entries? This cannot be undone.')) return;
    setClearing(true);
    try {
      await ragApi.clear();
      setStats(null);
      setResults([]);
      toast.success('Knowledge base cleared');
      loadStats();
    } catch (e) {
      toast.error(e.message || 'Failed to clear');
    } finally {
      setClearing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
              <Brain size={20} className="text-violet-400" />
              Knowledge Base
            </h1>
            <p className="text-sm text-white/35">AI memory — patterns and insights learned from every past review</p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={loadStats} variant="ghost" size="sm" icon={RefreshCw} loading={loadingStats}>
              Refresh
            </Button>
            <Button onClick={handleClear} variant="danger" size="sm" icon={Trash2} loading={clearing}>
              Clear All
            </Button>
          </div>
        </div>

        {/* How RAG works banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-violet-500/20 bg-violet-500/5">
          <Sparkles size={16} className="text-violet-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white/80">How AI Memory Works</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
              Every analysis is automatically stored here as vector embeddings (Google Embedding API).
              When you run a new analysis, the AI searches this knowledge base first and uses relevant
              past reviews as context — making each new review smarter than the last.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MemoryStat
            label="Total Entries"
            value={loadingStats ? '...' : (stats?.total_entries ?? 0)}
            icon={Database}
            color="bg-violet-500/10 text-violet-400"
          />
          <MemoryStat
            label="Repositories"
            value={loadingStats ? '...' : (stats?.repositories ?? 0)}
            icon={Brain}
            color="bg-cyan-500/10 text-cyan-400"
          />
          <MemoryStat
            label="Patterns Learned"
            value={loadingStats ? '...' : (stats?.patterns_count ?? 0)}
            icon={Sparkles}
            color="bg-amber-500/10 text-amber-400"
          />
          <MemoryStat
            label="Avg Similarity"
            value={loadingStats ? '...' : (stats?.avg_similarity ? `${(stats.avg_similarity * 100).toFixed(0)}%` : 'N/A')}
            icon={Search}
            color="bg-emerald-500/10 text-emerald-400"
          />
        </div>

        {/* Search */}
        <Card>
          <h2 className="text-sm font-semibold text-white/70 mb-4 flex items-center gap-2">
            <Search size={15} />
            Search Memory
          </h2>
          <div className="flex gap-3 mb-3 flex-wrap">
            <div className="flex-[3]">
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="e.g. N+1 query issues, authentication vulnerabilities, memory leaks..."
                className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <div className="flex-1">
              <input
                value={repoId}
                onChange={e => setRepoId(e.target.value)}
                placeholder="Repo ID (optional)"
                className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <Button onClick={handleSearch} loading={searching} icon={Search}>
              Search
            </Button>
          </div>
          <p className="text-xs text-white/25">
            Tip: Search for patterns like &quot;console.log in production&quot; or &quot;missing error handling&quot;
          </p>
        </Card>

        {/* Results */}
        <AnimatePresence>
          {results.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-white/70">Search Results</h2>
                <Badge variant="cyan">{results.length} found</Badge>
              </div>
              {results.map((r, i) => (
                <ResultCard key={i} result={r} index={i} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty state */}
        {!loadingStats && stats?.total_entries === 0 && (
          <div className="py-16 text-center glass-card">
            <Brain size={40} className="text-white/10 mx-auto mb-4" />
            <p className="text-sm font-medium text-white/40 mb-2">Knowledge base is empty</p>
            <p className="text-xs text-white/25 max-w-sm mx-auto">
              Run your first analysis and it will be automatically stored here.
              The AI gets smarter with every review.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
