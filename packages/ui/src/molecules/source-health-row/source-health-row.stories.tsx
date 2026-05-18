import type { Meta, StoryObj } from "@storybook/react";
import { SourceHealthRow } from "./source-health-row";

const meta: Meta<typeof SourceHealthRow> = {
  title: "Molecules/SourceHealthRow",
  component: SourceHealthRow,
};

export default meta;
type Story = StoryObj<typeof SourceHealthRow>;

export const List: Story = {
  render: () => (
    <div className="w-[640px]">
      <SourceHealthRow
        status="ok"
        name="docs/"
        subtext="filesystem"
        count="2,418"
        latency="14ms"
        lastSync="2 min ago"
      />
      <SourceHealthRow
        status="ok"
        name="prod"
        subtext="postgres"
        count="3,901"
        latency="22ms"
        lastSync="6 min ago"
      />
      <SourceHealthRow
        status="warn"
        name="knowledge-base"
        subtext="s3"
        count="1,753"
        latency="48ms"
        lastSync="syncing…"
      />
      <SourceHealthRow
        status="bad"
        name="legacy-wiki"
        subtext="confluence"
        count="—"
        latency="—"
        lastSync="failed · 12 min"
      />
    </div>
  ),
};
