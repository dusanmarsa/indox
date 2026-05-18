import * as React from "react";
import { cn } from "../../cn";
import { Kbd } from "../../atoms/kbd";

type SearchFieldProps = Omit<React.ComponentProps<"input">, "size" | "prefix"> & {
  icon?: React.ReactNode;
  shortcut?: React.ReactNode;
  mono?: boolean;
  containerClassName?: string;
};

const DefaultIcon = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    aria-hidden
  >
    <circle cx="7" cy="7" r="5" />
    <path d="m11 11 4 4" />
  </svg>
);

function SearchField({
  icon = DefaultIcon,
  shortcut,
  mono,
  containerClassName,
  className,
  ...props
}: SearchFieldProps) {
  return (
    <div
      data-slot="search-field"
      className={cn(
        "flex min-w-[280px] items-center gap-2.5 rounded-md border border-border bg-surface px-4 py-2.5 transition-colors focus-within:border-border-strong",
        containerClassName
      )}
    >
      <span className="text-ink-3">{icon}</span>
      <input
        className={cn(
          "flex-1 bg-transparent text-[13.5px] text-ink outline-none placeholder:text-ink-3",
          mono && "font-mono text-[13px]",
          className
        )}
        {...props}
      />
      {shortcut && <Kbd className="ml-auto">{shortcut}</Kbd>}
    </div>
  );
}

export { SearchField };
export type { SearchFieldProps };
