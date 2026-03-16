#!/bin/bash

# PWAutoTesnets - One-Command Start Script
# Usage: ./start.sh

set -e

echo "🚀 Starting PWAutoTesnets..."
echo ""

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed or not in PATH"
    echo "Please install Docker Desktop from https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if docker-compose is available
if ! docker compose version &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo "❌ docker compose is not available"
    echo "Please use Docker Desktop 20.10+ or install docker-compose"
    exit 1
fi

# Get the compose command (new or old syntax)
if docker compose version &> /dev/null; then
    COMPOSE_CMD="docker compose"
else
    COMPOSE_CMD="docker-compose"
fi

echo "📦 Using: $COMPOSE_CMD"
echo ""

# Clean up old containers if they exist
echo "🧹 Cleaning up old containers..."
$COMPOSE_CMD down --remove-orphans 2>/dev/null || true

# Build images
echo "🔨 Building Docker images..."
$COMPOSE_CMD build --no-cache

# Start services
echo ""
echo "⚡ Starting services..."
$COMPOSE_CMD up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check if services are healthy
echo ""
echo "✅ Services started:"
$COMPOSE_CMD ps

echo ""
echo "📊 API Server: http://localhost:3000"
echo "🐘 PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""

# Show logs
echo "📝 Service logs (press Ctrl+C to stop watching):"
echo ""
$COMPOSE_CMD logs -f
