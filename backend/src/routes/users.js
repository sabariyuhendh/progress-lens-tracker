import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/connection.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { 
  validateCreateUser, 
  validateUsername, 
  validatePagination 
} from '../middleware/validation.js';

const router = express.Router();

// GET /api/users - List users (admin only)
router.get('/', requireAuth, requireAdmin, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const role = req.query.role;
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE is_deleted = FALSE';
    let params = [];
    let paramCount = 0;
    
    if (role) {
      paramCount++;
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);
    
    // Get users with pagination
    paramCount++;
    const usersQuery = `
      SELECT id, username, name, role, created_at, updated_at 
      FROM users 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    params.push(limit, offset);
    
    const usersResult = await query(usersQuery, params);
    
    res.json({
      users: usersResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/users - Create user (admin only)
router.post('/', requireAuth, requireAdmin, validateCreateUser, async (req, res) => {
  try {
    const { username, name, password, role } = req.body;
    
    // Check if username already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1 AND is_deleted = FALSE',
      [username]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    
    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await query(
      'INSERT INTO users (username, name, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, username, name, role, created_at',
      [username, name, passwordHash, role]
    );
    
    const newUser = result.rows[0];
    
    res.status(201).json({
      user: newUser,
      message: 'User created successfully'
    });
    
  } catch (error) {
    console.error('Create user error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(409).json({ error: 'Username already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user' });
    }
  }
});

// DELETE /api/users/:username - Soft delete user (admin only)
router.delete('/:username', requireAuth, requireAdmin, validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    
    // Check if user exists
    const userResult = await query(
      'SELECT id, username FROM users WHERE username = $1 AND is_deleted = FALSE',
      [username]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Prevent admin from deleting themselves
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Soft delete user
    await query(
      'UPDATE users SET is_deleted = TRUE, updated_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Delete all sessions for this user
    await query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
    
    res.json({ message: 'User deleted successfully' });
    
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// GET /api/users/:username - Get user details (admin only)
router.get('/:username', requireAuth, requireAdmin, validateUsername, async (req, res) => {
  try {
    const { username } = req.params;
    
    const result = await query(
      'SELECT id, username, name, role, created_at, updated_at FROM users WHERE username = $1 AND is_deleted = FALSE',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: result.rows[0] });
    
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

export default router;
