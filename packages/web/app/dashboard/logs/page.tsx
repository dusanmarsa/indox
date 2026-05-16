import { LOG_LINES } from "@/components/dashboard/data";

const LEVEL_STYLES: Record<string, string> = {
  info:  "text-(--indox-ok)",
  warn:  "text-[#d4a630]",
  debug: "text-(--indox-dim)",
  error: "text-(--indox-accent)",
};

export default function LogsPage() {
  return (
    <div>
      <div className="mb-9 flex items-start justify-between">
        <div>
          <h1 className="mb-1 text-[20px] font-semibold tracking-[-0.02em]">Logs</h1>
          <p className="font-mono text-[13px] text-(--indox-muted)">structured · level=debug</p>
        </div>
        <button className="border border-(--indox-border) bg-transparent px-3.5 py-[7px] font-mono text-[12px] text-(--indox-muted) transition-colors hover:border-(--indox-muted) hover:text-foreground">
          clear
        </button>
      </div>

      <div className="border border-(--indox-border)">
        {/* Terminal chrome */}
        <div className="flex items-center gap-2 border-b border-(--indox-border) bg-(--indox-surface) px-4 py-[10px]">
          <span className="h-3 w-3 rounded-full bg-(--indox-border)" />
          <span className="h-3 w-3 rounded-full bg-(--indox-border)" />
          <span className="h-3 w-3 rounded-full bg-(--indox-border)" />
          <span className="ml-3 font-mono text-[11px] text-(--indox-dim)">indox · stderr</span>
        </div>

        {/* Log lines */}
        <div className="overflow-x-auto bg-(--indox-surface) px-5 py-4">
          <div className="min-w-max space-y-[3px]">
            {LOG_LINES.map((line, i) => (
              <div
                key={i}
                className="flex items-baseline gap-3 font-mono text-[12px] leading-[1.6] transition-colors hover:bg-(--indox-border)/30"
              >
                <span className="w-[104px] shrink-0 text-(--indox-dim)">{line.time}</span>
                <span className={`w-12 shrink-0 ${LEVEL_STYLES[line.level] ?? "text-(--indox-muted)"}`}>
                  {line.level.toUpperCase().padEnd(5)}
                </span>
                <span className="w-[88px] shrink-0 text-foreground">{line.msg}</span>
                <span className="text-(--indox-muted)">{line.detail}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-2 border-t border-(--indox-border) px-5 py-2.5">
          <span className="h-1.5 w-1.5 animate-pulse bg-(--indox-ok)" />
          <span className="font-mono text-[11px] text-(--indox-dim)">live · following tail</span>
        </div>
      </div>
    </div>
  );
}
