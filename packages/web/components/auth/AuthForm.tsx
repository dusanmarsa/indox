"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { signIn, signUp } from "@/lib/auth-client";

// Unified sign-in / sign-up form. better-auth handles password hashing,
// session cookie issuance, and the rotating CSRF token — we just collect
// the fields and call the right endpoint. The toggle is a single useState
// so this stays a single component instead of two pages.

type Mode = "signin" | "signup";

export default function AuthForm({ next }: { next: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = mode === "signin"
        ? await signIn.email({ email, password })
        : await signUp.email({ email, password, name: name || email.split("@")[0] });

      // better-auth returns `{ error }` instead of throwing for credential
      // failures, so check both shapes.
      if (result?.error) {
        throw new Error(result.error.message ?? "auth failed");
      }
      router.push(next as Route);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {mode === "signup" && (
        <Field label="Name (optional)">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane"
            autoComplete="name"
            className="w-full border border-(--indox-border) bg-background px-[10px] py-[7px] font-mono text-[12.5px] outline-none focus:border-(--indox-muted)"
          />
        </Field>
      )}
      <Field label="Email">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          className="w-full border border-(--indox-border) bg-background px-[10px] py-[7px] font-mono text-[12.5px] outline-none focus:border-(--indox-muted)"
        />
      </Field>
      <Field label="Password">
        <input
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "at least 10 characters" : ""}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          className="w-full border border-(--indox-border) bg-background px-[10px] py-[7px] font-mono text-[12.5px] outline-none focus:border-(--indox-muted)"
        />
      </Field>

      {error && (
        <div className="border border-[#8a6a1e]/40 bg-[#fdf8ec] px-[10px] py-[6px] font-mono text-[11px] text-[#8a6a1e] dark:bg-[#8a6a1e]/15">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full border border-(--indox-border) bg-(--indox-surface) px-4 py-2.5 font-mono text-[12.5px] text-foreground transition-colors hover:bg-(--indox-surface)/70 disabled:opacity-50"
      >
        {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className="block w-full text-center font-mono text-[11px] text-(--indox-muted) transition-colors hover:text-foreground"
      >
        {mode === "signin"
          ? "Don't have an account? Create one."
          : "Already have an account? Sign in."}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block font-mono text-[10.5px] uppercase tracking-[0.08em] text-(--indox-dim)">
        {label}
      </span>
      {children}
    </label>
  );
}
