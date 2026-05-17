import type { Meta, StoryObj } from "@storybook/react";
import { Stat } from "./stat";

const meta: Meta<typeof Stat> = {
  title: "Molecules/Stat",
  component: Stat,
};

export default meta;
type Story = StoryObj<typeof Stat>;

export const Row: Story = {
  render: () => (
    <div className="flex gap-12">
      <Stat label="Sources" value="5" />
      <Stat label="Documents" value="2,418" />
      <Stat label="Chunks" value="10,072" accent />
      <Stat label="Last index" value="4" unit="s ago" />
    </div>
  ),
};
