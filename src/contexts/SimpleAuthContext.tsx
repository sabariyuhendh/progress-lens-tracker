import React, { createContext, useContext, useEffect, useState } from 'react';
import { simpleAuth, User } from '@/utils/simpleAuth';

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
    const handleUserChange = (newUser: User | null) => {
      setUser(newUser);
      setLoading(false);
    };

    // Set initial state immediately
    const initialUser = simpleAuth.getUser();
    setUser(initialUser);
    setLoading(false);

    // Add listener
    simpleAuth.addListener(handleUserChange);

    return () => {
      simpleAuth.removeListener(handleUserChange);
    };
  }, []);

  const login = async (username: string, password: string, rememberMe: boolean = true) => {
    return await simpleAuth.login(username, password, rememberMe);
  };

  const signup = async (name: string, username: string, password: string) => {
    return await simpleAuth.signup(name, username, password);
  };

  const logout = () => {
    simpleAuth.logout();
  };

  const updateCompletedVideos = async (videoId: string, completed: boolean) => {
    return await simpleAuth.updateCompletedVideos(videoId, completed);
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
