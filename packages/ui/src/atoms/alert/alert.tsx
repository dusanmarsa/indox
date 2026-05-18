import * as React from "react";
import { cn } from "../../cn";

type AlertTone = "neutral" | "info" | "ok" | "warn" | "bad";

type AlertProps = Omit<React.ComponentProps<"div">, "title"> & {
  tone?: AlertTone;
  icon?: React.ReactNode;
  title?: React.ReactNode;
  action?: React.ReactNode;
};

const TONE: Record<AlertTone, { wrap: string; text: string }> = {
  neutral: {
    wrap: "border-border bg-surface",
    text: "text-ink",
  },
  info: {
    wrap: "border-info/40 bg-info/[0.06]",
    text: "text-info",
  },
  ok: {
    wrap: "border-ok/40 bg-ok/[0.06]",
    text: "text-ok",
  },
  warn: {
    wrap: "border-warn/40 bg-warn/[0.06]",
    text: "text-warn",
  },
  bad: {
    wrap: "border-bad/40 bg-bad/[0.06]",
    text: "text-bad",
  },
};

function Alert({
  tone = "neutral",
  icon,
  title,
  action,
  className,
  children,
  ...props
}: AlertProps) {
  const t = TONE[tone];
  return (
    <div
      data-slot="alert"
      data-tone={tone}
      role={tone === "bad" || tone === "warn" ? "alert" : "status"}
      className={cn("flex items-start gap-3 rounded-md border p-3.5", t.wrap, className)}
      {...props}
    >
      {icon && (
        <span className={cn("mt-0.5 shrink-0", t.text)} aria-hidden>
          {icon}
        </span>
      )}
      <div className="flex-1">
        {title && <div className={cn("text-[13px] font-medium", t.text)}>{title}</div>}
        {children && <div className="text-[13px] leading-[1.55] text-ink-2">{children}</div>}
      </div>
      {action}
    </div>
  );
}

export { Alert };
export type { AlertProps, AlertTone };
