import { describe, expect, it } from 'vitest'
import { computeCost } from '@/lib/cost'

describe('computeCost', () => {
  it('multiplies raw per-token USD rates by token counts', () => {
    const result = computeCost(
      { prompt_tokens: 1000, completion_tokens: 500 },
      { promptPrice: 0.0000025, completionPrice: 0.00001 },
    )
    expect(result.promptCost).toBeCloseTo(0.0025, 10)
    expect(result.completionCost).toBeCloseTo(0.005, 10)
    expect(result.totalCost).toBeCloseTo(0.0075, 10)
  })

  it('treats missing/non-finite pricing as free rather than throwing', () => {
    const result = computeCost(
      { prompt_tokens: 100, completion_tokens: 50 },
      { promptPrice: Number.NaN, completionPrice: 0 },
    )
    expect(result).toEqual({ promptCost: 0, completionCost: 0, totalCost: 0 })
  })
})
