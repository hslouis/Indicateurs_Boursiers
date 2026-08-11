import { analyze, type Analysis } from './indicators'

export interface SparkPoint { t: number; c: number }

export interface Quote {
  symbol: string
  name: string
  kind: 'index' | 'stock' | 'etf'
  currency: string
  price: number | null
  previousClose: number | null
  change: number | null
  changePercent: number | null
  dayHigh: number | null
  dayLow: number | null
  marketState: string
  spark: SparkPoint[]
  analysis: Analysis | null
  error?: string
  favorite?: boolean
  holding?: boolean
}

export const INDICES = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^NDX', name: 'Nasdaq-100' },
  { symbol: '^GSPTSE', name: 'S&P/TSX Composite' },
]

// Ordre = intérêt d'investissement personnel, du plus important au plus spéculatif.
// Ce classement est indépendant du score technique du jour.
export const STOCKS = [
  // Niveau 1 — convictions / candidats prioritaires
  { symbol: 'MSFT.TO', displaySymbol: 'MSFT', name: 'Microsoft CDR', holding: true },
  { symbol: 'MA.TO', displaySymbol: 'MA', name: 'Mastercard CDR', holding: true },
  { symbol: 'CSU.TO', displaySymbol: 'CSU', name: 'Constellation Software', holding: false },
  { symbol: 'DSG.TO', displaySymbol: 'DSG', name: 'Descartes Systems Group', holding: false },
  { symbol: 'AAPL.TO', displaySymbol: 'AAPL', name: 'Apple CDR', holding: true },
  { symbol: 'AMZN.TO', displaySymbol: 'AMZN', name: 'Amazon CDR', holding: true },
  { symbol: 'GOOG.TO', displaySymbol: 'GOOG', name: 'Alphabet CDR', holding: true },
  { symbol: 'META', displaySymbol: 'META', name: 'Meta Platforms', holding: true },

  // Niveau 2 — bonnes convictions, intérêt secondaire
  { symbol: 'TD.TO', displaySymbol: 'TD', name: 'TD', holding: true },
  { symbol: 'BN.TO', displaySymbol: 'BN', name: 'Brookfield', holding: true },
  { symbol: 'SPGI.TO', displaySymbol: 'SPGI', name: 'S&P Global CDR', holding: true },
  { symbol: 'SBUX.TO', displaySymbol: 'SBUX', name: 'Starbucks CDR', holding: true },
  { symbol: 'BNS.TO', displaySymbol: 'BNS', name: 'Banque Scotia', holding: true },
  { symbol: 'CM.TO', displaySymbol: 'CM', name: 'CIBC', holding: true },

  // Niveau 3 — candidats conditionnels : surtout intéressants sur repli marqué
  { symbol: 'SHOP.TO', displaySymbol: 'SHOP', name: 'Shopify', holding: false },
  { symbol: 'MDA.TO', displaySymbol: 'MDA', name: 'MDA Space', holding: false },

  // Niveau 4 — surveillance / positions plus spéculatives
  { symbol: 'NVDA.TO', displaySymbol: 'NVDA', name: 'NVIDIA CDR', holding: false },
  { symbol: 'ASML', displaySymbol: 'ASML', name: 'ASML', holding: false },
  { symbol: 'NOWS.TO', displaySymbol: 'NOWS', name: 'NOWS', holding: false },
]

// Même logique : ordre = intérêt personnel, et non rendement ou score technique.
export const ETFS = [
  // Cœur de portefeuille
  { symbol: 'XEQT.TO', displaySymbol: 'XEQT', name: 'iShares Core Equity ETF', holding: true },
  { symbol: 'VFV.TO', displaySymbol: 'VFV', name: 'Vanguard S&P 500 ETF', holding: true },
  { symbol: 'VXC.TO', displaySymbol: 'VXC', name: 'Vanguard FTSE Global ex Canada ETF', holding: true },
  { symbol: 'VEQT.TO', displaySymbol: 'VEQT', name: 'Vanguard All-Equity ETF', holding: false },
  { symbol: 'XAW.TO', displaySymbol: 'XAW', name: 'iShares Core MSCI All Country ex Canada ETF', holding: false },

  // Produits plus spécialisés / à surveiller
  { symbol: 'MSHE.TO', displaySymbol: 'MSHE', name: 'Harvest Microsoft Enhanced High Income ETF', holding: true },
  { symbol: 'HMAX.TO', displaySymbol: 'HMAX', name: 'Hamilton Enhanced Multi-Sector Covered Call ETF', holding: false },
  { symbol: 'FINN.NE', displaySymbol: 'FINN', name: 'Fidelity Global Innovators ETF', holding: true },
]

