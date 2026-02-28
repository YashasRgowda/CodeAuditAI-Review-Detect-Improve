'use client';
// CommitListItem.js — Single commit row
// Cognac Amber theme (Rolls-Royce interior) · Short SHA with copy · Analyze pre-fills Quick Analysis

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  GitCommit, User, Clock, Plus, Minus,
  Copy, Check, ExternalLink, Zap,
} from 'lucide-react';

// ── Cognac amber palette ───────────────────────────────────────────────
const A = {
  full:    '#b8732a',
  glow:    'rgba(184,115,42,0.18)',
  border:  'rgba(184,115,42,0.28)',
  text:    'rgba(220,165,88,0.92)',
  faint:   'rgba(184,115,42,0.08)',
  dim:     'rgba(184,115,42,0.45)',
};

export default function CommitListItem({ commit, repoId, index }) {
  const router              = useRouter();
  const [hovered, setHovered] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const shortSha = commit.sha?.slice(0, 7) || '—';
  const fullSha  = commit.sha  || '—';

  const date = commit.author?.date
    ? new Date(commit.author.date).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const copysha = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(fullSha).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

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
        borderLeft: `2px solid ${hovered ? A.border : 'transparent'}`,
        background: hovered ? A.faint : 'transparent',
        transition: 'background 0.15s, border-color 0.15s',
      }}
    >
      {/* subtle amber left glow on hover */}
      {hovered && (
        <div className="absolute left-0 top-0 bottom-0 w-20 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 0% 50%, rgba(184,115,42,0.07) 0%, transparent 100%)` }} />
      )}

      <div className="relative flex items-center gap-4 px-6 py-4">

        {/* ── Left: icon ── */}
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all duration-150"
          style={{
            background: hovered ? A.faint : 'rgba(255,255,255,0.025)',
            border: `1px solid ${hovered ? A.border : '#1e1e1e'}`,
          }}
        >
          <GitCommit size={13} style={{ color: hovered ? A.text : 'rgba(255,255,255,0.25)' }} />
        </div>

        {/* ── Center: message + meta ── */}
        <div className="flex-1 min-w-0">

          {/* Row 1: commit message */}
          <p
            className="text-[13px] font-semibold leading-snug line-clamp-1 mb-1.5 transition-colors duration-150"
            style={{ color: hovered ? 'rgba(255,255,255,0.90)' : 'rgba(255,255,255,0.72)' }}
          >
            {commit.message || '(no message)'}
          </p>

          {/* Row 2: SHA + author + date + stats */}
          <div className="flex items-center gap-3 flex-wrap">

            {/* SHA pill — click to copy full SHA */}
            <button
              onClick={copysha}
              title={`Click to copy full SHA: ${fullSha}`}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md transition-all duration-150 cursor-pointer"
              style={{
                background: hovered ? 'rgba(184,115,42,0.12)' : 'rgba(184,115,42,0.06)',
                border: `1px solid ${hovered ? A.border : 'rgba(184,115,42,0.15)'}`,
              }}
            >
              <span className="text-[11px] font-mono font-bold" style={{ color: A.text }}>
                {shortSha}
              </span>
              {copied
                ? <Check size={9} style={{ color: '#6aab8e' }} />
                : <Copy size={9} style={{ color: A.dim }} />
              }
            </button>

            {/* divider dot */}
            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>

            {/* Author */}
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.32)' }}>
              <User size={9} />
              {commit.author?.name || 'Unknown'}
            </span>

            {/* divider dot */}
            <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>

            {/* Date */}
            <span className="flex items-center gap-1 text-[11px]" style={{ color: 'rgba(255,255,255,0.28)' }}>
              <Clock size={9} />
              {date}
            </span>

            {/* Stats */}
            {commit.stats && (
              <>
                <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: 10 }}>·</span>
                <span className="flex items-center gap-0.5 text-[11px]" style={{ color: '#6aab8e' }}>
                  <Plus size={9} />{commit.stats.additions}
                </span>
                <span className="flex items-center gap-0.5 text-[11px]" style={{ color: '#f87171' }}>
                  <Minus size={9} />{commit.stats.deletions}
                </span>
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.20)' }}>
                  {commit.stats.total} changes
                </span>
              </>
            )}

            {/* Copied confirmation */}
            {copied && (
              <span className="text-[10px] font-medium" style={{ color: '#6aab8e' }}>
                SHA copied!
              </span>
            )}
          </div>
        </div>

        {/* ── Right: action buttons ── */}
        <div
          className="flex items-center gap-2 shrink-0 transition-all duration-200"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateX(0)' : 'translateX(6px)' }}
        >
          {/* Open on GitHub */}
          {commit.html_url && (
            <a href={commit.html_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-xl cursor-pointer transition-all duration-150"
                style={{ color: 'rgba(255,255,255,0.28)', border: '1px solid #1e1e1e' }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  e.currentTarget.style.borderColor = '#2e2e2e';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
                  e.currentTarget.style.borderColor = '#1e1e1e';
                }}
                title="View on GitHub"
              >
                <ExternalLink size={12} />
              </button>
            </a>
          )}

          {/* Analyze button */}
          <Link href={`/analysis/quick?repo=${repoId}&sha=${fullSha}`} onClick={e => e.stopPropagation()}>
            <button
              className="flex items-center gap-1.5 px-3.5 py-[7px] rounded-xl text-[12px] font-bold cursor-pointer transition-all duration-150"
              style={{
                background: A.faint,
                border: `1px solid ${A.border}`,
                color: A.text,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(184,115,42,0.16)';
                e.currentTarget.style.borderColor = 'rgba(184,115,42,0.45)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = A.faint;
                e.currentTarget.style.borderColor = A.border;
              }}
            >
              <Zap size={11} />
              Analyze
            </button>
          </Link>
        </div>

      </div>
    </motion.div>
  );
}
