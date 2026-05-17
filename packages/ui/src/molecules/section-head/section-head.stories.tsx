import type { Meta, StoryObj } from "@storybook/react";
import { SectionHead } from "./section-head";

const meta: Meta<typeof SectionHead> = {
  title: "Molecules/SectionHead",
  component: SectionHead,
};

export default meta;
type Story = StoryObj<typeof SectionHead>;

export const Default: Story = {
  args: {
    eyebrow: "Capabilities",
    title: (
      <>
        Everything retrieval needs.
        <br />
        Nothing it doesn’t.
      </>
    ),
    lead: "A focused primitive: ingest, index, rank, cite. No framework wrapper, no vector DB to provision, no learning curve.",
  },
};

export const Left: Story = {
  args: {
    eyebrow: "Architecture",
    title: "One index in front of everything.",
    align: "left",
  },
};
