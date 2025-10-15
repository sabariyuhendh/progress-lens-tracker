import express from 'express';
import { query } from '../database/connection.js';
import { requireAuth, requireSelfOrAdmin, progressRateLimit } from '../middleware/auth.js';
import { 
  validateProgressUpdate, 
  validateBulkProgressUpdate, 
  validateUsername,
  validateProgressFilters,
  validatePagination
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/progress/:username - Get user progress
router.get('/:username', requireAuth, requireSelfOrAdmin, validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE username = $1 AND is_deleted = FALSE',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Get all videos
    const videosResult = await query(
      'SELECT id, title, folder, position FROM videos WHERE is_deleted = FALSE ORDER BY folder, position'
    );
    
    // Get user's progress
    const progressResult = await query(
      'SELECT video_id, completed, updated_at FROM progress WHERE user_id = $1',
      [userId]
    );
    
    // Create progress map
    const progressMap = {};
    progressResult.rows.forEach(row => {
      progressMap[row.video_id] = {
        completed: row.completed,
        updated_at: row.updated_at
      };
    });
    
    // Calculate progress summary by folder
    const progressSummary = {};
    videosResult.rows.forEach(video => {
      if (!progressSummary[video.folder]) {
        progressSummary[video.folder] = {
          total: 0,
          completed: 0,
          percentage: 0
        };
      }
      
      progressSummary[video.folder].total++;
      if (progressMap[video.id]?.completed) {
        progressSummary[video.folder].completed++;
      }
    });
    
    // Calculate percentages
    Object.keys(progressSummary).forEach(folder => {
      const summary = progressSummary[folder];
      summary.percentage = summary.total > 0 ? 
        Math.round((summary.completed / summary.total) * 100) : 0;
    });
    
    res.json({
      progress: progressMap,
      progressSummary,
      lastUpdated: progressResult.rows.length > 0 ? 
        Math.max(...progressResult.rows.map(r => new Date(r.updated_at).getTime())) : null
    });
    
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/progress/summary/:username - Get aggregated progress metrics
router.get('/summary/:username', requireAuth, requireSelfOrAdmin, validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE username = $1 AND is_deleted = FALSE',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Get aggregated progress data
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
      LEFT JOIN progress p ON v.id = p.video_id AND p.user_id = $1 AND p.completed = TRUE
      WHERE v.is_deleted = FALSE
      GROUP BY v.folder
      ORDER BY v.folder
    `, [userId]);
    
    // Calculate overall statistics
    const totalVideos = result.rows.reduce((sum, row) => sum + parseInt(row.total_videos), 0);
    const totalCompleted = result.rows.reduce((sum, row) => sum + parseInt(row.completed_videos), 0);
    const overallPercentage = totalVideos > 0 ? Math.round((totalCompleted / totalVideos) * 100) : 0;
    
    res.json({
      folders: result.rows,
      overall: {
        totalVideos,
        totalCompleted,
        percentage: overallPercentage
      }
    });
    
  } catch (error) {
    console.error('Get progress summary error:', error);
    res.status(500).json({ error: 'Failed to fetch progress summary' });
  }
});

// POST /api/progress/:username - Update user progress (single or bulk)
router.post('/:username', requireAuth, requireSelfOrAdmin, progressRateLimit, async (req, res) => {
  try {
    const { username } = req.params;
    const { video_id, completed, updates } = req.body;
    
    // Get user ID
    const userResult = await query(
      'SELECT id FROM users WHERE username = $1 AND is_deleted = FALSE',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const userId = userResult.rows[0].id;
    
    // Determine if this is a bulk update or single update
    const progressUpdates = updates || [{ video_id, completed }];
    
    // Validate all video IDs exist
    const videoIds = progressUpdates.map(u => u.video_id);
    const videosResult = await query(
      'SELECT id FROM videos WHERE id = ANY($1) AND is_deleted = FALSE',
      [videoIds]
    );
    
    if (videosResult.rows.length !== videoIds.length) {
      return res.status(400).json({ error: 'One or more video IDs are invalid' });
    }
    
    // Start transaction
    const client = await query.getClient();
    await client.query('BEGIN');
    
    try {
      const updatedProgress = [];
      
      for (const update of progressUpdates) {
        // Upsert progress record
        const progressResult = await client.query(`
          INSERT INTO progress (user_id, video_id, completed, updated_at)
          VALUES ($1, $2, $3, NOW())
          ON CONFLICT (user_id, video_id)
          DO UPDATE SET 
            completed = EXCLUDED.completed,
            updated_at = NOW()
          RETURNING video_id, completed, updated_at
        `, [userId, update.video_id, update.completed]);
        
        updatedProgress.push(progressResult.rows[0]);
        
        // Insert audit record
        await client.query(`
          INSERT INTO progress_audit (user_id, target_user_id, video_id, completed_after, changed_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [req.user.id, userId, update.video_id, update.completed]);
      }
      
      await client.query('COMMIT');
      
      // Emit SSE event for real-time updates
      if (req.app.locals.sseClients) {
        const eventData = {
          type: 'progress_update',
          user_id: userId,
          username: username,
          updates: updatedProgress,
          updated_at: new Date().toISOString()
        };
        
        req.app.locals.sseClients.forEach(client => {
          if (client.userId === userId || client.role === 'admin') {
            client.write(`data: ${JSON.stringify(eventData)}\n\n`);
          }
        });
      }
      
      // Get updated progress summary
      const summaryResult = await query(`
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
        LEFT JOIN progress p ON v.id = p.video_id AND p.user_id = $1 AND p.completed = TRUE
        WHERE v.is_deleted = FALSE
        GROUP BY v.folder
        ORDER BY v.folder
      `, [userId]);
      
      res.json({
        message: 'Progress updated successfully',
        updatedProgress,
        progressSummary: summaryResult.rows
      });
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /api/progress?all=true - Get all users progress (admin only)
router.get('/', requireAuth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { all, folder, incompleteOnly, page, limit } = req.query;
    
    if (all !== 'true') {
      return res.status(400).json({ error: 'Use ?all=true to get all users progress' });
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const offset = (pageNum - 1) * limitNum;
    
    // Build query conditions
    let whereConditions = ['u.is_deleted = FALSE'];
    let params = [];
    let paramCount = 0;
    
    if (folder) {
      paramCount++;
      whereConditions.push(`v.folder = $${paramCount}`);
      params.push(folder);
    }
    
    if (incompleteOnly === 'true') {
      whereConditions.push(`(p.completed = FALSE OR p.completed IS NULL)`);
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id
      LEFT JOIN videos v ON p.video_id = v.id
      WHERE ${whereClause}
    `;
    
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    
    // Get paginated results
    paramCount++;
    const usersQuery = `
      SELECT 
        u.id,
        u.username,
        u.name,
        u.role,
        COUNT(DISTINCT v.id) as total_videos,
        COUNT(DISTINCT CASE WHEN p.completed = TRUE THEN p.video_id END) as completed_videos,
        ROUND(
          CASE 
            WHEN COUNT(DISTINCT v.id) > 0 THEN (COUNT(DISTINCT CASE WHEN p.completed = TRUE THEN p.video_id END)::float / COUNT(DISTINCT v.id)) * 100 
            ELSE 0 
          END, 2
        ) as completion_percentage,
        MAX(p.updated_at) as last_activity
      FROM users u
      LEFT JOIN progress p ON u.id = p.user_id
      LEFT JOIN videos v ON p.video_id = v.id AND v.is_deleted = FALSE
      WHERE ${whereClause}
      GROUP BY u.id, u.username, u.name, u.role
      ORDER BY completion_percentage DESC, u.username
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    params.push(limitNum, offset);
    const usersResult = await query(usersQuery, params);
    
    res.json({
      users: usersResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });
    
  } catch (error) {
    console.error('Get all progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress data' });
  }
});

export default router;
