import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";

const meta: Meta<typeof Button> = {
  title: "Primitives/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "ghost", "soft", "accent", "dim"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = { args: { children: "Button" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
export const Soft: Story = { args: { variant: "soft", children: "Soft" } };
export const Accent: Story = { args: { variant: "accent", children: "Accent" } };

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="primary">Primary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="soft">Soft</Button>
      <Button variant="accent">Accent</Button>
      <Button variant="dim">Dim</Button>
    </div>
  ),
};
