// File: src/app/repositories/[id]/pull-requests/page.js
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import PRList from '@/components/pull-requests/PRList';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Providers } from '@/components/providers/Providers';

function PullRequestsPage() {
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
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Pull Requests</h1>
                <p className="text-gray-600 mt-1">{repository.repo_name}</p>
              </div>
              <Link href={`/repositories/${repoId}`}>
                <Button variant="secondary">← Back to Repository</Button>
              </Link>
            </div>

            <PRList repositoryId={repoId} />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function PullRequestsPageWithProviders() {
  return (
    <Providers>
      <PullRequestsPage />
    </Providers>
  );
}