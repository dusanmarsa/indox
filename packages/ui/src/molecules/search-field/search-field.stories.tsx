import type { Meta, StoryObj } from "@storybook/react";
import { SearchField } from "./search-field";

const meta: Meta<typeof SearchField> = {
  title: "Molecules/SearchField",
  component: SearchField,
};

export default meta;
type Story = StoryObj<typeof SearchField>;

export const Default: Story = {
  args: {
    placeholder: "Filter documents, paths, sources…",
    shortcut: "⌘ K",
  },
};

export const Mono: Story = {
  args: {
    mono: true,
    defaultValue: "configure rate limiting per client",
  },
};
