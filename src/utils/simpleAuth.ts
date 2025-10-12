import { apiService } from '@/services/api';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'student';
  completedVideos: string[];
}

class SimpleAuth {
  private user: User | null = null;
  private listeners: Array<(user: User | null) => void> = [];

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        apiService.setToken(token);
        const response = await apiService.getCurrentUser();
        if (response.user) {
          this.user = {
            id: response.user.id.toString(),
            username: response.user.username,
            name: response.user.name,
            role: response.user.role as 'admin' | 'student',
            completedVideos: response.user.completedVideos || []
          };
          this.notifyListeners();
        }
      }
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuth();
    }
  }

  async login(username: string, password: string, rememberMe: boolean = true): Promise<boolean> {
    try {
      const response = await apiService.login(username, password);
      apiService.setToken(response.token, rememberMe);
      
      this.user = {
        id: response.user.id.toString(),
        username: response.user.username,
        name: response.user.name,
        role: response.user.role as 'admin' | 'student',
        completedVideos: response.user.completedVideos || []
      };
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  async signup(name: string, username: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (password.length < 4) {
        return { success: false, error: 'Password must be at least 4 characters long' };
      }

      const response = await apiService.register(name, username, password);
      apiService.setToken(response.token);
      
      this.user = {
        id: response.user.id.toString(),
        username: response.user.username,
        name: response.user.name,
        role: response.user.role as 'admin' | 'student',
        completedVideos: response.user.completedVideos || []
      };
      
      this.notifyListeners();
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Registration failed' };
    }
  }

  logout() {
    this.user = null;
    apiService.setToken(null);
    this.notifyListeners();
  }

  getUser(): User | null {
    return this.user;
  }

  isLoggedIn(): boolean {
    return this.user !== null;
  }

  isAdmin(): boolean {
    return this.user?.role === 'admin';
  }

  async updateCompletedVideos(videoId: string, completed: boolean): Promise<boolean> {
    if (!this.user) return false;

    try {
      await apiService.updateUserProgress(videoId, completed);
      
      // Update local state
      if (completed) {
        if (!this.user.completedVideos.includes(videoId)) {
          this.user.completedVideos.push(videoId);
        }
      } else {
        this.user.completedVideos = this.user.completedVideos.filter(id => id !== videoId);
      }
      
      this.notifyListeners();
      return true;
    } catch (error) {
      console.error('Failed to update progress:', error);
      return false;
    }
  }

  getCompletedVideos(): string[] {
    return this.user?.completedVideos || [];
  }

  addListener(listener: (user: User | null) => void) {
    this.listeners.push(listener);
  }

  removeListener(listener: (user: User | null) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.user));
  }

  private clearAuth() {
    this.user = null;
    apiService.setToken(null);
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    this.notifyListeners();
  }
}

export const simpleAuth = new SimpleAuth();
