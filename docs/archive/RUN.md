# PWAutoTesnets - Quick Start Guide

## One-Command Startup 🚀

### Option 1: Using npm (Recommended)

```bash
npm run start:build
```

This single command will:
1. Build Docker images
2. Start all services (PostgreSQL, Redis, API, Worker)
3. Show live logs
4. Wait for services to be healthy
5. Display API endpoint: http://localhost:3000

**Press Ctrl+C to stop watching logs** (services keep running in background)

---

### Option 2: Using shell script

**Linux/Mac**:
```bash
chmod +x start.sh
./start.sh
```

**Windows**:
```bash
start.bat
```

These scripts do the same as `npm run start:build`.

---

### Option 3: Manual docker-compose (if you prefer)

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop when done
docker compose down
```

---

## What Gets Started

| Service | Port | Status |
|---------|------|--------|
| 🟢 PostgreSQL | 5432 | Ready |
| 🔴 Redis | 6379 | Ready |
| 🌐 API Server | 3000 | Ready |
| 🔨 Worker | Internal | Ready |

---

## Quick Commands

```bash
# View all services
npm run ps

# View live logs
npm run logs

# Stop everything
npm run stop

# Shell access to containers
npm run shell:api       # SSH into API container
npm run shell:worker    # SSH into Worker container
npm run shell:postgres  # Connect to PostgreSQL
npm run shell:redis     # Connect to Redis
```

---

## Test the API

Once running, open a new terminal and test:

```bash
# Health check
curl http://localhost:3000/health

# List runs
curl http://localhost:3000/api/runs

# Create a test run
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "connect_wallet",
    "profileId": "test-profile",
    "networkId": "ethereum-sepolia",
    "maxAttempts": 1
  }'
```

---

## Troubleshooting

### "docker compose not found"
- Use Windows PowerShell or WSL 2 terminal
- Ensure Docker Desktop is running
- Update Docker Desktop to 20.10+

### "Port 3000 already in use"
```bash
# Stop the previous instance
npm run stop

# Or change port in docker-compose.yml
```

### "PostgreSQL connection refused"
```bash
# Check if postgres container is healthy
npm run ps

# View postgres logs
docker compose logs postgres

# Restart postgres
docker compose restart postgres
```

### "Permission denied" on start.sh
```bash
chmod +x start.sh
./start.sh
```

---

## Development Mode

To develop locally without Docker:

```bash
# Terminal 1: Start PostgreSQL and Redis manually
docker compose up -d postgres redis

# Terminal 2: Start API
npm run dev

# Terminal 3: Start Worker
npm run worker
```

Then access API at http://localhost:3000

---

## Cleanup

```bash
# Stop all services but keep data
npm run stop

# Stop and remove all containers and volumes (WARNING: deletes data)
docker compose down -v
```

---

## Logs Location

Logs are displayed in terminal when running:
```bash
npm run logs
```

Or access via containers:
```bash
docker compose logs api       # API logs
docker compose logs worker    # Worker logs
docker compose logs postgres  # PostgreSQL logs
docker compose logs redis     # Redis logs
```

---

## Next Steps

1. ✅ Services are running
2. ✅ API is at http://localhost:3000
3. Review `QUICK_START_CHECKLIST.md` for testing
4. Review `MIGRATION_VALIDATION_PLAN.md` for comprehensive validation

---

**That's it! Everything runs with one command.** 🎉
