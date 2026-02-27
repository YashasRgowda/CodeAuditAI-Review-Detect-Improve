'use client';
// Button.js — Animated button with variant support (primary, ghost, danger, ai)
import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50 shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.40)]',
  ghost:   'bg-transparent hover:bg-white/5 text-white/70 hover:text-white border border-white/8 hover:border-white/15',
  ai:      'bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 hover:text-cyan-300 border border-cyan-500/30 hover:border-cyan-500/50',
  danger:  'bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/30',
  outline: 'bg-transparent hover:bg-white/5 text-white border border-white/15 hover:border-white/30',
};

const sizes = {
  sm:  'px-3 py-1.5 text-xs gap-1.5',
  md:  'px-4 py-2   text-sm gap-2',
  lg:  'px-6 py-2.5 text-sm gap-2',
  xl:  'px-8 py-3   text-base gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  onClick,
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled || loading ? 1 : 1.01 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 cursor-pointer
        disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' || size === 'xl' ? 18 : 16} />
      ) : null}
      {children}
      {!loading && IconRight && (
        <IconRight size={size === 'sm' ? 14 : 16} className="opacity-60" />
      )}
    </motion.button>
  );
}
