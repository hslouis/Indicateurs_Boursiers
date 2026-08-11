// Calculs d'indicateurs techniques à partir d'une série de prix de clôture.

export function sma(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= period) sum -= values[i - period]
    if (i >= period - 1) out[i] = sum / period
  }
  return out
}

export function ema(values: number[], period: number): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  const k = 2 / (period + 1)
  let prev = NaN
  for (let i = 0; i < values.length; i++) {
    const v = values[i]
    if (i === period - 1) {
      let sum = 0
      for (let j = 0; j < period; j++) sum += values[j]
      prev = sum / period
      out[i] = prev
    } else if (i >= period) {
      prev = v * k + prev * (1 - k)
      out[i] = prev
    }
  }
  return out
}

export function rsi(values: number[], period = 14): number[] {
  const out: number[] = new Array(values.length).fill(NaN)
  if (values.length <= period) return out
  let gain = 0
  let loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1]
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  let avgGain = gain / period
  let avgLoss = loss / period
  out[period] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1]
    const g = diff > 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    avgGain = (avgGain * (period - 1) + g) / period
    avgLoss = (avgLoss * (period - 1) + l) / period
    out[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss)
  }
  return out
}

export function macd(values: number[]) {
  const ema12 = ema(values, 12)
  const ema26 = ema(values, 26)
  const line = values.map((_, i) =>
    isNaN(ema12[i]) || isNaN(ema26[i]) ? NaN : ema12[i] - ema26[i],
  )
  const validFrom = line.findIndex((v) => !isNaN(v))
  const compact = validFrom >= 0 ? line.slice(validFrom) : []
  const signalCompact = ema(compact, 9)
  const signal: number[] = new Array(values.length).fill(NaN)
  for (let i = 0; i < signalCompact.length; i++) signal[validFrom + i] = signalCompact[i]
  const hist = values.map((_, i) =>
    isNaN(line[i]) || isNaN(signal[i]) ? NaN : line[i] - signal[i],
  )
  return { line, signal, hist }
}

export function momentum(values: number[], period = 20): number | null {
  const n = values.length
  if (n <= period) return null
  const past = values[n - 1 - period]
  if (!past) return null
  return (values[n - 1] / past - 1) * 100
}

export function volatility(values: number[], period = 20): number | null {
  const n = values.length
  if (n <= period + 1) return null
  const returns: number[] = []
  for (let i = n - period; i < n; i++) returns.push(values[i] / values[i - 1] - 1)
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / returns.length
  return Math.sqrt(variance) * Math.sqrt(252) * 100
}

export function drawdown(values: number[], period = 60): number | null {
  const n = values.length
  if (n === 0) return null
  const window = values.slice(Math.max(0, n - period))
  const peak = Math.max(...window)
  if (!peak) return null
  return (values[n - 1] / peak - 1) * 100
}

export function supportResistance(values: number[], period = 60): { support: number | null; resistance: number | null } {
  const n = values.length
  if (n === 0) return { support: null, resistance: null }
  const window = values.slice(Math.max(0, n - period))
  return { support: Math.min(...window), resistance: Math.max(...window) }
}

export type SignalLevel = 'ACHAT FORT' | 'ACHAT' | 'SURVEILLER' | 'ATTENDRE' | 'VENTE'
export type StrategySignal = 'ACHETER MAINTENANT' | 'ACHETER SUR REPLI' | 'SURVEILLER' | 'ATTENDRE' | 'ÉVITER'

export interface ScoreComponent {
  label: string
  score: number
  weight: number
}

export interface Analysis {
  score: number
  level: SignalLevel
  strategy: StrategySignal
  price: number
  rsi: number | null
  sma20: number | null
  sma50: number | null
  sma200: number | null
  macdHist: number | null
  momentum: number | null
  volatility: number | null
  drawdown: number | null
  support: number | null
  resistance: number | null
  buyZoneLow: number | null
  buyZoneHigh: number | null
  distanceToSupport: number | null
  components: ScoreComponent[]
  reasons: string[]
}

function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v))
}

