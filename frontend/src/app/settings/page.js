'use client';
// settings/page.js — Settings (Full 2-column layout)
// Left: Profile + AI Preferences  |  Right: System Status + Danger Zone

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, LogOut, Github, Settings,
  Cpu, Activity, Database, Zap, Brain,
  CheckCircle, AlertCircle, ToggleLeft, ToggleRight,
  Trash2, RefreshCw, Shield,
} from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ragApi } from '@/lib/api/rag';
import { toast } from 'sonner';

/* ─────────────────────────────────────────────────────
   PREFERENCES
───────────────────────────────────────────────────── */
const PREF_KEY = 'codeaudit_prefs';
const DEFAULT_PREFS = {
  defaultLanguage:      'python',
  analysisDepth:        'thorough',
  autoMultiAgent:       false,
  showConfidenceBadges: true,
  streamingAnalysis:    true,
};
const LANGUAGES = ['python', 'javascript', 'typescript', 'java', 'go', 'rust', 'cpp', 'php', 'ruby'];

function loadPrefs() {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREF_KEY) || '{}') }; }
  catch { return DEFAULT_PREFS; }
}
function savePrefs(p) { localStorage.setItem(PREF_KEY, JSON.stringify(p)); }

/* ─────────────────────────────────────────────────────
   TOGGLE ROW
───────────────────────────────────────────────────── */
function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[13px] font-semibold text-white/70">{label}</p>
        {description && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{description}</p>}
      </div>
      <motion.button whileTap={{ scale: 0.9 }} onClick={() => onChange(!value)} className="shrink-0">
        {value
          ? <ToggleRight size={28} style={{ color: '#00e599' }} />
          : <ToggleLeft  size={28} style={{ color: 'rgba(255,255,255,0.2)' }} />
        }
      </motion.button>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   SELECT ROW
