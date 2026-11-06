import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: 'farmer' | 'trader' | 'analyst' | 'admin';
  token: string | null;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: 'farmer' | 'trader' | 'analyst' | 'admin') => void;
  isLoading: boolean;
}

const defaultUser: User = {
  id: 1,
  email: 'farmer@agrimarket.in',
  full_name: 'Rajesh Patel',
  role: 'farmer',
  preferred_state: 'Punjab',
  preferred_mandi: 'Khanna Mandi',
  created_at: new Date().toISOString(),
};

const AuthContext = createContext<AuthContextType>({
  user: defaultUser,
  role: 'farmer',
  token: null,
  login: async () => {},
  logout: () => {},
  switchRole: () => {},
  isLoading: false,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultUser);
  const [role, setRole] = useState<'farmer' | 'trader' | 'analyst' | 'admin'>('farmer');
  const [token, setToken] = useState<string | null>(localStorage.getItem('agrimarket_token'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    // Attempt to fetch profile if token exists
    const initAuth = async () => {
      const storedToken = localStorage.getItem('agrimarket_token');
      if (storedToken) {
        try {
          const profile = await api.getProfile();
          setUser(profile);
          setRole(profile.role);
        } catch (e) {
          console.warn('Using default demo persona:', e);
        }
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password = 'password123') => {
    setIsLoading(true);
    try {
      const res = await api.login({ email, password });
      setToken(res.access_token);
      localStorage.setItem('agrimarket_token', res.access_token);
      setRole(res.role as any);
      setUser({
        id: res.user_id,
        email: email,
        full_name: res.full_name,
        role: res.role as any,
        created_at: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('Falling back to local user context:', e);
      // Auto-assign based on email
      const determinedRole = email.includes('admin')
        ? 'admin'
        : email.includes('trader')
        ? 'trader'
        : email.includes('analyst')
        ? 'analyst'
        : 'farmer';
      setRole(determinedRole);
      setUser({
        ...defaultUser,
        email,
        full_name: email.split('@')[0].toUpperCase(),
        role: determinedRole,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('agrimarket_token');
    setToken(null);
    setUser(null);
    setRole('farmer');
  };

  const switchRole = (newRole: 'farmer' | 'trader' | 'analyst' | 'admin') => {
    setRole(newRole);
    if (user) {
      setUser({
        ...user,
        role: newRole,
        full_name:
          newRole === 'farmer'
            ? 'Rajesh Patel (Farmer)'
            : newRole === 'trader'
            ? 'Vikram Sethi (Trader)'
            : newRole === 'analyst'
            ? 'Dr. Sunita Rao (Analyst)'
            : 'AgriMarket Administrator',
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        login,
        logout,
        switchRole,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
