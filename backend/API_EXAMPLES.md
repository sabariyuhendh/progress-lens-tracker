# Progress Lens Tracker API Examples

This document provides practical examples of how to use the Progress Lens Tracker API with curl commands and JavaScript.

## Prerequisites

- Backend server running on `http://localhost:3001`
- Valid user credentials (admin/Admin123 or student/student123)

## Authentication Examples

### 1. Login

```bash
# Login as admin
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}' \
  -c cookies.txt

# Login as student
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"student","password":"student123"}' \
  -c cookies.txt
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "name": "Administrator",
    "role": "admin"
  }
}
```

### 2. Check Session

```bash
curl -X GET http://localhost:3001/api/session \
  -b cookies.txt
```

### 3. Logout

```bash
curl -X POST http://localhost:3001/api/logout \
  -b cookies.txt
```

## User Management Examples (Admin Only)

### 1. List All Users

```bash
curl -X GET "http://localhost:3001/api/users?page=1&limit=10" \
  -b cookies.txt
```

### 2. Create New User

```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "username": "newstudent",
    "name": "New Student",
    "password": "password123",
    "role": "student"
  }'
```

### 3. Delete User

```bash
curl -X DELETE http://localhost:3001/api/users/newstudent \
  -b cookies.txt
```

## Video Management Examples

### 1. List All Videos

```bash
# Get all videos
curl -X GET http://localhost:3001/api/videos \
  -b cookies.txt

# Filter by folder
curl -X GET "http://localhost:3001/api/videos?folder=Mathematics" \
  -b cookies.txt

# With pagination
curl -X GET "http://localhost:3001/api/videos?page=1&limit=5" \
  -b cookies.txt
```

### 2. Get Folder Statistics

```bash
curl -X GET http://localhost:3001/api/folders \
  -b cookies.txt
```

**Response:**
```json
{
  "folders": [
    {
      "folder": "Mathematics",
      "total_videos": 4,
      "completed_videos": 2,
      "completion_percentage": 50.0
    }
  ]
}
```

### 3. Create Video (Admin Only)

```bash
curl -X POST http://localhost:3001/api/videos \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Advanced Calculus",
    "description": "Deep dive into calculus concepts",
    "folder": "Mathematics",
    "url": "https://example.com/advanced-calculus",
    "position": 5
  }'
```

### 4. Update Video (Admin Only)

```bash
curl -X PUT http://localhost:3001/api/videos/1 \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Updated Video Title",
    "description": "Updated description"
  }'
```

### 5. Delete Video (Admin Only)

```bash
curl -X DELETE http://localhost:3001/api/videos/1 \
  -b cookies.txt
```

## Progress Tracking Examples

### 1. Get User Progress

```bash
# Get student's own progress
curl -X GET http://localhost:3001/api/progress/student \
  -b cookies.txt

# Admin getting any user's progress
curl -X GET http://localhost:3001/api/progress/john_doe \
  -b cookies.txt
```

**Response:**
```json
{
  "progress": {
    "1": {
      "completed": true,
      "updated_at": "2024-01-01T12:00:00.000Z"
    },
    "2": {
      "completed": false,
      "updated_at": "2024-01-01T11:30:00.000Z"
    }
  },
  "progressSummary": {
    "Mathematics": {
      "total": 4,
      "completed": 2,
      "percentage": 50
    },
    "Science": {
      "total": 4,
      "completed": 1,
      "percentage": 25
    }
  },
  "lastUpdated": 1704110400000
}
```

### 2. Get Progress Summary

```bash
curl -X GET http://localhost:3001/api/progress/summary/student \
  -b cookies.txt
```

### 3. Update Single Progress

```bash
curl -X POST http://localhost:3001/api/progress/student \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "video_id": 1,
    "completed": true
  }'
```

### 4. Bulk Progress Update

```bash
curl -X POST http://localhost:3001/api/progress/student \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "updates": [
      {"video_id": 1, "completed": true},
      {"video_id": 2, "completed": false},
      {"video_id": 3, "completed": true},
      {"video_id": 4, "completed": true}
    ]
  }'
```

### 5. Get All Users Progress (Admin Only)

```bash
# Get all users progress
curl -X GET "http://localhost:3001/api/progress?all=true" \
  -b cookies.txt

# Filter by folder
curl -X GET "http://localhost:3001/api/progress?all=true&folder=Mathematics" \
  -b cookies.txt

# Show only incomplete progress
curl -X GET "http://localhost:3001/api/progress?all=true&incompleteOnly=true" \
  -b cookies.txt

# With pagination
curl -X GET "http://localhost:3001/api/progress?all=true&page=1&limit=5" \
  -b cookies.txt
```

## Real-time Updates (Server-Sent Events)

### 1. Subscribe to Progress Updates

```bash
curl -N -H "Accept: text/event-stream" \
  -b cookies.txt \
  http://localhost:3001/api/sse/progress
```

**Example SSE Events:**
```
data: {"type":"connection","message":"Connected to progress updates","timestamp":"2024-01-01T12:00:00.000Z"}

data: {"type":"progress_update","user_id":2,"username":"student","video_id":1,"completed":true,"updated_at":"2024-01-01T12:05:00.000Z"}

data: {"type":"heartbeat","timestamp":"2024-01-01T12:00:30.000Z"}
```

### 2. JavaScript SSE Client

