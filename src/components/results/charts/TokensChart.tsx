import { useState } from "react";
import { ChartCard } from "./ChartCard";
import { ChartBody, type MetricSeriesMeta } from "./MetricChart";
import { formatTokens } from "@/lib/format";

type TokenMetric = "total" | "input" | "output";

const TABS: Array<{ id: TokenMetric; label: string }> = [
  { id: "total", label: "Total" },
  { id: "input", label: "Input" },
  { id: "output", label: "Output" },
];

interface TokensChartProps {
  series: MetricSeriesMeta[];
  totalData: Array<Record<string, number | string | null>>;
  inputData: Array<Record<string, number | string | null>>;
  outputData: Array<Record<string, number | string | null>>;
}

export function TokensChart({ series, totalData, inputData, outputData }: TokensChartProps) {
  const [metric, setMetric] = useState<TokenMetric>("total");
  const data = metric === "total" ? totalData : metric === "input" ? inputData : outputData;

  const toggle = (
    <div className="flex gap-0.5 rounded-full border border-hairline p-0.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => setMetric(tab.id)}
          className={`rounded-full px-2 py-0.5 font-mono text-[0.625rem] uppercase tracking-wide transition ${
            metric === tab.id ? "bg-signal text-white" : "text-ink-faint hover:text-ink"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <ChartCard title="Tokens" subtitle="Token usage per run" headerExtra={toggle}>
      {(height, expanded) => (
        <ChartBody
          data={data}
          series={series}
          formatValue={formatTokens}
          height={height}
          showLegend={expanded}
          yAxisLabel="tokens"
        />
      )}
    </ChartCard>
  );
}
