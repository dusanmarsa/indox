import type { Meta, StoryObj } from "@storybook/react";
import { DocList } from "./doc-list";
import { DocRow } from "../../molecules/doc-row";
import { Tag } from "../../atoms/tag";

const meta: Meta<typeof DocList> = {
  title: "Organisms/DocList",
  component: DocList,
};

export default meta;
type Story = StoryObj<typeof DocList>;

export const Default: Story = {
  render: () => (
    <DocList
      title="Recently indexed"
      count="last 24 hours · 84 documents"
      action={
        <button type="button" className="font-mono text-[11px] text-ink-3 hover:text-ink">
          View all →
        </button>
      }
    >
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
    </DocList>
  ),
};
