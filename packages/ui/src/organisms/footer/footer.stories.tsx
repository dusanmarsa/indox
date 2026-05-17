import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "./footer";

const meta: Meta<typeof Footer> = {
  title: "Organisms/Footer",
  component: Footer,
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {
    tagline: "Search infrastructure for AI agents. Self-host it, own the data.",
    columns: [
      {
        heading: "Product",
        links: [
          { label: "Self-host", href: "#" },
          { label: "Brand", href: "#" },
          { label: "Changelog", href: "#" },
        ],
      },
      {
        heading: "Resources",
        links: [
          { label: "Docs", href: "#" },
          { label: "Connectors", href: "#" },
          { label: "MCP guide", href: "#" },
        ],
      },
      {
        heading: "Community",
        links: [
          { label: "GitHub", href: "#" },
          { label: "Discord", href: "#" },
          { label: "@indox", href: "#" },
        ],
      },
    ],
    bottomLeft: "© 2026 indox · GPL-3.0",
    bottomRight: (
      <>
        <a href="#">Status</a>
        <a href="#">Privacy</a>
      </>
    ),
  },
};
