// Browser-side auth client. Only needed for components that initiate the
// login flow (the /login form) or sign out from a client component.
// Server components/route handlers should use `lib/auth.ts` directly.

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();
export const { signIn, signUp, signOut, useSession } = authClient;
