import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "./switch";

const meta: Meta<typeof Switch> = {
  title: "Atoms/Switch",
  component: Switch,
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Off: Story = {};
export const On: Story = { args: { defaultChecked: true } };
export const Disabled: Story = { args: { disabled: true } };

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <label className="flex cursor-pointer items-center gap-3 text-[14px] text-ink">
        <Switch defaultChecked /> Real-time sync
      </label>
      <label className="flex cursor-pointer items-center gap-3 text-[14px] text-ink">
        <Switch /> Telemetry
      </label>
    </div>
  ),
};
