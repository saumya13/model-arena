import { useMemo } from "react";
import type { ComparisonRun, ModelRunResult } from "@/lib/types";
import { assignSeriesColors } from "@/lib/palette";
import { formatMs, formatUsd, truncateModelName } from "@/lib/format";
import { MetricChart, type MetricSeriesMeta } from "./charts/MetricChart";
import { TokensChart } from "./charts/TokensChart";

interface MetricsChartsProps {
  runs: ComparisonRun[];
}

type MetricRow = Record<string, number | string | null>;

export function MetricsCharts({ runs }: MetricsChartsProps) {
  const { hasData, series, latencyData, costData, totalTokenData, inputTokenData, outputTokenData } =
    useMemo(() => {
      // Fixed, append-only order: a model keeps the same color for the rest
      // of the session even if a later run drops it from the selection.
      const idsInOrder: string[] = [];
      const nameById = new Map<string, string>();
      runs.forEach((run) => {
        run.results.forEach((r) => {
          if (!idsInOrder.includes(r.modelId)) idsInOrder.push(r.modelId);
          nameById.set(r.modelId, r.modelName);
        });
      });

      const colorById = assignSeriesColors(idsInOrder);
      const series: MetricSeriesMeta[] = idsInOrder.map((id) => ({
        id,
        label: nameById.get(id) ?? id,
        color: colorById.get(id) ?? "#898781",
      }));

      function rowsFor(metric: (r: ModelRunResult) => number | null): MetricRow[] {
        return runs.map((run, i) => {
          const row: MetricRow = { run: `R${i + 1}` };
          idsInOrder.forEach((id) => {
            const result = run.results.find((r) => r.modelId === id);
            row[id] = result && result.status === "done" ? metric(result) : null;
          });
          return row;
        });
      }

      const latencyData = rowsFor((r) => r.latencyMs ?? null);
      const costData = rowsFor((r) => r.cost?.totalCost ?? null);
      const totalTokenData = rowsFor((r) => r.usage?.total_tokens ?? null);
      const inputTokenData = rowsFor((r) => r.usage?.prompt_tokens ?? null);
      const outputTokenData = rowsFor((r) => r.usage?.completion_tokens ?? null);

      const hasData = latencyData.some((row) => idsInOrder.some((id) => row[id] != null));

      return {
        hasData,
        series,
        latencyData,
        costData,
        totalTokenData,
        inputTokenData,
        outputTokenData,
      };
    }, [runs]);

  if (!hasData) return null;

  return (
    <div className="mt-14 border-t border-hairline pt-8">
      <p className="readout-label-green">METRICS OVER RUNS</p>
      <p className="mt-1 text-sm text-ink-soft">
        {runs.length} run{runs.length === 1 ? "" : "s"} so far — run the same models again
        on a new prompt to add another point.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <MetricChart
          title="Latency"
          subtitle="Time to full response"
          data={latencyData}
          series={series}
          formatValue={formatMs}
        />
        <MetricChart
          title="Cost"
          subtitle="Total spend per run"
          data={costData}
          series={series}
          formatValue={formatUsd}
        />
        <TokensChart
          series={series}
          totalData={totalTokenData}
          inputData={inputTokenData}
          outputData={outputTokenData}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5">
        {series.map((entry) => (
          <div key={entry.id} className="flex items-center gap-1.5">
            <span className="inline-block h-0.5 w-3" style={{ backgroundColor: entry.color }} />
            <span className="text-[0.6875rem]" style={{ color: entry.color }}>
              {truncateModelName(entry.label.replace(/^[^:]+:\s*/, ""), 24)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
