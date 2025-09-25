// File: src/app/repositories/page.js - WRAP WITH PROVIDERS
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import RepositoryList from '@/components/repository/RepositoryList';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import Link from 'next/link';
import { Providers } from '@/components/providers/Providers';

function RepositoriesPage() {
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
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-3xl font-bold">Repositories</h1>
              <Link href="/repositories/add">
                <Button>Add Repository</Button>
              </Link>
            </div>
            
            <RepositoryList />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function RepositoriesPageWithProviders() {
  return (
    <Providers>
      <RepositoriesPage />
    </Providers>
  );
}