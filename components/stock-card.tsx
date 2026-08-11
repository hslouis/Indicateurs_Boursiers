import type { Quote } from '@/lib/market'
import { fmtPrice, fmtPercent, fmtSignedPct, fmtPlainPct } from '@/lib/format'
import { Sparkline } from './sparkline'
import { ScoreGauge } from './score-gauge'
import { AlertTriangle, Crosshair, ChevronDown } from 'lucide-react'

function Metric({ label, value, tone }: { label: string; value: string; tone?: 'bull' | 'bear' | 'neutral' | 'default' }) {
  const toneClass = tone === 'bull' ? 'text-bull' : tone === 'bear' ? 'text-bear' : tone === 'neutral' ? 'text-neutral' : 'text-card-foreground'
  return <div className="flex min-w-0 flex-col gap-0.5"><span className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span><span className={`font-mono text-xs font-semibold tabular-nums ${toneClass}`}>{value}</span></div>
}

function StrategyBadge({ strategy }: { strategy: string }) {
  const cls = strategy === 'ACHETER MAINTENANT' ? 'border-bull/40 bg-bull/10 text-bull' : strategy === 'ACHETER SUR REPLI' ? 'border-primary/40 bg-primary/10 text-primary' : strategy === 'SURVEILLER' ? 'border-neutral/40 bg-neutral/10 text-neutral' : strategy === 'ATTENDRE' ? 'border-warn/40 bg-warn/10 text-warn' : 'border-bear/40 bg-bear/10 text-bear'
  const icon = strategy === 'ACHETER MAINTENANT' ? '🟢' : strategy === 'ACHETER SUR REPLI' ? '🔵' : strategy === 'SURVEILLER' ? '🟡' : strategy === 'ATTENDRE' ? '🟠' : '🔴'
  return <span className={`inline-flex max-w-full rounded-md border px-2 py-1 text-[9px] font-bold tracking-wide ${cls}`}><span className="truncate">{icon} {strategy}</span></span>
}

export function StockCard({ q, compact = false }: { q: Quote; compact?: boolean }) {
  const up = (q.changePercent ?? 0) >= 0
  const a = q.analysis
  if (q.error || !a) return <div className="flex flex-col rounded-xl border bg-card p-4"><div className="flex items-center justify-between"><div><p className="text-sm font-semibold text-card-foreground">{q.name}</p><p className="font-mono text-xs text-muted-foreground">{q.symbol}</p></div></div><div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="h-4 w-4 shrink-0 text-neutral" />{q.error ?? 'Historique insuffisant pour l’analyse'}</div></div>
  const rsiTone = a.rsi == null ? 'default' : a.rsi < 30 ? 'bull' : a.rsi > 70 ? 'bear' : 'neutral'
  const range = a.support != null && a.resistance != null && a.resistance > a.support ? ((q.price! - a.support) / (a.resistance - a.support)) * 100 : null

  return <details className="group min-w-0 rounded-xl border bg-card shadow-sm" open={!compact}>
    <summary className="cursor-pointer list-none p-3 sm:p-4">
      {compact ? <>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2">
          <div className="min-w-0"><p className="whitespace-nowrap text-sm font-bold text-card-foreground">{q.symbol}</p><p className="truncate text-[10px] text-muted-foreground">{q.name}</p></div>
          <div className="text-right"><div className="font-mono text-base font-bold tabular-nums">{fmtPrice(q.price)}</div><div className={`font-mono text-[10px] font-semibold ${up ? 'text-bull' : 'text-bear'}`}>{fmtPercent(q.changePercent)}</div></div>
          <div className="shrink-0"><ScoreGauge score={a.score} level={a.level} size={48} /></div>
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </div>
        <div className="mt-2"><StrategyBadge strategy={a.strategy} /></div>
      </> : <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="whitespace-nowrap text-sm font-semibold text-card-foreground sm:text-base">{q.symbol}</p><StrategyBadge strategy={a.strategy} /></div><p className="mt-0.5 truncate text-[11px] text-muted-foreground">{q.name} · {q.currency}{q.holding ? ' · EN PORTEFEUILLE' : ' · WATCHLIST'}</p></div>
        <div className="shrink-0 text-right"><div className="font-mono text-lg font-bold tabular-nums">{fmtPrice(q.price)}</div><div className={`font-mono text-[11px] font-semibold ${up ? 'text-bull' : 'text-bear'}`}>{fmtPercent(q.changePercent)}</div></div>
        <div className="hidden shrink-0 sm:block"><ScoreGauge score={a.score} level={a.level} size={58} /></div>
        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
      </div>}
      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border pt-3"><Metric label="Potentiel" value={`${a.score}/100`} tone={a.score >= 70 ? 'bull' : a.score >= 50 ? 'neutral' : 'bear'} /><Metric label="RSI" value={a.rsi != null ? a.rsi.toFixed(0) : '—'} tone={rsiTone} /><Metric label="Momentum" value={fmtSignedPct(a.momentum)} tone={a.momentum == null ? 'default' : a.momentum >= 0 ? 'bull' : 'bear'} /></div>
    </summary>
    <div className="border-t border-border px-3 pb-4 pt-3 sm:px-5 sm:pb-5">
      {a.buyZoneLow != null && a.buyZoneHigh != null && <div className="rounded-lg border border-primary/20 bg-primary/5 p-3"><div className="flex items-center gap-2 text-xs font-semibold text-card-foreground"><Crosshair className="h-3.5 w-3.5 text-primary" /> Zone d'achat technique</div><div className="mt-1 flex items-baseline justify-between"><span className="font-mono text-sm font-bold text-primary">{fmtPrice(a.buyZoneLow)} — {fmtPrice(a.buyZoneHigh)}</span><span className="text-[10px] text-muted-foreground">support / MM50</span></div></div>}
      <div className="mt-3 h-10 w-full"><Sparkline data={q.spark} positive={up} height={40} /></div>
      <div className="mt-3 grid grid-cols-4 gap-3 border-t border-border pt-3"><Metric label="MACD" value={a.macdHist != null ? a.macdHist.toFixed(2) : '—'} tone={a.macdHist == null ? 'default' : a.macdHist >= 0 ? 'bull' : 'bear'} /><Metric label="Volatilité" value={fmtPlainPct(a.volatility)} /><Metric label="MM50" value={fmtPrice(a.sma50)} /><Metric label="Drawdown" value={fmtSignedPct(a.drawdown)} tone={a.drawdown != null && a.drawdown < -10 ? 'bear' : 'default'} /></div>
      {a.support != null && a.resistance != null && <div className="mt-3"><div className="flex justify-between text-[10px] text-muted-foreground"><span>Support {fmtPrice(a.support)}</span><span>Résistance {fmtPrice(a.resistance)}</span></div><div className="relative mt-1.5 h-1.5 w-full rounded-full bg-muted">{range != null && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card" style={{ left: `${Math.max(2, Math.min(98, range))}%` }} />}</div></div>}
      <ul className="mt-3 flex flex-col gap-1">{a.reasons.slice(0, 4).map((r, i) => <li key={i} className="text-[11px] leading-relaxed text-muted-foreground">• {r}</li>)}</ul>
    </div>
  </details>
}
