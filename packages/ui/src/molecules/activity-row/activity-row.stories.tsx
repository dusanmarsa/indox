import type { Meta, StoryObj } from "@storybook/react";
import { ActivityRow } from "./activity-row";

const meta: Meta<typeof ActivityRow> = {
  title: "Molecules/ActivityRow",
  component: ActivityRow,
};

export default meta;
type Story = StoryObj<typeof ActivityRow>;

export const Stream: Story = {
  render: () => (
    <div className="w-[640px]">
      <ActivityRow fresh when="just now">
        <span className="font-mono text-[12.5px] text-brand">docs/</span> indexed 14 new chunks
        <small className="mt-0.5 block font-mono text-[11px] text-ink-3">
          docs/config.md · +3 sections
        </small>
      </ActivityRow>
      <ActivityRow when="4 min ago">
        <span className="font-mono text-[12.5px] text-brand">prod</span> finished sync · 3,901 rows
      </ActivityRow>
      <ActivityRow when="12 min ago">
        <span className="font-mono text-[12.5px] text-brand">knowledge-base</span> sync started
      </ActivityRow>
    </div>
  ),
};
