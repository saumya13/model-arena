import { useApiKeyStore } from "@/store/useApiKeyStore";

function maskKey(key: string) {
  if (key.length <= 8) return "••••••••";
  return `${key.slice(0, 7)}···${key.slice(-4)}`;
}

interface ApiKeyBadgeProps {
  onClick: () => void;
}

export function ApiKeyBadge({ onClick }: ApiKeyBadgeProps) {
  const apiKey = useApiKeyStore((s) => s.apiKey);

  if (!apiKey) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="rounded border border-signal bg-signal px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-signal-strong"
      >
        Add API key
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded border border-hairline bg-panel px-3 py-1.5 font-mono text-xs text-ink-soft transition hover:border-signal hover:text-ink"
      title="Change OpenRouter API key"
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-signal" />
      KEY: {maskKey(apiKey)}
    </button>
  );
}
