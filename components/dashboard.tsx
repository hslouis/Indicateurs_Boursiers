'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import type { Quote } from '@/lib/market'
import { potential12m } from '@/lib/scoring'
import { IndexStrip } from './index-strip'
import { StockCard } from './stock-card'
import { Opportunities } from './opportunities'
import { fmtTime, marketStateLabel } from '@/lib/format'
import { RefreshCw, Activity, Flame, Star, BarChart3, LineChart } from 'lucide-react'

interface Payload { indices: Quote[]; stocks: Quote[]; etfs: Quote[]; updatedAt: number }
const fetcher = (url: string) => fetch(url).then((r) => r.json())
const REFRESH_OPEN_MS = 15_000
const REFRESH_CLOSED_MS = 60_000
type Tab = 'radar' | 'stocks' | 'etfs' | 'indices'
type Sort = 'potential' | 'score' | 'momentum' | 'rsi' | 'drawdown' | 'name'

function sortQuotes(quotes: Quote[], sort: Sort) {
  return [...quotes].sort((a, b) => {
    if (sort === 'potential') return potential12m(b) - potential12m(a)
    if (sort === 'score') return (b.analysis?.score ?? -1) - (a.analysis?.score ?? -1)
    if (sort === 'momentum') return (b.analysis?.momentum ?? -Infinity) - (a.analysis?.momentum ?? -Infinity)
    if (sort === 'rsi') return (a.analysis?.rsi ?? 999) - (b.analysis?.rsi ?? 999)
    if (sort === 'drawdown') return (a.analysis?.drawdown ?? 0) - (b.analysis?.drawdown ?? 0)
    return a.symbol.localeCompare(b.symbol)
  })
}

