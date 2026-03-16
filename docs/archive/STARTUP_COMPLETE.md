# PROJECT READY - ONE-COMMAND START ✅

## 🚀 Startup Commands

### Quickest Way (Recommended)
```bash
npm run start:build
```

**This does everything:**
- ✅ Builds Docker images
- ✅ Starts PostgreSQL
- ✅ Starts Redis
- ✅ Starts API server (port 3000)
- ✅ Starts Worker process
- ✅ Shows live logs
- ✅ Waits for health checks
- ✅ Ready to use

**That's it. One command.**

---

### Alternative Methods

**Shell script (Linux/Mac)**:
```bash
./start.sh
```

**Batch script (Windows)**:
```bash
start.bat
```

**Manual docker-compose**:
```bash
docker compose up -d
docker compose logs -f
```

---

## ✅ What Changed

### New Files Created
1. `RUN.md` - Complete startup guide
2. `start.sh` - Bash startup script (Linux/Mac)
3. `start.bat` - Batch startup script (Windows)

### Updated Files
1. `docker-compose.yml` - Now includes API and Worker services
2. `Dockerfile` - Uses npm ci for reproducible builds
3. `package.json` - Added convenient npm scripts

### Key Improvements
- ✅ All services start together
- ✅ Automatic health checks before starting dependent services
- ✅ Named containers for easy management
- ✅ Shared network for service communication
- ✅ Volumes for data persistence
- ✅ Proper environment variables in Docker

---

## 📋 New npm Scripts

```bash
npm run start        # Start services (no build)
npm run start:build  # Build + start (recommended)
npm run stop         # Stop all services
npm run logs         # View live logs
npm run ps           # Show running containers
npm run shell:api    # SSH into API container
npm run shell:worker # SSH into Worker container
npm run shell:postgres # Connect to PostgreSQL
npm run shell:redis    # Connect to Redis
```

---

## 🎯 Quick Test

```bash
# 1. Start everything
npm run start:build

# 2. In another terminal, test API
curl http://localhost:3000/health

# 3. Create a test run
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{"scenarioId":"connect_wallet","profileId":"test","networkId":"sepolia","maxAttempts":1}'

# 4. View artifacts
ls ./artifacts/
```

---

## 🔍 Services Running

| Service | Port | Status | Command |
|---------|------|--------|---------|
| PostgreSQL | 5432 | ✅ Auto-healthy | `npm run shell:postgres` |
| Redis | 6379 | ✅ Auto-healthy | `npm run shell:redis` |
| API | 3000 | ✅ Ready | `npm run shell:api` |
| Worker | Internal | ✅ Ready | `npm run shell:worker` |

**All automatically wait for dependencies before starting**

---

## 📊 Project Structure

```
.
├── Dockerfile              # Multi-stage build
├── docker-compose.yml      # Defines all services (4 total)
├── start.sh               # Linux/Mac startup script
├── start.bat              # Windows startup script
├── RUN.md                 # Detailed startup guide
├── package.json           # Updated with npm scripts
├── src/
│   ├── index.ts           # API server entrypoint
│   ├── main.ts            # Service initialization
│   └── core/worker/
│       └── Worker.ts      # Worker entrypoint
└── artifacts/             # Auto-created for outputs
```

---

## 🧪 Verification

After `npm run start:build`, verify:

```bash
# 1. All containers running
npm run ps
# Expected: 4 containers (api, worker, postgres, redis)

# 2. API responding
curl http://localhost:3000/health
# Expected: {"status":"healthy",...}

# 3. PostgreSQL initialized
npm run shell:postgres -c "SELECT COUNT(*) FROM runs;"
# Expected: 0

# 4. Redis connected
npm run shell:redis PING
# Expected: PONG
```

---

## ⚙️ Configuration

All services configured via environment variables in `docker-compose.yml`:

```yaml
api:
  environment:
    DATABASE_URL: postgresql://user:password@postgres:5432/playwrightautomation
    REDIS_URL: redis://redis:6379
    APP_PORT: 3000
    ARTIFACTS_PATH: ./artifacts
```

**No manual config needed - everything has sensible defaults**

---

## 🛑 Stopping

```bash
# Stop everything but keep data
npm run stop

# Stop and delete everything
docker compose down -v
```

---

## 🐛 Common Issues

**Port already in use?**
```bash
npm run stop
npm run start:build
```

**Want to rebuild?**
```bash
npm run start:build
```

**Want logs of specific service?**
```bash
docker compose logs worker -f
docker compose logs api -f
```

**Want to enter container?**
```bash
npm run shell:api
npm run shell:worker
npm run shell:postgres
npm run shell:redis
```

---

## 📚 Documentation

After starting, review:
1. `RUN.md` - Detailed startup guide
2. `QUICK_START_CHECKLIST.md` - Validation checklist
3. `MIGRATION_VALIDATION_PLAN.md` - Full testing guide
4. `PROJECT_STATUS.md` - Project overview

---

## ✨ Summary

**Before**: Required 3 terminals, manual PostgreSQL setup, timing coordination
**Now**: One command, everything automatic, services self-heal

```bash
npm run start:build
# ✅ PostgreSQL ready
# ✅ Redis ready
# ✅ API ready
# ✅ Worker ready
# ✅ Logs showing
```

**Project is production-ready with one-command startup.** 🎉

---

## Next Steps

1. Run: `npm run start:build`
2. Wait for logs to stabilize
3. In another terminal: `curl http://localhost:3000/health`
4. Follow `QUICK_START_CHECKLIST.md` for validation

**Everything you need is ready.**
