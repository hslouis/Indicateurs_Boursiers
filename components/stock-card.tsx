import type { Quote } from '@/lib/market'
import {
  fmtPrice,
  fmtPercent,
  fmtChange,
  fmtSignedPct,
  fmtPlainPct,
} from '@/lib/format'
import { Sparkline } from './sparkline'
import { SignalBadge } from './signal-badge'
import { ScoreGauge } from './score-gauge'
import { AlertTriangle } from 'lucide-react'

function Metric({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'bull' | 'bear' | 'neutral' | 'default'
}) {
  const toneClass =
    tone === 'bull'
      ? 'text-bull'
      : tone === 'bear'
        ? 'text-bear'
        : tone === 'neutral'
          ? 'text-neutral'
          : 'text-card-foreground'
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={`font-mono text-sm font-semibold tabular-nums ${toneClass}`}>
        {value}
      </span>
    </div>
  )
}

export function StockCard({ q }: { q: Quote }) {
  const up = (q.changePercent ?? 0) >= 0
  const a = q.analysis

  if (q.error || !a) {
    return (
      <div className="flex flex-col rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-card-foreground">{q.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{q.symbol}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="h-4 w-4 text-neutral" />
          {q.error ?? "Historique insuffisant pour l'analyse"}
        </div>
      </div>
    )
  }

  const rsiTone =
    a.rsi == null
      ? 'default'
      : a.rsi < 30
        ? 'bull'
        : a.rsi > 70
          ? 'bear'
          : 'neutral'

  // Position du prix dans le canal support / résistance (0 = support, 100 = résistance)
  const range =
    a.support != null && a.resistance != null && a.resistance > a.support
      ? ((q.price! - a.support) / (a.resistance - a.support)) * 100
      : null

  return (
    <div className="flex flex-col rounded-xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-card-foreground">
            {q.name}
          </p>
          <p className="font-mono text-xs text-muted-foreground">
            {q.symbol} · {q.currency}
          </p>
        </div>
        <SignalBadge level={a.level} />
      </div>

      <div className="mt-4 flex items-center justify-between gap-4">
        <div>
          <span className="font-mono text-3xl font-bold tabular-nums">
            {fmtPrice(q.price)}
          </span>
          <div
            className={`mt-1 font-mono text-sm font-semibold tabular-nums ${
              up ? 'text-bull' : 'text-bear'
            }`}
          >
            {fmtChange(q.change)} ({fmtPercent(q.changePercent)})
          </div>
        </div>
        <ScoreGauge score={a.score} level={a.level} size={84} />
      </div>

      <div className="mt-4 h-12 w-full">
        <Sparkline data={q.spark} positive={up} height={48} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-3 border-t border-border pt-4">
        <Metric
          label="RSI 14"
          value={a.rsi != null ? a.rsi.toFixed(0) : '—'}
          tone={rsiTone}
        />
        <Metric
          label="MACD"
          value={a.macdHist != null ? a.macdHist.toFixed(2) : '—'}
          tone={a.macdHist == null ? 'default' : a.macdHist >= 0 ? 'bull' : 'bear'}
        />
        <Metric
          label="Momentum"
          value={fmtSignedPct(a.momentum)}
          tone={
            a.momentum == null ? 'default' : a.momentum >= 0 ? 'bull' : 'bear'
          }
        />
        <Metric
          label="Volatilité"
          value={fmtPlainPct(a.volatility)}
          tone="default"
        />
      </div>

      <div className="mt-3 grid grid-cols-4 gap-3">
        <Metric label="MM20" value={fmtPrice(a.sma20)} />
        <Metric label="MM50" value={fmtPrice(a.sma50)} />
        <Metric label="MM200" value={fmtPrice(a.sma200)} />
        <Metric
          label="Drawdown"
          value={fmtSignedPct(a.drawdown)}
          tone={a.drawdown != null && a.drawdown < -10 ? 'bear' : 'default'}
        />
      </div>

      {/* Support / résistance */}
      {a.support != null && a.resistance != null && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] uppercase tracking-wide text-muted-foreground">
            <span>Support {fmtPrice(a.support)}</span>
            <span>Résistance {fmtPrice(a.resistance)}</span>
          </div>
          <div className="relative mt-1.5 h-1.5 w-full rounded-full bg-muted">
            {range != null && (
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary ring-2 ring-card"
                style={{ left: `${Math.max(2, Math.min(98, range))}%` }}
              />
            )}
          </div>
        </div>
      )}

      <ul className="mt-4 flex flex-col gap-1.5">
        {a.reasons.slice(0, 5).map((r, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground"
          >
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
            {r}
          </li>
        ))}
      </ul>
    </div>
  )
}
