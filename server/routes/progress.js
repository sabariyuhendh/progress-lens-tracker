const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get user's progress
router.get('/me', verifyToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT v.id, v.folder, v.title, up.completed_at 
       FROM videos v 
       LEFT JOIN user_progress up ON v.id = up.video_id AND up.user_id = $1 
       ORDER BY v.folder, v.id`,
      [req.user.userId]
    );

    const progress = result.rows.map(row => ({
      id: row.id,
      folder: row.folder,
      title: row.title,
      completed: !!row.completed_at,
      completedAt: row.completed_at
    }));

    res.json(progress);
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle video completion
router.post('/toggle/:videoId', verifyToken, async (req, res) => {
  try {
    const { videoId } = req.params;
    const userId = req.user.userId;

    // Check if video exists
    const videoResult = await pool.query('SELECT id FROM videos WHERE id = $1', [videoId]);
    if (videoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if already completed
    const progressResult = await pool.query(
      'SELECT id FROM user_progress WHERE user_id = $1 AND video_id = $2',
      [userId, videoId]
    );

    if (progressResult.rows.length > 0) {
      // Remove completion
      await pool.query(
        'DELETE FROM user_progress WHERE user_id = $1 AND video_id = $2',
        [userId, videoId]
      );
      res.json({ completed: false });
    } else {
      // Add completion
      await pool.query(
        'INSERT INTO user_progress (user_id, video_id) VALUES ($1, $2)',
        [userId, videoId]
      );
      res.json({ completed: true });
    }
  } catch (error) {
    console.error('Toggle progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset user progress (admin only)
router.delete('/user/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    // Check if user exists
    const userResult = await pool.query('SELECT username FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all progress for user
    const result = await pool.query(
      'DELETE FROM user_progress WHERE user_id = $1 RETURNING video_id',
      [userId]
    );

    res.json({ 
      success: true, 
      message: `Progress reset for user. ${result.rows.length} completed videos were removed.` 
    });
  } catch (error) {
    console.error('Reset progress error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
