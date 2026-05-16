// Conversation persistence. `ownerKey` is the authenticated User.id;
// every public function takes one and silently returns null for non-matches
// so a leaked conversation id can't be used to read or mutate history.

import prisma from "./db";

const TITLE_MAX = 60;
// JSONB has no inherent ceiling; a runaway tool result can bloat one row
// into MBs and slow every read of the conversation. Cap covers normal turns
// with plenty of headroom.
const PARTS_MAX_BYTES = 256 * 1024;

export type PersistedMessage = {
  id: string;
  role: string;
  parts: unknown;
  createdAt: Date;
};

export type ConversationSummary = {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function createConversation(
  ownerKey: string,
  title: string | null = null,
): Promise<ConversationSummary> {
  const row = await prisma.conversation.create({
    data: { ownerKey, title },
  });
  return summary(row);
}

export async function listConversations(
  ownerKey: string,
  limit = 100,
): Promise<ConversationSummary[]> {
  const rows = await prisma.conversation.findMany({
    where: { ownerKey },
    // `id` tiebreaker stabilises order when two rows share updatedAt;
    // without it the sidebar shuffles between reloads.
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: Math.min(limit, 500),
  });
  return rows.map(summary);
}

export async function getConversation(
  id: string,
  ownerKey: string,
): Promise<{ summary: ConversationSummary; messages: PersistedMessage[] } | null> {
  const row = await prisma.conversation.findFirst({
    where: { id, ownerKey },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!row) return null;
  return {
    summary: summary(row),
    messages: row.messages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: m.parts as unknown,
      createdAt: m.createdAt,
    })),
  };
}

export async function deleteConversation(id: string, ownerKey: string): Promise<boolean> {
  const r = await prisma.conversation.deleteMany({ where: { id, ownerKey } });
  return r.count > 0;
}

// Append a message and bump updatedAt. On the user's first message we
// derive a sidebar title from its text.
export async function appendMessage(
  conversationId: string,
  ownerKey: string,
  message: { id?: string; role: string; parts: unknown },
): Promise<PersistedMessage | null> {
  const serialised = JSON.stringify(message.parts ?? null);
  if (serialised.length > PARTS_MAX_BYTES) {
    throw new Error(
      `message parts too large (${serialised.length} bytes, max ${PARTS_MAX_BYTES})`,
    );
  }

  // One transaction so we don't leave an orphan message when the
  // updatedAt bump fails.
  return prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.findFirst({
      where: { id: conversationId, ownerKey },
      select: { id: true, title: true },
    });
    if (!conv) return null;

    const created = await tx.conversationMessage.create({
      data: {
        // Only forward explicit ids — the AI SDK passes `""` for assistant
        // messages when no generateMessageId is set, which bypasses the
        // schema's cuid default and collides on the next insert.
        ...(message.id ? { id: message.id } : {}),
        conversationId,
        role: message.role,
        parts: message.parts as never,
      },
    });

    const shouldSetTitle = !conv.title && message.role === "user";
    const title = shouldSetTitle ? deriveTitle(message.parts) : undefined;

    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        updatedAt: new Date(),
        ...(title ? { title } : {}),
      },
    });

    return {
      id: created.id,
      role: created.role,
      parts: created.parts as unknown,
      createdAt: created.createdAt,
    };
  });
}

function summary(row: {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ConversationSummary {
  return {
    id: row.id,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// Pull the first text part out of an AI SDK UIMessage and trim it for
// the sidebar. Returns null when there's no readable text (e.g. message
// is only @-chip mentions).
function deriveTitle(parts: unknown): string | null {
  if (!Array.isArray(parts)) return null;
  for (const p of parts) {
    if (p && typeof p === "object" && "text" in p && typeof (p as { text: unknown }).text === "string") {
      const raw = (p as { text: string }).text.replace(/@\[([^\]]+)\]/g, "$1").trim();
      if (raw) return raw.length > TITLE_MAX ? raw.slice(0, TITLE_MAX - 1) + "…" : raw;
    }
  }
  return null;
}
