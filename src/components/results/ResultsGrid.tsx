import type { ModelRunResult, OpenRouterModel } from "@/lib/types";
import { formatMs, formatTokens, formatUsd, truncateModelName } from "@/lib/format";

// Tailwind's scanner needs literal class strings, so the column count is
// mapped to a fixed set of pre-written classes rather than interpolated.
const GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-4",
};

interface ResultsGridProps {
  models: OpenRouterModel[];
  /** Results from the latest run; a model not present here hasn't been run yet this round. */
  results: ModelRunResult[];
}

export function ResultsGrid({ models, results }: ResultsGridProps) {
  if (models.length === 0) {
    return (
      <div className="flex min-h-60 flex-1 flex-col items-center justify-center rounded-md border border-dashed border-hairline px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
          No models selected
        </p>
        <p className="mt-1.5 max-w-xs text-sm text-ink-soft">
          Pick up to four models on the left to set up a comparison.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid min-h-0 flex-1 gap-4 ${GRID_COLS[models.length]}`}>
      {models.map((model) => (
        <ModelResultCard
          key={model.id}
          modelId={model.id}
          modelName={model.name}
          result={results.find((r) => r.modelId === model.id)}
        />
      ))}
    </div>
  );
}

/** Renders a finished run's results directly — every model already has a result, no idle/placeholder state needed. */
export function CompletedRunGrid({ results }: { results: ModelRunResult[] }) {
  return (
    <div className={`grid min-h-0 flex-1 gap-4 ${GRID_COLS[results.length] ?? "grid-cols-1"}`}>
      {results.map((result) => (
        <ModelResultCard
          key={result.modelId}
          modelId={result.modelId}
          modelName={result.modelName}
          result={result}
        />
      ))}
    </div>
  );
}

function GeneratingIndicator() {
  return (
    <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-faint">
      Generating
      <span className="flex items-end gap-0.5">
        <span className="h-1 w-1 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.3s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.15s]" />
        <span className="h-1 w-1 animate-bounce rounded-full bg-ink-faint" />
      </span>
    </p>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-col">
      <span className="truncate text-ink-faint">{label}</span>
      <span className="tabular truncate font-semibold text-ink">{value}</span>
    </div>
  );
}

function ModelResultCard({
  modelId,
  modelName,
  result,
}: {
  modelId: string;
  modelName: string;
  result?: ModelRunResult;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-md border border-hairline bg-panel">
      {/* Header/footer get a slightly raised surface so the eye lands on the
          card's actual content (the response body) first, with the model's
          identity and its metrics framing it as secondary context. */}
      <div className="rounded-t-md border-b border-hairline bg-neutral-100 px-4 py-3">
        <p
          className="truncate font-mono text-sm font-semibold text-ink"
          title={modelName}
        >
          {truncateModelName(modelName)}
        </p>
        <p className="truncate font-mono text-[0.6875rem] text-ink-faint">
          {modelId}
        </p>
      </div>

      {/* Grows to fill the card (so a short/empty response still looks
          balanced) but is capped so a long streamed response or a large
          generated image scrolls inside the card instead of growing it
          without bound — which was also inflating the model picker next to
          it, since the two columns stretch to match heights. */}
      <div className="min-h-32 max-h-[28rem] flex-1 overflow-y-auto px-4 py-4">
        {!result && (
          <p className="text-sm text-ink-faint">
            Its response will stream here once you run this prompt.
          </p>
        )}
        {result?.status === "connecting" && <GeneratingIndicator />}
        {(result?.status === "streaming" || result?.status === "done") && (
          <>
            {result.images.map((url, i) => (
              // Fixed square dimensions so images from different models line
              // up for comparison instead of each rendering at its own
              // native aspect ratio.
              <img
                key={i}
                src={url}
                alt={`${modelName} output ${i + 1}`}
                className="mb-3 aspect-square w-full rounded border border-hairline object-cover"
              />
            ))}
            {(result.content || result.images.length === 0) && (
              <p className="whitespace-pre-wrap break-words text-sm text-ink">
                {result.content}
                {result.status === "streaming" && (
                  <span
                    className="ml-0.5 inline-block h-3.5 w-1.5 animate-pulse bg-ink-faint align-text-bottom"
                    aria-hidden
                  />
                )}
              </p>
            )}
          </>
        )}
        {result?.status === "error" && (
          <p className="text-sm text-critical">
            {result.error?.message ?? "Something went wrong."}
          </p>
        )}
      </div>

      <div className="grid grid-cols-4 gap-1 rounded-b-md border-t border-hairline bg-neutral-100 px-4 py-2 font-mono text-[0.625rem]">
        <Metric
          label="LATENCY"
          value={result?.latencyMs != null ? formatMs(result.latencyMs) : "—"}
        />
        <Metric
          label="IN TOK"
          value={result?.usage ? formatTokens(result.usage.prompt_tokens) : "—"}
        />
        <Metric
          label="OUT TOK"
          value={result?.usage ? formatTokens(result.usage.completion_tokens) : "—"}
        />
        <Metric
          label="COST"
          value={result?.cost ? formatUsd(result.cost.totalCost) : "—"}
        />
      </div>
    </div>
  );
}
