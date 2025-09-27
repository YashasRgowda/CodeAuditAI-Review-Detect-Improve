// File: src/app/page.js - REFACTORED WITH DASHBOARD LAYOUT
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function HomePage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    repositories: 0,
    analyses: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
    loading: true
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [recentRepos, setRecentRepos] = useState([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated]);

  const loadDashboardData = async () => {
    try {
      const [repos, analyses] = await Promise.all([
        api.getUserRepos(),
        api.getAnalysisHistory()
      ]);

      const highRisk = analyses.filter(a => a.risk_level === 'high').length;
      const mediumRisk = analyses.filter(a => a.risk_level === 'medium').length;
      const lowRisk = analyses.filter(a => a.risk_level === 'low').length;

      setStats({
        repositories: repos.length,
        analyses: analyses.length,
        highRisk,
        mediumRisk,
        lowRisk,
        loading: false
      });

      setRecentActivity(analyses.slice(0, 5));
      setRecentRepos(repos.slice(0, 3));
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (authLoading || stats.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Welcome */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
          </h1>
          <p className="text-white/50">Here's your code review overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/50 text-sm font-medium mb-2">Repositories</p>
                  <p className="text-4xl font-bold text-white">{stats.repositories}</p>
                </div>
                <div className="p-3 bg-violet-500/10 rounded-xl group-hover:bg-violet-500/20 transition-colors duration-300">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-indigo-500/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/50 text-sm font-medium mb-2">Total Analyses</p>
                  <p className="text-4xl font-bold text-white">{stats.analyses}</p>
                </div>
                <div className="p-3 bg-indigo-500/10 rounded-xl group-hover:bg-indigo-500/20 transition-colors duration-300">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-cyan-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-pink-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-red-500/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/50 text-sm font-medium mb-2">High Risk</p>
                  <p className="text-4xl font-bold text-red-400">{stats.highRisk}</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors duration-300">
                  <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-red-600 to-pink-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-30 transition duration-300"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-yellow-500/50 transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white/50 text-sm font-medium mb-2">Medium Risk</p>
                  <p className="text-4xl font-bold text-yellow-400">{stats.mediumRisk}</p>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-xl group-hover:bg-yellow-500/20 transition-colors duration-300">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="h-1 w-full bg-gradient-to-r from-yellow-600 to-orange-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
          </div>
        </div>

        {/* Activity & Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-[#161616] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
              <Link href="/analysis" className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
                View all →
              </Link>
            </div>
            
            {recentActivity.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-white/40">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentActivity.map((activity) => (
                  <Link 
                    key={activity.id} 
                    href={`/repositories/${activity.repository_id}/analysis/${activity.id}`}
                    className="block px-6 py-4 hover:bg-white/5 transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate group-hover:text-violet-400 transition-colors">
                          {activity.summary.substring(0, 60)}...
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-xs text-white/40 font-mono bg-white/5 px-2 py-1 rounded">
                            {activity.commit_hash.substring(0, 7)}
                          </span>
                          <span className="text-xs text-white/40">
                            {formatDate(activity.created_at)}
                          </span>
                        </div>
                      </div>
                      <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium ${
                        activity.risk_level === 'low' ? 'bg-green-500/10 text-green-400' :
                        activity.risk_level === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {activity.risk_level.toUpperCase()}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <div className="bg-[#161616] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link href="/repositories/add" className="block group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition duration-200"></div>
                  <button className="relative w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add Repository
                  </button>
                </Link>
                <Link href="/analysis/quick" className="block group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition duration-200"></div>
                  <button className="relative w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Quick Analysis
                  </button>
                </Link>
              </div>
            </div>

            {recentRepos.length > 0 && (
              <div className="bg-[#161616] border border-white/10 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-white mb-4">Recent Repositories</h3>
                <div className="space-y-2">
                  {recentRepos.map((repo) => (
                    <Link 
                      key={repo.id} 
                      href={`/repositories/${repo.id}`}
                      className="block p-3 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/50 rounded-xl transition-all duration-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-violet-500/10 rounded-lg group-hover:bg-violet-500/20 transition-colors">
                          <svg className="w-4 h-4 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                          </svg>
                        </div>
                        <p className="text-sm font-medium text-white/80 truncate group-hover:text-white transition-colors flex-1">
                          {repo.repo_name}
                        </p>
                        <svg className="w-4 h-4 text-white/20 group-hover:text-white/60 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}