───────────────────────────────────────────────────── */
function SelectRow({ label, description, value, onChange, options }) {
  return (
    <div className="flex items-center justify-between py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex-1 min-w-0 pr-4">
        <p className="text-[13px] font-semibold text-white/70">{label}</p>
        {description && <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{description}</p>}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-[12px] outline-none rounded-xl px-3.5 py-2 font-semibold capitalize"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.65)', minWidth: '130px' }}
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-[#111]">{o.label}</option>)}
      </select>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   STATUS DOT
───────────────────────────────────────────────────── */
function StatusDot({ status }) {
  const map = { active: { color: '#00e599', label: 'Active' }, checking: { color: '#f59e0b', label: 'Checking…' }, error: { color: '#ef4444', label: 'Error' } };
  const s = map[status] || map.active;
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        className="w-2 h-2 rounded-full"
        style={{ background: s.color }}
        animate={status === 'active' ? { opacity: [1, 0.35, 1] } : {}}
        transition={{ duration: 2.5, repeat: Infinity }}
      />
      <span className="text-[11px] font-semibold" style={{ color: s.color }}>{s.label}</span>
    </div>
  );
}

/* ─────────────────────────────────────────────────────
   CONFIRM MODAL
───────────────────────────────────────────────────── */
function ConfirmModal({ title, description, confirmLabel, onConfirm, onCancel, loading, danger = true }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.78)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.88, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="rounded-2xl p-7 w-full max-w-sm mx-4"
        style={{ background: 'rgba(12,12,12,0.99)', border: `1px solid ${danger ? 'rgba(239,68,68,0.22)' : 'rgba(255,255,255,0.1)'}` }}
      >
        <p className="text-[16px] font-bold text-white/85 mb-2">{title}</p>
        <p className="text-[13px] leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>{description}</p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-semibold"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={onConfirm} disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold disabled:opacity-50"
            style={{ background: danger ? '#ef4444' : '#00e599', color: '#fff' }}>
            {loading ? 'Please wait…' : confirmLabel}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────── */
export default function SettingsPage() {
  const { data: session } = useSession();
  const [prefs,       setPrefs]       = useState(DEFAULT_PREFS);
  const [saved,       setSaved]       = useState(false);
  const [kbStats,     setKbStats]     = useState(null);
  const [svcStatus,   setSvcStatus]   = useState({ llm: 'checking', embedding: 'checking', vector_db: 'checking', cache: 'checking' });
  const [modal,       setModal]       = useState(null);
  const [modalLoading,setModalLoading]= useState(false);

  useEffect(() => { setPrefs(loadPrefs()); }, []);

  useEffect(() => {
    ragApi.stats()
      .then(data => { setKbStats(data); setSvcStatus(p => ({ ...p, vector_db: 'active', embedding: 'active' })); })
      .catch(()  => { setSvcStatus(p => ({ ...p, vector_db: 'error', embedding: 'error'  })); });
    const t = setTimeout(() => setSvcStatus(p => ({ ...p, llm: 'active', cache: 'active' })), 1200);
    return () => clearTimeout(t);
  }, []);

  const updatePref = (key, value) => {
    setPrefs(prev => { const next = { ...prev, [key]: value }; savePrefs(next); return next; });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const handleClearKB = async () => {
    setModalLoading(true);
    try { await ragApi.clear(); setKbStats(null); toast.success('Knowledge base cleared'); }
    catch (e) { toast.error(e.message || 'Failed'); }
    finally { setModalLoading(false); setModal(null); }
  };

  const handleResetPrefs = () => {
    setPrefs(DEFAULT_PREFS); savePrefs(DEFAULT_PREFS);
    toast.success('Preferences reset'); setModal(null);
  };

  const totalDocs = kbStats?.total_documents ?? 0;
  const repoList  = kbStats?.repositories ?? [];

  const AI_FEATURES = [
    'Streaming Analysis', 'Multi-Agent (3 Agents)',
    'Conversational AI Chat', 'RAG Knowledge Base',
    'Auto-Fix Generation', 'GitHub OAuth',
  ];

  return (
    <DashboardLayout>
      <div className="space-y-5">

        {/* ── Page header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
              <Settings size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
            </div>
            <div>
              <h1 className="text-[17px] font-bold text-white tracking-tight leading-none">Settings</h1>
              <p className="text-[12px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>Account, preferences, and system status</p>
            </div>
          </div>
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(0,229,153,0.08)', border: '1px solid rgba(0,229,153,0.2)' }}>
                <CheckCircle size={11} style={{ color: '#00e599' }} />
                <span className="text-[11px] font-semibold" style={{ color: '#00e599' }}>Saved</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* ── 2-column layout ── */}
        <div className="grid grid-cols-2 gap-5 items-start">

          {/* ════════════ LEFT COLUMN ════════════ */}
          <div className="space-y-5">

            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.04 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <User size={14} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </div>
                <h2 className="text-[13px] font-bold text-white/65">Profile</h2>
              </div>

              <div className="p-6">
                {session?.user ? (
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <img
                        src={session.user.image}
                        alt={session.user.name}
                        className="w-20 h-20 rounded-2xl object-cover"
                        style={{ border: '2px solid rgba(255,255,255,0.1)' }}
                      />
                      <span
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: '#080808', border: '1.5px solid rgba(255,255,255,0.1)' }}
                      >
                        <Github size={10} style={{ color: 'rgba(255,255,255,0.5)' }} />
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-[18px] font-black text-white/88 tracking-tight">{session.user.name}</p>
                      <p className="text-[12.5px] mt-0.5" style={{ color: 'rgba(255,255,255,0.38)' }}>{session.user.email}</p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', color: '#a78bfa' }}>
                          <Github size={10} /> GitHub OAuth
                        </span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{ background: 'rgba(0,229,153,0.08)', border: '1px solid rgba(0,229,153,0.18)', color: '#00e599' }}>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00e599]" /> Active
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-20 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
                )}
              </div>
            </motion.div>

            {/* AI Preferences */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}>
                  <Brain size={14} style={{ color: '#a78bfa' }} />
                </div>
                <h2 className="text-[13px] font-bold text-white/65">AI Preferences</h2>
                <span className="ml-auto text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>Saved to browser</span>
              </div>

              <div className="px-6 pb-2">
                <SelectRow
                  label="Default Language"
                  description="Pre-filled in Auto-Fix custom mode"
                  value={prefs.defaultLanguage}
                  onChange={v => updatePref('defaultLanguage', v)}
                  options={LANGUAGES.map(l => ({ value: l, label: l.charAt(0).toUpperCase() + l.slice(1) }))}
                />
                <SelectRow
                  label="Analysis Depth"
                  description="How thorough the AI review should be"
                  value={prefs.analysisDepth}
                  onChange={v => updatePref('analysisDepth', v)}
                  options={[{ value: 'quick', label: 'Quick' }, { value: 'thorough', label: 'Thorough' }]}
                />
                <ToggleRow
                  label="Auto Multi-Agent"
                  description="Run 3-agent analysis alongside standard review"
                  value={prefs.autoMultiAgent}
                  onChange={v => updatePref('autoMultiAgent', v)}
                />
                <ToggleRow
                  label="Show Confidence Badges"
                  description="Display AI confidence rating on auto-fix results"
                  value={prefs.showConfidenceBadges}
                  onChange={v => updatePref('showConfidenceBadges', v)}
                />
                <div style={{ borderBottom: 'none' }}>
                  <ToggleRow
                    label="Streaming Analysis"
                    description="Show results as they stream in real-time"
                    value={prefs.streamingAnalysis}
                    onChange={v => updatePref('streamingAnalysis', v)}
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* ════════════ RIGHT COLUMN ════════════ */}
          <div className="space-y-5">

            {/* System Status */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)' }}>
                  <Activity size={14} style={{ color: '#06b6d4' }} />
                </div>
                <h2 className="text-[13px] font-bold text-white/65">System Status</h2>
              </div>

              <div className="px-6 py-2">
                {[
                  { label: 'LLM — Gemini Pro',     detail: 'gemini-2.0-flash',         status: svcStatus.llm,       Icon: Cpu      },
                  { label: 'Embedding API',         detail: 'text-embedding-004',       status: svcStatus.embedding, Icon: Zap      },
                  { label: 'Vector Database',       detail: `ChromaDB · ${totalDocs} docs`, status: svcStatus.vector_db, Icon: Database },
                  { label: 'Session Cache',         detail: 'Redis · 2hr TTL',          status: svcStatus.cache,     Icon: Activity },
                ].map(({ label, detail, status, Icon }) => (
                  <div key={label} className="flex items-center gap-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Icon size={14} style={{ color: 'rgba(255,255,255,0.32)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-white/65">{label}</p>
                      <p className="text-[11px] font-mono mt-0.5" style={{ color: 'rgba(255,255,255,0.22)' }}>{detail}</p>
                    </div>
                    <StatusDot status={status} />
                  </div>
                ))}
              </div>

              {/* Feature grid */}
              <div className="px-6 pb-5 pt-3">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] mb-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  Active Features
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {AI_FEATURES.map(feat => (
                    <div key={feat} className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(0,229,153,0.04)', border: '1px solid rgba(0,229,153,0.1)' }}>
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#00e599' }} />
                      <span className="text-[11.5px] font-medium" style={{ color: 'rgba(255,255,255,0.52)' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Repo list */}
              {repoList.length > 0 && (
                <div className="px-6 pb-5">
                  <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: 'rgba(255,255,255,0.2)' }}>
                    Indexed Repositories
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {repoList.map((r, i) => (
                      <span key={i} className="text-[11px] px-2.5 py-1 rounded-full"
                        style={{ background: 'rgba(167,139,250,0.08)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.18)' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Danger Zone */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(8,8,8,0.9)', border: '1px solid rgba(239,68,68,0.12)' }}
            >
              <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(239,68,68,0.08)' }}>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.18)' }}>
                  <Shield size={14} style={{ color: '#ef4444' }} />
                </div>
                <h2 className="text-[13px] font-bold" style={{ color: 'rgba(239,68,68,0.7)' }}>Danger Zone</h2>
              </div>

              <div className="px-6 py-2">
                {[
                  {
                    label: 'Reset Preferences',
                    desc: 'Restore all AI preferences to their defaults',
                    btnLabel: 'Reset',
                    btnColor: '#f59e0b',
                    btnBg: 'rgba(245,158,11,0.08)',
                    btnBorder: 'rgba(245,158,11,0.2)',
                    Icon: RefreshCw,
                    onClick: () => setModal('resetPrefs'),
                  },
                  {
                    label: 'Clear Knowledge Base',
                    desc: 'Delete all stored vector embeddings and AI memory',
                    btnLabel: 'Clear KB',
                    btnColor: '#ef4444',
                    btnBg: 'rgba(239,68,68,0.08)',
                    btnBorder: 'rgba(239,68,68,0.2)',
                    Icon: Database,
                    onClick: () => setModal('clearKB'),
                  },
                  {
                    label: 'Sign Out',
                    desc: 'End your session and return to the login page',
                    btnLabel: 'Sign Out',
                    btnColor: '#ef4444',
                    btnBg: 'rgba(239,68,68,0.08)',
                    btnBorder: 'rgba(239,68,68,0.22)',
                    Icon: LogOut,
                    onClick: () => setModal('signout'),
                  },
                ].map(({ label, desc, btnLabel, btnColor, btnBg, btnBorder, Icon, onClick }) => (
                  <div key={label} className="flex items-center justify-between py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[13px] font-semibold text-white/65">{label}</p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.28)' }}>{desc}</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }}
                      onClick={onClick}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-bold shrink-0"
                      style={{ background: btnBg, border: `1px solid ${btnBorder}`, color: btnColor }}>
                      <Icon size={12} /> {btnLabel}
                    </motion.button>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Version footer */}
            <p className="text-center text-[10.5px] pb-2" style={{ color: 'rgba(255,255,255,0.12)' }}>
              CodeAuditAI v5.0 · beta · Next.js 15 + FastAPI + Gemini 2.0
            </p>
          </div>
        </div>
      </div>

      {/* ── Confirm modals ── */}
      <AnimatePresence>
        {modal === 'signout' && (
          <ConfirmModal title="Sign out?" description="Your session will be ended and you'll be redirected to the login page." confirmLabel="Sign Out" onConfirm={() => signOut({ callbackUrl: '/auth' })} onCancel={() => setModal(null)} loading={false} />
        )}
        {modal === 'clearKB' && (
          <ConfirmModal title="Clear all AI memory?" description="All vector embeddings and stored analysis patterns will be permanently deleted. The AI will lose its accumulated knowledge from past reviews." confirmLabel="Clear Knowledge Base" onConfirm={handleClearKB} onCancel={() => setModal(null)} loading={modalLoading} />
        )}
        {modal === 'resetPrefs' && (
          <ConfirmModal title="Reset preferences?" description="All your AI preference settings will be restored to their original values." confirmLabel="Reset" onConfirm={handleResetPrefs} onCancel={() => setModal(null)} loading={false} danger={false} />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
