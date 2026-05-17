type Level = "info" | "warn" | "error" | "debug";

// When running as the MCP stdio transport, stdout is the JSON-RPC channel —
// any stray console.log there corrupts the protocol and the client errors with
// "Unexpected token … is not valid JSON". In that case, route every level to
// stderr. Web, worker, and the hosted HTTP MCP all keep normal stdout logging.
//
// Detection: argv[1] is the entrypoint xmcp built. Stdio = `stdio.js`,
// HTTP = `http.js`. The env override (`INDOX_LOG_STDERR=1` to force, `=0` to
// disable) is the escape hatch for anything that doesn't match.
const stderrOnly = (() => {
  const override = process.env.INDOX_LOG_STDERR;
  if (override === "1") return true;
  if (override === "0") return false;
  const entry = process.argv[1] ?? "";
  return entry.endsWith("stdio.js") || entry.endsWith("/stdio");
})();

function log(level: Level, tag: string, msg: string, data?: unknown) {
  const prefix = `[indox:${tag}]`;
  const out = data !== undefined ? [prefix, msg, data] : [prefix, msg];
  if (level === "debug" && process.env.NODE_ENV === "production") return;
  if (stderrOnly) {
    console.error(...out);
    return;
  }
  if (level === "error") console.error(...out);
  else if (level === "warn") console.warn(...out);
  else if (level === "debug") console.debug(...out);
  else console.log(...out);
}

export const logger = {
  info: (tag: string, msg: string, data?: unknown) => log("info", tag, msg, data),
  warn: (tag: string, msg: string, data?: unknown) => log("warn", tag, msg, data),
  error: (tag: string, msg: string, data?: unknown) => log("error", tag, msg, data),
  debug: (tag: string, msg: string, data?: unknown) => log("debug", tag, msg, data),
};
