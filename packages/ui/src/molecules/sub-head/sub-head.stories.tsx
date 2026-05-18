import type { Meta, StoryObj } from "@storybook/react";
import { SubHead } from "./sub-head";

const meta: Meta<typeof SubHead> = {
  title: "Molecules/SubHead",
  component: SubHead,
};

export default meta;
type Story = StoryObj<typeof SubHead>;

export const Default: Story = {
  args: { children: "Buttons", desc: "Primary, ghost, soft, accent, icon" },
};
