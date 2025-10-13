const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001/api' : 'https://data-science-tracker.onrender.com/api');

class SimpleApi {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    console.log(`📡 API Response: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Network error' }));
      console.error(`❌ API Error:`, error);
      throw new Error(error.error || 'Request failed');
    }

    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
  }

  // Health check
  async healthCheck() {
    return this.request<{ status: string; database: string; timestamp: string }>('/health');
  }

  // Videos
  async getVideos() {
    return this.request<Array<{ id: string; folder: string; title: string }>>('/videos');
  }

  async getFolders() {
    return this.request<string[]>('/folders');
  }

  // Users
  async getUsers() {
    return this.request<Array<{ id: number; username: string; name: string; role: string; completed_videos: number }>>('/users');
  }

  async createUser(name: string, username: string, password: string, role: string = 'student') {
    return this.request<{ user: { id: number; username: string; name: string; role: string } }>('/users', {
      method: 'POST',
      body: JSON.stringify({ name, username, password, role }),
    });
  }

  async deleteUser(username: string) {
    return this.request<{ success: boolean; message: string }>(`/users/${username}`, {
      method: 'DELETE',
    });
  }

  // Progress
  async getProgress(username: string) {
    return this.request<{ completedVideos: string[] }>(`/progress/${username}`);
  }

  async updateProgress(username: string, videoId: string, completed: boolean) {
    return this.request<{ success: boolean }>(`/progress/${username}`, {
      method: 'POST',
      body: JSON.stringify({ videoId, completed }),
    });
  }

  // Simple login (no JWT)
  async login(username: string, password: string) {
    return this.request<{ user: { id: number; username: string; name: string; role: string; completedVideos: string[] } }>('/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }
}

export const simpleApi = new SimpleApi();
