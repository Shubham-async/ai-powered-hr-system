import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';

export const useAuth = () => {
  const auth = useSelector((state: RootState) => state.auth);
  
  return {
    user: auth.user,
    token: auth.token,
    isAuthenticated: auth.isAuthenticated,
    loading: auth.loading,
    isHR: auth.user?.role === 'hr' || auth.user?.role === 'admin',
    isAdmin: auth.user?.role === 'admin',
    isCandidate: auth.user?.role === 'candidate',
    isInterviewer: auth.user?.role === 'interviewer',
  };
};
