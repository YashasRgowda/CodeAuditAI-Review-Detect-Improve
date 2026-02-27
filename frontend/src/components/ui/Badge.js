'use client';
// Badge.js — Status badge with dot indicator

const variants = {
  default:   'bg-white/8 text-white/70 border-white/10',
  violet:    'bg-violet-500/10 text-violet-300 border-violet-500/25',
  cyan:      'bg-cyan-500/10 text-cyan-300 border-cyan-500/25',
  emerald:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  amber:     'bg-amber-500/10 text-amber-400 border-amber-500/25',
  red:       'bg-red-500/10 text-red-400 border-red-500/25',
  low:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  medium:    'bg-amber-500/10 text-amber-400 border-amber-500/25',
  high:      'bg-red-500/10 text-red-400 border-red-500/25',
  critical:  'bg-red-600/15 text-red-300 border-red-600/40',
  ai:        'bg-cyan-500/8 text-cyan-400 border-cyan-500/20',
};

const dotColors = {
  default:   'bg-white/40',
  violet:    'bg-violet-400',
  cyan:      'bg-cyan-400',
  emerald:   'bg-emerald-400',
  amber:     'bg-amber-400',
  red:       'bg-red-400',
  low:       'bg-emerald-400',
  medium:    'bg-amber-400',
  high:      'bg-red-400',
  critical:  'bg-red-300',
  ai:        'bg-cyan-400',
};

export default function Badge({ children, variant = 'default', dot = false, className = '' }) {
  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-0.5
      text-xs font-medium rounded-full border
      ${variants[variant] || variants.default}
      ${className}
    `}>
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`} />
      )}
      {children}
    </span>
  );
}
