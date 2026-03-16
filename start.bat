@echo off
REM PWAutoTesnets - One-Command Start Script (Windows)
REM Usage: start.bat

setlocal enabledelayedexpansion

echo.
echo 🚀 Starting PWAutoTesnets...
echo.

REM Check if Docker is available
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Try new docker compose syntax first
docker compose version >nul 2>&1
if errorlevel 1 (
    REM Fall back to docker-compose command
    docker-compose --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ docker compose is not available
        echo Please use Docker Desktop 20.10+ or install docker-compose
        pause
        exit /b 1
    )
    set COMPOSE_CMD=docker-compose
) else (
    set COMPOSE_CMD=docker compose
)

echo 📦 Using: !COMPOSE_CMD!
echo.

REM Clean up old containers
echo 🧹 Cleaning up old containers...
!COMPOSE_CMD! down --remove-orphans 2>nul

REM Build images
echo 🔨 Building Docker images...
!COMPOSE_CMD! build --no-cache
if errorlevel 1 (
    echo ❌ Build failed
    pause
    exit /b 1
)

REM Start services
echo.
echo ⚡ Starting services...
!COMPOSE_CMD! up -d
if errorlevel 1 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

REM Wait for services
echo.
echo ⏳ Waiting for services to be ready...
timeout /t 15 /nobreak

echo.
echo ✅ Services started:
!COMPOSE_CMD! ps

echo.
echo 📊 API Server: http://localhost:3000
echo 🐘 PostgreSQL: localhost:5432
echo 🔴 Redis: localhost:6379
echo.

echo 📝 Service logs (press Ctrl+C to stop):
echo.
!COMPOSE_CMD! logs -f

pause
