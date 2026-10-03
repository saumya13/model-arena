import { useState } from "react";
import { ModelPicker, type PickerMode } from "@/components/model-picker/ModelPicker";
import { PromptInput } from "@/components/prompt/PromptInput";
import { RunsHistory } from "@/components/results/RunsHistory";
import { MetricsCharts } from "@/components/results/MetricsCharts";
import { useApiKeyStore } from "@/store/useApiKeyStore";
import { useArenaRuns } from "@/hooks/useArenaRuns";
import type { OpenRouterModel } from "@/lib/types";

const MAX_MODELS = 4;

export function ComparisonSection() {
  const apiKey = useApiKeyStore((s) => s.apiKey);
  const [selectedModels, setSelectedModels] = useState<OpenRouterModel[]>([]);
  const [prompt, setPrompt] = useState("");
  const [pickerCollapsed, setPickerCollapsed] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>("text");
  const { runs, isRunning, runComparison } = useArenaRuns(apiKey);

  // A run's cards all read the same way — plain text, or an image — so the
  // picker only ever offers one modality at a time; switching modes drops
  // any selection that doesn't belong to the new one instead of leaving a
  // stale, now-hidden model silently still selected.
  function handleModeChange(next: PickerMode) {
    setPickerMode(next);
    setSelectedModels((prev) =>
      prev.filter((m) => (next === "image" ? m.supportsImageOutput : !m.supportsImageOutput)),
    );
  }

  function handleRun() {
    setPickerCollapsed(true);
    runComparison(prompt, selectedModels);
  }

  function toggleModel(model: OpenRouterModel) {
    setSelectedModels((prev) => {
      if (prev.some((m) => m.id === model.id)) {
        return prev.filter((m) => m.id !== model.id);
      }
      if (prev.length >= MAX_MODELS) return prev;
      return [...prev, model];
    });
  }

  const canRun =
    !!apiKey && prompt.trim().length > 0 && selectedModels.length > 0 && !isRunning;

  return (
    <section
      id="arena"
      className="mx-auto max-w-7xl border-t border-hairline px-5 py-10"
    >
      <p className="readout-label-green">ARENA</p>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Pick up to {MAX_MODELS} models, paste a prompt, and compare answers
        side by side.
      </p>

      <div
        className={`mt-6 grid items-stretch ${
          pickerCollapsed
            ? "gap-3 lg:grid-cols-[48px_1fr]"
            : "gap-6 lg:grid-cols-[minmax(0,320px)_1fr]"
        }`}
      >
        <ModelPicker
          selected={selectedModels}
          onToggle={toggleModel}
          maxModels={MAX_MODELS}
          collapsed={pickerCollapsed}
          onToggleCollapsed={() => setPickerCollapsed((c) => !c)}
          mode={pickerMode}
          onModeChange={handleModeChange}
        />

        <div className="flex h-full min-h-0 flex-col gap-4">
          <PromptInput
            value={prompt}
            onChange={setPrompt}
            onRun={handleRun}
            canRun={canRun}
            hasApiKey={!!apiKey}
            hasModels={selectedModels.length > 0}
            isRunning={isRunning}
          />
          <RunsHistory runs={runs} selectedModels={selectedModels} />
        </div>
      </div>

      <MetricsCharts runs={runs} />
    </section>
  );
}
