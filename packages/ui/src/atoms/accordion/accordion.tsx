import * as React from "react";
import { Accordion as Primitive } from "radix-ui";
import { cn } from "../../cn";

const Accordion = Primitive.Root;

function AccordionItem({ className, ...props }: React.ComponentProps<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      data-slot="accordion-item"
      className={cn("border-b border-border", className)}
      {...props}
    />
  );
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Header className="flex">
      <Primitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group flex flex-1 items-center justify-between gap-3 py-3.5 text-left text-[14px] font-medium text-ink transition-colors hover:text-ink",
          "focus-visible:outline-none",
          className
        )}
        {...props}
      >
        {children}
        <svg
          width="14"
          height="14"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          className="shrink-0 text-ink-3 transition-transform duration-200 group-data-[state=open]:rotate-180"
          aria-hidden
        >
          <path d="M4 6l4 4 4-4" />
        </svg>
      </Primitive.Trigger>
    </Primitive.Header>
  );
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof Primitive.Content>) {
  return (
    <Primitive.Content
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-[13.5px] leading-[1.6] text-ink-2",
        "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className="pt-1 pb-4">{children}</div>
    </Primitive.Content>
  );
}

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
