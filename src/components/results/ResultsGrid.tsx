import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
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
  /** Per-model series color, shared with the metrics charts. */
  colorById: Map<string, string>;
}

export function ResultsGrid({ models, results, colorById }: ResultsGridProps) {
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
          color={colorById.get(model.id)}
          result={results.find((r) => r.modelId === model.id)}
        />
      ))}
    </div>
  );
}

/** Renders a finished run's results directly — every model already has a result, no idle/placeholder state needed. */
export function CompletedRunGrid({
  results,
  colorById,
}: {
  results: ModelRunResult[];
  colorById: Map<string, string>;
}) {
  return (
    <div className={`grid min-h-0 flex-1 gap-4 ${GRID_COLS[results.length] ?? "grid-cols-1"}`}>
      {results.map((result) => (
        <ModelResultCard
          key={result.modelId}
          modelId={result.modelId}
          modelName={result.modelName}
          color={colorById.get(result.modelId)}
          result={result}
        />
      ))}
    </div>
  );
}

function GeneratingIndicator() {
  return (
    <div className="flex flex-col items-center gap-3" role="status">
      <svg
        viewBox="0 0 48 56"
        className="h-16 w-14 text-ink-soft"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <g className="robot-sway">
          <g className="robot-antenna">
            <line x1="24" y1="9" x2="24" y2="4" />
            <circle cx="24" cy="3" r="2" className="fill-signal stroke-signal" />
          </g>
          <rect x="10" y="9" width="28" height="18" rx="5" />
          <circle cx="18" cy="18" r="2.5" className="fill-signal stroke-none" />
          <circle cx="30" cy="18" r="2.5" className="fill-signal stroke-none" />
          <rect x="14" y="29" width="20" height="14" rx="4" />
          <line x1="14" y1="32" x2="6" y2="38" className="robot-arm-l" />
          <line x1="34" y1="32" x2="42" y2="38" className="robot-arm-r" />
          <line x1="20" y1="43" x2="20" y2="52" className="robot-leg-l" />
          <line x1="28" y1="43" x2="28" y2="52" className="robot-leg-r" />
        </g>
      </svg>
      <p className="flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-faint">
        Generating
        <span className="flex items-end gap-0.5">
          <span className="h-1 w-1 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.3s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-ink-faint [animation-delay:-0.15s]" />
          <span className="h-1 w-1 animate-bounce rounded-full bg-ink-faint" />
        </span>
      </p>
    </div>
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
  color,
  result,
}: {
  modelId: string;
  modelName: string;
  color?: string;
  result?: ModelRunResult;
}) {
  const [expanded, setExpanded] = useState(false);
  // Image results fit the card without scrolling; only text responses scroll.
  const hasImages = !!result && result.images.length > 0;
  return (
    <div
      className="flex h-full min-h-0 flex-col rounded-md border border-hairline bg-panel"
      style={color ? { borderTopColor: color, borderTopWidth: 3 } : undefined}
    >
      {expanded && result && (
        <ImageLightbox
          images={result.images}
          alt={modelName}
          onClose={() => setExpanded(false)}
        />
      )}
      {/* Header/footer get a slightly raised surface so the eye lands on the
          card's actual content (the response body) first, with the model's
          identity and its metrics framing it as secondary context. */}
      <div className="flex items-center gap-2 rounded-t-md border-b border-hairline bg-neutral-100 px-4 py-3">
        <div className="min-w-0 flex-1">
          {/* Dot sits on the name line only, so it lines up with the bold
              name rather than centering against name + id. */}
          <div className="flex items-center gap-2">
            {color && (
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
            )}
            <p
              className="min-w-0 truncate font-mono text-sm font-semibold text-ink"
              title={modelName}
            >
              {truncateModelName(modelName)}
            </p>
          </div>
          <p
            className={`truncate font-mono text-[0.6875rem] text-ink-faint ${color ? "pl-[1.125rem]" : ""}`}
          >
            {modelId}
          </p>
        </div>
        {result && result.images.length > 0 && (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Expand image"
            title="Expand image"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-hairline bg-panel text-ink-soft hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M10 2h4v4M6 14H2v-4M14 2l-5 5M2 14l5-5" />
            </svg>
          </button>
        )}
      </div>

      {/* Grows to fill the card (so a short/empty response still looks
          balanced) but is capped so a long streamed response or a large
          generated image scrolls inside the card instead of growing it
          without bound — which was also inflating the model picker next to
          it, since the two columns stretch to match heights. */}
      <div
        className={`min-h-32 flex-1 px-4 py-4 ${
          result?.status === "connecting" || result?.status === "error"
            ? "flex items-center justify-center text-center"
            : ""
        } ${hasImages ? "" : "max-h-[28rem] overflow-y-auto"}`}
      >
        {!result && (
          <p className="text-sm text-ink-faint">
            Its response will stream here once you run this prompt.
          </p>
        )}
        {result?.status === "connecting" && <GeneratingIndicator />}
        {(result?.status === "streaming" || result?.status === "done") && (
          <>
            {result.images.map((url, i) => (
              // Same-size box in every card (capped so tall cards don't grow
              // without bound); the image is scaled to fit inside it, whole
              // and uncropped. Expand opens the full-size version.
              <img
                key={i}
                src={url}
                alt={`${modelName} output ${i + 1}`}
                className="mb-3 aspect-square max-h-[26rem] w-full rounded border border-hairline object-contain"
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

function ImageLightbox({
  images,
  alt,
  onClose,
}: {
  images: string[];
  alt: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-ink/60 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded bg-panel text-lg text-ink shadow"
      >
        ×
      </button>
      {/* Scaled to fit the viewport (whole image, aspect ratio kept). More
          than one image stacks and scrolls, each still fitting on screen. */}
      <div className="flex h-full w-full items-center justify-center overflow-auto p-6">
        <div className="flex flex-col items-center gap-4">
          {images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`${alt} output ${i + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="block max-h-[calc(100vh-3rem)] max-w-[calc(100vw-3rem)] rounded object-contain shadow-xl"
            />
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
