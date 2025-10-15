import express from 'express';
import { query } from '../database/connection.js';

const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/', async (req, res) => {
  try {
    // Test database connection
    const dbResult = await query('SELECT NOW() as timestamp, version() as version');
    
    // Get basic system info
    const systemInfo = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        connected: true,
        timestamp: dbResult.rows[0].timestamp,
        version: dbResult.rows[0].version
      },
      environment: process.env.NODE_ENV || 'development'
    };

    // Get basic statistics
    try {
      const statsResult = await query(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE is_deleted = FALSE) as total_users,
          (SELECT COUNT(*) FROM videos WHERE is_deleted = FALSE) as total_videos,
          (SELECT COUNT(*) FROM progress) as total_progress_records,
          (SELECT COUNT(*) FROM sessions WHERE expires_at > NOW()) as active_sessions
      `);
      
      systemInfo.statistics = statsResult.rows[0];
    } catch (error) {
      console.warn('Could not fetch statistics:', error.message);
      systemInfo.statistics = { error: 'Could not fetch statistics' };
    }

    res.json(systemInfo);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
      details: error.message
    });
  }
});

export default router;
