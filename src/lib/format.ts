export function formatMs(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

export function formatTokens(count: number): string {
  return count.toLocaleString('en-US')
}

/**
 * Single-prompt costs typically land in the $0.0001–$0.05 range, where a
 * flat 2-decimal format would show "$0.00" for almost every run. Uses more
 * decimals for sub-cent values so the number stays meaningful.
 */
export function formatUsd(amount: number): string {
  if (amount === 0) return '$0.00'
  if (amount < 0.01) return `$${amount.toFixed(6)}`
  if (amount < 1) return `$${amount.toFixed(4)}`
  return `$${amount.toFixed(2)}`
}

export function truncateModelName(name: string, maxLength = 28): string {
  if (name.length <= maxLength) return name
  return `${name.slice(0, maxLength - 1)}…`
}
