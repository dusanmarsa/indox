import type { NextConfig } from "next";
import { join } from "node:path";

const nextConfig: NextConfig = {
  typedRoutes: true,
  serverExternalPackages: ["pg-boss", "pg"],
  turbopack: {
    root: join(import.meta.dirname, "..", ".."),
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "avatars.githubusercontent.com" }],
  },
  async headers() {
    return [
      {
        source: "/w/:slug*",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" }],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Cross-Origin-Resource-Policy", value: "cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
