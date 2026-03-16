# Staff-Level Code Review

## 1. CRITICAL ISSUES

### 1.1 Hardcoded `/tmp` paths break in production
**Files**: `src/core/worker/Worker.ts` (lines 193, 205, 279), `src/core/scenario/ScenarioUtils.ts` (line 173)
**Risk**: Traces and screenshots written to `/tmp` will be lost on container restart
**Impact**: Artifacts not persisted, violations of compliance/debugging requirements
**Fix**: Use `artifactsPath` environment variable or dedicated artifacts directory
```typescript
// WRONG
await page.stopTracing(path.join("/tmp", `${run.id}-trace.zip`))

// CORRECT
await page.stopTracing(path.join(process.env.ARTIFACTS_PATH || "./artifacts", `${run.id}-trace.zip`))
```

### 1.2 Unsafe file operations without `as any` type casts
**Files**: `src/main.ts` (lines 72, 126, 150), `src/core/worker/Worker.ts` (line 174), `src/api/routes.ts` (line 65)
**Risk**: Type safety violation, bypasses compiler checks
**Impact**: Runtime errors possible, reduces refactoring safety
**Count**: 5 instances of `as any`

### 1.3 Race condition in ProfileLock concurrent access
**File**: `src/core/browser/ProfileLock.ts`
**Risk**: Between reading lock state (lines 82, 96, 124) and writing refresh (line 110), another process could delete it
**Impact**: Multiple workers may acquire same profile simultaneously
**Timeline**:
1. Worker A reads lock (success)
2. Worker B acquires and releases lock
3. Worker A tries to refresh - race condition
**Scenario**:
- `refresh()` at line 96 reads state, but between read and write at line 110, `tryResolveStaleLock()` could delete it

### 1.4 Directory traversal vulnerability in artifact listing incomplete
**File**: `src/api/server.ts` (lines 225-249)
**Risk**: While `getArtifactStream()` validates individual files, listing endpoint doesn't check `fs.readdirSync()` results
**Impact**: Could list files from parent directories if symlink exists
**Fix**: Add normalization check for each file path before adding to artifact list

### 1.5 MetaMask hardcoded as default without wallet detection
**File**: `src/core/worker/Worker.ts` (line 162)
**Risk**: Always uses MetaMask controller regardless of actual wallet installed
**Impact**: Won't work with Rabby, other wallets
**Current code**:
```typescript
const walletController = new MetaMaskController(); // Default to MetaMask
```
**Should detect first**:
```typescript
const detection = await walletManager.detect(page);
const walletController = detection?.kind === "rabby"
  ? new RabbyController()
  : new MetaMaskController();
```

## 2. IMPORTANT ISSUES

### 2.1 Silent error suppression hides bugs
**Files**: `src/core/browser/BrowserManager.ts:78`, `src/core/browser/ProfileLock.ts:138,148`, `src/core/worker/Worker.ts:194-195, 206, 219, 228, 280`
**Risk**: Errors logged nowhere, difficult to debug failures
**Example**:
```typescript
this.lock.refresh(profileId).catch(() => {});  // Silent fail
```
**Impact**: Lock refresh failures undetected, could lead to orphaned locks
**Fix**: Add logger.warn() before silencing

### 2.2 Playwright assumptions about popup windows incorrect
**File**: `src/core/scenario/ScenarioUtils.ts`, `src/core/wallet/metamask/MetaMaskController.ts`
**Risk**: Code assumes popup appears synchronously or within single promise
**Real behavior**: Wallet popup is separate context, may take multiple event loops
**Assumption**: `page.locator()` can reach wallet popup - FALSE
- Wallet popups are in different `BrowserContext`
- Main page cannot directly interact with extension popups
- Current code would timeout waiting for selectors in popup

### 2.3 Test mocks don't reflect Playwright behavior
**File**: `tests/wallet-detector.test.ts` (lines 38-58)
**Issues**:
- Mock `locator()` returns fixed stub, never changes visibility
- Real `page.locator()` returns dynamic locator that reflects DOM changes
- Test pageHandle mock never shows errors or timeouts
- Tests pass but real code would fail on actual pages

### 2.4 Incomplete error classification
**File**: `src/shared/errors.ts` (implicitly used in Worker.ts)
**Risk**: Some errors impossible to classify (e.g., OS-level file permission errors)
**Impact**: Falls through to "unknown" category with no retry
**Example**: `EACCES` (permission denied on lock file) treated same as `wallet_unknown_state`

### 2.5 Missing null checks on optional properties
**Files**: `src/core/worker/Worker.ts:169`, `src/api/server.ts` artifact handling
**Risk**: If `options` undefined, `options?.dappUrl` works but fallback to "about:blank" might not be intentional
**Impact**: Unexpected dApp URLs, scenario execution differs from intent

### 2.6 Page handle leak potential
**File**: `src/core/worker/Worker.ts:150-288`
**Risk**: If `engine.runById()` throws synchronously after page creation but before try block, finally clause runs but page might be created twice
**Timeline**:
1. `page = await pageFactory.create()` (line 102)
2. If error here, caught at line 103, page set to null
3. OK so far
**Issue**: If error in `engine.runById()` setup but BEFORE line 168, then finally runs
**Current safeguard**: activeRuns check prevents double execution

