# Migration Validation Plan

## PRE-FLIGHT CHECKS

### Environment & Dependencies
- [ ] Node.js v20+: `node --version`
- [ ] npm packages installed: `npm install` (should be no-op)
- [ ] Docker installed: `docker --version`
- [ ] docker-compose installed: `docker-compose --version`
- [ ] PostgreSQL container image available: `docker images | grep postgres`
- [ ] Redis container image available: `docker images | grep redis`
- [ ] Chromium installed via Playwright: `npx playwright install chromium`
- [ ] TypeScript compiles: `npm run lint` (should produce no errors)

### Local Directory Setup
- [ ] Create `.env` from `.env.example`: `cp .env.example .env`
- [ ] Verify `.env` has non-empty values (especially DATABASE_URL, REDIS_URL)
- [ ] Create artifacts directory: `mkdir -p ./artifacts`
- [ ] Verify artifacts directory is writable: `touch ./artifacts/test.txt && rm ./artifacts/test.txt`
- [ ] Create browser profiles directory: `mkdir -p ~/.testnets-profiles`
- [ ] Verify profiles directory is writable

---

## INFRASTRUCTURE BOOTSTRAP

### Start Services
- [ ] **Start Docker compose**: `docker-compose up -d`
- [ ] **Wait 10 seconds** for services to stabilize
- [ ] **Verify PostgreSQL is healthy**: `docker exec postgres pg_isready -U user -d playwrightautomation`
  - Expected: `accepting connections`
- [ ] **Verify Redis is healthy**: `docker exec redis redis-cli ping`
  - Expected: `PONG`

### Initialize Database
- [ ] **Connect to PostgreSQL**: `docker exec -it postgres psql -U user -d playwrightautomation`
- [ ] **Verify tables exist**: `\dt` (should show `runs` and `run_logs` tables)
- [ ] **Exit postgres shell**: `\q`
- [ ] If tables don't exist, check `src/core/store/PostgresRunStore.ts` initialization logs

### Verify Network
- [ ] **PostgreSQL accessible**: `psql postgresql://user:password@localhost:5432/playwrightautomation -c "SELECT 1"`
- [ ] **Redis accessible**: `redis-cli -h localhost -p 6379 ping`

---

## API SERVER STARTUP (Terminal 1)

### Start API
- [ ] **Terminal 1**: `npm run dev`
- [ ] **Expected output**:
  ```
  ✓ HTTP Server listening on http://localhost:3000
  ✓ Available scenarios:
    - connect_wallet
    - sign_message
    - token_swap
  API endpoints:
    GET  http://localhost:3000/api/runs
    POST http://localhost:3000/api/runs
  ```
- [ ] Wait 5 seconds for startup

### Verify API Health
- [ ] **Terminal 2**: `curl http://localhost:3000/health`
- [ ] **Expected response**:
  ```json
  {"status":"healthy","timestamp":"...","uptime":...}
  ```
- [ ] **List runs**: `curl http://localhost:3000/api/runs`
- [ ] **Expected response**: `{"runs":[],"count":0,"timestamp":"..."}`

### Verify Scenarios Registered
- [ ] Check logs for: `scenarios_registered`
- [ ] Check logs mention: `5 scenarios registered` or similar
- [ ] Verify registry contains: connect_wallet, sign_message, token_swap, switch_network, generic_transaction

---

## WORKER STARTUP (Terminal 3)

### Start Worker Process
- [ ] **Terminal 3**: `npm run worker`
- [ ] **Expected output**: Worker initializes and prints initial state
- [ ] **Check for errors**: No "FATAL" or "ERROR" in first 10 seconds
- [ ] Wait 10 seconds for stabilization

### Verify Worker Configuration
- [ ] Worker is connected to Redis: look for connection message
- [ ] Worker is connected to PostgreSQL: look for connection message
- [ ] Worker is monitoring queue: look for "listening on queue" or similar
- [ ] No port conflicts: Worker shouldn't be trying to bind ports

---

## DATABASE & QUEUE VERIFICATION

