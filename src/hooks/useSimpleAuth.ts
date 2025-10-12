import { useState, useEffect } from 'react';
import { simpleAuth, User } from '@/utils/simpleAuth';

export const useSimpleAuth = () => {
  const [user, setUser] = useState<User | null>(simpleAuth.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleUserChange = (newUser: User | null) => {
      setUser(newUser);
      setLoading(false);
    };

    simpleAuth.addListener(handleUserChange);
    
    // Set initial loading state
    setLoading(false);

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

  return {
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
};
