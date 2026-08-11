import type { SignalLevel } from '@/lib/indicators'
import { TrendingUp, TrendingDown, Eye, Clock, ArrowUp } from 'lucide-react'

const CONFIG: Record<
  SignalLevel,
  { bg: string; fg: string; dot: string; icon: React.ReactNode }
> = {
  'ACHAT FORT': {
    bg: 'bg-bull',
    fg: 'text-bull-foreground',
    dot: '🟢',
    icon: <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  ACHAT: {
    bg: 'bg-bull/25 ring-1 ring-bull/40',
    fg: 'text-bull',
    dot: '🟢',
    icon: <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  SURVEILLER: {
    bg: 'bg-neutral/20 ring-1 ring-neutral/40',
    fg: 'text-neutral',
    dot: '🟡',
    icon: <Eye className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  ATTENDRE: {
    bg: 'bg-warn/20 ring-1 ring-warn/40',
    fg: 'text-warn',
    dot: '🟠',
    icon: <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  VENTE: {
    bg: 'bg-bear',
    fg: 'text-bear-foreground',
    dot: '🔴',
    icon: <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
}

export function SignalBadge({
  level,
  size = 'md',
}: {
  level: SignalLevel
  size?: 'sm' | 'md'
}) {
  const c = CONFIG[level]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-semibold uppercase tracking-wide ${c.bg} ${c.fg} ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span aria-hidden className="text-[0.85em] leading-none">
        {c.dot}
      </span>
      {c.icon}
      {level}
    </span>
  )
}
