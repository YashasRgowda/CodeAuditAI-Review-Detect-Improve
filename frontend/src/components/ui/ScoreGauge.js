'use client';
// ScoreGauge.js — Animated circular score ring (like Raycast metrics)
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function getColor(score) {
  if (score >= 80) return { stroke: '#10b981', text: 'text-emerald-400', glow: 'rgba(16,185,129,0.3)' };
  if (score >= 60) return { stroke: '#f59e0b', text: 'text-amber-400',   glow: 'rgba(245,158,11,0.3)'  };
  return               { stroke: '#ef4444', text: 'text-red-400',     glow: 'rgba(239,68,68,0.3)'   };
}

export default function ScoreGauge({ score = 0, label = 'Score', size = 80, strokeWidth = 5 }) {
  const [displayed, setDisplayed] = useState(0);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const { stroke, text, glow } = getColor(score);
  const progress = (displayed / 100) * circumference;

  useEffect(() => {
    let frame;
    let current = 0;
    const step = () => {
      current += 2;
      if (current <= score) {
        setDisplayed(current);
        frame = requestAnimationFrame(step);
      } else {
        setDisplayed(score);
      }
    };
    const timer = setTimeout(() => { frame = requestAnimationFrame(step); }, 200);
    return () => { clearTimeout(timer); cancelAnimationFrame(frame); };
  }, [score]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          <circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke={stroke} strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ filter: `drop-shadow(0 0 6px ${glow})` }}
            transition={{ duration: 0.05, ease: 'linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold text-lg leading-none ${text}`}>{displayed}</span>
        </div>
      </div>
      <span className="text-xs text-white/40 font-medium">{label}</span>
    </div>
  );
}
