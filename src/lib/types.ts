export interface OpenRouterModel {
  id: string
  name: string
  contextLength: number
  promptPrice: number
  completionPrice: number
  description?: string
  supportsImageOutput: boolean
  outputModalities: string[]
}

export interface ChatUsage {
  prompt_tokens: number
  completion_tokens: number
  total_tokens: number
}

export interface ChatImage {
  type: string
  image_url: { url: string }
}

export interface ChatChunk {
  choices?: Array<{
    delta?: { content?: string; images?: ChatImage[] }
    finish_reason?: string | null
  }>
  usage?: ChatUsage
}

export type StreamStatus = 'idle' | 'connecting' | 'streaming' | 'done' | 'error'

export type StreamErrorKind = 'invalid-key' | 'rate-limited' | 'model-unavailable' | 'network' | 'unknown'

export interface StreamError {
  kind: StreamErrorKind
  message: string
}

export interface CostBreakdown {
  promptCost: number
  completionCost: number
  totalCost: number
}

export interface ModelRunResult {
  modelId: string
  modelName: string
  status: StreamStatus
  content: string
  images: string[]
  usage?: ChatUsage
  cost?: CostBreakdown
  /** Wall-clock time from request start to the full result finishing — not time-to-first-token. */
  latencyMs?: number
  error?: StreamError
}

export interface ComparisonRun {
  id: string
  prompt: string
  startedAt: number
  results: ModelRunResult[]
}
