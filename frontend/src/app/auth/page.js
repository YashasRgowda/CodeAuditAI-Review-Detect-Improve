'use client';
/* ============================================================
   LANDING PAGE v3 — Neon-level design
   
   Architecture:
   1. HERO — full viewport, animated vertical bars background
   2. TECH MARQUEE — scrolling tech stack
   3. FEATURE SECTIONS — full page per feature, sticky left nav
   4. DASHBOARD MOCKUP — product preview
   5. CTA + FOOTER
   ============================================================ */
import { useEffect, useState, useRef, useMemo, useCallback, Fragment } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Github, ArrowRight, Shield, Zap, Layers, Brain,
  MessageSquare, Wrench, Terminal, ChevronRight,
  BarChart3, Code2, GitBranch, Lock, Database,
  Search, Activity, Eye, FileCode, Mail, Instagram,
} from 'lucide-react';

/* ── Inline brand icons not in lucide ── */
function LinkedInIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
      <rect x="2" y="9" width="4" height="12"/>
      <circle cx="4" cy="4" r="2"/>
    </svg>
  );
}
function MediumIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
    </svg>
  );
}

/* ============================================================
   ANIMATED HERO BACKGROUND — bars on RIGHT side only
   Text area (left) stays perfectly clean black.
   Bars concentrated in right 55% with natural clustering.
   ============================================================ */
function HeroBars() {
  const bars = useMemo(() => {
    const result = [];
    // 160 bars but ONLY in the right portion (40% to 100% of viewport)
    for (let i = 0; i < 160; i++) {
      const rawPos = i / 160; // 0 to 1
      const pos = 0.38 + rawPos * 0.62; // map to 38%-100% of viewport width
      // Clusters within the right zone
      const c1 = Math.exp(-((rawPos - 0.15) ** 2) / 0.01);
      const c2 = Math.exp(-((rawPos - 0.4) ** 2) / 0.02);
      const c3 = Math.exp(-((rawPos - 0.65) ** 2) / 0.015);
      const c4 = Math.exp(-((rawPos - 0.85) ** 2) / 0.008);
      const c5 = Math.exp(-((rawPos - 0.95) ** 2) / 0.005);
      const intensity = Math.max(c1, c2, c3, c4, c5, 0.06);
      // Brighter hue variation: green to cyan
      const h = 150 + Math.random() * 25;
      result.push({
        left: pos * 100 + (Math.random() - 0.5) * 0.3,
        width: 1 + Math.random() * 3 + (intensity > 0.5 ? 1 : 0),
        height: 15 + intensity * 80 + Math.random() * 10,
        opacity: 0.06 + intensity * 0.6,
        delay: Math.random() * 5,
        duration: 2.5 + Math.random() * 4.5,
        hue: h,
        glow: intensity > 0.35,
        bright: intensity > 0.6,
      });
    }
    return result;
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Bars — right side only */}
      {bars.map((bar, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            bottom: 0,
            left: `${bar.left}%`,
            width: `${bar.width}px`,
            height: `${bar.height}%`,
            background: bar.bright
              ? `linear-gradient(to top, hsla(${bar.hue},90%,60%,${bar.opacity}), hsla(${bar.hue},90%,50%,${bar.opacity * 0.4}), hsla(${bar.hue},90%,40%,${bar.opacity * 0.05}), transparent)`
              : `linear-gradient(to top, hsla(${bar.hue},85%,50%,${bar.opacity}), hsla(${bar.hue},85%,45%,${bar.opacity * 0.15}), transparent)`,
            transformOrigin: 'bottom',
            animation: `bar-grow ${bar.duration}s ease-in-out ${bar.delay}s infinite`,
            borderRadius: '1px 1px 0 0',
            boxShadow: bar.glow
              ? `0 0 ${bar.bright ? '15' : '8'}px hsla(${bar.hue},90%,55%,${bar.opacity * 0.5}), 0 0 ${bar.bright ? '40' : '20'}px hsla(${bar.hue},90%,50%,${bar.opacity * 0.15})`
              : 'none',
          }}
        />
      ))}

      {/* Strong LEFT fade — keeps text area perfectly black */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(to right, black 30%, rgba(0,0,0,0.85) 42%, rgba(0,0,0,0.4) 55%, transparent 70%)',
      }} />

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black via-black/70 to-transparent" />
      {/* Top fade */}
      <div className="absolute top-0 left-0 right-0 h-56 bg-gradient-to-b from-black/90 via-black/40 to-transparent" />

      {/* Ambient green glow orb — subtle atmosphere in the bar area */}
      <div className="absolute" style={{
        top: '20%', right: '15%', width: '500px', height: '400px',
        background: 'radial-gradient(ellipse, rgba(0,229,153,0.06) 0%, rgba(0,229,153,0.02) 40%, transparent 70%)',
        filter: 'blur(40px)',
      }} />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.025]" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)',
        backgroundSize: '3px 3px',
      }} />
    </div>
  );
}

/* ============================================================
   ANIMATED COUNTER
   ============================================================ */
