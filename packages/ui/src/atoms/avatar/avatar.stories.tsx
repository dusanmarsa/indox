import type { Meta, StoryObj } from "@storybook/react";
import { Avatar } from "./avatar";

const meta: Meta<typeof Avatar> = {
  title: "Atoms/Avatar",
  component: Avatar,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    variant: { control: "select", options: ["user", "workspace", "brand"] },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const User: Story = { args: { children: "M" } };
export const Workspace: Story = {
  args: { variant: "workspace", children: "IX" },
};
export const Brand: Story = { args: { variant: "brand", children: "i" } };

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar size="sm">M</Avatar>
      <Avatar size="md">M</Avatar>
      <Avatar size="lg">M</Avatar>
      <Avatar variant="workspace">IX</Avatar>
      <Avatar variant="brand">i</Avatar>
    </div>
  ),
};
