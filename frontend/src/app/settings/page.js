// File: src/app/settings/page.js
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Providers } from '@/components/providers/Providers';

function SettingsPage() {
  const { isAuthenticated, loading, user } = useAuth();
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
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Settings</h1>
            
            <div className="space-y-6">
              <Card>
                <h2 className="text-xl font-bold mb-4">Account Information</h2>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Name</label>
                    <div className="text-gray-900">{user?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Email</label>
                    <div className="text-gray-900">{user?.email || 'N/A'}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">GitHub Username</label>
                    <div className="text-gray-900">@{user?.name || 'N/A'}</div>
                  </div>
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-bold mb-4">Preferences</h2>
                <p className="text-gray-600">Settings and preferences will be available in future updates.</p>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function SettingsPageWithProviders() {
  return (
    <Providers>
      <SettingsPage />
    </Providers>
  );
}