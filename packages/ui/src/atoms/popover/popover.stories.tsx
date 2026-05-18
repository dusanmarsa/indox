import type { Meta, StoryObj } from "@storybook/react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "../button";

const meta: Meta<typeof Popover> = {
  title: "Atoms/Popover",
  component: Popover,
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost">Open</Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="font-mono text-[11px] tracking-[0.1em] text-ink-3 uppercase">
          Why this score?
        </div>
        <p className="mt-2">
          Hybrid retrieval combines vector cosine + BM25, then reranks with a cross-encoder. The
          number is the final reranker logit.
        </p>
      </PopoverContent>
    </Popover>
  ),
};
