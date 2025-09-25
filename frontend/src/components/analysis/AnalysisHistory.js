// File: src/components/analysis/AnalysisHistory.js
'use client';
import { useState, useEffect } from 'react';
import AnalysisCard from './AnalysisCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

export default function AnalysisHistory({ repositoryId = null, limit = 10 }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyses();
  }, [repositoryId]);

  const loadAnalyses = async () => {
    try {
      const data = await api.getAnalysisHistory(repositoryId);
      setAnalyses(data.slice(0, limit));
    } catch (error) {
      console.error('Failed to load analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (analyses.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No analyses found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <AnalysisCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  );
}