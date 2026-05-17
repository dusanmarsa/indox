import type { Meta, StoryObj } from "@storybook/react";
import { ChatThinking } from "./chat-thinking";

const meta: Meta<typeof ChatThinking> = {
  title: "Molecules/ChatThinking",
  component: ChatThinking,
};

export default meta;
type Story = StoryObj<typeof ChatThinking>;

export const Streaming: Story = {
  render: () => <ChatThinking streaming label="Thinking" />,
};

export const Static: Story = {
  render: () => <ChatThinking streaming={false} label="Reasoning" />,
};
