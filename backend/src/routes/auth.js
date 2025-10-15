import express from 'express';
import bcrypt from 'bcrypt';
import { query } from '../database/connection.js';
import { createSession, deleteSession } from '../middleware/auth.js';
import { validateLogin } from '../middleware/validation.js';

const router = express.Router();

// POST /api/login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Find user by username
    const result = await query(
      'SELECT id, username, name, password_hash, role FROM users WHERE username = $1 AND is_deleted = FALSE',
      [username]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = result.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Create session
    let sessionToken = null;
    try {
      const sessionResult = await createSession(user.id);
      sessionToken = sessionResult.sessionToken;
      
      // Set HTTP-only cookie
      res.cookie('session', sessionToken, {
        httpOnly: true,
        secure: false, // Set to false for development
        sameSite: 'none', // Allow cross-origin cookies
        maxAge: parseInt(process.env.SESSION_MAX_AGE || '604800000'), // 7 days
        path: '/'
      });
      
      // Store session in express-session for compatibility
      if (req.session) {
        req.session.sessionToken = sessionToken;
      }
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      // Continue without session for now
    }
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
      },
      sessionToken: sessionToken // Include token in response for development
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/logout
router.post('/logout', async (req, res) => {
  try {
    const sessionToken = req.session?.sessionToken;
    
    if (sessionToken) {
      await deleteSession(sessionToken);
    }
    
    // Clear cookie
    res.clearCookie('session');
    
    // Destroy express session
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ error: 'Logout failed' });
      }
      
      res.json({ message: 'Logged out successfully' });
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// GET /api/session
router.get('/session', async (req, res) => {
  try {
    const sessionToken = req.session?.sessionToken;
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'No active session' });
    }
    
    const result = await query(
      'SELECT s.*, u.id, u.username, u.name, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.is_deleted = FALSE',
      [sessionToken]
    );
    
    if (result.rows.length === 0) {
      // Clear invalid session
      res.clearCookie('session');
      req.session.destroy();
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    const session = result.rows[0];
    
    // Update last accessed time
    await query(
      'UPDATE sessions SET last_accessed_at = NOW() WHERE session_token = $1',
      [sessionToken]
    );
    
    res.json({
      user: {
        id: session.id,
        username: session.username,
        name: session.name,
        role: session.role
      }
    });
    
  } catch (error) {
    console.error('Session check error:', error);
    res.status(500).json({ error: 'Session check failed' });
  }
});

export default router;
