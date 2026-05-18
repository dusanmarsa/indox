import * as React from "react";
import { DropdownMenu as Primitive } from "radix-ui";
import { cn } from "../../cn";

const DropdownMenu = Primitive.Root;
const DropdownMenuTrigger = Primitive.Trigger;
const DropdownMenuPortal = Primitive.Portal;
const DropdownMenuSub = Primitive.Sub;
const DropdownMenuRadioGroup = Primitive.RadioGroup;
const DropdownMenuGroup = Primitive.Group;

function DropdownMenuContent({
  className,
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <DropdownMenuPortal>
      <Primitive.Content
        sideOffset={sideOffset}
        data-slot="dropdown-menu-content"
        className={cn(
          "z-50 min-w-[180px] overflow-hidden rounded-md border border-border bg-elev p-1 shadow-2xl",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      />
    </DropdownMenuPortal>
  );
}

function DropdownMenuItem({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Primitive.Item> & { inset?: boolean }) {
  return (
    <Primitive.Item
      data-slot="dropdown-menu-item"
      data-inset={inset}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 rounded-sm px-2.5 py-1.5 font-mono text-[12px] text-ink-2 outline-none",
        "transition-colors hover:bg-surface-2 hover:text-ink",
        "data-[highlighted]:bg-surface-2 data-[highlighted]:text-ink",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuLabel({
  className,
  inset,
  ...props
}: React.ComponentProps<typeof Primitive.Label> & { inset?: boolean }) {
  return (
    <Primitive.Label
      data-slot="dropdown-menu-label"
      className={cn(
        "px-2.5 py-1.5 font-mono text-[10px] tracking-[0.12em] text-ink-3 uppercase",
        inset && "pl-8",
        className
      )}
      {...props}
    />
  );
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentProps<typeof Primitive.Separator>) {
  return (
    <Primitive.Separator
      data-slot="dropdown-menu-separator"
      className={cn("mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

function DropdownMenuShortcut({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="dropdown-menu-shortcut"
      className={cn("ml-auto font-mono text-[10.5px] tracking-[0.1em] text-ink-3", className)}
      {...props}
    />
  );
}

export {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuRadioGroup,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuTrigger,
};
