# Deployment Guide - Progress Lens Tracker

## Overview
This guide will help you deploy the Progress Lens Tracker application with Neon database integration.

## Prerequisites
- Neon database account and connection string
- Node.js 18+ installed
- Git repository access

## Database Setup

### 1. Create Neon Database
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string (it looks like: `postgresql://username:password@hostname:port/database?sslmode=require`)

### 2. Run Database Schema
1. Connect to your Neon database using any PostgreSQL client
2. Run the SQL commands from `database/schema.sql`
3. This will create all necessary tables and insert the default admin user

## Environment Variables

### Backend (.env in server folder)
```env
DATABASE_URL=postgresql://username:password@hostname:port/database?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
```

### Frontend (.env in root folder)
```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Deployment Steps

### 1. Backend Deployment (Railway/Heroku/Vercel)
1. Create a new project on your hosting platform
2. Connect your GitHub repository
3. Set the root directory to `server/`
4. Add environment variables
5. Deploy

### 2. Frontend Deployment (Vercel/Netlify)
1. Create a new project on your hosting platform
2. Connect your GitHub repository
3. Set the root directory to project root
4. Add environment variables
5. Deploy

### 3. Update CORS Settings
Make sure your backend CORS settings include your frontend domain:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
```

## Default Admin Account
- **Username**: admin
- **Password**: Admin123

## Testing Deployment
1. Visit your frontend URL
2. Try logging in with admin credentials
3. Test student registration
4. Test video management features

## Troubleshooting

### 404 on Refresh
- Ensure `public/_redirects` and `public/vercel.json` are deployed
- Check that your hosting platform supports SPA routing

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check that your database allows connections from your hosting platform
- Ensure SSL is properly configured

### CORS Issues
- Verify FRONTEND_URL matches your actual frontend domain
- Check that credentials are enabled in CORS settings

## Security Notes
- Change the default admin password after first login
- Use a strong, random JWT_SECRET
- Enable HTTPS in production
- Consider rate limiting for production use
