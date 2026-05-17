import type { Meta, StoryObj } from "@storybook/react";
import { CitationCard } from "./citation-card";

const meta: Meta<typeof CitationCard> = {
  title: "Molecules/CitationCard",
  component: CitationCard,
};

export default meta;
type Story = StoryObj<typeof CitationCard>;

export const Default: Story = {
  args: {
    citations: [
      {
        index: 1,
        source: "docs/config.md",
        position: "L42–58",
        quote: "Rate limit middleware accepts per-client policy blocks…",
        score: 0.94,
      },
      {
        index: 2,
        source: "docs/api.md",
        position: "L120",
        quote: "Tenants inherit org policy unless explicitly overridden.",
        score: 0.81,
      },
      {
        index: 3,
        source: "postgres://prod/policies",
        quote: "Row count: 1,420 active overrides across 86 tenants.",
        score: 0.67,
      },
    ],
  },
};
