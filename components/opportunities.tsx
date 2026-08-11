import type { Quote } from '@/lib/market'
import { SignalBadge } from './signal-badge'
import { fmtPrice, fmtPercent } from '@/lib/format'
import { Sparkles, TrendingUp, Target } from 'lucide-react'

const BUY_STRATEGIES = ['ACHETER MAINTENANT', 'ACHETER SUR REPLI']

function potential(q: Quote) {
  const a = q.analysis!
  const momentum = a.momentum ?? 0
  const drawdown = a.drawdown ?? 0
  const room = a.resistance && q.price ? Math.max(0, ((a.resistance / q.price) - 1) * 100) : 0
  return Math.max(0, Math.min(100, Math.round(a.score * 0.65 + Math.min(100, Math.max(0, momentum * 3 + 50)) * 0.2 + Math.min(100, room * 5) * 0.15 + Math.min(10, Math.max(0, -drawdown)))))
}

export function Opportunities({ quotes }: { quotes: Quote[] }) {
  const ranked = quotes.filter((q) => q.analysis).sort((a, b) => potential(b) - potential(a))
  const opportunities = ranked.filter((q) => BUY_STRATEGIES.includes(q.analysis!.strategy))

  return <section className="rounded-xl border bg-card p-5 shadow-sm">
    <div className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /><h2 className="text-sm font-semibold tracking-tight text-card-foreground">🔥 Radar d'achat</h2></div>
    <p className="mt-1 text-xs text-muted-foreground">Potentiel technique + momentum + marge jusqu'à la résistance. Ce n'est pas une prévision de rendement.</p>

    <div className="mt-4 grid grid-cols-1 gap-2">{ranked.slice(0, 5).map((q, i) => {
      const a = q.analysis!
      const p = potential(q)
      return <div key={q.symbol} className="rounded-lg border border-border bg-background/50 px-3 py-2.5">
        <div className="flex items-center gap-3">
          <span className="w-5 font-mono text-sm font-bold text-muted-foreground">#{i + 1}</span>
          <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-card-foreground">{q.symbol}</p><p className="text-[10px] text-muted-foreground">{fmtPrice(q.price)} {q.currency}</p></div>
          <div className="text-right"><div className="font-mono text-lg font-bold text-primary">{p}</div><div className="text-[9px] uppercase text-muted-foreground">potentiel</div></div>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2"><SignalBadge level={a.level} size="sm" /><span className="text-[10px] font-bold text-card-foreground">{a.strategy}</span></div>
      </div>
    })}</div>

    <div className="mt-5 border-t border-border pt-4"><p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">Classement complet</p><div className="flex flex-col gap-2">{ranked.map((q, i) => { const a = q.analysis!; const p = potential(q); return <div key={q.symbol} className="flex items-center gap-2 text-xs"><span className="w-5 font-mono text-muted-foreground">{i + 1}</span><span className="w-14 shrink-0 truncate font-mono font-semibold">{q.symbol}</span><div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted"><span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${p}%` }} /></div><span className="w-7 text-right font-mono font-semibold tabular-nums">{p}</span></div> })}</div></div>

    {opportunities.length === 0 && <div className="mt-4 rounded-lg border border-dashed border-border px-4 py-4 text-center text-xs text-muted-foreground">Aucune configuration d'achat convaincante actuellement.</div>}
    <div className="mt-4 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground"><div className="rounded-md bg-muted/40 p-2"><TrendingUp className="mb-1 h-3.5 w-3.5 text-primary" />Potentiel = force + momentum + espace technique</div><div className="rounded-md bg-muted/40 p-2"><Target className="mb-1 h-3.5 w-3.5 text-primary" />Timing = signal + proximité zone d'achat</div></div>
  </section>
}
