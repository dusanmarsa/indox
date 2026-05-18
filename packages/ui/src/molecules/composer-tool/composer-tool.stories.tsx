import type { Meta, StoryObj } from "@storybook/react";
import { ComposerTool } from "./composer-tool";

const meta: Meta<typeof ComposerTool> = {
  title: "Molecules/ComposerTool",
  component: ComposerTool,
};

export default meta;
type Story = StoryObj<typeof ComposerTool>;

export const Default: Story = { args: { children: "All sources" } };
export const Active: Story = {
  args: { active: true, showDot: true, children: "docs/" },
};

export const Toolbar: Story = {
  render: () => (
    <div className="flex gap-1">
      <ComposerTool active showDot>
        All sources
      </ComposerTool>
      <ComposerTool>@mentions</ComposerTool>
      <ComposerTool>filters</ComposerTool>
    </div>
  ),
};
