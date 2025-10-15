# Progress Lens Tracker Backend

A secure, scalable backend API for the Progress Lens Tracker application built with Node.js, Express, and PostgreSQL (NeonDB).

## Features

- 🔐 **Secure Authentication**: HTTP-only cookies with server-side sessions
- 📊 **Progress Tracking**: Real-time progress updates with bulk operations
- 🎥 **Video Management**: Organize videos by folders with CRUD operations
- 👥 **User Management**: Role-based access control (admin/student)
- 📡 **Real-time Updates**: Server-Sent Events (SSE) for live progress monitoring
- 🛡️ **Security**: Input validation, rate limiting, and secure headers
- 🧪 **Testing**: Comprehensive unit tests with Jest
- 📈 **Performance**: Database indexing and query optimization

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL (NeonDB)
- **Authentication**: HTTP-only cookies + server-side sessions
- **Real-time**: Server-Sent Events (SSE)
- **Security**: Helmet, CORS, Rate Limiting, bcrypt
- **Testing**: Jest, Supertest
- **Validation**: express-validator

## Quick Start

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database (NeonDB recommended)
- npm or yarn

### Installation

1. **Clone and setup**:
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**:
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
   PORT=3001
   NODE_ENV=development
   SESSION_SECRET=your-super-secret-session-key-change-this-in-production
   SESSION_MAX_AGE=604800000
   BCRYPT_ROUNDS=12
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX_REQUESTS=100
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Database Setup**:
   ```bash
   # Run migrations
   npm run migrate
   
   # Seed with demo data
   npm run seed
   
   # Or run both
   npm run setup
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001/api`

## API Endpoints

### Authentication

#### POST /api/login
Login with username and password.

**Request:**
```json
{
  "username": "admin",
  "password": "Admin123"
}
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

#### POST /api/logout
Logout and invalidate session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

#### GET /api/session
Check current session status.

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

### User Management (Admin Only)

#### GET /api/users
List all users with pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `role` (optional): Filter by role (admin/student)

**Response:**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "name": "Administrator",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "pages": 1
  }
}
```

#### POST /api/users
Create a new user.

**Request:**
```json
{
  "username": "newuser",
  "name": "New User",
  "password": "password123",
  "role": "student"
}
```

#### DELETE /api/users/:username
Soft delete a user.

### Video Management

#### GET /api/videos
List all videos with optional filtering.

**Query Parameters:**
- `folder` (optional): Filter by folder name
- `page` (optional): Page number
- `limit` (optional): Items per page

**Response:**
```json
{
  "videos": [
    {
      "id": 1,
      "title": "Introduction to Algebra",
      "description": "Basic algebraic concepts",
      "folder": "Mathematics",
      "url": "https://example.com/video1",
      "position": 1,
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1,
    "pages": 1
  }
}
```

#### GET /api/folders
Get folder statistics with completion percentages.

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

#### POST /api/videos (Admin Only)
Create a new video.

**Request:**
```json
{
  "title": "New Video",
  "description": "Video description",
  "folder": "Mathematics",
  "url": "https://example.com/video",
  "position": 1
}
```

#### PUT /api/videos/:id (Admin Only)
Update a video.

#### DELETE /api/videos/:id (Admin Only)
Soft delete a video.

### Progress Tracking

#### GET /api/progress/:username
Get user's progress with folder summaries.

**Response:**
```json
{
  "progress": {
    "1": {
      "completed": true,
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  },
  "progressSummary": {
    "Mathematics": {
      "total": 4,
      "completed": 2,
      "percentage": 50
    }
  },
  "lastUpdated": 1704067200000
}
```

