// File: src/components/commits/CommitList.js
'use client';
import { useState, useEffect } from 'react';
import CommitCard from './CommitCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

export default function CommitList({ repositoryId }) {
  const [commits, setCommits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCommits();
  }, [repositoryId]);

  const loadCommits = async () => {
    try {
      const data = await api.getCommits(repositoryId);
      setCommits(data);
    } catch (error) {
      console.error('Failed to load commits:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (commit) => {
    try {
      await api.fullAnalysis({
        repository_id: parseInt(repositoryId),
        commit_hash: commit.sha
      });
      alert('Analysis started! Check analysis history.');
    } catch (error) {
      console.error('Failed to start analysis:', error);
      alert('Failed to start analysis');
    }
  };

  const handleViewDiff = (commit) => {
    window.open(commit.html_url, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (commits.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No commits found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {commits.map((commit) => (
        <CommitCard
          key={commit.sha}
          commit={commit}
          onAnalyze={handleAnalyze}
          onViewDiff={handleViewDiff}
        />
      ))}
    </div>
  );
}