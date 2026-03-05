import { LogLevel } from "./types.ts";
import type { LogEvent, Logger } from "./types.ts";

type LoggerBase = {
  context?: Record<string, unknown>;
};

export const createConsoleLogger = (base: LoggerBase = {}): Logger => {
  const log = (event: Omit<LogEvent, "time"> & { time?: string }) => {
    const payload = {
      time: event.time ?? new Date().toISOString(),
      level: event.level,
      name: event.name,
      message: event.message,
      context: {
        ...base.context,
        ...event.context
      }
    };
    console.log(JSON.stringify(payload));
  };

  return {
    log,
    debug: (name, message, context) =>
      log({ level: LogLevel.debug, name, message, context }),
    info: (name, message, context) =>
      log({ level: LogLevel.info, name, message, context }),
    warn: (name, message, context) =>
      log({ level: LogLevel.warn, name, message, context }),
    error: (name, message, context) =>
      log({ level: LogLevel.error, name, message, context })
  };
};
