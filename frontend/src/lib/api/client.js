// client.js — Base API client with auth token injection
import { getSession } from 'next-auth/react';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch(endpoint, options = {}) {
  const session = await getSession();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && { Authorization: `token ${session.accessToken}` }),
      ...options.headers,
    },
    ...options,
  };
  const res = await fetch(`${BASE_URL}${endpoint}`, config);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function apiStream(endpoint, options = {}) {
  const session = await getSession();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(session?.accessToken && { Authorization: `token ${session.accessToken}` }),
      ...options.headers,
    },
    ...options,
  };
  return fetch(`${BASE_URL}${endpoint}`, config);
}

export { BASE_URL };
