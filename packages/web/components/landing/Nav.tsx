"use client";

import Link from "next/link";
import type { Route } from "next";
import { useTheme } from "next-themes";
import { Sun, Moon, Star } from "lucide-react";
import { useSyncExternalStore } from "react";

const LINKS = [
  { href: "#features", label: "Product" },
  { href: "#deploy", label: "Self-host" },
  { href: "/login", label: "Sign in" },
];

const GITHUB_URL = "https://github.com/dusanmarsa/indox";

// `useSyncExternalStore` with a constant `true` snapshot gives us the
// post-hydration boolean without the "setState-in-effect" pattern lint flags.
const subscribe = () => () => {};
const useHasMounted = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );

export function Nav() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useHasMounted();
  const isDark = resolvedTheme === "dark";

  return (
    <nav
      className="fixed left-1/2 top-3.5 z-50 flex -translate-x-1/2 items-center gap-1 rounded-pill border py-1.5 pl-[18px] pr-1.5 backdrop-blur-[18px] backdrop-saturate-[140%]"
      style={{
        background: "var(--indox-nav-bg)",
        borderColor: "var(--indox-nav-border)",
        boxShadow: "var(--indox-nav-shadow)",
      }}
    >
      <Link
        href={"/" as Route}
        className="mr-1 flex items-center gap-[9px] whitespace-nowrap border-r pr-3.5 font-mono text-[13px] text-ink"
        style={{ borderColor: "var(--indox-nav-border)" }}
      >
        <span
          aria-hidden
          className="inline-block h-[7px] w-[7px] rounded-full bg-brand"
          style={{ boxShadow: "var(--indox-dot-glow)" }}
        />
        indox<span className="text-brand">.</span>
      </Link>

      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href as Route}
          className="rounded-pill px-3.5 py-[7px] font-mono text-[12.5px] whitespace-nowrap text-ink-2 transition-colors hover:bg-overlay-1 hover:text-ink"
        >
          {l.label}
        </Link>
      ))}

      <a
        href={GITHUB_URL}
        target="_blank"
        rel="noreferrer"
        className="ml-1 inline-flex items-center gap-1.5 rounded-pill border border-overlay-3 bg-overlay-2 px-3 py-1.5 font-mono text-[12px] text-ink transition-colors hover:bg-overlay-3"
      >
        <Star className="size-3" /> Star
      </a>

      <button
        type="button"
        aria-label="Toggle theme"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="ml-1 inline-flex h-[30px] w-[30px] items-center justify-center rounded-full text-ink-2 transition-colors hover:bg-overlay-1 hover:text-ink"
      >
        {mounted ? (
          isDark ? (
            <Sun className="size-3.5" />
          ) : (
            <Moon className="size-3.5" />
          )
        ) : (
          <Moon className="size-3.5" />
        )}
      </button>
    </nav>
  );
}
