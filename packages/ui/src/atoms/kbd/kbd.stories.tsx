import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "./kbd";

const meta: Meta<typeof Kbd> = {
  title: "Atoms/Kbd",
  component: Kbd,
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = { args: { children: "⌘ K" } };

export const Sequence: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1">
      <Kbd>⌘</Kbd> + <Kbd>K</Kbd>
    </span>
  ),
};
