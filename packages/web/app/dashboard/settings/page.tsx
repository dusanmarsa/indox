const CONFIG_BLOCKS = [
  {
    label: "Server",
    rows: [
      { key: "addr",         value: ":8080" },
      { key: "read_timeout", value: "30s" },
      { key: "max_results",  value: "20" },
      { key: "log_level",    value: "debug" },
    ],
  },
  {
    label: "Indexing",
    rows: [
      { key: "chunk_size",    value: "512" },
      { key: "chunk_overlap", value: "64" },
      { key: "embed_model",   value: "text-embedding-3-small" },
      { key: "embed_dim",     value: "1536" },
      { key: "sync_interval", value: "60s" },
    ],
  },
  {
    label: "Search",
    rows: [
      { key: "strategy",      value: "hybrid" },
      { key: "bm25_weight",   value: "0.3" },
      { key: "vector_weight", value: "0.7" },
      { key: "rerank",        value: "true" },
    ],
  },
  {
    label: "Telemetry",
    rows: [
      { key: "enabled", value: "false", muted: true },
    ],
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="max-w-[640px]">
      <div className="mb-9">
        <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Settings</h1>
        <p className="font-mono text-[13px] text-(--indox-muted)">
          indox.yaml · read from /etc/indox/config.yaml
        </p>
      </div>

      <div className="space-y-6">
        {CONFIG_BLOCKS.map((block) => (
          <div key={block.label} className="border border-(--indox-border)">
            <div className="border-b border-(--indox-border) bg-(--indox-surface) px-[18px] py-[11px]">
              <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-(--indox-dim)">
                {block.label}
              </span>
            </div>
            {block.rows.map((row, i) => (
              <div
                key={row.key}
                className={`flex items-center border-b border-(--indox-border) last:border-b-0 transition-colors hover:bg-(--indox-surface)/50 ${i % 2 === 0 ? "" : "bg-(--indox-surface)/30"}`}
              >
                <div className="w-[200px] shrink-0 border-r border-(--indox-border) px-[18px] py-[10px] font-mono text-[12px] text-(--indox-muted)">
                  {row.key}
                </div>
                <div className={`flex-1 px-[18px] py-[10px] font-mono text-[12px] ${"muted" in row && row.muted ? "text-(--indox-dim)" : "text-foreground"}`}>
                  {row.value}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <p className="mt-8 font-mono text-[11px] text-(--indox-dim)">
        Edit <span className="text-(--indox-muted)">/etc/indox/config.yaml</span> and restart to apply changes.
      </p>
    </div>
  );
}
