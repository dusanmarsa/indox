"use client";

import * as React from "react";
import { cn } from "../../cn";

type RevealProps = React.ComponentProps<"div"> & {
  delay?: number;
};

/**
 * Fade-in-up wrapper triggered when the element enters the viewport.
 * Honors prefers-reduced-motion by skipping the transform entirely.
 * Relies on `.indox-reveal` + `.indox-reveal-in` classes defined in the
 * design system globals.css.
 */
function Reveal({ delay = 0, className, style, children, ...props }: RevealProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      el.classList.add("indox-reveal-in");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            el.classList.add("indox-reveal-in");
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      data-slot="reveal"
      className={cn("indox-reveal", className)}
      style={delay ? { ...style, transitionDelay: `${delay}ms` } : style}
      {...props}
    >
      {children}
    </div>
  );
}

export { Reveal };
export type { RevealProps };
