import type { Meta, StoryObj } from "@storybook/react";
import { KpiCell } from "./kpi-cell";

const meta: Meta<typeof KpiCell> = {
  title: "Molecules/KpiCell",
  component: KpiCell,
};

export default meta;
type Story = StoryObj<typeof KpiCell>;

export const Default: Story = {
  args: {
    label: "queries · 24h",
    value: "1.24",
    unit: "M",
    delta: "↑ 8.2% vs yesterday",
    deltaTone: "ok",
  },
};

export const Accent: Story = {
  args: {
    label: "p50 latency",
    value: "31",
    unit: "ms",
    accent: true,
    delta: "↓ 12ms since v0.3",
    deltaTone: "ok",
  },
};

export const Dim: Story = {
  args: {
    label: "recall @ 10",
    value: "0.94",
    delta: "benchmark · 50k docs",
    deltaTone: "dim",
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-3.5">
      <KpiCell
        label="queries · 24h"
        value="1.24"
        unit="M"
        delta="↑ 8.2% vs yesterday"
        deltaTone="ok"
      />
      <KpiCell
        label="p50 latency"
        value="31"
        unit="ms"
        accent
        delta="↓ 12ms since v0.3"
        deltaTone="ok"
      />
      <KpiCell label="recall @ 10" value="0.94" delta="benchmark · 50k docs" deltaTone="dim" />
    </div>
  ),
};