export function analyze(closes: number[]): Analysis {
  const n = closes.length
  const price = closes[n - 1]
  const rsiArr = rsi(closes, 14)
  const sma20Arr = sma(closes, 20)
  const sma50Arr = sma(closes, 50)
  const sma200Arr = sma(closes, 200)
  const { hist } = macd(closes)

  const rsiVal = valOrNull(rsiArr[n - 1])
  const sma20 = valOrNull(sma20Arr[n - 1])
  const sma50 = valOrNull(sma50Arr[n - 1])
  const sma200 = valOrNull(sma200Arr[n - 1])
  const histVal = valOrNull(hist[n - 1])
  const histPrev = valOrNull(hist[n - 2])
  const mom = momentum(closes, 20)
  const vol = volatility(closes, 20)
  const dd = drawdown(closes, 60)
  const { support, resistance } = supportResistance(closes, 60)
  const reasons: string[] = []

  let trendScore = 50
  {
    const conds: boolean[] = []
    if (sma20 != null) conds.push(price > sma20)
    if (sma50 != null) conds.push(price > sma50)
    if (sma200 != null) conds.push(price > sma200)
    if (sma20 != null && sma50 != null) conds.push(sma20 > sma50)
    if (sma50 != null && sma200 != null) conds.push(sma50 > sma200)
    if (conds.length) trendScore = (conds.filter(Boolean).length / conds.length) * 100
    if (sma20 != null && sma50 != null && sma200 != null) {
      if (price > sma20 && sma20 > sma50 && sma50 > sma200) reasons.push('Alignement haussier complet (prix > MM20 > MM50 > MM200)')
      else if (price < sma20 && sma20 < sma50 && sma50 < sma200) reasons.push('Alignement baissier complet (prix < MM20 < MM50 < MM200)')
      else if (price > sma200) reasons.push('Prix au-dessus de la MM200 — tendance de fond haussière')
      else reasons.push('Prix sous la MM200 — tendance de fond baissière')
    }
  }

  let rsiScore = 55
  if (rsiVal != null) {
    if (rsiVal < 30) { rsiScore = 88; reasons.push(`RSI ${rsiVal.toFixed(0)} — survente, rebond possible`) }
    else if (rsiVal < 45) { rsiScore = 72; reasons.push(`RSI ${rsiVal.toFixed(0)} — bas, marge de progression`) }
    else if (rsiVal <= 55) { rsiScore = 60; reasons.push(`RSI ${rsiVal.toFixed(0)} — neutre`) }
    else if (rsiVal <= 70) { rsiScore = 42; reasons.push(`RSI ${rsiVal.toFixed(0)} — élevé, prudence`) }
    else { rsiScore = 22; reasons.push(`RSI ${rsiVal.toFixed(0)} — surachat, risque de repli`) }
  }

  let macdScore = 50
  if (histVal != null) {
    const rising = histPrev != null && histVal > histPrev
    if (histVal > 0 && histPrev != null && histPrev <= 0) { macdScore = 92; reasons.push('MACD — croisement haussier récent') }
    else if (histVal > 0) { macdScore = rising ? 78 : 66; reasons.push('MACD positif — momentum haussier') }
    else if (histVal < 0 && histPrev != null && histPrev >= 0) { macdScore = 15; reasons.push('MACD — croisement baissier récent') }
    else { macdScore = rising ? 40 : 28; reasons.push('MACD négatif — momentum baissier') }
  }

  let momScore = 50
  if (mom != null) {
    if (mom > 8) momScore = 85
    else if (mom > 2) momScore = 68
    else if (mom > -2) momScore = 52
    else if (mom > -8) momScore = 38
    else momScore = 20
    reasons.push(`Momentum 20 j ${mom >= 0 ? '+' : ''}${mom.toFixed(1)} % — ${mom >= 0 ? 'dynamique positive' : 'dynamique négative'}`)
  }

  const components: ScoreComponent[] = [
    { label: 'Tendance', score: Math.round(trendScore), weight: 0.35 },
    { label: 'MACD', score: Math.round(macdScore), weight: 0.25 },
    { label: 'Momentum', score: Math.round(momScore), weight: 0.2 },
    { label: 'RSI', score: Math.round(rsiScore), weight: 0.2 },
  ]
  const score = clamp(Math.round(components.reduce((a, c) => a + c.score * c.weight, 0)))

  if (vol != null) reasons.push(`Volatilité annualisée ${vol.toFixed(0)} % — ${vol > 45 ? 'risque élevé' : vol > 25 ? 'modérée' : 'faible'}`)
  if (dd != null && dd < -1) reasons.push(`Drawdown ${dd.toFixed(1)} % sous le plus haut récent`)

  let level: SignalLevel = 'ATTENDRE'
  if (score >= 75) level = 'ACHAT FORT'
  else if (score >= 60) level = 'ACHAT'
  else if (score >= 45) level = 'SURVEILLER'
  else if (score >= 30) level = 'ATTENDRE'
  else level = 'VENTE'

  // Zone de prix technique : on privilégie le support récent et la MM50.
  // Elle sert de zone de planification, pas de prédiction.
  const zoneCandidates = [support, sma50].filter((v): v is number => v != null && v > 0)
  const anchor = zoneCandidates.length ? Math.max(...zoneCandidates) : null
  const buyZoneLow = anchor != null ? anchor * 0.97 : null
  const buyZoneHigh = anchor != null ? anchor * 1.03 : null
  const distanceToSupport = support != null ? ((price / support) - 1) * 100 : null

  let strategy: StrategySignal
  if (score >= 68 && (rsiVal == null || rsiVal < 68) && (price <= (sma20 ?? price) * 1.04)) {
    strategy = 'ACHETER MAINTENANT'
  } else if (score >= 55 && (dd == null || dd <= -3 || (support != null && price <= support * 1.06))) {
    strategy = 'ACHETER SUR REPLI'
  } else if (score >= 45) {
    strategy = 'SURVEILLER'
  } else if (score >= 30) {
    strategy = 'ATTENDRE'
  } else {
    strategy = 'ÉVITER'
  }

  return {
    score,
    level,
    strategy,
    price,
    rsi: rsiVal,
    sma20,
    sma50,
    sma200,
    macdHist: histVal,
    momentum: mom,
    volatility: vol,
    drawdown: dd,
    support,
    resistance,
    buyZoneLow,
    buyZoneHigh,
    distanceToSupport,
    components,
    reasons,
  }
}

function valOrNull(v: number | undefined): number | null {
  return v == null || isNaN(v) ? null : v
}
