import type { Quote } from '@/lib/market'
import { SignalBadge } from './signal-badge'
import { fmtPrice, fmtPercent } from '@/lib/format'
import { Sparkles } from 'lucide-react'

const BUY_STRATEGIES = ['ACHETER MAINTENANT', 'ACHETER SUR REPLI']

export function Opportunities({ quotes }: { quotes: Quote[] }) {
  const ranked = quotes.filter((q) => q.analysis).sort((a, b) => (b.analysis!.score ?? 0) - (a.analysis!.score ?? 0))
  const opportunities = ranked.filter((q) => BUY_STRATEGIES.includes(q.analysis!.strategy))

  return <section className="rounded-xl border bg-card p-5">
    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold tracking-tight text-card-foreground">Opportunités personnalisées</h2></div>
    <p className="mt-1 text-xs text-muted-foreground">Classement des titres qui présentent actuellement la meilleure combinaison tendance + momentum + RSI + proximité d'une zone technique.</p>

    {opportunities.length === 0 ? <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">Aucune configuration d'achat convaincante actuellement.</div> : <ul className="mt-4 flex flex-col gap-2">{opportunities.slice(0, 8).map((q) => {
      const a = q.analysis!
      const up = (q.changePercent ?? 0) >= 0
      return <li key={q.symbol} className="rounded-lg border border-border bg-background/40 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bull/15 font-mono text-sm font-bold text-bull tabular-nums">{a.score}</div>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-card-foreground">{q.symbol} · {q.name}</p><p className="font-mono text-xs text-muted-foreground">{fmtPrice(q.price)} {q.currency} · <span className={up ? 'text-bull' : 'text-bear'}>{fmtPercent(q.changePercent)}</span></p></div>
          <SignalBadge level={a.level} size="sm" />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]"><span className={a.strategy === 'ACHETER MAINTENANT' ? 'font-bold text-bull' : 'font-bold text-primary'}>{a.strategy}</span><span className="text-muted-foreground">Zone {fmtPrice(a.buyZoneLow)} — {fmtPrice(a.buyZoneHigh)}</span></div>
      </li>
    })}</ul>}

    <div className="mt-4 border-t border-border pt-3"><p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">Classement complet</p><div className="flex flex-col gap-1.5">{ranked.map((q) => { const a = q.analysis!; return <div key={q.symbol} className="flex items-center gap-3 text-xs"><span className="w-16 shrink-0 truncate font-mono text-muted-foreground">{q.symbol}</span><div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${a.score}%`, backgroundColor: barColor(a.strategy) }} /></div><span className="w-8 shrink-0 text-right font-mono font-semibold tabular-nums text-card-foreground">{a.score}</span></div> })}</div></div>
  </section>
}

function barColor(strategy: string): string {
  switch (strategy) {
    case 'ACHETER MAINTENANT': return 'var(--color-bull)'
    case 'ACHETER SUR REPLI': return 'var(--color-primary)'
    case 'SURVEILLER': return 'var(--color-neutral)'
    case 'ATTENDRE': return 'var(--color-warn)'
    default: return 'var(--color-bear)'
  }
}
