import { analyze, type Analysis } from './indicators'

export interface SparkPoint {
  t: number
  c: number
}

export interface Quote {
  symbol: string
  name: string
  kind: 'index' | 'stock'
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
}

// Univers surveillé
export const INDICES: { symbol: string; name: string }[] = [
  { symbol: '^GSPC', name: 'S&P 500' },
  { symbol: '^NDX', name: 'Nasdaq-100' },
  { symbol: '^GSPTSE', name: 'S&P/TSX Composite' },
]

export const STOCKS: { symbol: string; name: string }[] = [
  { symbol: 'MDA.TO', name: 'MDA Space Ltd.' },
  { symbol: 'NOWS.TO', name: 'Nuvei / NOWS' },
  { symbol: 'SHOP.TO', name: 'Shopify Inc.' },
]

// Détermine l'état du marché nord-américain (TSX / NYSE : 9 h 30–16 h ET, lun-ven)
// à partir de l'heure de New York, car le point /chart de Yahoo n'expose pas marketState.
export function computeMarketState(): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short',
    hour12: false,
  }).formatToParts(new Date())

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
      meta: {
        symbol: string
        currency?: string
        regularMarketPrice?: number
        chartPreviousClose?: number
        previousClose?: number
        regularMarketDayHigh?: number
        regularMarketDayLow?: number
        marketState?: string
        longName?: string
        shortName?: string
      }
      timestamp?: number[]
      indicators: {
        quote?: Array<{ close?: (number | null)[] }>
        adjclose?: Array<{ adjclose?: (number | null)[] }>
      }
    }>
    error?: unknown
  }
}

async function fetchChart(symbol: string): Promise<YahooChart | null> {
  // 1 an de séances quotidiennes : nécessaire pour calculer la MM200.
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol,
  )}?range=1y&interval=1d&includePrePost=false`
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
    if (!res.ok) return null
    return (await res.json()) as YahooChart
  } catch {
    return null
  }
}

export async function getQuote(
  symbol: string,
  name: string,
  kind: 'index' | 'stock',
): Promise<Quote> {
  const base: Quote = {
    symbol,
    name,
    kind,
    currency: kind === 'index' ? '' : 'CAD',
    price: null,
    previousClose: null,
    change: null,
    changePercent: null,
    dayHigh: null,
    dayLow: null,
    marketState: 'UNKNOWN',
    spark: [],
    analysis: null,
  }

  const data = await fetchChart(symbol)
  const result = data?.chart?.result?.[0]
  if (!result) {
    return { ...base, error: 'Données indisponibles' }
  }

  const meta = result.meta
  const timestamps = result.timestamp ?? []
  const rawCloses =
    result.indicators.quote?.[0]?.close ??
    result.indicators.adjclose?.[0]?.adjclose ??
    []

  // Construire une série propre (sans trous)
  const series: SparkPoint[] = []
  for (let i = 0; i < timestamps.length; i++) {
    const c = rawCloses[i]
    if (c != null && !isNaN(c)) series.push({ t: timestamps[i], c })
  }

  const closes = series.map((p) => p.c)
  const price =
    meta.regularMarketPrice ?? (closes.length ? closes[closes.length - 1] : null)

  // Variation du jour : la dernière barre quotidienne représente la séance courante
  // (son prix = `price`), donc la clôture de référence est l'avant-dernière barre.
  const previousClose: number | null =
    closes.length >= 2
      ? closes[closes.length - 2]
      : (meta.previousClose ?? meta.chartPreviousClose ?? null)

  const change = price != null && previousClose != null ? price - previousClose : null
  const changePercent =
    change != null && previousClose ? (change / previousClose) * 100 : null

  const analysis = closes.length >= 30 ? analyze(closes) : null

  return {
    ...base,
    currency: meta.currency ?? base.currency,
    price,
    previousClose,
    change,
    changePercent,
    dayHigh: meta.regularMarketDayHigh ?? null,
    dayLow: meta.regularMarketDayLow ?? null,
    marketState: meta.marketState ?? computeMarketState(),
    spark: series.slice(-90),
    analysis,
  }
}

export async function getAllQuotes(): Promise<{
  indices: Quote[]
  stocks: Quote[]
  updatedAt: number
}> {
  const [indices, stocks] = await Promise.all([
    Promise.all(INDICES.map((i) => getQuote(i.symbol, i.name, 'index'))),
    Promise.all(STOCKS.map((s) => getQuote(s.symbol, s.name, 'stock'))),
  ])
  return { indices, stocks, updatedAt: Date.now() }
}
