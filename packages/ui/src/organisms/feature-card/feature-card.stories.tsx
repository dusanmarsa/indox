import type { Meta, StoryObj } from "@storybook/react";
import { FeatureCard } from "./feature-card";

const meta: Meta<typeof FeatureCard> = {
  title: "Organisms/FeatureCard",
  component: FeatureCard,
};

export default meta;
type Story = StoryObj<typeof FeatureCard>;

export const Default: Story = {
  args: {
    number: "01",
    eyebrow: "Hybrid retrieval",
    title: "Vector and BM25, ranked together.",
    description:
      "Catches semantic paraphrases and exact identifier matches at once. No tuning needed for most workloads.",
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid w-[1080px] grid-cols-6 gap-px bg-border">
      <FeatureCard
        width="full"
        number="01"
        eyebrow="Hybrid retrieval"
        title="Vector and BM25, ranked together."
        description="Catches semantic paraphrases and exact identifier matches at once."
      />
      <FeatureCard
        width="narrow"
        number="02"
        eyebrow="Pinned citations"
        title="Every result carries a SHA."
      />
      <FeatureCard
        width="half"
        number="03"
        eyebrow="MCP-native"
        title="HTTP and stdio · Cursor, Claude, Windsurf."
      />
      <FeatureCard
        width="half"
        number="04"
        eyebrow="No telemetry"
        title="What your agents search stays in your database."
      />
    </div>
  ),
};
