type Level = "info" | "warn" | "error" | "debug";

function log(level: Level, tag: string, msg: string, data?: unknown) {
  const prefix = `[indox:${tag}]`;
  const out = data !== undefined ? [prefix, msg, data] : [prefix, msg];
  if (level === "error") console.error(...out);
  else if (level === "warn") console.warn(...out);
  else if (level === "debug" && process.env.NODE_ENV !== "production") console.debug(...out);
  else console.log(...out);
}

export const logger = {
  info: (tag: string, msg: string, data?: unknown) => log("info", tag, msg, data),
  warn: (tag: string, msg: string, data?: unknown) => log("warn", tag, msg, data),
  error: (tag: string, msg: string, data?: unknown) => log("error", tag, msg, data),
  debug: (tag: string, msg: string, data?: unknown) => log("debug", tag, msg, data),
};
