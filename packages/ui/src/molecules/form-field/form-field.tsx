import * as React from "react";
import { cn } from "../../cn";

type FormFieldProps = React.ComponentProps<"div"> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  htmlFor?: string;
};

/**
 * Composition wrapper for a form input. Bundles label, hint, and error around
 * a field child (Input, Textarea, Select, etc). When `error` is set, the
 * field child receives `aria-invalid` for styling hooks.
 */
function FormField({ label, hint, error, htmlFor, className, children, ...props }: FormFieldProps) {
  return (
    <div
      data-slot="form-field"
      data-invalid={Boolean(error)}
      className={cn("flex flex-col gap-1.5", className)}
      {...props}
    >
      {label && (
        <label
          htmlFor={htmlFor}
          className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3"
        >
          {label}
        </label>
      )}
      {children}
      {error ? (
        <span className="font-mono text-[11px] text-bad">{error}</span>
      ) : (
        hint && <span className="font-mono text-[11px] text-ink-3">{hint}</span>
      )}
    </div>
  );
}

export { FormField };
export type { FormFieldProps };
