export type ObservabilityEvent = {
  name: string;
  time: string;
  payload?: Record<string, unknown>;
  metrics?: {
    durationMs?: number;
    errorCount?: number;
    successCount?: number;
  };
};

export type ObservabilityHooks = {
  onEvent(event: ObservabilityEvent): void;
  recordMetric(name: string, value: number, tags?: Record<string, string>): void;
};

export const createNoopObservability = (): ObservabilityHooks => ({
  onEvent: () => { },
  recordMetric: () => { }
});
