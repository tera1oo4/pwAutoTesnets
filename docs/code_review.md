# pwAutoTestnets — Engineering Review

---

## PART 1 — CODE REVIEW

---

### CRITICAL

---

#### C1. Extension Loading Is Completely Missing

**Files:** [PlaywrightBrowserDriver.ts](file:///d:/code/pwAutoTesnets/src/core/browser/PlaywrightBrowserDriver.ts), [main.ts](file:///d:/code/pwAutoTesnets/src/main.ts)

**Problem:** `PlaywrightBrowserDriver.launch()` launches a bare Chromium instance via `chromium.launch()`. It never loads any wallet extension. There is no `--disable-extensions-except=...` or `--load-extension=...` argument passed, no `userDataDir` with a pre-installed extension, no `chromium.launchPersistentContext()` call. The `profile.userDataDir` is read but only used to pass an empty `storageState` — it is never passed as a persistent context path.

**Why it matters:** The entire wallet automation layer (MetaMask/Rabby detection, unlock, connect, sign) is built around interacting with a browser extension popup. Without loading the extension, every single wallet operation will fail with `wallet_unknown_state`. This makes the project non-functional for its stated purpose.

**What happens if not fixed:** Nothing works. Every run that touches wallet functionality goes to `needs_review`.

---

#### C2. Wallet Detection Runs Against the Main Page, Not the Extension Popup

**Files:** [Worker.ts:163-177](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts#L163-L177), [MetaMaskController.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskController.ts), [RabbyController.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts)

**Problem:** The Worker creates a single [PageHandle](file:///d:/code/pwAutoTesnets/src/shared/types.ts#73-87) from the main browser context and passes the same `page` to both the scenario and the wallet controller. But MetaMask/Rabby UIs appear in a **separate extension popup page** — not on the main dApp page. The selectors like `[data-testid='app-header-logo']` only exist inside the extension's popup HTML. The code never opens or navigates to the extension popup URL, never listens for new pages/contexts, never handles `context.waitForEvent('page')`.

**Why it matters:** All wallet selectors target an extension popup that is never opened or referenced. [detect()](file:///d:/code/pwAutoTesnets/src/shared/types.ts#164-165), [unlock()](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskController.ts#131-168), [connect()](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#186-229), [signMessage()](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#281-322) — every method will fail because the selectors exist in a different page that is never targeted.

**What happens if not fixed:** Every wallet interaction times out or throws "no visible selector found".

---

#### C3. No Worker Loop — [runOnce()](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts#53-319) Is Never Called Repeatedly

**Files:** [Worker.ts](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts), [main.ts](file:///d:/code/pwAutoTesnets/src/main.ts), [index.ts](file:///d:/code/pwAutoTesnets/src/index.ts)

**Problem:** [Worker](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts#33-329) only has [runOnce()](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts#53-319). There is no [run()](file:///d:/code/pwAutoTesnets/src/core/scenario/scenarios/SwitchNetworkScenario.ts#21-118) or [start()](file:///d:/code/pwAutoTesnets/src/dashboard/services/runUpdates.ts#22-51) loop method. The [main.ts](file:///d:/code/pwAutoTesnets/src/main.ts) creates a [Worker](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts#33-329) but never calls [runOnce()](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts#53-319). The [index.ts](file:///d:/code/pwAutoTesnets/src/index.ts) creates the HTTP server but never starts the scheduler polling loop or the worker processing loop. The `npm run worker` script points to `tsx src/core/worker/Worker.ts` — the Worker class file itself, which has no main block.

**Why it matters:** The system boots up the API server, but no runs are ever dequeued or executed. The scheduler is never run to promote pending runs. The application is a web server that accepts run requests but never processes them.

**What happens if not fixed:** Runs pile up in "queued" status forever. Nothing ever runs.

---

#### C4. `pageFactory.close()` Only Closes the Page, Not the Browser

**File:** [main.ts:130-134](file:///d:/code/pwAutoTesnets/src/main.ts#L130-L134)

**Problem:** `pageFactory.close` calls `page.close()` which only closes the tab. It does not call `browserManager.close(profileId)`, which means the browser process, context, and profile lock are leaked. Every run opens a new browser and leaks it.

**Why it matters:** After a small number of runs, the system runs out of memory/file handles. Browser processes accumulate as zombies. Profile locks are never released, blocking future runs on the same profile.

**What happens if not fixed:** Resource exhaustion within a few runs. Profiles become permanently locked.

---

#### C5. [database/schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql) Is SQLite, but Runtime Uses PostgreSQL

**Files:** [database/schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql), [PostgresRunStore.ts](file:///d:/code/pwAutoTesnets/src/core/store/PostgresRunStore.ts)

**Problem:** [schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql) uses `PRAGMA foreign_keys = ON` (SQLite syntax) and `TEXT` types everywhere. The actual runtime uses [PostgresRunStore](file:///d:/code/pwAutoTesnets/src/core/store/PostgresRunStore.ts#10-299) which creates its own schema inline with `CREATE TABLE IF NOT EXISTS runs (...)`. The two schemas don't match — [schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql) has tables `networks`, `browser_profiles`, `profile_locks`, and `test_runs`, while [PostgresRunStore](file:///d:/code/pwAutoTesnets/src/core/store/PostgresRunStore.ts#10-299) creates `runs` and `run_logs` with completely different columns. The [schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql) file is dead code that misleads anyone reading it.

**Why it matters:** Anyone who runs [schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql) against PostgreSQL gets a syntax error. Anyone who reads [schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql) to understand the data model gets the wrong picture.

**What happens if not fixed:** Misleading documentation. New developers create the wrong tables.

---

#### C6. Duplicate [NeedsReviewError](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts#33-40) Classes

**Files:** [src/shared/errors.ts](file:///d:/code/pwAutoTesnets/src/shared/errors.ts), [src/core/scenario/ScenarioErrors.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts)

**Problem:** Two completely different [NeedsReviewError](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts#33-40) classes exist. [shared/errors.ts](file:///d:/code/pwAutoTesnets/src/shared/errors.ts) has `NeedsReviewError extends AppError` with [(message, code, cause)](file:///d:/code/pwAutoTesnets/src/shared/types.ts#2-3). [ScenarioErrors.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts) has `NeedsReviewError extends ScenarioError` with [(message, code)](file:///d:/code/pwAutoTesnets/src/shared/types.ts#2-3) and no `cause`. Both are used in scenarios, but only the [shared/errors.ts](file:///d:/code/pwAutoTesnets/src/shared/errors.ts) version is imported in the actual scenario files. However, [ScenarioErrors.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts) also defines [TransientError](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts#17-24) and [PermanentError](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts#25-32) that are never used anywhere.

**Why it matters:** `instanceof` checks can fail if the wrong class is used. Dead code generates confusion.

---

### IMPORTANT

---

#### I1. RedisQueue Dequeue Is Broken for Delayed Items

**File:** [RedisQueue.ts:43-57](file:///d:/code/pwAutoTesnets/src/core/queue/RedisQueue.ts#L43-L57)

**Problem:** When [dequeue()](file:///d:/code/pwAutoTesnets/src/core/queue/RedisQueue.ts#43-58) finds an item that is not yet `availableAt` time, it pushes it back with [lpush](file:///d:/code/pwAutoTesnets/src/shared/types.ts#251-252) and returns `null`. In a multi-worker setup, this causes hot-looping: every poll operation pops an item, checks it, pushes it back. This creates unnecessary Redis traffic. Additionally, the `waitMs` parameter in [QueueDequeueOptions](file:///d:/code/pwAutoTesnets/src/shared/types.ts#233-236) is completely ignored — there is no polling loop like [InMemoryQueue](file:///d:/code/pwAutoTesnets/src/core/queue/InMemoryQueue.ts#10-63) has.

**Why it matters:** Under load, the Redis queue becomes a CPU/network hot spot. Delayed retry items cause constant pop-push churn.

---

#### I2. No CORS Configuration on Express Server

**File:** [server.ts](file:///d:/code/pwAutoTesnets/src/api/server.ts)

**Problem:** The package has `cors` as a dependency but `app.use(cors())` is never called. The dashboard [apiClient.ts](file:///d:/code/pwAutoTesnets/src/dashboard/client/apiClient.ts) uses `fetch()` against `http://localhost:3000`. If the dashboard ever runs in a browser (as intended by the React-like structure), cross-origin requests will be blocked.

**Why it matters:** Dashboard cannot communicate with the API from a browser.

---

#### I3. [createHttpServer()](file:///d:/code/pwAutoTesnets/src/api/server.ts#16-339) Accepts `runStore: RunRepository` but [index.ts](file:///d:/code/pwAutoTesnets/src/index.ts) Passes [AppServices](file:///d:/code/pwAutoTesnets/src/main.ts#21-31)

**File:** [index.ts:14](file:///d:/code/pwAutoTesnets/src/index.ts#L14)

**Problem:** [index.ts](file:///d:/code/pwAutoTesnets/src/index.ts) does [createHttpServer(app)](file:///d:/code/pwAutoTesnets/src/api/server.ts#16-339) where `app = { ...services, artifactsPath }`. The `services` object has `runStore: PostgresRunStore`. The [HttpServerOptions](file:///d:/code/pwAutoTesnets/src/api/server.ts#9-15) expects `runStore: RunRepository`. [PostgresRunStore](file:///d:/code/pwAutoTesnets/src/core/store/PostgresRunStore.ts#10-299) does not explicitly implement [RunRepository](file:///d:/code/pwAutoTesnets/src/data/repositories/RunRepository.ts#10-34) (it has matching method names but no `implements` clause), so this works at runtime. But [createHttpServer](file:///d:/code/pwAutoTesnets/src/api/server.ts#16-339) also expects `logger`, `port`, etc. These are passed correctly through spreading. This is fragile coupling that breaks if either side changes.

---

#### I4. Dashboard Uses `@/` Path Alias That Won't Resolve at Runtime

**Files:** [src/dashboard/formatters.ts](file:///d:/code/pwAutoTesnets/src/dashboard/formatters.ts), [src/dashboard/client/apiClient.ts](file:///d:/code/pwAutoTesnets/src/dashboard/client/apiClient.ts), [src/dashboard/services/runService.ts](file:///d:/code/pwAutoTesnets/src/dashboard/services/runService.ts), [src/dashboard/pages/RunsPage.ts](file:///d:/code/pwAutoTesnets/src/dashboard/pages/RunsPage.ts)

**Problem:** [tsconfig.json](file:///d:/code/pwAutoTesnets/tsconfig.json) defines `"@/*": ["src/*"]` path alias. TypeScript compiler understands this for type-checking, but `tsx` at runtime does NOT resolve path aliases. Every dashboard file uses `import type { RunRecord } from "@/shared/types.ts"` — these will fail at runtime with `ERR_MODULE_NOT_FOUND`.

**Why it matters:** Dashboard code will not run. Any attempt to use it crashes immediately.

---

#### I5. Duplicate API System: Custom [Router](file:///d:/code/pwAutoTesnets/src/api/Router.ts#8-42) + [routes.ts](file:///d:/code/pwAutoTesnets/src/api/routes.ts) AND Express [server.ts](file:///d:/code/pwAutoTesnets/src/api/server.ts)

**Files:** [Router.ts](file:///d:/code/pwAutoTesnets/src/api/Router.ts), [routes.ts](file:///d:/code/pwAutoTesnets/src/api/routes.ts), [server.ts](file:///d:/code/pwAutoTesnets/src/api/server.ts)

**Problem:** Two complete API routing systems exist. [Router.ts](file:///d:/code/pwAutoTesnets/src/api/Router.ts) + [routes.ts](file:///d:/code/pwAutoTesnets/src/api/routes.ts) implement a custom path-matching router with [routes.ts](file:///d:/code/pwAutoTesnets/src/api/routes.ts) defining route handlers. [server.ts](file:///d:/code/pwAutoTesnets/src/api/server.ts) implements the same routes using Express directly. Only [server.ts](file:///d:/code/pwAutoTesnets/src/api/server.ts) is wired into the application via [index.ts](file:///d:/code/pwAutoTesnets/src/index.ts). [Router.ts](file:///d:/code/pwAutoTesnets/src/api/Router.ts) and [routes.ts](file:///d:/code/pwAutoTesnets/src/api/routes.ts) are dead code.

**Why it matters:** Dead code confuses contributors. Changes to Express routes won't be reflected in the dead router.

---

#### I6. [waitForElement()](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#609-627) in Controllers Does Not Actually Wait

**Files:** [MetaMaskController.ts:554-571](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskController.ts#L554-L571), [RabbyController.ts:609-626](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#L609-L626)

**Problem:** [waitForElement()](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#609-627) calls `page.locator(selector).isVisible({ timeout })` which resolves immediately to `true` or `false` or throws. [isVisible](file:///d:/code/pwAutoTesnets/src/core/browser/PlaywrightBrowserDriver.ts#78-79) does not wait for the element to appear — it checks visibility at that instant. For actually waiting, you need `page.locator(selector).waitFor({ state: 'visible', timeout })` via Playwright's API, but since this is behind the [PageHandle](file:///d:/code/pwAutoTesnets/src/shared/types.ts#73-87) abstraction, that method is not exposed.

**Why it matters:** The "wait" methods return immediately and don't actually wait for elements to appear, causing race conditions where the wallet popup hasn't rendered yet.

---

#### I7. `ScenarioUtils.fillAndVerify()` Uses [textContent()](file:///d:/code/pwAutoTesnets/src/core/browser/PlaywrightBrowserDriver.ts#68-69) to Verify Input

**File:** [ScenarioUtils.ts:114-134](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioUtils.ts#L114-L134)

**Problem:** After filling an input with `.fill(value)`, verification reads `.textContent()`. For `<input>` elements, [textContent()](file:///d:/code/pwAutoTesnets/src/core/browser/PlaywrightBrowserDriver.ts#68-69) returns `null` or empty — it's not the input's value. The verification will always fail for input elements, throwing a false error.

**Why it matters:** [fillAndVerify](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioUtils.ts#107-135) will throw on every call, making any scenario that uses it fail.

---

#### I8. [.env](file:///d:/code/pwAutoTesnets/.env) File Committed to Repository with Placeholder Secrets

**File:** [.env](file:///d:/code/pwAutoTesnets/.env)

**Problem:** [.env](file:///d:/code/pwAutoTesnets/.env) is committed with `APP_SECRET_KEY=your-secret-key-here` and `DATABASE_URL=postgresql://user:password@localhost`. The [.gitignore](file:///d:/code/pwAutoTesnets/.gitignore) file should exclude [.env](file:///d:/code/pwAutoTesnets/.env) (it probably does — but [.env.example](file:///d:/code/pwAutoTesnets/.env.example) exists as a copy, so[.env](file:///d:/code/pwAutoTesnets/.env) was likely committed at some point). `TEST_WALLET_SEED=` is empty but the field's presence signals that seed phrases may be stored here.

**Why it matters:** Credential leakage risk. Anyone cloning the repo gets working default credentials.

---

#### I9. `SignMessageScenario` Registered as `connect_and_sign_message` but Referenced as `sign_message`

**Files:** [SignMessageScenario.ts:18](file:///d:/code/pwAutoTesnets/src/core/scenario/scenarios/SignMessageScenario.ts#L18), [main.ts:101-102](file:///d:/code/pwAutoTesnets/src/main.ts#L101-L102)

**Problem:** `SignMessageScenario` has `id: "connect_and_sign_message"` but [main.ts](file:///d:/code/pwAutoTesnets/src/main.ts) logs it as `"sign_message"` in the scenarios list. [index.ts](file:///d:/code/pwAutoTesnets/src/index.ts) also shows it as `"sign_message"` in startup output. Similarly `TokenSwapScenario` has `id: "approve_token"` but is logged as `"token_swap"`.

**Why it matters:** Users trying to create runs with `scenarioId: "sign_message"` or `scenarioId: "token_swap"` will get `ScenarioNotFound` errors. The real IDs are `connect_and_sign_message` and `approve_token`.

---

#### I10. No Stream/Updates Query on Database — Full Table Scan

**File:** [server.ts:284-311](file:///d:/code/pwAutoTesnets/src/api/server.ts#L284-L311)

**Problem:** The `/api/runs/stream/updates` endpoint fetches ALL runs (up to 1000) then filters in-memory by `updatedAt >= since`. There's no SQL query with a `WHERE updated_at >= $1` clause. This is O(n) on every poll.

**Why it matters:** At scale, this endpoint becomes the bottleneck, loading thousands of rows every 5 seconds for every dashboard client.

---

### CLEANUP

---

#### CL1. Dead Dashboard Component Files

**Files:** [src/dashboard/components/RunStatusBadge.ts](file:///d:/code/pwAutoTesnets/src/dashboard/components/RunStatusBadge.ts), [src/dashboard/components/RunTable.ts](file:///d:/code/pwAutoTesnets/src/dashboard/components/RunTable.ts), [src/dashboard/hooks/useRuns.ts](file:///d:/code/pwAutoTesnets/src/dashboard/hooks/useRuns.ts), [src/dashboard/hooks/useRunDetail.ts](file:///d:/code/pwAutoTesnets/src/dashboard/hooks/useRunDetail.ts)

**Problem:** These files are listed in [structure.ts](file:///d:/code/pwAutoTesnets/src/dashboard/structure.ts) but are likely stub files (~300-400 bytes each). The hooks use `@/shared/types` which won't resolve. No UI framework (React/Vue) is set up. No `vite.config.ts` or equivalent.

---

#### CL2. Excessive Documentation Files in Root

**Files:** [API_LAYER_IMPLEMENTATION.md](file:///d:/code/pwAutoTesnets/API_LAYER_IMPLEMENTATION.md), [ARTIFACTS_TRACING_IMPLEMENTATION.md](file:///d:/code/pwAutoTesnets/ARTIFACTS_TRACING_IMPLEMENTATION.md), [COMPILATION_FIXES.md](file:///d:/code/pwAutoTesnets/COMPILATION_FIXES.md), [FINAL_STAFF_REVIEW.md](file:///d:/code/pwAutoTesnets/FINAL_STAFF_REVIEW.md), [MIGRATION_VALIDATION_PLAN.md](file:///d:/code/pwAutoTesnets/MIGRATION_VALIDATION_PLAN.md), [PROJECT_STATUS.md](file:///d:/code/pwAutoTesnets/PROJECT_STATUS.md), [QUICK_START_CHECKLIST.md](file:///d:/code/pwAutoTesnets/QUICK_START_CHECKLIST.md), [REVIEW_CORRECTIONS_SUMMARY.md](file:///d:/code/pwAutoTesnets/REVIEW_CORRECTIONS_SUMMARY.md), [RUN.md](file:///d:/code/pwAutoTesnets/RUN.md), [STAFF_REVIEW.md](file:///d:/code/pwAutoTesnets/STAFF_REVIEW.md), [STAGE1_COMPLETE.md](file:///d:/code/pwAutoTesnets/STAGE1_COMPLETE.md), [STAGE1_README.md](file:///d:/code/pwAutoTesnets/STAGE1_README.md), [STAGE1_STATUS.md](file:///d:/code/pwAutoTesnets/STAGE1_STATUS.md), [STARTUP_COMPLETE.md](file:///d:/code/pwAutoTesnets/STARTUP_COMPLETE.md), [START_HERE.md](file:///d:/code/pwAutoTesnets/START_HERE.md), [VALIDATION_PLAN_INDEX.md](file:///d:/code/pwAutoTesnets/VALIDATION_PLAN_INDEX.md), [WALLET_ABSTRACTION_IMPLEMENTATION.md](file:///d:/code/pwAutoTesnets/WALLET_ABSTRACTION_IMPLEMENTATION.md)

**Problem:** 17 markdown files in the project root. Many describe plans, stages, and reviews of refactoring work that may or may not reflect current code. This creates confusion about which document is authoritative.

---

#### CL3. [MetaMaskSelectors.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskSelectors.ts) Is Dead Code

**File:** [MetaMaskSelectors.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskSelectors.ts)

**Problem:** [MetaMaskController.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskController.ts) defines its own `METAMASK_SELECTORS` inline. The separate [MetaMaskSelectors.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskSelectors.ts) file exports a completely different set of selectors and helper functions that are never imported by any file.

---

#### CL4. `examples/` Scenarios Conflict with Real Scenarios

**Files:** [src/core/scenario/examples/ConnectWalletScenario.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/examples/ConnectWalletScenario.ts), [src/core/scenario/examples/BalanceCheckScenario.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/examples/BalanceCheckScenario.ts)

**Problem:** The example `ConnectWalletScenario` has `id: "connect-wallet"` while the real one has `id: "connect_wallet"`. Neither uses the same ID, but a developer could accidentally register both.

---

#### CL5. `Zod` Package Installed but Never Used

**File:** [package.json](file:///d:/code/pwAutoTesnets/package.json)

**Problem:** `zod` is in dependencies but never imported anywhere. The DTO validation in [dto.ts](file:///d:/code/pwAutoTesnets/src/api/dto.ts) uses manual parsing functions instead.

---

#### CL6. Mixed Import Extensions

**Multiple files**

**Problem:** Some imports use [.ts](file:///d:/code/pwAutoTesnets/src/main.ts) extensions (`import type {...} from "../../shared/types.ts"`), others omit them (`import { createRedisClient } from "./config/redis"`). This inconsistency works under `tsx` with the current config but is not standard.

---

### Health Scores

| Module | Score | Assessment |
|---|---|---|
| **BrowserManager** | 6/10 | Clean design with lock heartbeats, but driver integration is broken (no extension loading, no persistent context) |
| **ProfileLock** | 8/10 | Solid file-based locking with TTL, stale detection, and process liveness check. Best module in the project |
| **Worker** | 4/10 | Good error classification and artifact capture logic, but never actually runs. Page factory leaks browsers. Wallet detection is on wrong page |
| **Scheduler** | 7/10 | Clean promote logic with batch size and attempt limits. Correct but never invoked in production |
| **Queue** | 5/10 | InMemoryQueue is correct. RedisQueue has dequeue bugs with delayed items and ignores waitMs |
| **WalletController layer** | 3/10 | WalletManager/WalletDetector have correct structure, but Worker creates WalletManager twice with incorrect flow. Detection result is partially discarded |
| **MetaMask controller** | 4/10 | Selector fallback chains are well-designed, but selectors target an extension popup that is never opened. [waitForElement](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#609-627) doesn't actually wait |
| **Rabby controller** | 4/10 | Mirrors MetaMask quality. Same fundamental problem — runs against wrong page context |
| **Scenario engine** | 7/10 | Clean registry pattern. ScenarioUtils has useful helpers despite the [fillAndVerify](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioUtils.ts#107-135) bug |
| **API** | 6/10 | Express server is functional with proper error handling. Dead Router/routes code. No CORS. Stream endpoint is O(n) |
| **Dashboard** | 2/10 | Type definitions exist but nothing renders. `@/` imports won't resolve. No actual UI framework setup |
| **Tests** | 5/10 | Two tests exist and test real logic correctly (scheduler promotion, wallet detector). But coverage is < 5% of the codebase |
| **Docs** | 3/10 | 17 markdown files in root with unclear currency. Useful [runbook.md](file:///d:/code/pwAutoTesnets/docs/runbook.md) and [selector-adaptation-guide.md](file:///d:/code/pwAutoTesnets/docs/selector-adaptation-guide.md) in `docs/`. README exists but describes aspirational state |

---

## PART 2 — REFACTORING PLAN

---

### Stage 1: Runtime Backbone

**Goal:** Make the system bootable and capable of processing runs end-to-end.

**Files to change:**
- [src/core/browser/PlaywrightBrowserDriver.ts](file:///d:/code/pwAutoTesnets/src/core/browser/PlaywrightBrowserDriver.ts) — Switch to `chromium.launchPersistentContext()` with extension loading args. Accept `extensionPaths` in config. Return extension pages/contexts.
- [src/main.ts](file:///d:/code/pwAutoTesnets/src/main.ts) — Add persistent worker loop (`while (true) { await worker.runOnce(); }`). Add scheduler interval (`setInterval(() => scheduler.promotePendingRuns(), 15000)`). Fix `pageFactory.close()` to call `browserManager.close(profileId)` instead of just `page.close()`.
- [src/index.ts](file:///d:/code/pwAutoTesnets/src/index.ts) — Wire the worker loop and scheduler interval into the startup sequence. Handle graceful shutdown (SIGTERM/SIGINT).
- [src/core/worker/Worker.ts](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts) — Fix wallet detection flow: don't create WalletManager before detection. Add `getExtensionPage()` to PageFactory to find the wallet popup page.

**What NOT to change:** [ProfileLock](file:///d:/code/pwAutoTesnets/src/core/browser/ProfileLock.ts#21-165), [ScenarioRegistry](file:///d:/code/pwAutoTesnets/src/shared/types.ts#223-228), [ScenarioEngine](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioEngine.ts#9-41), [shared/types.ts](file:///d:/code/pwAutoTesnets/src/shared/types.ts).

**Acceptance criteria:**
1. `npm run dev` starts the API server AND a worker loop AND a scheduler loop.
2. A run created via `POST /api/runs` progresses from `queued` → `running` → (some result).
3. Browser processes are cleaned up after each run.
4. Worker loop does not crash on error — it logs and continues.

---

### Stage 2: Wallet Layer

**Goal:** Make wallet extension detection and interaction work against the actual extension popup.

**Files to change:**
- [src/core/browser/PlaywrightBrowserDriver.ts](file:///d:/code/pwAutoTesnets/src/core/browser/PlaywrightBrowserDriver.ts) — Expose method to get the extension popup page. Load extension via `--load-extension` args.
- [src/shared/types.ts](file:///d:/code/pwAutoTesnets/src/shared/types.ts) — Add `getExtensionPage?(): Promise<PageHandle | null>` to [PageFactory](file:///d:/code/pwAutoTesnets/src/shared/types.ts#328-332) or [BrowserSession](file:///d:/code/pwAutoTesnets/src/shared/types.ts#46-52).
- [src/core/worker/Worker.ts](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts) — After creating main page, get extension popup page. Pass extension page to wallet controller, main page to scenario.
- [src/core/wallet/metamask/MetaMaskController.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskController.ts) — All methods should operate on the extension popup page, not the main page. Add [waitFor](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#609-627) support via Playwright's `locator.waitFor()`.
- [src/core/wallet/rabby/RabbyController.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts) — Same changes as MetaMask.
- Delete [src/core/wallet/metamask/MetaMaskSelectors.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskSelectors.ts) (dead code).
- Delete [src/core/scenario/ScenarioErrors.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioErrors.ts) (duplicate of [shared/errors.ts](file:///d:/code/pwAutoTesnets/src/shared/errors.ts)).

**What NOT to change:** [WalletDetector.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/WalletDetector.ts) (its structure is correct). [WalletManager.ts](file:///d:/code/pwAutoTesnets/src/core/wallet/WalletManager.ts) (correct facade pattern).

**Acceptance criteria:**
1. MetaMask extension loads in browser.
2. [detect()](file:///d:/code/pwAutoTesnets/src/shared/types.ts#164-165) finds MetaMask selectors on the extension popup page.
3. [unlock()](file:///d:/code/pwAutoTesnets/src/core/wallet/metamask/MetaMaskController.ts#131-168) successfully types password and clicks unlock on the extension popup.
4. End-to-end `connect_wallet` scenario completes with wallet connection.

---

### Stage 3: Scenarios

**Goal:** Make all 5 scenarios reliable and composable.

**Files to change:**
- [src/core/scenario/scenarios/SignMessageScenario.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/scenarios/SignMessageScenario.ts) — Fix ID to match documented name or update docs.
- [src/core/scenario/scenarios/TokenSwapScenario.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/scenarios/TokenSwapScenario.ts) — Fix ID to match documented name.
- [src/core/scenario/ScenarioUtils.ts](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioUtils.ts) — Fix [fillAndVerify()](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioUtils.ts#107-135) to use `page.evaluate` to read input value instead of [textContent()](file:///d:/code/pwAutoTesnets/src/core/browser/PlaywrightBrowserDriver.ts#68-69). Fix [waitForElement](file:///d:/code/pwAutoTesnets/src/core/wallet/rabby/RabbyController.ts#609-627) to actually poll/retry.
- All scenario files — Ensure `abortSignal` is checked between steps.
- [src/main.ts](file:///d:/code/pwAutoTesnets/src/main.ts) — Fix logged scenario IDs to match actual registered IDs.

**What NOT to change:** [ScenarioRegistry](file:///d:/code/pwAutoTesnets/src/shared/types.ts#223-228), [ScenarioEngine](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioEngine.ts#9-41).

**Acceptance criteria:**
1. `POST /api/runs { scenarioId: "connect_wallet" }` runs and completes.
2. Scenarios check abort signal between steps.
3. [fillAndVerify](file:///d:/code/pwAutoTesnets/src/core/scenario/ScenarioUtils.ts#107-135) correctly verifies input values.
4. Logged scenario IDs match the registered IDs.

---

### Stage 4: Reliability (Queue + Artifacts + Tracing)

**Goal:** Make the queue and artifact system production-ready.

**Files to change:**
- [src/core/queue/RedisQueue.ts](file:///d:/code/pwAutoTesnets/src/core/queue/RedisQueue.ts) — Add polling loop for `waitMs`. Use Redis sorted set (`ZADD`/`ZRANGEBYSCORE`) instead of `LPUSH`/`RPOP` to properly handle delayed items without pop-push churn.
- [src/core/worker/FileArtifactWriter.ts](file:///d:/code/pwAutoTesnets/src/core/worker/FileArtifactWriter.ts) — Replace `console.error` with injected logger.
- [src/core/worker/Worker.ts](file:///d:/code/pwAutoTesnets/src/core/worker/Worker.ts) — Clean up duplicate trace stopping.
- [src/api/server.ts](file:///d:/code/pwAutoTesnets/src/api/server.ts) — Add `WHERE updated_at >= $1` to stream/updates endpoint. Add proper PostgreSQL query to [RunRepository](file:///d:/code/pwAutoTesnets/src/data/repositories/RunRepository.ts#10-34).
- [src/data/repositories/RunRepository.ts](file:///d:/code/pwAutoTesnets/src/data/repositories/RunRepository.ts) — Add `listRecentlyUpdatedRuns(since: ISODateString, limit: number)`.

**What NOT to change:** [InMemoryQueue](file:///d:/code/pwAutoTesnets/src/core/queue/InMemoryQueue.ts#10-63) (correct for testing). [FileArtifactWriter](file:///d:/code/pwAutoTesnets/src/core/worker/FileArtifactWriter.ts#23-150) API surface (just fix internals).

**Acceptance criteria:**
1. Redis queue correctly handles delayed items without hot-loop.
2. `GET /api/runs/stream/updates?since=...` executes a SQL query with a time filter.
3. All artifact capture errors are logged through the Logger, not console.error.

---

### Stage 5: API + Dashboard

**Goal:** Make the API production-ready and the dashboard functional.

**Files to change:**
- [src/api/server.ts](file:///d:/code/pwAutoTesnets/src/api/server.ts) — Add `cors()` middleware. Add rate limiting. Add input sanitization for `runId` parameters (validate UUID format).
- Delete [src/api/Router.ts](file:///d:/code/pwAutoTesnets/src/api/Router.ts) and [src/api/routes.ts](file:///d:/code/pwAutoTesnets/src/api/routes.ts) (dead code).
- `src/dashboard/**/*.ts` — Replace `@/shared/types.ts` imports with relative paths. OR set up a bundler (Vite) that resolves path aliases.
- Set up actual dashboard: add `vite.config.ts`, add React/Preact, create real UI components.

**What NOT to change:** [ArtifactsService](file:///d:/code/pwAutoTesnets/src/api/services/ArtifactsService.ts#10-62) (correct and secure). [RunService](file:///d:/code/pwAutoTesnets/src/api/services/RunService.ts#17-76) (correct business logic).

**Acceptance criteria:**
1. CORS allows dashboard origin.
2. Dashboard compiles and renders in a browser.
3. Dead Router/routes files are removed.

---

### Stage 6: Docs + Tests + Cleanup

**Goal:** Clean up the project and bring test coverage to a usable level.

**Files to change:**
- Delete [database/schema.sql](file:///d:/code/pwAutoTesnets/database/schema.sql) or replace with a proper PostgreSQL migration.
- Delete dead docs: consolidate 17 root markdown files into [README.md](file:///d:/code/pwAutoTesnets/README.md) and `docs/`.
- Delete `src/core/scenario/examples/` (dead code that conflicts with real scenarios).
- Add tests for: `Worker.runOnce()` (mocked), `MetaMaskController.detect()` (mocked page), `RunService.createRun()`, `PlaywrightBrowserDriver.launch()` error handling.
- Remove `zod` from dependencies (unused).
- Standardize import extensions (all `.ts` or all without).

**What NOT to change:** Existing passing tests.

**Acceptance criteria:**
1. `npm test` passes with no dead imports.
2. Test coverage ≥ 30% of core modules.
3. No dead code in `src/`.
4. One `README.md` that accurately describes the current state.

---

### Dependencies Between Stages

```
Stage 1 ─────► Stage 2 ─────► Stage 3
                  │
                  └──────────► Stage 4
                                  │
Stage 5 ◄────────────────────────┘
   │
Stage 6 ◄────────────────────────┘
```

- Stage 2 requires Stage 1 (browser must work before wallet works).
- Stage 3 requires Stage 2 (scenarios need wallet layer).
- Stage 4 can start after Stage 2 (queue/artifacts are independent of scenarios).
- Stage 5 requires Stage 4 (dashboard needs working API).
- Stage 6 is last (cleanup after everything works).

### Complexity and Risk Per Stage

| Stage | Complexity | Risk |
|---|---|---|
| Stage 1 (Runtime Backbone) | **High** | **High** — touching the browser driver + boot sequence |
| Stage 2 (Wallet Layer) | **High** | **High** — extension popup handling is inherently fragile |
| Stage 3 (Scenarios) | **Medium** | **Low** — mostly fixing IDs and utility methods |
| Stage 4 (Reliability) | **Medium** | **Medium** — Redis queue redesign requires careful testing |
| Stage 5 (API + Dashboard) | **Medium** | **Low** — standard web dev work |
| Stage 6 (Docs + Tests) | **Low** | **Low** — cleanup and additions |

---

## PART 3 — FIX PLAN

---

### Fix 1

- **Fix ID:** F01
- **Title:** Switch to Persistent Context with Extension Loading
- **File(s):** `src/core/browser/PlaywrightBrowserDriver.ts`
- **Problem:** Browser launches without loading any wallet extension. No persistent context is used for user data.
- **Required change:** Replace `chromium.launch()` + `browser.newContext()` with `chromium.launchPersistentContext(profile.userDataDir, { args: ['--disable-extensions-except=<path>', '--load-extension=<path>'], headless: false })`. Accept `extensionPaths: string[]` in the constructor config. Store the context directly (persistent context IS the browser). Note: Extensions require `headless: false` or `headless: 'new'` (Chromium new headless).
- **Dependencies:** None
- **Priority:** P0

### Fix 2

- **Fix ID:** F02
- **Title:** Add Extension Popup Page Access
- **File(s):** `src/core/browser/PlaywrightBrowserDriver.ts`, `src/shared/types.ts`
- **Problem:** Wallet controllers operate on the main page but wallet UI is in the extension popup.
- **Required change:** After launching persistent context, enumerate `context.pages()` and `context.waitForEvent('page')` to find the extension popup page. Expose a `getExtensionPage(profileId): PageHandle | undefined` method. Add `getExtensionPage?(): PageHandle | undefined` to `PageFactory` or create a new `BrowserSessionHandle` type.
- **Dependencies:** F01
- **Priority:** P0

### Fix 3

- **Fix ID:** F03
- **Title:** Add Worker Loop and Scheduler Loop
- **File(s):** `src/main.ts`, `src/index.ts`
- **Problem:** Worker and scheduler are created but never started. No runs are processed.
- **Required change:** In `main.ts`, export a `startWorkerLoop(worker, logger)` function that runs `while (!shutdown) { try { await worker.runOnce(); } catch(e) { logger.error(...); await delay(1000); } }`. In `index.ts`, after `server.listen()`, start the worker loop and a `setInterval(() => scheduler.promotePendingRuns(), 15000)`. Add SIGTERM/SIGINT handlers that set `shutdown = true`, stop the scheduler interval, and close the server/database pool.
- **Dependencies:** None
- **Priority:** P0

### Fix 4

- **Fix ID:** F04
- **Title:** Fix pageFactory.close() to Release Browser and Lock
- **File(s):** `src/main.ts`
- **Problem:** `pageFactory.close()` only closes the page tab, leaking the browser process and profile lock.
- **Required change:** Change `close` to `async (page: any) => { /* find profileId from active sessions */ await browserManager.close(profileId); }`. This requires the `pageFactory.create()` to track which profileId maps to which page, or pass profileId into the close method. Simplest: change `PageFactory.close()` signature to accept `profileId: string` and update the Worker to pass `run.profileId` instead of `page`.
- **Dependencies:** None
- **Priority:** P0

### Fix 5

- **Fix ID:** F05
- **Title:** Fix Wallet Detection Flow in Worker
- **File(s):** `src/core/worker/Worker.ts`
- **Problem:** Worker creates a MetaMaskController, then creates a WalletManager to detect, then creates a new WalletManager. Detection runs against the wrong page.
- **Required change:** After getting the main page, get the extension popup page via `pageFactory.getExtensionPage(run.profileId)`. Create a `WalletDetector` with both `[MetaMaskController, RabbyController]` and pass the extension page. Use the detected wallet kind to select the correct controller for the `WalletManager`. Pass the extension page to `wallet.*()` calls and the main page to `scenario.run()`.
- **Dependencies:** F02
- **Priority:** P0

### Fix 6

- **Fix ID:** F06
- **Title:** Fix Scenario IDs to Match Documentation
- **File(s):** `src/core/scenario/scenarios/SignMessageScenario.ts`, `src/core/scenario/scenarios/TokenSwapScenario.ts`, `src/main.ts`, `src/index.ts`
- **Problem:** `SignMessageScenario.id` is `"connect_and_sign_message"` but logged/documented as `"sign_message"`. `TokenSwapScenario.id` is `"approve_token"` but logged as `"token_swap"`.
- **Required change:** Either update the `id` fields to match the logged names, or update the log messages and docs. Recommended: keep the descriptive IDs (`connect_and_sign_message`, `approve_token`) and fix the log messages in `main.ts` and `index.ts` to show the actual IDs.
- **Dependencies:** None
- **Priority:** P1

### Fix 7

- **Fix ID:** F07
- **Title:** Fix `fillAndVerify()` Input Value Check
- **File(s):** `src/core/scenario/ScenarioUtils.ts`
- **Problem:** Uses `textContent()` to verify input value. `textContent()` returns the text inside an element, not an `<input>` element's value.
- **Required change:** Replace `const actualValue = (await locator.textContent() ...)` with `const actualValue = await page.evaluate((sel) => { const el = document.querySelector(sel); return el instanceof HTMLInputElement ? el.value : el?.textContent ?? ''; }, selector)`.
- **Dependencies:** None
- **Priority:** P1

### Fix 8

- **Fix ID:** F08
- **Title:** Add CORS Middleware to Express Server
- **File(s):** `src/api/server.ts`
- **Problem:** No CORS headers. Dashboard cannot call API from browser.
- **Required change:** Add `import cors from 'cors';` and `app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));` before route definitions.
- **Dependencies:** None
- **Priority:** P1

### Fix 9

- **Fix ID:** F09
- **Title:** Fix RedisQueue Delayed Item Handling
- **File(s):** `src/core/queue/RedisQueue.ts`
- **Problem:** Pop-push churn for delayed items. `waitMs` ignored.
- **Required change:** Use Redis sorted set: `zadd(key, availableAtTimestamp, JSON.stringify(item))` for enqueue. For dequeue: `zrangebyscore(key, '-inf', Date.now(), 'LIMIT', 0, 1)` to peek, then `zrem` to atomically remove. Add polling loop for `waitMs` like `InMemoryQueue` does.
- **Dependencies:** None
- **Priority:** P1

### Fix 10

- **Fix ID:** F10
- **Title:** Fix Dashboard Import Aliases
- **File(s):** All `src/dashboard/**/*.ts` files
- **Problem:** `@/shared/types.ts` alias won't resolve at runtime with `tsx`.
- **Required change:** Replace all `@/shared/types.ts` imports with relative paths like `../../shared/types.ts`. Alternatively, add `tsx` path resolution via a loader, but relative paths are simpler and more reliable.
- **Dependencies:** None
- **Priority:** P1

### Fix 11

- **Fix ID:** F11
- **Title:** Delete Dead Code Files
- **File(s):** `src/api/Router.ts`, `src/api/routes.ts`, `src/core/wallet/metamask/MetaMaskSelectors.ts`, `src/core/scenario/ScenarioErrors.ts`, `src/core/scenario/examples/*.ts`, `database/schema.sql`
- **Problem:** Dead code that misleads and complicates the codebase.
- **Required change:** Delete these files. Ensure no imports reference them (grep all `.ts` files).
- **Dependencies:** None
- **Priority:** P2

### Fix 12

- **Fix ID:** F12
- **Title:** Add Efficient Stream/Updates Query
- **File(s):** `src/api/server.ts`, `src/core/store/PostgresRunStore.ts`, `src/data/repositories/RunRepository.ts`
- **Problem:** `/api/runs/stream/updates` fetches all runs and filters in-memory.
- **Required change:** Add `listRecentlyUpdatedRuns(since: string, limit: number)` to `RunRepository` and `PostgresRunStore` with `SELECT * FROM runs WHERE updated_at >= $1 ORDER BY updated_at DESC LIMIT $2`. Use this in the stream endpoint instead of fetching all runs.
- **Dependencies:** None
- **Priority:** P2

### Fix 13

- **Fix ID:** F13
- **Title:** Replace `console.error` in `FileArtifactWriter` with Injected Logger
- **File(s):** `src/core/worker/FileArtifactWriter.ts`
- **Problem:** Artifact capture errors logged via `console.error` instead of the structured logger.
- **Required change:** Accept `logger: Logger` in constructor options. Replace all `console.error(...)` calls with `this.logger.error(...)`.
- **Dependencies:** None
- **Priority:** P2

### Fix 14

- **Fix ID:** F14
- **Title:** Remove Unused `zod` Dependency
- **File(s):** `package.json`
- **Problem:** `zod` is installed but never imported.
- **Required change:** `npm uninstall zod`.
- **Dependencies:** None
- **Priority:** P2

### Fix 15

- **Fix ID:** F15
- **Title:** Consolidate Root Documentation
- **File(s):** Root directory `.md` files
- **Problem:** 17 markdown files with unclear currency create confusion.
- **Required change:** Move still-relevant docs into `docs/archive/`. Keep only `README.md` in root. Update `README.md` to accurately describe current project state.
- **Dependencies:** None
- **Priority:** P2

### Fix 16

- **Fix ID:** F16
- **Title:** Replace `database/schema.sql` with PostgreSQL Migration
- **File(s):** `database/schema.sql`
- **Problem:** SQLite syntax that doesn't match the actual PostgreSQL schema.
- **Required change:** Delete `database/schema.sql`. The schema is auto-created by `PostgresRunStore.initialize()`. If a migration file is desired, extract the `CREATE TABLE` SQL from `PostgresRunStore.initialize()` into `database/001_initial.sql` with PostgreSQL syntax.
- **Dependencies:** None
- **Priority:** P2

---

### Must Fix Before Project Is Usable (P0)

| Fix | Title |
|---|---|
| F01 | Switch to Persistent Context with Extension Loading |
| F02 | Add Extension Popup Page Access |
| F03 | Add Worker Loop and Scheduler Loop |
| F04 | Fix pageFactory.close() to Release Browser and Lock |
| F05 | Fix Wallet Detection Flow in Worker |

### Can Defer to Later (P2)

| Fix | Title |
|---|---|
| F11 | Delete Dead Code Files |
| F12 | Add Efficient Stream/Updates Query |
| F13 | Replace console.error in FileArtifactWriter with Logger |
| F14 | Remove Unused zod Dependency |
| F15 | Consolidate Root Documentation |
| F16 | Replace database/schema.sql with PostgreSQL Migration |

---

## PART 4 — USAGE GUIDE

---

### 1. Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Node.js | 20.x+ | Required for `tsx` and ESM module support |
| npm | 9+ | Comes with Node.js |
| Docker & Docker Compose | Latest | Required for PostgreSQL and Redis |
| Chromium-based browser | Installed via Playwright | `npx playwright install chromium` |
| MetaMask extension build | Unpacked build folder | Download from MetaMask releases or build from source |
| Rabby extension build (optional) | Unpacked build folder | Download from Rabby releases |

**Environment variables (`.env`):**

```env
APP_PORT=3000
APP_BASE_URL=http://localhost:3000
APP_LOG_LEVEL=debug
APP_SECRET_KEY=<generate with: node -e "console.log(require('crypto').randomBytes(32).toString('base64'))">
DATABASE_URL=postgresql://user:password@localhost:5432/playwrightautomation
REDIS_URL=redis://localhost:6379
ARTIFACTS_PATH=./artifacts
HEADLESS=false
BROWSER_TYPE=chromium
TEST_WALLET_SEED=<your 12-word mnemonic for test wallet>
```

> [!CAUTION]
> Never commit real wallet seeds or API keys. Use `.env.example` as a template and keep `.env` in `.gitignore`.

---

### 2. Installation

```bash
# Clone the repository
git clone <repo-url> pwAutoTestnets
cd pwAutoTestnets

# Install Node dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Start infrastructure (PostgreSQL + Redis)
docker compose up -d postgres redis

# Wait for services to be healthy
docker compose ps

# Copy .env.example to .env and fill in values
cp .env.example .env
# Edit .env with your values

# Database is auto-initialized on first run (PostgresRunStore.initialize())
# No manual schema creation needed.

# Run the application
npm run dev
```

---

### 3. Extension Setup

**Where to put MetaMask build:**
1. Download the MetaMask extension unpacked build (or export from Chrome: `chrome://extensions` → Developer mode → Pack extension → get the folder).
2. Place the folder at a known path, e.g., `./extensions/metamask/`.
3. The folder must contain `manifest.json` at its root.

**Where to put Rabby build:**
1. Same process as MetaMask. Place at `./extensions/rabby/`.

**How to verify extensions are loaded:**
After applying Fix F01, the browser will launch with extensions. You will see the extension icons in the browser toolbar. Check the terminal logs for `"browser_launched"` events.

> [!IMPORTANT]
> **Current state:** Extensions are NOT loaded by the current code. You must apply
> Fixes F01–F02 before extension automation works.

**How to do first-time wallet setup for a profile:**
1. Launch the browser manually with the same `userDataDir`:
   ```bash
   npx playwright open --channel chromium --user-data-dir=./profiles/profile-1
   ```
2. Install/load the MetaMask extension manually.
3. Complete the MetaMask onboarding flow (create or import wallet, set password).
4. Close the browser. The wallet state is now persisted in `./profiles/profile-1/`.
5. Subsequent automated launches with this `userDataDir` will have MetaMask pre-configured.

---

### 4. Profile Management

**How to create a new browser profile:**
1. Choose a profile ID (e.g., `"profile-alice"`).
2. Create a directory: `mkdir -p ./profiles/profile-alice`
3. Launch with that profile for first-time setup (see Section 3).
4. The profile is now ready for automation.

**How to initialize a wallet in a profile:**
1. Launch the browser with the profile's `userDataDir` (see above).
2. Complete MetaMask onboarding.
3. Import your test account using the seed phrase from `.env`.
4. Set a password you'll use in automation.
5. Close the browser.

**How to reuse a profile across runs:**
Profiles are identified by `profileId` in the Run. The same profileId always maps to the same `userDataDir`. The `ProfileLock` ensures only one run uses a profile at a time. After a run completes, the lock is released and the profile is available.

**How to recover a broken profile:**
1. Check for stale lock files: `ls ~/.pwAutoTestnets/locks/`
2. Delete the stale lock: `rm ~/.pwAutoTestnets/locks/<profileId>.lock.json`
3. If the profile data is corrupted, delete the user data dir and re-create.

---

### 5. Creating and Running Tasks

**How to create a Run via API:**
```bash
curl -X POST http://localhost:3000/api/runs \
  -H "Content-Type: application/json" \
  -d '{
    "scenarioId": "connect_wallet",
    "profileId": "profile-1",
    "networkId": "sepolia",
    "maxAttempts": 3
  }'
```

Valid scenario IDs (current):
- `connect_wallet`
- `connect_and_sign_message`
- `approve_token`
- `switch_network_if_needed`
- `generic_transaction_flow`

**How to create a Run via dashboard:**
Dashboard is not yet functional (see Health Scores). Use API for now.

**How to monitor a run:**
```bash
# Get run status
curl http://localhost:3000/api/runs/<run-id>

# List all runs
curl http://localhost:3000/api/runs

# Filter by status
curl http://localhost:3000/api/runs?status=running

# Poll for updates
curl "http://localhost:3000/api/runs/stream/updates?since=2026-03-14T00:00:00Z"
```

**How to read logs:**
Logs are emitted as structured JSON to stdout. Each log line has:
```json
{
  "time": "2026-03-14T16:00:00.000Z",
  "level": "info",
  "name": "worker.run.start",
  "message": "worker run start",
  "context": { "runId": "...", "attempt": 1 }
}
```

Use `docker compose logs -f` for containers, or pipe through `jq` for formatted output:
```bash
npm run dev 2>&1 | jq '.'
```

---

### 6. Wallet Actions

**How the auto-detection works:**
The `WalletDetector` iterates over registered controllers (MetaMask, Rabby) and calls each controller's `detect()` method with a timeout. Each controller checks for its own selectors and returns a confidence score (0.0–1.0). The controller with the highest confidence wins.

**What happens when wallet state is unknown:**
If no controller detects its wallet, a `NeedsReviewError` is thrown with code `wallet_unknown_state`. The run is marked as `needs_review` in the database. This requires manual intervention.

**How to handle `needs_review` runs:**
1. Check the run's artifacts (screenshots, HTML snapshots) via:
   ```bash
   curl http://localhost:3000/api/runs/<id>/artifacts
   ```
2. Download the failure screenshot to see what the wallet popup looked like.
3. Determine if selectors need updating or if the wallet state was unexpected.
4. Fix the issue, then either re-queue the run or create a new one.

---

### 7. Debugging

**`PWDEBUG=1` mode:**
```bash
PWDEBUG=1 npm run dev
```
This opens Playwright Inspector, pausing at each action. Useful for debugging selector issues.

**How to use Playwright Trace Viewer:**
The Worker captures trace files on failure at `./artifacts/<runId>/failure-<attempt>-trace.zip`.
```bash
npx playwright show-trace ./artifacts/<runId>/failure-1-trace.zip
```

**How to inspect wallet popup pages:**
1. Set `HEADLESS=false` in `.env`.
2. When the browser opens, the wallet extension popup will appear.
3. Right-click the popup → "Inspect" to open DevTools.
4. Check which selectors exist: use `$$('[data-testid="app-header-logo"]')` in the console.

**How to update selectors when wallet extension updates:**
1. Open the wallet extension manually.
2. Use DevTools to inspect the new UI elements.
3. Note the new `data-testid` attributes or CSS selectors.
4. Update the `METAMASK_SELECTORS` or `RABBY_SELECTORS` object in the corresponding controller file.
5. Follow the guide at `docs/selector-adaptation-guide.md`.

---

### 8. Operations

**How to add a new account:**
1. Create a new profile directory.
2. Launch the browser with that profile.
3. Import the account in MetaMask using seed phrase or private key.
4. Use the new profile's ID in run requests.

**How to add a new scenario:**
1. Create a new file in `src/core/scenario/scenarios/`, e.g., `MintNFTScenario.ts`.
2. Export a `Scenario` object with `id`, `title`, and `run(context)` method.
3. Register it in `main.ts`:
   ```typescript
   import { MintNFTScenario } from "./core/scenario/scenarios/MintNFTScenario";
   registry.register(MintNFTScenario);
   ```
4. Use `context.page` for dApp interactions and `context.wallet` for wallet interactions.

**How to add a new wallet adapter:**
Follow `docs/new-wallet-adapter-guide.md`. Key steps:
1. Create `src/core/wallet/<name>/<Name>Controller.ts`.
2. Implement the `WalletController` interface.
3. Define selectors with primary + fallback chains.
4. Register in `Worker.ts` detection logic.

**How to rotate secrets:**
1. Generate a new key: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
2. Update `APP_SECRET_KEY` in `.env`.
3. If using `SecretService` encrypted values (`ENC:...`), re-encrypt all values with the new key.
4. Restart the application.

**How to update wallet extensions:**
1. Download the new extension version.
2. Replace the files in `./extensions/metamask/` (or `./extensions/rabby/`).
3. Launch a browser manually to verify extension loads correctly.
4. Check that selectors still match (see Debugging section).
5. Update selectors in controller files as needed.
6. Run tests: `npm test`.

---

### 9. Error Reference

| Error Code | Meaning | Resolution |
|---|---|---|
| `wallet_unknown_state` | Wallet controller could not detect the wallet or wallet is in unexpected state | Check screenshot artifacts. Verify extension is loaded. Update selectors if wallet UI changed. |
| `wallet_popup_missing` | Wallet popup did not appear within timeout | Increase timeout. Verify dApp triggers wallet popup correctly. Check if wallet is locked. |
| `wallet_selector_todo` | A selector in the code is marked as TODO/placeholder | Implement the selector for the current wallet version. |
| `browser_launch_failed` | Playwright could not launch the browser | Check if Chromium is installed (`npx playwright install chromium`). Check if another process holds the profile lock. |
| `network_timeout` | HTTP request or page navigation timed out | Retry (transient). Check network connectivity. Increase timeout. |
| `rate_limit_exceeded` | dApp or RPC returned 429 | System will auto-retry with 15s+ backoff. Reduce parallel runs. |
| `auth_failed` | 401/403 from dApp or API | Check account credentials. Verify wallet is connected. |
| `ui_element_missing` | Playwright waiting for a selector that doesn't exist on the page | Check if dApp UI changed. Update scenario selectors. |
| `scenario_failed` | Generic scenario failure | Check artifacts and logs for specific error. |
| `run_cancelled` | Run was cancelled by user | Intentional. No action needed. |
| `unknown` | Unclassified error | Check full error message in logs. May indicate a bug. |

---

### 10. Known Limitations

| Limitation | Details |
|---|---|
| **Extensions require headed mode** | Chromium extensions cannot run in headless mode (old). Use `headless: 'new'` (Chrome new headless) or `headless: false`. |
| **Single wallet per profile** | Each browser profile can only have one wallet extension configured. To test both MetaMask and Rabby, use separate profiles. |
| **No multi-step transaction support** | Scenarios handle single transaction flows. Multi-step DeFi flows (approve → swap → confirm) require custom scenarios. |
| **No parallel runs per profile** | `ProfileLock` ensures one run per profile at a time. To run in parallel, create multiple profiles. |
| **Extension UI is version-sensitive** | Wallet extension updates can break all selectors overnight. Pin extension versions and test after updates. |
| **Dashboard is non-functional** | The dashboard has type definitions but no actual UI rendering framework. API-only for now. |
| **No automated profile provisioning** | Creating a new profile with a wallet requires manual browser launch and onboarding. |
| **No web3 RPC validation** | Scenarios do not verify on-chain state (e.g., transaction confirmation via RPC). They only verify dApp UI state. |
| **Redis queue has dequeue bugs** | Delayed items cause pop-push churn (see Fix F09). Use InMemoryQueue for single-worker setups. |
| **Worker loop not implemented** | The worker and scheduler must be manually wired (see Fix F03). |
