import type { Meta, StoryObj } from "@storybook/react";
import { CtaFinal } from "./cta-final";

const meta: Meta<typeof CtaFinal> = {
  title: "Organisms/CtaFinal",
  component: CtaFinal,
};

export default meta;
type Story = StoryObj<typeof CtaFinal>;

export const Default: Story = {
  args: {
    title: "Run it where your data lives.",
    subtitle: "One container. Postgres + pgvector. Your embeddings, your bucket. No SaaS sign-up.",
    command: "git clone https://github.com/dusanmarsa/indox.git",
  },
};
