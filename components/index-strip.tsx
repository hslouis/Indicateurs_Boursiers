import type { Quote } from '@/lib/market'
import { fmtPrice, fmtPercent } from '@/lib/format'
import { Sparkline } from './sparkline'

export function IndexStrip({ indices }: { indices: Quote[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {indices.map((q) => {
        const up = (q.changePercent ?? 0) >= 0
        return (
          <div
            key={q.symbol}
            className="rounded-lg border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-card-foreground">
                  {q.name}
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {q.symbol}
                </p>
              </div>
              <div className="h-8 w-20 shrink-0">
                <Sparkline data={q.spark} positive={up} height={32} />
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono text-lg font-semibold tabular-nums">
                {fmtPrice(q.price)}
              </span>
              <span
                className={`font-mono text-sm font-semibold tabular-nums ${
                  up ? 'text-bull' : 'text-bear'
                }`}
              >
                {fmtPercent(q.changePercent)}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
