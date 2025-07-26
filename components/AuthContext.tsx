import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';

interface AuthContextType {
  token: string | null;
  user: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load token and user from storage on mount
    (async () => {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(storedUser);
      setLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await apiService.login(email, password);
      if (res.success && res.token) {
        setToken(res.token);
        setUser(email);
        await AsyncStorage.setItem('token', res.token);
        await AsyncStorage.setItem('user', email);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const res = await apiService.register(email, password);
      return res.success;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    AsyncStorage.removeItem('token');
    AsyncStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}; 