import { useState } from "react";
import type { ComparisonRun, OpenRouterModel } from "@/lib/types";
import { ResultsGrid, CompletedRunGrid } from "./ResultsGrid";
import { Chevron } from "@/components/ui/Chevron";
import { formatUsd } from "@/lib/format";

interface RunsHistoryProps {
  runs: ComparisonRun[];
  selectedModels: OpenRouterModel[];
}

// Every run this session stays available to revisit — nothing is discarded,
// only visually tucked away — but it's all in-memory React state, so a page
// reload (session end) still clears it; there's no persistence layer.
//
// The latest run is always rendered in full below (outside this set
// entirely); `expandedIds` only tracks which *older* runs the user has
// manually re-opened — a run not in it renders collapsed, which is also
// exactly the state a run starts in the moment a newer run supersedes it.
export function RunsHistory({ runs, selectedModels }: RunsHistoryProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const latestRun = runs[runs.length - 1];

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (!latestRun) {
    return <ResultsGrid models={selectedModels} results={[]} />;
  }

  const olderRuns = runs.slice(0, -1).reverse();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="border-l-2 border-signal pl-3">
        <p className="mb-2 flex items-center gap-2">
          <span className="font-mono text-[0.6875rem] font-semibold uppercase tracking-wide text-signal">
            Latest · Run {runs.length}
          </span>
        </p>
        <ResultsGrid models={selectedModels} results={latestRun.results} />
      </div>

      {olderRuns.map((run, i) => {
        const runNumber = olderRuns.length - i;
        const isExpanded = expandedIds.has(run.id);
        const totalCost = run.results.reduce(
          (sum, r) => sum + (r.cost?.totalCost ?? 0),
          0,
        );

        return (
          <div
            key={run.id}
            className={`rounded-md border ${
              isExpanded
                ? "border-hairline bg-panel"
                : "border-neutral-200 bg-neutral-100"
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(run.id)}
              aria-expanded={isExpanded}
              className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-panel"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="shrink-0 rounded border border-neutral-300 bg-white px-1.5 py-0.5 font-mono text-[0.625rem] font-semibold text-neutral-700">
                  RUN {runNumber}
                </span>
                <span className="truncate text-sm font-medium text-neutral-800">
                  {run.prompt}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span className="font-mono text-[0.6875rem] text-neutral-500">
                  {run.results.length} model{run.results.length === 1 ? "" : "s"} ·{" "}
                  {formatUsd(totalCost)}
                </span>
                <Chevron direction={isExpanded ? "down" : "right"} className="text-neutral-500" />
              </span>
            </button>
            {isExpanded && (
              <div className="border-t border-hairline p-4">
                <CompletedRunGrid results={run.results} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
