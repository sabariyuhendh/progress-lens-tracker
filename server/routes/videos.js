const express = require('express');
const pool = require('../db/connection');
const { verifyToken } = require('./auth');

const router = express.Router();

// Get all videos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM videos ORDER BY folder, id');
    res.json(result.rows);
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get folders
router.get('/folders', async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT folder FROM videos ORDER BY folder');
    const folders = result.rows.map(row => row.folder);
    res.json(folders);
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add video (admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id, folder, title } = req.body;

    if (!id || !folder || !title) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if video ID exists
    const existingVideo = await pool.query('SELECT id FROM videos WHERE id = $1', [id]);
    if (existingVideo.rows.length > 0) {
      return res.status(400).json({ error: 'Video ID already exists' });
    }

    const result = await pool.query(
      'INSERT INTO videos (id, folder, title) VALUES ($1, $2, $3) RETURNING *',
      [id, folder, title]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update video (admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { folder, title } = req.body;

    if (!folder || !title) {
      return res.status(400).json({ error: 'Folder and title are required' });
    }

    const result = await pool.query(
      'UPDATE videos SET folder = $1, title = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [folder, title, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete video (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    // Check how many students have completed this video
    const progressResult = await pool.query(
      'SELECT COUNT(*) as count FROM user_progress WHERE video_id = $1',
      [id]
    );

    const completedCount = parseInt(progressResult.rows[0].count);

    // Delete the video (this will cascade delete progress records)
    const result = await pool.query('DELETE FROM videos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json({ 
      success: true, 
      message: `Video deleted successfully. ${completedCount} student progress records were also removed.` 
    });
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
