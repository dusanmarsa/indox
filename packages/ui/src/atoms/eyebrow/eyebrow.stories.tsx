import type { Meta, StoryObj } from "@storybook/react";
import { Eyebrow } from "./eyebrow";

const meta: Meta<typeof Eyebrow> = {
  title: "Atoms/Eyebrow",
  component: Eyebrow,
};

export default meta;
type Story = StoryObj<typeof Eyebrow>;

export const Default: Story = { args: { children: "Capabilities" } };
