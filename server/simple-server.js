const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Middleware
app.use(cors({
  origin: [
    'http://localhost:8080',
    'http://localhost:8081',
    'https://progress-lens-tracker.vercel.app',
    'https://data-science-tracker.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// Test database connection
app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'OK', 
      database: 'Connected',
      timestamp: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// Get all videos
app.get('/api/videos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM videos ORDER BY folder, title');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// Get all folders
app.get('/api/folders', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT folder FROM videos ORDER BY folder');
    const folders = result.rows.map(row => row.folder);
    res.json(folders);
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// Get user progress
app.get('/api/progress/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const result = await pool.query(
      'SELECT video_id FROM user_progress WHERE user_id = (SELECT id FROM users WHERE username = $1)',
      [username]
    );
    const completedVideos = result.rows.map(row => row.video_id);
    res.json({ completedVideos });
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Update user progress
app.post('/api/progress/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { videoId, completed } = req.body;

    // Get user ID
    const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    const userId = userResult.rows[0].id;

    if (completed) {
      // Add progress
      await pool.query(
        'INSERT INTO user_progress (user_id, video_id) VALUES ($1, $2) ON CONFLICT (user_id, video_id) DO NOTHING',
        [userId, videoId]
      );
    } else {
      // Remove progress
      await pool.query(
        'DELETE FROM user_progress WHERE user_id = $1 AND video_id = $2',
        [userId, videoId]
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get all users (for admin)
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id, u.username, u.name, u.role, u.created_at,
             COUNT(up.video_id) as completed_videos
      FROM users u
      LEFT JOIN user_progress up ON u.id = up.user_id
      GROUP BY u.id, u.username, u.name, u.role, u.created_at
      ORDER BY u.created_at DESC
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Create user
app.post('/api/users', async (req, res) => {
  try {
    const { name, username, password, role = 'student' } = req.body;
    
    // Check if username exists
    const existingUser = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Create user (no password hashing for simplicity)
    const result = await pool.query(
      'INSERT INTO users (name, username, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, name, role',
      [name, username, password, role]
    );

    res.status(201).json({ user: result.rows[0] });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Delete user
app.delete('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Delete user progress first
    await pool.query(
      'DELETE FROM user_progress WHERE user_id = (SELECT id FROM users WHERE username = $1)',
      [username]
    );
    
    // Delete user
    const result = await pool.query('DELETE FROM users WHERE username = $1 RETURNING username', [username]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Simple login (no JWT, just check credentials)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const result = await pool.query(
      'SELECT id, username, name, role FROM users WHERE username = $1 AND password_hash = $2',
      [username, password]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    
    // Get completed videos
    const progressResult = await pool.query(
      'SELECT video_id FROM user_progress WHERE user_id = $1',
      [user.id]
    );
    const completedVideos = progressResult.rows.map(row => row.video_id);

    res.json({ 
      user: { 
        ...user, 
        completedVideos 
      } 
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Simple server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});
