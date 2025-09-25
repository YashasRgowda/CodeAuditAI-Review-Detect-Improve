// File: src/app/repositories/add/page.js - WRAP WITH PROVIDERS  
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import AddRepositoryForm from '@/components/repository/AddRepositoryForm';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Providers } from '@/components/providers/Providers';

function AddRepositoryPage() {
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
          <div className="max-w-2xl mx-auto">
            <AddRepositoryForm />
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AddRepositoryPageWithProviders() {
  return (
    <Providers>
      <AddRepositoryPage />
    </Providers>
  );
}