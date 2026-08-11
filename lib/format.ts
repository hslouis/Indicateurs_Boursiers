export function fmtPrice(v: number | null, digits = 2): string {
  if (v == null || isNaN(v)) return '—'
  return v.toLocaleString('fr-CA', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function fmtPercent(v: number | null): string {
  if (v == null || isNaN(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)} %`
}

export function fmtChange(v: number | null): string {
  if (v == null || isNaN(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(2)}`
}

export function fmtSignedPct(v: number | null, digits = 1): string {
  if (v == null || isNaN(v)) return '—'
  const sign = v > 0 ? '+' : ''
  return `${sign}${v.toFixed(digits)} %`
}

export function fmtPlainPct(v: number | null, digits = 0): string {
  if (v == null || isNaN(v)) return '—'
  return `${v.toFixed(digits)} %`
}

export function fmtTime(ms: number): string {
  return new Date(ms).toLocaleTimeString('fr-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function marketStateLabel(state: string): string {
  switch (state) {
    case 'REGULAR':
      return 'Marché ouvert'
    case 'PRE':
      return 'Pré-ouverture'
    case 'POST':
    case 'POSTPOST':
      return 'Après-clôture'
    case 'CLOSED':
      return 'Marché fermé'
    default:
      return 'État inconnu'
  }
}
