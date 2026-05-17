import * as React from "react";
import { cn } from "../../cn";

type SparkLineProps = Omit<React.ComponentProps<"svg">, "viewBox"> & {
  data: number[];
  variant?: "line" | "area" | "bars";
  tone?: "accent" | "ok" | "bad" | "ink";
  strokeWidth?: number;
};

const TONE = {
  accent: "var(--indox-accent)",
  ok: "var(--indox-ok)",
  bad: "var(--indox-bad)",
  ink: "var(--indox-ink-2)",
};

function SparkLine({
  data,
  variant = "line",
  tone = "accent",
  strokeWidth = 1.5,
  className,
  ...props
}: SparkLineProps) {
  const W = 100;
  const H = 30;
  const PAD = 1;
  if (!data.length) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const xStep = (W - PAD * 2) / Math.max(data.length - 1, 1);

  const points = data.map((v, i) => {
    const x = PAD + i * xStep;
    const y = PAD + (1 - (v - min) / span) * (H - PAD * 2);
    return [x, y] as const;
  });

  const color = TONE[tone];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      data-slot="sparkline"
      className={cn("inline-block w-full", className)}
      {...props}
    >
      {variant === "bars" ? (
        data.map((_, i) => {
          const [x, y] = points[i];
          return (
            <rect
              key={i}
              x={x - xStep / 2.5}
              y={y}
              width={xStep / 1.4}
              height={H - y - PAD}
              fill={color}
              opacity={0.85}
            />
          );
        })
      ) : (
        <>
          {variant === "area" && (
            <polygon
              fill={color}
              opacity={0.18}
              points={[
                `${points[0][0]},${H}`,
                ...points.map((p) => `${p[0]},${p[1]}`),
                `${points[points.length - 1][0]},${H}`,
              ].join(" ")}
            />
          )}
          <polyline
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={points.map((p) => `${p[0]},${p[1]}`).join(" ")}
          />
        </>
      )}
    </svg>
  );
}

export { SparkLine };
export type { SparkLineProps };
