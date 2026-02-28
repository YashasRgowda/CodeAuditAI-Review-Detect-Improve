'use client';
// PullRequestCard.js — Single pull request row
// Sage Jade Green accent · Clean compact layout · State badges

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GitPullRequest, User, Clock, Plus, Minus,
  ArrowRight, ExternalLink, Zap, GitMerge, GitBranchPlus,
} from 'lucide-react';

// ── Palette ─────────────────────────────────────────────────────────────
const G = {
  full:   '#6aab8e',
  border: 'rgba(106,171,142,0.28)',
  text:   'rgba(130,200,168,0.90)',
  faint:  'rgba(106,171,142,0.07)',
  glow:   'rgba(106,171,142,0.16)',
};

const STATE = {
  open:   { label: 'OPEN',   bg: 'rgba(106,171,142,0.10)', border: 'rgba(106,171,142,0.30)', color: 'rgba(130,200,168,0.88)' },
  closed: { label: 'CLOSED', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.25)', color: 'rgba(248,113,113,0.80)' },
  merged: { label: 'MERGED', bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', color: 'rgba(167,139,250,0.80)' },
};

function StateIcon({ state }) {
  if (state === 'merged') return <GitMerge size={12} />;
  if (state === 'closed') return <GitPullRequest size={12} />;
  return <GitBranchPlus size={12} />;
}

export default function PullRequestCard({ pullRequest: pr, onAnalyze, isAnalyzing, index = 0 }) {
  const [hovered,    setHovered]    = useState(false);
  const [analyzing,  setAnalyzing]  = useState(false);

  const state   = pr.state?.toLowerCase() || 'open';
  const badge   = STATE[state] || STATE.open;

  const date = pr.updated_at
    ? new Date(pr.updated_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      })
    : '—';

  const handleAnalyze = async (e) => {
    e.stopPropagation();
    if (analyzing || isAnalyzing) return;
    setAnalyzing(true);
    try { await onAnalyze?.(pr); }
    finally { setAnalyzing(false); }
  };

  const busy = analyzing || isAnalyzing;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.045, duration: 0.30, ease: [0.16, 1, 0.3, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative group"
      style={{
        borderBottom: '1px solid #151515',
        borderLeft: `2px solid ${hovered ? G.border : 'transparent'}`,
        background: hovered ? G.faint : 'transparent',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* left glow on hover */}
      {hovered && (
        <div className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 0% 50%, rgba(106,171,142,0.06) 0%, transparent 100%)' }} />
      )}

      <div className="relative flex items-center gap-4 px-6 py-4">

        {/* ── Icon ── */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
          style={{
            background: hovered ? G.faint : 'rgba(255,255,255,0.025)',
            border: `1px solid ${hovered ? G.border : '#1e1e1e'}`,
          }}
        >
          <GitPullRequest size={13} style={{ color: hovered ? G.text : 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">

          {/* Row 1: number + title + state badge */}
          <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
            <span className="text-[11px] font-mono font-bold shrink-0"
              style={{ color: 'rgba(255,255,255,0.30)' }}>
              #{pr.number}
            </span>
            <p className="text-[13px] font-semibold leading-snug line-clamp-1 transition-colors duration-150 flex-1 min-w-0"
              style={{ color: hovered ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.72)' }}>
              {pr.title || '(untitled)'}
            </p>
            {/* State badge */}
            <span
              className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide shrink-0"
              style={{ background: badge.bg, border: `1px solid ${badge.border}`, color: badge.color }}
            >
              <StateIcon state={state} />
              {badge.label}
            </span>
          </div>

          {/* Row 2: branch flow + author + date + stats */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* Branch flow */}
            {pr.head_branch && pr.base_branch && (
              <span className="flex items-center gap-1 text-[11px] font-mono"
                style={{ color: 'rgba(255,255,255,0.32)' }}>
                <span style={{ color: G.text }}>{pr.head_branch}</span>
                <ArrowRight size={9} style={{ color: 'rgba(255,255,255,0.20)' }} />
                <span>{pr.base_branch}</span>
              </span>
            )}

            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>

            {/* Author */}
            <span className="flex items-center gap-1 text-[11px]"
              style={{ color: 'rgba(255,255,255,0.32)' }}>
              <User size={9} />
              {pr.user || 'Unknown'}
            </span>

            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>

            {/* Date */}
            <span className="flex items-center gap-1 text-[11px]"
              style={{ color: 'rgba(255,255,255,0.26)' }}>
              <Clock size={9} />
              {date}
            </span>

            {/* Stats */}
            {(pr.additions !== undefined || pr.deletions !== undefined) && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>
                {pr.additions !== undefined && (
                  <span className="flex items-center gap-0.5 text-[11px]" style={{ color: '#6aab8e' }}>
                    <Plus size={9} />{pr.additions}
                  </span>
                )}
                {pr.deletions !== undefined && (
                  <span className="flex items-center gap-0.5 text-[11px]" style={{ color: '#f87171' }}>
                    <Minus size={9} />{pr.deletions}
                  </span>
                )}
                {pr.changed_files !== undefined && (
                  <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
                    {pr.changed_files} files
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div
          className="flex items-center gap-2 shrink-0 transition-all duration-200"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(6px)' }}
        >
          {/* Open on GitHub */}
          {pr.html_url && (
            <a href={pr.html_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-150"
                style={{ color: 'rgba(255,255,255,0.28)', border: '1px solid #1e1e1e' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; e.currentTarget.style.borderColor = '#2e2e2e'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.28)'; e.currentTarget.style.borderColor = '#1e1e1e'; }}
                title="View on GitHub"
              >
                <ExternalLink size={12} />
              </button>
            </a>
          )}

          {/* Analyze button */}
          <button
            onClick={handleAnalyze}
            disabled={busy}
            className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-xl text-[12px] font-bold cursor-pointer transition-all duration-150"
            style={{
              background: busy ? 'rgba(106,171,142,0.05)' : G.faint,
              border: `1px solid ${busy ? 'rgba(106,171,142,0.15)' : G.border}`,
              color: busy ? 'rgba(130,200,168,0.45)' : G.text,
              cursor: busy ? 'not-allowed' : 'pointer',
            }}
            onMouseEnter={e => { if (!busy) { e.currentTarget.style.background = 'rgba(106,171,142,0.14)'; e.currentTarget.style.borderColor = 'rgba(106,171,142,0.45)'; }}}
            onMouseLeave={e => { if (!busy) { e.currentTarget.style.background = G.faint; e.currentTarget.style.borderColor = G.border; }}}
          >
            {busy ? (
              <>
                <div className="w-3 h-3 border border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: 'rgba(106,171,142,0.40)', borderTopColor: 'transparent' }} />
                Analyzing…
              </>
            ) : (
              <>
                <Zap size={11} />
                Analyze PR
              </>
            )}
          </button>
        </div>

      </div>
    </motion.div>
  );
}
