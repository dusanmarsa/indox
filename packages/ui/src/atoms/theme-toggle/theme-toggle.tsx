import * as React from "react";
import { cn } from "../../cn";

type Theme = "light" | "dark";

type ThemeToggleProps = Omit<React.ComponentProps<"button">, "onChange"> & {
  theme: Theme;
  onToggle: () => void;
};

const SunIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

function ThemeToggle({ theme, onToggle, className, ...props }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      data-slot="theme-toggle"
      data-theme={theme}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-sm text-ink-2 transition-colors",
        "hover:bg-surface-2 hover:text-ink",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-soft",
        className
      )}
      {...props}
    >
      {theme === "dark" ? SunIcon : MoonIcon}
    </button>
  );
}

export { ThemeToggle };
export type { ThemeToggleProps, Theme };
