import Link from "next/link";
import type { Route } from "next";
import { Nav } from "@/components/landing/Nav";
import { Reveal } from "@/components/landing/Reveal";
import { CodeBlock, C } from "@/components/landing/CodeBlock";
import { Diagram } from "@/components/landing/Diagram";
import { FooterThemeSwitch } from "@/components/landing/FooterThemeSwitch";

const GITHUB_URL = "https://github.com/dusanmarsa/indox";

const FEATURES = [
  {
    name: "Hybrid retrieval",
    body: "Vector similarity and BM25, fused with reciprocal rank fusion. Catches semantic paraphrases and exact identifier matches at once.",
  },
  {
    name: "Pinned citations",
    body: "Every result carries a SHA-pinned blob URL with the line range. Your agent quotes the truth, not a guess that drifts when main moves.",
  },
  {
    name: "MCP-native",
    body: "Built-in MCP server over HTTP and stdio. Cursor, Claude, Windsurf, Zed — anything that speaks Model Context Protocol works out of the box.",
  },
  {
    name: "Per-user scoping",
    body: "Each user only sees their own indexed sources. Bearer tokens for agents, session cookies for the dashboard, owner-checked at every query.",
  },
  {
    name: "Incremental indexing",
    body: "Add or remove a source from the dashboard. Just that source re-indexes — no full rebuild, no waiting for everything else.",
  },
  {
    name: "No telemetry",
    body: "What your agents search stays in your database. No callbacks home, no analytics SDK, no usage pings.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto container px-8" id="top">
      <Nav />
      <header className="flex min-h-[60vh] flex-col justify-center py-30">
        <Reveal>
          <div className="mb-10 flex items-center gap-3.5 font-mono text-[12px] text-[var(--indox-muted)]">
            <span
              className="block h-px w-6 bg-[var(--indox-dim)]"
              aria-hidden
            />
            v0.1.0 (beta)
          </div>

          <h1
            className="mb-7 font-semibold leading-[1.04]"
            style={{
              fontSize: "clamp(44px, 6.5vw, 84px)",
              letterSpacing: "-0.03em",
              color: "var(--indox-text)",
            }}
          >
            Search every source
            <br />
            your agent touches.
          </h1>

          <p className="mb-[52px] max-w-[530px] text-[17px] leading-[1.65] text-[var(--indox-muted)]">
            Self-hostable search infrastructure for AI agents. Indexes your
            code, runs hybrid retrieval, and serves the results over MCP with
            SHA-pinned citations.
          </p>

          <div className="flex items-center gap-8">
            <Link
              href={"/login" as Route}
              className="border-b pb-0.5 text-[14px] text-[var(--indox-text)] transition-colors hover:text-[var(--indox-accent)]"
              style={{ borderColor: "var(--indox-accent)" }}
            >
              → Try the hosted version
            </Link>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="font-mono text-[13px] text-[var(--indox-dim)] transition-colors hover:text-[var(--indox-muted)]"
            >
              github.com/dusanmarsa/indox
            </a>
          </div>
        </Reveal>
      </header>

      <Divider />

      {/* ── Three surfaces — the actual product. ── */}
      <Section>
        <Reveal>
          <SectionLabel>What you get</SectionLabel>
          <SectionTitle>Three ways in, one index<span className="text-(--indox-accent)">.</span></SectionTitle>
          <SectionPara>
            Configure sources once. Your agents and your team query the same
            corpus through whichever surface fits.
          </SectionPara>
        </Reveal>
        <div className="grid grid-cols-1 gap-px md:grid-cols-3 mt-12 border border-[var(--indox-border)] bg-[var(--indox-border)]">
          <Surface
            label="Dashboard"
            title="Manage what's indexed."
            body="Sign in, drop in a GitHub PAT, pick the repos you want indexed. Indexing status, chunk counts, and re-sync controls in one place."
          />
          <Surface
            label="Chat"
            title="Ask the indexed corpus."
            body="A web chat backed by the real retrieval pipeline. Pinned source URLs on every answer. Conversations persist per user."
          />
          <Surface
            label="MCP server"
            title="Plug in any agent."
            body="HTTP and stdio transports. Per-user bearer tokens. Cursor, Claude Code, Claude Desktop, Windsurf, Zed — all work without custom glue."
          />
        </div>
      </Section>

      <Divider />

      {/* ── How it works ── headline + diagram. ── */}
      <Section id="how">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
          <SectionTitle>One index in front of everything.</SectionTitle>
          <p className="mb-16 text-balance text-md leading-relaxed text-muted-foreground max-w-prose">
            Your agent sends one request. Indox runs hybrid retrieval across
            every configured source and returns ranked, cited chunks. No
            per-source integration code in your agent.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div className="flex justify-center">
            <Diagram />
          </div>
        </Reveal>
      </Section>

      <Divider />

      {/* ── Features ── 2×3 grid of features with hairline dividers. ── */}
      <Section id="features">
        <Reveal>
          <SectionLabel>What it does</SectionLabel>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2">
          {FEATURES.map((f, i) => (
            <Reveal key={f.name} delay={(i % 2) * 80}>
              <FeatureCell
                name={f.name}
                body={f.body}
                index={i}
                total={FEATURES.length}
              />
            </Reveal>
          ))}
        </div>
      </Section>

      <Divider />

      {/* ── Self-host ── real clone-and-run, no fictional CLI. ── */}
      <Section id="deploy">
        <TwoCol>
          <Reveal>
            <SectionLabel>Self-host</SectionLabel>
            <SectionTitle>Clone it, run it, own the data.</SectionTitle>
            <SectionPara>
              Bun monorepo with three services: web, worker, and MCP server.
              Postgres with pgvector and pg_trgm handles storage. Each service
              ships a Railway config you can point at any other container host.
            </SectionPara>
            <SectionPara>
              No SaaS dependency in the data path. Embeddings hit OpenAI for
              now; swap in a local model when that ships. Adapter credentials
              are AES-256-GCM encrypted at rest.
            </SectionPara>
            <div className="mt-6">
              <a
                href={GITHUB_URL + "#quick-start-local-dev"}
                target="_blank"
                rel="noreferrer"
                className="border-b pb-0.5 text-[14px] text-[var(--indox-text)] transition-colors hover:text-[var(--indox-accent)]"
                style={{ borderColor: "var(--indox-accent)" }}
              >
                → Full setup in the README
              </a>
            </div>
          </Reveal>
          <div className="min-w-0">
            <Reveal delay={80}>
              <CodeBlock label="$ clone and boot">
                <C.Dim>$ </C.Dim>git clone https://github.com/dusanmarsa/indox.git{"\n"}
                <C.Dim>$ </C.Dim>cd indox && bun install{"\n"}
                <C.Dim>$ </C.Dim>cp .env.example .env  <C.Muted># fill in DATABASE_URL, OPENAI_API_KEY, …</C.Muted>{"\n"}
                <C.Dim>$ </C.Dim>bun run db:migrate{"\n"}
                <C.Dim>$ </C.Dim>bun run dev{"\n\n"}
                {"  "}<C.Ok>▸</C.Ok>{" web    "}<C.Muted>http://localhost:3000</C.Muted>{"\n"}
                {"  "}<C.Ok>▸</C.Ok>{" worker "}<C.Muted>watching pg-boss queue</C.Muted>{"\n"}
              </CodeBlock>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-2">
                <CodeBlock label="agent config">
                  <C.Accent>mcpServers</C.Accent>: {"{\n"}
                  {"  "}<C.Accent>indox</C.Accent>: {"{\n"}
                  {"    "}<C.Muted>&quot;url&quot;</C.Muted>:{" "}
                  <C.Muted>&quot;https://your-host/mcp?token=mcp_...&quot;</C.Muted>{"\n"}
                  {"  }\n"}
                  {"}"}
                </CodeBlock>
              </div>
            </Reveal>
          </div>
        </TwoCol>
      </Section>

      <Divider />

      {/* ── CTA ── ── */}
      <Section id="demo">
        <Reveal>
          <SectionLabel>Try it</SectionLabel>
          <SectionTitle>Spin up the hosted version.</SectionTitle>
          <p className="mb-8 max-w-[560px] text-[15px] leading-[1.75] text-[var(--indox-muted)]">
            Sign up, add a GitHub PAT, pick a repo. You&apos;re chatting against
            your own indexed code in under a minute — and the MCP endpoint is
            live the moment the index finishes.
          </p>
          <Link
            href={"/login" as Route}
            className="inline-block border border-[var(--indox-border)] bg-[var(--indox-surface)] px-5 py-2.5 font-mono text-[13px] text-[var(--indox-text)] transition-colors hover:bg-[var(--indox-surface)]/70"
          >
            Sign up →
          </Link>
        </Reveal>
      </Section>

      {/* ── Footer ── */}
      <footer className="border-t border-[var(--indox-border)] py-10">
        <div className="mx-auto flex max-w-[800px] flex-col items-start justify-between gap-5 px-9 sm:flex-row sm:items-center">
          <span className="font-mono text-[13px] text-[var(--indox-dim)]">
            indox<span style={{ color: "var(--indox-accent)" }}>.</span>
          </span>
          <div className="flex flex-wrap items-center gap-6">
            <a
              href={GITHUB_URL + "/blob/master/LICENSE"}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-[var(--indox-dim)] transition-colors hover:text-[var(--indox-muted)]"
            >
              FSL-1.1-Apache-2.0
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-[var(--indox-dim)] transition-colors hover:text-[var(--indox-muted)]"
            >
              Source on GitHub ↗
            </a>
            <FooterThemeSwitch />
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Section primitives ─────────────────────────────────────────────────────

function Section({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-30">
      {children}
    </section>
  );
}

function TwoCol({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid items-start gap-12 md:grid-cols-2 md:gap-[72px]">
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-7 font-mono text-[11px] uppercase text-[var(--indox-dim)]"
      style={{ letterSpacing: "0.12em" }}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-4 text-[30px] font-semibold leading-[1.2]"
      style={{ letterSpacing: "-0.022em" }}
    >
      {children}
    </h2>
  );
}

function SectionPara({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3.5 text-balance text-md leading-relaxed text-muted-foreground max-w-prose">
      {children}
    </p>
  );
}

function Surface({
  label,
  title,
  body,
}: {
  label: string;
  title: string;
  body: string;
}) {
  return (
    <div className="bg-[var(--background)] p-8">
      <p
        className="mb-4 font-mono text-[10.5px] uppercase text-[var(--indox-dim)]"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </p>
      <h3 className="mb-3 text-[18px] font-semibold tracking-[-0.015em]">
        {title}
      </h3>
      <p className="text-[13.5px] leading-[1.7] text-[var(--indox-muted)]">
        {body}
      </p>
    </div>
  );
}

function FeatureCell({
  name,
  body,
  index,
  total,
}: {
  name: string;
  body: string;
  index: number;
  total: number;
}) {
  const isOdd = index % 2 === 0;
  const isLastRow = index >= total - 2;
  return (
    <div
      className={[
        "py-9",
        !isLastRow && "border-b border-[var(--indox-border)]",
        isOdd
          ? "sm:border-r sm:border-[var(--indox-border)] sm:pr-[52px]"
          : "sm:pl-[52px]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <h3 className="mb-2 text-[15px] font-semibold tracking-[-0.01em]">
        {name}
      </h3>
      <p className="text-[14px] leading-[1.7] text-[var(--indox-muted)]">
        {body}
      </p>
    </div>
  );
}

function Divider() {
  return <hr className="border-t border-(--indox-border)/50" />;
}