```javascript
// Subscribe to real-time progress updates
const eventSource = new EventSource('/api/sse/progress', {
  withCredentials: true
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'connection':
      console.log('Connected to progress updates');
      break;
      
    case 'progress_update':
      console.log('Progress updated:', data);
      // Update UI with new progress data
      updateProgressUI(data);
      break;
      
    case 'heartbeat':
      console.log('Heartbeat received');
      break;
      
    case 'system_message':
      console.log('System message:', data.message);
      break;
  }
};

eventSource.onerror = (error) => {
  console.error('SSE connection error:', error);
};

// Close connection when done
// eventSource.close();
```

## Health Check

### 1. Check Server Health

```bash
curl -X GET http://localhost:3001/api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "database": {
    "connected": true,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "version": "PostgreSQL 15.0"
  },
  "statistics": {
    "total_users": 4,
    "total_videos": 16,
    "total_progress_records": 25,
    "active_sessions": 2
  },
  "environment": "development"
}
```

## JavaScript/Fetch Examples

### 1. Complete Authentication Flow

```javascript
class ProgressTrackerAPI {
  constructor(baseURL = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
  }

  async login(username, password) {
    const response = await fetch(`${this.baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return await response.json();
  }

  async logout() {
    const response = await fetch(`${this.baseURL}/logout`, {
      method: 'POST',
      credentials: 'include'
    });

    return await response.json();
  }

  async getSession() {
    const response = await fetch(`${this.baseURL}/session`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('No valid session');
    }

    return await response.json();
  }

  async updateProgress(username, videoId, completed) {
    const response = await fetch(`${this.baseURL}/progress/${username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ video_id: videoId, completed })
    });

    return await response.json();
  }

  async bulkUpdateProgress(username, updates) {
    const response = await fetch(`${this.baseURL}/progress/${username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ updates })
    });

    return await response.json();
  }

  async getUserProgress(username) {
    const response = await fetch(`${this.baseURL}/progress/${username}`, {
      credentials: 'include'
    });

    return await response.json();
  }

  async getVideos(folder = null) {
    const url = folder 
      ? `${this.baseURL}/videos?folder=${encodeURIComponent(folder)}`
      : `${this.baseURL}/videos`;
      
    const response = await fetch(url, {
      credentials: 'include'
    });

    return await response.json();
  }
}

// Usage example
const api = new ProgressTrackerAPI();

// Login
try {
  const user = await api.login('student', 'student123');
  console.log('Logged in as:', user.user.name);
} catch (error) {
  console.error('Login failed:', error);
}

// Update progress
try {
  const result = await api.updateProgress('student', 1, true);
  console.log('Progress updated:', result);
} catch (error) {
  console.error('Progress update failed:', error);
}

// Bulk update progress
try {
  const updates = [
    { video_id: 1, completed: true },
    { video_id: 2, completed: false },
    { video_id: 3, completed: true }
  ];
  const result = await api.bulkUpdateProgress('student', updates);
  console.log('Bulk progress updated:', result);
} catch (error) {
  console.error('Bulk progress update failed:', error);
}
```

## Error Handling Examples

### 1. Common Error Responses

```json
// Authentication error
{
  "error": "Invalid credentials"
}

// Validation error
{
  "error": "Validation failed",
  "details": [
    {
      "msg": "Username must be between 1 and 50 characters",
      "param": "username",
      "location": "body"
    }
  ]
}

// Authorization error
{
  "error": "Admin access required"
}

// Not found error
{
  "error": "User not found"
}

// Rate limit error
{
  "error": "Too many progress update requests. Please slow down."
}
```

### 2. Error Handling in JavaScript

```javascript
async function handleAPIRequest(requestFunction) {
  try {
    const result = await requestFunction();
    return { success: true, data: result };
  } catch (error) {
    if (error.response) {
      // Server responded with error status
      const errorData = await error.response.json();
      return { 
        success: false, 
        error: errorData.error,
        details: errorData.details 
      };
    } else if (error.request) {
      // Network error
      return { 
        success: false, 
        error: 'Network error - please check your connection' 
      };
    } else {
      // Other error
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

// Usage
const result = await handleAPIRequest(() => 
  api.updateProgress('student', 1, true)
);

if (result.success) {
  console.log('Success:', result.data);
} else {
  console.error('Error:', result.error);
  if (result.details) {
    console.error('Details:', result.details);
  }
}
```

## Testing with Postman

### 1. Import Collection

Create a Postman collection with these requests:

1. **Login** - POST `/api/login`
2. **Get Session** - GET `/api/session`
3. **Get Videos** - GET `/api/videos`
4. **Get Progress** - GET `/api/progress/student`
5. **Update Progress** - POST `/api/progress/student`
6. **Health Check** - GET `/api/health`

### 2. Environment Variables

Set up environment variables in Postman:
- `base_url`: `http://localhost:3001/api`
- `username`: `admin` or `student`
- `password`: `Admin123` or `student123`

### 3. Pre-request Scripts

Add this to your login request's "Tests" tab to save the session cookie:

```javascript
if (pm.response.code === 200) {
  const cookies = pm.response.headers.get('Set-Cookie');
  if (cookies) {
    pm.environment.set('session_cookie', cookies);
  }
}
```

Add this to other requests' "Pre-request Script" tab:

```javascript
const sessionCookie = pm.environment.get('session_cookie');
if (sessionCookie) {
  pm.request.headers.add({
    key: 'Cookie',
    value: sessionCookie
  });
}
```

This completes the comprehensive API examples for the Progress Lens Tracker backend!
