// File: src/components/layout/Sidebar.js - FIXED
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { 
    href: '/', 
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    href: '/repositories', 
    label: 'Repositories',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    )
  },
  { 
    href: '/analysis', 
    label: 'Analysis',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  },
  { 
    href: '/analysis/quick', 
    label: 'Quick Analysis',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  },
];

export default function Sidebar({ isOpen, isCollapsed, onToggleCollapse }) {
  const pathname = usePathname();

  const isActive = (href) => {
    // Exact match for home page
    if (href === '/') return pathname === '/';
    
    // For nested routes, check exact match first
    if (href === '/analysis/quick') return pathname === '/analysis/quick';
    if (href === '/analysis') return pathname === '/analysis';
    
    // For other routes, use startsWith
    return pathname.startsWith(href);
  };

  return (
    <aside className={`fixed lg:sticky top-[73px] left-0 h-[calc(100vh-73px)] z-30 bg-black/40 border-r border-white/5 backdrop-blur-xl transform transition-all duration-300 ${
      isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    } ${isCollapsed ? 'lg:w-20' : 'lg:w-64'}`}>
      
      {/* Collapse Toggle Button - Desktop Only */}
      <button 
        onClick={onToggleCollapse}
        className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-[#161616] border border-white/10 rounded-full items-center justify-center hover:bg-white/5 transition-all duration-200 group z-50"
      >
        <svg className={`w-3 h-3 text-white/60 group-hover:text-white transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Navigation Links */}
      <nav className="p-4 space-y-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          
          return (
            <Link 
              key={item.href} 
              href={item.href} 
              className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl overflow-hidden transition-all duration-200 ${
                active ? 'bg-gradient-to-r from-violet-600/20 to-indigo-600/20' : ''
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 transition-opacity duration-200 ${
                active ? 'opacity-0 group-hover:opacity-10' : 'opacity-0 group-hover:opacity-10'
              }`}></div>
              
              <div className={`relative z-10 shrink-0 transition-colors duration-200 ${
                active ? 'text-violet-400' : 'text-white/40 group-hover:text-white/80'
              }`}>
                {item.icon}
              </div>
              
              <span className={`font-medium transition-all duration-300 relative z-10 ${
                active ? 'text-white' : 'text-white/60 group-hover:text-white'
              } ${isCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}