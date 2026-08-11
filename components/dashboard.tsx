'use client'

import useSWR from 'swr'
import { useState } from 'react'
import type { Quote } from '@/lib/market'
import { IndexStrip } from './index-strip'
import { StockCard } from './stock-card'
import { fmtTime, marketStateLabel } from '@/lib/format'
import { RefreshCw, Activity } from 'lucide-react'

interface Payload {
  indices: Quote[]
  stocks: Quote[]
  updatedAt: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const REFRESH_MS = 30_000

export function Dashboard() {
  const [manualLoading, setManualLoading] = useState(false)
  const { data, error, isLoading, mutate } = useSWR<Payload>(
    '/api/stocks',
    fetcher,
    {
      refreshInterval: REFRESH_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
    },
  )

  const marketState = [...(data?.stocks ?? []), ...(data?.indices ?? [])].find(
    (s) => s.marketState && s.marketState !== 'UNKNOWN',
  )?.marketState
  const isOpen = marketState === 'REGULAR'

  async function handleRefresh() {
    setManualLoading(true)
    await mutate()
    setManualLoading(false)
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Indicateurs Boursiers
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Surveillance en temps réel · signaux techniques d&apos;achat et de vente
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5">
            <span
              className={`h-2 w-2 rounded-full ${
                isOpen ? 'bg-bull animate-pulse-dot' : 'bg-muted-foreground'
              }`}
            />
            <span className="text-xs font-medium text-card-foreground">
              {marketState ? marketStateLabel(marketState) : 'Chargement…'}
            </span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={manualLoading}
            className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${manualLoading ? 'animate-spin' : ''}`}
            />
            Actualiser
          </button>
        </div>
      </header>

      {error && (
        <div className="mt-6 rounded-lg border border-bear/40 bg-bear/10 px-4 py-3 text-sm text-bear">
          Impossible de charger les données de marché. Nouvelle tentative
          automatique en cours…
        </div>
      )}

      {isLoading && !data ? (
        <SkeletonState />
      ) : (
        data && (
          <>
            <section className="mt-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Indices de référence
              </h2>
              <IndexStrip indices={data.indices} />
            </section>

            <section className="mt-8">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Titres surveillés
              </h2>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {data.stocks.map((q) => (
                  <StockCard key={q.symbol} q={q} />
                ))}
              </div>
            </section>

            <section className="mt-8 rounded-lg border bg-card p-4">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Comment lire les signaux
              </h3>
              <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2">
                <p>
                  <span className="font-semibold text-bull">Achat / Achat fort</span> —
                  RSI bas, tendance haussière (prix &gt; MM20 &gt; MM50) et MACD
                  positif convergent vers une opportunité d&apos;entrée.
                </p>
                <p>
                  <span className="font-semibold text-bear">Vente / Vente forte</span> —
                  RSI en surachat, tendance baissière et MACD négatif suggèrent
                  d&apos;alléger ou de sortir.
                </p>
                <p>
                  <span className="font-semibold text-neutral">Conserver</span> —
                  signaux mitigés, aucune action franche recommandée.
                </p>
                <p className="text-muted-foreground/80">
                  Données différées fournies par Yahoo Finance. À titre informatif
                  uniquement — ceci ne constitue pas un conseil financier.
                </p>
              </div>
            </section>

            <footer className="mt-8 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
              <span>
                Actualisation automatique toutes les {REFRESH_MS / 1000}s
              </span>
              <span className="font-mono">
                Mis à jour à {fmtTime(data.updatedAt)}
              </span>
            </footer>
          </>
        )
      )}
    </main>
  )
}

function SkeletonState() {
  return (
    <div className="mt-6 space-y-8">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg border bg-card" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl border bg-card" />
        ))}
      </div>
    </div>
  )
}
