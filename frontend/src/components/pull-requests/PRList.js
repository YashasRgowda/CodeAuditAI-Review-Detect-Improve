// File: src/components/pull-requests/PRList.js
'use client';
import { useState, useEffect } from 'react';
import PRCard from './PRCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

export default function PRList({ repositoryId }) {
  const [pullRequests, setPullRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPullRequests();
  }, [repositoryId]);

  const loadPullRequests = async () => {
    try {
      const data = await api.getPullRequests(repositoryId);
      setPullRequests(data);
    } catch (error) {
      console.error('Failed to load pull requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async (pr) => {
    try {
      const result = await api.quickPRAnalysis({
        repo_full_name: `user/repo`, // You'll need to get the actual repo name
        pr_number: pr.number
      });
      
      alert(`PR Analysis Complete!\nRisk Level: ${result.risk_level}\nSummary: ${result.summary}`);
    } catch (error) {
      console.error('Failed to analyze PR:', error);
      alert('Failed to analyze PR');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (pullRequests.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No pull requests found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pullRequests.map((pr) => (
        <PRCard
          key={pr.id}
          pullRequest={pr}
          onAnalyze={handleAnalyze}
        />
      ))}
    </div>
  );
}