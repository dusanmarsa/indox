// Email + password only. No third-party OAuth in v0.1 — keeps self-hosters
// from needing an OAuth app, lets companies gate signup with INDOX_ALLOWED_EMAILS.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@indox/core";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required for auth to work`);
  return v;
}

const ALLOWED_EMAILS = (process.env.INDOX_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 10,
    maxPasswordLength: 256,
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          if (ALLOWED_EMAILS.length === 0) return { data: user };
          if (!ALLOWED_EMAILS.includes(user.email.toLowerCase())) {
            throw new Error(`${user.email} is not on this instance's signup allowlist`);
          }
          return { data: user };
        },
      },
    },
  },

  secret: required("BETTER_AUTH_SECRET"),
  baseURL: required("BETTER_AUTH_URL"),

  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
});

export type Session = typeof auth.$Infer.Session;
