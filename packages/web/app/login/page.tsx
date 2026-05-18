import { redirect } from "next/navigation";
import type { Route } from "next";
import { getUser } from "@/lib/session";
import AuthForm from "@/components/auth/AuthForm";
import { Brandmark, Eyebrow } from "@indox/ui";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getUser();
  const { next } = await searchParams;
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (user) redirect(safeNext as Route);

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brandmark />
        </div>
        <div className="rounded-xl border border-border bg-surface p-8">
          <div className="mb-6">
            <Eyebrow className="mb-3">Welcome</Eyebrow>
            <h1 className="mb-2 text-[24px] font-semibold tracking-[-0.025em] text-ink">
              Sign in to indox.
            </h1>
            <p className="font-mono text-[12px] text-ink-2">
              Or create an account to manage your indexed sources.
            </p>
          </div>
          <AuthForm next={safeNext} />
        </div>
      </div>
    </div>
  );
}
