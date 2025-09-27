// File: src/app/repositories/[id]/page.js - REFACTORED
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function RepositoryDetailsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const repoId = params.id;
  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && repoId) {
      loadRepository();
    }
  }, [isAuthenticated, repoId]);

  const loadRepository = async () => {
    try {
      const data = await api.getRepository(repoId);
      setRepository(data);
    } catch (error) {
      console.error('Failed to load repository:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !repository) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/repositories">
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white mb-1">{repository.repo_name}</h1>
            {repository.description && (
              <p className="text-white/50">{repository.description}</p>
            )}
          </div>
        </div>

        {/* Repository Info Card */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Repository Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-white/40 mb-1">Added Date</p>
              <p className="text-sm text-white">{formatDate(repository.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-white/40 mb-1">Repository Name</p>
              <p className="text-sm text-white font-mono">{repository.repo_name}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href={`/repositories/${repoId}/commits`} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-violet-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-violet-500/10 rounded-xl">
                  <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">View Commits</h3>
                  <p className="text-sm text-white/50">Browse commit history</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/repositories/${repoId}/pull-requests`} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-emerald-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-xl">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Pull Requests</h3>
                  <p className="text-sm text-white/50">Review open PRs</p>
                </div>
              </div>
            </div>
          </Link>

          <Link href={`/repositories/${repoId}/analysis`} className="group relative">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl blur opacity-0 group-hover:opacity-20 transition duration-300"></div>
            <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-6 hover:border-amber-500/50 transition-all duration-300">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-amber-500/10 rounded-xl">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white mb-1">Analysis History</h3>
                  <p className="text-sm text-white/50">View past analyses</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}