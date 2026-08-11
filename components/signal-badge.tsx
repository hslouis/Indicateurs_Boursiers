import type { SignalLevel } from '@/lib/indicators'
import { TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown } from 'lucide-react'

const CONFIG: Record<
  SignalLevel,
  { bg: string; fg: string; icon: React.ReactNode }
> = {
  'ACHAT FORT': {
    bg: 'bg-bull',
    fg: 'text-bull-foreground',
    icon: <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  ACHAT: {
    bg: 'bg-bull/25 ring-1 ring-bull/40',
    fg: 'text-bull',
    icon: <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  CONSERVER: {
    bg: 'bg-neutral/20 ring-1 ring-neutral/40',
    fg: 'text-neutral',
    icon: <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  VENTE: {
    bg: 'bg-bear/25 ring-1 ring-bear/40',
    fg: 'text-bear',
    icon: <TrendingDown className="h-3.5 w-3.5" strokeWidth={2.5} />,
  },
  'VENTE FORTE': {
    bg: 'bg-bear',
    fg: 'text-bear-foreground',
    icon: <ArrowDown className="h-3.5 w-3.5" strokeWidth={2.5} />,
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
      {c.icon}
      {level}
    </span>
  )
}
