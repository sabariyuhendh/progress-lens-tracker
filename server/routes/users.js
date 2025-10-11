const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get all students (admin only)
router.get('/students', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.name, u.role, u.created_at,
              COUNT(up.video_id) as completed_videos,
              (SELECT COUNT(*) FROM videos) as total_videos
       FROM users u
       LEFT JOIN user_progress up ON u.id = up.user_id
       WHERE u.role = 'student'
       GROUP BY u.id, u.username, u.name, u.role, u.created_at
       ORDER BY u.created_at DESC`
    );

    const students = result.rows.map(row => ({
      id: row.id,
      username: row.username,
      name: row.name,
      role: row.role,
      completedVideos: parseInt(row.completed_videos),
      totalVideos: parseInt(row.total_videos),
      progressPercentage: row.total_videos > 0 ? 
        Math.round((row.completed_videos / row.total_videos) * 100) : 0,
      createdAt: row.created_at
    }));

    res.json(students);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get student details (admin only)
router.get('/students/:username', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { username } = req.params;

    const userResult = await pool.query(
      'SELECT id, username, name, role, created_at FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Get user's progress
    const progressResult = await pool.query(
      `SELECT v.id, v.folder, v.title, up.completed_at 
       FROM videos v 
       LEFT JOIN user_progress up ON v.id = up.video_id AND up.user_id = $1 
       ORDER BY v.folder, v.id`,
      [user.id]
    );

    const progress = progressResult.rows.map(row => ({
      id: row.id,
      folder: row.folder,
      title: row.title,
      completed: !!row.completed_at,
      completedAt: row.completed_at
    }));

    res.json({ user, progress });
  } catch (error) {
    console.error('Get student details error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete student (admin only)
router.delete('/students/:userId', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    // Check if user exists and is a student
    const userResult = await pool.query(
      'SELECT username, name FROM users WHERE id = $1 AND role = $2',
      [userId, 'student']
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const user = userResult.rows[0];

    // Delete user (this will cascade delete progress records)
    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({ 
      success: true, 
      message: `Student "${user.name}" (${user.username}) has been deleted successfully.` 
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
