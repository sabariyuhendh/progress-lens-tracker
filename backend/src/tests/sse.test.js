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

describe('SSE (Server-Sent Events) Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock successful session lookup
    query.mockImplementation((sql, params) => {
      if (sql.includes('SELECT s.*, u.id, u.username, u.name, u.role FROM sessions')) {
        return Promise.resolve({
          rows: [{
            id: 1,
            username: 'testuser',
            name: 'Test User',
            role: 'student',
            session_token: 'test-session-token'
          }]
        });
      }
      if (sql.includes('UPDATE sessions SET last_accessed_at')) {
        return Promise.resolve({ rows: [] });
      }
      return Promise.resolve({ rows: [] });
    });
  });

  describe('GET /api/sse/progress', () => {
    it('should establish SSE connection for authenticated user', (done) => {
      const response = request(app)
        .get('/api/sse/progress')
        .set('Cookie', 'session=test-session-token')
        .expect(200)
        .expect('Content-Type', 'text/event-stream');

      let dataReceived = false;

      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('data: {"type":"connection"')) {
          dataReceived = true;
          response.end();
          done();
        }
      });

      response.on('end', () => {
        if (!dataReceived) {
          done(new Error('No connection message received'));
        }
      });

      response.on('error', (error) => {
        done(error);
      });
    });

    it('should send heartbeat messages', (done) => {
      const response = request(app)
        .get('/api/sse/progress')
        .set('Cookie', 'session=test-session-token')
        .expect(200)
        .expect('Content-Type', 'text/event-stream');

      let heartbeatReceived = false;
      let connectionReceived = false;

      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('data: {"type":"connection"')) {
          connectionReceived = true;
        }
        if (data.includes('data: {"type":"heartbeat"')) {
          heartbeatReceived = true;
          response.end();
          done();
        }
      });

      // Set a timeout to fail the test if no heartbeat is received
      setTimeout(() => {
        if (!heartbeatReceived) {
          response.end();
          done(new Error('No heartbeat received within timeout'));
        }
      }, 35000); // 35 seconds (heartbeat is sent every 30 seconds)

      response.on('error', (error) => {
        done(error);
      });
    });

    it('should reject unauthenticated requests', async () => {
      await request(app)
        .get('/api/sse/progress')
        .expect(401);
    });

    it('should handle client disconnect gracefully', (done) => {
      const response = request(app)
        .get('/api/sse/progress')
        .set('Cookie', 'session=test-session-token')
        .expect(200)
        .expect('Content-Type', 'text/event-stream');

      let connectionReceived = false;

      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('data: {"type":"connection"')) {
          connectionReceived = true;
          // Simulate client disconnect
          response.destroy();
        }
      });

      response.on('close', () => {
        if (connectionReceived) {
          done(); // Test passes if connection was established and then closed
        } else {
          done(new Error('Connection was not established before close'));
        }
      });

      response.on('error', (error) => {
        // Ignore connection reset errors as they're expected when we destroy the connection
        if (error.code !== 'ECONNRESET') {
          done(error);
        }
      });
    });
  });

  describe('SSE Broadcasting', () => {
    it('should broadcast progress updates to connected clients', (done) => {
      // First, establish an SSE connection
      const response = request(app)
        .get('/api/sse/progress')
        .set('Cookie', 'session=test-session-token')
        .expect(200)
        .expect('Content-Type', 'text/event-stream');

      let connectionReceived = false;
      let progressUpdateReceived = false;

      response.on('data', (chunk) => {
        const data = chunk.toString();
        if (data.includes('data: {"type":"connection"')) {
          connectionReceived = true;
          
          // Simulate a progress update broadcast
          setTimeout(() => {
            if (app.locals.sseClients && app.locals.sseClients.length > 0) {
              const eventData = {
                type: 'progress_update',
                user_id: 1,
                username: 'testuser',
                video_id: 1,
                completed: true,
                updated_at: new Date().toISOString()
              };
              
              app.locals.sseClients.forEach(client => {
                try {
                  client.write(`data: ${JSON.stringify(eventData)}\n\n`);
                } catch (error) {
                  // Ignore write errors
                }
              });
            }
          }, 100);
        }
        
        if (data.includes('data: {"type":"progress_update"')) {
          progressUpdateReceived = true;
          response.end();
          done();
        }
      });

      response.on('end', () => {
        if (connectionReceived && progressUpdateReceived) {
          done();
        } else {
          done(new Error('Expected events not received'));
        }
      });

      response.on('error', (error) => {
        done(error);
      });
    });
  });
});
