'use client'

import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'
import type { SparkPoint } from '@/lib/market'

export function Sparkline({
  data,
  positive,
  height = 56,
}: {
  data: SparkPoint[]
  positive: boolean
  height?: number
}) {
  if (!data.length) return <div style={{ height }} />
  const color = positive ? 'var(--color-bull)' : 'var(--color-bear)'
  const id = `spark-${positive ? 'up' : 'down'}`
  const values = data.map((d) => d.c)
  const min = Math.min(...values)
  const max = Math.max(...values)

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <YAxis hide domain={[min, max]} />
          <Area
            type="monotone"
            dataKey="c"
            stroke={color}
            strokeWidth={1.75}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
