import { Nav } from "@/components/landing/Nav";
import { Reveal } from "@/components/landing/Reveal";
import { CodeBlock, C } from "@/components/landing/CodeBlock";
import { Diagram } from "@/components/landing/Diagram";
import { SearchDemo } from "@/components/landing/SearchDemo";
import { FooterThemeSwitch } from "@/components/landing/FooterThemeSwitch";

const GITHUB_URL = "https://github.com/dusanmarsa/indox";

const FEATURES = [
  {
    name: "Incremental indexing",
    body: "Add a source. Remove a source. The index updates. No full rebuild.",
  },
  {
    name: "Hybrid retrieval",
    body: "Vector similarity and BM25, fused with reciprocal rank fusion. The right chunks come back without per-query tuning.",
  },
  {
    name: "Pinned citations",
    body: "Every result carries a source reference and line range. Your agent quotes the truth, not a guess.",
  },
  {
    name: "Multi-source",
    body: "Code repos, docs, relational databases, object storage, local files. One query covers all of them.",
  },
  {
    name: "Fast retrieval",
    body: "Postgres + pgvector with HNSW. Latency you can measure on your own hardware, not feelings.",
  },
  {
    name: "No telemetry",
    body: "What your agents search stays with you. No callbacks home, no analytics, no surprises.",
  },
];

