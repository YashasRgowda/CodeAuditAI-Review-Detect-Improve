// File: src/app/repositories/[id]/analysis/[analysisId]/page.js
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import RiskLevelBadge from '@/components/analysis/RiskLevelBadge';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { api } from '@/lib/api';

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !analysis) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Analysis Details</h1>
              <Link href={`/repositories/${repoId}/analysis`}>
                <Button variant="secondary">← Back to Analysis History</Button>
              </Link>
            </div>

            <div className="space-y-6">
              <Card>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-xl font-bold mb-2">{analysis.summary}</h2>
                    <div className="flex items-center space-x-3">
                      <RiskLevelBadge riskLevel={analysis.risk_level} />
                      <span className="text-sm text-gray-600">
                        {formatDate(analysis.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.files_changed}</div>
                    <div className="text-sm text-gray-600">Files Changed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">+{analysis.lines_added}</div>
                    <div className="text-sm text-gray-600">Lines Added</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">-{analysis.lines_removed}</div>
                    <div className="text-sm text-gray-600">Lines Removed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{analysis.security_score}/100</div>
                    <div className="text-sm text-gray-600">Security Score</div>
                  </div>
                </div>

                {analysis.changes_data?.full_analysis && (
                  <div>
                    <h3 className="font-medium mb-3">Detailed Analysis</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <pre className="whitespace-pre-wrap text-sm">
                        {analysis.changes_data.full_analysis}
                      </pre>
                    </div>
                  </div>
                )}
              </Card>

              <Card>
                <h3 className="font-medium mb-3">Commit Information</h3>
                <div className="space-y-2 text-sm">
                  <div><strong>Commit Hash:</strong> {analysis.commit_hash}</div>
                  <div><strong>Author:</strong> {analysis.changes_data?.author}</div>
                  <div><strong>Message:</strong> {analysis.changes_data?.commit_message}</div>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}