export function computeMarketState(): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false }).formatToParts(new Date())
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const weekday = get('weekday')
  const hour = parseInt(get('hour'), 10)
  const minute = parseInt(get('minute'), 10)
  const minutes = hour * 60 + minute
  if (weekday === 'Sat' || weekday === 'Sun') return 'CLOSED'
  const open = 9 * 60 + 30
  const close = 16 * 60
  if (minutes >= open && minutes < close) return 'REGULAR'
  if (minutes >= 4 * 60 && minutes < open) return 'PRE'
  if (minutes >= close && minutes < 20 * 60) return 'POST'
  return 'CLOSED'
}

interface YahooChart {
  chart: {
    result?: Array<{
      meta: { symbol: string; currency?: string; regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number; regularMarketDayHigh?: number; regularMarketDayLow?: number; marketState?: string; longName?: string; shortName?: string }
      timestamp?: number[]
      indicators: { quote?: Array<{ close?: (number | null)[] }>; adjclose?: Array<{ adjclose?: (number | null)[] }> }
    }>
    error?: unknown
  }
}

async function fetchChart(symbol: string): Promise<YahooChart | null> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1y&interval=1d&includePrePost=false`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }, cache: 'no-store' })
    if (!res.ok) return null
    return (await res.json()) as YahooChart
  } catch { return null }
}

export async function getQuote(symbol: string, name: string, kind: 'index' | 'stock' | 'etf', displaySymbol?: string, holding = false): Promise<Quote> {
  const base: Quote = { symbol: displaySymbol ?? symbol, name, kind, currency: kind === 'index' ? '' : 'CAD', price: null, previousClose: null, change: null, changePercent: null, dayHigh: null, dayLow: null, marketState: 'UNKNOWN', spark: [], analysis: null, favorite: kind !== 'index', holding }
  const data = await fetchChart(symbol)
  const result = data?.chart?.result?.[0]
  if (!result) return { ...base, error: 'Données indisponibles' }
  const meta = result.meta
  const timestamps = result.timestamp ?? []
  const rawCloses = result.indicators.quote?.[0]?.close ?? result.indicators.adjclose?.[0]?.adjclose ?? []
  const series: SparkPoint[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const c = rawCloses[i]
    if (c != null && !isNaN(c)) series.push({ t: timestamps[i], c })
  }
  const closes = series.map((p) => p.c)
  const price = meta.regularMarketPrice ?? (closes.length ? closes[closes.length - 1] : null)
  const previousClose = closes.length >= 2 ? closes[closes.length - 2] : (meta.previousClose ?? meta.chartPreviousClose ?? null)
  const change = price != null && previousClose != null ? price - previousClose : null
  const changePercent = change != null && previousClose ? (change / previousClose) * 100 : null
  const analysis = closes.length >= 30 ? analyze(closes) : null
  return { ...base, currency: meta.currency ?? base.currency, price, previousClose, change, changePercent, dayHigh: meta.regularMarketDayHigh ?? null, dayLow: meta.regularMarketDayLow ?? null, marketState: meta.marketState ?? computeMarketState(), spark: series.slice(-90), analysis }
}

export async function getAllQuotes(): Promise<{ indices: Quote[]; stocks: Quote[]; etfs: Quote[]; updatedAt: number }> {
  const [indices, stocks, etfs] = await Promise.all([
    Promise.all(INDICES.map((i) => getQuote(i.symbol, i.name, 'index'))),
    Promise.all(STOCKS.map((s) => getQuote(s.symbol, s.name, 'stock', s.displaySymbol, s.holding))),
    Promise.all(ETFS.map((e) => getQuote(e.symbol, e.name, 'etf', e.displaySymbol, e.holding))),
  ])
  return { indices, stocks, etfs, updatedAt: Date.now() }
}
