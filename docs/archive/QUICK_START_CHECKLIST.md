# Quick Start Checklist (5 Minutes to Running)

## Prerequisites (1 min)
```bash
node --version              # Must be v20+
npm install                 # One command
docker --version            # Must exist
npx playwright install chromium  # One-time setup
cp .env.example .env        # Configure environment
```

## Start Infrastructure (2 min)
```bash
docker-compose up -d        # Start PostgreSQL + Redis
sleep 5                      # Wait for health checks
docker-compose ps           # Verify both healthy
```

## Start Services (2 min)
**Terminal 1 - API Server**:
```bash
npm run dev
# Wait for: ✓ HTTP Server listening on http://localhost:3000
```

**Terminal 2 - Health Check** (while Terminal 1 runs):
```bash
curl http://localhost:3000/health
# Should return: {"status":"healthy",...}
```

**Terminal 3 - Worker Process**:
```bash
npm run worker
# Worker should connect to Redis and PostgreSQL
```

## Test End-to-End (Once All Running)
```bash
# Terminal 2: Create a test run
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "connect_wallet",
    "profileId": "test-profile",
    "networkId": "ethereum-sepolia",
    "maxAttempts": 1
  }'

# Watch Terminal 3: Should see worker pick up the run
# Terminal 2: Check status after 30 seconds
curl http://localhost:3000/api/runs/<runId>

# Verify artifacts
ls ./artifacts/<runId>/
```

## Common Errors & Fixes

| Error | Check | Fix |
|-------|-------|-----|
| `ECONNREFUSED:5432` | PostgreSQL not running | `docker-compose up -d postgres` |
| `ECONNREFUSED:6379` | Redis not running | `docker-compose up -d redis` |
| `Database does not exist` | Schema not initialized | Worker will auto-initialize |
| `Cannot find module` | Dependencies missing | `npm install` |
| `PWDEBUG` not recognized | Need to debug selectors | `PWDEBUG=1 npm run worker` |

## Next Steps

1. **MetaMask Testing**:
   - Have MetaMask extension installed
   - Run with: `PWDEBUG=1 npm run worker`
   - Use Playwright Inspector to validate selectors

2. **Rabby Testing**:
   - Install Rabby extension in separate profile
   - Same debug approach as MetaMask

3. **Production Deploy**:
   - Review `FINAL_STAFF_REVIEW.md` for critical fixes
   - Run `MIGRATION_VALIDATION_PLAN.md` complete checklist
   - Set env vars for production (DATABASE_URL, REDIS_URL, APP_PORT)

## Project Structure
```
src/
  index.ts                   # API entrypoint (npm run dev)
  main.ts                    # Service initialization
  core/worker/Worker.ts      # Worker entrypoint (npm run worker)
  api/server.ts              # Express HTTP setup
  core/scenario/             # Scenario implementations
  core/wallet/               # Wallet detection/control
  dashboard/                 # Frontend client
.env.example                 # Copy to .env
docker-compose.yml           # PostgreSQL + Redis
```

## Support

Check these docs in order:
1. `README.md` - Architecture overview
2. `docs/runbook.md` - Operational guide
3. `STAFF_REVIEW.md` - Known issues
4. `FINAL_STAFF_REVIEW.md` - Critical fixes needed
5. `MIGRATION_VALIDATION_PLAN.md` - Full testing guide
