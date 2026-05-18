"use client";

import * as React from "react";

import { cn } from "../../cn";

type InputProps = React.ComponentProps<"input"> & {
  /** When `type="password"`, render an eye toggle that swaps to `type="text"`. */
  revealable?: boolean;
  /** Render a copy-to-clipboard button that copies the current value. */
  copyable?: boolean;
  /** Extra content rendered at the end of the field (inside the box). */
  endAdornment?: React.ReactNode;
  /** Extra className applied to the outer wrapper (only when wrapped). */
  wrapperClassName?: string;
  /** Show invalid styling. */
  invalid?: boolean;
};

const baseClasses =
  "block w-full appearance-none rounded-md border border-border bg-surface px-3.5 py-2.5 font-sans text-[14px] text-ink outline-none placeholder:text-ink-3 transition-[border-color,box-shadow] duration-150 focus:border-brand focus:shadow-[0_0_0_3px_var(--indox-accent-soft)] disabled:opacity-45 disabled:pointer-events-none aria-invalid:border-bad aria-invalid:shadow-[0_0_0_3px_rgba(200,74,69,0.12)]";

const EyeIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden
  >
    <path d="M1.5 8s2.5-5 6.5-5 6.5 5 6.5 5-2.5 5-6.5 5S1.5 8 1.5 8z" />
    <circle cx="8" cy="8" r="2" />
  </svg>
);

const EyeOffIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden
  >
    <path d="M3 3l10 10M6.5 6.5a2 2 0 0 0 3 3M14.5 8s-2.5 5-6.5 5c-1 0-1.9-.2-2.8-.6M1.5 8s2.5-5 6.5-5c1 0 1.9.2 2.8.6" />
  </svg>
);

const CopyIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.4"
    aria-hidden
  >
    <rect x="5" y="5" width="9" height="9" rx="1.5" />
    <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2h-6A1.5 1.5 0 0 0 2 3.5v6A1.5 1.5 0 0 0 3.5 11H5" />
  </svg>
);

const CheckIcon = (
  <svg
    width="13"
    height="13"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    aria-hidden
  >
    <path d="m3 8 3.5 3.5L13 5" />
  </svg>
);

function Input({
  className,
  type,
  revealable,
  copyable,
  endAdornment,
  wrapperClassName,
  invalid,
  value,
  defaultValue,
  onChange,
  ...props
}: InputProps) {
  const [revealed, setRevealed] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const ref = React.useRef<HTMLInputElement>(null);

  const isPassword = type === "password";
  const effectiveType = isPassword && revealable && revealed ? "text" : type;
  const hasAdornment = Boolean(endAdornment || copyable || (isPassword && revealable));

  const handleCopy = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    const v = ref.current?.value ?? "";
    if (!v) return;
    await navigator.clipboard.writeText(v);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const inputEl = (
    <input
      ref={ref}
      type={effectiveType}
      data-slot="input"
      aria-invalid={invalid || undefined}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      className={cn(baseClasses, hasAdornment && "pr-10", className)}
      {...props}
    />
  );

  if (!hasAdornment) return inputEl;

  return (
    <div className={cn("relative w-full", wrapperClassName)}>
      {inputEl}
      <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1 text-ink-3">
        {endAdornment}
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            aria-label={copied ? "Copied" : "Copy to clipboard"}
            className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {copied ? CheckIcon : CopyIcon}
          </button>
        )}
        {isPassword && revealable && (
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-label={revealed ? "Hide value" : "Show value"}
            className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {revealed ? EyeOffIcon : EyeIcon}
          </button>
        )}
      </div>
    </div>
  );
}

export { Input };
export type { InputProps };
