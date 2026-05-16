"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "#how", label: "how it works" },
  { href: "#deploy", label: "self-host" },
  { href: "#demo", label: "demo" },
];

const GITHUB_URL = "https://github.com/dusanmarsa/indox";

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed  inset-x-0 top-0 z-40 border-b border-transparent transition-colors",
        scrolled && "border-border backdrop-blur-md bg-background",
      )}
    >
      <div className="container px-10 mx-auto flex h-13.5 items-center justify-between">
        <a
          href="#top"
          className="font-mono text-[13px] text-foreground"
          aria-label="Indox home"
        >
          indox<span className="text-(--indox-accent)">.</span>
        </a>

        <div className="flex items-center gap-7">
          <div className="hidden items-center gap-7 sm:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-[13px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            className="border border-border px-3 py-1.5 font-mono text-[12px] text-foreground transition-colors hover:text-muted-foreground"
          >
            github ↗
          </a>
        </div>
      </div>
    </nav>
  );
}
