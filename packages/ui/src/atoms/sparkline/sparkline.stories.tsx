import type { Meta, StoryObj } from "@storybook/react";
import { SparkLine } from "./sparkline";

const meta: Meta<typeof SparkLine> = {
  title: "Atoms/SparkLine",
  component: SparkLine,
};

export default meta;
type Story = StoryObj<typeof SparkLine>;

const series = [12, 18, 14, 22, 28, 24, 36, 32, 40, 38, 48, 52];

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="h-10 w-60">
        <SparkLine data={series} variant="line" />
      </div>
      <div className="h-10 w-60">
        <SparkLine data={series} variant="area" />
      </div>
      <div className="h-10 w-60">
        <SparkLine data={series} variant="bars" tone="ok" />
      </div>
    </div>
  ),
};
