import type { Meta, StoryObj } from "@storybook/react";
import { Tag } from "./tag";

const meta: Meta<typeof Tag> = {
  title: "Atoms/Tag",
  component: Tag,
  argTypes: {
    tone: {
      control: "select",
      options: ["default", "docs", "pg", "s3", "gd", "gh", "outline"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tag>;

export const Default: Story = { args: { children: "docs" } };

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Tag tone="docs">docs</Tag>
      <Tag tone="pg">postgres</Tag>
      <Tag tone="s3">s3</Tag>
      <Tag tone="gd">gdrive</Tag>
      <Tag tone="gh">github</Tag>
      <Tag tone="outline">indexed</Tag>
      <Tag tone="outline">privacy</Tag>
    </div>
  ),
};
