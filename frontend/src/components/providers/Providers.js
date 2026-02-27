'use client';
// Providers.js — Client-side wrapper for all global context providers
// Kept separate from layout.js so layout.js stays a Server Component (no re-renders)
import { SessionProvider } from 'next-auth/react';
import { AuthProvider } from '@/context/AuthContext';

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
