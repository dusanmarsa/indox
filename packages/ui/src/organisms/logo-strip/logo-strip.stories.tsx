import type { Meta, StoryObj } from "@storybook/react";
import { LogoStrip } from "./logo-strip";

const meta: Meta<typeof LogoStrip> = {
  title: "Organisms/LogoStrip",
  component: LogoStrip,
};

export default meta;
type Story = StoryObj<typeof LogoStrip>;

export const Default: Story = {
  args: {
    label: "Trusted by",
    logos: ["Linear", "Vercel", "Supabase", "Resend", "Cal.com", "Rauch"],
  },
};
