// File: src/app/repositories/[id]/analysis/page.js - REFACTORED
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnalysisHistoryItem from '@/components/repository/AnalysisHistoryItem';
import EmptyRepositoryState from '@/components/repository/EmptyRepositoryState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function AnalysisHistoryPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const repoId = params.id;
  const [repository, setRepository] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && repoId) {
      loadData();
    }
  }, [isAuthenticated, repoId]);

  const loadData = async () => {
    try {
      const [repoData, analysesData] = await Promise.all([
        api.getRepository(repoId),
        api.getAnalysisHistory(parseInt(repoId))
      ]);
      setRepository(repoData);
      setAnalyses(analysesData);
    } catch (error) {
      console.error('Failed to load data:', error);
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
          <Link href={`/repositories/${repoId}`}>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Analysis History</h1>
            <p className="text-white/50">{repository.repo_name}</p>
          </div>
        </div>

        {/* Analysis List */}
        {analyses.length === 0 ? (
          <EmptyRepositoryState
            icon={
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            title="No analyses found"
            description="Start analyzing commits to see results here"
            actionLabel="View Commits"
            actionHref={`/repositories/${repoId}/commits`}
          />
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <AnalysisHistoryItem 
                key={analysis.id} 
                analysis={analysis}
                repoId={repoId}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}