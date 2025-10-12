import { apiService } from '@/services/api';

export interface SessionData {
  userId: string;
  username: string;
  role: 'admin' | 'student';
  name: string;
  completedVideos: string[];
  loginTime: number;
  lastActivity: number;
  rememberMe: boolean;
  sessionId: string;
  expiresAt: number;
}

export interface SessionConfig {
  maxInactivity: number; // 30 minutes
  maxSessionDuration: number; // 7 days
  refreshThreshold: number; // 1 hour before expiry
  encryptionKey: string;
}

class SessionManager {
  private config: SessionConfig = {
    maxInactivity: 30 * 60 * 1000, // 30 minutes
    maxSessionDuration: 7 * 24 * 60 * 60 * 1000, // 7 days
    refreshThreshold: 60 * 60 * 1000, // 1 hour
    encryptionKey: 'progress-lens-session-key-2024'
  };

  private sessionData: SessionData | null = null;
  private refreshTimer: NodeJS.Timeout | null = null;
  private activityTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(session: SessionData | null) => void> = [];

  constructor() {
    this.initializeSession();
    this.setupActivityTracking();
    this.setupPeriodicValidation();
  }

  // Initialize session from storage
  private async initializeSession(): Promise<void> {
    try {
      const encryptedSession = this.getStoredSession();
      if (encryptedSession) {
        const session = this.decryptSession(encryptedSession);
        if (session && this.isSessionValid(session)) {
          this.sessionData = session;
          this.notifyListeners();
          await this.refreshSessionIfNeeded();
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Session initialization error:', error);
      this.clearSession();
    }
  }

  // Create new session
  public async createSession(
    user: {
      id: string;
      username: string;
      name: string;
      role: 'admin' | 'student';
      completedVideos: string[];
    },
    rememberMe: boolean = true
  ): Promise<SessionData> {
    const now = Date.now();
    const sessionId = this.generateSessionId();
    
    const session: SessionData = {
      userId: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
      completedVideos: user.completedVideos,
      loginTime: now,
      lastActivity: now,
      rememberMe,
      sessionId,
      expiresAt: now + this.config.maxSessionDuration
    };

    this.sessionData = session;
    this.storeSession(session);
    this.setupRefreshTimer();
    this.notifyListeners();

    return session;
  }

  // Get current session
  public getSession(): SessionData | null {
    return this.sessionData;
  }

  // Update session data
  public async updateSession(updates: Partial<SessionData>): Promise<void> {
    if (!this.sessionData) return;

    this.sessionData = { ...this.sessionData, ...updates };
    this.sessionData.lastActivity = Date.now();
    
    this.storeSession(this.sessionData);
    this.notifyListeners();
  }

  // Update completed videos
  public async updateCompletedVideos(completedVideos: string[]): Promise<void> {
    await this.updateSession({ completedVideos });
  }

  // Refresh session with server
  public async refreshSession(): Promise<boolean> {
    if (!this.sessionData) return false;

    try {
      const response = await apiService.getCurrentUser(false);
      if (response.user) {
        await this.updateSession({
          name: response.user.name,
          completedVideos: response.user.completedVideos || []
        });
        return true;
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
    }
    return false;
  }

  // Clear session
  public clearSession(): void {
    this.sessionData = null;
    this.clearStoredSession();
    this.clearTimers();
    this.notifyListeners();
  }

  // Check if session is valid
  private isSessionValid(session: SessionData): boolean {
    const now = Date.now();
    
    // Check if session expired
    if (now > session.expiresAt) {
      return false;
    }

    // Check inactivity timeout
    if (now - session.lastActivity > this.config.maxInactivity) {
      return false;
    }

    return true;
  }

  // Refresh session if needed
  private async refreshSessionIfNeeded(): Promise<void> {
    if (!this.sessionData) return;

    const now = Date.now();
    const timeUntilExpiry = this.sessionData.expiresAt - now;

    if (timeUntilExpiry < this.config.refreshThreshold) {
      await this.refreshSession();
    }
  }

  // Setup refresh timer
  private setupRefreshTimer(): void {
    this.clearRefreshTimer();
    
    this.refreshTimer = setInterval(async () => {
      await this.refreshSessionIfNeeded();
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  // Setup activity tracking
  private setupActivityTracking(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    const updateActivity = () => {
      if (this.sessionData) {
        this.sessionData.lastActivity = Date.now();
        this.storeSession(this.sessionData);
      }
    };

    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });
  }

  // Setup periodic validation
  private setupPeriodicValidation(): void {
    setInterval(() => {
      if (this.sessionData && !this.isSessionValid(this.sessionData)) {
        this.clearSession();
      }
    }, 60000); // Check every minute
  }

  // Session storage methods
  private storeSession(session: SessionData): void {
    try {
      const encrypted = this.encryptSession(session);
      
      if (session.rememberMe) {
        localStorage.setItem('session_data', encrypted);
        localStorage.setItem('session_timestamp', Date.now().toString());
      } else {
        sessionStorage.setItem('session_data', encrypted);
        sessionStorage.setItem('session_timestamp', Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to store session:', error);
    }
  }

  private getStoredSession(): string | null {
    try {
      // Try localStorage first
      let sessionData = localStorage.getItem('session_data');
      let timestamp = localStorage.getItem('session_timestamp');
      
      // Fallback to sessionStorage
      if (!sessionData) {
        sessionData = sessionStorage.getItem('session_data');
        timestamp = sessionStorage.getItem('session_timestamp');
      }

      if (sessionData && timestamp) {
        const sessionAge = Date.now() - parseInt(timestamp);
        if (sessionAge < this.config.maxSessionDuration) {
          return sessionData;
        }
      }
    } catch (error) {
      console.error('Failed to get stored session:', error);
    }
    return null;
  }

  private clearStoredSession(): void {
    localStorage.removeItem('session_data');
    localStorage.removeItem('session_timestamp');
    sessionStorage.removeItem('session_data');
    sessionStorage.removeItem('session_timestamp');
  }

  // Encryption methods (simple base64 encoding for demo - use proper encryption in production)
  private encryptSession(session: SessionData): string {
    try {
      const jsonString = JSON.stringify(session);
      return btoa(unescape(encodeURIComponent(jsonString)));
    } catch (error) {
      console.error('Session encryption failed:', error);
      return '';
    }
  }

  private decryptSession(encrypted: string): SessionData | null {
    try {
      const jsonString = decodeURIComponent(escape(atob(encrypted)));
      return JSON.parse(jsonString);
    } catch (error) {
      console.error('Session decryption failed:', error);
      return null;
    }
  }

  // Utility methods
  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private clearTimers(): void {
    this.clearRefreshTimer();
    this.clearActivityTimer();
  }

  private clearRefreshTimer(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private clearActivityTimer(): void {
    if (this.activityTimer) {
      clearTimeout(this.activityTimer);
      this.activityTimer = null;
    }
  }

  // Event listeners
  public addListener(listener: (session: SessionData | null) => void): void {
    this.listeners.push(listener);
  }

  public removeListener(listener: (session: SessionData | null) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.sessionData));
  }

  // Public utility methods
  public isLoggedIn(): boolean {
    return this.sessionData !== null && this.isSessionValid(this.sessionData);
  }

  public getUserId(): string | null {
    return this.sessionData?.userId || null;
  }

  public getUserRole(): 'admin' | 'student' | null {
    return this.sessionData?.role || null;
  }

  public getCompletedVideos(): string[] {
    return this.sessionData?.completedVideos || [];
  }

  public getTimeUntilExpiry(): number {
    if (!this.sessionData) return 0;
    return Math.max(0, this.sessionData.expiresAt - Date.now());
  }

  public getTimeUntilInactivity(): number {
    if (!this.sessionData) return 0;
    return Math.max(0, this.config.maxInactivity - (Date.now() - this.sessionData.lastActivity));
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
