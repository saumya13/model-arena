import { useCallback, useEffect, useRef, useState } from "react";
import {
  generateImage,
  streamChatCompletion,
  usesImagesEndpoint,
  type StreamCallbacks,
} from "@/lib/openrouter";
import { computeCost, costFromReported } from "@/lib/cost";
import type { ChatUsage, ComparisonRun, ModelRunResult, OpenRouterModel } from "@/lib/types";

let runCounter = 0;

export function useArenaRuns(apiKey: string | null) {
  const [runs, setRuns] = useState<ComparisonRun[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const isRunningRef = useRef(false);
  const controllersRef = useRef<AbortController[]>([]);

  // Abort any in-flight requests if the section unmounts mid-stream.
  useEffect(() => {
    return () => {
      controllersRef.current.forEach((controller) => controller.abort());
    };
  }, []);

  const runComparison = useCallback(
    (prompt: string, models: OpenRouterModel[]) => {
      if (!apiKey || models.length === 0 || !prompt.trim() || isRunningRef.current) return;

      isRunningRef.current = true;
      setIsRunning(true);

      const runId = `run-${++runCounter}`;
      const run: ComparisonRun = {
        id: runId,
        prompt,
        startedAt: Date.now(),
        results: models.map(
          (model): ModelRunResult => ({
            modelId: model.id,
            modelName: model.name,
            status: "connecting",
            content: "",
            images: [],
          }),
        ),
      };

      setRuns((prev) => [...prev, run]);

      function patchResult(modelId: string, updater: (result: ModelRunResult) => ModelRunResult) {
        setRuns((prev) =>
          prev.map((r) =>
            r.id !== runId
              ? r
              : {
                  ...r,
                  results: r.results.map((result) =>
                    result.modelId === modelId ? updater(result) : result,
                  ),
                },
          ),
        );
      }

      // All models in a run settle independently; once every one of them has
      // finished (done or errored), the run as a whole is no longer "running".
      let pending = models.length;
      function settle() {
        pending -= 1;
        if (pending === 0) {
          isRunningRef.current = false;
          setIsRunning(false);
        }
      }

      controllersRef.current = models.map((model) => {
        const controller = new AbortController();
        const startedAt = performance.now();
        let usage: ChatUsage | undefined;

        const callbacks: StreamCallbacks = {
          onToken: (text) => {
            patchResult(model.id, (result) => ({
              ...result,
              status: "streaming",
              content: result.content + text,
            }));
          },
          onImage: (url) => {
            patchResult(model.id, (result) => ({
              ...result,
              status: "streaming",
              images: [...result.images, url],
            }));
          },
          onUsage: (u) => {
            usage = u;
          },
          onError: (error) => {
            patchResult(model.id, (result) => ({ ...result, status: "error", error }));
            settle();
          },
          onDone: () => {
            const latencyMs = performance.now() - startedAt;
            // /images reports the billed amount itself; its per-token
            // prices in the catalog are 0, so computeCost would give $0.
            const cost = !usage
              ? undefined
              : usesImagesEndpoint(model) && usage.cost !== undefined
                ? costFromReported(usage.cost)
                : computeCost(usage, {
                  promptPrice: model.promptPrice,
                  completionPrice: model.completionPrice,
                });
            patchResult(model.id, (result) => ({
              ...result,
              status: "done",
              usage,
              cost,
              latencyMs,
            }));
            settle();
          },
        };

        if (usesImagesEndpoint(model)) {
          generateImage(model.id, prompt, apiKey, callbacks, controller.signal);
        } else {
          streamChatCompletion(
            model.id,
            prompt,
            apiKey,
            callbacks,
            controller.signal,
            model.supportsImageOutput,
          );
        }

        return controller;
      });
    },
    [apiKey],
  );

  return { runs, isRunning, runComparison };
}
