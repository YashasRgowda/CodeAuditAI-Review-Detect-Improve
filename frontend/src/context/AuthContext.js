// File: src/context/AuthContext.js - REPLACE ENTIRE FILE
'use client';
import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const { data: session, status } = useSession();
  
  const value = {
    user: session?.user || null,
    accessToken: session?.accessToken || null,
    loading: status === 'loading',
    isAuthenticated: !!session?.user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}