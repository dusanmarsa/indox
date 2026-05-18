import type { Meta, StoryObj } from "@storybook/react";
import { Reveal } from "./reveal";

const meta: Meta<typeof Reveal> = {
  title: "Molecules/Reveal",
  component: Reveal,
};

export default meta;
type Story = StoryObj<typeof Reveal>;

export const Stack: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8">
      {[0, 100, 200, 300].map((d) => (
        <Reveal
          key={d}
          delay={d}
          className="rounded-md border border-border bg-surface p-4 text-ink"
        >
          delay {d}ms
        </Reveal>
      ))}
    </div>
  ),
};
