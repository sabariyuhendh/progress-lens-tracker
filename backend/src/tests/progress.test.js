import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import { query } from '../database/connection.js';

// Mock the database connection for testing
jest.mock('../database/connection.js', () => ({
  query: jest.fn(),
  testConnection: jest.fn(() => Promise.resolve(true)),
  cleanupExpiredSessions: jest.fn(() => Promise.resolve())
}));

describe('Progress API Tests', () => {
  let mockUser;
  let mockSession;

  beforeEach(() => {
    mockUser = {
      id: 1,
      username: 'testuser',
      name: 'Test User',
      role: 'student'
    };

    mockSession = {
      sessionToken: 'test-session-token',
      user_id: 1,
      expires_at: new Date(Date.now() + 3600000) // 1 hour from now
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('POST /api/progress/:username', () => {
    it('should update progress for a single video', async () => {
      const progressData = {
        video_id: 1,
        completed: true
      };

      // Mock database responses
      query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT id FROM users WHERE username')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        if (sql.includes('SELECT id FROM videos WHERE id = ANY')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        if (sql.includes('INSERT INTO progress')) {
          return Promise.resolve({ 
            rows: [{ video_id: 1, completed: true, updated_at: new Date() }] 
          });
        }
        if (sql.includes('INSERT INTO progress_audit')) {
          return Promise.resolve({ rows: [] });
        }
        if (sql.includes('SELECT v.folder')) {
          return Promise.resolve({ 
            rows: [{ folder: 'Math', total_videos: 5, completed_videos: 1, completion_percentage: 20 }] 
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .post('/api/progress/testuser')
        .set('Cookie', 'session=test-session-token')
        .send(progressData)
        .expect(200);

      expect(response.body.message).toBe('Progress updated successfully');
      expect(response.body.updatedProgress).toHaveLength(1);
      expect(response.body.updatedProgress[0].completed).toBe(true);
    });

    it('should handle bulk progress updates', async () => {
      const bulkProgressData = {
        updates: [
          { video_id: 1, completed: true },
          { video_id: 2, completed: false },
          { video_id: 3, completed: true }
        ]
      };

      // Mock database responses
      query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT id FROM users WHERE username')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        if (sql.includes('SELECT id FROM videos WHERE id = ANY')) {
          return Promise.resolve({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });
        }
        if (sql.includes('INSERT INTO progress')) {
          return Promise.resolve({ 
            rows: [{ video_id: params[1], completed: params[2], updated_at: new Date() }] 
          });
        }
        if (sql.includes('INSERT INTO progress_audit')) {
          return Promise.resolve({ rows: [] });
        }
        if (sql.includes('SELECT v.folder')) {
          return Promise.resolve({ 
            rows: [{ folder: 'Math', total_videos: 5, completed_videos: 2, completion_percentage: 40 }] 
          });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .post('/api/progress/testuser')
        .set('Cookie', 'session=test-session-token')
        .send(bulkProgressData)
        .expect(200);

      expect(response.body.message).toBe('Progress updated successfully');
      expect(response.body.updatedProgress).toHaveLength(3);
    });

    it('should return 404 for non-existent user', async () => {
      query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT id FROM users WHERE username')) {
          return Promise.resolve({ rows: [] });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .post('/api/progress/nonexistent')
        .set('Cookie', 'session=test-session-token')
        .send({ video_id: 1, completed: true })
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 for invalid video ID', async () => {
      query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT id FROM users WHERE username')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        if (sql.includes('SELECT id FROM videos WHERE id = ANY')) {
          return Promise.resolve({ rows: [] }); // No videos found
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .post('/api/progress/testuser')
        .set('Cookie', 'session=test-session-token')
        .send({ video_id: 999, completed: true })
        .expect(400);

      expect(response.body.error).toBe('One or more video IDs are invalid');
    });
  });

  describe('GET /api/progress/:username', () => {
    it('should return user progress with summary', async () => {
      const mockVideos = [
        { id: 1, title: 'Video 1', folder: 'Math', position: 1 },
        { id: 2, title: 'Video 2', folder: 'Math', position: 2 },
        { id: 3, title: 'Video 3', folder: 'Science', position: 1 }
      ];

      const mockProgress = [
        { video_id: 1, completed: true, updated_at: new Date() },
        { video_id: 2, completed: false, updated_at: new Date() }
      ];

      query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT id FROM users WHERE username')) {
          return Promise.resolve({ rows: [{ id: 1 }] });
        }
        if (sql.includes('SELECT id, title, folder, position FROM videos')) {
          return Promise.resolve({ rows: mockVideos });
        }
        if (sql.includes('SELECT video_id, completed, updated_at FROM progress')) {
          return Promise.resolve({ rows: mockProgress });
        }
        return Promise.resolve({ rows: [] });
      });

      const response = await request(app)
        .get('/api/progress/testuser')
        .set('Cookie', 'session=test-session-token')
        .expect(200);

      expect(response.body.progress).toBeDefined();
      expect(response.body.progressSummary).toBeDefined();
      expect(response.body.progressSummary.Math.total).toBe(2);
      expect(response.body.progressSummary.Math.completed).toBe(1);
      expect(response.body.progressSummary.Math.percentage).toBe(50);
    });
  });
});
