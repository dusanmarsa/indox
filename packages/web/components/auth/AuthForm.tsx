"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { signIn, signUp } from "@/lib/auth-client";
import { Button, Input, Label } from "@indox/ui";

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
      const result =
        mode === "signin"
          ? await signIn.email({ email, password })
          : await signUp.email({
              email,
              password,
              name: name || email.split("@")[0],
            });

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
        <label className="block space-y-1.5">
          <Label>Name (optional)</Label>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Jane"
            autoComplete="name"
          />
        </label>
      )}
      <label className="block space-y-1.5">
        <Label>Email</Label>
        <Input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>
      <label className="block space-y-1.5">
        <Label>Password</Label>
        <Input
          type="password"
          required
          minLength={10}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={mode === "signup" ? "at least 10 characters" : ""}
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
        />
      </label>

      {error && (
        <div
          className="rounded-md border px-3 py-2 font-mono text-[11px]"
          style={{
            borderColor: "var(--indox-bad)",
            background: "rgba(200,74,69,0.08)",
            color: "var(--indox-bad)",
          }}
        >
          {error}
        </div>
      )}

      <Button type="submit" variant="primary" disabled={busy} className="w-full">
        {busy ? "…" : mode === "signin" ? "Sign in" : "Create account"}
      </Button>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "signin" ? "signup" : "signin");
          setError(null);
        }}
        className="block w-full text-center font-mono text-[11px] text-ink-2 transition-colors hover:text-ink"
      >
        {mode === "signin"
          ? "Don't have an account? Create one."
          : "Already have an account? Sign in."}
      </button>
    </form>
  );
}
