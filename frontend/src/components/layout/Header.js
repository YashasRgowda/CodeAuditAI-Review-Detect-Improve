'use client';
// Header.js — Top bar with page title + search + user avatar
import { Search, Bell } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

const pageTitles = {
  '/':             { title: 'Dashboard',      subtitle: 'Overview of your repositories & analysis activity' },
  '/repositories': { title: 'Repositories',   subtitle: 'Manage and track your GitHub repositories' },
  '/analysis':     { title: 'Analysis',        subtitle: 'Browse all AI code analysis results' },
  '/chat':         { title: 'AI Chat',         subtitle: 'Ask questions about any analysis result' },
  '/agents':       { title: 'Multi-Agent',     subtitle: 'Deep analysis with Security, Performance & Architecture agents' },
  '/autofix':      { title: 'Auto-Fix',        subtitle: 'AI-generated code fixes for flagged issues' },
  '/knowledge':    { title: 'Knowledge Base',  subtitle: 'RAG memory — patterns learned from all past reviews' },
  '/settings':     { title: 'Settings',        subtitle: 'Configure your account and preferences' },
};

export default function Header() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const currentPage = Object.keys(pageTitles)
    .filter(k => k !== '/')
    .find(k => pathname.startsWith(k)) || '/';
  const { title, subtitle } = pageTitles[currentPage] || pageTitles['/'];

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-white/6 bg-[#080808]/80 backdrop-blur-sm shrink-0">
      {/* Page info */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-white/90">{title}</h1>
          <p className="text-xs text-white/30 hidden md:block">{subtitle}</p>
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <div className="relative hidden md:flex items-center">
          <Search size={13} className="absolute left-3 text-white/25 pointer-events-none" />
          <input
            placeholder="Search..."
            className="bg-white/4 border border-white/8 rounded-lg pl-8 pr-4 py-1.5 text-xs text-white/60 placeholder:text-white/20 focus:outline-none focus:border-white/15 w-48 transition-all"
          />
        </div>

        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-white/35 hover:text-white/60 hover:bg-white/5 transition-all cursor-pointer">
          <Bell size={15} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>

        {session?.user && (
          <img
            src={session.user.image || `https://avatars.githubusercontent.com/${session.user.name}`}
            alt={session.user.name}
            className="w-7 h-7 rounded-full border border-white/12 cursor-pointer hover:border-white/25 transition-all"
          />
        )}
      </div>
    </header>
  );
}
