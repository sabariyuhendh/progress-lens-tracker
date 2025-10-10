import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, Student } from '@/types';
import { getStudent, getCurrentUser, setCurrentUser, initializeStorage } from '@/utils/storage';
import { hashPassword } from '@/utils/initialData';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Student | null>(null);

  useEffect(() => {
    initializeStorage();
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    const student = getStudent(username);
    if (student && student.password === hashPassword(password)) {
      setUser(student);
      setCurrentUser(student);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    setCurrentUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
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
