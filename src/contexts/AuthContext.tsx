import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, Student } from '@/types';
import { getStudent, getCurrentUser, setCurrentUser, initializeStorage, checkUsernameExists, addStudent } from '@/utils/storage';
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

  const signup = (name: string, username: string, password: string): { success: boolean; error?: string } => {
    // Validate username doesn't exist
    if (checkUsernameExists(username)) {
      return { success: false, error: 'Username already exists' };
    }

    // Validate password strength
    if (password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long' };
    }

    // Create new student
    const newStudent: Student = {
      name: name.trim(),
      username: username.trim(),
      password: hashPassword(password),
      role: 'student',
      completedVideos: [],
      lastUpdated: new Date().toISOString(),
    };

    // Add student to storage
    addStudent(newStudent);

    // Auto-login the new user
    setUser(newStudent);
    setCurrentUser(newStudent);

    return { success: true };
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
