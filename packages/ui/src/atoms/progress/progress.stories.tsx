import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "./progress";

const meta: Meta<typeof Progress> = {
  title: "Atoms/Progress",
  component: Progress,
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Steps: Story = {
  render: () => (
    <div className="flex w-[480px] flex-col gap-4">
      <Progress value={20} />
      <Progress value={62} tone="ok" />
      <Progress value={85} tone="warn" />
      <Progress indeterminate />
    </div>
  ),
};