#### GET /api/progress/summary/:username
Get aggregated progress metrics.

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
  ],
  "overall": {
    "totalVideos": 16,
    "totalCompleted": 8,
    "percentage": 50
  }
}
```

#### POST /api/progress/:username
Update user progress (single or bulk).

**Single Update:**
```json
{
  "video_id": 1,
  "completed": true
}
```

**Bulk Update:**
```json
{
  "updates": [
    { "video_id": 1, "completed": true },
    { "video_id": 2, "completed": false },
    { "video_id": 3, "completed": true }
  ]
}
```

#### GET /api/progress?all=true (Admin Only)
Get all users' progress with pagination and filtering.

**Query Parameters:**
- `folder` (optional): Filter by folder
- `incompleteOnly` (optional): Show only incomplete progress
- `page` (optional): Page number
- `limit` (optional): Items per page

### Real-time Updates

#### GET /api/sse/progress
Server-Sent Events endpoint for real-time progress updates.

**Event Types:**
- `connection`: Initial connection confirmation
- `progress_update`: Progress change notification
- `heartbeat`: Keep-alive message (every 30 seconds)
- `system_message`: System notifications

**Example Event:**
```
data: {"type":"progress_update","user_id":1,"username":"student","video_id":1,"completed":true,"updated_at":"2024-01-01T00:00:00.000Z"}
```

### Health Check

#### GET /api/health
Server health and statistics.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "memory": {
    "rss": 50331648,
    "heapTotal": 20971520,
    "heapUsed": 15728640,
    "external": 1048576
  },
  "database": {
    "connected": true,
    "timestamp": "2024-01-01T00:00:00.000Z",
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

## Database Schema

### Tables

- **users**: User accounts with roles
- **videos**: Video content organized by folders
- **progress**: User progress tracking (user_id, video_id, completed)
- **sessions**: Server-side session storage
- **progress_audit**: Audit trail for progress changes

### Key Features

- Unique constraint on (user_id, video_id) for progress
- Soft deletes with `is_deleted` flags
- Automatic `updated_at` timestamps
- Optimized indexes for performance
- Audit trail for progress changes

## Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **Session Security**: HTTP-only, Secure, SameSite cookies
- **Rate Limiting**: Configurable per-endpoint limits
- **Input Validation**: Comprehensive request validation
- **CORS**: Configurable cross-origin policies
- **Security Headers**: Helmet.js protection
- **SQL Injection Protection**: Parameterized queries

## Development

### Scripts

```bash
# Development
npm run dev          # Start with nodemon
npm start           # Start production server

# Database
npm run migrate     # Run database migrations
npm run seed        # Seed with demo data
npm run setup       # Run both migrate and seed

# Testing
npm test           # Run all tests
npm run test:watch # Run tests in watch mode
```

### Testing

The project includes comprehensive tests for:

- Progress update logic (single and bulk)
- SSE event emission and broadcasting
- Authentication and authorization
- Input validation
- Error handling

Run tests:
```bash
npm test
```

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment mode | development |
| `SESSION_SECRET` | Session encryption key | Required |
| `SESSION_MAX_AGE` | Session lifetime (ms) | 604800000 (7 days) |
| `BCRYPT_ROUNDS` | Password hashing rounds | 12 |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | 60000 (1 min) |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | 100 |
| `CORS_ORIGIN` | Allowed CORS origin | http://localhost:5173 |

## Deployment

### Production Checklist

1. **Environment Variables**:
   - Set `NODE_ENV=production`
   - Use strong `SESSION_SECRET`
   - Configure production `DATABASE_URL`
   - Set secure `CORS_ORIGIN`

2. **Database**:
   - Run migrations: `npm run migrate`
   - Create production user accounts
   - Set up database backups

3. **Security**:
   - Enable HTTPS
   - Configure firewall rules
   - Set up monitoring and logging
   - Regular security updates

4. **Performance**:
   - Enable database connection pooling
   - Configure rate limiting
   - Set up caching if needed
   - Monitor memory usage

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Example Deployment Commands

```bash
# Build and run with Docker
docker build -t progress-lens-api .
docker run -p 3001:3001 --env-file .env progress-lens-api

# Or deploy to cloud platform
# (Vercel, Railway, Heroku, etc.)
```

## API Usage Examples

### cURL Examples

**Login:**
```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin123"}' \
  -c cookies.txt
```

**Update Progress:**
```bash
curl -X POST http://localhost:3001/api/progress/student \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"video_id":1,"completed":true}'
```

**Bulk Progress Update:**
```bash
curl -X POST http://localhost:3001/api/progress/student \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"updates":[{"video_id":1,"completed":true},{"video_id":2,"completed":false}]}'
```

**Subscribe to SSE:**
```bash
curl -N -H "Accept: text/event-stream" \
  -b cookies.txt \
  http://localhost:3001/api/sse/progress
```

### JavaScript Client Example

```javascript
// Login
const loginResponse = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'student', password: 'student123' })
});

// Update progress
await fetch('/api/progress/student', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ video_id: 1, completed: true })
});

// Subscribe to real-time updates
const eventSource = new EventSource('/api/sse/progress', {
  withCredentials: true
});

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'progress_update') {
    console.log('Progress updated:', data);
  }
};
```

## Demo Data

The seed script creates:

- **Users**: 
  - `admin` / `Admin123` (admin role)
  - `student` / `student123` (student role)
  - Additional demo students

- **Videos**: 16 sample videos across 4 folders:
  - Mathematics (4 videos)
  - Science (4 videos) 
  - Programming (4 videos)
  - Language Arts (4 videos)

- **Progress**: Sample progress data for demonstration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Check the API documentation above
- Review the test files for usage examples
- Open an issue on GitHub
