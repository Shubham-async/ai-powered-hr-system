import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { authApi } from '@/api/authApi';
import { setUser, setLoading, logout } from '@/store/authSlice';

export const useInitializeAuth = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch(setLoading(false));
        return;
      }

      dispatch(setLoading(true));
      try {
        const { user } = await authApi.validateToken();
        dispatch(setUser(user));
      } catch (error) {
        console.error('Auth initialization failed:', error);
        dispatch(logout());
      } finally {
        dispatch(setLoading(false));
      }
    };

    initializeAuth();
  }, [dispatch]);
};
