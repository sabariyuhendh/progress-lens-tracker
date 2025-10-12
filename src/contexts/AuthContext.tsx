import React, { createContext, useContext, useState, useEffect } from 'react';
import { Student, AuthContextType } from '@/types';
import { apiService } from '@/services/api';
import { sessionManager, SessionData } from '@/utils/sessionManager';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to session changes
    const handleSessionChange = (session: SessionData | null) => {
      if (session) {
        setUser({
          id: session.userId,
          name: session.name,
          username: session.username,
          password: '',
          role: session.role,
          completedVideos: session.completedVideos,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    // Set initial state
    const initialSession = sessionManager.getSession();
    if (initialSession) {
      setUser({
        id: initialSession.userId,
        name: initialSession.name,
        username: initialSession.username,
        password: '',
        role: initialSession.role,
        completedVideos: initialSession.completedVideos,
        lastUpdated: new Date().toISOString(),
      });
    }
    setLoading(false);

    // Add session listener
    sessionManager.addListener(handleSessionChange);

    return () => {
      sessionManager.removeListener(handleSessionChange);
    };
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true): Promise<boolean> => {
    try {
      const response = await apiService.login(username, password);
      
      // Set token with persistence preference
      apiService.setToken(response.token, rememberMe);
      
      // Create session
      await sessionManager.createSession({
        id: response.user.id.toString(),
        username: response.user.username,
        name: response.user.name,
        role: response.user.role as 'admin' | 'student',
        completedVideos: response.user.completedVideos || [],
      }, rememberMe);
      
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    sessionManager.clearSession();
    apiService.setToken(null);
  };

  const signup = async (name: string, username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters long' };
      }

      const response = await apiService.register(name, username, password);
      apiService.setToken(response.token);
      
      // Create session
      await sessionManager.createSession({
        id: response.user.id.toString(),
        username: response.user.username,
        name: response.user.name,
        role: response.user.role as 'admin' | 'student',
        completedVideos: response.user.completedVideos || [],
      }, true);
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    signup,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};