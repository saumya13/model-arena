import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { fetchModels } from "@/lib/openrouter";
import type { OpenRouterModel } from "@/lib/types";
import { truncateModelName } from "@/lib/format";
import { Chevron } from "@/components/ui/Chevron";
import { ModalityIcon } from "@/components/ui/ModalityIcon";

type FetchStatus = "loading" | "ready" | "error";
export type PickerMode = "text" | "image";

interface ModelPickerProps {
  selected: OpenRouterModel[];
  onToggle: (model: OpenRouterModel) => void;
  maxModels: number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mode: PickerMode;
  onModeChange: (mode: PickerMode) => void;
}

export function ModelPicker({
  selected,
  onToggle,
  maxModels,
  collapsed,
  onToggleCollapsed,
  mode,
  onModeChange,
}: ModelPickerProps) {
  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [status, setStatus] = useState<FetchStatus>("loading");
  const [query, setQuery] = useState("");
  const prefersReducedMotion = useReducedMotion();
  const shellTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.22, ease: "easeInOut" as const };

  useEffect(() => {
    let cancelled = false;
    fetchModels()
      .then((data) => {
        if (cancelled) return;
        setModels(data);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedIds = useMemo(
    () => new Set(selected.map((m) => m.id)),
    [selected],
  );

  const filtered = useMemo(() => {
    const inMode = models.filter((m) =>
      mode === "image" ? m.supportsImageOutput : !m.supportsImageOutput,
    );
    const q = query.trim().toLowerCase();
    if (!q) return inMode;
    return inMode.filter(
      (m) => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q),
    );
  }, [models, query, mode]);

  const atLimit = selected.length >= maxModels;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {collapsed ? (
        <motion.div
          key="collapsed"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={shellTransition}
          className="h-full"
        >
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-expanded={false}
            aria-label="Expand model picker"
            title="Expand model picker"
            className="flex h-full w-full flex-col rounded-md border border-hairline bg-panel p-4 text-left transition hover:border-signal"
          >
            <span className="flex w-full items-center justify-between">
              <span className="readout-label">MODELS</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[0.6875rem] text-ink-faint">
                  {selected.length}/{maxModels}
                </span>
                <Chevron direction="right" className="text-ink-faint" />
              </span>
            </span>
            <span className="mt-2 flex flex-wrap content-start gap-1">
              {selected.length === 0 ? (
                <span className="text-sm text-ink-faint">No models selected</span>
              ) : (
                selected.map((model) => (
                  <span
                    key={model.id}
                    className="rounded-md border border-secondary bg-secondary-tint px-1.5 py-0.5 font-mono text-[0.625rem] leading-tight text-secondary-strong"
                  >
                    {truncateModelName(model.name, 20)}
                  </span>
                ))
              )}
            </span>
          </button>
        </motion.div>
      ) : (
        <motion.div
          key="expanded"
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={shellTransition}
          className="flex h-full flex-col rounded-md border border-hairline bg-panel"
        >
          <div className="p-4">
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-expanded={!collapsed}
              aria-label="Collapse model picker"
              title="Collapse model picker"
              className="flex w-full items-center justify-between"
            >
              <span className="readout-label">MODELS</span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-[0.6875rem] text-ink-faint">
                  {selected.length}/{maxModels}
                </span>
                {/* Collapsing shrinks the panel and slides the content beside
                    it left, so this points left to match — not down, which
                    reads as "reveal more below" and fights the actual motion. */}
                <Chevron direction="left" className="text-ink-faint" />
              </span>
            </button>

            {selected.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {selected.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => onToggle(model)}
                    className="flex items-center gap-1 rounded-lg border border-secondary bg-secondary-tint px-2.5 py-1 font-mono text-[0.6875rem] text-secondary-strong transition hover:bg-secondary/10"
                  >
                    {truncateModelName(model.name, 18)}
                    <span aria-hidden>×</span>
                  </button>
                ))}
              </div>
            )}

            {/* A model's output modality is fixed, so mixing an image-returning
                model with a text-only one in the same run would leave one card
                structurally empty — these two modes keep the catalog (and the
                selection) confined to one kind at a time instead of relying on
                the user to notice the mismatch themselves. */}
            <div className="mt-3 flex gap-0.5 rounded-sm border border-hairline p-0.5">
              {(["text", "image"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onModeChange(m)}
                  aria-pressed={mode === m}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-sm py-1 font-mono text-[0.6875rem] uppercase tracking-wide transition ${
                    mode === m
                      ? "bg-signal text-white"
                      : "text-ink-faint hover:text-ink"
                  }`}
                >
                  <ModalityIcon modality={m} className="h-3 w-3" />
                  {m}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models…"
              className="mt-3 w-full rounded border border-hairline bg-paper px-3 py-1.5 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal-tint"
            />
          </div>

          <div className="max-h-90 overflow-y-auto border-t border-hairline p-2">
            {status === "loading" && (
              <p className="p-3 text-sm text-ink-faint">
                Loading model catalog…
              </p>
            )}
            {status === "error" && (
              <p className="p-3 text-sm text-critical">
                Couldn&apos;t load the model catalog. Refresh to try again.
              </p>
            )}
            {status === "ready" && filtered.length === 0 && (
              <p className="p-3 text-sm text-ink-faint">
                No models match &quot;{query}&quot;.
              </p>
            )}
            {status === "ready" &&
              filtered.map((model) => {
                const isSelected = selectedIds.has(model.id);
                const disabled = !isSelected && atLimit;
                return (
                  <button
                    key={model.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(model)}
                    className={`flex w-full items-center justify-between gap-2 rounded px-3 py-2 text-left transition ${
                      isSelected ? "bg-signal-tint" : "hover:bg-raised"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm text-ink">
                          {model.name}
                        </span>
                        <span className="flex shrink-0 items-center gap-1 text-ink-faint">
                          {model.outputModalities.map((m) => (
                            <ModalityIcon
                              key={m}
                              modality={m}
                              className="h-3.5 w-3.5"
                            />
                          ))}
                        </span>
                      </span>
                      <span className="block truncate font-mono text-[0.6875rem] text-ink-faint">
                        {model.id}
                      </span>
                    </span>
                    <span
                      className={`h-3.5 w-3.5 shrink-0 rounded-full border ${
                        isSelected
                          ? "border-signal bg-signal"
                          : "border-hairline"
                      }`}
                      aria-hidden
                    />
                  </button>
                );
              })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
