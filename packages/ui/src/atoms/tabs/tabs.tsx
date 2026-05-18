import * as React from "react";
import { Tabs as Primitive } from "radix-ui";
import { cn } from "../../cn";

const Tabs = Primitive.Root;

function TabsList({ className, ...props }: React.ComponentProps<typeof Primitive.List>) {
  return (
    <Primitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-9 items-center justify-start gap-1 border-b border-border",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 font-mono text-[12.5px] text-ink-3 transition-colors",
        "hover:text-ink-2",
        "data-[state=active]:text-ink",
        "data-[state=active]:after:absolute data-[state=active]:after:-bottom-px data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-brand",
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-brand-soft",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      data-slot="tabs-content"
      className={cn("mt-4 focus-visible:outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
