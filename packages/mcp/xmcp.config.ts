import type { XmcpConfig } from "xmcp";

// Dual transport so the same codebase serves both surfaces:
//   - stdio  → local agents (Claude Code, Claude Desktop, Cursor)
//   - http   → remote/self-hosted Indox deployments behind a URL
//
// Tools live under src/tools/*.ts and are auto-registered by xmcp via
// file-based routing. No central tool list to maintain.
const config: XmcpConfig = {
  http: {
    // Railway/Heroku/Fly inject the public port via $PORT. Fall back to 3030
    // for local dev where nothing's setting it.
    port: parseInt(process.env.PORT ?? "3030", 10),
    // Bind to 0.0.0.0 in production so Railway's edge can reach the listener.
    // The default (127.0.0.1) is fine locally but invisible from outside the
    // container, which produces a 502 "Application failed to respond".
    host: process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1",
    endpoint: "/mcp",
  },
  stdio: true,
  // We only define tools right now; opt out of the prompts/resources scaffold
  // so xmcp doesn't error on missing directories.
  paths: {
    prompts: false,
    resources: false,
  },
};

export default config;
