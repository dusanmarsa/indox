import * as React from "react";
import { cn } from "../../cn";

type LandingNavLink = { label: React.ReactNode; href: string };

type LandingNavProps = React.ComponentProps<"nav"> & {
  links?: LandingNavLink[];
  cta?: React.ReactNode;
};

function LandingNav({ links = [], cta, className, ...props }: LandingNavProps) {
  return (
    <nav
      data-slot="landing-nav"
      className={cn(
        "fixed top-3.5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-1 rounded-full border border-(--indox-nav-border) bg-(--indox-nav-bg) px-1.5 py-1.5 pl-[18px] shadow-(--indox-nav-shadow) backdrop-blur-xl",
        className
      )}
      {...props}
    >
      <div className="mr-1 flex items-center gap-2.5 border-r border-(--indox-nav-border) pr-3.5 font-mono text-[13px] whitespace-nowrap">
        <span aria-hidden className="size-[7px] rounded-full bg-brand shadow-(--indox-dot-glow)" />
        <span>indox</span>
      </div>
      {links.map((l) => (
        <a
          key={l.href}
          href={l.href}
          className="rounded-full px-3.5 py-1.5 font-mono text-[12.5px] whitespace-nowrap text-ink-2 transition-colors hover:bg-white/[0.04] hover:text-ink"
        >
          {l.label}
        </a>
      ))}
      {cta && <div className="ml-1">{cta}</div>}
    </nav>
  );
}

export { LandingNav };
export type { LandingNavProps, LandingNavLink };
