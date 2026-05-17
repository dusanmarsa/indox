import type { Meta, StoryObj } from "@storybook/react";
import { NavPill } from "./nav-pill";

const meta: Meta<typeof NavPill> = {
  title: "Molecules/NavPill",
  component: NavPill,
};

export default meta;
type Story = StoryObj<typeof NavPill>;

export const Default: Story = {
  args: {
    badge: "New",
    children: "v0.4.0 — Postgres + reranker",
    href: "#",
  },
};

export const NoBadge: Story = {
  args: { children: "Read the changelog", href: "#" },
};
