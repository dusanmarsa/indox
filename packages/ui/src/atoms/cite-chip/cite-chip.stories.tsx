import type { Meta, StoryObj } from "@storybook/react";
import { CiteChip } from "./cite-chip";

const meta: Meta<typeof CiteChip> = {
  title: "Atoms/CiteChip",
  component: CiteChip,
};

export default meta;
type Story = StoryObj<typeof CiteChip>;

export const Default: Story = {
  args: { index: 1, children: "docs/config.md" },
};

export const Active: Story = {
  args: { index: 1, children: "docs/config.md", active: true },
};

export const Row: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <CiteChip index={1} active>
        docs/config.md
      </CiteChip>
      <CiteChip index={2}>docs/api.md</CiteChip>
      <CiteChip index={3}>postgres://prod/policies</CiteChip>
    </div>
  ),
};
