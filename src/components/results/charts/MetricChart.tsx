import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { truncateModelName } from "@/lib/format";

export interface MetricSeriesMeta {
  id: string;
  label: string;
  color: string;
}

interface ChartBodyProps {
  data: Array<Record<string, number | string | null>>;
  series: MetricSeriesMeta[];
  formatValue: (value: number) => string;
  height?: number;
  /** Short unit shown as the rotated Y-axis title, e.g. "ms", "USD", "tokens". */
  yAxisLabel?: string;
  /** Caption shown top-right of the plot — the x-axis is always "run" across every chart here. */
  xAxisLabel?: string;
}

/** The bare plot — no card chrome or title, so it can be reused under a custom header (e.g. a metric toggle). */
export function ChartBody({
  data,
  series,
  formatValue,
  height = 320,
  yAxisLabel,
  xAxisLabel = "Run",
}: ChartBodyProps) {
  const colorById = new Map(series.map((s) => [s.id, s.color]));

  return (
    <div className="relative" style={{ width: "100%", height }}>
      {/* A bottom-centered axis title competed with the tick labels for the
          same cramped strip — placing it top-right instead keeps it clear
          of both the x-axis ticks and the plotted lines. */}
      <span className="pointer-events-none absolute right-1 top-0 font-mono text-[0.625rem] uppercase tracking-wide text-ink-faint">
        {xAxisLabel}
      </span>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="var(--color-hairline)" strokeDasharray="4 4" />
          <XAxis
            dataKey="run"
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            tickLine={{ stroke: "var(--color-ink-soft)" }}
            axisLine={{ stroke: "var(--color-ink-soft)" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-ink-faint)" }}
            tickLine={{ stroke: "var(--color-ink-soft)" }}
            axisLine={{ stroke: "var(--color-ink-soft)" }}
            width={64}
            tickFormatter={(v) => formatValue(Number(v))}
            label={
              yAxisLabel
                ? {
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: 12,
                    fontSize: 11,
                    fill: "var(--color-ink-soft)",
                  }
                : undefined
            }
          />
          <Tooltip
            content={(props) => (
              <ChartTooltip {...props} formatValue={formatValue} colorById={colorById} />
            )}
          />
          {series.map((s) => (
            <Line
              key={s.id}
              dataKey={s.id}
              name={s.label}
              type="monotone"
              stroke={s.color}
              // The line is a connective guide between points — it should
              // read as secondary to the dots, which carry the actual values.
              strokeOpacity={0.45}
              strokeWidth={1.5}
              connectNulls={false}
              dot={{ r: 5, fill: s.color, strokeWidth: 0, fillOpacity: 1 }}
              activeDot={{ r: 7, fillOpacity: 1 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MetricChartProps extends ChartBodyProps {
  title: string;
}

/** A chart card with a plain readout-label title — for the single-metric charts (latency, cost). */
export function MetricChart({ title, ...bodyProps }: MetricChartProps) {
  return (
    <div className="rounded-md border border-hairline-strong bg-panel p-4">
      <p className="readout-label">{title}</p>
      <div className="mt-3">
        <ChartBody {...bodyProps} />
      </div>
    </div>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  colorById,
}: TooltipContentProps & {
  formatValue: (value: number) => string;
  colorById: Map<string, string>;
}) {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((row) => row.value != null);
  if (rows.length === 0) return null;

  return (
    <div className="rounded border border-hairline bg-panel px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-mono text-[0.625rem] text-ink-faint">{label}</p>
      {rows.map((row) => (
        <p
          key={String(row.dataKey ?? row.name)}
          className="flex items-center gap-1.5 whitespace-nowrap"
        >
          <span
            className="inline-block h-0.5 w-2.5"
            style={{ backgroundColor: colorById.get(String(row.dataKey)) }}
          />
          <span className="font-semibold text-ink">{formatValue(Number(row.value))}</span>
          <span className="text-ink-faint">{truncateModelName(String(row.name), 20)}</span>
        </p>
      ))}
    </div>
  );
}
