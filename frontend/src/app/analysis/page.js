// File: src/app/analysis/page.js
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import AnalysisHistory from '@/components/analysis/AnalysisHistory';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';

export default function AnalysisPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Analysis Dashboard</h1>
              <div className="flex space-x-3">
                <Link href="/analysis/quick">
                  <Button>Quick Analysis</Button>
                </Link>
                <Link href="/analysis/compare">
                  <Button variant="secondary">Compare Analyses</Button>
                </Link>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <h3 className="font-medium mb-2">Total Analyses</h3>
                <div className="text-2xl font-bold">--</div>
              </Card>
              <Card>
                <h3 className="font-medium mb-2">High Risk</h3>
                <div className="text-2xl font-bold text-red-600">--</div>
              </Card>
              <Card>
                <h3 className="font-medium mb-2">Medium Risk</h3>
                <div className="text-2xl font-bold text-yellow-600">--</div>
              </Card>
              <Card>
                <h3 className="font-medium mb-2">Low Risk</h3>
                <div className="text-2xl font-bold text-green-600">--</div>
              </Card>
            </div>

            <Card>
              <h2 className="text-xl font-bold mb-6">Recent Analyses</h2>
              <AnalysisHistory limit={20} />
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
