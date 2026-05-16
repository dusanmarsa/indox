"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/**
 * Tiny mono theme switcher styled to live in the landing footer. Three
 * states: system / light / dark. `system` follows OS preference, which is
 * what we want as the default first impression — `next-themes` already
 * handles the resolution.
 */
export function FooterThemeSwitch() {
  const { theme, setTheme } = useTheme();
  const isClient = useIsClient();

  // SSR / pre-hydration: render a fixed-width placeholder so the footer
  // doesn't shift when the real switch mounts.
  if (!isClient) {
    return (
      <span
        className="inline-block h-[20px] font-mono text-[12px] text-[var(--indox-dim)]"
        style={{ width: 132 }}
        aria-hidden
      />
    );
  }

  const options: { value: "system" | "light" | "dark"; label: string }[] = [
    { value: "system", label: "system" },
    { value: "light", label: "light" },
    { value: "dark", label: "dark" },
  ];

  return (
    <div className="inline-flex items-center gap-2 font-mono text-[12px]">
      <span className="text-[var(--indox-dim)]" aria-hidden>
        theme
      </span>
      <div
        className="inline-flex items-center"
        role="group"
        aria-label="Theme"
      >
        {options.map((o, i) => {
          const active = (theme ?? "system") === o.value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setTheme(o.value)}
              className="px-1.5 py-0.5 transition-colors"
              style={{
                color: active ? "var(--indox-text)" : "var(--indox-dim)",
                borderBottom: active
                  ? "1px solid var(--indox-accent)"
                  : "1px solid transparent",
                marginLeft: i === 0 ? 0 : 4,
              }}
              aria-pressed={active}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
