// tokens.js — Design System Tokens v2
// Single source of truth — Neon-inspired: monochrome base, one green accent.
// Change ONE value here → updates across the entire app.

export const colors = {
  // Backgrounds — true black
  bgBase:      '#000000',
  bgElevated:  '#0a0a0a',
  bgSurface:   '#111111',
  bgSurface2:  '#191919',
  bgSurface3:  '#222222',

  // Borders — barely visible
  border:      'rgba(255,255,255,0.06)',
  borderHover: 'rgba(255,255,255,0.10)',

  // Accent — ONE color: electric green
  accent: {
    dim:   'rgba(0,229,153,0.08)',
    mid:   'rgba(0,229,153,0.15)',
    full:  '#00e599',
    light: '#33ffbb',
    glow:  'rgba(0,229,153,0.25)',
  },

  // Status (used sparingly in data / scores)
  success: { dim: 'rgba(0,229,153,0.10)', full: '#00e599' },
  warning: { dim: 'rgba(255,178,36,0.10)', full: '#ffb224' },
  danger:  { dim: 'rgba(255,76,76,0.10)',  full: '#ff4c4c' },

  // Text — white with opacity hierarchy
  text: {
    primary:   '#ffffff',
    secondary: 'rgba(255,255,255,0.60)',
    muted:     'rgba(255,255,255,0.35)',
    faint:     'rgba(255,255,255,0.20)',
  },
};

// Animation durations
export const animation = {
  fast:   '150ms',
  normal: '250ms',
  slow:   '400ms',
  page:   '350ms',
};

// Risk level → color mapping
export const riskColors = {
  low:      { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  medium:   { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/30',   dot: 'bg-amber-400'   },
  high:     { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/30',     dot: 'bg-red-400'     },
  critical: { bg: 'bg-red-600/15',     text: 'text-red-300',     border: 'border-red-600/40',     dot: 'bg-red-300'     },
};

// Agent definitions for Multi-Agent page
export const agents = [
  {
    id:    'security',
    name:  'Security Agent',
    icon:  'Shield',
    color: { primary: '#ff4c4c', dim: 'rgba(255,76,76,0.10)', glow: 'rgba(255,76,76,0.25)' },
    description: 'Scans for vulnerabilities, SQL injection, XSS, exposed secrets',
  },
  {
    id:    'performance',
    name:  'Performance Agent',
    icon:  'Zap',
    color: { primary: '#ffb224', dim: 'rgba(255,178,36,0.10)', glow: 'rgba(255,178,36,0.25)' },
    description: 'Detects N+1 queries, memory leaks, blocking operations',
  },
  {
    id:    'architecture',
    name:  'Architecture Agent',
    icon:  'Layers',
    color: { primary: '#00e599', dim: 'rgba(0,229,153,0.10)', glow: 'rgba(0,229,153,0.25)' },
    description: 'Reviews design patterns, coupling, SOLID principles',
  },
];

// Nav items for sidebar
export const navItems = [
  { href: '/',            label: 'Dashboard',      icon: 'LayoutDashboard', exact: true  },
  { href: '/repositories',label: 'Repositories',   icon: 'FolderGit2',      exact: false },
  { href: '/analysis',    label: 'Analysis',        icon: 'BarChart3',       exact: false },
  { href: '/chat',        label: 'AI Chat',         icon: 'MessageSquare',   exact: false, ai: true },
  { href: '/agents',      label: 'Multi-Agent',     icon: 'Bot',             exact: false, ai: true },
  { href: '/autofix',     label: 'Auto-Fix',        icon: 'Wrench',          exact: false, ai: true },
  { href: '/knowledge',   label: 'Knowledge Base',  icon: 'Brain',           exact: false, ai: true },
  { href: '/settings',    label: 'Settings',        icon: 'Settings',        exact: false },
];