### 2.7 Database schema assumptions in PostgresRunStore
**Risk**: Code assumes specific column names and types
**Impact**: If migration changes schema but code not updated, silent data corruption
**Example**: Code assumes `lastErrorCode` VARCHAR column exists, if missing, UPDATE silently fails

## 3. NICE-TO-HAVE ISSUES

### 3.1 Missing return type annotations
**Files**: Many functions return inferred types
**Impact**: IDE assistance reduced, future refactoring risky
**Examples**: `FileArtifactWriter.ensureDir()`, `ProfileLock.tryResolveStaleLock()`

### 3.2 Hardcoded timeouts scattered throughout
**Files**: `ConnectWalletScenario.ts:44`, `SignMessageScenario.ts`, multiple controllers
**Impact**: Not configurable per environment, hard to tune performance
**Could**: Accept timeout config object

### 3.3 No validation of RunQueuePayload format
**File**: `src/core/queue/RedisQueue.ts`
**Risk**: Malformed JSON from Redis not caught
**Impact**: Worker crashes on corrupt queue item

### 3.4 Incomplete Playwright page context lifecycle
**Risk**: Code doesn't handle `page.close()` errors
**Impact**: If close fails, resource leak undetected
**File**: `src/core/worker/Worker.ts:286`

### 3.5 No graceful degradation if artifacts service unavailable
**File**: `src/core/worker/Worker.ts:199-201`
**Risk**: Scenario continues without artifacts, no clear indication in logs
**Impact**: Missing debugging data

## 4. DOCUMENTATION/RUNTIME MISMATCHES

### 4.1 README says "API + Worker" in npm run dev but only runs API
**File**: `package.json` + `src/index.ts`
**Reality**: API server only, worker must be separate (`npm run worker`)
**Impact**: User confusion, worker not starting

### 4.2 Docs mention "cli -- run-scenario" but command doesn't exist
**File**: `docs/runbook.md` lines 39-42
**Reality**: No CLI entrypoint implemented
**Impact**: Misleading documentation

### 4.3 Dashboard script removed from package.json but README not updated
**Impact**: New developers try `npm run dashboard`, get error

## 5. ONLY CORRECTED FILES

### Critical fixes required:
1. `src/core/worker/Worker.ts` - Replace `/tmp` paths, detect wallet type, add error logging
2. `src/core/browser/ProfileLock.ts` - Add atomic lock refresh, reduce race window
3. `src/api/server.ts` - Validate artifact paths in listing endpoint
4. `src/main.ts` - Remove `as any` casts
5. `src/core/scenario/ScenarioUtils.ts` - Replace `/tmp` with proper artifacts path
6. `tests/wallet-detector.test.ts` - Update mocks to reflect real Playwright behavior

### Important fixes:
7. `src/core/browser/BrowserManager.ts` - Add error logging to lock refresh
8. `src/api/routes.ts` - Remove `as any` cast
9. Documentation files - Update runbook and README for accuracy

## 6. FINAL LAUNCH CHECKLIST

- [ ] **Critical**: Replace all `/tmp` paths with `ARTIFACTS_PATH` environment variable
- [ ] **Critical**: Fix wallet detection - don't hardcode MetaMask
- [ ] **Critical**: Fix ProfileLock race condition with atomic operations
- [ ] **Critical**: Validate artifact listing doesn't follow symlinks
- [ ] **Important**: Add error logging to all `.catch(() => {})` statements
- [ ] **Important**: Remove all `as any` type casts (5 instances)
- [ ] **Important**: Update tests to reflect real Playwright popup behavior
- [ ] **Important**: Update documentation (runbook, README) for npm run dev accuracy
- [ ] **Nice**: Add return type annotations to all functions
- [ ] **Nice**: Make timeouts configurable
- [ ] **Nice**: Add graceful degradation for artifacts service errors
- [ ] Verify TypeScript compilation: `npm run lint` ✓
- [ ] Run tests: `npm run test`
- [ ] Manual smoke test: `npm run dev` → API starts, can create run
- [ ] Manual smoke test: `npm run worker` → Worker picks up and executes run
- [ ] Verify artifacts actually written to `ARTIFACTS_PATH`, not `/tmp`
- [ ] Check Redis connection resilience (restart redis, app recovers)
- [ ] Check database connection resilience (restart postgres, app recovers)
- [ ] Verify path traversal protection works (try accessing `../../../etc/passwd`)
- [ ] Load test: 10 concurrent runs, no profile locks held after completion
- [ ] Security audit: No secrets logged, all file operations validated
- [ ] Performance: Worker can process 5 runs/minute sustainably

## Summary

**Ready for production?** No, not until 5 critical issues are fixed.

**Critical path items** (block launch):
1. Fix `/tmp` → artifacts path (affects compliance)
2. Fix wallet detection hardcoding (affects functionality)
3. Fix ProfileLock race condition (affects reliability)
4. Fix artifact path traversal (security)
5. Add error logging to silent catches (debugging)

**Timeline**: ~4 hours to fix all critical + important issues
