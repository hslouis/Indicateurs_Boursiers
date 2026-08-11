'use client'

import useSWR from 'swr'
import { useState } from 'react'
import type { Quote } from '@/lib/market'
import { IndexStrip } from './index-strip'
import { StockCard } from './stock-card'
import { Opportunities } from './opportunities'
import { fmtTime, marketStateLabel } from '@/lib/format'
import { RefreshCw, Activity } from 'lucide-react'

interface Payload { indices: Quote[]; stocks: Quote[]; etfs: Quote[]; updatedAt: number }
const fetcher = (url: string) => fetch(url).then((r) => r.json())
const REFRESH_OPEN_MS = 15_000
const REFRESH_CLOSED_MS = 60_000

// Classement dynamique : le score technique actuel sert de proxy au potentiel de gain à court/moyen terme.
// Ce score n'est pas une prévision garantie de rendement.
function rankByPotential(quotes: Quote[]): Quote[] {
  return [...quotes].sort((a, b) => (b.analysis?.score ?? -1) - (a.analysis?.score ?? -1))
}

export function Dashboard() {
  const [manualLoading, setManualLoading] = useState(false)
  const { data, error, isLoading, mutate } = useSWR<Payload>('/api/stocks', fetcher, {
    refreshInterval: (latest) => {
      const st = [...(latest?.stocks ?? []), ...(latest?.etfs ?? []), ...(latest?.indices ?? [])].find((s) => s.marketState && s.marketState !== 'UNKNOWN')?.marketState
      return st === 'REGULAR' ? REFRESH_OPEN_MS : REFRESH_CLOSED_MS
    },
    revalidateOnFocus: true,
    keepPreviousData: true,
  })

  const allAssets = [...(data?.stocks ?? []), ...(data?.etfs ?? []), ...(data?.indices ?? [])]
  const marketState = allAssets.find((s) => s.marketState && s.marketState !== 'UNKNOWN')?.marketState
  const isOpen = marketState === 'REGULAR'
  const refreshSec = (isOpen ? REFRESH_OPEN_MS : REFRESH_CLOSED_MS) / 1000

  async function handleRefresh() { setManualLoading(true); await mutate(); setManualLoading(false) }

  const stocks = rankByPotential(data?.stocks ?? [])
  const etfs = rankByPotential(data?.etfs ?? [])

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-10">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Indicateurs Boursiers</h1></div>
          <p className="mt-1 text-sm text-muted-foreground">Ton radar personnel · classement par potentiel de gain · signaux techniques</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5"><span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-bull animate-pulse-dot' : 'bg-muted-foreground'}`} /><span className="text-xs font-medium text-card-foreground">{marketState ? marketStateLabel(marketState) : 'Chargement…'}</span></div>
          <button onClick={handleRefresh} disabled={manualLoading} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${manualLoading ? 'animate-spin' : ''}`} /> Actualiser</button>
        </div>
      </header>

      {error && <div className="mt-6 rounded-lg border border-bear/40 bg-bear/10 px-4 py-3 text-sm text-bear">Impossible de charger les données de marché. Nouvelle tentative automatique en cours…</div>}

      {isLoading && !data ? <SkeletonState /> : data && (
        <>
          <section className="mt-6"><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Indices de référence</h2><IndexStrip indices={data.indices} /></section>

          <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
            <div>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">⭐ Actions — potentiel de gain</h2>
              <p className="mb-3 text-[11px] text-muted-foreground">Classées automatiquement du potentiel technique actuel le plus élevé au plus faible.</p>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{stocks.map((q) => <StockCard key={q.symbol} q={q} />)}</div>
              <h2 className="mb-3 mt-10 text-xs font-semibold uppercase tracking-widest text-muted-foreground">📊 FNB — potentiel de gain</h2>
              <p className="mb-3 text-[11px] text-muted-foreground">Même classement dynamique selon les signaux actuels.</p>
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">{etfs.map((q) => <StockCard key={q.symbol} q={q} />)}</div>
            </div>
            <div className="lg:sticky lg:top-6 lg:self-start"><Opportunities quotes={[...stocks, ...etfs]} /></div>
          </section>

          <section className="mt-8 rounded-lg border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Comment lire le classement</h3>
            <div className="mt-3 grid grid-cols-1 gap-x-8 gap-y-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-3">
              <p><span className="font-semibold text-bull">🟢 Acheter maintenant</span> — score élevé et configuration technique favorable.</p>
              <p><span className="font-semibold text-primary">🔵 Acheter sur repli</span> — bon potentiel, mais meilleure entrée dans la zone support/MM50.</p>
              <p><span className="font-semibold text-neutral">🟡 Surveiller</span> — potentiel intéressant mais confirmation nécessaire.</p>
              <p><span className="font-semibold text-warn">🟠 Attendre</span> — potentiel technique limité actuellement.</p>
              <p><span className="font-semibold text-bear">🔴 Éviter</span> — tendance/momentum défavorables.</p>
              <p className="text-muted-foreground/80 sm:col-span-2 lg:col-span-1">Le classement utilise le score technique actuel (tendance, MACD, momentum et RSI) comme indicateur de potentiel de gain. Ce n'est pas une cible de cours ni une garantie de rendement.</p>
            </div>
          </section>

          <footer className="mt-8 flex flex-col gap-1 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Actualisation automatique toutes les {refreshSec}s{isOpen ? ' (séance en cours)' : ' (hors séance)'}</span><span className="font-mono">Mis à jour à {fmtTime(data.updatedAt)}</span></footer>
        </>
      )}
    </main>
  )
}

function SkeletonState() { return <div className="mt-6 space-y-8"><div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{[0,1,2].map((i) => <div key={i} className="h-24 animate-pulse rounded-lg border bg-card" />)}</div><div className="grid grid-cols-1 gap-4 lg:grid-cols-2">{[0,1,2,3].map((i) => <div key={i} className="h-72 animate-pulse rounded-xl border bg-card" />)}</div></div> }
