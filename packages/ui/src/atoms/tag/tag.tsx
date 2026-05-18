import * as React from "react";
import { cn } from "../../cn";

type TagTone = "default" | "docs" | "pg" | "s3" | "gd" | "gh" | "outline";

type TagProps = React.ComponentProps<"span"> & {
  tone?: TagTone;
};

const TONE: Record<TagTone, string> = {
  default: "bg-brand-soft text-brand rounded-xs px-2 py-0.5 text-[10.5px]",
  docs: "bg-brand-soft text-brand rounded-xs px-2 py-0.5 text-[10.5px]",
  pg: "bg-[rgba(90,138,107,0.16)] text-ok rounded-xs px-2 py-0.5 text-[10.5px]",
  s3: "bg-[rgba(200,148,26,0.16)] text-warn rounded-xs px-2 py-0.5 text-[10.5px]",
  gd: "bg-[rgba(140,140,160,0.18)] text-[#b0b0bc] rounded-xs px-2 py-0.5 text-[10.5px]",
  gh: "bg-[rgba(180,90,200,0.16)] text-src-gh rounded-xs px-2 py-0.5 text-[10.5px]",
  outline:
    "bg-transparent text-ink-3 border border-border rounded-full px-2 py-px text-[9.5px] uppercase",
};

function Tag({ tone = "default", className, ...props }: TagProps) {
  return (
    <span
      data-slot="tag"
      data-tone={tone}
      className={cn("inline-block font-mono tracking-[0.04em]", TONE[tone], className)}
      {...props}
    />
  );
}

export { Tag };
export type { TagProps, TagTone };
