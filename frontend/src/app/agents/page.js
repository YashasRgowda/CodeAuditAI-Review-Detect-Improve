'use client';
// agents/page.js — Multi-Agent Analysis page
// Three specialist AI agents: Security, Performance, Architecture
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Layers, Bot, Play, CheckCircle, AlertTriangle, Clock, ChevronDown } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import ScoreGauge from '@/components/ui/ScoreGauge';
import { agentsApi } from '@/lib/api/agents';
import { toast } from 'sonner';

/* ---- Agent definitions ---- */
const AGENTS = [
  {
    id: 'security',
    name: 'Security Agent',
    icon: Shield,
    color: { bg: 'bg-red-500/10', border: 'border-red-500/25', icon: 'text-red-400', glow: 'rgba(239,68,68,0.15)', badge: 'red' },
    desc: 'Scans for OWASP vulnerabilities, SQL injection, XSS, exposed secrets, insecure dependencies',
  },
  {
    id: 'performance',
    name: 'Performance Agent',
    icon: Zap,
    color: { bg: 'bg-amber-500/10', border: 'border-amber-500/25', icon: 'text-amber-400', glow: 'rgba(245,158,11,0.15)', badge: 'amber' },
    desc: 'Detects N+1 queries, blocking I/O, memory leaks, algorithmic complexity issues',
  },
  {
    id: 'architecture',
    name: 'Architecture Agent',
    icon: Layers,
    color: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/25', icon: 'text-cyan-400', glow: 'rgba(6,182,212,0.15)', badge: 'cyan' },
    desc: 'Reviews SOLID principles, coupling, design patterns, code organization',
  },
];

