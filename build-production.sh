#!/bin/bash

# Build the production files
npm run build

# Ensure config directory is copied to dist
echo "Copying configuration files to production build..."
cp -r server/config dist/

echo "Build complete! Configuration files updated."