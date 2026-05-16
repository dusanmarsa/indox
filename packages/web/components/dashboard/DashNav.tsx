import Link from "next/link";
import { DashThemeToggle } from "./DashThemeToggle";

export function DashNav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-40 h-[54px] border-b border-(--indox-border) bg-(--indox-nav-bg) backdrop-blur-sm">
      <div className="flex h-full items-center justify-between px-6">
        <Link
          href="/"
          className="font-mono text-[13px] text-foreground transition-colors hover:text-(--indox-muted)"
          aria-label="Indox home"
        >
          indox<span className="text-(--indox-accent)">.</span>
        </Link>

        <div className="flex items-center gap-5">
          <span className="flex items-center gap-1.5 font-mono text-[11px] text-(--indox-ok)">
            <span className="block h-1.5 w-1.5 rounded-none bg-(--indox-ok)" aria-hidden />
            running
          </span>
          <span className="font-mono text-[11px] text-(--indox-dim)">v0.1.0</span>
          <DashThemeToggle />
        </div>
      </div>
    </nav>
  );
}
