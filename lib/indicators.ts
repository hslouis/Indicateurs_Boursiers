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
      // amorce avec une SMA
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
  for (let i = 0; i < signalCompact.length; i++) {
    signal[validFrom + i] = signalCompact[i]
  }
  const hist = values.map((_, i) =>
    isNaN(line[i]) || isNaN(signal[i]) ? NaN : line[i] - signal[i],
  )
  return { line, signal, hist }
}

export type SignalLevel =
  | 'ACHAT FORT'
  | 'ACHAT'
  | 'CONSERVER'
  | 'VENTE'
  | 'VENTE FORTE'

export interface Analysis {
  score: number
  level: SignalLevel
  rsi: number | null
  sma20: number | null
  sma50: number | null
  macdHist: number | null
  reasons: string[]
}

export function analyze(closes: number[]): Analysis {
  const n = closes.length
  const last = closes[n - 1]
  const rsiArr = rsi(closes, 14)
  const sma20Arr = sma(closes, 20)
  const sma50Arr = sma(closes, 50)
  const { hist } = macd(closes)

  const rsiVal = valOrNull(rsiArr[n - 1])
  const sma20 = valOrNull(sma20Arr[n - 1])
  const sma50 = valOrNull(sma50Arr[n - 1])
  const histVal = valOrNull(hist[n - 1])
  const histPrev = valOrNull(hist[n - 2])

  let score = 0
  const reasons: string[] = []

  // RSI
  if (rsiVal != null) {
    if (rsiVal < 30) {
      score += 2
      reasons.push(`RSI ${rsiVal.toFixed(0)} — survente (signal d'achat)`)
    } else if (rsiVal < 45) {
      score += 1
      reasons.push(`RSI ${rsiVal.toFixed(0)} — bas, momentum favorable`)
    } else if (rsiVal > 70) {
      score -= 2
      reasons.push(`RSI ${rsiVal.toFixed(0)} — surachat (signal de vente)`)
    } else if (rsiVal > 55) {
      score -= 1
      reasons.push(`RSI ${rsiVal.toFixed(0)} — élevé, prudence`)
    } else {
      reasons.push(`RSI ${rsiVal.toFixed(0)} — neutre`)
    }
  }

  // Tendance via moyennes mobiles
  if (sma20 != null && sma50 != null) {
    if (last > sma20 && sma20 > sma50) {
      score += 2
      reasons.push('Prix > MM20 > MM50 — tendance haussière confirmée')
    } else if (last < sma20 && sma20 < sma50) {
      score -= 2
      reasons.push('Prix < MM20 < MM50 — tendance baissière confirmée')
    } else if (last > sma50) {
      score += 1
      reasons.push('Prix au-dessus de la MM50 — biais haussier')
    } else {
      score -= 1
      reasons.push('Prix sous la MM50 — biais baissier')
    }
  }

  // MACD
  if (histVal != null) {
    if (histVal > 0) {
      score += 1
      if (histPrev != null && histPrev <= 0) {
        score += 1
        reasons.push('MACD — croisement haussier récent')
      } else {
        reasons.push('MACD positif — momentum haussier')
      }
    } else {
      score -= 1
      if (histPrev != null && histPrev >= 0) {
        score -= 1
        reasons.push('MACD — croisement baissier récent')
      } else {
        reasons.push('MACD négatif — momentum baissier')
      }
    }
  }

  let level: SignalLevel = 'CONSERVER'
  if (score >= 4) level = 'ACHAT FORT'
  else if (score >= 2) level = 'ACHAT'
  else if (score <= -4) level = 'VENTE FORTE'
  else if (score <= -2) level = 'VENTE'

  return { score, level, rsi: rsiVal, sma20, sma50, macdHist: histVal, reasons }
}

function valOrNull(v: number | undefined): number | null {
  return v == null || isNaN(v) ? null : v
}
