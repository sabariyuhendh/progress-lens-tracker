import express from 'express';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/sse/progress - Server-Sent Events endpoint for real-time progress updates
router.get('/progress', requireAuth, (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': req.headers.origin || '*',
    'Access-Control-Allow-Credentials': 'true'
  });

  // Create SSE client object
  const sseClient = {
    id: Date.now() + Math.random(),
    userId: req.user.id,
    role: req.user.role,
    username: req.user.username,
    write: (data) => {
      try {
        res.write(data);
      } catch (error) {
        console.error('SSE write error:', error);
        removeSSEClient(sseClient);
      }
    },
    req: req,
    res: res
  };

  // Initialize SSE clients array if it doesn't exist
  if (!req.app.locals.sseClients) {
    req.app.locals.sseClients = [];
  }

  // Add client to the list
  req.app.locals.sseClients.push(sseClient);

  console.log(`📡 SSE client connected: ${sseClient.username} (${sseClient.role})`);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({
    type: 'connection',
    message: 'Connected to progress updates',
    timestamp: new Date().toISOString()
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    console.log(`📡 SSE client disconnected: ${sseClient.username}`);
    removeSSEClient(sseClient);
  });

  req.on('error', (error) => {
    console.error(`📡 SSE client error for ${sseClient.username}:`, error);
    removeSSEClient(sseClient);
  });

  // Send periodic heartbeat to keep connection alive
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      })}\n\n`);
    } catch (error) {
      clearInterval(heartbeat);
      removeSSEClient(sseClient);
    }
  }, 30000); // Send heartbeat every 30 seconds

  // Store heartbeat interval for cleanup
  sseClient.heartbeat = heartbeat;
});

// Helper function to remove SSE client
function removeSSEClient(client) {
  if (client.app && client.app.locals.sseClients) {
    const index = client.app.locals.sseClients.indexOf(client);
    if (index > -1) {
      client.app.locals.sseClients.splice(index, 1);
    }
  }
  
  // Clear heartbeat interval
  if (client.heartbeat) {
    clearInterval(client.heartbeat);
  }
  
  // Close response if still open
  if (client.res && !client.res.destroyed) {
    client.res.end();
  }
}

// Broadcast progress update to all connected clients
export const broadcastProgressUpdate = (app, eventData) => {
  if (!app.locals.sseClients) {
    return;
  }

  const message = `data: ${JSON.stringify(eventData)}\n\n`;
  const activeClients = [];

  app.locals.sseClients.forEach(client => {
    try {
      // Send to admin users or the specific user whose progress was updated
      if (client.role === 'admin' || client.userId === eventData.user_id) {
        client.write(message);
        activeClients.push(client);
      }
    } catch (error) {
      console.error('Error broadcasting to SSE client:', error);
      // Remove failed client
      const index = app.locals.sseClients.indexOf(client);
      if (index > -1) {
        app.locals.sseClients.splice(index, 1);
      }
    }
  });

  // Update the clients array to remove failed connections
  app.locals.sseClients = activeClients;
  
  console.log(`📡 Broadcasted progress update to ${activeClients.length} SSE clients`);
};

// Broadcast system message to all connected clients
export const broadcastSystemMessage = (app, message, type = 'info') => {
  if (!app.locals.sseClients) {
    return;
  }

  const eventData = {
    type: 'system_message',
    message_type: type,
    message: message,
    timestamp: new Date().toISOString()
  };

  const sseMessage = `data: ${JSON.stringify(eventData)}\n\n`;
  const activeClients = [];

  app.locals.sseClients.forEach(client => {
    try {
      client.write(sseMessage);
      activeClients.push(client);
    } catch (error) {
      console.error('Error broadcasting system message to SSE client:', error);
      // Remove failed client
      const index = app.locals.sseClients.indexOf(client);
      if (index > -1) {
        app.locals.sseClients.splice(index, 1);
      }
    }
  });

  // Update the clients array to remove failed connections
  app.locals.sseClients = activeClients;
  
  console.log(`📡 Broadcasted system message to ${activeClients.length} SSE clients`);
};

export default router;
