import type { Meta, StoryObj } from "@storybook/react";
import { MetricCell } from "./metric-cell";

const meta: Meta<typeof MetricCell> = {
  title: "Molecules/MetricCell",
  component: MetricCell,
};

export default meta;
type Story = StoryObj<typeof MetricCell>;

export const Default: Story = {
  args: {
    label: "queries · 24h",
    value: "1.24",
    unit: "M",
    delta: "↑ 8.2% vs yesterday",
  },
};

export const WithChart: Story = {
  args: {
    label: "p50 latency",
    value: "31",
    unit: "ms",
    delta: "↓ 12ms since v0.3",
    chart: (
      <svg viewBox="0 0 200 80" className="h-full w-full text-brand">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          points="0,55 25,50 50,42 75,48 100,32 125,28 150,30 175,22 200,18"
        />
      </svg>
    ),
  },
};
