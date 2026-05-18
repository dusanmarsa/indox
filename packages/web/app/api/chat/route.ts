import { openai, createOpenAI } from "@ai-sdk/openai";
import {
  streamText,
  convertToModelMessages,
  tool,
  stepCountIs,
  type ModelMessage,
  type UIMessage,
} from "ai";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import {
  prisma,
  hybridSearch,
  listSources,
  logger,
  appendMessage,
  getWorkspaceBySlug,
  getOrCreateAnonConversation,
  checkAndIncrementWorkspaceUsage,
  type AllowedModel,
  type AnonConversationScope,
} from "@indox/core";
import { chatRatelimit, rateLimitKey, ipFromRequest } from "@/lib/ratelimit";
import { requireWorkspace, UnauthorizedError } from "@/lib/session";
import { isSameOrigin, csrfReject } from "@/lib/csrf";

// Resolve a list of user-friendly source identifiers (display name, external
// id, or substring of either) to actual Source.id rows. Unmatched entries are
// dropped silently — the LLM sees the resolved set count in the tool result.
async function resolveSourceNames(
  names: string[],
  available: Array<{ id: string; displayName: string; externalId: string }>
): Promise<{ ids: string[]; matched: string[]; unmatched: string[] }> {
  const matched: string[] = [];
  const unmatched: string[] = [];
  const ids = new Set<string>();
  for (const raw of names) {
    const q = raw.toLowerCase().trim();
    const hit = available.find(
      (s) =>
        s.displayName.toLowerCase() === q ||
        s.externalId.toLowerCase() === q ||
        s.displayName.toLowerCase().includes(q) ||
        s.externalId.toLowerCase().includes(q)
    );
    if (hit) {
      ids.add(hit.id);
      matched.push(hit.displayName);
    } else {
      unmatched.push(raw);
    }
  }
  return { ids: [...ids], matched, unmatched };
}

function stripOrphanedToolCalls(messages: ModelMessage[]): ModelMessage[] {
  const resultIds = new Set<string>();
  for (const m of messages) {
    if (m.role !== "tool") continue;
    if (!Array.isArray(m.content)) continue;
    for (const part of m.content) {
      if (part.type === "tool-result") resultIds.add(part.toolCallId);
    }
  }

  const out: ModelMessage[] = [];
  for (const m of messages) {
    if (m.role !== "assistant" || !Array.isArray(m.content)) {
      out.push(m);
      continue;
    }
    const kept = m.content.filter((p) => p.type !== "tool-call" || resultIds.has(p.toolCallId));
    if (kept.length === 0) continue;
    out.push({ ...m, content: kept });
  }
  return out;
}

// Resolved context for the chat invocation. Either authenticated (existing
// flow with conversation persistence) or public (workspaceSlug, no auth,
// ephemeral, BYO-key or platform-key with strict ceilings).
type ChatContext =
  | {
      mode: "authed";
      workspaceId: string;
      model: AllowedModel | string;
      openaiApiKey: string | null;
      conversationId: string | null;
      persistScope: { workspaceId: string; userId: string };
      rateLimitKey: string;
    }
  | {
      mode: "public";
      workspaceId: string;
      model: AllowedModel | string;
      openaiApiKey: string | null;
      conversationId: string | null;
      persistScope: AnonConversationScope | null;
      rateLimitKey: string;
    };

