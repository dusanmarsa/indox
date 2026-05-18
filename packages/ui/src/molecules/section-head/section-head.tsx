import * as React from "react";
import { cn } from "../../cn";
import { Eyebrow } from "../../atoms/eyebrow";

type SectionHeadProps = Omit<React.ComponentProps<"div">, "title"> & {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lead?: React.ReactNode;
  align?: "center" | "left";
};

function SectionHead({
  eyebrow,
  title,
  lead,
  align = "center",
  className,
  ...props
}: SectionHeadProps) {
  return (
    <div
      data-slot="section-head"
      className={cn(
        "max-w-[720px]",
        align === "center" ? "mx-auto text-center" : "text-left",
        className
      )}
      {...props}
    >
      {eyebrow && (
        <div className="mb-[22px]">
          <Eyebrow>{eyebrow}</Eyebrow>
        </div>
      )}
      <h2 className="font-sans text-[42px] leading-[1.05] font-medium tracking-[-0.02em] text-ink">
        {title}
      </h2>
      {lead && (
        <p className="mt-[22px] text-[17px] leading-[1.55] tracking-[-0.005em] text-ink-2">
          {lead}
        </p>
      )}
    </div>
  );
}

export { SectionHead };
export type { SectionHeadProps };
