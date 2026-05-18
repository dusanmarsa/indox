import type { Meta, StoryObj } from "@storybook/react";
import { ConversationItem } from "./conversation-item";

const meta: Meta<typeof ConversationItem> = {
  title: "Molecules/ConversationItem",
  component: ConversationItem,
};

export default meta;
type Story = StoryObj<typeof ConversationItem>;

export const List: Story = {
  render: () => (
    <div className="w-[260px] rounded-md bg-elev p-2">
      <ConversationItem
        active
        title="Rate-limit middleware policy"
        preview="…per-tenant overrides live in the policies table"
      />
      <ConversationItem
        unread
        title="Reranker weight tuning"
        preview="Try cross-encoder/ms-marco-MiniLM-L-6-v2"
      />
      <ConversationItem
        pinned
        title="Onboarding checklist"
        preview="Add INDOX_ALLOWED_EMAILS to .env, then…"
      />
      <ConversationItem
        title="GitHub repo connector debug"
        preview="The 404 was an octokit pagination thing"
      />
    </div>
  ),
};
