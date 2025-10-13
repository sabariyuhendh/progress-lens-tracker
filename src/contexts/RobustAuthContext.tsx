import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiService } from '@/services/api';

interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'student';
  completedVideos: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isLoggedIn: boolean;
  isAdmin: boolean;
  completedVideos: string[];
  login: (username: string, password: string, rememberMe?: boolean) => Promise<boolean>;
  signup: (name: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateCompletedVideos: (videoId: string, completed: boolean) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        console.log('🔄 Initializing authentication...');
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          console.log('🔑 Token found, authenticating...');
          apiService.setToken(token);
          const response = await apiService.getCurrentUser();
          if (response.user) {
            console.log('✅ User authenticated:', response.user.username);
            setUser({
              id: response.user.id.toString(),
              username: response.user.username,
              name: response.user.name,
              role: response.user.role as 'admin' | 'student',
              completedVideos: response.user.completedVideos || []
            });
          }
        } else {
          console.log('📭 No token found');
        }
      } catch (error) {
        console.error('❌ Auth initialization failed:', error);
        // Clear invalid tokens
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      apiService.setToken(response.token, rememberMe);
      
      setUser({
        id: response.user.id.toString(),
        username: response.user.username,
        name: response.user.name,
        role: response.user.role as 'admin' | 'student',
        completedVideos: response.user.completedVideos || []
      });
      
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
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
        username: response.user.username,
        name: response.user.name,
        role: response.user.role as 'admin' | 'student',
        completedVideos: response.user.completedVideos || []
      });
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const logout = () => {
    setUser(null);
    apiService.setToken(null);
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
  };

  const updateCompletedVideos = async (videoId: string, completed: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      await apiService.updateUserProgress(videoId, completed);
      
      // Update local state
      const newCompletedVideos = completed
        ? [...user.completedVideos, videoId]
        : user.completedVideos.filter(id => id !== videoId);
      
      setUser({
        ...user,
        completedVideos: newCompletedVideos
      });
      
      return true;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isLoggedIn: user !== null,
    isAdmin: user?.role === 'admin',
    completedVideos: user?.completedVideos || [],
    login,
    signup,
    logout,
    updateCompletedVideos
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
