// File: src/app/repositories/[id]/pull-requests/page.js - REFACTORED
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import PullRequestCard from '@/components/repository/PullRequestCard';
import EmptyRepositoryState from '@/components/repository/EmptyRepositoryState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function PullRequestsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const repoId = params.id;
  const [repository, setRepository] = useState(null);
  const [pullRequests, setPullRequests] = useState([]);
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
      const [repoData, prsData] = await Promise.all([
        api.getRepository(repoId),
        api.getPullRequests(repoId)
      ]);
      setRepository(repoData);
      setPullRequests(prsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (pr) => {
    try {
      const result = await api.quickPRAnalysis({
        repo_full_name: repository.repo_name,
        pr_number: pr.number
      });
      alert(`PR Analysis Complete!\nRisk Level: ${result.risk_level}\nSummary: ${result.summary}`);
    } catch (error) {
      console.error('Failed to analyze PR:', error);
      alert('Failed to analyze PR');
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
            <h1 className="text-3xl font-bold text-white mb-1">Pull Requests</h1>
            <p className="text-white/50">{repository.repo_name}</p>
          </div>
        </div>

        {/* Pull Requests List */}
        {pullRequests.length === 0 ? (
          <EmptyRepositoryState
            icon={
              <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            }
            title="No pull requests found"
            description="This repository has no open pull requests"
          />
        ) : (
          <div className="space-y-3">
            {pullRequests.map((pr) => (
              <PullRequestCard 
                key={pr.id} 
                pullRequest={pr}
                onAnalyze={handleAnalyze}
              />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}