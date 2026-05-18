type ActivityChartProps = {
  bars?: number[];
  xLabels?: string[];
};

export function ActivityChart({ bars, xLabels }: ActivityChartProps) {
  if (!bars || !xLabels) {
    return null;
  }

  const last = bars.length - 1;
  const recent = 5;

  return (
    <div className="mb-9 border border-border">
      <div className="flex items-center justify-between border-b border-border bg-surface px-[18px] py-[13px]">
        <span className="text-[13px] font-medium">query activity</span>
        <span className="font-mono text-[11px] text-ink-3">last 30 days</span>
      </div>
      <div className="px-6 pb-4 pt-5">
        <div className="flex h-20 items-end gap-[3px]">
          {bars.map((h, i) => (
            <div
              key={i}
              className={[
                "min-w-0 flex-1 transition-colors",
                i === last
                  ? "opacity-70"
                  : i >= last - recent
                    ? "bg-ink-2"
                    : "bg-border hover:bg-ink-3",
              ]
                .filter(Boolean)
                .join(" ")}
              style={{
                height: `${h * 100}%`,
                backgroundColor: i === last ? "var(--indox-accent)" : undefined,
              }}
            />
          ))}
        </div>
        <div className="mt-1.5 flex justify-between">
          {xLabels.map((l) => (
            <span key={l} className="font-mono text-[10px] text-ink-3">
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
