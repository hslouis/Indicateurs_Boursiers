import type { Quote } from './market'

/** Single source of truth for the dashboard's 12-month technical potential score. */
export function potential12m(q: Quote): number {
  const a = q.analysis
  if (!a) return -1
  const momentum = a.momentum ?? 0
  const drawdown = a.drawdown ?? 0
  const room = a.resistance && q.price ? Math.max(0, ((a.resistance / q.price) - 1) * 100) : 0

  return Math.max(0, Math.min(100, Math.round(
    a.score * 0.65 +
    Math.min(100, Math.max(0, momentum * 3 + 50)) * 0.2 +
    Math.min(100, room * 5) * 0.15 +
    Math.min(10, Math.max(0, -drawdown))
  )))
}
