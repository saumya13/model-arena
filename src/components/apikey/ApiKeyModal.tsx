import { useState } from "react";
import { createPortal } from "react-dom";
import { useApiKeyStore } from "@/store/useApiKeyStore";

interface ApiKeyModalProps {
  onClose: () => void;
}

export function ApiKeyModal({ onClose }: ApiKeyModalProps) {
  const apiKey = useApiKeyStore((s) => s.apiKey);
  const setApiKey = useApiKeyStore((s) => s.setApiKey);
  const clearApiKey = useApiKeyStore((s) => s.clearApiKey);
  const [draft, setDraft] = useState(apiKey ?? "");

  function handleSave() {
    if (!draft.trim()) return;
    setApiKey(draft);
    onClose();
  }

  // Portalled to <body> so this "fixed" overlay positions against the real
  // viewport — a backdrop-blur'd ancestor (the sticky header) would otherwise
  // create its own containing block and collapse the overlay to the
  // header's height instead of the full screen.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="api-key-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[calc(100vh-3rem)] w-full max-w-md overflow-y-auto rounded-md border border-hairline bg-panel p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="readout-label">API_KEY</p>
        <h2
          id="api-key-modal-title"
          className="mt-1 font-display text-lg font-semibold text-ink"
        >
          Connect your OpenRouter key
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Stored only in this browser&apos;s{" "}
          <code className="font-mono text-[0.85em]">localStorage</code>. It is
          sent directly to{" "}
          <code className="font-mono text-[0.85em]">openrouter.ai</code> and
          nowhere else — there is no server in this app that could see it.
        </p>

        <label className="mt-5 block">
          <span className="readout-label">KEY</span>
          <input
            autoFocus
            type="password"
            inputMode="text"
            spellCheck={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="sk-or-v1-..."
            className="mt-1.5 w-full rounded border border-hairline bg-paper px-3 py-2 font-mono text-sm text-ink outline-none focus:border-signal focus:ring-2 focus:ring-signal-tint"
          />
        </label>

        <div className="mt-5 flex items-center justify-between gap-3">
          {apiKey ? (
            <button
              type="button"
              onClick={() => {
                clearApiKey();
                setDraft("");
                onClose();
              }}
              className="text-sm font-medium text-critical hover:underline"
            >
              Remove key
            </button>
          ) : (
            <a
              href="https://openrouter.ai/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-secondary hover:underline"
            >
              Get a key →
            </a>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-3 py-2 text-sm font-medium text-ink-soft hover:bg-raised"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!draft.trim()}
              className="rounded bg-signal px-4 py-2 text-sm font-semibold text-white hover:bg-signal-strong disabled:cursor-not-allowed disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
