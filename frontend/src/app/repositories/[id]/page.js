// File: src/app/repositories/[id]/page.js
'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import RepositoryStats from '@/components/repository/RepositoryStats';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { api } from '@/lib/api';

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
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !repository) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="flex">
        <Navigation />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">{repository.repo_name}</h1>
              <Link href="/repositories">
                <Button variant="secondary">← Back to Repositories</Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2">
                {repository.description && (
                  <Card className="mb-6">
                    <p className="text-gray-700">{repository.description}</p>
                  </Card>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link href={`/repositories/${repoId}/commits`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="font-medium mb-2">Commits</h3>
                      <p className="text-sm text-gray-600">View recent commits</p>
                    </Card>
                  </Link>
                  
                  <Link href={`/repositories/${repoId}/pull-requests`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="font-medium mb-2">Pull Requests</h3>
                      <p className="text-sm text-gray-600">View pull requests</p>
                    </Card>
                  </Link>
                  
                  <Link href={`/repositories/${repoId}/analysis`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <h3 className="font-medium mb-2">Analysis History</h3>
                      <p className="text-sm text-gray-600">View past analyses</p>
                    </Card>
                  </Link>
                </div>
              </div>
              
              <div>
                <RepositoryStats repository={repository} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}