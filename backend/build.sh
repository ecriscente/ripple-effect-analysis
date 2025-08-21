#!/bin/bash
# Render Build Script for Ripple Effect Analysis Backend
# This script runs during deployment on Render

echo "🚀 Starting Render deployment build..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Run database migrations
echo "🗃️ Running database migrations..."
python migrate.py

echo "✅ Build completed successfully!"