import type { Meta, StoryObj } from "@storybook/react";
import { IconButton } from "./icon-button";

const meta: Meta<typeof IconButton> = {
  title: "Atoms/IconButton",
  component: IconButton,
};

export default meta;
type Story = StoryObj<typeof IconButton>;

const Dots = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3" cy="8" r="1.4" />
    <circle cx="8" cy="8" r="1.4" />
    <circle cx="13" cy="8" r="1.4" />
  </svg>
);

export const Default: Story = {
  args: { "aria-label": "More", children: Dots },
};
