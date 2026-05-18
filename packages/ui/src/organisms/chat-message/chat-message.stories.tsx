import type { Meta, StoryObj } from "@storybook/react";
import { ChatMessage } from "./chat-message";
import { CitationCard } from "../../molecules/citation-card";
import { CiteSup } from "../../atoms/cite-sup";
import { ChatToolCall } from "../../molecules/chat-tool-call";
import { ChatThinking } from "../../molecules/chat-thinking";

const meta: Meta<typeof ChatMessage> = {
  title: "Organisms/ChatMessage",
  component: ChatMessage,
};

export default meta;
type Story = StoryObj<typeof ChatMessage>;

export const Thread: Story = {
  render: () => (
    <div className="flex w-[760px] flex-col gap-7">
      <ChatMessage role="user" when="2:14 pm">
        How does the rate-limit middleware decide which policy block applies per tenant?
      </ChatMessage>

      <ChatMessage
        role="bot"
        when="2:14 pm"
        thinking={<ChatThinking label="Thinking · 412 tokens" />}
        toolCalls={
          <>
            <ChatToolCall
              name="searchCode"
              status="done"
              args={`{"query":"rate limit middleware","topK":5}`}
              result="5 chunks · top score 0.94"
            />
            <ChatToolCall name="listSources" status="done" />
          </>
        }
        citations={
          <CitationCard
            citations={[
              {
                index: 1,
                source: "docs/config.md",
                position: "L42–58",
                quote: "Rate limit middleware accepts per-client policy blocks…",
                score: 0.94,
              },
              {
                index: 2,
                source: "postgres://prod/policies",
                score: 0.78,
              },
            ]}
          />
        }
      >
        <p>
          The middleware reads a per-client <strong>policy block</strong>
          <CiteSup index={1} /> and falls back to the org default when no override exists. Overrides
          live in the <code>policies</code> table
          <CiteSup index={2} /> and are joined at request time.
        </p>
      </ChatMessage>
    </div>
  ),
};

export const Streaming: Story = {
  render: () => (
    <div className="w-[760px]">
      <ChatMessage role="bot" status="streaming" when="now">
        <p>
          Looking at the middleware, it reads a per-client policy block first and then merges any
          tenant override
        </p>
      </ChatMessage>
    </div>
  ),
};

export const StreamingNoBody: Story = {
  render: () => (
    <div className="w-[760px]">
      <ChatMessage role="bot" status="streaming" typingLabel="thinking" />
    </div>
  ),
};

export const ErrorState: Story = {
  render: () => (
    <div className="w-[760px]">
      <ChatMessage
        role="bot"
        status="error"
        when="now"
        error="Model returned 429 — rate limited. Retry in 12s."
      />
    </div>
  ),
};
