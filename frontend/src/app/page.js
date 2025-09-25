// File: src/app/page.js
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import UserProfile from '@/components/auth/UserProfile';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { api } from '@/lib/api';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    repositories: 0,
    analyses: 0,
    loading: true
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, loading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated]);

  const loadStats = async () => {
    try {
      const [repos, analyses] = await Promise.all([
        api.getUserRepos(),
        api.getAnalysisHistory()
      ]);
      setStats({
        repositories: repos.length,
        analyses: analyses.length,
        loading: false
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <UserProfile />
              
              <Card>
                <h3 className="font-medium mb-2">Repositories</h3>
                {stats.loading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="text-2xl font-bold">{stats.repositories}</div>
                )}
                <Link href="/repositories">
                  <Button variant="secondary" className="mt-3 w-full">
                    View All
                  </Button>
                </Link>
              </Card>
              
              <Card>
                <h3 className="font-medium mb-2">Analyses</h3>
                {stats.loading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="text-2xl font-bold">{stats.analyses}</div>
                )}
                <Link href="/analysis">
                  <Button variant="secondary" className="mt-3 w-full">
                    View History
                  </Button>
                </Link>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <h3 className="font-medium mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <Link href="/repositories/add">
                    <Button className="w-full">Add Repository</Button>
                  </Link>
                  <Link href="/analysis/quick">
                    <Button variant="secondary" className="w-full">
                      Quick Analysis
                    </Button>
                  </Link>
                </div>
              </Card>

              <Card>
                <h3 className="font-medium mb-4">Recent Activity</h3>
                <p className="text-gray-600">No recent activity</p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}