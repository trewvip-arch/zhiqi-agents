#!/bin/bash

# Package source code for deployment
# Usage: ./scripts/package.sh [version]

set -e

VERSION=${1:-$(date +%Y%m%d%H%M%S)}
PACKAGE_NAME="agents-gallery-${VERSION}"
OUTPUT_DIR="dist"
TARBALL="${OUTPUT_DIR}/${PACKAGE_NAME}.tar.gz"

echo "📦 Packaging source code: $PACKAGE_NAME"

# Create output directory
mkdir -p $OUTPUT_DIR

# Create temporary directory
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Copy source files
echo "📁 Copying files..."
cp -r src $TEMP_DIR/
cp -r public $TEMP_DIR/
cp package.json package-lock.json $TEMP_DIR/
cp next.config.mjs $TEMP_DIR/
cp tailwind.config.ts $TEMP_DIR/
cp tsconfig.json $TEMP_DIR/
cp postcss.config.js $TEMP_DIR/
cp Dockerfile $TEMP_DIR/
cp docker-compose.yml $TEMP_DIR/
cp .dockerignore $TEMP_DIR/
cp .env.example $TEMP_DIR/

# Copy scripts if exists
if [ -d "scripts" ]; then
    cp -r scripts $TEMP_DIR/
fi

# Create tarball
echo "🗜️  Creating tarball..."
tar -czf $TARBALL -C $TEMP_DIR .

# Calculate checksum
CHECKSUM=$(sha256sum $TARBALL | cut -d' ' -f1)
echo "$CHECKSUM  $TARBALL" > "${TARBALL}.sha256"

# Get file size
SIZE=$(ls -lh $TARBALL | awk '{print $5}')

echo ""
echo "✅ Package created successfully!"
echo ""
echo "Output: $TARBALL"
echo "Size:   $SIZE"
echo "SHA256: $CHECKSUM"
echo ""
echo "To deploy:"
echo "  1. Copy $TARBALL to server"
echo "  2. Extract: tar -xzf ${PACKAGE_NAME}.tar.gz"
echo "  3. Run: docker compose up -d --build"
