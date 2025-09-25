// File: src/components/repository/RepositoryList.js
'use client';
import { useState, useEffect } from 'react';
import RepositoryCard from './RepositoryCard';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { api } from '@/lib/api';

export default function RepositoryList() {
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRepositories();
  }, []);

  const loadRepositories = async () => {
    try {
      const data = await api.getUserRepos();
      setRepositories(data);
    } catch (error) {
      console.error('Failed to load repositories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this repository?')) {
      try {
        await api.deleteRepository(id);
        setRepositories(repositories.filter(repo => repo.id !== id));
      } catch (error) {
        console.error('Failed to delete repository:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No repositories added yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {repositories.map((repo) => (
        <RepositoryCard
          key={repo.id}
          repository={repo}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}