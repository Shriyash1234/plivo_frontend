'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { apiClient } from '../services/api-client';

const STORAGE_KEY = 'statuspage_auth';

const AuthContext = createContext({
  user: null,
  organization: null,
  token: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  refreshProfile: async () => {},
});

const restoreState = () => {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to restore auth state', error);
    return null;
  }
};

export function AuthProvider({ children }) {
  const [state, setState] = useState(() => ({
    user: null,
    organization: null,
    token: null,
    loading: true,
  }));

  const persist = (value) => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Failed to persist auth state', error);
    }
  };

  const clear = () => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear auth state', error);
    }
  };

  useEffect(() => {
    const restored = restoreState();
    if (restored?.token) {
      setState({
        ...restored,
        loading: false,
      });
      apiClient.setToken(restored.token);
    } else {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    const nextState = {
      token: response.token,
      user: response.user,
      organization: response.organization,
      loading: false,
    };
    setState(nextState);
    persist(nextState);
    apiClient.setToken(response.token);
    toast.success(`Welcome back, ${response.user.name}`);
    return response;
  };

  const register = async (payload) => {
    const response = await apiClient.post('/auth/register', payload);
    const nextState = {
      token: response.token,
      user: response.user,
      organization: response.organization,
      loading: false,
    };
    setState(nextState);
    persist(nextState);
    apiClient.setToken(response.token);
    toast.success(
      response.organization?.name
        ? `Welcome to ${response.organization.name}`
        : 'Welcome aboard',
    );
    return response;
  };

  const logout = () => {
    apiClient.setToken(null);
    setState((prev) => ({
      ...prev,
      user: null,
      organization: null,
      token: null,
    }));
    clear();
  };

  const refreshProfile = async () => {
    try {
      const response = await apiClient.get('/auth/me');
      setState((prev) => {
        const nextState = {
          ...prev,
          user: response.user,
          organization: response.organization,
        };
        persist(nextState);
        return nextState;
      });
      return response;
    } catch (error) {
      console.error(error);
      toast.error('Session expired. Please log in again.');
      logout();
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      ...state,
      login,
      register,
      logout,
      refreshProfile,
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
