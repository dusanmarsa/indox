import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "./separator";

const meta: Meta<typeof Separator> = {
  title: "Primitives/Separator",
  component: Separator,
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-64 text-sm">
      <div>Above</div>
      <Separator className="my-2" />
      <div>Below</div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-12 items-center gap-3 text-sm">
      <span>Left</span>
      <Separator orientation="vertical" />
      <span>Right</span>
    </div>
  ),
};
