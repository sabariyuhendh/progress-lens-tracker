export interface Video {
  id: string;
  folder: string;
  title: string;
}

export interface Student {
  name: string;
  username: string;
  password: string;
  role: 'student' | 'admin';
  completedVideos: string[];
  lastUpdated: string;
}

export interface AuthContextType {
  user: Student | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
}

export interface FolderProgress {
  folder: string;
  total: number;
  completed: number;
  percentage: number;
}
