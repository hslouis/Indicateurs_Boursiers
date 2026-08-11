import type { Quote } from '@/lib/market'
import { SignalBadge } from './signal-badge'
import { fmtPrice, fmtPercent } from '@/lib/format'
import { Sparkles } from 'lucide-react'

const BUY_LEVELS = ['ACHAT FORT', 'ACHAT']

export function Opportunities({ quotes }: { quotes: Quote[] }) {
  const ranked = quotes
    .filter((q) => q.analysis)
    .sort((a, b) => (b.analysis!.score ?? 0) - (a.analysis!.score ?? 0))

  const opportunities = ranked.filter((q) =>
    BUY_LEVELS.includes(q.analysis!.level),
  )

  return (
    <section className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold tracking-tight text-card-foreground">
          Opportunités maintenant
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Titres dont plusieurs indicateurs convergent vers un signal d&apos;achat,
        classés par score technique.
      </p>

      {opportunities.length === 0 ? (
        <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune convergence d&apos;achat détectée actuellement. Les titres les
          mieux notés restent en surveillance.
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {opportunities.map((q) => {
            const a = q.analysis!
            const up = (q.changePercent ?? 0) >= 0
            return (
              <li
                key={q.symbol}
                className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bull/15 font-mono text-sm font-bold text-bull tabular-nums">
                  {a.score}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-card-foreground">
                    {q.name}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {q.symbol} · {fmtPrice(q.price)} {q.currency}
                  </p>
                </div>
                <span
                  className={`hidden font-mono text-xs font-semibold tabular-nums sm:inline ${
                    up ? 'text-bull' : 'text-bear'
                  }`}
                >
                  {fmtPercent(q.changePercent)}
                </span>
                <SignalBadge level={a.level} size="sm" />
              </li>
            )
          })}
        </ul>
      )}

      {/* Aperçu du classement complet */}
      <div className="mt-4 border-t border-border pt-3">
        <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          Classement complet
        </p>
        <div className="flex flex-col gap-1.5">
          {ranked.map((q) => {
            const a = q.analysis!
            return (
              <div key={q.symbol} className="flex items-center gap-3 text-xs">
                <span className="w-16 shrink-0 truncate font-mono text-muted-foreground">
                  {q.symbol}
                </span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{
                      width: `${a.score}%`,
                      backgroundColor: barColor(a.level),
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right font-mono font-semibold tabular-nums text-card-foreground">
                  {a.score}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function barColor(level: string): string {
  switch (level) {
    case 'ACHAT FORT':
    case 'ACHAT':
      return 'var(--color-bull)'
    case 'SURVEILLER':
      return 'var(--color-neutral)'
    case 'ATTENDRE':
      return 'var(--color-warn)'
    default:
      return 'var(--color-bear)'
  }
}
