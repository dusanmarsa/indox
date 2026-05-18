import type { Meta, StoryObj } from "@storybook/react";
import { ChatTypingIndicator } from "./chat-typing-indicator";

const meta: Meta<typeof ChatTypingIndicator> = {
  title: "Atoms/ChatTypingIndicator",
  component: ChatTypingIndicator,
};

export default meta;
type Story = StoryObj<typeof ChatTypingIndicator>;

export const Default: Story = { args: { label: "thinking" } };
export const NoLabel: Story = {};
