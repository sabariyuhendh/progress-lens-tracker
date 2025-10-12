import React, { createContext, useContext } from 'react';
import { useSimpleAuth } from '@/hooks/useSimpleAuth';
import { User } from '@/utils/simpleAuth';

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
  const auth = useSimpleAuth();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
