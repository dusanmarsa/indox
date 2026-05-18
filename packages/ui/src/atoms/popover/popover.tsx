import * as React from "react";
import { Popover as Primitive } from "radix-ui";
import { cn } from "../../cn";

const Popover = Primitive.Root;
const PopoverTrigger = Primitive.Trigger;
const PopoverAnchor = Primitive.Anchor;
const PopoverClose = Primitive.Close;
const PopoverPortal = Primitive.Portal;

function PopoverContent({
  className,
  align = "center",
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <PopoverPortal>
      <Primitive.Content
        align={align}
        sideOffset={sideOffset}
        data-slot="popover-content"
        className={cn(
          "z-50 w-72 rounded-md border border-border bg-elev p-4 text-[13px] text-ink shadow-2xl outline-none",
          "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
          "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          className
        )}
        {...props}
      />
    </PopoverPortal>
  );
}

export { Popover, PopoverAnchor, PopoverClose, PopoverContent, PopoverPortal, PopoverTrigger };
