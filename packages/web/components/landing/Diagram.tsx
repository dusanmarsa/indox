"use client";

import { useEffect, useState } from "react";
import {
  GitBranch,
  FileText,
  Database,
  FolderOpen,
  BookOpen,
  Sparkles,
  MousePointer,
  Code,
  Terminal,
  MessageSquare,
} from "lucide-react";

type IconName =
  | "git-branch"
  | "file-text"
  | "database"
  | "folder"
  | "book"
  | "sparkles"
  | "cursor"
  | "code"
  | "terminal"
  | "message";

type SourceNode = {
  id: string;
  label: string;
  icon: IconName;
  status: "live" | "soon";
};

type ConsumerNode = {
  id: string;
  label: string;
  icon: IconName;
  shape?: "rect" | "pill";
};

const SOURCES: SourceNode[] = [
  { id: "github", label: "GitHub", icon: "git-branch", status: "live" },
  { id: "gitlab", label: "GitLab", icon: "git-branch", status: "soon" },
  { id: "notion", label: "Notion", icon: "book", status: "soon" },
  { id: "confluence", label: "Confluence", icon: "file-text", status: "soon" },
  { id: "files", label: "Local files", icon: "folder", status: "soon" },
  { id: "postgres", label: "Postgres", icon: "database", status: "soon" },
];

const CONSUMERS: ConsumerNode[] = [
  { id: "cursor", label: "Cursor", icon: "cursor" },
  { id: "claude", label: "Claude", icon: "sparkles" },
  { id: "windsurf", label: "Windsurf", icon: "code" },
  { id: "custom", label: "Any MCP Client", icon: "terminal" },
  { id: "chat", label: "In-app Chat", icon: "message", shape: "rect" },
];

// Per-node traffic multiplier — applied to dot animation duration. <1 = faster
// (heavier traffic), >1 = slower (lighter traffic). Picked to suggest GitHub
// and Cursor as the hot paths today.
const TRAFFIC: Record<string, number> = {
  github: 0.45,
  cursor: 0.4,
  claude: 0.5,
  custom: 0.8,
  windsurf: 1.1,
  chat: 1,
  gitlab: 0,
  notion: 0,
  confluence: 0,
  files: 0,
  postgres: 0,
};
const trafficFor = (id: string) => TRAFFIC[id] ?? 1;

// Deterministic 0..1 from id — used to stagger animation phases without React
// re-render. Salt lets sources and consumers seed independently.
function jitter(id: string, salt = 3): number {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return Math.abs((h % 1000) / 1000);
}

function useViewportWidth(): number {
  // Default to desktop so SSR renders the desktop variant — avoids layout
  // shift for the majority of visitors.
  const [w, setW] = useState(1100);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return w;
}

function DiagramIcon({ name, size = 14 }: { name: IconName; size?: number }) {
  const props = { width: size, height: size, strokeWidth: 1.5 };
  switch (name) {
    case "git-branch":
      return <GitBranch {...props} />;
    case "file-text":
      return <FileText {...props} />;
    case "database":
      return <Database {...props} />;
    case "folder":
      return <FolderOpen {...props} />;
    case "book":
      return <BookOpen {...props} />;
    case "sparkles":
      return <Sparkles {...props} />;
    case "cursor":
      return <MousePointer {...props} />;
    case "code":
      return <Code {...props} />;
    case "terminal":
      return <Terminal {...props} />;
    case "message":
      return <MessageSquare {...props} />;
  }
}

// Styles live inside the SVG so they don't leak. Uses the global theme vars
// from app/globals.css so light/dark theming is automatic.
const DIAGRAM_STYLES = `
  .ix-line {
    fill: none;
    stroke: var(--indox-border);
    stroke-width: 1;
    transition: stroke 200ms;
  }
  .ix-line.hot { stroke: var(--indox-accent); }
  .ix-flow-dot { fill: var(--indox-accent); }
  .ix-box {
    fill: transparent;
    stroke: var(--indox-border);
    stroke-width: 1;
    transition: stroke 200ms;
  }
  .ix-box.soon { stroke-dasharray: 3 3; }
  .ix-box.hot { stroke: var(--indox-text); }
  .ix-label {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
    fill: var(--indox-text);
  }
  .ix-label.dim { fill: var(--indox-muted); }
  .ix-sublabel {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 10.5px;
    fill: var(--indox-muted);
    letter-spacing: 0.04em;
  }
  .ix-pill {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 9.5px;
    fill: var(--indox-dim);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }
  .ix-indox-rect { stroke-width: 1.25; }
  .ix-hit { fill: transparent; pointer-events: all; cursor: pointer; }
  @media (prefers-reduced-motion: reduce) {
    .ix-flow-dot { display: none; }
    .ix-line { transition: none; }
  }
`;

