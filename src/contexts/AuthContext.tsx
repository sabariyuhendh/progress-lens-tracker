import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, Student } from '@/types';
import { apiService } from '@/services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          apiService.setToken(token);
          const response = await apiService.getCurrentUser();
          setUser({
            id: response.user.id.toString(),
            name: response.user.name,
            username: response.user.username,
            password: '', // Not needed for frontend
            role: response.user.role as 'student' | 'admin',
            completedVideos: [], // Will be loaded separately
            lastUpdated: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        apiService.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      apiService.setToken(response.token);
      setUser({
        id: response.user.id.toString(),
        name: response.user.name,
        username: response.user.username,
        password: '',
        role: response.user.role as 'student' | 'admin',
        completedVideos: [],
        lastUpdated: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    apiService.setToken(null);
  };

  const signup = async (name: string, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters long' };
      }

      const response = await apiService.register(name, username, password);
      apiService.setToken(response.token);
      setUser({
        id: response.user.id.toString(),
        name: response.user.name,
        username: response.user.username,
        password: '',
        role: response.user.role as 'student' | 'admin',
        completedVideos: [],
        lastUpdated: new Date().toISOString(),
      });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin, signup }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
