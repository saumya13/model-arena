import { useState } from "react";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onRun: () => void;
  canRun: boolean;
  hasApiKey: boolean;
  hasModels: boolean;
  isRunning: boolean;
}

export function PromptInput({
  value,
  onChange,
  onRun,
  canRun,
  hasApiKey,
  hasModels,
  isRunning,
}: PromptInputProps) {
  const [buttonHovered, setButtonHovered] = useState(false);
  const blocked = !canRun && !isRunning;

  const hint = isRunning
    ? "Streaming responses…"
    : !hasApiKey
      ? "Add your OpenRouter API key above to run a comparison."
      : !hasModels
        ? "Select at least one model to run a comparison."
        : value.trim().length === 0
          ? "Enter a prompt to run."
          : "Ready to run.";

  // Faint gray made the reason the button is disabled easy to miss — tone
  // the hint by what it's telling the user (blocked vs. ready vs. running),
  // and call it out further if they hover the button while it's blocked.
  const hintTone = isRunning
    ? "text-signal"
    : blocked
      ? "text-critical"
      : "text-good";

  return (
    <div className="rounded-md border border-hairline bg-panel p-4">
      <label className="block">
        <span className="readout-label">PROMPT</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          placeholder="Ask something every model should be able to answer…"
          className="mt-1.5 w-full resize-y rounded border border-hairline bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal-tint"
        />
      </label>

      <div className="mt-3 flex items-center justify-between gap-3">
        <p
          className={`text-xs font-medium transition ${hintTone} ${
            blocked && buttonHovered ? "animate-nudge" : ""
          }`}
        >
          {hint}
        </p>
        <button
          type="button"
          onClick={onRun}
          disabled={!canRun}
          onMouseEnter={() => setButtonHovered(true)}
          onMouseLeave={() => setButtonHovered(false)}
          className="shrink-0 rounded bg-signal px-4 py-2 text-sm font-semibold text-white transition hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isRunning ? "Running…" : "Run comparison"}
        </button>
      </div>
    </div>
  );
}
