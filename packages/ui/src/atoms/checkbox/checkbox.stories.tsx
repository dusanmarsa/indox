import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "./checkbox";

const meta: Meta<typeof Checkbox> = {
  title: "Atoms/Checkbox",
  component: Checkbox,
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {};
export const Checked: Story = { args: { defaultChecked: true } };
export const Indeterminate: Story = { args: { checked: "indeterminate" } };
export const Disabled: Story = { args: { disabled: true } };

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-2.5">
      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
        <Checkbox defaultChecked /> Hybrid retrieval
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
        <Checkbox /> BM25 only
      </label>
      <label className="flex cursor-pointer items-center gap-2.5 text-[14px] text-ink">
        <Checkbox checked="indeterminate" /> Partial (indeterminate)
      </label>
    </div>
  ),
};
