import type { Meta, StoryObj } from "@storybook/react";
import { LandingNav } from "./landing-nav";

const meta: Meta<typeof LandingNav> = {
  title: "Organisms/LandingNav",
  component: LandingNav,
};

export default meta;
type Story = StoryObj<typeof LandingNav>;

export const Default: Story = {
  render: () => (
    <div className="relative h-32 w-full">
      <LandingNav
        className="relative top-0 left-auto translate-x-0"
        links={[
          { label: "Product", href: "#" },
          { label: "Self-host", href: "#" },
          { label: "Brand", href: "#" },
        ]}
        cta={
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-white/[0.06] px-3.5 py-1.5 font-mono text-[12.5px] text-ink transition-colors hover:bg-white/[0.09]"
          >
            ★ Star · 4.2k
          </a>
        }
      />
    </div>
  ),
};
