'use client';
// analysis/quick/page.js — Quick AI Analysis with live streaming
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Play, Zap, Shield, Wrench, MessageSquare, ChevronRight,
  GitCommit, FileCode, AlertTriangle, CheckCircle, Info,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Card from '@/components/ui/Card';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { analysisApi } from '@/lib/api/analysis';
import { chatApi } from '@/lib/api/chat';
import { toast } from 'sonner';

/* ---- Risk badge ---- */
function RiskBadge({ level }) {
  const map = { low: 'low', medium: 'medium', high: 'high', critical: 'red' };
  return <Badge variant={map[level?.toLowerCase()] || 'default'} dot>{level}</Badge>;
}

/* ---- Recommendation card ---- */
function RecommendationCard({ rec, index }) {
  const isObj = typeof rec === 'object' && rec !== null;
  const text = isObj ? (rec.description || rec.text || JSON.stringify(rec)) : rec;
  const isFixable = isObj && rec.fixable;
  const severity = isObj && rec.severity;

  const severityColor = {
    high: 'border-red-500/25 bg-red-500/5',
    medium: 'border-amber-500/25 bg-amber-500/5',
    low: 'border-emerald-500/25 bg-emerald-500/5',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`flex items-start gap-3 p-4 rounded-xl border ${severityColor[severity] || 'border-white/8 bg-white/2'}`}
    >
      <div className="w-5 h-5 rounded-full bg-white/8 flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-xs text-white/40">{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/75 leading-relaxed">{text}</p>
        {isFixable && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="text-xs text-cyan-400 flex items-center gap-1">
              <Wrench size={11} /> AI can fix this
            </span>
          </div>
        )}
      </div>
      {severity && <Badge variant={severity === 'high' ? 'red' : severity === 'medium' ? 'amber' : 'emerald'}>{severity}</Badge>}
    </motion.div>
  );
}

/* ---- Streaming progress line ---- */
function StreamLine({ text, type }) {
  const colors = { progress: 'text-white/50', complete: 'text-emerald-400', error: 'text-red-400' };
  const icons = { progress: '▸', complete: '✓', error: '✗' };
  return (
    <div className={`flex items-start gap-2 text-xs font-mono ${colors[type] || 'text-white/40'}`}>
      <span className="shrink-0 mt-0.5">{icons[type] || '▸'}</span>
      <span>{text}</span>
    </div>
  );
}

