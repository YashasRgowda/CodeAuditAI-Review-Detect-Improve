// File: src/app/analysis/quick/page.js - CREATE SIMPLE VERSION
'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Header from '@/components/layout/Header';
import Navigation from '@/components/layout/Navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { useState } from 'react';
import { api } from '@/lib/api';
import { Providers } from '@/components/providers/Providers';

function QuickAnalysisPage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const [repoName, setRepoName] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/auth');
    }
  }, [isAuthenticated, loading, router]);

  const handleAnalysis = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    setAnalyzing(true);
    setResult(null);

    try {
      const data = await api.quickAnalysis({
        repo_full_name: repoName,
        commit_sha: null
      });
      setResult(data);
    } catch (error) {
      console.error('Analysis failed:', error);
      alert('Analysis failed. Please check the repository name.');
    } finally {
      setAnalyzing(false);
    }
  };

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
            <h1 className="text-3xl font-bold mb-8">Quick Analysis</h1>
            
            <Card>
              <h2 className="text-xl font-bold mb-4">Analyze Any GitHub Repository</h2>
              
              <form onSubmit={handleAnalysis} className="space-y-4">
                <Input
                  label="Repository Name"
                  placeholder="username/repository-name"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  required
                />
                
                <Button type="submit" disabled={analyzing}>
                  {analyzing ? 'Analyzing...' : 'Analyze Repository'}
                </Button>
              </form>
            </Card>

            {analyzing && (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            )}

            {result && (
              <Card className="mt-6">
                <h3 className="text-lg font-bold mb-4">Analysis Results</h3>
                <div className="space-y-3">
                  <div>
                    <strong>Risk Level:</strong> 
                    <span className={`ml-2 px-2 py-1 rounded text-sm ${
                      result.risk_level === 'high' ? 'bg-red-100 text-red-800' :
                      result.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {result.risk_level?.toUpperCase()}
                    </span>
                  </div>
                  <div><strong>Files Changed:</strong> {result.files_changed}</div>
                  <div><strong>Lines Added:</strong> <span className="text-green-600">+{result.lines_added}</span></div>
                  <div><strong>Lines Removed:</strong> <span className="text-red-600">-{result.lines_removed}</span></div>
                  <div><strong>Summary:</strong> {result.summary}</div>
                </div>
              </Card>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default function QuickAnalysisPageWithProviders() {
  return (
    <Providers>
      <QuickAnalysisPage />
    </Providers>
  );
}