# FINAL STAFF-LEVEL SELF-REVIEW

## 1. CRITICAL ISSUES

### 1.1 Silent error catch without explanation ❌ NEEDS FIX
**File**: `src/core/worker/Worker.ts` (line 227, 239, 299)
**Issue**: `.catch(() => {})` with empty braces and no explanation
- Line 227: `await page.stopTracing(traceFile).catch(() => { });` (followed by comment on line 230)
- Line 239: `} catch (e) { }` (no comment at all)
- Line 299: `.catch(() => { /* comment */ })` (OK, has comment)

**Risk**: Errors silently disappear, makes debugging impossible
**Fix**: Add descriptive comment before each silent catch explaining why error is ignored

### 1.2 Test mocks don't reflect Playwright reality ❌ BREAKS TESTS
**File**: `tests/wallet-detector.test.ts` (lines 38-58)
**Issue**:
- `isVisible()` always returns true (real: can throw timeout, return false)
- `locator()` never changes state (real: reflects DOM changes)
- `textContent()` always returns "" (real: can fail, return null)
- Tests pass but would fail on real page

**Risk**: False confidence in detector logic, detector broken on real pages
**Example**:
```typescript
// Mock always returns true
isVisible: async () => true
// Real behavior
isVisible: async () => throws TimeoutError | returns boolean | returns false
```

### 1.3 Wallet popup detection assumes wrong context ❌ UNREACHABLE CODE
**File**: `src/core/wallet/metamask/MetaMaskSelectors.ts` (line 93)
**Issue**:
```typescript
export async function waitForMetaMaskPopup(page: any, timeoutMs: number = 5000): Promise<void> {
  try {
    await page.locator(METAMASK_SELECTORS.popupRoot).waitFor({ timeout: timeoutMs });
```

**Problem**: `page` is main page context, MetaMask popup is in different BrowserContext
- Main page cannot reach extension popup DOM
- `page.locator()` cannot find popup selectors
- This function will always timeout

**Risk**: Wallet popup detection fails silently, scenarios can't reach wallet popups
**Reality**: Need to:
1. Find popup's BrowserContext via `browser.contexts()`
2. Get page from popup context
3. Use popup page for selectors, not main page

### 1.4 Empty catch block without explanation ❌ HIDES BUGS
**File**: `src/core/worker/Worker.ts` (line 239)
**Issue**:
```typescript
try {
  const logs = await this.artifacts.captureLogs(page, run.id, `failure-${scenarioRun.attempt}`);
  consoleLogsPath = logs.consolePath;
  networkLogsPath = logs.networkPath;
} catch (e) { }  // <-- NO COMMENT
```

**Risk**: If captureLogs fails, consoleLogsPath and networkLogsPath stay undefined with no indication why
**Current behavior**: `const artifacts = { ..., consoleLogsPath, networkLogsPath }` - passes undefined, not obvious it failed

### 1.5 Concurrent access without synchronization ❌ RACE CONDITION
**File**: `src/core/browser/ProfileLock.ts`
**Issue**: Between `readLock()` and write in `refresh()`, another process can delete lock
```typescript
async refresh(profileId: ProfileId): Promise<ProfileLockState> {
  const lockPath = this.getLockPath(profileId);
  const state = await this.readLock(lockPath);  // <- Read
  if (!state) throw new Error(...);
  ...
  await fs.writeFile(lockPath, JSON.stringify(refreshed)); // <- Write (race window here)
}
```

**Scenario**:
1. Worker A reads lock successfully
2. Stale lock timeout, Worker B deletes lock
3. Worker A tries to writeFile to deleted path
4. writeFile succeeds (creates new file), silently corrupts state

**Fix**: Use atomic `compareAndSet` or file locking

## 2. IMPORTANT ISSUES

### 2.1 Console calls in utility functions (acceptable)
**Files**: `src/config/redis.ts`, `src/core/store/PostgresRunStore.ts`, `src/index.ts`, FileArtifactWriter.ts
**Status**: Only in initialization/setup functions - acceptable for startup logging
**No action needed** - these are not in hot paths

### 2.2 Test doesn't exercise real wallet behavior
**File**: `tests/wallet-detector.test.ts`
**Issue**: Only tests that detector picks highest confidence score
- Doesn't test actual wallet controller methods (detect, unlock, connect)
- Doesn't test selector fallbacks
- Doesn't test error handling
- Doesn't test timeout behavior

**Reality**: Controllers have ~550 lines of real logic untested

### 2.3 Missing validation of queue items
**File**: `src/core/worker/Worker.ts` (line 54)
**Issue**:
```typescript
const item = await this.queue.dequeue({ waitMs: DEFAULT_QUEUE_WAIT_MS });
if (!item) return false;
// Item payload could be malformed JSON, not validated
```

**Risk**: If Redis has corrupted data, `item.payload.runId` could be undefined, causing silent failures

