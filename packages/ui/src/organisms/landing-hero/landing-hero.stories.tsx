import type { Meta, StoryObj } from "@storybook/react";
import { LandingHero } from "./landing-hero";
import { NavPill } from "../../molecules/nav-pill";
import { Button } from "../../atoms/button";

const meta: Meta<typeof LandingHero> = {
  title: "Organisms/LandingHero",
  component: LandingHero,
};

export default meta;
type Story = StoryObj<typeof LandingHero>;

export const Default: Story = {
  args: {
    pill: (
      <NavPill badge="New" href="#">
        v0.4.0 — Postgres + reranker
      </NavPill>
    ),
    title: (
      <>
        One index.
        <br />
        Every source. Every result{" "}
        <span className="text-brand [-webkit-text-fill-color:var(--indox-accent)]">cited.</span>
      </>
    ),
    subtitle:
      "Search infrastructure for AI agents. Self-hosted, sub-50ms queries, full citations. Drop it in; your agent calls one endpoint.",
    ctas: (
      <>
        <Button size="md" className="rounded-full">
          Get started →
        </Button>
        <Button size="md" variant="ghost" className="rounded-full">
          View source
        </Button>
      </>
    ),
  },
};
