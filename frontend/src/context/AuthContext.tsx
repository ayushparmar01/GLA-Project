import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { SafeUser } from '../types';
import { loginApi, registerApi, logoutApi, getMeApi, updateProfileApi, RegisterPayload } from '../services/api';

interface AuthContextType {
  user: SafeUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<SafeUser>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'cb_auth_token';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Restore authenticated session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const res = await getMeApi(token);
        if (res.success && res.data?.user) {
          setUser(res.data.user);
        } else {
          // Token expired or invalid session
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginApi(email, password);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.token) {
        setToken(res.data.token);
        localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
      }
      return { success: true };
    }
    return {
      success: false,
      error: res.error?.message || 'Login failed. Please check your credentials.',
    };
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await registerApi(payload);
    if (res.success && res.data?.user) {
      setUser(res.data.user);
      if (res.data.token) {
        setToken(res.data.token);
        localStorage.setItem(TOKEN_STORAGE_KEY, res.data.token);
      }
      return { success: true };
    }
    return {
      success: false,
      error: res.error?.message || 'Registration failed. Please check the provided information.',
    };
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
    setToken(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }, []);

  const updateProfile = useCallback(
    async (updates: Partial<SafeUser>) => {
      const res = await updateProfileApi(updates, token);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
        return { success: true };
      }
      return {
        success: false,
        error: res.error?.message || 'Failed to update profile.',
      };
    },
    [token]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
