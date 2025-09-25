// File: src/components/analysis/QuickAnalysisForm.js
'use client';
import { useState } from 'react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import RiskLevelBadge from './RiskLevelBadge';
import { api } from '@/lib/api';

export default function QuickAnalysisForm() {
  const [repoName, setRepoName] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.quickAnalysis({
        repo_full_name: repoName,
        commit_sha: commitSha || null
      });
      setResult(data);
    } catch (error) {
      setError('Failed to analyze. Please check the repository name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold mb-4">Quick Analysis</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Repository Name"
            placeholder="username/repository-name"
            value={repoName}
            onChange={(e) => setRepoName(e.target.value)}
            required
          />
          
          <Input
            label="Commit SHA (optional)"
            placeholder="Leave empty for latest commit"
            value={commitSha}
            onChange={(e) => setCommitSha(e.target.value)}
          />
          
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          
          <Button type="submit" disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </Button>
        </form>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {result && (
        <Card>
          <h3 className="text-lg font-bold mb-4">Analysis Results</h3>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <RiskLevelBadge riskLevel={result.risk_level} />
              <span className="text-sm text-gray-600">
                {result.change_type.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Summary</h4>
              <p className="text-gray-700">{result.summary}</p>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Files Changed:</span>
                <div className="font-medium">{result.files_changed}</div>
              </div>
              <div>
                <span className="text-gray-600">Lines Added:</span>
                <div className="font-medium text-green-600">+{result.lines_added}</div>
              </div>
              <div>
                <span className="text-gray-600">Lines Removed:</span>
                <div className="font-medium text-red-600">-{result.lines_removed}</div>
              </div>
            </div>
            
            {result.recommendations && result.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Recommendations</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  {result.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="text-xs text-gray-500 pt-2 border-t">
              <div>Commit: {result.commit_hash}</div>
              <div>Author: {result.author}</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}