function Counter({ value, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-50px' });
  useEffect(() => {
    if (!inView) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(value / 40));
    const t = setInterval(() => {
      cur = Math.min(cur + step, value);
      setCount(cur);
      if (cur >= value) clearInterval(t);
    }, 30);
    return () => clearInterval(t);
  }, [inView, value]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

/* ============================================================
   REVEAL ON SCROLL wrapper
   ============================================================ */
function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.25, 0.1, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ============================================================
   TECH MARQUEE — scrolling tech stack bar
   ============================================================ */
const TECH = [
  { name: 'FastAPI', icon: '⚡' },
  { name: 'Next.js 15', icon: '▲' },
  { name: 'Google Gemini', icon: '✦' },
  { name: 'PostgreSQL', icon: '🐘' },
  { name: 'Redis', icon: '◆' },
  { name: 'ChromaDB', icon: '◈' },
  { name: 'SQLAlchemy', icon: '⬡' },
  { name: 'Docker', icon: '🐳' },
  { name: 'GitHub OAuth', icon: '⬢' },
  { name: 'SSE Streaming', icon: '◉' },
];
function TechMarquee() {
  const items = [...TECH, ...TECH, ...TECH];
  return (
    <div className="relative overflow-hidden border-y border-white/[0.04] py-8 md:py-10">
      <div className="absolute left-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-r from-black to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-32 md:w-48 bg-gradient-to-l from-black to-transparent z-10" />
      <div className="flex whitespace-nowrap items-center" style={{ animation: 'marquee 45s linear infinite' }}>
        {items.map((t, i) => (
          <span key={i} className="mx-8 md:mx-12 flex items-center gap-3 text-xl md:text-2xl lg:text-3xl font-bold text-[#888888] select-none tracking-tight">
            <span className="text-lg md:text-xl opacity-60">{t.icon}</span>
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   FEATURE VISUAL — Multi-Agent Diagram (animated SVG)
   ============================================================ */
function AgentVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-80px' });
  const [phase, setPhase] = useState(0);
  // Single shared progress t ∈ [0,1] — all 3 balls move together
  const [t, setT] = useState(0);
  const rafRef = useRef(null);

  // Equilateral triangle: all 3 lines equal length = 130px
  // Center at (200, 185), radius = 130
  const OX = 200, OY = 185;
  const R = 130;
  const agents = useMemo(() => [
    { label: 'Security',     color: '#ff4c4c', cx: 200,               cy: OY - R           }, // top
    { label: 'Performance',  color: '#ffb224', cx: 200 - R * 0.866,   cy: OY + R * 0.5     }, // bottom-left
    { label: 'Architecture', color: '#00e599', cx: 200 + R * 0.866,   cy: OY + R * 0.5     }, // bottom-right
  ], []);

  // Phase sequencing
  useEffect(() => {
    if (!inView) { setPhase(0); setT(0); return; }
    const ts = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1500),
      setTimeout(() => setPhase(4), 2300),
    ];
    return () => ts.forEach(clearTimeout);
  }, [inView]);

  // rAF: single shared t for all 3 balls — they all move identically
  useEffect(() => {
    if (phase < 4) { cancelAnimationFrame(rafRef.current); return; }
    const SPEED = 0.004;
    const tick = () => {
      setT(prev => (prev + SPEED) % 1);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase]);

  // Ease-in-out so balls accelerate toward center, decelerate before arrival
  const easeInOut = (x) => x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;

  // Position along line from agent[i] → orchestrator at progress t
  const ballPos = (i, rawT) => {
    const et = easeInOut(rawT);
    return {
      x: agents[i].cx + (OX - agents[i].cx) * et,
      y: agents[i].cy + (OY - agents[i].cy) * et,
    };
  };

  const renderIcon = (label, cx, cy, color) => {
    switch (label) {
      case 'Security': return (
        <path d={`M${cx},${cy-14} L${cx-10},${cy-8} L${cx-10},${cy+1} Q${cx-10},${cy+11} ${cx},${cy+15} Q${cx+10},${cy+11} ${cx+10},${cy+1} L${cx+10},${cy-8} Z`}
          fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      );
      case 'Performance': return (
        <path d={`M${cx+1},${cy-15} L${cx-7},${cy+1} L${cx-1},${cy+1} L${cx-1},${cy+15} L${cx+9},${cy-1} L${cx+3},${cy-1} Z`}
          fill={color} />
      );
      case 'Architecture': return (<>
        <rect x={cx-11} y={cy+6}  width="22" height="3.5" rx="1.5" fill={color} opacity="0.9"/>
        <rect x={cx-8}  y={cy+1}  width="16" height="3.5" rx="1.5" fill={color} opacity="0.65"/>
        <rect x={cx-5}  y={cy-4}  width="10" height="3.5" rx="1.5" fill={color} opacity="0.45"/>
        <rect x={cx-2}  y={cy-9}  width="4"  height="3.5" rx="1.5" fill={color} opacity="0.3"/>
      </>);
      default: return null;
    }
  };

  return (
    <div ref={ref} className="relative w-full max-w-[500px] mx-auto select-none">
      <svg viewBox="0 0 400 390" className="w-full overflow-visible">
        <defs>
          {/* Radial gradients — one per agent */}
        {agents.map((a, i) => (
            <radialGradient key={`rg-${i}`} id={`rg-${i}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor={a.color} stopOpacity="0.18"/>
              <stop offset="100%" stopColor={a.color} stopOpacity="0"/>
            </radialGradient>
          ))}
          {/* Glow filters — one per agent */}
          {agents.map((a, i) => (
            <filter key={`gf-${i}`} id={`gf-${i}`} x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur stdDeviation="5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          ))}
          <radialGradient id="rg-center" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00e599" stopOpacity="0.14"/>
            <stop offset="100%" stopColor="#00e599" stopOpacity="0"/>
          </radialGradient>
          <filter id="glow-center" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
            <feGaussianBlur stdDeviation="3.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* ── Ambient glow behind orchestrator ── */}
        <motion.circle cx={OX} cy={OY} r="95" fill="url(#rg-center)"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0, scale: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          style={{ transformOrigin: `${OX}px ${OY}px` }}
        />

        {/* ── Connection lines: glow + dashed draw-on ── */}
        {agents.map((a, i) => (
          <g key={`ln-${i}`}>
            <line x1={OX} y1={OY} x2={a.cx} y2={a.cy}
              stroke={a.color} strokeWidth="6" opacity={phase >= 2 ? 0.07 : 0}
              style={{ filter: 'blur(5px)', transition: 'opacity 0.6s' }}
            />
            <line x1={OX} y1={OY} x2={a.cx} y2={a.cy}
              stroke={a.color} strokeWidth="1.5" opacity={phase >= 2 ? 0.5 : 0}
              strokeDasharray="6 5"
            style={{
                transition: 'opacity 0.5s',
                animation: phase >= 2 ? 'dash-flow 1.4s linear infinite' : 'none',
              }}
            />
          </g>
        ))}

        {/* ── Orchestrator center node ── */}
        <motion.circle cx={OX} cy={OY} r="44" fill="rgba(0,8,6,0.75)"
          stroke="rgba(0,229,153,0.5)" strokeWidth="1.5"
          initial={{ scale: 0 }}
          animate={{ scale: phase >= 1 ? 1 : 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 16 }}
          style={{ transformOrigin: `${OX}px ${OY}px` }}
          filter="url(#glow-center)"
        />
        {/* Slow-rotating outer dashed ring */}
        <motion.circle cx={OX} cy={OY} r="52"
          fill="none" stroke="rgba(0,229,153,0.12)" strokeWidth="1" strokeDasharray="4 6"
          initial={{ scale: 0 }}
          animate={{ scale: phase >= 1 ? 1 : 0, rotate: 360 }}
          transition={{
            scale: { type: 'spring', stiffness: 200, damping: 18 },
            rotate: { duration: 14, repeat: Infinity, ease: 'linear' },
          }}
          style={{ transformOrigin: `${OX}px ${OY}px` }}
        />
        {phase >= 1 && <>
          <text x={OX} y={OY - 5} textAnchor="middle" fill="rgba(255,255,255,0.92)"
            fontSize="12" fontWeight="700" fontFamily="Inter,sans-serif">Agent</text>
          <text x={OX} y={OY + 10} textAnchor="middle" fill="rgba(0,229,153,0.65)"
            fontSize="9.5" fontFamily="'JetBrains Mono',monospace">Orchestrator</text>
        </>}

        {/* ── Agent nodes — all spring in together ── */}
        {agents.map((a, i) => (
          <motion.g key={`ag-${i}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: phase >= 3 ? 1 : 0, opacity: phase >= 3 ? 1 : 0 }}
            transition={{ type: 'spring', stiffness: 170, damping: 13, delay: i * 0.12 }}
            style={{ transformOrigin: `${a.cx}px ${a.cy}px` }}
          >
            <circle cx={a.cx} cy={a.cy} r="62" fill={`url(#rg-${i})`}/>
            <circle cx={a.cx} cy={a.cy} r="40"
              fill="rgba(0,0,0,0.6)" stroke={`${a.color}50`} strokeWidth="1.5"
              filter={`url(#gf-${i})`}
            />
            <circle cx={a.cx} cy={a.cy} r="34"
              fill={`${a.color}0A`} stroke={`${a.color}1A`} strokeWidth="0.8"
            />
            {phase >= 4 && (
              <circle cx={a.cx} cy={a.cy} r="40" fill="none" stroke={a.color}
                strokeWidth="1" opacity="0.3"
            style={{
                  animation: `pulse-ring 2.8s ease-out ${i * 0.35}s infinite`,
                  transformOrigin: `${a.cx}px ${a.cy}px`,
                }}
              />
            )}
            {renderIcon(a.label, a.cx, a.cy - 7, a.color)}
            <text x={a.cx} y={a.cy + 22} textAnchor="middle"
              fill="rgba(255,255,255,0.45)" fontSize="9.5" fontWeight="500"
              fontFamily="Inter,sans-serif">{a.label}</text>
          </motion.g>
        ))}

        {/* ── Synchronized particles — all 3 travel together ── */}
        {phase >= 4 && agents.map((a, i) => {
          const p = ballPos(i, t);
          // Fade in at start, fade out at end
          const alpha = t < 0.12 ? t / 0.12 : t > 0.88 ? (1 - t) / 0.12 : 1;
          return (
            <g key={`pt-${i}`} filter="url(#dot-glow)">
              <circle cx={p.x} cy={p.y} r="7"  fill={a.color} opacity={0.12 * alpha}/>
              <circle cx={p.x} cy={p.y} r="3.5" fill={a.color} opacity={0.95 * alpha}/>
            </g>
          );
        })}
      </svg>

    </div>
  );
}

/* ============================================================
   FEATURE VISUAL — Streaming Terminal (animated typewriter)
   ============================================================ */
const TERMINAL_LINES = [
  { text: '$ codeaudit analyze --commit a4f2e9b', type: 'cmd' },
  { text: '▸ Fetching commit diff from GitHub...', type: 'info' },
  { text: '▸ Parsing AST (Python, JavaScript)...', type: 'info' },
  { text: '▸ Security Agent analyzing...', type: 'agent', color: '#ff4c4c' },
  { text: '▸ Performance Agent analyzing...', type: 'agent', color: '#ffb224' },
  { text: '▸ Architecture Agent analyzing...', type: 'agent', color: '#00e599' },
  { text: '✓ Security — 0 critical, 1 warning', type: 'done', color: '#ff4c4c' },
  { text: '✓ Performance — 2 optimizations found', type: 'done', color: '#ffb224' },
  { text: '✓ Architecture — SOLID principles OK', type: 'done', color: '#00e599' },
  { text: '✓ RAG context: 3 similar past reviews', type: 'rag' },
  { text: '✓ Analysis stored in knowledge base', type: 'rag' },
  { text: '', type: 'empty' },
  { text: 'Overall Score: 87/100 — Risk: Low', type: 'result' },
  { text: 'Completed in 4.2s', type: 'time' },
];

function TerminalVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });
  const [lines, setLines] = useState(0);

  useEffect(() => {
    if (!inView) { setLines(0); return; }
    const t = setInterval(() => {
      setLines(v => {
        if (v >= TERMINAL_LINES.length) { clearInterval(t); return v; }
        return v + 1;
      });
    }, 350);
    return () => clearInterval(t);
  }, [inView]);

  return (
    <div ref={ref} className="w-full max-w-[500px] mx-auto rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden shadow-2xl shadow-black/50">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <div className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[10px] text-white/20 font-mono ml-2">CodeAuditAI — Terminal</span>
      </div>
      {/* Content */}
      <div className="p-4 h-[360px] overflow-hidden font-mono text-xs leading-relaxed">
        {TERMINAL_LINES.slice(0, lines).map((line, i) => (
          <div key={i} className="flex items-start gap-1" style={{
            animation: 'fade-up 0.3s ease-out',
            color: line.type === 'cmd' ? 'rgba(255,255,255,0.9)'
              : line.type === 'result' ? '#00e599'
              : line.type === 'time' ? 'rgba(255,255,255,0.3)'
              : line.type === 'rag' ? 'rgba(0,229,153,0.6)'
              : line.color || 'rgba(255,255,255,0.45)',
            fontWeight: line.type === 'result' ? 600 : 400,
          }}>
            {line.text}
          </div>
        ))}
        {lines < TERMINAL_LINES.length && (
          <span className="inline-block w-2 h-4 bg-[#00e599]/70 ml-1" style={{ animation: 'cursor-blink 0.8s infinite' }} />
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TYPEWRITER HELPERS — used inside RAG Visual
   ============================================================ */
function BlinkingCursor() {
  const [vis, setVis] = useState(true);
  useEffect(() => {
    const id = setInterval(() => setVis(v => !v), 530);
    return () => clearInterval(id);
  }, []);
  return <span style={{ color: '#00e599', opacity: vis ? 1 : 0 }}>▋</span>;
}

function TypewriterLine({ text, color, delay, speed = 22 }) {
  const [chars, setChars] = useState(0);
  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => {
      setActive(true);
      let i = 0;
      const iv = setInterval(() => {
        i++;
        setChars(i);
        if (i >= text.length) { clearInterval(iv); setActive(false); setDone(true); }
      }, speed);
      return () => clearInterval(iv);
    }, delay);
    return () => clearTimeout(t);
  }, []);                               // eslint-disable-line react-hooks/exhaustive-deps
  if (!active && !done) return null;
  return (
    <div className="mb-0.5">
      <span style={{ color }}>{text.slice(0, chars)}</span>
      {active && <BlinkingCursor />}
    </div>
  );
}

/* ============================================================
   FEATURE VISUAL — RAG Flow Diagram
   ============================================================ */
function RAGVisual() {
  const ref        = useRef(null);
  const inView     = useInView(ref, { once: false, margin: '-100px' });
  const rafRef     = useRef(null);
  const t0Ref      = useRef(null);
  const activatedR = useRef(new Set());

  const [progress,      setProgress]      = useState(0);
  const [justActivated, setJustActivated] = useState(new Set());
  const [showBox,       setShowBox]       = useState(false);

  const DURATION = 3500; // ms for full pipeline journey

  const nodes = [
    { label: 'Code',     sub: 'new commit', Icon: FileCode },
    { label: 'Embed',    sub: 'vectorize',  Icon: Database },
    { label: 'Store',    sub: 'ChromaDB',   Icon: Lock     },
    { label: 'Retrieve', sub: 'nearest',    Icon: Search   },
    { label: 'Review',   sub: 'enhanced',   Icon: Eye      },
  ];

  useEffect(() => {
    if (!inView) {
      setProgress(0); setShowBox(false);
      setJustActivated(new Set()); activatedR.current = new Set();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const startDelay = setTimeout(() => {
      t0Ref.current = null;
      const animate = (ts) => {
        if (!t0Ref.current) t0Ref.current = ts;
        const p = Math.min((ts - t0Ref.current) / DURATION, 1);
        setProgress(p);
        nodes.forEach((_, i) => {
          const threshold = i / (nodes.length - 1);
          if (p >= threshold && !activatedR.current.has(i)) {
            activatedR.current.add(i);
            setJustActivated(prev => new Set([...prev, i]));
            setTimeout(() => {
              setJustActivated(prev => { const n = new Set(prev); n.delete(i); return n; });
            }, 900);
          }
        });
        if (p < 1) { rafRef.current = requestAnimationFrame(animate); }
        else        { setTimeout(() => setShowBox(true), 380); }
      };
      rafRef.current = requestAnimationFrame(animate);
    }, 300);
    return () => { clearTimeout(startDelay); if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [inView]);         // eslint-disable-line react-hooks/exhaustive-deps

  const RAG_LINES = [
    { text: 'RAG context found:',                                color: '#00e599',               delay: 0    },
    { text: '3 similar past reviews retrieved',                  color: 'rgba(255,255,255,0.5)', delay: 460  },
    { text: '• commit a4f2e9b — N+1 query pattern (92% match)', color: 'rgba(255,255,255,0.28)', delay: 1150 },
    { text: '• commit 8bc1d03 — Batch optimization (87% match)', color: 'rgba(255,255,255,0.28)', delay: 2050 },
  ];

  return (
    <div ref={ref} className="w-full max-w-[520px] mx-auto select-none">

      {/* ── Pipeline ── */}
      <div className="relative grid grid-cols-5">
        {/* Track */}
        <div className="absolute top-[20px] left-[10%] right-[10%] h-px bg-white/[0.05]" />

        {/* Animated fill + orb */}
        <div
          className="absolute top-[20px] h-px"
          style={{
            left: '10%',
            width: `${progress * 80}%`,
            background: 'linear-gradient(to right, rgba(0,229,153,0.2), rgba(0,229,153,0.85))',
          }}
        >
          {progress > 0.015 && progress < 0.99 && (
            <div
              className="absolute right-0 top-1/2 -translate-y-1/2 w-[11px] h-[11px] rounded-full bg-[#00e599]"
              style={{ boxShadow: '0 0 10px 3px rgba(0,229,153,0.9), 0 0 26px 8px rgba(0,229,153,0.35)' }}
            />
          )}
            </div>

        {/* Nodes */}
        {nodes.map((node, i) => {
          const active  = progress >= i / (nodes.length - 1);
          const pulsing = justActivated.has(i);
          const { Icon } = node;
          return (
            <div key={i} className="flex flex-col items-center gap-2 relative z-10">
              <div className="relative w-10 h-10">
                {/* One-time pulse ring */}
                {pulsing && (
                  <motion.div
                    initial={{ scale: 1, opacity: 0.65 }}
                    animate={{ scale: 2.6, opacity: 0 }}
                    transition={{ duration: 0.85, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full border border-[#00e599]/50"
                  />
                )}
                {/* Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-all duration-500"
                  style={{
                    borderColor: active ? 'rgba(0,229,153,0.45)' : 'rgba(255,255,255,0.07)',
                    background:  active ? 'rgba(0,229,153,0.07)'  : 'rgba(255,255,255,0.02)',
                    color:       active ? '#00e599'                : 'rgba(255,255,255,0.18)',
                    boxShadow:   active ? '0 0 18px rgba(0,229,153,0.14)' : 'none',
                  }}
                >
                  <Icon size={14} />
          </div>
              </div>
              <span
                className="text-[10px] font-semibold uppercase tracking-wider transition-colors duration-500"
                style={{ color: active ? 'rgba(255,255,255,0.65)' : 'rgba(255,255,255,0.14)' }}
              >
                {node.label}
              </span>
              <span
                className="text-[9px] transition-colors duration-500"
                style={{ color: active ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)' }}
              >
                {node.sub}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── RAG output box ── */}
      {showBox && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 rounded-xl bg-[#040706] overflow-hidden"
          style={{ border: '1px solid rgba(255,255,255,0.06)', borderLeft: '1.5px solid rgba(0,229,153,0.28)' }}
        >
          {/* Fake terminal header */}
          <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/[0.04]">
            <div className="w-[7px] h-[7px] rounded-full bg-white/[0.07]" />
            <div className="w-[7px] h-[7px] rounded-full bg-white/[0.07]" />
            <div className="w-[7px] h-[7px] rounded-full bg-white/[0.07]" />
            <span className="ml-2 text-[10px] font-mono text-white/20 tracking-wider">rag.context</span>
          </div>
          {/* Typewriter lines */}
          <div className="px-4 py-3 font-mono text-xs leading-[1.75]">
            {RAG_LINES.map((line, i) => (
              <TypewriterLine key={i} text={line.text} color={line.color} delay={line.delay} />
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

/* ============================================================
   FEATURE VISUAL — Chat Conversation
   ============================================================ */
const CHAT_MSGS = [
  { role: 'user', text: 'Why did you flag the auth middleware?' },
  { role: 'ai', text: 'The middleware at line 23 uses a hardcoded secret key instead of an environment variable. This was also flagged in commit 8bc1d03 last week.' },
  { role: 'user', text: 'Can you generate a fix?' },
  { role: 'ai', text: 'Generating fix...\n\n- SECRET = "my_secret_123"\n+ SECRET = os.environ["SECRET_KEY"]\n\nThis moves the secret to environment variables, preventing it from being committed to version control.' },
];

function ChatVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });
  const [msgs, setMsgs] = useState(0);

  useEffect(() => {
    if (!inView) { setMsgs(0); return; }
    const timers = CHAT_MSGS.map((_, i) => setTimeout(() => setMsgs(i + 1), i * 1200 + 400));
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="w-full max-w-[440px] mx-auto rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04]">
        <MessageSquare size={12} className="text-[#00e599]/60" />
        <span className="text-xs text-white/30">AI Chat — Review Session</span>
      </div>
      <div className="p-4 h-[340px] overflow-hidden space-y-3">
        {CHAT_MSGS.slice(0, msgs).map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
              msg.role === 'user'
                ? 'bg-white/[0.06] text-white/70'
                : 'bg-[#00e599]/[0.06] border border-[#00e599]/10 text-white/60'
            }`}>
              <pre className="whitespace-pre-wrap font-mono">{msg.text}</pre>
            </div>
          </motion.div>
        ))}
        {msgs > 0 && msgs < CHAT_MSGS.length && (
          <div className="flex gap-1 px-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#00e599]/30"
                style={{ animation: `glow-pulse 1s ease-in-out ${i * 0.2}s infinite` }} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   FEATURE VISUAL — Auto-Fix Diff
   ============================================================ */
function DiffVisual() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: false, margin: '-100px' });
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) { setStep(0); return; }
    const timers = [
      setTimeout(() => setStep(1), 500),
      setTimeout(() => setStep(2), 1200),
      setTimeout(() => setStep(3), 1800),
    ];
    return () => timers.forEach(clearTimeout);
  }, [inView]);

  return (
    <div ref={ref} className="w-full max-w-[480px] mx-auto rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Wrench size={12} className="text-[#00e599]/60" />
          <span className="text-xs text-white/30">Auto-Fix — auth_middleware.py</span>
        </div>
        {step >= 3 && (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-[10px] font-mono text-[#00e599]/60 bg-[#00e599]/[0.08] px-2 py-0.5 rounded">
            Ready to apply
          </motion.span>
        )}
      </div>
      <div className="p-4 font-mono text-xs leading-relaxed space-y-1">
        <div className="text-white/20 mb-3">@@ -21,5 +21,5 @@ class AuthMiddleware:</div>

        {step >= 1 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0.5">
            <div className="text-white/25">  def __init__(self):</div>
            <div className="bg-[#ff4c4c]/[0.08] text-[#ff4c4c]/70 px-2 py-0.5 rounded -mx-2">
              -    self.secret = &quot;my_secret_key_123&quot;
            </div>
          </motion.div>
        )}

        {step >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#00e599]/[0.08] text-[#00e599]/70 px-2 py-0.5 rounded -mx-2">
              +    self.secret = os.environ.get(&quot;SECRET_KEY&quot;)
            </div>
          </motion.div>
        )}

        {step >= 2 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-0.5 mt-1">
            <div className="text-white/25">  def validate(self, token):</div>
            <div className="bg-[#ff4c4c]/[0.08] text-[#ff4c4c]/70 px-2 py-0.5 rounded -mx-2">
              -    if not token: return False
            </div>
          </motion.div>
        )}

        {step >= 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="bg-[#00e599]/[0.08] text-[#00e599]/70 px-2 py-0.5 rounded -mx-2">
              +    if not token:<br/>
              +      raise AuthenticationError(&quot;Missing token&quot;)
            </div>
          </motion.div>
        )}

        {step >= 3 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-4 pt-3 border-t border-white/[0.04] text-white/30">
            <span className="text-[#00e599]/50 font-semibold">AI Explanation:</span> Environment variables prevent
            secrets from being committed. Raising specific exceptions improves error handling.
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   FEATURE SECTIONS DATA
   ============================================================ */
const FEATURES = [
  {
    id: 'agents',
    nav: 'Multi-Agent',
    heading: 'Three specialists.',
    headingFaded: 'One verdict. Security, Performance, and Architecture agents analyze in parallel.',
    Visual: AgentVisual,
  },
  {
    id: 'streaming',
    nav: 'Live Streaming',
    heading: 'Watch your review happen live.',
    headingFaded: 'No spinner. No waiting. SSE streams every finding the moment AI thinks it.',
    Visual: TerminalVisual,
  },
  {
    id: 'rag',
    nav: 'RAG Memory',
    heading: 'AI that remembers',
    headingFaded: 'every review. ChromaDB stores vectorized analyses. Each review is smarter than the last.',
    Visual: RAGVisual,
  },
  {
    id: 'chat',
    nav: 'AI Chat',
    heading: 'Ask follow-ups.',
    headingFaded: 'Get context. Start a conversation about any analysis with full review context.',
    Visual: ChatVisual,
  },
  {
    id: 'autofix',
    nav: 'Auto-Fix',
    heading: 'AI writes the fix.',
    headingFaded: 'You approve. For any flagged issue, AI generates the exact corrected code.',
    Visual: DiffVisual,
  },
];

/* ============================================================
   DASHBOARD MOCKUP — Product preview section
   ============================================================ */
function DashboardMockup() {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/[0.06] bg-[#0a0a0a] overflow-hidden shadow-2xl shadow-black/50">
      {/* Titlebar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.04] bg-white/[0.02]">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
          <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[10px] text-white/20 font-mono ml-2">CodeAuditAI Dashboard</span>
      </div>
      {/* Dashboard content mockup */}
      <div className="p-6 grid grid-cols-12 gap-4">
        {/* Sidebar */}
        <div className="col-span-2 space-y-3 border-r border-white/[0.04] pr-4">
          {['Dashboard', 'Repos', 'Analysis', 'AI Chat', 'Agents', 'Auto-Fix', 'Knowledge'].map((item, i) => (
            <div key={i} className={`text-[10px] font-mono py-1.5 px-2 rounded-lg ${
              i === 0 ? 'bg-[#00e599]/[0.08] text-[#00e599]/70' : 'text-white/20 hover:text-white/30'
            }`}>{item}</div>
          ))}
        </div>
        {/* Main content */}
        <div className="col-span-10 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Repositories', value: '12', trend: '+3' },
              { label: 'Reviews Today', value: '47', trend: '+12' },
              { label: 'Avg Score', value: '84', trend: '+5' },
              { label: 'Fixes Applied', value: '23', trend: '+8' },
            ].map((stat, i) => (
              <div key={i} className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-3">
                <p className="text-[9px] text-white/25 mb-1">{stat.label}</p>
                <div className="flex items-end gap-2">
                  <span className="text-xl font-bold text-white/80">{stat.value}</span>
                  <span className="text-[9px] text-[#00e599]/60 mb-1">{stat.trend}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Chart placeholder */}
          <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 h-32">
            <p className="text-[9px] text-white/25 mb-3">Analysis Trend — Last 7 Days</p>
            <div className="flex items-end gap-1 h-16">
              {[40, 55, 35, 70, 60, 85, 75].map((h, i) => (
                <div key={i} className="flex-1 rounded-t" style={{
                  height: `${h}%`,
                  background: `linear-gradient(to top, rgba(0,229,153,0.3), rgba(0,229,153,0.05))`,
                }} />
              ))}
            </div>
          </div>
          {/* Recent reviews */}
          <div className="space-y-2">
            <p className="text-[9px] text-white/25">Recent Reviews</p>
            {[
              { file: 'auth_middleware.py', score: 87, status: 'Low Risk' },
              { file: 'api/routes.py', score: 92, status: 'Healthy' },
              { file: 'utils/crypto.js', score: 64, status: 'Warning' },
            ].map((review, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg border border-white/[0.03] bg-white/[0.01]">
                <span className="text-[10px] text-white/40 font-mono">{review.file}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/50 font-mono">{review.score}/100</span>
                  <span className={`text-[9px] px-2 py-0.5 rounded ${
                    review.score > 80 ? 'bg-[#00e599]/[0.08] text-[#00e599]/60' :
                    review.score > 70 ? 'bg-[#ffb224]/[0.08] text-[#ffb224]/60' :
                    'bg-[#ff4c4c]/[0.08] text-[#ff4c4c]/60'
                  }`}>{review.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   CAPABILITIES GRID
   ============================================================ */
const CAPABILITIES = [
  { icon: Shield, title: 'Security Scanning', desc: 'SQL injection, XSS, exposed secrets, OWASP Top 10' },
  { icon: Zap, title: 'Performance Analysis', desc: 'N+1 queries, memory leaks, blocking operations' },
  { icon: Layers, title: 'Architecture Review', desc: 'SOLID principles, coupling, design patterns' },
  { icon: Brain, title: 'AST Parsing', desc: 'Multi-language Abstract Syntax Tree analysis' },
  { icon: Database, title: 'Dependency Analysis', desc: 'Cross-file import graphs, circular detection' },
  { icon: Lock, title: 'Structured Output', desc: 'All AI responses are JSON-validated, no hacks' },
];

/* ============================================================
   MAIN PAGE
   ============================================================ */
export default function AuthPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const [activeFeature, setActiveFeature] = useState('agents');
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const featureRefs = useRef({});
  const featuresContainerRef = useRef(null);

  useEffect(() => {
    if (status === 'authenticated') router.push('/');
  }, [status, router]);

  // Track which feature section is in view + sidebar visibility
  useEffect(() => {
    const observers = [];

    // Feature section observers
    FEATURES.forEach(f => {
      const el = featureRefs.current[f.id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveFeature(f.id); },
        { threshold: 0.35 }
      );
      obs.observe(el);
      observers.push(obs);
    });

    // Sidebar visibility observer
    const container = featuresContainerRef.current;
    if (container) {
      const obs = new IntersectionObserver(
        ([entry]) => setSidebarVisible(entry.isIntersecting),
        { threshold: 0.05 }
      );
      obs.observe(container);
      observers.push(obs);
    }

    return () => observers.forEach(o => o.disconnect());
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    await signIn('github', { callbackUrl: '/' });
  };

  if (status === 'loading') return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">

      {/* ==================== NAV ==================== */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.04] bg-[#000]/75 backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-[54px]">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative w-[26px] h-[26px] rounded-[7px] bg-[#00e599]/[0.1] border border-[#00e599]/[0.18] flex items-center justify-center">
              <Terminal size={12} className="text-[#00e599]" />
              {/* subtle pulse dot */}
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-[#00e599]"
                style={{ boxShadow: '0 0 5px 1px rgba(0,229,153,0.7)', animation: 'pulse 2s infinite' }} />
            </div>
            <span className="text-[13.5px] font-semibold text-white tracking-tight">CodeAuditAI</span>
            <span className="hidden sm:inline-flex items-center px-[7px] py-0.5 rounded text-[9px] font-bold tracking-widest uppercase text-[#00e599]/55 border border-[#00e599]/[0.14] bg-[#00e599]/[0.05]">
              beta
            </span>
          </div>

          {/* Centre nav links */}
          <div className="hidden md:flex items-center gap-7">
            {['Features', 'Capabilities', 'Preview'].map(label => (
              <a key={label} href={`#${label.toLowerCase()}`}
                className="text-[13px] text-white/35 hover:text-white/70 transition-colors duration-200 relative group">
                {label}
                <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-[#00e599]/50 group-hover:w-full transition-all duration-300" />
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <a href="https://github.com/YashasRgowda/CodeAuditAI-Review-Detect-Improve"
              target="_blank" rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/65 border border-white/[0.07] hover:border-white/[0.18] px-3 py-[6px] rounded-full transition-all duration-200">
              <Github size={13} />
              <span>Star</span>
            </a>
            <button onClick={handleSignIn}
              className="text-[13px] text-black bg-white hover:bg-white/88 font-semibold px-[18px] py-[7px] rounded-full transition-all duration-200 cursor-pointer">
              Sign in
            </button>
          </div>

        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className="relative h-screen flex flex-col justify-end pb-28 md:pb-36 px-8 lg:px-20 overflow-hidden">
        <HeroBars />
        <div className="relative z-10 max-w-4xl">
          <Reveal>
            <div className="inline-flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-full px-4 py-1.5 text-[11px] text-white/40 mb-6 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse" />
              Powered by Google Gemini &middot; Multi-Agent Architecture
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="font-bold tracking-[-0.035em] leading-[0.9] mb-8" style={{ fontSize: 'clamp(3rem, 6.5vw, 6.5rem)' }}>
              AI Code Reviews<br />
              <span className="text-white/25">That Actually </span>
              <span className="text-[#00e599]">Think</span>
              <span className="text-white/20">.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="text-lg md:text-xl text-white/40 max-w-2xl leading-relaxed mb-10">
              Three specialist agents. RAG memory. Auto-fix generation.
              One platform that reviews code the way a senior engineer would.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="flex items-center gap-4 flex-wrap">
              <motion.button onClick={handleSignIn} disabled={signingIn}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2.5 bg-white text-black font-bold px-8 py-3.5 rounded-full text-base cursor-pointer transition-shadow hover:shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                <Github size={18} />
                {signingIn ? 'Connecting...' : 'Get started'}
              </motion.button>
              <a href="#features" className="flex items-center gap-2 text-base text-white/30 hover:text-white/50 transition-colors border border-white/10 rounded-full px-8 py-3.5 hover:border-white/20">
                Read the docs <ChevronRight size={16} />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ==================== TECH MARQUEE ==================== */}
      <TechMarquee />

      {/* ==================== STICKY SIDEBAR NAV ==================== */}
      <div className={`fixed left-6 lg:left-10 top-1/2 -translate-y-1/2 z-40 transition-all duration-500 hidden lg:block ${
        sidebarVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'
      }`}>
        <div className="space-y-1">
          {FEATURES.map(f => (
            <button key={f.id}
              onClick={() => featureRefs.current[f.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              className={`flex items-center gap-2.5 text-xs font-medium py-1.5 px-0 transition-all duration-300 cursor-pointer bg-transparent border-none ${
                activeFeature === f.id ? 'text-white' : 'text-white/20 hover:text-white/40'
              }`}>
              {activeFeature === f.id && (
                <motion.span layoutId="sidebar-dot" className="w-1.5 h-1.5 rounded-full bg-[#00e599]" />
              )}
              <span className={activeFeature !== f.id ? 'ml-4' : ''}>{f.nav}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ==================== FEATURE SECTIONS ==================== */}
      <div ref={featuresContainerRef} id="features">
        {FEATURES.map((feature, idx) => {
          const Visual = feature.Visual;
          return (
            <section key={feature.id}
              ref={el => { featureRefs.current[feature.id] = el; }}
              className="min-h-screen flex items-center py-24 px-6 lg:px-16 border-t border-white/[0.03]">
              <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
                {/* Text — always left on desktop */}
                <div className="lg:pl-20">
                  <Reveal>
                    <p className="text-xs font-medium text-[#00e599]/60 uppercase tracking-widest mb-4 font-mono">
                      0{idx + 1} / {feature.nav}
                    </p>
                  </Reveal>
                  <Reveal delay={0.1}>
                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                      {feature.heading} <span className="text-white/25">{feature.headingFaded}</span>
                    </h2>
                  </Reveal>
                </div>
                {/* Visual — always right on desktop */}
                <div>
                  <Visual />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ==================== CAPABILITIES BENTO ==================== */}
      <section id="capabilities" className="py-32 px-6 border-t border-white/[0.03]">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <p className="text-xs font-medium text-[#00e599]/60 uppercase tracking-widest mb-3 font-mono">Capabilities</p>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
              Deep analysis. <span className="text-white/25">Not surface scanning.</span>
            </h2>
            <p className="text-base text-white/30 max-w-xl mb-14">Every commit goes through AST parsing, dependency graphing, security scanning, and multi-agent AI reasoning.</p>
          </Reveal>

          {/* Row 1: Security (2 cols) + Performance (1 col) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Security — wide */}
            <Reveal delay={0.05} className="md:col-span-2">
              <motion.div whileHover={{ scale: 1.008, borderColor: 'rgba(255,76,76,0.15)' }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#080202] group h-60 p-7 flex flex-col justify-between cursor-default transition-colors">
                {/* Animated horizontal scan lines */}
                <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,76,76,0.35), transparent)' }}
                  animate={{ top: ['8%', '92%'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatType: 'reverse' }}
                />
                <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(255,76,76,0.15), transparent)' }}
                  animate={{ top: ['75%', '20%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatType: 'reverse' }}
                />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-[#ff4c4c]/[0.08] border border-[#ff4c4c]/20 flex items-center justify-center mb-5 group-hover:bg-[#ff4c4c]/[0.13] transition-all">
                    <Shield size={18} className="text-[#ff4c4c]/80" />
                    </div>
                  <h3 className="text-base font-semibold text-white mb-2">Security Scanning</h3>
                  <p className="text-sm text-white/30 max-w-xs">SQL injection, XSS, exposed secrets, insecure dependencies. Mapped to OWASP Top 10.</p>
                  </div>
                <div className="relative z-10 flex flex-wrap gap-2">
                  {['OWASP Top 10', 'XSS', 'SQL Injection', 'Secrets'].map(tag => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ color: 'rgba(255,76,76,0.6)', background: 'rgba(255,76,76,0.06)', border: '1px solid rgba(255,76,76,0.12)' }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(255,76,76,0.05), transparent)' }} />
              </motion.div>
                </Reveal>

            {/* Performance — with animated bars */}
            <Reveal delay={0.1}>
              <motion.div whileHover={{ scale: 1.008, borderColor: 'rgba(255,178,36,0.15)' }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#080500] group h-60 p-7 flex flex-col justify-between cursor-default transition-colors">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-[#ffb224]/[0.08] border border-[#ffb224]/20 flex items-center justify-center mb-5 group-hover:bg-[#ffb224]/[0.13] transition-all">
                    <Zap size={18} className="text-[#ffb224]/80" />
          </div>
                  <h3 className="text-base font-semibold text-white mb-2">Performance Analysis</h3>
                  <p className="text-sm text-white/30">N+1 queries, memory leaks, blocking operations.</p>
        </div>
                {/* Animated bar chart */}
                <div className="flex items-end gap-1 h-12">
                  {[55, 80, 40, 95, 60, 75, 45, 88].map((h, i) => (
                    <motion.div key={i} className="flex-1 rounded-sm"
                      style={{ background: `rgba(255,178,36,0.5)`, transformOrigin: 'bottom', height: '100%' }}
                      animate={{ scaleY: [0.3, h / 100, 0.3], opacity: [0.25, 0.7, 0.25] }}
                      transition={{ duration: 2, delay: i * 0.18, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  ))}
                </div>
                <div className="absolute bottom-0 right-0 w-28 h-28 rounded-full blur-2xl pointer-events-none"
                  style={{ background: 'radial-gradient(circle, rgba(255,178,36,0.05), transparent)' }} />
              </motion.div>
            </Reveal>
          </div>

          {/* Row 2: Architecture (1 col) + AST Parsing (2 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

            {/* Architecture */}
            <Reveal delay={0.12}>
              <motion.div whileHover={{ scale: 1.008, borderColor: 'rgba(0,229,153,0.12)' }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#020806] group h-60 p-7 flex flex-col justify-between cursor-default transition-colors">
              <div>
                  <div className="w-10 h-10 rounded-xl bg-[#00e599]/[0.08] border border-[#00e599]/20 flex items-center justify-center mb-5 group-hover:bg-[#00e599]/[0.13] transition-all">
                    <Layers size={18} className="text-[#00e599]/80" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Architecture Review</h3>
                  <p className="text-sm text-white/30">SOLID principles, coupling, design pattern violations.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {['SOLID', 'DRY', 'Clean Arch', 'KISS'].map(tag => (
                    <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ color: 'rgba(0,229,153,0.6)', background: 'rgba(0,229,153,0.06)', border: '1px solid rgba(0,229,153,0.12)' }}>
                      {tag}
                </span>
                  ))}
              </div>
                <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
                  style={{ background: 'linear-gradient(to top, rgba(0,229,153,0.03), transparent)' }} />
              </motion.div>
            </Reveal>

            {/* AST Parsing — wide */}
            <Reveal delay={0.15} className="md:col-span-2">
              <motion.div whileHover={{ scale: 1.008 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#040408] group h-60 p-7 flex flex-col justify-between cursor-default">
                {/* Dot grid background */}
                <div className="absolute inset-0 opacity-30 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:bg-white/[0.07] transition-all">
                    <Brain size={18} className="text-white/50" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">AST Parsing</h3>
                  <p className="text-sm text-white/30 max-w-xs">Understands code structure, not just text. Builds a full syntax tree before analysis.</p>
                </div>
                <div className="relative z-10 flex flex-wrap gap-2">
                  {[
                    { name: 'Python', c: '#3b82f6' },
                    { name: 'JavaScript', c: '#f59e0b' },
                    { name: 'TypeScript', c: '#60a5fa' },
                    { name: 'JSX', c: '#34d399' },
                    { name: 'TSX', c: '#a78bfa' },
                  ].map(l => (
                    <span key={l.name} className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg"
                      style={{ color: l.c, background: `${l.c}14`, border: `1px solid ${l.c}28` }}>
                      {l.name}
                    </span>
                  ))}
                </div>
              </motion.div>
            </Reveal>
          </div>

          {/* Row 3: Dependency (1 col) + Structured Output (2 cols) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            {/* Dependency Analysis */}
            <Reveal delay={0.17}>
              <motion.div whileHover={{ scale: 1.008 }}
                className="relative overflow-hidden rounded-2xl border border-white/[0.05] bg-[#040407] group h-60 p-7 flex flex-col justify-between cursor-default">
                <div>
                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5 group-hover:bg-white/[0.07] transition-all">
                    <Database size={18} className="text-white/50" />
                  </div>
                  <h3 className="text-base font-semibold text-white mb-2">Dependency Analysis</h3>
                  <p className="text-sm text-white/30">Cross-file import graphs, circular dependency detection.</p>
                </div>
                {/* Mini animated node graph */}
                <svg viewBox="0 0 120 60" className="w-full h-14 opacity-60">
                  {[{x1:20,y1:30,x2:60,y2:15},{x1:60,y1:15,x2:100,y2:30},{x1:60,y1:15,x2:60,y2:45},{x1:20,y1:30,x2:60,y2:45}].map((l,i)=>(
                    <motion.line key={i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
                      stroke="rgba(255,255,255,0.15)" strokeWidth="1"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 1, delay: i * 0.3, repeat: Infinity, repeatDelay: 2 }}
                    />
                  ))}
                  {[{cx:20,cy:30},{cx:60,cy:15},{cx:100,cy:30},{cx:60,cy:45}].map((n,i)=>(
                    <motion.circle key={i} cx={n.cx} cy={n.cy} r="4"
                      fill="rgba(255,255,255,0.5)"
                      animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.8, 1.1, 0.8] }}
                      transition={{ duration: 2, delay: i * 0.25, repeat: Infinity }}
                      style={{ transformOrigin: `${n.cx}px ${n.cy}px` }}
                    />
                  ))}
                </svg>
              </motion.div>
            </Reveal>

            {/* Structured Output — wide, accent card */}
            <Reveal delay={0.2} className="md:col-span-2">
              <motion.div whileHover={{ scale: 1.005 }}
                className="relative overflow-hidden rounded-2xl border border-[#00e599]/[0.10] bg-[#020806] group h-60 p-7 flex flex-col md:flex-row gap-6 cursor-default">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-px"
                  style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,153,0.3), transparent)' }} />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#00e599]/[0.08] border border-[#00e599]/20 flex items-center justify-center group-hover:bg-[#00e599]/[0.13] transition-all">
                        <Lock size={18} className="text-[#00e599]/80" />
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                        style={{ color: 'rgba(0,229,153,0.7)', background: 'rgba(0,229,153,0.06)', border: '1px solid rgba(0,229,153,0.15)' }}>
                        JSON-VALIDATED
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-white mb-2">Structured Output</h3>
                    <p className="text-sm text-white/30 max-w-[200px]">Schema-validated JSON. No string parsing, no hallucination leakage.</p>
                  </div>
                </div>
                {/* Live JSON preview */}
                <div className="font-mono text-xs bg-black/50 rounded-xl border border-white/[0.05] p-4 w-full md:w-64 shrink-0 self-center">
                  <div className="text-white/20 mb-1">{'{'}</div>
                  <div className="pl-3 space-y-0.5">
                    <div><span className="text-[#00e599]/60">&quot;score&quot;</span><span className="text-white/20">: </span><span className="text-[#ffb224]/80">87</span><span className="text-white/20">,</span></div>
                    <div><span className="text-[#00e599]/60">&quot;risk&quot;</span><span className="text-white/20">: </span><span className="text-green-400/80">&quot;low&quot;</span><span className="text-white/20">,</span></div>
                    <div><span className="text-[#00e599]/60">&quot;issues&quot;</span><span className="text-white/20">: [...]</span></div>
                    <div><span className="text-[#00e599]/60">&quot;fixable&quot;</span><span className="text-white/20">: </span><span className="text-blue-400/80">true</span></div>
                  </div>
                  <div className="text-white/20 mt-1">{'}'}</div>
                </div>
              </motion.div>
            </Reveal>

          </div>
        </div>
      </section>


      {/* ==================== DASHBOARD PREVIEW ==================== */}
      <section id="preview" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-4">
              The most advanced<br />
              <span className="text-white/25">AI code review platform.</span>
            </h2>
            <p className="text-base text-white/30 mb-12 max-w-lg">Built for developers who care about code quality. Powered by the same AI that understands your codebase.</p>
          </Reveal>
          <Reveal delay={0.15}>
            <DashboardMockup />
          </Reveal>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="py-32 px-6">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center relative">
            <div className="rounded-3xl border border-[#00e599]/[0.12] overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #030f07 0%, #020a05 50%, #030f07 100%)' }}>
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,153,0.5), transparent)' }} />
              {/* Radial glow center */}
              <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,153,0.10) 0%, transparent 65%)' }} />
              {/* Bottom corner glows */}
              <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,229,153,0.05), transparent)' }} />
              <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(0,229,153,0.05), transparent)' }} />

              {/* Subtle animated scan line */}
              <motion.div className="absolute left-0 right-0 h-px pointer-events-none"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(0,229,153,0.2), transparent)' }}
                animate={{ top: ['10%', '90%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear', repeatType: 'reverse' }}
              />

              <div className="relative z-10 px-12 py-20">
                {/* Small badge */}
                <div className="inline-flex items-center gap-2 bg-[#00e599]/[0.06] border border-[#00e599]/[0.12] rounded-full px-4 py-1.5 mb-8">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00e599] animate-pulse" />
                  <span className="text-[11px] font-mono text-[#00e599]/70">Powered by Google Gemini · Multi-Agent</span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-5 leading-[1.05]">
                  Ready to see what&apos;s<br />
                  <span className="text-[#00e599]">really</span> in your code?
              </h2>
                <p className="text-white/35 mb-10 text-lg max-w-md mx-auto leading-relaxed">
                  Connect your GitHub. No card, no config, no waiting.
                </p>

                <div className="flex items-center justify-center gap-4 flex-wrap">
              <motion.button onClick={handleSignIn} disabled={signingIn}
                    whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center gap-2.5 bg-white text-black font-bold px-8 py-4 rounded-full text-base cursor-pointer hover:shadow-[0_0_60px_rgba(0,229,153,0.20)] transition-shadow">
                    <Github size={18} />
                {signingIn ? 'Connecting...' : 'Get Started Free'}
              </motion.button>
                  <a href="#features" className="inline-flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors text-base border border-white/10 rounded-full px-8 py-4 hover:border-white/20">
                    See how it works <ChevronRight size={16} />
                  </a>
                </div>

                {/* Social proof line */}
                <p className="mt-10 text-xs text-white/20 font-mono">
                  FastAPI · Next.js 15 · Gemini 2.0 · PostgreSQL · Redis · ChromaDB
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-white/[0.04] bg-[#000]">
        <div className="max-w-6xl mx-auto px-8 py-14">

          {/* Top row */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">

            {/* Brand + tagline */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-[26px] h-[26px] rounded-[7px] bg-[#00e599]/[0.1] border border-[#00e599]/[0.18] flex items-center justify-center">
            <Terminal size={12} className="text-[#00e599]" />
          </div>
                <span className="text-[13.5px] font-semibold text-white">CodeAuditAI</span>
              </div>
              <p className="text-[12px] text-white/25 max-w-[260px] leading-relaxed">
                Three specialist agents. RAG memory.<br/>Auto-fix generation. Built passionately.
              </p>
            </div>

            {/* Social links */}
            <div className="flex items-center gap-2.5">
              {[
                { href: 'https://github.com/YashasRgowda', label: 'GitHub',    icon: <Github size={15} /> },
                { href: 'https://www.linkedin.com/in/yashas-r-gowda/', label: 'LinkedIn',  icon: <LinkedInIcon size={15} /> },
                { href: 'mailto:yashas.r2002@gmail.com',               label: 'Email',     icon: <Mail size={15} /> },
                { href: 'https://medium.com/@engg.yashasr',            label: 'Medium',    icon: <MediumIcon size={15} /> },
                { href: 'https://www.instagram.com/its_yash_himself/', label: 'Instagram', icon: <Instagram size={15} /> },
              ].map(({ href, label, icon }) => (
                <a key={label} href={href}
                  target={href.startsWith('mailto') ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 rounded-lg border border-white/[0.07] flex items-center justify-center text-white/25 hover:text-white/70 hover:border-white/[0.18] hover:bg-white/[0.04] transition-all duration-200">
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Divider + bottom bar */}
          <div className="mt-10 pt-6 border-t border-white/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-[11px] text-white/15">
              Built by <span className="text-white/30 font-medium">Yashas R</span> &nbsp;·&nbsp; 2026
            </p>
            <p className="text-[11px] text-white/10 tracking-wide">
              FastAPI &nbsp;·&nbsp; Next.js &nbsp;·&nbsp; Gemini &nbsp;·&nbsp; PostgreSQL &nbsp;·&nbsp; Redis &nbsp;·&nbsp; ChromaDB
            </p>
          </div>

        </div>
      </footer>
    </div>
  );
}
