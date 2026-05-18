import type { Meta, StoryObj } from "@storybook/react";
import { Brandmark } from "./brandmark";

const meta: Meta<typeof Brandmark> = {
  title: "Atoms/Brandmark",
  component: Brandmark,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
    muted: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Brandmark>;

export const Default: Story = { args: { size: "lg" } };
export const Medium: Story = { args: { size: "md" } };
export const Small: Story = { args: { size: "sm" } };
export const Muted: Story = { args: { size: "lg", muted: true } };

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <Brandmark size="sm" />
      <Brandmark size="md" />
      <Brandmark size="lg" />
      <Brandmark size="lg" muted />
    </div>
  ),
};
