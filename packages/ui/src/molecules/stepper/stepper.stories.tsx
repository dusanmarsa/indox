import type { Meta, StoryObj } from "@storybook/react";
import { Stepper } from "./stepper";

const meta: Meta<typeof Stepper> = {
  title: "Molecules/Stepper",
  component: Stepper,
};

export default meta;
type Story = StoryObj<typeof Stepper>;

const steps = [
  { label: "Pick connector", description: "fs, pg, s3…" },
  { label: "Credentials", description: "encrypted at rest" },
  { label: "Map schema", description: "fields & filters" },
  { label: "Confirm" },
];

export const Horizontal: Story = {
  render: () => (
    <div className="w-[720px]">
      <Stepper steps={steps} current={1} />
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="w-80">
      <Stepper steps={steps} current={2} orientation="vertical" />
    </div>
  ),
};
