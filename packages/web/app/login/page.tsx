import { redirect } from "next/navigation";
import type { Route } from "next";
import { getUser } from "@/lib/session";
import AuthForm from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

// Single sign-in surface. If the user is already authenticated we bounce
// them to the dashboard so this URL behaves as expected when shared.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getUser();
  const { next } = await searchParams;
  // Keep `next` minimal — only same-origin paths starting with "/" are
  // honoured, to avoid open redirects on a /login?next=https://evil link.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
  if (user) redirect(safeNext as Route);

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm border border-(--indox-border) bg-background p-8 space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.02em] mb-1">Welcome</h1>
          <p className="font-mono text-[12px] text-(--indox-muted)">
            Sign in or create an account to manage your indexed sources.
          </p>
        </div>
        <AuthForm next={safeNext} />
      </div>
    </div>
  );
}
