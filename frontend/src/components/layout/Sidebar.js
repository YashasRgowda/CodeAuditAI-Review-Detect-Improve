'use client';
// Sidebar.js — Luxury dark sidebar · crimson red accent
// Collapse: hover-activated floating edge handle (Notion/Linear style)
// Animation: GPU-accelerated, Material easing, no layout jank
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderGit2, BarChart3,
  MessageSquare, Bot, Wrench, Brain,
  Settings, LogOut, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

/* ── Nav groups ── */
const NAV = [
  {
    label: null,
    items: [
      { href: '/',             label: 'Dashboard',    icon: LayoutDashboard, exact: true },
      { href: '/repositories', label: 'Repositories', icon: FolderGit2 },
      { href: '/analysis',     label: 'Analysis',     icon: BarChart3 },
    ],
  },
  {
    label: 'AI Engine',
    items: [
      { href: '/chat',      label: 'AI Chat',     icon: MessageSquare },
      { href: '/agents',    label: 'Multi-Agent', icon: Bot },
      { href: '/autofix',   label: 'Auto-Fix',    icon: Wrench },
      { href: '/knowledge', label: 'Knowledge',   icon: Brain },
    ],
  },
  {
    label: 'System',
    items: [
      { href: '/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/* ── Single nav item ── */
function NavItem({ item, collapsed, pathname }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link href={item.href} tabIndex={-1}>
      <motion.div
        whileHover={{ x: isActive ? 0 : 2 }}
        transition={{ duration: 0.12, ease: 'easeOut' }}
        className={`
          relative flex items-center gap-3 cursor-pointer select-none
          transition-colors duration-150 group overflow-hidden
          ${collapsed ? 'justify-center px-0 py-[14px] mx-2 rounded-xl' : 'px-5 py-[12px]'}
          ${isActive
            ? collapsed
              ? 'bg-[#9f1239]/[0.12] text-white'
              : 'border-l-[2px] border-[#9f1239] bg-[#9f1239]/[0.05] text-white pl-[18px]'
            : collapsed
              ? 'text-white/30 hover:text-white/65 hover:bg-white/[0.04]'
              : 'border-l-[2px] border-transparent text-white/30 hover:text-white/68 hover:bg-white/[0.03] pl-[18px]'
          }
        `}
        title={collapsed ? item.label : undefined}
      >
        {isActive && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 20% 50%, rgba(159,18,57,0.07) 0%, transparent 70%)' }}
          />
        )}

        <Icon
          size={18}
          className={`shrink-0 transition-colors duration-150 ${
            isActive ? 'text-[#9f1239]' : 'text-white/25 group-hover:text-white/55'
          }`}
        />

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="label"
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              className={`text-[15px] font-semibold whitespace-nowrap leading-none ${
                isActive ? 'text-white/90' : ''
              }`}
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}

/* ── Main Sidebar ── */
export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [hovered,   setHovered]   = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const name   = session?.user?.name  || 'User';
  const avatar = session?.user?.image || `https://avatars.githubusercontent.com/${name}`;

  return (
    /*
      WRAPPER — handles width animation + overflow:visible so the
      floating edge button can peek beyond the sidebar boundary.
    */
    <motion.div
      animate={{ width: collapsed ? 72 : 272 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="relative h-screen shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >

      {/* ── Floating edge toggle (Notion/Linear style) ── */}
      <motion.button
        animate={{
          opacity: hovered ? 1 : 0,
          x:       hovered ? 0 : -6,
          scale:   hovered ? 1 : 0.82,
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        onClick={() => setCollapsed(c => !c)}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-1/2 z-50 flex items-center justify-center cursor-pointer"
        style={{
          right: -14,
          transform: 'translateY(-50%)',
          width:  28,
          height: 28,
          borderRadius: '50%',
          background: '#141414',
          border: '1px solid rgba(159,18,57,0.28)',
          boxShadow: hovered ? '0 0 12px rgba(159,18,57,0.18), 0 2px 8px rgba(0,0,0,0.6)' : 'none',
          pointerEvents: hovered ? 'auto' : 'none',
          transition: 'box-shadow 0.18s ease',
        }}
        whileHover={{ scale: 1.12, borderColor: 'rgba(159,18,57,0.55)' }}
        whileTap={{ scale: 0.9 }}
      >
        {collapsed
          ? <ChevronRight size={13} style={{ color: 'rgba(159,18,57,0.75)' }} />
          : <ChevronLeft  size={13} style={{ color: 'rgba(159,18,57,0.75)' }} />
        }
      </motion.button>

      {/* ── Sidebar inner shell (overflow-hidden for content clipping) ── */}
      <div
        className="h-full flex flex-col overflow-hidden"
        style={{ background: '#080808', borderRight: '1px solid #161616' }}
      >

        {/* Crimson right-edge glow line */}
        <div
          className="absolute right-0 top-0 bottom-0 w-px pointer-events-none z-10"
          style={{ background: 'linear-gradient(to bottom, transparent 0%, rgba(159,18,57,0.14) 35%, rgba(159,18,57,0.14) 65%, transparent 100%)' }}
        />

        {/* ───────────── LOGO ───────────── */}
        <div
          className="flex items-center shrink-0 overflow-hidden"
          style={{
            height: 72,
            padding: collapsed ? 0 : '0 18px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderBottom: '1px solid #141414',
          }}
        >
          {/* CA monogram */}
          <div
            className="relative shrink-0 flex items-center justify-center rounded-[10px] font-black text-[#9f1239] cursor-default"
            style={{
              width: 42, height: 42,
              background: 'rgba(159,18,57,0.09)',
              border: '1px solid rgba(159,18,57,0.22)',
              fontSize: 13,
              letterSpacing: '-0.02em',
              boxShadow: '0 0 14px rgba(159,18,57,0.07), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            CA
            <span
              className="absolute -top-[3px] -right-[3px] w-[7px] h-[7px] rounded-full bg-[#9f1239]"
              style={{ boxShadow: '0 0 6px rgba(159,18,57,0.9)', animation: 'glow-pulse 2.4s ease-in-out infinite' }}
            />
          </div>

          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                key="wordmark"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.14, ease: 'easeOut' }}
                className="ml-3 overflow-hidden"
              >
                <p className="text-[17px] font-bold text-white leading-none whitespace-nowrap">
                  CodeAuditAI
                </p>
                <p className="text-[10px] text-white/18 uppercase tracking-[0.14em] mt-[4px] whitespace-nowrap">
                  v5.0 · beta
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ───────────── NAV ───────────── */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden py-3"
          style={{ scrollbarWidth: 'none' }}
        >
          {NAV.map((group, gi) => (
            <div key={gi} className={gi > 0 ? 'mt-1' : ''}>

              <AnimatePresence initial={false}>
                {!collapsed && group.label && (
                  <motion.div
                    key={`label-${gi}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.12 }}
                    className="px-5 pt-4 pb-1.5"
                  >
                    <span
                      className="text-[10.5px] font-bold uppercase tracking-[0.15em]"
                      style={{ color: 'rgba(159,18,57,0.38)' }}
                    >
                      {group.label}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {collapsed && gi > 0 && (
                <div className="mx-4 my-2" style={{ height: 1, background: '#161616' }} />
              )}

              <div>
                {group.items.map(item => (
                  <NavItem
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    pathname={pathname}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* ───────────── USER DOCK ───────────── */}
        <div style={{ borderTop: '1px solid #141414' }}>
          <div
            className={`flex items-center gap-3.5 cursor-default transition-colors duration-150 hover:bg-white/[0.025] ${
              collapsed ? 'justify-center px-0 py-5' : 'px-5 py-4'
            }`}
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <img
                src={avatar}
                alt={name}
                className="w-[38px] h-[38px] rounded-full object-cover"
                style={{ border: '1.5px solid rgba(159,18,57,0.30)' }}
              />
              <span
                className="absolute -bottom-[2px] -right-[2px] w-[8px] h-[8px] rounded-full bg-[#9f1239]"
                style={{ border: '1.5px solid #080808', boxShadow: '0 0 5px rgba(159,18,57,0.8)' }}
              />
            </div>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  key="user-info"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-[14px] font-semibold text-white/75 truncate leading-tight">{name}</p>
                  <p className="text-[11px] text-white/22 mt-[2px]">GitHub OAuth</p>
                </motion.div>
              )}
            </AnimatePresence>

            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/auth' })}
                className="text-white/18 hover:text-[#9f1239]/70 transition-colors duration-150 cursor-pointer p-1 rounded"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        </div>

      </div>{/* end inner shell */}
    </motion.div>
  );
}
