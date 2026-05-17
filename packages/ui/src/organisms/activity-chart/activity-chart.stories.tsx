import type { Meta, StoryObj } from "@storybook/react";
import { ActivityChart } from "./activity-chart";
import { ActivityRow } from "../../molecules/activity-row";

const meta: Meta<typeof ActivityChart> = {
  title: "Organisms/ActivityChart",
  component: ActivityChart,
};

export default meta;
type Story = StoryObj<typeof ActivityChart>;

export const Default: Story = {
  render: () => (
    <ActivityChart
      title="Activity"
      subtitle="last 24h"
      chart={
        <svg viewBox="0 0 600 120" className="h-24 w-full text-brand">
          <polyline
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            points="0,90 50,75 100,80 150,60 200,68 250,42 300,50 350,35 400,40 450,28 500,32 550,18 600,22"
          />
        </svg>
      }
    >
      <ActivityRow fresh when="just now">
        <span className="font-mono text-[12.5px] text-brand">docs/</span> indexed 14 new chunks
      </ActivityRow>
      <ActivityRow when="4 min ago">
        <span className="font-mono text-[12.5px] text-brand">prod</span> finished sync
      </ActivityRow>
    </ActivityChart>
  ),
};
