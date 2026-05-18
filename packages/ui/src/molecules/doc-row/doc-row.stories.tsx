import type { Meta, StoryObj } from "@storybook/react";
import { DocRow } from "./doc-row";
import { Tag } from "../../atoms/tag";

const meta: Meta<typeof DocRow> = {
  title: "Molecules/DocRow",
  component: DocRow,
};

export default meta;
type Story = StoryObj<typeof DocRow>;

export const Default: Story = {
  args: {
    icon: "MD",
    title: "Configure rate limiting per client",
    subtitle: "docs/config.md · 4,210 bytes",
    tag: <Tag tone="docs">docs</Tag>,
    chunks: "14 chunks",
    when: "2 min ago",
  },
};

export const List: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <DocRow
        icon="MD"
        title="Configure rate limiting per client"
        subtitle="docs/config.md · 4,210 bytes"
        tag={<Tag tone="docs">docs</Tag>}
        chunks="14 chunks"
        when="2 min ago"
      />
      <DocRow
        icon="PDF"
        title="Architecture decision record · 0008"
        subtitle="specs/ADR-0008-reranker.pdf · 218 KB"
        tag={<Tag tone="gd">gdrive</Tag>}
        chunks="26 chunks"
        when="12 min ago"
      />
      <DocRow
        icon="SQL"
        title="policies snapshot"
        subtitle="postgres://prod/policies"
        tag={<Tag tone="pg">postgres</Tag>}
        chunks="1.2k chunks"
        when="34 min ago"
      />
    </div>
  ),
};