type HoverProps = {
  hover: string | null;
  setHover: (s: string | null) => void;
};

// ─── Entry ─────────────────────────────────────────────────────────────────

export function Diagram() {
  const [hover, setHover] = useState<string | null>(null);
  const vw = useViewportWidth();
  const isMobile = vw < 720;
  return isMobile ? (
    <CurvesMobile hover={hover} setHover={setHover} />
  ) : (
    <CurvesDesktop hover={hover} setHover={setHover} />
  );
}

// ─── Desktop: parallel bezier corridors, sources ⇢ indox ⇢ consumers ──────

function CurvesDesktop({ hover, setHover }: HoverProps) {
  const W = 1100,
    H = 540;
  const SBOX_W = 168,
    SBOX_H = 40,
    S_GAP = 14;
  const CBOX_W = 196,
    CBOX_H = 40,
    C_GAP = 14;
  const INDOX_W = 232,
    INDOX_H = 220;

  const sTotalH = SOURCES.length * SBOX_H + (SOURCES.length - 1) * S_GAP;
  const sStartY = (H - sTotalH) / 2;
  const cTotalH = CONSUMERS.length * CBOX_H + (CONSUMERS.length - 1) * C_GAP;
  const cStartY = (H - cTotalH) / 2;

  const SBOX_X = 28;
  const CBOX_X = W - 28 - CBOX_W;
  const INDOX_X = (W - INDOX_W) / 2;
  const INDOX_Y = (H - INDOX_H) / 2;
  const INDOX_R = INDOX_X + INDOX_W;
  const PAD_Y = 24;

  const attachY = (i: number, n: number) =>
    INDOX_Y + PAD_Y + (INDOX_H - PAD_Y * 2) * (n === 1 ? 0.5 : i / (n - 1));

  // Each curve gets a per-index control-point offset so lines never collide
  // — natural-looking parallel routing without explicit collision logic.
  const sourcePaths = SOURCES.map((_, i) => {
    const sx = SBOX_X + SBOX_W;
    const sy = sStartY + i * (SBOX_H + S_GAP) + SBOX_H / 2;
    const ix = INDOX_X;
    const iy = attachY(i, SOURCES.length);
    const span = ix - sx;
    const c1x = sx + span * (0.35 + i * 0.04);
    const c2x = ix - span * (0.35 - i * 0.03);
    return `M ${sx} ${sy} C ${c1x} ${sy}, ${c2x} ${iy}, ${ix} ${iy}`;
  });

  const consumerPaths = CONSUMERS.map((_, i) => {
    const cx = CBOX_X;
    const cy = cStartY + i * (CBOX_H + C_GAP) + CBOX_H / 2;
    const ix = INDOX_R;
    const iy = attachY(i, CONSUMERS.length);
    const span = cx - ix;
    const c1x = ix + span * (0.32 + i * 0.05);
    const c2x = cx - span * (0.32 - i * 0.04);
    return `M ${ix} ${iy} C ${c1x} ${iy}, ${c2x} ${cy}, ${cx} ${cy}`;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Sources route through Indox to AI agents"
      style={{ display: "block", color: "var(--indox-text)" }}
    >
      <defs>
        <style>{DIAGRAM_STYLES}</style>
      </defs>

      <g aria-hidden="true">
        {sourcePaths.map((d, i) => (
          <path
            key={SOURCES[i].id}
            id={`vA-src-${SOURCES[i].id}`}
            d={d}
            className={`ix-line ${hover === SOURCES[i].id || hover === "indox" ? "hot" : ""}`}
          />
        ))}
        {consumerPaths.map((d, i) => (
          <path
            key={CONSUMERS[i].id}
            id={`vA-dst-${CONSUMERS[i].id}`}
            d={d}
            className={`ix-line ${hover === CONSUMERS[i].id || hover === "indox" ? "hot" : ""}`}
          />
        ))}

        {SOURCES.map((s, i) => {
          const j = jitter(s.id);
          const dur = (2.6 + j * 1.2) * trafficFor(s.id);
          const begin = -(j * 4 + i * 0.3);
          return (
            <circle key={s.id} className="ix-flow-dot" r={2.4} opacity={0.85}>
              <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`}>
                <mpath href={`#vA-src-${s.id}`} />
              </animateMotion>
            </circle>
          );
        })}
        {CONSUMERS.map((c, i) => {
          const j = jitter(c.id, 7);
          const dur = (2.8 + j * 1.1) * trafficFor(c.id);
          const begin = -(j * 4 + i * 0.35 + 0.5);
          return (
            <circle key={c.id} className="ix-flow-dot" r={2.4} opacity={0.85}>
              <animateMotion dur={`${dur}s`} repeatCount="indefinite" begin={`${begin}s`}>
                <mpath href={`#vA-dst-${c.id}`} />
              </animateMotion>
            </circle>
          );
        })}
      </g>

      {SOURCES.map((s, i) => {
        const y = sStartY + i * (SBOX_H + S_GAP);
        return (
          <g
            key={s.id}
            onMouseEnter={() => setHover(s.id)}
            onMouseLeave={() => setHover(null)}
            style={{ opacity: s.status === "soon" ? 0.85 : 1 }}
          >
            <rect
              x={SBOX_X}
              y={y}
              width={SBOX_W}
              height={SBOX_H}
              rx={4}
              className={`ix-box ${s.status === "soon" ? "soon" : ""} ${hover === s.id ? "hot" : ""}`}
            />
            <g
              transform={`translate(${SBOX_X + 14} ${y + SBOX_H / 2 - 7})`}
              style={{ color: s.status === "live" ? "var(--indox-text)" : "var(--indox-muted)" }}
            >
              <DiagramIcon name={s.icon} />
            </g>
            <text
              x={SBOX_X + 36}
              y={y + SBOX_H / 2 + 3.5}
              className={`ix-label ${s.status === "soon" ? "dim" : ""}`}
            >
              {s.label}
            </text>
            {s.status === "soon" && (
              <g>
                <rect
                  x={SBOX_X + SBOX_W - 42}
                  y={y + SBOX_H / 2 - 8}
                  width={30}
                  height={16}
                  rx={2}
                  fill="none"
                  stroke="var(--indox-border)"
                />
                <text
                  x={SBOX_X + SBOX_W - 27}
                  y={y + SBOX_H / 2 + 3}
                  textAnchor="middle"
                  className="ix-pill"
                >
                  soon
                </text>
              </g>
            )}
            <rect x={SBOX_X} y={y} width={SBOX_W} height={SBOX_H} className="ix-hit" />
          </g>
        );
      })}

      <IndoxCore
        x={INDOX_X}
        y={INDOX_Y}
        w={INDOX_W}
        h={INDOX_H}
        hover={hover}
        setHover={setHover}
      />

      {CONSUMERS.map((c, i) => {
        const y = cStartY + i * (CBOX_H + C_GAP);
        const rx = c.shape === "pill" ? CBOX_H / 2 : 4;
        return (
          <g key={c.id} onMouseEnter={() => setHover(c.id)} onMouseLeave={() => setHover(null)}>
            <rect
              x={CBOX_X}
              y={y}
              width={CBOX_W}
              height={CBOX_H}
              rx={rx}
              className={`ix-box ${hover === c.id ? "hot" : ""}`}
            />
            <g transform={`translate(${CBOX_X + 14} ${y + CBOX_H / 2 - 7})`}>
              <DiagramIcon name={c.icon} />
            </g>
            <text x={CBOX_X + 36} y={y + CBOX_H / 2 + 3.5} className="ix-label">
              {c.label}
            </text>
            {c.shape === "pill" && (
              <text
                x={CBOX_X + CBOX_W - 14}
                y={y + CBOX_H / 2 + 3}
                textAnchor="end"
                className="ix-pill"
              >
                human
              </text>
            )}
            <rect x={CBOX_X} y={y} width={CBOX_W} height={CBOX_H} className="ix-hit" />
          </g>
        );
      })}

      <text x={SBOX_X} y={sStartY - 18} className="ix-pill">
        sources
      </text>
      <text x={INDOX_X + INDOX_W / 2} y={INDOX_Y - 16} textAnchor="middle" className="ix-pill">
        search server
      </text>
      <text x={CBOX_X + CBOX_W} y={cStartY - 18} textAnchor="end" className="ix-pill">
        consumers
      </text>
    </svg>
  );
}

// ─── Mobile: stacked top → bottom, curves bend on the vertical axis ────────

function CurvesMobile({ hover, setHover }: HoverProps) {
  const W = 380;
  const SBOX_W = 156,
    SBOX_H = 34,
    S_GAP = 10;
  const INDOX_W = 320,
    INDOX_H = 96;
  const GAP_BAND = 56;

  const sCols = 2,
    sRows = Math.ceil(SOURCES.length / sCols);
  const cCols = 2,
    cRows = Math.ceil(CONSUMERS.length / cCols);
  const sBlockH = sRows * SBOX_H + (sRows - 1) * S_GAP;
  const cBlockH = cRows * SBOX_H + (cRows - 1) * S_GAP;
  const sBlockY = 28;
  const indoxY = sBlockY + sBlockH + GAP_BAND;
  const cBlockY = indoxY + INDOX_H + GAP_BAND;
  const H = cBlockY + cBlockH + 28;
  const INDOX_X = (W - INDOX_W) / 2;

  const sourceBox = (i: number) => {
    const col = i % sCols,
      row = Math.floor(i / sCols);
    const gridW = sCols * SBOX_W + (sCols - 1) * 12;
    const x = (W - gridW) / 2 + col * (SBOX_W + 12);
    const y = sBlockY + row * (SBOX_H + S_GAP);
    return { x, y, cx: x + SBOX_W / 2, cy: y + SBOX_H / 2 };
  };
  const consumerBox = (i: number) => {
    const col = i % cCols,
      row = Math.floor(i / cCols);
    const gridW = cCols * SBOX_W + (cCols - 1) * 12;
    const x = (W - gridW) / 2 + col * (SBOX_W + 12);
    const y = cBlockY + row * (SBOX_H + S_GAP);
    return { x, y, cx: x + SBOX_W / 2, cy: y + SBOX_H / 2 };
  };

  // Attach each line to a point on the indox box near the source's own column
  // so left-column sources connect to the left half and right-column sources
  // to the right half — no crossings on narrow viewports.
  const INDOX_INSET = 18;
  const attachX = (boxCx: number, row: number, rows: number) => {
    const t = rows === 1 ? 0.5 : row / (rows - 1);
    // Stagger rows within the column's side so multi-row columns don't stack
    // on the exact same x.
    const stagger = (t - 0.5) * 16;
    const leftSide = boxCx < W / 2;
    const base = leftSide
      ? INDOX_X + INDOX_INSET + (INDOX_W / 2 - INDOX_INSET * 2) * t * 0.6
      : INDOX_X + INDOX_W - INDOX_INSET - (INDOX_W / 2 - INDOX_INSET * 2) * t * 0.6;
    return base + stagger * (leftSide ? -1 : 1);
  };

  const sourcePaths = SOURCES.map((_, i) => {
    const b = sourceBox(i);
    const row = Math.floor(i / sCols);
    const sy = b.y + SBOX_H;
    const ix = attachX(b.cx, row, sRows);
    const iy = indoxY;
    const midY = (sy + iy) / 2;
    return `M ${b.cx} ${sy} C ${b.cx} ${midY}, ${ix} ${midY}, ${ix} ${iy}`;
  });

  const consumerPaths = CONSUMERS.map((_, i) => {
    const b = consumerBox(i);
    const row = Math.floor(i / cCols);
    const cy = b.y;
    const ix = attachX(b.cx, row, cRows);
    const iy = indoxY + INDOX_H;
    const midY = (iy + cy) / 2;
    return `M ${ix} ${iy} C ${ix} ${midY}, ${b.cx} ${midY}, ${b.cx} ${cy}`;
  });

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="Sources route through Indox to AI agents"
      style={{ display: "block", color: "var(--indox-text)" }}
    >
      <defs>
        <style>{DIAGRAM_STYLES}</style>
      </defs>

      <g aria-hidden="true">
        {sourcePaths.map((d, i) => (
          <path
            key={SOURCES[i].id}
            id={`vAm-src-${SOURCES[i].id}`}
            d={d}
            className={`ix-line ${hover === SOURCES[i].id || hover === "indox" ? "hot" : ""}`}
          />
        ))}
        {consumerPaths.map((d, i) => (
          <path
            key={CONSUMERS[i].id}
            id={`vAm-dst-${CONSUMERS[i].id}`}
            d={d}
            className={`ix-line ${hover === CONSUMERS[i].id || hover === "indox" ? "hot" : ""}`}
          />
        ))}
        {SOURCES.map((s, i) => {
          const j = jitter(s.id);
          return (
            <circle key={s.id} className="ix-flow-dot" r={2.2}>
              <animateMotion
                dur={`${(2.4 + j * 1.4) * trafficFor(s.id)}s`}
                repeatCount="indefinite"
                begin={`${-(j * 3 + i * 0.2)}s`}
              >
                <mpath href={`#vAm-src-${s.id}`} />
              </animateMotion>
            </circle>
          );
        })}
        {CONSUMERS.map((c, i) => {
          const j = jitter(c.id, 9);
          return (
            <circle key={c.id} className="ix-flow-dot" r={2.2}>
              <animateMotion
                dur={`${(2.6 + j * 1.2) * trafficFor(c.id)}s`}
                repeatCount="indefinite"
                begin={`${-(j * 3 + i * 0.25 + 0.4)}s`}
              >
                <mpath href={`#vAm-dst-${c.id}`} />
              </animateMotion>
            </circle>
          );
        })}
      </g>

      {SOURCES.map((s, i) => {
        const b = sourceBox(i);
        return (
          <g
            key={s.id}
            onClick={() => setHover(hover === s.id ? null : s.id)}
            style={{ opacity: s.status === "soon" ? 0.85 : 1 }}
          >
            <rect
              x={b.x}
              y={b.y}
              width={SBOX_W}
              height={SBOX_H}
              rx={4}
              className={`ix-box ${s.status === "soon" ? "soon" : ""} ${hover === s.id ? "hot" : ""}`}
            />
            <g
              transform={`translate(${b.x + 10} ${b.y + SBOX_H / 2 - 7})`}
              style={{ color: s.status === "live" ? "var(--indox-text)" : "var(--indox-muted)" }}
            >
              <DiagramIcon name={s.icon} size={12} />
            </g>
            <text
              x={b.x + 28}
              y={b.y + SBOX_H / 2 + 3}
              className={`ix-label ${s.status === "soon" ? "dim" : ""}`}
              style={{ fontSize: 9.5 }}
            >
              {s.label}
            </text>
            {s.status === "soon" && (
              <g>
                <rect
                  x={b.x + SBOX_W - 34}
                  y={b.y + SBOX_H / 2 - 7}
                  width={26}
                  height={14}
                  rx={2}
                  fill="none"
                  stroke="var(--indox-border)"
                />
                <text
                  x={b.x + SBOX_W - 21}
                  y={b.y + SBOX_H / 2 + 3}
                  textAnchor="middle"
                  className="ix-pill"
                  style={{ fontSize: 8 }}
                >
                  soon
                </text>
              </g>
            )}
          </g>
        );
      })}

      <IndoxCore x={INDOX_X} y={indoxY} w={INDOX_W} h={INDOX_H} hover={hover} setHover={setHover} />

      {CONSUMERS.map((c, i) => {
        const b = consumerBox(i);
        const rx = c.shape === "pill" ? SBOX_H / 2 : 4;
        return (
          <g key={c.id} onClick={() => setHover(hover === c.id ? null : c.id)}>
            <rect
              x={b.x}
              y={b.y}
              width={SBOX_W}
              height={SBOX_H}
              rx={rx}
              className={`ix-box ${hover === c.id ? "hot" : ""}`}
            />
            <g transform={`translate(${b.x + 10} ${b.y + SBOX_H / 2 - 7})`}>
              <DiagramIcon name={c.icon} size={12} />
            </g>
            <text
              x={b.x + 28}
              y={b.y + SBOX_H / 2 + 3}
              className="ix-label"
              style={{ fontSize: 9.5 }}
            >
              {c.label}
            </text>
          </g>
        );
      })}

      <text x={W / 2} y={18} textAnchor="middle" className="ix-pill">
        sources ↓
      </text>
      <text x={W / 2} y={indoxY - 8} textAnchor="middle" className="ix-pill">
        search server
      </text>
      <text x={W / 2} y={cBlockY - 8} textAnchor="middle" className="ix-pill">
        consumers ↓
      </text>
    </svg>
  );
}

// ─── Shared indox core block ───────────────────────────────────────────────

function IndoxCore({
  x,
  y,
  w,
  h,
  hover,
  setHover,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  hover: string | null;
  setHover: (s: string | null) => void;
  compact?: boolean;
}) {
  return (
    <g onMouseEnter={() => setHover("indox")} onMouseLeave={() => setHover(null)}>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        className={`ix-box ix-indox-rect ${hover === "indox" ? "hot" : ""}`}
        style={{ stroke: "var(--indox-text)" }}
      />
      {[
        [x + 8, y + 8],
        [x + w - 8, y + 8],
        [x + 8, y + h - 8],
        [x + w - 8, y + h - 8],
      ].map(([cx, cy], k) => (
        <circle key={k} cx={cx} cy={cy} r={1} fill="var(--indox-accent)" />
      ))}
      <text
        x={x + w / 2}
        y={y + h / 2 + 4}
        textAnchor="middle"
        className="ix-label"
        style={{ letterSpacing: "0.18em" }}
      >
        indox<tspan fill="var(--indox-accent)">.</tspan>core
      </text>
      <rect x={x} y={y} width={w} height={h} className="ix-hit" />
    </g>
  );
}