/* ---- Scanning card ---- */
function AgentCard({ agent, status, report }) {
  const Icon = agent.icon;
  const c = agent.color;
  const [expanded, setExpanded] = useState(false);

  const statusMap = {
    idle:     { label: 'Waiting',   dotColor: 'bg-white/20',      textColor: 'text-white/30'   },
    running:  { label: 'Scanning',  dotColor: 'bg-amber-400 animate-pulse', textColor: 'text-amber-400' },
    complete: { label: 'Complete',  dotColor: 'bg-emerald-400',   textColor: 'text-emerald-400' },
    error:    { label: 'Error',     dotColor: 'bg-red-400',       textColor: 'text-red-400'     },
  };
  const st = statusMap[status] || statusMap.idle;

  return (
    <motion.div
      layout
      className={`rounded-2xl border p-5 relative overflow-hidden transition-all duration-300 ${
        status === 'running' ? `${c.bg} ${c.border}` : 'bg-white/2 border-white/8'
      }`}
      style={status === 'running' ? { boxShadow: `0 0 30px ${c.glow}` } : {}}
    >
      {/* Scan line animation when running */}
      {status === 'running' && (
        <motion.div
          className={`absolute left-0 right-0 h-px`}
          style={{ background: `linear-gradient(90deg, transparent, ${c.glow.replace('0.15', '0.8')}, transparent)` }}
          animate={{ top: ['0%', '100%'] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} border ${c.border} flex items-center justify-center`}>
            <Icon size={18} className={c.icon} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white/90">{agent.name}</h3>
            <p className="text-xs text-white/35 mt-0.5">{agent.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className={`w-1.5 h-1.5 rounded-full ${st.dotColor}`} />
          <span className={`text-xs ${st.textColor}`}>{st.label}</span>
        </div>
      </div>

      {/* Report output */}
      {report && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors cursor-pointer mb-2"
          >
            <ChevronDown size={13} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
            {expanded ? 'Hide details' : 'Show details'}
          </button>
          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className={`rounded-xl p-4 border ${c.bg} ${c.border} space-y-3`}>
                  {report.score !== undefined && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/40">Score:</span>
                      <span className={`text-sm font-bold ${c.icon}`}>{report.score}/100</span>
                    </div>
                  )}
                  {report.summary && (
                    <p className="text-xs text-white/60 leading-relaxed">{report.summary}</p>
                  )}
                  {report.issues?.length > 0 && (
                    <div className="space-y-2">
                      {report.issues.slice(0, 4).map((issue, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/55">
                          <AlertTriangle size={11} className={`${c.icon} shrink-0 mt-0.5 opacity-70`} />
                          {typeof issue === 'string' ? issue : issue.description || JSON.stringify(issue)}
                        </div>
                      ))}
                    </div>
                  )}
                  {report.recommendations?.length > 0 && (
                    <div className="space-y-1.5">
                      {report.recommendations.slice(0, 3).map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/50">
                          <CheckCircle size={11} className="text-emerald-400 shrink-0 mt-0.5" />
                          {typeof rec === 'string' ? rec : rec.description || JSON.stringify(rec)}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

export default function AgentsPage() {
  const [repoId, setRepoId]   = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [loading, setLoading]  = useState(false);
  const [agentStatus, setAgentStatus] = useState({ security: 'idle', performance: 'idle', architecture: 'idle' });
  const [reports, setReports]  = useState({});
  const [merged, setMerged]    = useState(null);
  const [streamLog, setStreamLog] = useState([]);

  const runAgents = async () => {
    if (!repoId || !commitSha) return toast.error('Enter repo ID and commit SHA');
    setLoading(true);
    setMerged(null);
    setReports({});
    setStreamLog([]);
    setAgentStatus({ security: 'idle', performance: 'idle', architecture: 'idle' });

    try {
      const res = await agentsApi.stream({ repository_id: parseInt(repoId), commit_sha: commitSha });
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

            if (event.type === 'agent_start') {
              setAgentStatus(prev => ({ ...prev, [event.agent]: 'running' }));
              setStreamLog(p => [...p, `▸ ${event.agent} agent started`]);
            } else if (event.type === 'agent_complete') {
              setAgentStatus(prev => ({ ...prev, [event.agent]: 'complete' }));
              setReports(prev => ({ ...prev, [event.agent]: event.report }));
              setStreamLog(p => [...p, `✓ ${event.agent} agent complete`]);
            } else if (event.type === 'all_agents_complete') {
              // All started at once for parallel execution
              const allAgents = ['security', 'performance', 'architecture'];
              allAgents.forEach(a => setAgentStatus(prev => ({ ...prev, [a]: 'running' })));
            } else if (event.type === 'complete' || event.type === 'merged') {
              setMerged(event.result || event.merged_result);
              setAgentStatus({ security: 'complete', performance: 'complete', architecture: 'complete' });
              setStreamLog(p => [...p, '✓ All agents complete — results merged']);
              toast.success('Multi-agent analysis complete!');
            } else if (event.type === 'progress') {
              setStreamLog(p => [...p, `▸ ${event.message || event.step}`]);
            }
          } catch {}
        }
      }
    } catch (e) {
      AGENTS.forEach(a => setAgentStatus(prev => ({ ...prev, [a.id]: 'error' })));
      toast.error(e.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Bot size={20} className="text-cyan-400" />
            Multi-Agent Analysis
          </h1>
          <p className="text-sm text-white/35">Three specialist AI agents run in parallel for deep code insights</p>
        </div>

        {/* Input */}
        <div className="glass-card p-5 flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Repository ID</label>
            <input
              value={repoId} onChange={e => setRepoId(e.target.value)} placeholder="e.g. 20"
              className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <div className="flex-[2]">
            <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Commit SHA</label>
            <input
              value={commitSha} onChange={e => setCommitSha(e.target.value)} placeholder="full commit SHA"
              className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 font-mono placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-all"
            />
          </div>
          <Button onClick={runAgents} loading={loading} icon={Play} variant="primary">
            {loading ? 'Running...' : 'Run All Agents'}
          </Button>
        </div>

        {/* Agent cards */}
        <div className="grid md:grid-cols-3 gap-4">
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              status={agentStatus[agent.id]}
              report={reports[agent.id]}
            />
          ))}
        </div>

        {/* Stream log */}
        {streamLog.length > 0 && (
          <div className="rounded-xl border border-white/8 bg-[#0d0d0d] p-4 max-h-36 overflow-y-auto">
            <div className="space-y-1">
              {streamLog.map((line, i) => (
                <p key={i} className={`text-xs font-mono ${line.startsWith('✓') ? 'text-emerald-400' : 'text-white/35'}`}>{line}</p>
              ))}
            </div>
          </div>
        )}

        {/* Merged result */}
        <AnimatePresence>
          {merged && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold text-white/70 flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-400" />
                Merged Analysis Report
              </h2>

              {/* Overall score gauges */}
              {(merged.overall_score || merged.security_score) && (
                <div className="glass-card p-6">
                  <div className="flex items-center justify-around flex-wrap gap-6">
                    {merged.overall_score      && <ScoreGauge score={merged.overall_score}       label="Overall" />}
                    {merged.security_score     && <ScoreGauge score={merged.security_score}      label="Security" />}
                    {merged.performance_score  && <ScoreGauge score={merged.performance_score}   label="Performance" />}
                    {merged.architecture_score && <ScoreGauge score={merged.architecture_score}  label="Architecture" />}
                  </div>
                </div>
              )}

              {/* Summary */}
              {merged.summary && (
                <div className="glass-card p-5">
                  <h3 className="text-xs text-white/40 uppercase tracking-wider font-medium mb-3">Summary</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{merged.summary}</p>
                </div>
              )}

              {/* Combined recommendations */}
              {merged.recommendations?.length > 0 && (
                <div className="glass-card p-0 overflow-hidden">
                  <div className="px-5 py-4 border-b border-white/6">
                    <h3 className="text-sm font-semibold text-white/70">
                      All Recommendations <span className="text-white/30 font-normal">({merged.recommendations.length})</span>
                    </h3>
                  </div>
                  <div className="p-4 space-y-2.5">
                    {merged.recommendations.map((rec, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3.5 rounded-xl border border-white/6 bg-white/2"
                      >
                        <span className="text-xs text-white/25 w-5 shrink-0 mt-0.5 font-mono">{i + 1}.</span>
                        <p className="text-sm text-white/65 leading-relaxed">
                          {typeof rec === 'string' ? rec : rec.description || rec.text || JSON.stringify(rec)}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
