import { Student, Video } from '@/types';
import { initialStudents, initialVideos } from './initialData';

const STORAGE_KEYS = {
  STUDENTS: 'videoTracker_students',
  VIDEOS: 'videoTracker_videos',
  CURRENT_USER: 'videoTracker_currentUser',
};

export const initializeStorage = () => {
  if (!localStorage.getItem(STORAGE_KEYS.STUDENTS)) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  }
  if (!localStorage.getItem(STORAGE_KEYS.VIDEOS)) {
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(initialVideos));
  }
};

export const getStudents = (): Student[] => {
  const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
  return data ? JSON.parse(data) : [];
};

export const getStudent = (username: string): Student | null => {
  const students = getStudents();
  return students.find(s => s.username === username) || null;
};

export const updateStudent = (username: string, updates: Partial<Student>) => {
  const students = getStudents();
  const index = students.findIndex(s => s.username === username);
  if (index !== -1) {
    students[index] = { ...students[index], ...updates, lastUpdated: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    return students[index];
  }
  return null;
};

export const addStudent = (student: Student) => {
  const students = getStudents();
  students.push(student);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const deleteStudent = (username: string) => {
  const students = getStudents().filter(s => s.username !== username);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getVideos = (): Video[] => {
  const data = localStorage.getItem(STORAGE_KEYS.VIDEOS);
  return data ? JSON.parse(data) : [];
};

export const addVideos = (videos: Video[]) => {
  const existingVideos = getVideos();
  const allVideos = [...existingVideos, ...videos];
  localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(allVideos));
};

export const getCurrentUser = (): Student | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: Student | null) => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

export const checkUsernameExists = (username: string): boolean => {
  const students = getStudents();
  return students.some(s => s.username === username);
};

// Video management functions
export const addVideo = (video: Video) => {
  const videos = getVideos();
  videos.push(video);
  localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
};

export const updateVideo = (id: string, updates: Partial<Video>) => {
  const videos = getVideos();
  const index = videos.findIndex(v => v.id === id);
  if (index !== -1) {
    videos[index] = { ...videos[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
    return videos[index];
  }
  return null;
};

export const deleteVideo = (id: string) => {
  const videos = getVideos().filter(v => v.id !== id);
  localStorage.setItem(STORAGE_KEYS.VIDEOS, JSON.stringify(videos));
  
  // Remove from all students' completed videos
  const students = getStudents();
  students.forEach(student => {
    if (student.completedVideos.includes(id)) {
      const updatedCompletedVideos = student.completedVideos.filter(videoId => videoId !== id);
      updateStudent(student.username, { completedVideos: updatedCompletedVideos });
    }
  });
};

export const getFolders = (): string[] => {
  const videos = getVideos();
  const folders = [...new Set(videos.map(v => v.folder))];
  return folders.sort();
};

export const getVideosByFolder = (folder: string): Video[] => {
  const videos = getVideos();
  return videos.filter(v => v.folder === folder);
};

// Student management functions
export const getAllStudents = (): Student[] => {
  return getStudents();
};

export const deleteStudentAccount = (username: string) => {
  const students = getStudents().filter(s => s.username !== username);
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  
  // If the deleted student was the current user, clear current user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.username === username) {
    setCurrentUser(null);
  }
};

export const resetStudentProgress = (username: string) => {
  return updateStudent(username, { 
    completedVideos: [], 
    lastUpdated: new Date().toISOString() 
  });
};