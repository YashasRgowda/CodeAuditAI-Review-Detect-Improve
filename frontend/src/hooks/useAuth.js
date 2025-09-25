// File: src/hooks/useAuth.js
import { useAuth as useAuthContext } from '@/context/AuthContext';

export function useAuth() {
  return useAuthContext();
}