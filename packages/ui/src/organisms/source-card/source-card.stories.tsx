import type { Meta, StoryObj } from "@storybook/react";
import { SourceCard, SourceCardAdd } from "./source-card";

const meta: Meta<typeof SourceCard> = {
  title: "Organisms/SourceCard",
  component: SourceCard,
};

export default meta;
type Story = StoryObj<typeof SourceCard>;

export const Default: Story = {
  args: {
    icon: "📁",
    title: "docs/",
    description: "filesystem · ./docs\nlocal source tree",
    status: "ok",
    statusLabel: "indexed",
    stats: [
      { label: "Docs", value: "312" },
      { label: "Chunks", value: "2,418" },
      { label: "Size", value: "42 MB" },
    ],
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid w-[1080px] grid-cols-4 gap-4">
      <SourceCard
        icon="📁"
        title="docs/"
        description="filesystem · ./docs"
        statusLabel="indexed"
        stats={[
          { label: "Docs", value: "312" },
          { label: "Chunks", value: "2,418" },
          { label: "Size", value: "42 MB" },
        ]}
      />
      <SourceCard
        icon="🗄"
        title="prod"
        description="postgres · $DATABASE_URL"
        statusLabel="indexed"
        stats={[
          { label: "Rows", value: "14.2k" },
          { label: "Chunks", value: "3,901" },
          { label: "Size", value: "410 MB" },
        ]}
      />
      <SourceCard
        icon="📂"
        title="specs"
        description="gdrive · shared drive"
        status="syncing"
        statusLabel="syncing"
        stats={[
          { label: "Docs", value: "142" },
          { label: "Chunks", value: "892" },
          { label: "Size", value: "182 MB" },
        ]}
      />
      <SourceCardAdd />
    </div>
  ),
};
