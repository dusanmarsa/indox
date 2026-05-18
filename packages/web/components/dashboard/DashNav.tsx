import Link from "next/link";
import { DashThemeToggle } from "./DashThemeToggle";
import { Brandmark, Pill } from "@indox/ui";

export function DashNav() {
  return (
    <nav
      className="fixed inset-x-0 top-0 z-40 h-[54px] border-b backdrop-blur-md"
      style={{
        background: "var(--indox-nav-bg)",
        borderColor: "var(--indox-nav-border)",
      }}
    >
      <div className="flex h-full items-center justify-between px-6">
        <Link href="/" aria-label="Indox home">
          <Brandmark />
        </Link>

        <div className="flex items-center gap-4">
          <Pill tone="ok">running</Pill>
          <span className="font-mono text-[11px] tracking-[0.04em] text-ink-3">v0.1.0</span>
          <DashThemeToggle />
        </div>
      </div>
    </nav>
  );
}
