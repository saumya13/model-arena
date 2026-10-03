import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts";
import { truncateModelName } from "@/lib/format";
import { ChartCard } from "./ChartCard";

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
  /** Per-chart legend; the cards hide it in favour of one shared legend, the modal shows it. */
  showLegend?: boolean;
}

/** The bare plot — no card chrome or title, so it can be reused under a custom header (e.g. a metric toggle). */
export function ChartBody({
  data,
  series,
  formatValue,
  height = 320,
  yAxisLabel,
  showLegend = true,
}: ChartBodyProps) {
  const colorById = new Map(series.map((s) => [s.id, s.color]));

  return (
    <div className="relative" style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid stroke="#d4d4d4" strokeDasharray="5 5" />
          <XAxis
            dataKey="run"
            tick={{ fontSize: 11, fill: "#444" }}
            tickLine={{ stroke: "#444" }}
            axisLine={{ stroke: "#444" }}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#444" }}
            tickLine={{ stroke: "#444" }}
            axisLine={{ stroke: "#444" }}
            domain={[0, "auto"]}
            width={72}
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
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              align="center"
              iconType="plainline"
              iconSize={12}
              wrapperStyle={{ paddingTop: 12, fontSize: 11 }}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {truncateModelName(String(value).replace(/^[^:]+:\s*/, ""), 16)}
                </span>
              )}
            />
          )}
          {series.map((s) => (
            <Line
              key={s.id}
              dataKey={s.id}
              name={s.label}
              type="monotone"
              stroke={s.color}
              strokeWidth={1.5}
              connectNulls={false}
              dot={{ r: 4, fill: s.color, strokeWidth: 0, fillOpacity: 1 }}
              activeDot={{ r: 6, fillOpacity: 1 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MetricChartProps extends Omit<ChartBodyProps, "height"> {
  title: string;
  subtitle: string;
}

/** A chart card for the single-metric charts (latency, cost). */
export function MetricChart({ title, subtitle, ...bodyProps }: MetricChartProps) {
  return (
    <ChartCard title={title} subtitle={subtitle}>
      {(height, expanded) => (
        <ChartBody {...bodyProps} height={height} showLegend={expanded} />
      )}
    </ChartCard>
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
