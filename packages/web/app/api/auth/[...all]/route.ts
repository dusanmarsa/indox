// Catch-all handler for better-auth. Handles /api/auth/sign-in, /callback,
// /sign-out, /get-session, etc. — every endpoint better-auth exposes.
// We never call this directly; the auth client + redirect flows do.

import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

export const { POST, GET } = toNextJsHandler(auth);
