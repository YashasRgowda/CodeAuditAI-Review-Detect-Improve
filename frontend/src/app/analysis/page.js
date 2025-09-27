// File: frontend/src/app/analysis/page.js - REPLACE ENTIRE FILE
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AnalysisPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [analyses, setAnalyses] = useState([]);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAnalyses();
    }
  }, [isAuthenticated]);

  const loadAnalyses = async () => {
    try {
      const data = await api.getAnalysisHistory();
      setAnalyses(data);
      
      const high = data.filter(a => a.risk_level === 'high').length;
      const medium = data.filter(a => a.risk_level === 'medium').length;
      const low = data.filter(a => a.risk_level === 'low').length;
      
      setStats({ total: data.length, high, medium, low });
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth' });
  };

  const getRiskBadgeColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'bg-green-500/10 text-green-400 border-green-500/50';
      case 'medium': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/50';
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/50';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-2xl">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-white/5 rounded-lg transition-all duration-200 flex-shrink-0"
            >
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 blur-lg opacity-50"></div>
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                  </svg>
                </div>
              </div>
              <span className="text-base sm:text-lg font-semibold text-white truncate">AI Code Review</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1 sm:gap-2">
            <button className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-all duration-200 group">
              <svg className="w-4 h-4 text-white/40 group-hover:text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm text-white/40 group-hover:text-white/60">Search</span>
              <kbd className="px-1.5 py-0.5 text-xs bg-white/5 rounded border border-white/10">⌘K</kbd>
            </button>

            <button className="relative p-2 hover:bg-white/5 rounded-lg transition-all duration-200 group flex-shrink-0">
              <svg className="w-5 h-5 text-white/60 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
            </button>

            <button className="hidden sm:block p-2 hover:bg-white/5 rounded-lg transition-all duration-200 group flex-shrink-0">
              <svg className="w-5 h-5 text-white/60 group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            <div className="relative">
              <button 
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 hover:bg-white/5 rounded-lg transition-all duration-200"
              >
                {user?.image ? (
                  <img src={user.image} alt={user.name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-white/10" />
                ) : (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs sm:text-sm font-bold text-white">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
                <svg className={`w-3 h-3 sm:w-4 sm:h-4 text-white/60 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-[#161616] border border-white/10 rounded-xl shadow-2xl overflow-hidden backdrop-blur-xl">
                  <div className="p-3 sm:p-4 border-b border-white/10">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {user?.image ? (
                        <img src={user.image} alt={user.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg" />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-sm font-bold text-white">
                          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-white/50 truncate">{user?.email || 'user@example.com'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-2">
                    <Link href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-white/80 hover:bg-white/5 rounded-lg transition-all duration-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`fixed lg:sticky top-[57px] sm:top-[73px] left-0 h-[calc(100vh-57px)] sm:h-[calc(100vh-73px)] z-30 bg-black/40 border-r border-white/5 backdrop-blur-xl transform transition-all duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'} w-64`}>
          
          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute -right-3 top-6 w-6 h-6 bg-[#161616] border border-white/10 rounded-full items-center justify-center hover:bg-white/5 transition-all duration-200 group z-50"
          >
            <svg className={`w-3 h-3 text-white/60 group-hover:text-white transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <nav className="p-3 sm:p-4 space-y-1 sm:space-y-2">
            <Link href="/" className="group relative flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl overflow-hidden transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              <svg className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors duration-200 relative z-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className={`text-sm sm:text-base font-medium text-white/60 group-hover:text-white transition-all duration-300 relative z-10 ${sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>Dashboard</span>
            </Link>
            
            <Link href="/repositories" className="group relative flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl overflow-hidden transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              <svg className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors duration-200 relative z-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <span className={`text-sm sm:text-base font-medium text-white/60 group-hover:text-white transition-all duration-300 relative z-10 ${sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>Repositories</span>
            </Link>
            
            <Link href="/analysis" className="group relative flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl overflow-hidden transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 opacity-100"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              <svg className="w-5 h-5 text-violet-400 transition-colors duration-200 relative z-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className={`text-sm sm:text-base font-medium text-white transition-all duration-300 relative z-10 ${sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>Analysis</span>
            </Link>
            
            <Link href="/analysis/quick" className="group relative flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl overflow-hidden transition-all duration-200">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-600 opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
              <svg className="w-5 h-5 text-white/40 group-hover:text-white/80 transition-colors duration-200 relative z-10 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className={`text-sm sm:text-base font-medium text-white/60 group-hover:text-white transition-all duration-300 relative z-10 ${sidebarCollapsed ? 'lg:opacity-0 lg:w-0' : 'opacity-100'}`}>Quick Analysis</span>
            </Link>
          </nav>
        </aside>

        {sidebarOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />}

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">Analysis Dashboard</h1>
                <p className="text-sm sm:text-base text-white/50">View and manage all your code analyses</p>
              </div>
              <Link href="/analysis/quick" className="group relative inline-flex w-full sm:w-auto">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition duration-200"></div>
                <button className="relative w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-sm sm:text-base font-medium transition-all duration-200 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Quick Analysis
                </button>
              </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-[#161616] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-violet-500/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="min-w-0">
                      <p className="text-white/50 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Total</p>
                      <p className="text-2xl sm:text-4xl font-bold text-white">{stats.total}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-violet-500/10 rounded-lg sm:rounded-xl group-hover:bg-violet-500/20 transition-colors duration-300 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-[#161616] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-red-500/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="min-w-0">
                      <p className="text-white/50 text-xs sm:text-sm font-medium mb-1 sm:mb-2">High</p>
                      <p className="text-2xl sm:text-4xl font-bold text-red-400">{stats.high}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-red-500/10 rounded-lg sm:rounded-xl group-hover:bg-red-500/20 transition-colors duration-300 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-gradient-to-r from-red-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-[#161616] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-yellow-500/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="min-w-0">
                      <p className="text-white/50 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Medium</p>
                      <p className="text-2xl sm:text-4xl font-bold text-yellow-400">{stats.medium}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-yellow-500/10 rounded-lg sm:rounded-xl group-hover:bg-yellow-500/20 transition-colors duration-300 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
                <div className="relative bg-[#161616] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:border-green-500/50 transition-all duration-300">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className="min-w-0">
                      <p className="text-white/50 text-xs sm:text-sm font-medium mb-1 sm:mb-2">Low</p>
                      <p className="text-2xl sm:text-4xl font-bold text-green-400">{stats.low}</p>
                    </div>
                    <div className="p-2 sm:p-3 bg-green-500/10 rounded-lg sm:rounded-xl group-hover:bg-green-500/20 transition-colors duration-300 flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-6 sm:h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-gradient-to-r from-green-600 to-emerald-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="bg-[#161616] border border-white/10 rounded-xl sm:rounded-2xl overflow-hidden backdrop-blur-xl">
              <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10 flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-white">Recent Analyses</h3>
                {analyses.length > 0 && (
                  <span className="text-xs sm:text-sm text-white/50">{analyses.length} total</span>
                )}
              </div>
              
              {analyses.length === 0 ? (
                <div className="px-4 sm:px-6 py-12 sm:py-16 text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/5 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-base sm:text-lg font-medium text-white mb-1 sm:mb-2">No analyses yet</h3>
                  <p className="text-sm sm:text-base text-white/50 mb-4 sm:mb-6">Start by running your first code analysis</p>
                  <Link href="/analysis/quick" className="inline-flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-sm sm:text-base font-medium transition-all duration-200">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Start Quick Analysis
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {analyses.map((analysis) => (
                    <Link 
                      key={analysis.id} 
                      href={`/repositories/${analysis.repository_id}/analysis/${analysis.id}`}
                      className="block px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/5 transition-all duration-200 group"
                    >
                      <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                            <h4 className="text-sm sm:text-base text-white font-medium group-hover:text-violet-400 transition-colors duration-200 truncate">
                              {analysis.summary}
                            </h4>
                            <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold border flex-shrink-0 w-fit ${getRiskBadgeColor(analysis.risk_level)}`}>
                              {analysis.risk_level?.toUpperCase()}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-white/50">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span className="hidden sm:inline">{formatDate(analysis.created_at)}</span>
                              <span className="sm:hidden">{formatDate(analysis.created_at).split(',')[0]}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {analysis.files_changed} <span className="hidden sm:inline">files</span>
                            </span>
                            <span className="flex items-center gap-1 text-green-400">
                              +{analysis.lines_added}
                            </span>
                            <span className="flex items-center gap-1 text-red-400">
                              -{analysis.lines_removed}
                            </span>
                          </div>
                        </div>
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white/40 group-hover:text-white/80 transition-colors duration-200 flex-shrink-0 mt-1 sm:mt-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}