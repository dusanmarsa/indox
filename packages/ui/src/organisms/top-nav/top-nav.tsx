import * as React from "react";
import { cn } from "../../cn";

type TopNavTab = { value: string; label: React.ReactNode };

type TopNavProps = React.ComponentProps<"nav"> & {
  scope?: React.ReactNode;
  tabs?: TopNavTab[];
  activeTab?: string;
  onTabChange?: (value: string) => void;
  search?: React.ReactNode;
  right?: React.ReactNode;
};

function TopNav({
  scope,
  tabs = [],
  activeTab,
  onTabChange,
  search,
  right,
  className,
  ...props
}: TopNavProps) {
  return (
    <nav
      data-slot="top-nav"
      className={cn("flex items-center gap-6 border-b border-border bg-elev px-6 py-3", className)}
      {...props}
    >
      <div className="flex items-center gap-2.5 font-mono text-[13.5px]">
        <span aria-hidden className="size-[7px] rounded-full bg-brand" />
        <span className="text-ink">indox</span>
        {scope && (
          <>
            <span className="mx-1 text-ink-3">/</span>
            <span className="font-normal text-ink-2">{scope}</span>
          </>
        )}
      </div>
      {tabs.length > 0 && (
        <div className="flex gap-1">
          {tabs.map((t) => {
            const on = t.value === activeTab;
            return (
              <button
                key={t.value}
                type="button"
                onClick={() => onTabChange?.(t.value)}
                data-state={on ? "active" : "inactive"}
                className={cn(
                  "rounded-md px-3 py-1.5 font-mono text-[12.5px] transition-colors",
                  on ? "bg-surface text-ink" : "text-ink-3 hover:bg-surface hover:text-ink"
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}
      <div className="ml-auto flex items-center gap-3">
        {search}
        {right}
      </div>
    </nav>
  );
}

export { TopNav };
export type { TopNavProps, TopNavTab };
