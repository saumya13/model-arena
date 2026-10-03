import { readSseStream } from "@/lib/sse";
import type { ChatChunk, OpenRouterModel, StreamError } from "@/lib/types";

const API_BASE = "https://openrouter.ai/api/v1";

// Pinned to the front of the model picker — otherwise the raw 300+ entry
// catalog buries the models most visitors will actually want to compare.
const PINNED_MODEL_PREFIXES = [
  "openai/gpt-5",
  "openai/gpt-4o",
  "anthropic/claude",
  "google/gemini",
  "meta-llama/llama-4",
  "meta-llama/llama-3.3",
  "mistralai/mistral",
  "deepseek/deepseek",
];

interface RawModel {
  id: string;
  name: string;
  context_length: number;
  description?: string;
  pricing: {
    prompt: string;
    completion: string;
  };
  architecture?: {
    output_modalities?: string[];
  };
}

function pinnedRank(id: string): number {
  const index = PINNED_MODEL_PREFIXES.findIndex((prefix) =>
    id.startsWith(prefix),
  );
  return index === -1 ? PINNED_MODEL_PREFIXES.length : index;
}

// Image-capable models get top billing regardless of provider — otherwise
// they're scattered alphabetically inside their provider's pinned bucket
// (e.g. behind 50+ other gpt-5 text variants) and are effectively invisible.
function rank(model: OpenRouterModel): number {
  return model.supportsImageOutput ? -1 : pinnedRank(model.id);
}

export async function fetchModels(): Promise<OpenRouterModel[]> {
  const res = await fetch(`${API_BASE}/models`);
  if (!res.ok) {
    throw new Error(`Failed to load model catalog (${res.status})`);
  }

  const body = (await res.json()) as { data: RawModel[] };

  return (
    body.data
      // A handful of "auto router" models (e.g. openrouter/auto) report -1
      // pricing since the actual routed model varies per request — they can't
      // be cost-compared like a fixed model, so they're excluded here.
      .filter(
        (m) =>
          Number(m.pricing?.prompt) >= 0 && Number(m.pricing?.completion) >= 0,
      )
      .map((m): OpenRouterModel => {
        const outputModalities = m.architecture?.output_modalities ?? ["text"];
        return {
          id: m.id,
          name: m.name,
          contextLength: m.context_length,
          promptPrice: Number(m.pricing?.prompt ?? 0),
          completionPrice: Number(m.pricing?.completion ?? 0),
          description: m.description,
          supportsImageOutput: outputModalities.includes("image"),
          outputModalities,
        };
      })
      .sort((a, b) => {
        const rankDiff = rank(a) - rank(b);
        if (rankDiff !== 0) return rankDiff;
        return a.name.localeCompare(b.name);
      })
  );
}

interface StreamCallbacks {
  onToken: (text: string) => void;
  onImage: (url: string) => void;
  onUsage: (usage: ChatChunk["usage"]) => void;
  onError: (error: StreamError) => void;
  onDone: () => void;
}

function classifyHttpError(status: number): StreamError {
  if (status === 401 || status === 403) {
    return { kind: "invalid-key", message: "Invalid or unauthorized API key." };
  }
  if (status === 429) {
    return {
      kind: "rate-limited",
      message: "Rate limited by OpenRouter — try again shortly.",
    };
  }
  if (status === 404 || status === 400) {
    return {
      kind: "model-unavailable",
      message: "This model is unavailable right now.",
    };
  }
  return { kind: "unknown", message: `Request failed (${status}).` };
}

export async function streamChatCompletion(
  modelId: string,
  prompt: string,
  apiKey: string,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
  supportsImageOutput: boolean,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "Model Arena",
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: "user", content: prompt }],
        stream: true,
        usage: { include: true },
        // Only image-capable models get this — OpenRouter 404s a text-only
        // model's endpoints when asked for an output modality it can't serve.
        ...(supportsImageOutput ? { modalities: ["image", "text"] } : {}),
      }),
    });
  } catch {
    if (signal.aborted) return;
    callbacks.onError({
      kind: "network",
      message: "Network error reaching OpenRouter.",
    });
    return;
  }

  if (!res.ok || !res.body) {
    const errorBody = await res.text().catch(() => "<unreadable body>");
    console.error(`OpenRouter request failed (${res.status} ${res.statusText}): ${errorBody}`);
    callbacks.onError(classifyHttpError(res.status));
    return;
  }

  try {
    for await (const payload of readSseStream(res.body)) {
      let chunk: ChatChunk;
      try {
        chunk = JSON.parse(payload);
      } catch {
        continue;
      }

      const delta = chunk.choices?.[0]?.delta;
      if (delta?.content) callbacks.onToken(delta.content);
      for (const image of delta?.images ?? []) {
        if (image.image_url?.url) callbacks.onImage(image.image_url.url);
      }

      if (chunk.usage) callbacks.onUsage(chunk.usage);
    }
    callbacks.onDone();
  } catch {
    if (signal.aborted) return;
    callbacks.onError({
      kind: "network",
      message: "Connection interrupted while streaming.",
    });
  }
}
