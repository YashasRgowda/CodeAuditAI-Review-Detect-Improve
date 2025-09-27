// File: src/app/analysis/page.js - REFACTORED WITH COMPONENTS
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AnalysisStatCard from '@/components/analysis/AnalysisStatCard';
import AnalysisListItem from '@/components/analysis/AnalysisListItem';
import EmptyAnalysisState from '@/components/analysis/EmptyAnalysisState';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

export default function AnalysisPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analysis Dashboard</h1>
            <p className="text-white/50">View and manage all your code analyses</p>
          </div>
          <Link href="/analysis/quick" className="group relative inline-flex">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl blur opacity-0 group-hover:opacity-50 transition duration-200"></div>
            <button className="relative bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Quick Analysis
            </button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <AnalysisStatCard
            title="Total Analyses"
            value={stats.total}
            icon={
              <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            gradient="bg-gradient-to-r from-violet-600 to-indigo-600"
            textColor="text-white"
          />

          <AnalysisStatCard
            title="High Risk"
            value={stats.high}
            icon={
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            }
            gradient="bg-gradient-to-r from-red-600 to-pink-600"
            textColor="text-red-400"
          />

          <AnalysisStatCard
            title="Medium Risk"
            value={stats.medium}
            icon={
              <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="bg-gradient-to-r from-yellow-600 to-orange-600"
            textColor="text-yellow-400"
          />

          <AnalysisStatCard
            title="Low Risk"
            value={stats.low}
            icon={
              <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            gradient="bg-gradient-to-r from-green-600 to-emerald-600"
            textColor="text-green-400"
          />
        </div>

        {/* Recent Analyses */}
        <div className="bg-[#161616] border border-white/10 rounded-2xl overflow-hidden backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Analyses</h3>
            {analyses.length > 0 && (
              <span className="text-sm text-white/50">{analyses.length} total</span>
            )}
          </div>
          
          {analyses.length === 0 ? (
            <div className="p-6">
              <EmptyAnalysisState />
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {analyses.map((analysis) => (
                <AnalysisListItem key={analysis.id} analysis={analysis} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}