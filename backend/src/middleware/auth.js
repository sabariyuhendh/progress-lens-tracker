import { query } from '../database/connection.js';
import { v4 as uuidv4 } from 'uuid';

// Session management
export const createSession = async (userId) => {
  const sessionToken = uuidv4();
  const expiresAt = new Date(Date.now() + parseInt(process.env.SESSION_MAX_AGE || '604800000'));
  
  await query(
    'INSERT INTO sessions (session_token, user_id, expires_at) VALUES ($1, $2, $3)',
    [sessionToken, userId, expiresAt]
  );
  
  return { sessionToken, expiresAt };
};

export const getSession = async (sessionToken) => {
  const result = await query(
    'SELECT s.*, u.id, u.username, u.name, u.role FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.session_token = $1 AND s.expires_at > NOW() AND u.is_deleted = FALSE',
    [sessionToken]
  );
  
  if (result.rows.length === 0) {
    return null;
  }
  
  // Update last accessed time
  await query(
    'UPDATE sessions SET last_accessed_at = NOW() WHERE session_token = $1',
    [sessionToken]
  );
  
  return result.rows[0];
};

export const deleteSession = async (sessionToken) => {
  await query('DELETE FROM sessions WHERE session_token = $1', [sessionToken]);
};

export const cleanupExpiredSessions = async () => {
  const result = await query('DELETE FROM sessions WHERE expires_at <= NOW()');
  console.log(`🧹 Cleaned up ${result.rowCount} expired sessions`);
};

// Authentication middleware
export const requireAuth = async (req, res, next) => {
  try {
    let sessionToken = req.session?.sessionToken;
    
    // Check Authorization header for Bearer token
    if (!sessionToken) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7);
      }
    }
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const session = await getSession(sessionToken);
    if (!session) {
      // Clear invalid session
      if (req.session) {
        req.session.destroy();
      }
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    
    req.user = {
      id: session.id,
      username: session.username,
      name: session.name,
      role: session.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Authentication error' });
  }
};

// Admin role middleware
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Self or admin access middleware
export const requireSelfOrAdmin = (req, res, next) => {
  const targetUsername = req.params.username;
  const currentUser = req.user;
  
  if (currentUser.role === 'admin' || currentUser.username === targetUsername) {
    return next();
  }
  
  return res.status(403).json({ error: 'Access denied' });
};

// Rate limiting for progress updates
export const progressRateLimit = (req, res, next) => {
  const userId = req.user?.id;
  if (!userId) return next();
  
  const now = Date.now();
  const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
  const maxRequests = 10; // 10 requests per minute for progress updates
  
  if (!req.app.locals.rateLimitStore) {
    req.app.locals.rateLimitStore = new Map();
  }
  
  const key = `progress:${userId}`;
  const userRequests = req.app.locals.rateLimitStore.get(key) || [];
  
  // Remove old requests outside the window
  const validRequests = userRequests.filter(time => now - time < windowMs);
  
  if (validRequests.length >= maxRequests) {
    return res.status(429).json({ 
      error: 'Too many progress update requests. Please slow down.' 
    });
  }
  
  // Add current request
  validRequests.push(now);
  req.app.locals.rateLimitStore.set(key, validRequests);
  
  next();
};
