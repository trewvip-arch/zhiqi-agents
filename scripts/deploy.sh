#!/bin/bash

# Deploy script for agents-gallery
# Run this script on the server to update and restart the application

set -e

echo "🚀 Starting deployment..."

# Pull latest code
echo "📦 Pulling latest code..."
git pull origin main

# Rebuild and restart containers
echo "🔨 Building and starting containers..."
docker compose down
docker compose up -d --build

echo "✅ Deployment complete!"
echo "📋 Application running at http://localhost:3000"

# Show container status
docker compose ps
