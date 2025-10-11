const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private token: string | null = null;

  constructor() {
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Auth methods
  async register(name: string, username: string, password: string) {
    return this.request<{
      success: boolean;
      token: string;
      user: { id: number; username: string; name: string; role: string };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, username, password }),
    });
  }

  async login(username: string, password: string) {
    return this.request<{
      success: boolean;
      token: string;
      user: { id: number; username: string; name: string; role: string };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getCurrentUser() {
    return this.request<{ user: { id: number; username: string; name: string; role: string } }>('/auth/me');
  }

  // Video methods
  async getVideos() {
    return this.request<Array<{ id: string; folder: string; title: string }>>('/videos');
  }

  async getFolders() {
    return this.request<string[]>('/videos/folders');
  }

  async addVideo(id: string, folder: string, title: string) {
    return this.request<{ id: string; folder: string; title: string }>('/videos', {
      method: 'POST',
      body: JSON.stringify({ id, folder, title }),
    });
  }

  async updateVideo(id: string, folder: string, title: string) {
    return this.request<{ id: string; folder: string; title: string }>(`/videos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ folder, title }),
    });
  }

  async deleteVideo(id: string) {
    return this.request<{ success: boolean; message: string }>(`/videos/${id}`, {
      method: 'DELETE',
    });
  }

  // Progress methods
  async getProgress() {
    return this.request<Array<{
      id: string;
      folder: string;
      title: string;
      completed: boolean;
      completedAt?: string;
    }>>('/progress/me');
  }

  async toggleVideoProgress(videoId: string) {
    return this.request<{ completed: boolean }>(`/progress/toggle/${videoId}`, {
      method: 'POST',
    });
  }

  async resetUserProgress(userId: number) {
    return this.request<{ success: boolean; message: string }>(`/progress/user/${userId}`, {
      method: 'DELETE',
    });
  }

  // User management methods (admin only)
  async getStudents() {
    return this.request<Array<{
      id: number;
      username: string;
      name: string;
      role: string;
      completedVideos: number;
      totalVideos: number;
      progressPercentage: number;
      createdAt: string;
    }>>('/users/students');
  }

  async getStudentDetails(username: string) {
    return this.request<{
      user: { id: number; username: string; name: string; role: string; createdAt: string };
      progress: Array<{
        id: string;
        folder: string;
        title: string;
        completed: boolean;
        completedAt?: string;
      }>;
    }>(`/users/students/${username}`);
  }

  async deleteStudent(userId: number) {
    return this.request<{ success: boolean; message: string }>(`/users/students/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();