### Test Queue Operations (Terminal 2 - API Terminal)
- [ ] **Check if there are any items in queue**:
  - Stop worker (Ctrl+C in Terminal 3)
  - Wait 5 seconds
  - Restart worker
  - Worker should print "queue is empty" or similar

### Test Run Creation
- [ ] **Create a test run**:
  ```bash
  curl -X POST http://localhost:3000/api/runs \
    -H "Content-Type: application/json" \
    -d '{
      "scenarioId": "connect_wallet",
      "profileId": "test-profile",
      "networkId": "ethereum-sepolia",
      "maxAttempts": 1
    }'
  ```
- [ ] **Expected response**: Returns run object with `id`, `status: "queued"`, `attempt: 0`
- [ ] **Verify run is in database**:
  ```bash
  docker exec -it postgres psql -U user -d playwrightautomation -c "SELECT id, status, attempt FROM runs ORDER BY created_at DESC LIMIT 1;"
  ```
- [ ] Expected: One row with status="queued", attempt=0

### Test Queue Item Created
- [ ] **Check Redis queue**:
  ```bash
  redis-cli -h localhost lpush test-queue '{"runId":"test"}'
  redis-cli -h localhost llen test-queue
  ```
- [ ] Expected: queue has items (if worker hasn't consumed them yet)

---

## PLAYWRIGHT DEBUG MODE - METAMASK SELECTORS

### Prepare MetaMask Extension
- [ ] **Download MetaMask** as CRX file or have extension unpacked
- [ ] **Place extension** in known location or browser profile
- [ ] **Open browser manually** with extension: `PWDEBUG=1 npm run worker`

### Debug MetaMask Detection
- [ ] **In Playwright Inspector**:
  - Click "Step over" to advance through WalletDetector.detect()
  - At `page.locator(selector)` calls, manually check selector exists
  - For each MetaMask selector in code:
    - [ ] Copy selector to browser console: `document.querySelectorAll("selector")`
    - [ ] Verify it returns non-zero elements
- [ ] **Test selectors**:
  - [ ] MetaMask popup root: `document.querySelector("#app-content > div:first-child")`
  - [ ] Confirm button: `document.querySelector('[data-testid="page-container-footer-next"]')`
  - [ ] Unlock field: `document.querySelector('input[type="password"]')`

### Debug MetaMask Flow
- [ ] **Test unlock**:
  - Navigate to MetaMask in popup
  - In Playwright inspector, execute: `await page.locator('input[type="password"]').fill("testpass")`
  - Verify password field accepts input
- [ ] **Test button click**:
  - In Playwright inspector, execute: `await page.locator('[data-testid="page-container-footer-next"]').click()`
  - Verify button is clickable

### Validation Checklist
- [ ] All primary selectors exist in current MetaMask version
- [ ] All fallback selectors exist (at least one per action)
- [ ] Selectors don't return elements from other UI (false positives)
- [ ] Text selectors account for current UI language

---

## PLAYWRIGHT DEBUG MODE - RABBY SELECTORS

### Prepare Rabby Extension
- [ ] **Download Rabby** as CRX file or have extension unpacked
- [ ] **Place extension** in separate profile location
- [ ] **Open browser manually** with Rabby: `PWDEBUG=1 npm run worker`

### Debug Rabby Detection
- [ ] **In Playwright Inspector**:
  - [ ] Check for Rabby-specific globals: `window.rabby` exists
  - [ ] Check for Rabby providers: `window.ethereum.isRabby === true`
  - [ ] Verify detection confidence scoring

### Debug Rabby Flow
- [ ] **Test button selectors** (Rabby has different UI):
  - [ ] Primary button class: `.rabby-btn-primary`
  - [ ] Confirm text: Contains "Confirm" or "Approve"
  - [ ] In Playwright inspector, try both: `await page.locator('.rabby-btn-primary').click()`
- [ ] **Test security warnings**:
  - [ ] Trigger a transaction requiring signature
  - [ ] Look for security warning popup
  - [ ] Find "Ignore" or "Proceed" button
  - [ ] Verify it clicks successfully
- [ ] **Test popup lifecycle**:
  - [ ] Trigger wallet action
  - [ ] Measure popup appear time
  - [ ] Verify popup closes after action
  - [ ] Check no popups remain open

### Validation Checklist
- [ ] Rabby popups are detected (have different context)
- [ ] Security warnings are handled automatically
- [ ] Button selectors work with Rabby's CSS structure
- [ ] All transactions complete without selector timeouts

---

## LOCK LIFECYCLE VERIFICATION

### Setup
- [ ] Stop worker: Ctrl+C in Terminal 3
- [ ] Open two terminals for two worker processes

### Test Lock Acquisition
- [ ] **Terminal A**: `RUST_BACKTRACE=1 npm run worker -- --profile=test-1`
- [ ] Wait 5 seconds
- [ ] Check logs: "lock acquired" or "profile locked"
- [ ] **Terminal B**: `RUST_BACKTRACE=1 npm run worker -- --profile=test-1`
- [ ] Expected: Terminal B should wait, then either:
  - Retry lock acquisition (logs show "waiting for lock")
  - Fail with timeout after configured retry attempts

### Test Lock Release
- [ ] Stop Terminal A worker (Ctrl+C)
- [ ] Check logs: "lock released"
- [ ] **Terminal B**: Should now acquire lock (if still running)
- [ ] If Terminal B was waiting, it should now proceed
- [ ] Check logs: "lock acquired after retry"

### Test Stale Lock Detection
- [ ] Kill Terminal A worker abruptly: `killall -9 node`
- [ ] Check lock file still exists: `ls ~/.testnets-locks/test-1.lock.json`
- [ ] **Terminal B**: Should detect stale lock after timeout
- [ ] Check logs: "stale lock detected" or "lock expired"
- [ ] Worker should remove stale lock: `ls ~/.testnets-locks/` (file should disappear)
- [ ] Worker should acquire lock and proceed

### Test Concurrent Access Prevention
- [ ] **Terminal A**: Start with `--profile=test-2`
- [ ] **Terminal B**: Start with `--profile=test-2` (same profile)
- [ ] Verify only ONE worker has the lock
- [ ] Verify the other waits or fails gracefully
- [ ] No data corruption, no two workers using same profile

### Validation Checklist
- [ ] Lock acquisition shows clear logs
- [ ] Lock release is clean
- [ ] Stale locks are detected and removed
- [ ] No concurrent access to same profile
- [ ] Lock file format is valid JSON
- [ ] Lock expiration timeout is enforced

---

## QUEUE & RETRY FLOW

### Test Normal Execution
- [ ] Create a run via API:
  ```bash
  RUN_ID=$(curl -s -X POST http://localhost:3000/api/runs \
    -H "Content-Type: application/json" \
    -d '{"scenarioId":"connect_wallet","profileId":"retry-test","networkId":"sepolia","maxAttempts":3}' \
    | jq -r '.data.id')
  ```
- [ ] **Check status**: `curl http://localhost:3000/api/runs/$RUN_ID`
- [ ] Status should be "queued"
- [ ] Wait 30 seconds
- [ ] **Check status again**: Status should be "running" then eventually "completed" or "failed"

### Test Retry on Transient Error
- [ ] Create run that will timeout:
  ```bash
  RUN_ID=$(curl -s -X POST http://localhost:3000/api/runs \
    -H "Content-Type: application/json" \
    -d '{"scenarioId":"connect_wallet","profileId":"bad-profile","networkId":"sepolia","maxAttempts":3}' \
    | jq -r '.data.id')
  ```
- [ ] **Monitor database**:
  ```bash
  watch -n 1 'docker exec postgres psql -U user -d playwrightautomation -c "SELECT attempt, status, next_attempt_at FROM runs WHERE id='"'"'$RUN_ID'"'"';"'
  ```
- [ ] **Expected sequence**:
  1. First check: attempt=0, status=queued
  2. Worker picks up: attempt=0, status=running
  3. Fails (e.g., profile not found): attempt=0, status=queued, next_attempt_at=(future time)
  4. After delay: attempt=1, status=queued
  5. Retry happens: attempt=1, status=running
  6. Eventually: status=failed (permanent) or status=completed

### Test Queue Acknowledgment
- [ ] Check worker logs for "ack" messages
- [ ] Should see: `queue.ack(item.id)` after each run completes
- [ ] If no ack, item would stay in queue forever
- [ ] Verify no orphaned items in Redis: `redis-cli LLEN pw-queue`

### Test Max Attempts
- [ ] Create run with `maxAttempts: 1`
- [ ] Trigger failure (e.g., invalid profile)
- [ ] **Check database**: `attempt` should be 0 (not retried)
- [ ] Status should be "failed" after first attempt
- [ ] No additional queue items should be created

### Test Queue Backpressure
- [ ] Create 5 runs simultaneously in quick succession
- [ ] Check worker logs: should show processing queue items one by one
- [ ] **Monitor Redis queue**: `redis-cli LLEN pw-queue`
- [ ] Queue should drain gradually (items should not accumulate forever)

### Validation Checklist
- [ ] Each run progresses through status states correctly
- [ ] Retry happens with exponential backoff
- [ ] Queue items are acknowledged and removed
- [ ] Max attempts are respected
- [ ] Transient errors trigger retry
- [ ] Permanent errors don't retry
- [ ] Queue doesn't have orphaned items

---

## ARTIFACTS & TRACING

### Test Screenshot Capture
- [ ] Run a scenario: `curl -X POST http://localhost:3000/api/runs ...`
- [ ] After run completes, check artifacts directory:
  ```bash
  ls -lR ./artifacts/
  ```
- [ ] **Expected structure**:
  ```
  ./artifacts/
    <runId>/
      screenshots/
        connected.png
        navigate-failed.png
      traces/
        trace.zip
      logs/
        console.json
        network.json
      metadata/
        metadata.json
      html/
        page-snapshot.html
  ```
- [ ] Each PNG file should be valid image (not corrupted)
- [ ] Each ZIP file should be valid Playwright trace

### Test Trace File Generation
- [ ] Check trace file exists: `ls ./artifacts/<runId>/traces/`
- [ ] Verify trace is not empty: `unzip -t ./artifacts/<runId>/traces/trace.zip`
- [ ] Expected: "All files OK" message

### Test Console Log Capture
- [ ] Check console logs exist: `cat ./artifacts/<runId>/logs/console.json`
- [ ] Expected: Valid JSON with `console` array
- [ ] Verify contains actual page console messages (not empty)

### Test HTML Snapshot
- [ ] Check HTML exists: `cat ./artifacts/<runId>/html/page-snapshot.html | head -20`
- [ ] Expected: Valid HTML markup (starts with `<!DOCTYPE` or `<html>`)
- [ ] Should contain actual page content, not empty

### Test Artifact Directory Permissions
- [ ] Verify artifacts directory is world-readable (if running as different user):
  ```bash
  ls -ld ./artifacts
  ```
- [ ] Expected: drwxrwxrwx or at least read permissions

### Test Artifact Cleanup on Error
- [ ] Force a scenario failure (e.g., invalid URL)
- [ ] Check artifacts are still captured: `ls ./artifacts/<runId>`
- [ ] **Verify all artifact types are present**: even on failure, should capture screenshot, trace, logs, metadata

### Test Artifacts API
- [ ] List artifacts: `curl http://localhost:3000/api/runs/<runId>/artifacts`
- [ ] **Expected response**: JSON with artifacts array, each with filename, size, type
- [ ] Download artifact: `curl http://localhost:3000/api/runs/<runId>/artifacts/screenshots/connected.png > test.png`
- [ ] Verify downloaded file is valid: `file test.png`

### Validation Checklist
- [ ] All artifact types are created
- [ ] Files are valid (not corrupted, not empty)
- [ ] Directory structure matches specification
- [ ] Artifacts API returns correct metadata
- [ ] Download endpoint works
- [ ] Artifacts captured on both success and failure
- [ ] No stray files in artifacts directory
- [ ] Artifacts directory doesn't grow unbounded

---

## DASHBOARD LIVE UPDATES

### Start Dashboard Service (Terminal 4)
- [ ] **Terminal 4**: Create dashboard entrypoint or use API directly
- [ ] Dashboard should connect to API
- [ ] Expected: No connection errors

### Test Live Updates via Polling
- [ ] **Terminal 2 (API Terminal)**: Create a new run
  ```bash
  curl -X POST http://localhost:3000/api/runs \
    -H "Content-Type: application/json" \
    -d '{"scenarioId":"connect_wallet","profileId":"dashboard-test","networkId":"sepolia","maxAttempts":1}'
  ```
- [ ] **Terminal 4 (Dashboard)**: Poll for updates manually
  ```bash
  curl 'http://localhost:3000/api/runs/stream/updates?since=<2-min-ago>&limit=10'
  ```
- [ ] Expected: Response contains newly created run

### Test Status Transitions
- [ ] Monitor run via dashboard updates
- [ ] **Expected sequence of statuses**:
  1. queued (initial)
  2. running (when worker picks up)
  3. completed/failed/needs_review (when done)
- [ ] Each status transition should appear in next poll
- [ ] No missing intermediate states

### Test Run Details
- [ ] Fetch run details: `curl http://localhost:3000/api/runs/<runId>`
- [ ] Verify all fields present: id, status, attempt, maxAttempts, scenarioId, etc.
- [ ] Verify artifacts are listed correctly

### Test Multiple Runs
- [ ] Create 3 runs rapidly
- [ ] Poll updates: should show all 3
- [ ] Each run should be independent (one failure shouldn't affect others)
- [ ] Attempt numbers should be correct for each

### Test Poll Performance
- [ ] Poll with large `since` window (1 hour ago)
- [ ] Response time should be <1 second
- [ ] If >5 seconds, check database query performance

### Test Cancel Run
- [ ] Create a run, start execution
- [ ] Cancel it: `curl -X POST http://localhost:3000/api/runs/<runId>/cancel`
- [ ] **Expected response**: Run status changes to "cancelled"
- [ ] Worker should stop execution (if still running)
- [ ] Check worker logs: "run cancelled" message

### Validation Checklist
- [ ] Dashboard can connect to API
- [ ] Live updates show new runs
- [ ] Status transitions are visible
- [ ] Run details are complete and accurate
- [ ] Multiple concurrent runs work independently
- [ ] Poll response time is acceptable
- [ ] Cancellation works
- [ ] Artifacts are listed in run details

---

## SECURITY & CLEANUP

### Test Path Traversal Protection
- [ ] Try to access file outside artifacts directory:
  ```bash
  curl 'http://localhost:3000/api/runs/<runId>/artifacts/../../../../../../etc/passwd'
  ```
- [ ] Expected: 404 Not Found or similar error
- [ ] NOT: File contents

### Test Input Validation
- [ ] Try to create run with invalid scenario ID:
  ```bash
  curl -X POST http://localhost:3000/api/runs \
    -H "Content-Type: application/json" \
    -d '{"scenarioId":"nonexistent","profileId":"test","networkId":"test"}'
  ```
- [ ] Expected: 400 Bad Request or run not found error
- [ ] Worker should handle gracefully

### Test Error Logging (No Sensitive Data)
- [ ] Check logs for passwords or secrets:
  ```bash
  grep -i "password\|secret\|key" worker.log
  ```
- [ ] Expected: No actual values logged
- [ ] Only error codes and generic messages

### Cleanup on Shutdown
- [ ] Stop worker: Ctrl+C
- [ ] Check locks are released: `ls ~/.testnets-locks/`
- [ ] Should be empty (all locks released)
- [ ] Stop API: Ctrl+C
- [ ] Stop docker services: `docker-compose down`
- [ ] Check containers stopped: `docker ps`
- [ ] Expected: No pw-auto containers running

### Cleanup Volumes (Optional - Only if Starting Fresh)
- [ ] Remove volumes: `docker-compose down -v`
- [ ] Next startup will create new databases
- [ ] Data will be lost (only for testing)

### Validation Checklist
- [ ] No path traversal attacks possible
- [ ] Invalid input is rejected
- [ ] No secrets in logs
- [ ] Locks are cleaned up
- [ ] Services shut down gracefully

---

## END-TO-END FLOW TEST

### Complete Flow
- [ ] Ensure all services running (API, Worker, Redis, PostgreSQL)
- [ ] **Create run**: `npm run dev` should show it's queued
- [ ] **Worker picks up**: Worker logs should show `run_start`
- [ ] **Scenario executes**: MetaMask/Rabby interaction (if profile available)
- [ ] **Run completes**: Status changes, artifacts saved
- [ ] **Check artifacts**: Screenshots, traces, logs all present
- [ ] **Dashboard shows**: Run appears in list, status correct, details visible
- [ ] **Query API**: All endpoints working
- [ ] **Error handling**: Graceful errors, no crashes
- [ ] **Performance**: Complete flow in <30 seconds for simple scenarios

### Validation Checklist
- [ ] Full lifecycle works end-to-end
- [ ] All components communicate correctly
- [ ] Artifacts are complete
- [ ] No hanging processes
- [ ] All logs are clean (no ERROR level during normal flow)

---

## COMMON ISSUES & RECOVERY

### Issue: "PostgreSQL connection refused"
**Check**:
- [ ] Docker container running: `docker ps | grep postgres`
- [ ] Ports are exposed: `docker port postgres | grep 5432`
- [ ] Database created: `docker exec postgres psql -l`
- [ ] Connection string correct: `.env` has right DATABASE_URL

**Recovery**:
```bash
docker-compose down
docker-compose up -d postgres redis
sleep 10
npm run dev
```

### Issue: "Redis connection refused"
**Check**:
- [ ] Container running: `docker ps | grep redis`
- [ ] Port exposed: `docker port redis | grep 6379`
- [ ] Can connect: `redis-cli ping`

**Recovery**:
```bash
docker-compose restart redis
sleep 5
npm run worker
```

### Issue: "Worker times out waiting for lock"
**Check**:
- [ ] Other worker still running: `ps aux | grep "npm run worker"`
- [ ] Stale lock files: `ls ~/.testnets-locks/`
- [ ] Check lock file timestamp (should be recent)

**Recovery**:
```bash
rm -f ~/.testnets-locks/*.json
killall -9 node
npm run worker
```

### Issue: "Scenario times out on wallet popup"
**Check**:
- [ ] MetaMask/Rabby actually installed in profile
- [ ] Selectors match current wallet version
- [ ] Browser profile exists and is accessible
- [ ] Run in PWDEBUG mode to manually check selectors

**Recovery**:
```bash
PWDEBUG=1 npm run worker
# Manually verify selectors in Playwright inspector
```

### Issue: "Artifacts directory full or disk space"
**Check**:
- [ ] Disk space: `df -h ./artifacts`
- [ ] Old artifacts present: `find ./artifacts -type f -mtime +7 | wc -l`

**Recovery**:
```bash
# Back up if needed
tar -czf artifacts-backup-$(date +%s).tar.gz ./artifacts

# Or just clean old files
find ./artifacts -type f -mtime +7 -delete
```

### Issue: "Dashboard not showing updates"
**Check**:
- [ ] API running: `curl http://localhost:3000/health`
- [ ] Poll endpoint works: `curl 'http://localhost:3000/api/runs/stream/updates?since=...'`
- [ ] Dashboard connection string correct

**Recovery**:
- Restart API: Stop and run `npm run dev` again
- Check browser network tab in DevTools for actual requests
- Verify dashboard is polling, not using wrong URL

---

## SIGN-OFF

When complete, verify:
- [ ] All checklists above are marked complete
- [ ] No active errors in logs (ERROR level messages only expected for intentional failures)
- [ ] All three services running: API (Terminal 1), Worker (Terminal 3), Redis + PostgreSQL
- [ ] At least one successful run created and completed
- [ ] Artifacts captured and accessible via API
- [ ] Dashboard showing live updates
- [ ] No processes consuming excessive CPU/memory
- [ ] No files left in `/tmp` from previous runs

**Project is ready for production deployment** ✓
