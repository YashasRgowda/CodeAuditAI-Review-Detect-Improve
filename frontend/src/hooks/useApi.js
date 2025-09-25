// File: src/hooks/useApi.js
'use client';
import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export function useApi(endpoint, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await api.get(endpoint);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (endpoint) {
      fetchData();
    }
  }, [endpoint, ...dependencies]);

  return { data, loading, error, refetch: () => fetchData() };
}