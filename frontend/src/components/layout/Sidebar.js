'use client';
// Sidebar.js — Collapsible dark sidebar inspired by Linear + Raycast
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, FolderGit2, BarChart3, MessageSquare,
  Bot, Wrench, Brain, Settings, ChevronLeft, ChevronRight,
  Sparkles, LogOut, GitBranch,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';

const mainNav = [
  { href: '/',             label: 'Dashboard',     icon: LayoutDashboard, exact: true },
  { href: '/repositories', label: 'Repositories',  icon: FolderGit2 },
  { href: '/analysis',     label: 'Analysis',      icon: BarChart3 },
];

const aiNav = [
  { href: '/chat',      label: 'AI Chat',       icon: MessageSquare },
  { href: '/agents',    label: 'Multi-Agent',   icon: Bot },
  { href: '/autofix',   label: 'Auto-Fix',      icon: Wrench },
  { href: '/knowledge', label: 'Knowledge',     icon: Brain },
];

const bottomNav = [
  { href: '/settings', label: 'Settings', icon: Settings },
];

function NavItem({ item, collapsed, pathname }) {
  const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link href={item.href}>
      <motion.div
        className={`
          relative flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer
          transition-all duration-200 group
          ${isActive
            ? 'bg-violet-600/15 text-white border-l-2 border-violet-500 pl-[10px]'
            : 'text-white/45 hover:text-white/80 hover:bg-white/5'
          }
        `}
        whileHover={{ x: isActive ? 0 : 2 }}
        transition={{ duration: 0.15 }}
      >
        <Icon size={16} className={isActive ? 'text-violet-400' : 'text-white/40 group-hover:text-white/60'} />
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </Link>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <motion.aside
      animate={{ width: collapsed ? 60 : 220 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-[#0c0c0c] border-r border-white/6 shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 h-14 border-b border-white/6 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-violet-600/20 border border-violet-500/30 flex items-center justify-center shrink-0">
          <GitBranch size={14} className="text-violet-400" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <span className="text-sm font-bold gradient-text whitespace-nowrap">CodeAuditAI</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-1">
        {/* Main nav */}
        <div className="space-y-0.5">
          {mainNav.map(item => (
            <NavItem key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
          ))}
        </div>

        {/* AI Features section */}
        <div className="pt-3">
          {!collapsed && (
            <div className="flex items-center gap-1.5 px-3 mb-1.5">
              <Sparkles size={10} className="text-cyan-400/60" />
              <span className="text-[10px] font-semibold text-white/25 uppercase tracking-widest">AI Features</span>
            </div>
          )}
          {collapsed && <div className="h-px bg-white/6 mx-2 mb-2" />}
          <div className="space-y-0.5">
            {aiNav.map(item => (
              <NavItem key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-white/6 p-2 space-y-1">
        {bottomNav.map(item => (
          <NavItem key={item.href} item={item} collapsed={collapsed} pathname={pathname} />
        ))}

        {/* User profile */}
        {session?.user && (
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mt-1 ${collapsed ? 'justify-center' : ''}`}>
            <img
              src={session.user.image || `https://avatars.githubusercontent.com/${session.user.name}`}
              alt={session.user.name}
              className="w-6 h-6 rounded-full shrink-0 border border-white/10"
            />
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-xs font-medium text-white/70 truncate">{session.user.name}</p>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button
                onClick={() => signOut({ callbackUrl: '/auth' })}
                className="text-white/25 hover:text-red-400 transition-colors cursor-pointer"
              >
                <LogOut size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-14 w-6 h-6 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white/40 hover:text-white/80 hover:border-white/25 transition-all duration-200 z-10 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={11} /> : <ChevronLeft size={11} />}
      </button>
    </motion.aside>
  );
}