export async function POST(req: Request) {
  if (!isSameOrigin(req)) return csrfReject();

  const body = (await req.json()) as {
    messages: UIMessage[];
    sourceIds?: string[];
    conversationId?: string;
    workspaceSlug?: string;
    anonSessionId?: string;
  };
  const ip = ipFromRequest(req);

  // ─── Resolve context: public vs authed ─────────────────────────────────
  let ctx: ChatContext;
  if (body.workspaceSlug) {
    const ws = await getWorkspaceBySlug(body.workspaceSlug);
    // 404 (not 403) when not public — don't leak the existence of private
    // workspaces to scrapers iterating slugs.
    if (!ws || !ws.isPublic) {
      return new Response("Not found", { status: 404 });
    }
    const decision = await checkAndIncrementWorkspaceUsage({
      workspaceId: ws.id,
      ip,
      workspaceDailyLimit: ws.dailyCallLimit,
    });
    if (!decision.ok) {
      const message =
        decision.reason === "workspace_quota"
          ? `This workspace has reached today's chat limit (${decision.limit} calls). Try again tomorrow.`
          : `You've hit today's per-visitor limit on this workspace (${decision.limit} calls). Try again tomorrow.`;
      return new Response(message, { status: 429 });
    }
    ctx = {
      mode: "public",
      workspaceId: ws.id,
      model: ws.model,
      openaiApiKey: ws.openaiApiKey,
      conversationId: null,
      persistScope: null,
      rateLimitKey: `pub:${ws.id}:${ip}`,
    };

    const rawSession = typeof body.anonSessionId === "string" ? body.anonSessionId.trim() : "";
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (UUID_RE.test(rawSession)) {
      const anonScope: AnonConversationScope = { workspaceId: ws.id, anonSessionId: rawSession };
      try {
        const conv = await getOrCreateAnonConversation(anonScope);
        ctx = { ...ctx, conversationId: conv.id, persistScope: anonScope };
      } catch (err) {
        logger.warn("chat", `anon conversation create failed: ${(err as Error).message}`);
      }
    }
  } else {
    let resolved: Awaited<ReturnType<typeof requireWorkspace>>;
    try {
      resolved = await requireWorkspace();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        return new Response("Unauthorized", { status: 401 });
      }
      throw err;
    }
    const { user, workspace } = resolved;
    const settings = await prisma.workspace.findUnique({
      where: { id: workspace.id },
      select: { model: true, openaiApiKeyEncrypted: true },
    });
    const k = rateLimitKey(req, user.id);
    const { success } = await chatRatelimit.limit(k);
    if (!success) {
      logger.warn("chat", `rate limit hit for ${k}`);
      return new Response("Too many requests", { status: 429 });
    }
    // Private workspaces always run on the platform key for now — BYO is a
    // public-chat optimisation. Owner's UI just nudges them to set the key
    // before going public.
    ctx = {
      mode: "authed",
      workspaceId: workspace.id,
      model: settings?.model ?? "gpt-4o-mini",
      openaiApiKey: null,
      conversationId: body.conversationId ?? null,
      persistScope: { workspaceId: workspace.id, userId: user.id },
      rateLimitKey: k,
    };
  }

  const { messages } = body;
  const conversationId = ctx.mode === "public" ? ctx.conversationId : (body.conversationId ?? null);
  logger.info("chat", `request ${ctx.mode} ws=${ctx.workspaceId} (${messages.length} messages)`);

  // Persist the user's latest message (authed flow only). Public chats are
  // ephemeral by design — visitors get the answer in-page, no history.
  const latest = messages[messages.length - 1];
  if (ctx.persistScope && conversationId && latest && latest.role === "user") {
    appendMessage(conversationId, ctx.persistScope, {
      id: latest.id,
      role: latest.role,
      parts: latest.parts,
    }).catch((err) =>
      logger.warn("chat", `persist user message failed: ${(err as Error).message}`)
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  prisma.usageLog
    .upsert({
      where: { ip_date: { ip, date: today } },
      update: { queryCount: { increment: 1 } },
      create: { ip, date: today, queryCount: 1 },
    })
    .catch((err) => logger.warn("chat", `usage log write failed: ${err}`));

  const sourcesSnapshot = await listSources({
    readyOnly: true,
    workspaceId: ctx.workspaceId,
  });
  const sourcesList = sourcesSnapshot.map((s) => ({
    id: s.id,
    displayName: s.displayName,
    externalId: s.externalId,
    kind: s.kind,
  }));

  // Pinned scope from the chat input (@-mentions). When set, every searchCode
  // call is forced to these source IDs regardless of what the model passes.
  const pinnedIds = (body.sourceIds ?? []).filter((id) => sourcesList.some((s) => s.id === id));
  const pinnedNames = pinnedIds
    .map((id) => sourcesList.find((s) => s.id === id)?.displayName)
    .filter((x): x is string => !!x);

  // Owner floor for hybridSearch — without this, an empty `sourceIds` would
  // search the global embeddings table and leak other users' chunks.
  const ownerSourceIds = sourcesList.map((s) => s.id);

  const tools = {
    searchCode: tool({
      description:
        "Search every indexed source — code, READMEs, manifests, AND prose (Notion pages, notes, transcripts, docs). The returned chunks contain real body content, not just titles; quote from them when the user asks what a page or document says. By default searches across ALL indexed sources; pass `sources` to narrow only when the user clearly named one. For general questions where no specific source is implied, omit `sources` — a single global search is preferred over fanning out per source.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "Semantic search query — the user's question, optionally rephrased toward terms likely to appear in the indexed content (identifiers and file names for code sources, topical keywords for prose sources). Multi-word queries retrieve better than single nouns; prefer the user's phrasing over a one-word abstraction of it."
          ),
        sources: z
          .array(z.string())
          .optional()
          .describe(
            "Optional. Restrict retrieval to these sources by display name. Only set this when the user explicitly named a source. Do NOT guess — if you're unsure which source contains the answer, omit this and do one global search."
          ),
      }),
      execute: async ({ query, sources }) => {
        // hybridSearch treats sourceIds:[] as "no filter" (= global), so we
        // can't pass an empty owner array; short-circuit instead.
        if (ownerSourceIds.length === 0) {
          return {
            status: "no_results" as const,
            message: "You have no indexed sources yet — add one from the dashboard.",
          };
        }
        let sourceIds: string[] | undefined;
        let scopeInfo: {
          matched: string[];
          unmatched: string[];
          pinned: boolean;
        } | null = null;

        if (pinnedIds.length) {
          // User pinned sources in the UI — that scope is authoritative and
          // overrides anything the model passes.
          sourceIds = pinnedIds;
          scopeInfo = { matched: pinnedNames, unmatched: [], pinned: true };
        } else if (sources && sources.length) {
          const r = await resolveSourceNames(sources, sourcesList);
          if (r.ids.length === 0) {
            // Fall back to a global search instead of returning an error —
            // a guessed name shouldn't block the user's question.
            const chunks = await hybridSearch(query, 8, { sourceIds: ownerSourceIds });
            return {
              status: "ok" as const,
              scope: { matched: [], unmatched: sources, pinned: false },
              note: `Requested sources didn't match anything indexed; searched globally instead.`,
              chunks: chunks.map((c) => ({ url: c.url, text: c.text, confidence: c.confidence })),
            };
          }
          sourceIds = r.ids;
          scopeInfo = {
            matched: r.matched,
            unmatched: r.unmatched,
            pinned: false,
          };
        }

        const chunks = await hybridSearch(query, 8, { sourceIds: sourceIds ?? ownerSourceIds });
        if (!chunks.length) {
          return {
            status: "no_results" as const,
            message: `No relevant chunks for "${query}"${sourceIds ? ` in selected sources` : ""}.`,
          };
        }
        return {
          status: "ok" as const,
          scope: scopeInfo,
          chunks: chunks.map((c) => ({ url: c.url, text: c.text, confidence: c.confidence })),
        };
      },
    }),
    listSources: tool({
      description:
        "List every source currently indexed and searchable. Call this whenever the user asks what you have access to, what's indexed, what repos/data is available, or what you know about.",
      inputSchema: z.object({}),
      execute: async () => {
        return {
          status: "ok" as const,
          count: sourcesList.length,
          sources: sourcesList.map((s) => ({
            name: s.displayName,
            kind: s.kind,
          })),
        };
      },
    }),
  };

  const sourcesPreview = sourcesList.length
    ? sourcesList.map((s) => `- ${s.displayName} (${s.kind})`).join("\n")
    : "(no sources indexed yet)";

  const pinnedBlock = pinnedIds.length
    ? `\n\nUSER-PINNED SCOPE (authoritative):
The user pinned these sources for this turn: ${pinnedNames.join(", ")}.
Every searchCode call is automatically restricted to them — you do not need to (and should not) pass \`sources\` yourself. Answer only from results returned in this scope; if the answer isn't in there, say so.`
    : "";

  // Pick the OpenAI provider: BYO key for public workspaces that set one,
  // otherwise the platform default (env-resolved).
  const provider = ctx.openaiApiKey ? createOpenAI({ apiKey: ctx.openaiApiKey }) : openai;

  const result = streamText({
    model: provider(ctx.model),
    system: `You are a helpful assistant answering questions about the user's indexed sources (code repositories and documentation).

INDEXED SOURCES AVAILABLE TO YOU:
${sourcesPreview}${pinnedBlock}

WHEN TO USE TOOLS:
- For any question answerable from indexed content, call \`searchCode\`.
- Prefer a SINGLE global search (omit \`sources\`) unless the user explicitly named a source. Do not iterate source-by-source for general questions — that's slow and noisy. One global call usually surfaces every relevant repo at once.
- Only pass \`sources\` when the user clearly named a specific source (or was just discussing one). Never guess source names from your training data or from the user's question topic — guessed names just produce empty results.
- For cross-source questions ("compare X across all my repos", "do we use Y anywhere"), omit \`sources\`.
- You may call \`searchCode\` with different queries if a first global search didn't answer the question — but vary the query, not the source scope.
- When the user asks what you know, what you have access to, or which repos/sources are indexed, call \`listSources\` instead of guessing.

GROUNDING — STRICT:
The user prefers an honest "not found" over a confident-sounding answer built from unrelated chunks. Apply this rule on every searchCode result:

1. Before answering, read the returned chunks and ask: do these chunks actually contain the information needed to answer the user's question? Not "are they topically adjacent" — do they *answer* it.
2. If the chunks are off-topic, only thematically related, or just match a keyword the user used, treat the search as a miss. Say: "I couldn't find this in the indexed sources." Do not pad the response with what you found anyway — that's noise to the user.
3. Never combine unrelated chunks into a plausible-sounding synthesis. If two chunks aren't actually about the same thing, don't pretend they are.
4. Never fall back to your training data when the index doesn't have the answer. The user asks specifically about *their* sources; a generic answer from pretraining is a wrong answer here.
5. \`status: "no_results"\` from searchCode is final — don't speculate.

CONFIDENCE TIERS:
Each chunk has a \`confidence\` field of "strong" or "weak". Weak chunks are returned only when nothing strong matched; they are the system's best guess. Treat them differently:
- If your answer leans on weak chunks, lead with a brief hedge ("I couldn't find a direct match, but the closest content was…") and prefer to quote/cite rather than paraphrase.
- If every returned chunk is weak and none actually answers the question, say so — don't strain to extract an answer just because something came back.
- If at least one strong chunk answers the question, ignore the weak ones; they're noise next to a real match.

CITATIONS:
Every chunk returned by searchCode is an object { url, text }. The url is a SHA-pinned blob URL with a #L<start>-L<end> fragment. When you cite or link to a snippet, copy the url field CHARACTER-FOR-CHARACTER. Do not modify the path, branch, or line range. Do not invent a URL from a path you saw in the text — only use the url field. If a chunk's url is null, cite the file path as plain text with no hyperlink. Never write /blob/main/… or /blob/master/… yourself.

ANSWERING CONTENT QUESTIONS:
When the user asks what a page, document, or section says ("what does X cover", "summarise this", "what's in jordan"), the chunk \`text\` field contains the actual body content — not just titles. Read it and answer from it. Quote or paraphrase specific sentences. A reply like "the page is titled X — visit the link for details" is a failure when chunk text is available; the whole point of the index is that you don't have to send the user to the source.

Be concise — but "concise" means no filler, not "withhold content the user asked for." If the user asked what a document says, the body of your reply should be the answer, drawn from chunk text.`,
    messages: stripOrphanedToolCalls(await convertToModelMessages(messages)),
    tools,
    stopWhen: stepCountIs(8),
  });

  const persistScope = ctx.persistScope;
  return result.toUIMessageStreamResponse({
    // Assign a stable id to the assistant message so the streamed message in
    // the browser matches the row we persist — otherwise reload would mint a
    // different id and break React keying for the most recent message.
    generateMessageId: () => randomUUID(),
    // Persist the fully-assembled assistant message after the stream
    // completes. `responseMessage` is the final UIMessage with all parts
    // (text + tool calls + results) so reload reconstructs the exact chat
    // the user saw. Public/ephemeral chats skip this.
    onFinish: ({ responseMessage }) => {
      if (!persistScope || !conversationId) return;
      appendMessage(conversationId, persistScope, {
        id: responseMessage.id,
        role: responseMessage.role,
        parts: responseMessage.parts,
      }).catch((err) =>
        logger.warn("chat", `persist assistant message failed: ${(err as Error).message}`)
      );
    },
  });
}
