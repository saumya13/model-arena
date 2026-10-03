import type { ChatUsage, CostBreakdown } from '@/lib/types'

/**
 * OpenRouter's `/models` pricing fields are USD cost per single token
 * (as decimal strings, e.g. "0.0000025"), not per 1K/1M tokens.
 */
export function computeCost(
  usage: Pick<ChatUsage, 'prompt_tokens' | 'completion_tokens'>,
  pricing: { promptPrice: number; completionPrice: number },
): CostBreakdown {
  const promptPrice = Number.isFinite(pricing.promptPrice) ? pricing.promptPrice : 0
  const completionPrice = Number.isFinite(pricing.completionPrice) ? pricing.completionPrice : 0

  const promptCost = usage.prompt_tokens * promptPrice
  const completionCost = usage.completion_tokens * completionPrice

  return {
    promptCost,
    completionCost,
    totalCost: promptCost + completionCost,
  }
}
