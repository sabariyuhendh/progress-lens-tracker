const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://data-science-tracker.onrender.com/api');

class ApiService {
  private token: string | null = null;
  private userCache: any = null;
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor() {
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    // Try localStorage first (persistent across browser sessions)
    this.token = localStorage.getItem('auth_token');
    
    // If no token in localStorage, try sessionStorage (persistent across tabs)
    if (!this.token) {
      this.token = sessionStorage.getItem('auth_token');
    }

    // Load cached user data
    const cachedUser = localStorage.getItem('cached_user');
    const cacheTime = localStorage.getItem('user_cache_time');
    
    if (cachedUser && cacheTime) {
      const cacheTimestamp = parseInt(cacheTime);
      const now = Date.now();
      
      if (now - cacheTimestamp < this.CACHE_DURATION) {
        this.userCache = JSON.parse(cachedUser);
        this.cacheExpiry = cacheTimestamp + this.CACHE_DURATION;
      } else {
        // Cache expired, clear it
        this.clearCache();
      }
    }
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

  setToken(token: string | null, persistent: boolean = true) {
    this.token = token;
    if (token) {
      if (persistent) {
        // Store in localStorage for persistence across browser sessions
        localStorage.setItem('auth_token', token);
        // Also store in sessionStorage as backup
        sessionStorage.setItem('auth_token', token);
      } else {
        // Store only in sessionStorage for session-only persistence
        sessionStorage.setItem('auth_token', token);
        localStorage.removeItem('auth_token');
      }
    } else {
      // Clear from both storage locations
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      this.clearCache();
    }
  }

  private clearCache() {
    this.userCache = null;
    this.cacheExpiry = 0;
    localStorage.removeItem('cached_user');
    localStorage.removeItem('user_cache_time');
  }

  private setUserCache(user: any) {
    this.userCache = user;
    this.cacheExpiry = Date.now() + this.CACHE_DURATION;
    localStorage.setItem('cached_user', JSON.stringify(user));
    localStorage.setItem('user_cache_time', Date.now().toString());
  }

  private isCacheValid(): boolean {
    return this.userCache && Date.now() < this.cacheExpiry;
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

  async getCurrentUser(useCache: boolean = true) {
    // Return cached user if available and valid
    if (useCache && this.isCacheValid()) {
      return { user: this.userCache };
    }

    try {
      const response = await this.request<{ user: { id: number; username: string; name: string; role: string } }>('/auth/me');
      
      // Cache the user data
      if (response.user) {
        this.setUserCache(response.user);
      }
      
      return response;
    } catch (error) {
      // If API call fails but we have cached data, return cached data
      if (this.userCache) {
        console.warn('API call failed, returning cached user data');
        return { user: this.userCache };
      }
      throw error;
    }
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