export default function QuickAnalysisPage() {
  const router = useRouter();
  const [repoId, setRepoId] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [mode, setMode] = useState('quick'); // quick | stream
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [streamLines, setStreamLines] = useState([]);
  const [error, setError] = useState('');

  /* ---- Quick analysis (JSON response) ---- */
  const runQuick = async () => {
    if (!repoId || !commitSha) return toast.error('Enter repository ID and commit SHA');
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await analysisApi.quick({ repository_id: parseInt(repoId), commit_sha: commitSha });
      setResult(data);
      toast.success('Analysis complete!');
    } catch (e) {
      const msg = e.message || 'Analysis failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  /* ---- Streaming analysis (SSE) ---- */
  const runStream = async () => {
    if (!repoId || !commitSha) return toast.error('Enter repository ID and commit SHA');
    setLoading(true);
    setError('');
    setResult(null);
    setStreamLines([{ text: `Starting analysis for commit ${commitSha.slice(0, 8)}...`, type: 'progress' }]);
    try {
      const res = await analysisApi.stream({ repository_id: parseInt(repoId), commit_sha: commitSha });
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'progress') {
              setStreamLines(p => [...p, { text: event.message || event.step, type: 'progress' }]);
            } else if (event.type === 'complete') {
              setResult(event.result);
              setStreamLines(p => [...p, { text: 'Analysis complete!', type: 'complete' }]);
              toast.success('Analysis complete!');
            } else if (event.type === 'error') {
              setError(event.message);
              setStreamLines(p => [...p, { text: event.message, type: 'error' }]);
            }
          } catch {}
        }
      }
    } catch (e) {
      const msg = e.message || 'Stream failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!result) return;
    try {
      const analysisId = result.id;
      if (!analysisId) return toast.error('Save analysis first to start chat');
      const session = await chatApi.start(analysisId);
      router.push(`/chat?session=${session.session_id}`);
    } catch {
      toast.error('Could not start chat session');
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white mb-1">Quick Analysis</h1>
          <p className="text-sm text-white/35">Instant AI review of any commit — no save required</p>
        </div>

        {/* Input card */}
        <Card>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Repository ID</label>
              <input
                value={repoId}
                onChange={e => setRepoId(e.target.value)}
                placeholder="e.g. 20"
                className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Commit SHA</label>
              <input
                value={commitSha}
                onChange={e => setCommitSha(e.target.value)}
                placeholder="full or short SHA"
                className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
              />
            </div>
          </div>

          {/* Mode + run */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex rounded-lg border border-white/8 overflow-hidden">
              {['quick', 'stream'].map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-2 text-xs font-medium capitalize transition-all cursor-pointer ${mode === m ? 'bg-violet-600/20 text-violet-300' : 'text-white/40 hover:text-white/60'}`}
                >
                  {m === 'stream' ? '⚡ Streaming' : '⚡ Quick'}
                </button>
              ))}
            </div>
            <Button
              onClick={mode === 'stream' ? runStream : runQuick}
              loading={loading}
              icon={Play}
              variant="primary"
            >
              {loading ? 'Analyzing...' : 'Run Analysis'}
            </Button>
          </div>
        </Card>

        {/* Stream log */}
        <AnimatePresence>
          {streamLines.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-white/8 bg-[#0d0d0d] overflow-hidden"
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6">
                <div className={`w-2 h-2 rounded-full ${loading ? 'bg-cyan-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span className="text-xs text-white/40 font-mono">Analysis Log</span>
              </div>
              <div className="p-4 space-y-1.5 max-h-48 overflow-y-auto">
                {streamLines.map((line, i) => (
                  <StreamLine key={i} text={line.text} type={line.type} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/25 bg-red-500/5">
            <AlertTriangle size={16} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Summary card */}
              <Card className="border-violet-500/20 bg-violet-500/3">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/25 flex items-center justify-center">
                      <GitCommit size={15} className="text-violet-400" />
                    </div>
                    <div>
                      <p className="text-xs font-mono text-white/40">{result.commit_hash?.slice(0, 12)}</p>
                      <p className="text-xs text-white/50">{result.author} · {result.change_type}</p>
                    </div>
                  </div>
                  <RiskBadge level={result.risk_level} />
                </div>
                <p className="text-sm text-white/70 leading-relaxed mb-4">{result.summary}</p>
                <div className="flex items-center gap-4 text-xs text-white/35">
                  <span><FileCode size={12} className="inline mr-1" />{result.files_changed} files</span>
                  <span className="text-emerald-400">+{result.lines_added}</span>
                  <span className="text-red-400">-{result.lines_removed}</span>
                </div>
              </Card>

              {/* Scores */}
              <Card>
                <h3 className="text-sm font-semibold text-white/70 mb-5">Quality Scores</h3>
                <div className="flex items-center justify-around flex-wrap gap-6">
                  <ScoreGauge score={result.overall_score > 10 ? result.overall_score : (result.overall_score || 0) * 10} label="Overall" />
                  <ScoreGauge score={result.security_score || 0}       label="Security" />
                  <ScoreGauge score={result.maintainability_score || 0} label="Maintainability" />
                  <ScoreGauge score={result.performance_score || 0}    label="Performance" />
                </div>
              </Card>

              {/* Recommendations */}
              {result.recommendations?.length > 0 && (
                <Card padding={false}>
                  <div className="px-6 py-4 border-b border-white/6 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-white/70">
                      Recommendations <span className="text-white/30 font-normal ml-1">({result.recommendations.length})</span>
                    </h3>
                    <Button variant="ai" size="sm" icon={Wrench} onClick={() => router.push('/autofix')}>
                      Auto-Fix
                    </Button>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {result.recommendations.map((rec, i) => (
                      <RecommendationCard key={i} rec={rec} index={i} />
                    ))}
                  </div>
                </Card>
              )}

              {/* Security concerns */}
              {result.security_concerns?.length > 0 && (
                <Card padding={false}>
                  <div className="px-6 py-4 border-b border-red-500/15 bg-red-500/3">
                    <h3 className="text-sm font-semibold text-red-400 flex items-center gap-2">
                      <Shield size={15} /> Security Concerns
                    </h3>
                  </div>
                  <div className="p-4 space-y-2">
                    {result.security_concerns.map((concern, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-white/60">
                        <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
                        {concern}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* Chat CTA */}
              <div className="flex items-center gap-4 p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
                <MessageSquare size={18} className="text-cyan-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white/80">Have questions about this review?</p>
                  <p className="text-xs text-white/40 mt-0.5">Start a conversation with AI about this specific analysis</p>
                </div>
                <Button variant="ai" size="sm" onClick={handleStartChat} icon={ChevronRight}>
                  Chat
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
