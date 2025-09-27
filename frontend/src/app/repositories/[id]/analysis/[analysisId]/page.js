// File: src/app/repositories/[id]/analysis/[analysisId]/page.js - REFACTORED
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import RiskLevelBadge from '@/components/analysis/RiskLevelBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function AnalysisDetailsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { id: repoId, analysisId } = params;
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, authLoading, router]);

  useEffect(() => {
    if (isAuthenticated && analysisId) {
      loadAnalysis();
    }
  }, [isAuthenticated, analysisId]);

  const loadAnalysis = async () => {
    try {
      const data = await api.getAnalysis(analysisId);
      setAnalysis(data);
    } catch (error) {
      console.error('Failed to load analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'low': return 'from-green-600 to-emerald-600';
      case 'medium': return 'from-yellow-600 to-orange-600';
      case 'high': return 'from-red-600 to-pink-600';
      default: return 'from-gray-600 to-gray-600';
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !analysis) return null;

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-4">
          <Link href={`/repositories/${repoId}/analysis`}>
            <button className="p-2 hover:bg-white/5 rounded-lg transition-all duration-200">
              <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white mb-1">Analysis Details</h1>
            <p className="text-white/50">Commit: {analysis.commit_hash.substring(0, 8)}</p>
          </div>
        </div>

        {/* Main Analysis Card */}
        <div className="group relative">
          <div className={`absolute -inset-0.5 bg-gradient-to-r ${getRiskColor(analysis.risk_level)} rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300`}></div>
          <div className="relative bg-[#161616] border border-white/10 rounded-2xl p-8">
            
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <RiskLevelBadge riskLevel={analysis.risk_level} />
                  <span className="text-xs text-white/40">
                    {formatDate(analysis.created_at)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">{analysis.summary}</h2>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{analysis.files_changed}</div>
                    <div className="text-xs text-white/50">Files Changed</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">+{analysis.lines_added}</div>
                    <div className="text-xs text-white/50">Lines Added</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-400">-{analysis.lines_removed}</div>
                    <div className="text-xs text-white/50">Lines Removed</div>
                  </div>
                </div>
              </div>

              <div className="bg-black/40 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-violet-500/10 rounded-lg">
                    <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">{analysis.security_score}<span className="text-sm text-white/50">/100</span></div>
                    <div className="text-xs text-white/50">Security Score</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Analysis */}
            {analysis.changes_data?.full_analysis && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  AI Analysis Report
                </h3>
                <div className="bg-black/40 border border-white/5 rounded-xl p-6">
                  <pre className="text-sm text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
                    {analysis.changes_data.full_analysis}
                  </pre>
                </div>
              </div>
            )}

            {/* Commit Info */}
            <div className="bg-black/40 border border-white/5 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Commit Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Commit Hash</p>
                    <p className="text-sm text-white font-mono bg-black/40 px-3 py-2 rounded-lg">{analysis.commit_hash}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Author</p>
                    <p className="text-sm text-white">{analysis.changes_data?.author || 'Unknown'}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-white/40 mb-1">Commit Message</p>
                    <p className="text-sm text-white/80">{analysis.changes_data?.commit_message || 'No message'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 mb-1">Analysis Date</p>
                    <p className="text-sm text-white">{formatDate(analysis.created_at)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}