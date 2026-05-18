import type { Meta, StoryObj } from "@storybook/react";
import { ChatSidebar } from "./chat-sidebar";
import { ConversationItem } from "../../molecules/conversation-item";
import { SearchField } from "../../molecules/search-field";
import { Avatar } from "../../atoms/avatar";

const meta: Meta<typeof ChatSidebar> = {
  title: "Organisms/ChatSidebar",
  component: ChatSidebar,
};

export default meta;
type Story = StoryObj<typeof ChatSidebar>;

export const Default: Story = {
  render: () => (
    <div className="h-[640px]">
      <ChatSidebar
        scope="workspace"
        search={
          <SearchField containerClassName="min-w-0 py-2 px-3" placeholder="Search conversations" />
        }
        sections={[
          {
            heading: "Today",
            items: (
              <>
                <ConversationItem
                  active
                  title="Rate-limit middleware policy"
                  preview="…per-tenant overrides live in the policies table"
                />
                <ConversationItem
                  unread
                  title="Reranker weight tuning"
                  preview="Try cross-encoder/ms-marco-MiniLM…"
                />
              </>
            ),
          },
          {
            heading: "Yesterday",
            items: (
              <>
                <ConversationItem
                  pinned
                  title="Onboarding checklist"
                  preview="Add INDOX_ALLOWED_EMAILS to .env"
                />
                <ConversationItem
                  title="GitHub connector debug"
                  preview="The 404 was an octokit pagination thing"
                />
              </>
            ),
          },
        ]}
        bottom={
          <>
            <Avatar size="sm">M</Avatar>
            <span className="flex-1 font-sans text-[12.5px] text-ink-2">maria@indox.dev</span>
            <span>⚙</span>
          </>
        }
      />
    </div>
  ),
};
