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
        // Try to get user from cache first (faster)
        const cachedUser = localStorage.getItem('cached_user');
        const cacheTime = localStorage.getItem('user_cache_time');
        
        if (cachedUser && cacheTime) {
          const cacheTimestamp = parseInt(cacheTime);
          const now = Date.now();
          const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
          
          if (now - cacheTimestamp < CACHE_DURATION) {
            // Use cached user data immediately
            const userData = JSON.parse(cachedUser);
            setUser({
              id: userData.id.toString(),
              name: userData.name,
              username: userData.username,
              password: '',
              role: userData.role as 'student' | 'admin',
              completedVideos: [],
              lastUpdated: new Date().toISOString(),
            });
            setLoading(false);
            
            // Verify with server in background
            try {
              const response = await apiService.getCurrentUser(false); // Skip cache
              if (response.user) {
                setUser({
                  id: response.user.id.toString(),
                  name: response.user.name,
                  username: response.user.username,
                  password: '',
                  role: response.user.role as 'student' | 'admin',
                  completedVideos: [],
                  lastUpdated: new Date().toISOString(),
                });
              }
            } catch (error) {
              console.warn('Background auth verification failed, using cached data');
            }
            return;
          }
        }

        // No valid cache, try to authenticate with server
        const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
        if (token) {
          apiService.setToken(token);
          const response = await apiService.getCurrentUser();
          if (response.user) {
            setUser({
              id: response.user.id.toString(),
              name: response.user.name,
              username: response.user.username,
              password: '',
              role: response.user.role as 'student' | 'admin',
              completedVideos: [],
              lastUpdated: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        apiService.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      
      // Set token with persistence preference
      apiService.setToken(response.token, rememberMe);
      
      // Create user object
      const userData = {
        id: response.user.id.toString(),
        name: response.user.name,
        username: response.user.username,
        password: '',
        role: response.user.role as 'student' | 'admin',
        completedVideos: [],
        lastUpdated: new Date().toISOString(),
      };
      
      setUser(userData);
      
      // Store additional session data
      sessionStorage.setItem('user_session', JSON.stringify({
        loginTime: Date.now(),
        rememberMe,
        lastActivity: Date.now()
      }));
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    apiService.setToken(null);
    
    // Clear all session data
    sessionStorage.removeItem('user_session');
    sessionStorage.removeItem('auth_token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('cached_user');
    localStorage.removeItem('user_cache_time');
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
