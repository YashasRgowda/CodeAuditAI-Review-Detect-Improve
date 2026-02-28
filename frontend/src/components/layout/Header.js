'use client';
// Header.js — Top bar aligned to sidebar logo height (72px)
// Minimal: page title + search + bell + avatar. Greeting lives in the page canvas.
import { Search, Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const pageTitles = {
  '/':             { title: 'Dashboard',      subtitle: 'Overview of your repos & AI analysis activity' },
  '/repositories': { title: 'Repositories',   subtitle: 'Manage and track your GitHub repositories'     },
  '/analysis':     { title: 'Analysis',       subtitle: 'Browse all AI code analysis results'           },
  '/chat':         { title: 'AI Chat',        subtitle: 'Ask follow-up questions about any analysis'    },
  '/agents':       { title: 'Multi-Agent',    subtitle: 'Security · Performance · Architecture agents'  },
  '/autofix':      { title: 'Auto-Fix',       subtitle: 'AI-generated code fixes for flagged issues'    },
  '/knowledge':    { title: 'Knowledge Base', subtitle: 'RAG memory — patterns from past reviews'       },
  '/settings':     { title: 'Settings',       subtitle: 'Configure your account and preferences'        },
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const currentPage = Object.keys(pageTitles)
    .filter(k => k !== '/')
    .find(k => pathname.startsWith(k)) || '/';
  const { title, subtitle } = pageTitles[currentPage] || pageTitles['/'];

  return (
    <header
      className="flex items-center justify-between px-6 shrink-0 backdrop-blur-sm"
      style={{
        height: 72,
        borderBottom: '1px solid #141414',
        background: 'rgba(8,8,8,0.94)',
      }}
    >
      {/* ── Page title ── */}
      <div>
        <h1 className="text-[16px] font-bold text-white/82 leading-none">{title}</h1>
        <p className="text-[11px] mt-[5px] hidden md:block" style={{ color: 'rgba(255,255,255,0.44)' }}>{subtitle}</p>
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-2.5">

        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={12} className="absolute left-3 pointer-events-none" style={{ color: 'rgba(255,255,255,0.18)' }} />
          <input
            placeholder="Search..."
            className="rounded-xl pl-8 pr-4 py-[7px] text-[12.5px] w-44 outline-none transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.52)',
            }}
            onFocus={e => {
              e.target.style.borderColor = 'rgba(159,18,57,0.35)';
              e.target.style.background  = 'rgba(255,255,255,0.05)';
            }}
            onBlur={e => {
              e.target.style.borderColor = 'rgba(255,255,255,0.07)';
              e.target.style.background  = 'rgba(255,255,255,0.03)';
            }}
          />
        </div>

        {/* Bell */}
        <button
          className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-all duration-150 cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.30)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.60)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.30)'; }}
        >
          <Bell size={15} />
          <span
            className="absolute top-[8px] right-[8px] w-[5px] h-[5px] rounded-full"
            style={{ background: '#9f1239', boxShadow: '0 0 5px rgba(159,18,57,0.9)' }}
          />
        </button>

        {/* Avatar */}
        {session?.user && (
          <img
            src={session.user.image || `https://avatars.githubusercontent.com/${session.user.name}`}
            alt={session.user.name}
            className="rounded-full object-cover cursor-pointer transition-all duration-200"
            style={{ width: 32, height: 32, border: '1.5px solid rgba(159,18,57,0.28)' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(159,18,57,0.55)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(159,18,57,0.28)'; }}
          />
        )}
      </div>
    </header>
  );
}
