import type { Meta, StoryObj } from "@storybook/react";
import { CiteSup } from "./cite-sup";

const meta: Meta<typeof CiteSup> = {
  title: "Atoms/CiteSup",
  component: CiteSup,
};

export default meta;
type Story = StoryObj<typeof CiteSup>;

export const InProse: Story = {
  render: () => (
    <p className="max-w-md text-[14.5px] leading-7 text-ink">
      The rate-limit middleware accepts a per-client policy block
      <CiteSup index={1} />. Per-tenant overrides live in the policies table
      <CiteSup index={3} /> and take precedence at request time.
    </p>
  ),
};
