import { ChatProvider } from "@/components/chat/context";
import ChatArea from "@/components/chat/Area";
import ChatInput from "@/components/chat/Input";

// `/chat` is the "blank slate" — no conversation row exists yet. We only
// create one when the user actually sends their first message; otherwise
// every page load would leave a trail of empty "Untitled" rows.
export default function NewChatPage() {
  return (
    <ChatProvider>
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6">
        <ChatArea />
        <ChatInput />
      </div>
    </ChatProvider>
  );
}
