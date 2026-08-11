import type { SignalLevel } from '@/lib/indicators'

// Renvoie la teinte du score selon le niveau associé.
function scoreColor(level: SignalLevel): string {
  switch (level) {
    case 'ACHAT FORT':
    case 'ACHAT':
      return 'var(--color-bull)'
    case 'SURVEILLER':
      return 'var(--color-neutral)'
    case 'ATTENDRE':
      return 'var(--color-warn)'
    case 'VENTE':
      return 'var(--color-bear)'
  }
}

export function ScoreGauge({
  score,
  level,
  size = 96,
}: {
  score: number
  level: SignalLevel
  size?: number
}) {
  const stroke = size < 80 ? 6 : 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color = scoreColor(level)

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score technique ${score} sur 100`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-mono font-bold tabular-nums"
          style={{ color, fontSize: size < 80 ? '1.1rem' : '1.5rem' }}
        >
          {score}
        </span>
        <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
          / 100
        </span>
      </div>
    </div>
  )
}
