"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    label: "monitor",
    items: [
      { href: "/dashboard",         label: "overview",  glyph: "◈", exact: true },
      { href: "/dashboard/sources", label: "sources",   glyph: "▸" },
      { href: "/dashboard/queries", label: "queries",   glyph: "~" },
      { href: "/dashboard/logs",    label: "logs",      glyph: "≡" },
    ],
  },
  {
    label: "configure",
    items: [
      { href: "/dashboard/adapters", label: "adapters", glyph: "◆" },
      { href: "/dashboard/mcp",      label: "mcp",      glyph: "⌬" },
      { href: "/dashboard/settings", label: "settings", glyph: "⚙" },
    ],
  },
];

export function DashSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[196px] shrink-0 flex-col overflow-y-auto border-r border-(--indox-border) bg-(--indox-surface) py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="mb-1">
          <p className="px-4 pb-1 pt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-(--indox-dim)">
            {section.label}
          </p>
          {section.items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as "/dashboard"}
                className={cn(
                  "flex items-center gap-[9px] border-l-2 px-4 py-[7px] text-[13px] transition-colors",
                  active
                    ? "border-l-(--indox-accent) bg-background text-foreground"
                    : "border-l-transparent text-(--indox-muted) hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "w-3.5 shrink-0 font-mono text-[12px]",
                    active ? "text-(--indox-muted)" : "text-(--indox-dim)",
                  )}
                >
                  {item.glyph}
                </span>
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}

      <hr className="mx-0 my-2.5 border-t border-(--indox-border)" />

      <div className="mt-auto border-t border-(--indox-border) px-4 pt-3">
        <p className="py-0.5 font-mono text-[10.5px] text-(--indox-dim)">v0.1.0 · MIT</p>
        <p className="py-0.5 font-mono text-[10.5px] text-(--indox-dim)">:8080 · running</p>
      </div>
    </aside>
  );
}
