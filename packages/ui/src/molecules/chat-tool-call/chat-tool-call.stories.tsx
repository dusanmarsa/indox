import type { Meta, StoryObj } from "@storybook/react";
import { ChatToolCall } from "./chat-tool-call";

const meta: Meta<typeof ChatToolCall> = {
  title: "Molecules/ChatToolCall",
  component: ChatToolCall,
};

export default meta;
type Story = StoryObj<typeof ChatToolCall>;

export const States: Story = {
  render: () => (
    <div className="flex w-[520px] flex-col gap-2">
      <ChatToolCall name="searchCode" status="running" />
      <ChatToolCall
        name="searchCode"
        status="done"
        defaultOpen
        args={`{"query":"rate limit","topK":5}`}
        result={`5 chunks · top score 0.94`}
      />
      <ChatToolCall name="listSources" status="error" result={`Error: workspace not found`} />
    </div>
  ),
};
