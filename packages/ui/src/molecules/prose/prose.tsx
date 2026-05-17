import * as React from "react";
import { cn } from "../../cn";

type ProseProps = React.ComponentProps<"div">;

/**
 * Typography wrapper for long-form / markdown content. Apply this around any
 * rendered markdown output (e.g. Streamdown) so headings, lists, links, and
 * inline code pick up design-system styling. Pairs with `MessageBody` for chat.
 */
function Prose({ className, ...props }: ProseProps) {
  return (
    <div
      data-slot="prose"
      className={cn(
        "text-[14.5px] leading-[1.65] tracking-[-0.005em] text-ink",
        // headings
        "[&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-[22px] [&_h1]:font-medium [&_h1]:tracking-[-0.02em] [&_h1]:text-ink",
        "[&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-[18px] [&_h2]:font-medium [&_h2]:tracking-[-0.015em] [&_h2]:text-ink",
        "[&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:text-[15px] [&_h3]:font-medium [&_h3]:text-ink",
        // paragraphs & block elements
        "[&_p]:mb-2.5 [&_p:last-child]:mb-0",
        "[&_strong]:font-semibold [&_strong]:text-ink",
        "[&_em]:italic",
        // lists
        "[&_ul]:my-2 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:mb-1",
        "[&_ol]:my-2 [&_ol]:pl-5 [&_ol]:list-decimal [&_li]:mb-1",
        // inline code
        "[&_:not(pre)>code]:rounded [&_:not(pre)>code]:bg-surface [&_:not(pre)>code]:px-1.5 [&_:not(pre)>code]:py-0.5 [&_:not(pre)>code]:font-mono [&_:not(pre)>code]:text-[0.88em]",
        // links
        "[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:no-underline",
        // blockquote
        "[&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-brand [&_blockquote]:pl-3 [&_blockquote]:text-ink-2 [&_blockquote]:italic",
        // hr
        "[&_hr]:my-4 [&_hr]:border-border",
        className
      )}
      {...props}
    />
  );
}

export { Prose };
export type { ProseProps };
