import express from 'express';
import { query } from '../database/connection.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { 
  validateCreateVideo, 
  validateUpdateVideo, 
  validateVideoId,
  validateFolderFilter,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/videos - List all videos with optional folder filter
router.get('/', validateFolderFilter, validatePagination, async (req, res) => {
  try {
    const folder = req.query.folder;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE is_deleted = FALSE';
    let params = [];
    let paramCount = 0;
    
    if (folder) {
      paramCount++;
      whereClause += ` AND folder = $${paramCount}`;
      params.push(folder);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM videos ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get videos with pagination
    paramCount++;
    const videosQuery = `
      SELECT id, title, description, folder, url, position, created_at, updated_at 
      FROM videos 
      ${whereClause}
      ORDER BY folder, position, created_at
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);
    
    const videosResult = await query(videosQuery, params);
    
    res.json({
      videos: videosResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// GET /api/folders - List folders with aggregated progress counts
router.get('/folders', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        v.folder,
        COUNT(v.id) as total_videos,
        COUNT(p.id) as completed_videos,
        ROUND(
          CASE 
            WHEN COUNT(v.id) > 0 THEN (COUNT(p.id)::float / COUNT(v.id)) * 100 
            ELSE 0 
          END, 2
        ) as completion_percentage
      FROM videos v
      LEFT JOIN progress p ON v.id = p.video_id AND p.completed = TRUE
      WHERE v.is_deleted = FALSE
      GROUP BY v.folder
      ORDER BY v.folder
    `);
    
    res.json({ folders: result.rows });
    
  } catch (error) {
    console.error('Get folders error:', error);
    res.status(500).json({ error: 'Failed to fetch folders' });
  }
});

// POST /api/videos - Create video (admin only)
router.post('/', requireAuth, requireAdmin, validateCreateVideo, async (req, res) => {
  try {
    const { title, description, folder, url, position } = req.body;
    
    // If no position specified, get the next position in the folder
    let finalPosition = position;
    if (finalPosition === undefined) {
      const positionResult = await query(
        'SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM videos WHERE folder = $1 AND is_deleted = FALSE',
        [folder]
      );
      finalPosition = positionResult.rows[0].next_position;
    }
    
    const result = await query(
      'INSERT INTO videos (title, description, folder, url, position) VALUES ($1, $2, $3, $4, $5) RETURNING id, title, description, folder, url, position, created_at',
      [title, description, folder, url, finalPosition]
    );
    
    const newVideo = result.rows[0];
    
    res.status(201).json({
      video: newVideo,
      message: 'Video created successfully'
    });
    
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// PUT /api/videos/:id - Update video (admin only)
router.put('/:id', requireAuth, requireAdmin, validateVideoId, validateUpdateVideo, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, folder, url, position } = req.body;
    
    // Check if video exists
    const existingVideo = await query(
      'SELECT id FROM videos WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    
    if (existingVideo.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Build dynamic update query
    const updates = [];
    const params = [];
    let paramCount = 0;
    
    if (title !== undefined) {
      paramCount++;
      updates.push(`title = $${paramCount}`);
      params.push(title);
    }
    
    if (description !== undefined) {
      paramCount++;
      updates.push(`description = $${paramCount}`);
      params.push(description);
    }
    
    if (folder !== undefined) {
      paramCount++;
      updates.push(`folder = $${paramCount}`);
      params.push(folder);
    }
    
    if (url !== undefined) {
      paramCount++;
      updates.push(`url = $${paramCount}`);
      params.push(url);
    }
    
    if (position !== undefined) {
      paramCount++;
      updates.push(`position = $${paramCount}`);
      params.push(position);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Add updated_at and id to params
    paramCount++;
    updates.push(`updated_at = NOW()`);
    paramCount++;
    params.push(id);
    
    const updateQuery = `
      UPDATE videos 
      SET ${updates.join(', ')} 
      WHERE id = $${paramCount} AND is_deleted = FALSE
      RETURNING id, title, description, folder, url, position, created_at, updated_at
    `;
    
    const result = await query(updateQuery, params);
    
    res.json({
      video: result.rows[0],
      message: 'Video updated successfully'
    });
    
  } catch (error) {
    console.error('Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// DELETE /api/videos/:id - Soft delete video (admin only)
router.delete('/:id', requireAuth, requireAdmin, validateVideoId, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if video exists
    const existingVideo = await query(
      'SELECT id FROM videos WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    
    if (existingVideo.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    // Soft delete video
    await query(
      'UPDATE videos SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
      [id]
    );
    
    res.json({ message: 'Video deleted successfully' });
    
  } catch (error) {
    console.error('Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// GET /api/videos/:id - Get single video details
router.get('/:id', validateVideoId, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      'SELECT id, title, description, folder, url, position, created_at, updated_at FROM videos WHERE id = $1 AND is_deleted = FALSE',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }
    
    res.json({ video: result.rows[0] });
    
  } catch (error) {
    console.error('Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

export default router;
