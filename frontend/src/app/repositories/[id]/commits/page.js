// File: src/app/repositories/[id]/commits/page.js - REFACTORED
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CommitListItem from '@/components/repository/CommitListItem';
import EmptyRepositoryState from '@/components/repository/EmptyRepositoryState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function CommitsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const repoId = params.id;
  const [repository, setRepository] = useState(null);
  const [commits, setCommits] = useState([]);
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
      const [repoData, commitsData] = await Promise.all([
        api.getRepository(repoId),
        api.getCommits(repoId)
      ]);
      setRepository(repoData);
      setCommits(commitsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (commit) => {
    try {
      await api.fullAnalysis({
        repository_id: parseInt(repoId),
        commit_hash: commit.sha
      });
      alert('Analysis started! Check analysis history.');
    } catch (error) {
      console.error('Failed to start analysis:', error);
      alert('Failed to start analysis');
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
            <h1 className="text-3xl font-bold text-white mb-1">Commits</h1>
            <p className="text-white/50">{repository.repo_name}</p>
          </div>
        </div>

        {/* Commits List */}
        {commits.length === 0 ? (
          <EmptyRepositoryState
            icon={
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="No commits found"
            description="This repository has no recent commits"
          />
        ) : (
          <div className="space-y-3">
            {commits.map((commit) => (
              <CommitListItem 
                key={commit.sha} 
                commit={commit}
                onAnalyze={handleAnalyze}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}