export function Dashboard() {
  const [manualLoading, setManualLoading] = useState(false)
  const [tab, setTab] = useState<Tab>('radar')
  const [sort, setSort] = useState<Sort>('potential')
  const [portfolioOnly, setPortfolioOnly] = useState(false)
  const { data, error, isLoading, mutate } = useSWR<Payload>('/api/stocks', fetcher, { refreshInterval: (latest) => { const st = [...(latest?.stocks ?? []), ...(latest?.etfs ?? []), ...(latest?.indices ?? [])].find((s) => s.marketState && s.marketState !== 'UNKNOWN')?.marketState; return st === 'REGULAR' ? REFRESH_OPEN_MS : REFRESH_CLOSED_MS }, revalidateOnFocus: true, keepPreviousData: true })
  const allAssets = [...(data?.stocks ?? []), ...(data?.etfs ?? []), ...(data?.indices ?? [])]
  const marketState = allAssets.find((s) => s.marketState && s.marketState !== 'UNKNOWN')?.marketState
  const isOpen = marketState === 'REGULAR'
  const refreshSec = (isOpen ? REFRESH_OPEN_MS : REFRESH_CLOSED_MS) / 1000
  const visible = useMemo(() => { if (!data) return []; let source = tab === 'stocks' ? data.stocks : tab === 'etfs' ? data.etfs : tab === 'indices' ? data.indices : [...data.stocks, ...data.etfs]; if (portfolioOnly) source = source.filter((q) => q.holding); return sortQuotes(source, sort) }, [data, tab, sort, portfolioOnly])
  async function handleRefresh() { setManualLoading(true); await mutate(); setManualLoading(false) }

  return <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-5 sm:px-6 lg:py-8">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><Activity className="h-5 w-5 text-primary" /><h1 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">Indicateurs Boursiers</h1></div><p className="mt-1 text-sm text-muted-foreground">Ton radar personnel · potentiel 12 mois · timing d'achat</p></div><div className="flex items-center gap-3"><div className="flex items-center gap-2 rounded-md border bg-card px-3 py-1.5"><span className={`h-2 w-2 rounded-full ${isOpen ? 'bg-bull animate-pulse-dot' : 'bg-muted-foreground'}`} /><span className="text-xs font-medium text-card-foreground">{marketState ? marketStateLabel(marketState) : 'Chargement…'}</span></div><button onClick={handleRefresh} disabled={manualLoading} className="flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"><RefreshCw className={`h-3.5 w-3.5 ${manualLoading ? 'animate-spin' : ''}`} /> Actualiser</button></div></header>
    {error && <div className="mt-5 rounded-lg border border-bear/40 bg-bear/10 px-4 py-3 text-sm text-bear">Impossible de charger les données de marché. Nouvelle tentative automatique en cours…</div>}
    {isLoading && !data ? <SkeletonState /> : data && <>
      {tab === 'radar' && <section className="mt-5 rounded-2xl border border-primary/20 bg-card p-4 shadow-sm sm:p-5"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><div className="flex items-center gap-2"><Flame className="h-5 w-5 text-primary" /><h2 className="text-lg font-bold text-card-foreground">🔥 Radar d'achat — Potentiel 12 mois</h2></div><p className="mt-1 text-xs text-muted-foreground">Même score de potentiel 12 mois partout dans le dashboard. Le score technique est séparé.</p></div><select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="w-fit rounded-md border bg-background px-2.5 py-1.5 text-xs"><option value="potential">Potentiel 12 mois</option><option value="score">Technique</option><option value="momentum">Momentum</option><option value="rsi">RSI bas</option><option value="drawdown">Drawdown</option></select></div><div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">{sortQuotes([...data.stocks, ...data.etfs], 'potential').slice(0, 5).map((q) => <StockCard key={q.symbol} q={q} compact />)}</div><div className="mt-4 border-t border-border pt-4"><Opportunities quotes={[...data.stocks, ...data.etfs]} /></div></section>}
      <nav className="mt-6 flex gap-1 overflow-x-auto rounded-lg border bg-card p-1" aria-label="Navigation du dashboard">{([['radar','🔥 Radar',Flame],['stocks','⭐ Actions',Star],['etfs','📊 FNB',BarChart3],['indices','📈 Indices',LineChart]] as const).map(([id,label,Icon]) => <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-card-foreground'}`}><Icon className="h-3.5 w-3.5" />{label}</button>)}</nav>
      {tab === 'radar' && <section className="mt-5"><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Marchés de référence</h2><IndexStrip indices={data.indices} /></section>}
      {tab !== 'radar' && <><section className="mt-5"><h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Marchés de référence</h2><IndexStrip indices={data.indices} /></section><section className="mt-6"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-lg font-bold text-card-foreground">{tab === 'stocks' ? '⭐ Actions favorites' : tab === 'etfs' ? '📊 FNB favoris' : '📈 Indices'}</h2><p className="text-xs text-muted-foreground">Classés selon le critère sélectionné.</p></div><div className="flex flex-wrap gap-2"><button onClick={() => setPortfolioOnly(!portfolioOnly)} className={`rounded-md border px-3 py-1.5 text-xs font-semibold ${portfolioOnly ? 'border-primary bg-primary/10 text-primary' : 'bg-card text-muted-foreground'}`}>{portfolioOnly ? '✓ En portefeuille' : 'En portefeuille'}</button><select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-md border bg-card px-3 py-1.5 text-xs"><option value="potential">Potentiel 12 mois</option><option value="score">Score technique</option><option value="momentum">Momentum</option><option value="rsi">RSI bas</option><option value="drawdown">Drawdown</option><option value="name">Alphabetique</option></select></div></div><div className="grid grid-cols-1 gap-3 xl:grid-cols-2">{visible.map((q) => <StockCard key={q.symbol} q={q} compact />)}</div></section></>}
      <section className="mt-6 rounded-lg border bg-card p-4"><h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Comment lire</h3><div className="mt-2 grid grid-cols-1 gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4"><p><span className="font-semibold text-bull">🟢 Acheter maintenant</span> — bon potentiel et timing acceptable.</p><p><span className="font-semibold text-primary">🔵 Acheter sur repli</span> — bon potentiel, meilleur point d'entrée plus bas.</p><p><span className="font-semibold text-neutral">🟡 Surveiller</span> — configuration à confirmer.</p><p><span className="font-semibold text-warn">🟠 Attendre</span> / <span className="font-semibold text-bear">🔴 Éviter</span> — risque technique plus élevé.</p></div></section>
      <footer className="mt-6 flex flex-col gap-1 border-t border-border pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Actualisation automatique toutes les {refreshSec}s{isOpen ? ' · séance en cours' : ' · hors séance'}</span><span className="font-mono">Mis à jour à {fmtTime(data.updatedAt)}</span></footer>
    </>}
  </main>
}
function SkeletonState() { return <div className="mt-6 space-y-6"><div className="h-52 animate-pulse rounded-2xl border bg-card" /><div className="h-12 animate-pulse rounded-lg border bg-card" /><div className="grid grid-cols-1 gap-3 lg:grid-cols-2">{[0,1,2,3].map((i) => <div key={i} className="h-52 animate-pulse rounded-xl border bg-card" />)}</div></div> }
