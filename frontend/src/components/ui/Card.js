'use client';
// Card.js — Glass morphism card with optional hover glow
import { motion } from 'framer-motion';

export default function Card({
  children,
  className = '',
  hover = false,
  glow = false,
  padding = true,
  animate = false,
  delay = 0,
  onClick,
}) {
  const base = `
    glass-card
    ${padding ? 'p-6' : ''}
    ${hover ? 'hover:border-white/12 transition-all duration-300 cursor-pointer' : ''}
    ${glow ? 'hover:shadow-[0_0_30px_rgba(124,58,237,0.12)]' : ''}
    ${className}
  `;

  if (animate) {
    return (
      <motion.div
        className={base}
        onClick={onClick}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay, ease: 'easeOut' }}
        whileHover={hover ? { y: -2 } : undefined}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={base} onClick={onClick}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-4 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-sm font-semibold text-white/90 ${className}`}>
      {children}
    </h3>
  );
}
