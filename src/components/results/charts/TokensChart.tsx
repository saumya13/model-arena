import { useState } from "react";
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

  return (
    <div className="rounded-md border border-hairline-strong bg-panel p-4">
      <div className="flex items-center justify-between">
        <p className="readout-label">TOKENS</p>
        <div className="flex gap-0.5 rounded-full border border-hairline p-0.5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMetric(tab.id)}
              className={`rounded-full px-2.5 py-1 font-mono text-[0.625rem] uppercase tracking-wide transition ${
                metric === tab.id
                  ? "bg-signal text-white"
                  : "text-ink-faint hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-3">
        <ChartBody
          data={data}
          series={series}
          formatValue={formatTokens}
          height={340}
          yAxisLabel="tokens"
        />
      </div>
    </div>
  );
}
