import React, { createContext, useContext, useState, useEffect } from 'react';
import { simpleApi } from '@/utils/simpleApi';

interface User {
  id: number;
  username: string;
  name: string;
  role: 'admin' | 'student';
  completedVideos: string[];
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProgress: (videoId: string, completed: boolean) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('currentUser');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await simpleApi.login(username, password);
      setUser(response.user);
      localStorage.setItem('currentUser', JSON.stringify(response.user));
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const updateProgress = async (videoId: string, completed: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      await simpleApi.updateProgress(user.username, videoId, completed);
      
      // Update local state
      const newCompletedVideos = completed
        ? [...user.completedVideos, videoId]
        : user.completedVideos.filter(id => id !== videoId);
      
      const updatedUser = { ...user, completedVideos: newCompletedVideos };
      setUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      
      return true;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return false;
    }
  };

  const value: UserContextType = {
    user,
    loading,
    login,
    logout,
    updateProgress
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
