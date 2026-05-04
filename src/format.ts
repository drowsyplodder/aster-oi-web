export function formatCompact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1e9) return `${(value / 1e9).toFixed(2)}B`
  if (abs >= 1e6) return `${(value / 1e6).toFixed(2)}M`
  if (abs >= 1e3) return `${(value / 1e3).toFixed(2)}K`
  if (abs >= 1) return value.toFixed(2)
  return value.toPrecision(4)
}

export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return '—'
  if (value >= 1000) return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
  if (value >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: 4 })
  if (value >= 0.01) return value.toFixed(5)
  return value.toPrecision(4)
}

export function formatPct(value: number | null): string {
  if (value == null || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function parseAmount(input: string): number {
  const s = input.trim().toUpperCase()
  if (!s) return 0
  const map: Record<string, number> = { K: 1e3, M: 1e6, B: 1e9 }
  const last = s[s.length - 1]
  const mult = map[last] ?? 1
  const numStr = mult === 1 ? s : s.slice(0, -1)
  const v = parseFloat(numStr)
  if (!Number.isFinite(v)) return 0
  return v * mult
}

export function formatRelativeAge(ms: number): string {
  const sec = Math.floor(ms / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}
