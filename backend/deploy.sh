#!/bin/bash

# Progress Lens Tracker Backend Deployment Script
# This script helps deploy the backend to various platforms

set -e  # Exit on any error

echo "🚀 Progress Lens Tracker Backend Deployment Script"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
check_env() {
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.example ]; then
            cp env.example .env
            print_success "Created .env file from template"
            print_warning "Please edit .env file with your configuration before continuing"
            exit 1
        else
            print_error "env.example file not found. Cannot create .env file"
            exit 1
        fi
    fi
}

# Install dependencies
install_deps() {
    print_status "Installing dependencies..."
    if command -v npm &> /dev/null; then
        npm ci --only=production
        print_success "Dependencies installed successfully"
    else
        print_error "npm not found. Please install Node.js and npm"
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    if npm run migrate; then
        print_success "Database migrations completed"
    else
        print_error "Database migrations failed"
        exit 1
    fi
}

# Seed database (optional)
seed_database() {
    read -p "Do you want to seed the database with demo data? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Seeding database with demo data..."
        if npm run seed; then
            print_success "Database seeded successfully"
        else
            print_error "Database seeding failed"
            exit 1
        fi
    else
        print_status "Skipping database seeding"
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    if npm test; then
        print_success "All tests passed"
    else
        print_warning "Some tests failed. Continuing with deployment..."
    fi
}

# Build for production
build_production() {
    print_status "Preparing for production..."
    # Set production environment
    export NODE_ENV=production
    print_success "Production environment configured"
}

# Deploy to local
deploy_local() {
    print_status "Starting local deployment..."
    check_env
    install_deps
    run_migrations
    seed_database
    
    print_success "Local deployment ready!"
    print_status "To start the server, run: npm start"
    print_status "Server will be available at: http://localhost:3001"
}

# Deploy to Docker
deploy_docker() {
    print_status "Building Docker image..."
    
    # Create Dockerfile if it doesn't exist
    if [ ! -f Dockerfile ]; then
        cat > Dockerfile << EOF
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
EOF
        print_success "Created Dockerfile"
    fi
    
    # Build Docker image
    docker build -t progress-lens-api .
    print_success "Docker image built successfully"
    
    # Run container
    print_status "Starting Docker container..."
    docker run -d \
        --name progress-lens-api \
        -p 3001:3001 \
        --env-file .env \
        --restart unless-stopped \
        progress-lens-api
    
    print_success "Docker container started successfully"
    print_status "API available at: http://localhost:3001"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Preparing for Vercel deployment..."
    
    # Create vercel.json if it doesn't exist
    if [ ! -f vercel.json ]; then
        cat > vercel.json << EOF
{
  "version": 2,
  "builds": [
    {
      "src": "src/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
EOF
        print_success "Created vercel.json"
    fi
    
    # Install Vercel CLI if not present
    if ! command -v vercel &> /dev/null; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    print_status "Deploying to Vercel..."
    vercel --prod
    
    print_success "Deployed to Vercel successfully"
}

# Deploy to Railway
deploy_railway() {
    print_status "Preparing for Railway deployment..."
    
    # Create railway.json if it doesn't exist
    if [ ! -f railway.json ]; then
        cat > railway.json << EOF
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
EOF
        print_success "Created railway.json"
    fi
    
    print_status "Deploying to Railway..."
    print_warning "Make sure you have Railway CLI installed and are logged in"
    print_warning "Run: npm install -g @railway/cli && railway login"
    
    railway up
    
    print_success "Deployed to Railway successfully"
}

# Main deployment function
main() {
    echo "Select deployment target:"
    echo "1) Local development"
    echo "2) Docker"
    echo "3) Vercel"
    echo "4) Railway"
    echo "5) Custom (manual steps)"
    
    read -p "Enter your choice (1-5): " choice
    
    case $choice in
        1)
            deploy_local
            ;;
        2)
            deploy_docker
            ;;
        3)
            deploy_vercel
            ;;
        4)
            deploy_railway
            ;;
        5)
            print_status "Manual deployment steps:"
            echo "1. Set up your environment variables"
            echo "2. Install dependencies: npm ci --only=production"
            echo "3. Run migrations: npm run migrate"
            echo "4. Optionally seed database: npm run seed"
            echo "5. Start server: npm start"
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Check if script is being run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
