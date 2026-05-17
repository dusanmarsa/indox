import prisma from "./db";

const TITLE_MAX = 60;
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

export type ConversationScope = {
  workspaceId: string;
  userId: string;
};

export type AnonConversationScope = {
  workspaceId: string;
  anonSessionId: string;
};

export async function createConversation(
  scope: ConversationScope,
  title: string | null = null
): Promise<ConversationSummary> {
  const row = await prisma.conversation.create({
    data: { workspaceId: scope.workspaceId, userId: scope.userId, title },
  });
  return toSummary(row);
}

export async function getOrCreateAnonConversation(
  scope: AnonConversationScope
): Promise<ConversationSummary> {
  const existing = await prisma.conversation.findFirst({
    where: { workspaceId: scope.workspaceId, anonSessionId: scope.anonSessionId },
    orderBy: { createdAt: "desc" },
  });
  if (existing) return toSummary(existing);

  try {
    const row = await prisma.conversation.create({
      data: { workspaceId: scope.workspaceId, anonSessionId: scope.anonSessionId },
    });
    return toSummary(row);
  } catch {
    const row = await prisma.conversation.findFirst({
      where: { workspaceId: scope.workspaceId, anonSessionId: scope.anonSessionId },
      orderBy: { createdAt: "desc" },
    });
    if (!row) throw new Error("Failed to create or find anon conversation");
    return toSummary(row);
  }
}

export async function getAnonConversation(
  scope: AnonConversationScope
): Promise<{ summary: ConversationSummary; messages: PersistedMessage[] } | null> {
  const row = await prisma.conversation.findFirst({
    where: { workspaceId: scope.workspaceId, anonSessionId: scope.anonSessionId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return null;
  return {
    summary: toSummary(row),
    messages: row.messages.map(toMessage),
  };
}

export async function listConversations(
  scope: ConversationScope,
  limit = 100
): Promise<ConversationSummary[]> {
  const rows = await prisma.conversation.findMany({
    where: { workspaceId: scope.workspaceId, userId: scope.userId },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    take: Math.min(limit, 500),
  });
  return rows.map(toSummary);
}

export async function getConversation(
  id: string,
  scope: ConversationScope
): Promise<{ summary: ConversationSummary; messages: PersistedMessage[] } | null> {
  const row = await prisma.conversation.findFirst({
    where: { id, workspaceId: scope.workspaceId, userId: scope.userId },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!row) return null;
  return {
    summary: toSummary(row),
    messages: row.messages.map(toMessage),
  };
}

export async function deleteConversation(id: string, scope: ConversationScope): Promise<boolean> {
  const r = await prisma.conversation.deleteMany({
    where: { id, workspaceId: scope.workspaceId, userId: scope.userId },
  });
  return r.count > 0;
}

export async function appendMessage(
  conversationId: string,
  scope: ConversationScope | AnonConversationScope,
  message: { id?: string; role: string; parts: unknown }
): Promise<PersistedMessage | null> {
  const serialised = JSON.stringify(message.parts ?? null);
  if (serialised.length > PARTS_MAX_BYTES) {
    throw new Error(`message parts too large (${serialised.length} bytes, max ${PARTS_MAX_BYTES})`);
  }

  const scopeWhere =
    "userId" in scope
      ? { workspaceId: scope.workspaceId, userId: scope.userId }
      : { workspaceId: scope.workspaceId, anonSessionId: scope.anonSessionId };

  return prisma.$transaction(async (tx) => {
    const conv = await tx.conversation.findFirst({
      where: { id: conversationId, ...scopeWhere },
      select: { id: true, title: true },
    });
    if (!conv) return null;

    const created = await tx.conversationMessage.create({
      data: {
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

    return toMessage(created);
  });
}

function toSummary(row: {
  id: string;
  title: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ConversationSummary {
  return { id: row.id, title: row.title, createdAt: row.createdAt, updatedAt: row.updatedAt };
}

function toMessage(m: {
  id: string;
  role: string;
  parts: unknown;
  createdAt: Date;
}): PersistedMessage {
  return { id: m.id, role: m.role, parts: m.parts as unknown, createdAt: m.createdAt };
}

function deriveTitle(parts: unknown): string | null {
  if (!Array.isArray(parts)) return null;
  for (const p of parts) {
    if (
      p &&
      typeof p === "object" &&
      "text" in p &&
      typeof (p as { text: unknown }).text === "string"
    ) {
      const raw = (p as { text: string }).text.replace(/@\[([^\]]+)\]/g, "$1").trim();
      if (raw) return raw.length > TITLE_MAX ? raw.slice(0, TITLE_MAX - 1) + "…" : raw;
    }
  }
  return null;
}
