'use client';
// autofix/page.js — AI Auto-Fix Generator
// Users select an issue and AI generates the exact corrected code
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wrench, Sparkles, Copy, Check, AlertTriangle, Code, ChevronRight } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import CodeBlock from '@/components/ui/CodeBlock';
import { autofixApi } from '@/lib/api/autofix';
import { toast } from 'sonner';

const ISSUE_TYPES = ['security', 'performance', 'maintainability', 'style', 'bug'];
const SEVERITIES  = ['high', 'medium', 'low'];
const LANGUAGES   = ['python', 'javascript', 'typescript', 'java', 'go', 'rust'];

export default function AutoFixPage() {
  const [mode, setMode]           = useState('custom'); // custom | commit
  const [repoId, setRepoId]       = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [issueIndex, setIssueIndex] = useState('0');
  const [customCode, setCustomCode] = useState('');
  const [issueDesc, setIssueDesc]   = useState('');
  const [issueType, setIssueType]   = useState('performance');
  const [severity, setSeverity]     = useState('medium');
  const [language, setLanguage]     = useState('python');
  const [loading, setLoading]       = useState(false);
  const [result, setResult]         = useState(null);

  const runFix = async () => {
    setLoading(true);
    setResult(null);
    try {
      let data;
      if (mode === 'custom') {
        if (!customCode || !issueDesc) return toast.error('Provide code and issue description');
        data = await autofixApi.fixCustom({
          code_snippet: customCode,
          issue_description: issueDesc,
          issue_type: issueType,
          severity: severity,
          language: language,
        });
      } else {
        if (!repoId || !commitSha) return toast.error('Provide repo ID and commit SHA');
        data = await autofixApi.fixIssue({
          repository_id: parseInt(repoId),
          commit_sha: commitSha,
          issue_index: parseInt(issueIndex),
        });
      }
      setResult(data);
      toast.success('Fix generated!');
    } catch (e) {
      toast.error(e.message || 'Failed to generate fix');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2 mb-1">
            <Wrench size={20} className="text-emerald-400" />
            Auto-Fix
          </h1>
          <p className="text-sm text-white/35">AI generates the exact corrected code — you approve and apply it</p>
        </div>

        {/* How it works info banner */}
        <div className="flex items-start gap-3 p-4 rounded-xl border border-white/8 bg-white/2">
          <Sparkles size={16} className="text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white/80">Human-in-the-Loop Design</p>
            <p className="text-xs text-white/40 mt-0.5 leading-relaxed">
              AI suggests the fix, you review it. Only copy-paste when you&apos;re satisfied.
              The AI explains what changed and why, so you stay in control.
            </p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-xl border border-white/8 overflow-hidden w-fit">
          {[{ id: 'custom', label: '📝 Custom Code' }, { id: 'commit', label: '🔗 From Commit' }].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`px-5 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                mode === m.id ? 'bg-emerald-500/15 text-emerald-300' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Input form */}
        <Card>
          {mode === 'custom' ? (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Paste Your Code</label>
                <textarea
                  value={customCode}
                  onChange={e => setCustomCode(e.target.value)}
                  placeholder="Paste the code that has an issue..."
                  rows={8}
                  className="w-full bg-white/4 border border-white/8 rounded-xl px-4 py-3 text-sm text-white/80 font-mono placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Describe the Issue</label>
                <input
                  value={issueDesc}
                  onChange={e => setIssueDesc(e.target.value)}
                  placeholder="e.g. This function has an N+1 query problem inside the loop"
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Issue Type', value: issueType, set: setIssueType, opts: ISSUE_TYPES },
                  { label: 'Severity',   value: severity,  set: setSeverity,  opts: SEVERITIES  },
                  { label: 'Language',   value: language,  set: setLanguage,  opts: LANGUAGES   },
                ].map(({ label, value, set, opts }) => (
                  <div key={label}>
                    <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">{label}</label>
                    <select
                      value={value}
                      onChange={e => set(e.target.value)}
                      className="w-full bg-white/4 border border-white/8 rounded-lg px-3 py-2.5 text-sm text-white/70 focus:outline-none focus:border-emerald-500/40 transition-all capitalize"
                    >
                      {opts.map(o => <option key={o} value={o} className="bg-[#111] capitalize">{o}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Repository ID</label>
                <input value={repoId} onChange={e => setRepoId(e.target.value)} placeholder="e.g. 20"
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Commit SHA</label>
                <input value={commitSha} onChange={e => setCommitSha(e.target.value)} placeholder="full SHA"
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 font-mono placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider font-medium block mb-1.5">Issue Index</label>
                <input value={issueIndex} onChange={e => setIssueIndex(e.target.value)} placeholder="0"
                  className="w-full bg-white/4 border border-white/8 rounded-lg px-4 py-2.5 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-emerald-500/40 transition-all"
                />
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-white/6">
            <Button onClick={runFix} loading={loading} icon={Sparkles} variant="primary"
              className="bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            >
              {loading ? 'Generating Fix...' : 'Generate Fix'}
            </Button>
          </div>
        </Card>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Issue summary */}
              {result.issue_description && (
                <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                  <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-amber-400 mb-1">Issue Found</p>
                    <p className="text-sm text-white/65">{result.issue_description}</p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              {result.explanation && (
                <Card className="border-emerald-500/15 bg-emerald-500/3">
                  <h3 className="text-xs text-emerald-400 uppercase tracking-wider font-medium mb-2">What Changed & Why</h3>
                  <p className="text-sm text-white/70 leading-relaxed">{result.explanation}</p>
                </Card>
              )}

              {/* Fixed code */}
              {result.fixed_code && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Code size={14} className="text-emerald-400" />
                    <h3 className="text-sm font-semibold text-white/80">Fixed Code</h3>
                    <span className="text-xs text-white/30">— copy and apply to your codebase</span>
                  </div>
                  <CodeBlock
                    code={result.fixed_code}
                    language={result.language || language}
                    filename={`fixed.${result.language || language}`}
                  />
                </div>
              )}

              {/* Original for comparison */}
              {result.original_code && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-white/40">Original Code</h3>
                  </div>
                  <CodeBlock
                    code={result.original_code}
                    language={result.language || language}
                    filename={`original.${result.language || language}`}
                  />
                </div>
              )}

              {/* Additional fixes */}
              {result.additional_fixes?.length > 0 && (
                <Card>
                  <h3 className="text-sm font-semibold text-white/70 mb-3">Additional Improvements</h3>
                  <div className="space-y-2">
                    {result.additional_fixes.map((fix, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm text-white/55">
                        <ChevronRight size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                        {fix}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
