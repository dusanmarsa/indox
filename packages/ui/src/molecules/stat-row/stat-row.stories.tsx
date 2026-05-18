import type { Meta, StoryObj } from "@storybook/react";
import { StatRow } from "./stat-row";

const meta: Meta<typeof StatRow> = {
  title: "Molecules/StatRow",
  component: StatRow,
};

export default meta;
type Story = StoryObj<typeof StatRow>;

export const List: Story = {
  render: () => (
    <div className="w-60 divide-y divide-border rounded-md border border-border bg-surface p-1">
      <StatRow label="docs" value="2,418" />
      <StatRow label="postgres" value="3,901" />
      <StatRow label="s3" value="1,753" />
      <StatRow label="gdrive" value="892" />
    </div>
  ),
};
