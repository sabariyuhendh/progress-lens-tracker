# Render Deployment Guide

## 🚀 Complete Deployment Guide for Progress Lens Tracker

### Prerequisites
- GitHub repository with your code
- Render account (free tier available)

## Step 1: Prepare Your Repository

### 1.1 Update Environment Variables
Create these files in your repository:

**server/.env** (for local development):
```env
DATABASE_URL=your-neon-database-url-here
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:8080
```

**Root .env** (for frontend):
```env
VITE_API_URL=https://progress-lens-tracker-api.onrender.com/api
```

### 1.2 Update API Service
The frontend API service should automatically use the production URL when deployed.

## Step 2: Deploy Backend API

### 2.1 Create New Web Service
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository

### 2.2 Backend Configuration
- **Name**: `progress-lens-tracker-api`
- **Environment**: `Node`
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Plan**: Free

### 2.3 Environment Variables
Add these environment variables in Render:
```
NODE_ENV=production
DATABASE_URL=your-neon-database-url
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=https://progress-lens-tracker.onrender.com
```

### 2.4 Deploy Backend
Click "Create Web Service" and wait for deployment.

## Step 3: Deploy Frontend

### 3.1 Create New Static Site
1. In Render Dashboard, click "New +" → "Static Site"
2. Connect the same GitHub repository

### 3.2 Frontend Configuration
- **Name**: `progress-lens-tracker`
- **Build Command**: `npm install && npm run build`
- **Publish Directory**: `dist`
- **Plan**: Free

### 3.3 Environment Variables
Add this environment variable:
```
VITE_API_URL=https://progress-lens-tracker-api.onrender.com/api
```

### 3.4 Deploy Frontend
Click "Create Static Site" and wait for deployment.

## Step 4: Update CORS and URLs

### 4.1 Update Backend CORS
After both services are deployed, update the backend CORS to include your frontend URL:

In `server/index.js`, the CORS should include:
```javascript
app.use(cors({
  origin: [
    'https://progress-lens-tracker.onrender.com',
    'http://localhost:8080' // for local development
  ],
  credentials: true
}));
```

### 4.2 Redeploy Backend
After updating CORS, redeploy the backend service.

## Step 5: Database Setup

### 5.1 Run Database Migration
You'll need to run the database migration on your production database:

1. Connect to your Neon database
2. Run the SQL from `database/schema.sql`
3. Run the video seeding script

### 5.2 Alternative: Add Migration to Backend
Add this to your backend startup to auto-migrate:

```javascript
// In server/index.js, add before app.listen():
const runMigrations = async () => {
  try {
    // Run migration and seeding
    require('./scripts/migrate.js');
    require('./scripts/seed-videos.js');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

runMigrations();
```

## Step 6: Test Deployment

### 6.1 Test URLs
- **Frontend**: `https://progress-lens-tracker.onrender.com`
- **Backend API**: `https://progress-lens-tracker-api.onrender.com/api/health`

### 6.2 Test Login
- Username: `admin`
- Password: `Admin123`

## Troubleshooting

### Common Issues:

1. **404 on Refresh**: Make sure you have `public/_redirects` and `public/vercel.json`
2. **CORS Errors**: Update backend CORS with correct frontend URL
3. **Database Connection**: Verify DATABASE_URL is correct
4. **Build Failures**: Check build logs in Render dashboard

### Debug Steps:
1. Check Render service logs
2. Test API endpoints directly
3. Verify environment variables
4. Check browser console for errors

## Final URLs
After deployment, your app will be available at:
- **Frontend**: `https://progress-lens-tracker.onrender.com`
- **Backend**: `https://progress-lens-tracker-api.onrender.com`

## Cost
- **Free Tier**: Both services can run on Render's free tier
- **Limitations**: Free tier has sleep after 15 minutes of inactivity
- **Upgrade**: $7/month for always-on services
