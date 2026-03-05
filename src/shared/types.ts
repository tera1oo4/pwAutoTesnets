export type ISODateString = string;
export type ID = string;

export type NetworkId = ID;
export type ProfileId = ID;
export type RunId = ID;

export type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "needs_review";

export type NetworkConfig = {
  id: NetworkId;
  name: string;
  rpcUrl: string;
  chainId: number;
  isActive: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type BrowserProfile = {
  id: ProfileId;
  label: string;
  userDataDir: string;
  proxyUrl?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type ProfileLockState = {
  profileId: ProfileId;
  ownerId: ID;
  lockToken: ID;
  host: string;
  pid: number;
  acquiredAt: ISODateString;
  expiresAt: ISODateString;
  updatedAt: ISODateString;
};

export type TestRun = {
  id: RunId;
  networkId: NetworkId;
  profileId: ProfileId;
  status: RunStatus;
  startedAt: ISODateString;
  finishedAt?: ISODateString;
  errorMessage?: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type BrowserSession = {
  id: ID;
  profileId: ProfileId;
  createdAt: ISODateString;
  metadata?: Record<string, unknown>;
};

export type BrowserLaunchOptions = {
  headless?: boolean;
  extraArgs?: string[];
  proxyUrl?: string;
};

export type BrowserDriver = {
  launch(profile: BrowserProfile, options?: BrowserLaunchOptions): Promise<BrowserSession>;
  close(session: BrowserSession): Promise<void>;
};

export type LocatorHandle = {
  isVisible(options?: { timeout?: number }): Promise<boolean>;
  click(options?: { timeout?: number }): Promise<void>;
  fill(value: string, options?: { timeout?: number }): Promise<void>;
};

export type PageHandle = {
  locator(selector: string): LocatorHandle;
  waitForTimeout(ms: number): Promise<void>;
  evaluate<T>(pageFunction: () => T | Promise<T>): Promise<T>;
  screenshot(options?: { path?: string }): Promise<Buffer>;
  content(): Promise<string>;
  startTracing(): Promise<void>;
  stopTracing(path: string): Promise<void>;
  getConsoleLogs(): string[];
  getNetworkLogs(): string[];
};

export const LogLevel = {
  debug: "debug",
  info: "info",
  warn: "warn",
  error: "error"
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export type LogEvent = {
  level: LogLevel;
  name: string;
  message: string;
  time: ISODateString;
  context?: Record<string, unknown>;
};

export type Logger = {
  log(event: Omit<LogEvent, "time"> & { time?: ISODateString }): void;
  debug(name: string, message: string, context?: Record<string, unknown>): void;
  info(name: string, message: string, context?: Record<string, unknown>): void;
  warn(name: string, message: string, context?: Record<string, unknown>): void;
  error(name: string, message: string, context?: Record<string, unknown>): void;
};

export const WalletKind = {
  MetaMask: "metamask",
  Rabby: "rabby"
} as const;

export type WalletKind = (typeof WalletKind)[keyof typeof WalletKind];

export type WalletDetection = {
  kind: WalletKind;
  confidence: number;
  reason?: string;
};

export type WalletContext = {
  logger: Logger;
  timeoutMs?: number;
};

export type WalletConnectionRequest = {
  chainId: number;
};

export type WalletController = {
  kind: WalletKind;
  detect(page: PageHandle, context: WalletContext): Promise<WalletDetection | null>;
  unlock(page: PageHandle, password: string, context: WalletContext): Promise<void>;
  connect(page: PageHandle, context: WalletContext): Promise<void>;
  ensureNetwork(page: PageHandle, request: WalletConnectionRequest, context: WalletContext): Promise<void>;
};

export type ScenarioId = ID;

export type ScenarioRun = {
  id: RunId;
  scenarioId: ScenarioId;
  networkId: NetworkId;
  profileId: ProfileId;
  attempt: number;
};

export type ScenarioContext = {
  logger: Logger;
  page: PageHandle;
  run: ScenarioRun;
  artifacts: ArtifactWriter;
  abortSignal?: AbortSignal; // Added task cancellation support
};

export type Scenario = {
  id: ScenarioId;
  title: string;
  run(context: ScenarioContext): Promise<void>;
};

export type ScenarioRegistry = {
  register(scenario: Scenario): void;
  get(id: ScenarioId): Scenario;
  list(): Scenario[];
};

export type QueueEnqueueOptions = {
  delayMs?: number;
};

export type QueueDequeueOptions = {
  waitMs?: number;
};

export type QueueItem<T> = {
  id: ID;
  payload: T;
  enqueuedAt: ISODateString;
  availableAt: ISODateString;
};

export type Queue<T> = {
  enqueue(payload: T, options?: QueueEnqueueOptions): Promise<QueueItem<T>>;
  dequeue(options?: QueueDequeueOptions): Promise<QueueItem<T> | null>;
  ack(itemId: ID): Promise<void>;
};

export type RedisQueueClient = {
  lpush(key: string, value: string): Promise<number>;
  rpop(key: string): Promise<string | null>;
};

export type RunQueuePayload = {
  runId: RunId;
  scenarioId: ScenarioId;
  attempt: number;
};

export type ArtifactRecord = {
  screenshotPath?: string;
  htmlPath?: string;
  tracePath?: string;
  consoleLogsPath?: string;
  networkLogsPath?: string;
  metadataPath?: string;
};

export type ArtifactWriter = {
  captureScreenshot(page: PageHandle, runId: RunId, name: string): Promise<string>;
  captureHtml(page: PageHandle, runId: RunId, name: string): Promise<string>;
  captureTrace(page: PageHandle, runId: RunId, name: string): Promise<string>;
  captureLogs(page: PageHandle, runId: RunId, name: string): Promise<{ consolePath: string; networkPath: string }>;
  captureMetadata(runId: RunId, name: string, metadata: Record<string, unknown>): Promise<string>;
};

export type RunRecord = {
  id: RunId;
  scenarioId: ScenarioId;
  networkId: NetworkId;
  profileId: ProfileId;
  status: RunStatus;
  attempt: number;
  maxAttempts: number;
  nextAttemptAt?: ISODateString;
  lastErrorCode?: RunErrorCode;
  lastErrorMessage?: string;
  lastErrorAt?: ISODateString;
  cancelledAt?: ISODateString;
  createdAt: ISODateString;
  updatedAt: ISODateString;
};

export type RunErrorCode =
  | "wallet_unknown_state"
  | "wallet_popup_missing"
  | "wallet_selector_todo"
  | "browser_launch_failed"
  | "network_timeout"
  | "rate_limit_exceeded"
  | "auth_failed"
  | "ui_element_missing"
  | "scenario_failed"
  | "run_cancelled"
  | "unknown";

export type RunStore = {
  getRun(runId: RunId): Promise<RunRecord | null>;
  listPendingRuns(limit: number, now?: ISODateString): Promise<RunRecord[]>;
  listRuns(options?: { status?: RunStatus; limit?: number }): Promise<RunRecord[]>;
  createRun(run: RunRecord): Promise<void>;
  markRunning(runId: RunId): Promise<void>;
  markQueued(
    runId: RunId,
    errorMessage?: string,
    artifacts?: ArtifactRecord,
    nextAttemptAt?: ISODateString,
    errorCode?: RunErrorCode
  ): Promise<void>;
  markNeedsReview(runId: RunId, errorMessage?: string, artifacts?: ArtifactRecord, errorCode?: RunErrorCode): Promise<void>;
  markCancelled(runId: RunId, reason?: string): Promise<void>;
  markFailed(runId: RunId, errorMessage: string, artifacts?: ArtifactRecord): Promise<void>;
  markCompleted(runId: RunId): Promise<void>;
  incrementAttempt(runId: RunId): Promise<number>;
};

export type PageFactory = {
  create(profileId: ProfileId): Promise<PageHandle>;
  close(page: PageHandle): Promise<void>;
};
