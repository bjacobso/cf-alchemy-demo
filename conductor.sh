#!/usr/bin/env bash
set -e  # Exit on error

echo "Setting up workspace..."

# Install dependencies
echo "Installing npm dependencies..."
npm install

# Copy environment file from Conductor root
echo "Copying .env from Conductor root..."
cp "$CONDUCTOR_ROOT_PATH/.env" .env

echo "Setup complete!"
