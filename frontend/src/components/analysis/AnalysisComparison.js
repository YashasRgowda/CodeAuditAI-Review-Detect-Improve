// File: src/components/analysis/AnalysisComparison.js
'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

export default function AnalysisComparison() {
  const [analyses, setAnalyses] = useState([]);
  const [selectedId1, setSelectedId1] = useState('');
  const [selectedId2, setSelectedId2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalyses();
  }, []);

  const loadAnalyses = async () => {
    try {
      const data = await api.getAnalysisHistory();
      setAnalyses(data);
    } catch (error) {
      console.error('Failed to load analyses:', error);
    }
  };

  const handleCompare = async () => {
    if (!selectedId1 || !selectedId2) return;

    setLoading(true);
    try {
      const data = await api.compareAnalyses(selectedId1, selectedId2);
      setComparison(data);
    } catch (error) {
      console.error('Failed to compare analyses:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold mb-4">Compare Analyses</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">First Analysis</label>
            <select 
              value={selectedId1} 
              onChange={(e) => setSelectedId1(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select analysis...</option>
              {analyses.map(analysis => (
                <option key={analysis.id} value={analysis.id}>
                  {analysis.summary.substring(0, 50)}... ({analysis.commit_hash.substring(0, 8)})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Second Analysis</label>
            <select 
              value={selectedId2} 
              onChange={(e) => setSelectedId2(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select analysis...</option>
              {analyses.map(analysis => (
                <option key={analysis.id} value={analysis.id}>
                  {analysis.summary.substring(0, 50)}... ({analysis.commit_hash.substring(0, 8)})
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <Button 
          onClick={handleCompare} 
          disabled={!selectedId1 || !selectedId2 || loading}
        >
          {loading ? 'Comparing...' : 'Compare'}
        </Button>
      </Card>

      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {comparison && (
        <Card>
          <h3 className="text-lg font-bold mb-4">Comparison Results</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {comparison.comparison.maintainability_change > 0 ? '+' : ''}
                {comparison.comparison.maintainability_change}
              </div>
              <div className="text-sm text-gray-600">Maintainability</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {comparison.comparison.security_change > 0 ? '+' : ''}
                {comparison.comparison.security_change}
              </div>
              <div className="text-sm text-gray-600">Security</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {comparison.comparison.performance_change > 0 ? '+' : ''}
                {comparison.comparison.performance_change}
              </div>
              <div className="text-sm text-gray-600">Performance</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                comparison.comparison.improvement_trend === 'positive' ? 'text-green-600' : 'text-red-600'
              }`}>
                {comparison.comparison.improvement_trend === 'positive' ? '↗' : '↘'}
              </div>
              <div className="text-sm text-gray-600">Trend</div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}