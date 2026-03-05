#!/bin/bash

# Release script for Docker Compose deployment
# Usage: ./scripts/release.sh [version]

set -e

VERSION=${1:-latest}
IMAGE_NAME="agents-gallery"
REGISTRY=${REGISTRY:-}

echo "🚀 Building release: $VERSION"

# Get git commit hash
COMMIT_HASH=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
echo "📝 Commit: $COMMIT_HASH"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t $IMAGE_NAME:$VERSION -t $IMAGE_NAME:$COMMIT_HASH .

if [ -n "$REGISTRY" ]; then
    echo "📤 Pushing to registry: $REGISTRY"
    docker tag $IMAGE_NAME:$VERSION $REGISTRY/$IMAGE_NAME:$VERSION
    docker tag $IMAGE_NAME:$VERSION $REGISTRY/$IMAGE_NAME:$COMMIT_HASH
    docker push $REGISTRY/$IMAGE_NAME:$VERSION
    docker push $REGISTRY/$IMAGE_NAME:$COMMIT_HASH
fi

echo "✅ Release built successfully!"
echo ""
echo "Images:"
docker images $IMAGE_NAME --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"
echo ""
echo "To deploy:"
echo "  docker compose up -d"
