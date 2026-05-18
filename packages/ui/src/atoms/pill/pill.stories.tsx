import type { Meta, StoryObj } from "@storybook/react";
import { Pill } from "./pill";

const meta: Meta<typeof Pill> = {
  title: "Atoms/Pill",
  component: Pill,
  argTypes: {
    tone: {
      control: "select",
      options: ["neutral", "ok", "warn", "bad", "info"],
    },
    showDot: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof Pill>;

export const Ok: Story = { args: { tone: "ok", children: "operational" } };
export const Warn: Story = { args: { tone: "warn", children: "syncing" } };
export const Bad: Story = { args: { tone: "bad", children: "error" } };
export const Info: Story = { args: { tone: "info", children: "info" } };
export const Neutral: Story = { args: { tone: "neutral", children: "idle" } };

export const AllTones: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Pill tone="ok">operational</Pill>
      <Pill tone="warn">syncing</Pill>
      <Pill tone="bad">error</Pill>
      <Pill tone="info">info</Pill>
      <Pill tone="neutral">idle</Pill>
      <Pill tone="ok" showDot={false}>
        no-dot
      </Pill>
    </div>
  ),
};
