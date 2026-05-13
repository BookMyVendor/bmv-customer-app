import { useAuth as useAuthContext } from '@/context/AuthContext';

export { useAuth as useAuthContext };

export function useAuth() {
  return useAuthContext();
}
