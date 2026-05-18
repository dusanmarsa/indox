import * as React from "react";
import { Select as Primitive } from "radix-ui";
import { cn } from "../../cn";

const Select = Primitive.Root;
const SelectGroup = Primitive.Group;
const SelectValue = Primitive.Value;
const SelectPortal = Primitive.Portal;

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-border bg-surface px-3.5 py-2.5 font-sans text-[14px] text-ink",
        "transition-colors focus:border-brand focus:shadow-[0_0_0_3px_var(--indox-accent-soft)] focus:outline-none",
        "data-[placeholder]:text-ink-3",
        "disabled:pointer-events-none disabled:opacity-45",
        className
      )}
      {...props}
    >
      {children}
      <Primitive.Icon asChild>
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="ml-2 text-ink-3"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </Primitive.Icon>
    </Primitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <SelectPortal>
      <Primitive.Content
        data-slot="select-content"
        position={position}
        className={cn(
          "z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-md border border-border bg-elev p-1 shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
          position === "popper" && "translate-y-1",
          className
        )}
        {...props}
      >
        <Primitive.Viewport className="p-0">{children}</Primitive.Viewport>
      </Primitive.Content>
    </SelectPortal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      data-slot="select-item"
      className={cn(
        "relative flex w-full cursor-pointer items-center rounded-sm py-1.5 pr-8 pl-2.5 font-sans text-[13px] text-ink-2 outline-none",
        "data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}
    >
      <Primitive.ItemText>{children}</Primitive.ItemText>
      <Primitive.ItemIndicator className="absolute right-2 inline-flex">
        <svg
          width="12"
          height="12"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-brand"
          aria-hidden
        >
          <path d="m3 8 3.5 3.5L13 5" />
        </svg>
      </Primitive.ItemIndicator>
    </Primitive.Item>
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator
      data-slot="select-separator"
      className={cn("mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectPortal,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
};
