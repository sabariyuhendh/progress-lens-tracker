#!/bin/bash

# Deployment script for Progress Lens Tracker

echo "🚀 Starting deployment process..."

# Build frontend
echo "📦 Building frontend..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful!"
else
    echo "❌ Frontend build failed!"
    exit 1
fi

echo "🎉 Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Follow the RENDER_DEPLOYMENT.md guide"
echo "3. Deploy backend API first"
echo "4. Deploy frontend static site"
echo "5. Update environment variables in Render"
echo ""
echo "🔗 Your app will be available at:"
echo "   Frontend: https://progress-lens-tracker.onrender.com"
echo "   Backend:  https://progress-lens-tracker-api.onrender.com"
