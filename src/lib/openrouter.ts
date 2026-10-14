import { readSseStream } from "@/lib/sse";
import type { ChatChunk, ChatUsage, OpenRouterModel, StreamError } from "@/lib/types";

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

// Same idea for the image tab: the three providers most visitors reach for
// come first, ahead of the long tail of image-only models.
const PINNED_IMAGE_MODEL_PREFIXES = ["google/gemini", "openai/", "deepseek/"];

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

function pinnedImageRank(id: string): number {
  const index = PINNED_IMAGE_MODEL_PREFIXES.findIndex((prefix) =>
    id.startsWith(prefix),
  );
  return index === -1 ? PINNED_IMAGE_MODEL_PREFIXES.length : index;
}

// Image-capable models get top billing regardless of provider — otherwise
// they're scattered alphabetically inside their provider's pinned bucket
// (e.g. behind 50+ other gpt-5 text variants) and are effectively invisible.
// Negative ranks keep them ahead of text models; within them, pinned
// providers sort first.
function rank(model: OpenRouterModel): number {
  return model.supportsImageOutput
    ? pinnedImageRank(model.id) - (PINNED_IMAGE_MODEL_PREFIXES.length + 1)
    : pinnedRank(model.id);
}

async function fetchCatalog(query = ""): Promise<RawModel[]> {
  const res = await fetch(`${API_BASE}/models${query}`);
  if (!res.ok) {
    throw new Error(`Failed to load model catalog (${res.status})`);
  }
  return ((await res.json()) as { data: RawModel[] }).data;
}

export async function fetchModels(): Promise<OpenRouterModel[]> {
  // The default catalog only lists models that output text, so image-only
  // models (Flux, Seedream, Recraft, Qwen…) need their own request.
  const [textModels, imageModels] = await Promise.all([
    fetchCatalog(),
    fetchCatalog("?output_modalities=image"),
  ]);

  const byId = new Map<string, RawModel>();
  for (const m of [...textModels, ...imageModels]) byId.set(m.id, m);

  return (
    [...byId.values()]
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

// Every image in a comparison should come out the same shape, otherwise
// side-by-side cards aren't comparable. Models don't reliably honor size
// wording alone, so the same ratio is also sent as a request parameter.
const IMAGE_ASPECT_RATIO = "1:1";
const IMAGE_DIMENSIONS_INSTRUCTION =
  "Output a square image, exactly 1024x1024 pixels (1:1 aspect ratio).";

function withImageDimensions(prompt: string): string {
  return `${prompt.trim()}\n\n${IMAGE_DIMENSIONS_INSTRUCTION}`;
}

/**
 * Image-only models (Flux, Seedream, Recraft, Qwen…) are rejected by
 * /chat/completions with a 404 and must use /images instead.
 */
export function usesImagesEndpoint(model: Pick<OpenRouterModel, "outputModalities">): boolean {
  return (
    model.outputModalities.includes("image") &&
    !model.outputModalities.includes("text")
  );
}

export interface StreamCallbacks {
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
        messages: [
          {
            role: "user",
            content: supportsImageOutput ? withImageDimensions(prompt) : prompt,
          },
        ],
        stream: true,
        usage: { include: true },
        // Only image-capable models get this — OpenRouter 404s a text-only
        // model's endpoints when asked for an output modality it can't serve.
        // Only models that also output text (Gemini, GPT-5 image) get here —
        // image-only models are served by generateImage() via /images.
        ...(supportsImageOutput
          ? {
              modalities: ["image", "text"],
              image_config: { aspect_ratio: IMAGE_ASPECT_RATIO },
            }
          : {}),
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

interface ImagesResponse {
  data?: Array<{ b64_json?: string; media_type?: string }>;
  usage?: ChatUsage;
}

/**
 * Non-streaming counterpart of streamChatCompletion for /images — it reports
 * through the same callbacks so callers can treat both the same way.
 */
export async function generateImage(
  modelId: string,
  prompt: string,
  apiKey: string,
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/images`, {
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
        prompt: withImageDimensions(prompt),
        aspect_ratio: IMAGE_ASPECT_RATIO,
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

  if (!res.ok) {
    const errorBody = await res.text().catch(() => "<unreadable body>");
    console.error(`OpenRouter image request failed (${res.status} ${res.statusText}): ${errorBody}`);
    callbacks.onError(classifyHttpError(res.status));
    return;
  }

  try {
    const body = (await res.json()) as ImagesResponse;
    for (const image of body.data ?? []) {
      if (image.b64_json) {
        callbacks.onImage(
          `data:${image.media_type ?? "image/png"};base64,${image.b64_json}`,
        );
      }
    }
    if (body.usage) callbacks.onUsage(body.usage);
    callbacks.onDone();
  } catch {
    if (signal.aborted) return;
    callbacks.onError({
      kind: "network",
      message: "Could not read the image response.",
    });
  }
}
