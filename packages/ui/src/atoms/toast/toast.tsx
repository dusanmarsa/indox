import * as React from "react";
import { Toast as Primitive } from "radix-ui";
import { cn } from "../../cn";

const ToastProvider = Primitive.Provider;

function ToastViewport({ className, ...props }: React.ComponentProps<typeof Primitive.Viewport>) {
  return (
    <Primitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed top-0 right-0 z-[100] flex max-h-screen w-full max-w-[420px] flex-col gap-2 p-4",
        className
      )}
      {...props}
    />
  );
}

type ToastTone = "neutral" | "ok" | "warn" | "bad" | "info";

const TONE: Record<ToastTone, string> = {
  neutral: "border-border",
  ok: "border-ok",
  warn: "border-warn",
  bad: "border-bad",
  info: "border-info",
};

function Toast({
  className,
  tone = "neutral",
  ...props
}: React.ComponentProps<typeof Primitive.Root> & { tone?: ToastTone }) {
  return (
    <Primitive.Root
      data-slot="toast"
      data-tone={tone}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-md border bg-elev p-4 shadow-lg",
        "data-[state=open]:animate-in data-[state=open]:slide-in-from-right-full",
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full",
        "data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-[transform]",
        TONE[tone],
        className
      )}
      {...props}
    />
  );
}

function ToastTitle({ className, ...props }: React.ComponentProps<typeof Primitive.Title>) {
  return (
    <Primitive.Title
      data-slot="toast-title"
      className={cn("text-[13px] font-medium text-ink", className)}
      {...props}
    />
  );
}

function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Description>) {
  return (
    <Primitive.Description
      data-slot="toast-description"
      className={cn("text-[12.5px] leading-[1.55] text-ink-2", className)}
      {...props}
    />
  );
}

function ToastAction({ className, ...props }: React.ComponentProps<typeof Primitive.Action>) {
  return (
    <Primitive.Action
      data-slot="toast-action"
      className={cn(
        "ml-auto rounded-xs border border-border px-2 py-1 font-mono text-[11px] text-ink-2 hover:bg-surface-2",
        className
      )}
      {...props}
    />
  );
}

function ToastClose({ className, ...props }: React.ComponentProps<typeof Primitive.Close>) {
  return (
    <Primitive.Close
      data-slot="toast-close"
      aria-label="Close"
      className={cn("absolute top-2 right-2 rounded-md p-1 text-ink-3 hover:text-ink", className)}
      {...props}
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden
      >
        <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
      </svg>
    </Primitive.Close>
  );
}

export {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
};
export type { ToastTone };
