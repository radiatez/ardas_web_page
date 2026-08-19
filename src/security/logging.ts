const blockedKeyPattern =
  /(?:authorization|cookie|token|secret|password|credential|api.?key|access.?key|private.?key|email|phone|first.?name|last.?name|display.?name|message|body|about|cv|file.?content|filename|salary|birth|gender|marital|military)/i;
const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const bearerPattern = /\bbearer\s+[a-z0-9._~+/-]+=*/i;
const jwtPattern = /\beyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/;
const phonePattern = /(?:\+?\d[\d\s().-]{7,}\d)/;
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const redactedValue = "[REDACTED]";

function sanitizeString(value: string): string {
  if (uuidPattern.test(value)) {
    return value;
  }
  if (
    emailPattern.test(value) ||
    bearerPattern.test(value) ||
    jwtPattern.test(value) ||
    phonePattern.test(value)
  ) {
    return redactedValue;
  }

  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") {
      return `${url.origin}${url.pathname}`;
    }
  } catch {
    // Non-URL strings continue through the ordinary safe path.
  }

  return value.length > 500 ? `${value.slice(0, 500)}…` : value;
}

export function sanitizeStructuredData(
  value: unknown,
  key = "",
): unknown {
  if (blockedKeyPattern.test(key)) {
    return redactedValue;
  }

  if (value === null || typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return sanitizeString(value);
  }

  if (value instanceof Error) {
    return { name: value.name };
  }

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeStructuredData(item));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .slice(0, 100)
        .map(([entryKey, entryValue]) => [
          entryKey,
          sanitizeStructuredData(entryValue, entryKey),
        ]),
    );
  }

  return undefined;
}

export type LogLevel = "info" | "warn" | "error";

export interface StructuredLogRecord {
  timestamp: string;
  level: LogLevel;
  event: string;
  context: unknown;
}

type LogSink = (record: StructuredLogRecord) => void;

const defaultSink: LogSink = (record) => {
  process.stdout.write(`${JSON.stringify(record)}\n`);
};

export function createLogger(sink: LogSink = defaultSink) {
  const write = (level: LogLevel, event: string, context: unknown = {}) => {
    sink({
      timestamp: new Date().toISOString(),
      level,
      event,
      context: sanitizeStructuredData(context),
    });
  };

  return {
    info: (event: string, context?: unknown) => write("info", event, context),
    warn: (event: string, context?: unknown) => write("warn", event, context),
    error: (event: string, context?: unknown) => write("error", event, context),
  };
}

export const securityLogger = createLogger();
