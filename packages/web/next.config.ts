import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  // pg-boss + pg pull in native bindings that Turbopack can't bundle. Keep
  // them external on the server so they resolve through Node's normal require
  // at runtime.
  serverExternalPackages: ["pg-boss", "pg"],
  // Pin the workspace root so Turbopack doesn't pick up a stray lockfile
  // in $HOME and warn on every dev boot.
  turbopack: {
    root: join(import.meta.dirname, "..", ".."),
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
};

export default nextConfig;