### 2.4 Uninitialized variables in error path
**File**: `src/core/worker/Worker.ts` (lines 233-234)
**Issue**:
```typescript
let consoleLogsPath: string | undefined;
let networkLogsPath: string | undefined;
try {
  const logs = await this.artifacts.captureLogs(...);
  consoleLogsPath = logs.consolePath;
  networkLogsPath = logs.networkPath;
} catch (e) { }  // <- If fails, remain undefined
// Later: const artifacts = { ..., consoleLogsPath, networkLogsPath };
```

**Risk**: Undefined paths passed to markNeedsReview/markQueued/markFailed - could corrupt database if not nullable

### 2.5 Hardcoded dApp URL in Worker
**File**: `src/core/worker/Worker.ts` (line 198)
**Issue**:
```typescript
options: {
  dappUrl: "https://example.com",  // <- HARDCODED
  maxRetries: 3,
  timeoutMs: 30000
}
```

**Risk**: All scenarios use same dummy URL regardless of what was requested
**Should**: Use value from run context or options parameter

## 3. NICE-TO-HAVE ISSUES

### 3.1 Excessive synchronous waits
**Count**: 34 `waitForTimeout()` and `delay()` calls in code
**Location**: ScenarioUtils, scenario implementations, wallet controllers
**Could**: Replace with `page.waitForFunction()` or event-based waits for efficiency

### 3.2 Implicit 'any' type in wallet detection
**File**: `src/core/wallet/MetaMaskSelectors.ts` (line 91)
**Issue**: `export async function waitForMetaMaskPopup(page: any, ...)`
**Should**: Import PageHandle type instead of using `any`

### 3.3 Test lacks comprehensive assertions
**File**: `tests/wallet-detector.test.ts`
**Issue**: Only 2 tests covering edge cases
- No test for detection with missing controllers
- No test for timeout behavior
- No test for logger integration
- No test for detector state between calls

### 3.4 Missing error codes in classification
**File**: `src/shared/errors.ts`
**Issue**: Some errors map to "unknown" instead of specific codes
- OS-level errors (EACCES, EPERM) not classified
- Playwright internal errors not distinguished
- Database connection errors not classified

## 4. ONLY CORRECTED FILES IN THIS SESSION

No changes in this review pass - all issues already identified in STAFF_REVIEW.md.

**Files with known issues that need attention:**
1. `src/core/worker/Worker.ts` - Silent catches, hardcoded dApp URL, empty catch block
2. `src/core/wallet/metamask/MetaMaskSelectors.ts` - Unreachable popup detection
3. `src/core/browser/ProfileLock.ts` - Race condition in refresh
4. `tests/wallet-detector.test.ts` - Mock doesn't reflect reality

## 5. FINAL LAUNCH CHECKLIST

### Pre-Launch (MUST COMPLETE)
- [ ] **CRITICAL**: Add comments to all `.catch(() => {})` blocks explaining why error is ignored
  - Affects: Worker.ts (3 instances), scenarios, controllers
- [ ] **CRITICAL**: Fix test mocks to throw timeouts when appropriate, track visibility changes
- [ ] **CRITICAL**: Rewrite wallet popup detection to use correct BrowserContext
- [ ] **CRITICAL**: Add error logging to empty catch block at Worker.ts:239
- [ ] **CRITICAL**: Fix race condition in ProfileLock.refresh() with atomic write
- [ ] **IMPORTANT**: Validate queue item payload format before using
- [ ] **IMPORTANT**: Replace hardcoded "https://example.com" with actual dApp URL from run/options
- [ ] **IMPORTANT**: Add return type annotations to all functions (TypeScript strict)

### Code Quality Gate
- [ ] All `.catch()` blocks have explanatory comments (regex: `\.catch\s*\(\s*\(\s*\)\s*\)`)
- [ ] No empty `catch (e) { }` blocks without comments
- [ ] No `any` types except where absolutely necessary (currently 5+ instances to review)
- [ ] All async operations properly awaited or intentionally fire-and-forget
- [ ] All file operations have error paths
- [ ] Tests exercise real behavior, not just happy path

### Deployment Gate
- [ ] Wallet popup detection works on real MetaMask
- [ ] Worker can handle 10 concurrent runs without deadlock
- [ ] ProfileLock handles stale locks without data corruption
- [ ] Queue recovery works after restart
- [ ] Artifacts captured for all failure modes
- [ ] No silent failures (all `.catch()` have logging)

### Documentation Gate
- [ ] README matches actual npm scripts (fixed)
- [ ] Runbook matches actual API endpoints (fixed)
- [ ] Selector guide matches actual controller code (fixed)
- [ ] STAFF_REVIEW.md documented all issues (complete)
- [ ] REVIEW_CORRECTIONS_SUMMARY.md documented fixes (complete)

---

## Summary

**Readiness**: **NOT READY** - 5 critical issues block launch

**Critical path to launch**:
1. Fix silent catches (10 min)
2. Fix test mocks (30 min)
3. Fix popup detection - REQUIRES REDESIGN (2-4 hours)
4. Fix ProfileLock race (30 min)
5. Validate queue items (15 min)

**Estimated time to production-ready**: ~6 hours

**Risk level**: HIGH without fixes
- Wallet interaction will silently fail
- Popup detection unreachable
- Test false confidence
- Race conditions possible
