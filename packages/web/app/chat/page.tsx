import { ChatHeader } from "@indox/ui";
import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";

// `/chat` is the "blank slate" — no conversation row exists yet. We only
// create one when the user actually sends their first message; otherwise
// every page load would leave a trail of empty "Untitled" rows.
export default function NewChatPage() {
  return (
    <ChatProvider>
      <div className="flex h-full min-h-0 flex-col">
        <ChatHeader title="New conversation" />
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-gutter-stable scrollbar-none">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <ChatArea />
          </div>
        </div>
        <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent">
          <div className="mx-auto max-w-3xl px-6 pt-4 pb-6">
            <ChatInput />
          </div>
        </div>
      </div>
    </ChatProvider>
  );
}
