// File: src/components/repository/AddRepositoryForm.js
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { api } from '@/lib/api';

export default function AddRepositoryForm() {
  const [repoName, setRepoName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) return;

    setLoading(true);
    setError('');

    try {
      await api.addRepository(repoName);
      router.push('/repositories');
    } catch (error) {
      setError('Failed to add repository. Please check the repository name.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Add GitHub Repository</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Repository Name"
          placeholder="username/repository-name"
          value={repoName}
          onChange={(e) => setRepoName(e.target.value)}
          required
        />
        
        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}
        
        <div className="flex space-x-3">
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Repository'}
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={() => router.push('/repositories')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}