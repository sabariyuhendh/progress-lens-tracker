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

    // Set initial state
    setUser(simpleAuth.getUser());
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
    isLoggedIn: simpleAuth.isLoggedIn(),
    isAdmin: simpleAuth.isAdmin(),
    completedVideos: simpleAuth.getCompletedVideos(),
    login,
    signup,
    logout,
    updateCompletedVideos
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