export default function Home() {
  return (
    <div className="mx-auto container px-10" id="top">
      <Nav />
      <header className="flex min-h-[60vh] flex-col justify-center">
        <Reveal>
          <div className="mb-10 flex items-center gap-3.5 font-mono text-[12px] text-[var(--indox-muted)]">
            <span
              className="block h-px w-6 bg-[var(--indox-dim)]"
              aria-hidden
            />
            v0.1.0 — MIT License — open source
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
            Open-source search infrastructure for AI agents. Self-hosted.
            Multi-source. Every result cites the file, the line, the commit.
          </p>

          <div className="flex items-center gap-8">
            <a
              href="#how"
              className="border-b pb-0.5 text-[14px] text-[var(--indox-text)] transition-colors hover:text-[var(--indox-accent)]"
              style={{ borderColor: "var(--indox-accent)" }}
            >
              → Read the docs
            </a>
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

      {/* ── Getting started ── two-column with prose + two terminal artifacts. */}
      <Section>
        <Reveal>
          <SectionLabel>Getting started</SectionLabel>
          <SectionTitle>Start in one command<span className="text-(--indox-accent)">.</span></SectionTitle>
          <SectionPara>
            Point Indox at your sources in a yaml config. It connects, indexes,
            and stays in sync. Add a source — it indexes. Remove one — it&apos;s
            gone. No full rebuild.
          </SectionPara>
          <SectionPara>
            Query over HTTP from any language. A single POST request. Results
            come back with a source reference, a relevance score, and a chunk ID
            you can use for follow-up retrieval.
          </SectionPara>
        </Reveal>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Reveal delay={80}>
            <CodeBlock label="$ indox serve">
              <C.Dim>$ </C.Dim>indox serve{"\n\n"}
              {"  "}
              <C.Dim>▸</C.Dim>
              {"  "}
              <C.Muted>docs/</C.Muted>
              {"          2,048 chunks   "}
              <C.Ok>✓</C.Ok>
              {"\n"}
              {"  "}
              <C.Dim>▸</C.Dim>
              {"  "}
              <C.Muted>postgres://db</C.Muted>
              {"  4,921 rows     "}
              <C.Ok>✓</C.Ok>
              {"\n"}
              {"  "}
              <C.Dim>▸</C.Dim>
              {"  "}
              <C.Muted>s3://bucket/</C.Muted>
              {"   1,103 objects  "}
              <C.Ok>✓</C.Ok>
              {"\n\n"}
              {"  "}
              <C.Ok>ready</C.Ok>
              {" :8080  ·  8,072 indexed"}
            </CodeBlock>
          </Reveal>
          <Reveal delay={160}>
            <div>
              <CodeBlock label="POST /search">
                <C.Dim>$ </C.Dim>curl localhost:8080/search \{"\n"}
                {"     -d '"}
                <C.Muted>{`{"q":"configure rate limiting"}`}</C.Muted>
                {"'\n\n"}
                {"{\n"}
                {"  "}
                <C.Muted>&quot;latency_ms&quot;</C.Muted>: 31,{"\n"}
                {"  "}
                <C.Muted>&quot;results&quot;</C.Muted>: [{"{\n"}
                {"    "}
                <C.Muted>&quot;source&quot;</C.Muted>:{" "}
                <C.Accent>&quot;docs/config.md#rate-limits&quot;</C.Accent>,
                {"\n"}
                {"    "}
                <C.Muted>&quot;score&quot;</C.Muted>: 0.94,{"\n"}
                {"    "}
                <C.Muted>&quot;content&quot;</C.Muted>: &quot;Rate limits are
                set per-route…&quot;{"\n"}
                {"  }]\n}"}
              </CodeBlock>
            </div>
          </Reveal>
        </div>
      </Section>

      <Divider />

      {/* ── How it works ── headline + whiteboard diagram. */}
      <Section id="how">
        <Reveal>
          <SectionLabel>How it works</SectionLabel>
          <SectionTitle>One index in front of everything.</SectionTitle>
          <p className="mb-16 text-balance text-md leading-relaxed text-muted-foreground max-w-prose">
            Your agent sends one request. Indox searches across every configured
            source and returns ranked results with citations. No per-source
            integration code in your agent.
          </p>
        </Reveal>
        <Reveal delay={80}>
          <div className="flex justify-center">
            <Diagram />
          </div>
        </Reveal>
      </Section>

      <Divider />

      {/* ── What it does ── 2×3 grid of features with hairline dividers (no cards). */}
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

      {/* ── Self-host ── prose + docker-compose + indox.yaml. */}
      <Section id="deploy">
        <TwoCol>
          <Reveal>
            <SectionLabel>Self-host</SectionLabel>
            <SectionTitle>One command to run.</SectionTitle>
            <SectionPara>
              Docker image, single binary, or from source. Configuration lives
              in one yaml file. No external services required to get started.
            </SectionPara>
            <SectionPara>
              Run it next to your agent on the same machine. Run it on-prem. The
              data never leaves your infrastructure.
            </SectionPara>
          </Reveal>
          <div>
            <Reveal delay={80}>
              <CodeBlock label="docker-compose.yml">
                services:{"\n"}
                {"  "}
                <C.Accent>indox</C.Accent>:{"\n"}
                {"    image: "}
                <C.Muted>ghcr.io/dusanmarsa/indox:latest</C.Muted>
                {"\n"}
                {'    ports: ["8080:8080"]\n'}
                {"    volumes:\n"}
                {"      - ./indox.yaml:/etc/indox/config.yaml\n"}
                {"      - ./data:/var/indox/data"}
              </CodeBlock>
            </Reveal>
            <Reveal delay={160}>
              <div className="mt-2">
                <CodeBlock label="indox.yaml">
                  <C.Accent>sources</C.Accent>:{"\n"}
                  {"  - type: "}
                  <C.Muted>github</C.Muted>
                  {"\n"}
                  {"    repos: ["}
                  <C.Muted>your-org/*</C.Muted>
                  {"]\n"}
                  {"  - type: "}
                  <C.Muted>filesystem</C.Muted>
                  {"\n"}
                  {"    path: "}
                  <C.Muted>./docs</C.Muted>
                  {"\n"}
                  {"  - type: "}
                  <C.Muted>postgres</C.Muted>
                  {"\n"}
                  {"    dsn:  "}
                  <C.Muted>${`{POSTGRES_DSN}`}</C.Muted>
                </CodeBlock>
              </div>
            </Reveal>
          </div>
        </TwoCol>
      </Section>

      <Divider />

      {/* ── Demo ── live, hits the real engine via /[user] routes. */}
      <Section id="demo">
        <Reveal>
          <SectionLabel>Try it</SectionLabel>
          <SectionTitle>Search a real repo, right now.</SectionTitle>
          <p className="mb-8 max-w-[560px] text-[15px] leading-[1.75] text-[var(--indox-muted)]">
            No mocked demo — this drops you into a chat against the live Indox
            engine. Same retrieval the MCP server uses. Same pinned citations.
          </p>
          <SearchDemo />
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
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="text-[13px] text-[var(--indox-dim)] transition-colors hover:text-[var(--indox-muted)]"
            >
              MIT License
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
// Kept inline (rather than another file) so this whole page reads top-to-bottom.

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
  // Hairline grid: every cell gets a bottom border *except* the bottom two
  // (last row). Odd cells get a right border (the column divider). On mobile
  // the right border collapses since we drop to a single column.
  const isOdd = index % 2 === 0; // 0-indexed: cells 0, 2, 4 are "left"
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
  return <hr className="border-t border-[var(--indox-border)]" />;
}
