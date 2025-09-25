// File: src/components/commits/CommitDiff.js
'use client';
import { useState, useEffect } from 'react';
import Card from '@/components/ui/Card';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

export default function CommitDiff({ repositoryId, commitSha }) {
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (repositoryId && commitSha) {
      loadDiff();
    }
  }, [repositoryId, commitSha]);

  const loadDiff = async () => {
    try {
      const data = await api.getCommitDiff(repositoryId, commitSha);
      setDiff(data);
    } catch (error) {
      console.error('Failed to load diff:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!diff) {
    return <div className="text-gray-600">Failed to load diff</div>;
  }

  return (
    <Card>
      <h3 className="font-medium mb-4">Code Changes</h3>
      
      <div className="space-y-4">
        {diff.files?.map((file, index) => (
          <div key={index} className="border rounded-lg">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm">{file.filename}</span>
                <span className="text-xs text-gray-600">
                  <span className="text-green-600">+{file.additions}</span>
                  <span className="mx-2">|</span>
                  <span className="text-red-600">-{file.deletions}</span>
                </span>
              </div>
            </div>
            
            {file.patch && (
              <pre className="p-4 text-xs font-mono overflow-x-auto bg-white">
                <code>{file.patch}</code>
              </pre>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}