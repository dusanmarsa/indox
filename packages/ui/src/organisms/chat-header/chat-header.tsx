import * as React from "react";
import { cn } from "../../cn";

type ChatHeaderProps = Omit<React.ComponentProps<"header">, "title"> & {
  title: React.ReactNode;
  /** Optional stats row rendered next to the title. Wrap emphasised values
   *  in `<b>` for the design-system styling. */
  stats?: React.ReactNode;
  /** Right-side slot — typically icon buttons (share, settings, more). */
  actions?: React.ReactNode;
};

/**
 * Top bar for a chat thread. Matches the Indox Chat · Classic design: title
 * on the left with optional inline stats, icon actions on the right.
 */
function ChatHeader({ title, stats, actions, className, ...props }: ChatHeaderProps) {
  return (
    <header
      data-slot="chat-header"
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:gap-4 sm:px-7 sm:py-3.5",
        className
      )}
      {...props}
    >
      <div className="flex min-w-0 items-center gap-4">
        <h1 className="truncate text-[15.5px] font-medium tracking-[-0.01em] text-ink">{title}</h1>
        {stats && (
          <div className="hidden flex-1 font-mono text-[11px] tracking-[0.02em] text-ink-3 sm:block [&_b]:font-medium [&_b]:text-ink-2">
            {stats}
          </div>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

export { ChatHeader };
export type { ChatHeaderProps };
