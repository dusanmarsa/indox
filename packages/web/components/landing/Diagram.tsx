/**
 * Whiteboard-style architecture diagram.
 *
 *   agent
 *     │  POST /search
 *     ▼
 *   [ indox ]  ─── indox.yaml
 *    │  │  │
 *   docs  postgres  s3
 *
 * Boxes-and-lines, mono labels, no Figma sparkles. Looks like a senior
 * engineer sketched it on a whiteboard, which is the point.
 */
export function Diagram() {
  return (
    <svg
      viewBox="0 0 500 294"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", maxWidth: 480, display: "block" }}
      role="img"
      aria-label="Architecture diagram: agent sends a single POST /search to indox, which queries docs, a postgres database, and an s3 object store."
    >
      {/* Agent box */}
      <rect
        x="170"
        y="8"
        width="160"
        height="46"
        stroke="var(--indox-border)"
        strokeWidth="1"
        fill="var(--indox-surface)"
      />
      <text
        x="250"
        y="36"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="13"
        fill="var(--indox-muted)"
      >
        agent
      </text>

      {/* Arrow agent → indox */}
      <line x1="250" y1="54" x2="250" y2="114" stroke="var(--indox-dim)" strokeWidth="1" />
      <polygon points="246,111 250,120 254,111" fill="var(--indox-dim)" />
      <text
        x="258"
        y="90"
        fontFamily="var(--font-geist-mono)"
        fontSize="10"
        fill="var(--indox-dim)"
      >
        POST /search
      </text>

      {/* Indox node — accent border to highlight */}
      <rect
        x="170"
        y="120"
        width="160"
        height="46"
        stroke="var(--indox-accent)"
        strokeWidth="1"
        fill="var(--indox-surface)"
      />
      <text
        x="250"
        y="148"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="13"
        fill="var(--indox-text)"
      >
        indox
      </text>

      {/* indox.yaml tag */}
      <line
        x1="330"
        y1="143"
        x2="372"
        y2="143"
        stroke="var(--indox-dim)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <text
        x="378"
        y="147"
        fontFamily="var(--font-geist-mono)"
        fontSize="10"
        fill="var(--indox-dim)"
      >
        indox.yaml
      </text>

      {/* Lines to sources */}
      <line x1="212" y1="166" x2="80" y2="232" stroke="var(--indox-dim)" strokeWidth="1" />
      <line x1="250" y1="166" x2="250" y2="232" stroke="var(--indox-dim)" strokeWidth="1" />
      <line x1="288" y1="166" x2="420" y2="232" stroke="var(--indox-dim)" strokeWidth="1" />

      {/* Source: docs */}
      <rect
        x="20"
        y="232"
        width="120"
        height="46"
        stroke="var(--indox-border)"
        strokeWidth="1"
        fill="var(--indox-surface)"
      />
      <text
        x="80"
        y="252"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="11"
        fill="var(--indox-muted)"
      >
        docs/
      </text>
      <text
        x="80"
        y="266"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="10"
        fill="var(--indox-dim)"
      >
        filesystem
      </text>

      {/* Source: postgres */}
      <rect
        x="190"
        y="232"
        width="120"
        height="46"
        stroke="var(--indox-border)"
        strokeWidth="1"
        fill="var(--indox-surface)"
      />
      <text
        x="250"
        y="252"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="11"
        fill="var(--indox-muted)"
      >
        postgres://
      </text>
      <text
        x="250"
        y="266"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="10"
        fill="var(--indox-dim)"
      >
        database
      </text>

      {/* Source: s3 */}
      <rect
        x="360"
        y="232"
        width="120"
        height="46"
        stroke="var(--indox-border)"
        strokeWidth="1"
        fill="var(--indox-surface)"
      />
      <text
        x="420"
        y="252"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="11"
        fill="var(--indox-muted)"
      >
        s3://
      </text>
      <text
        x="420"
        y="266"
        textAnchor="middle"
        fontFamily="var(--font-geist-mono)"
        fontSize="10"
        fill="var(--indox-dim)"
      >
        object store
      </text>
    </svg>
  );
}
