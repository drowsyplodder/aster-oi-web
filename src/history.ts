// Локальное хранилище истории OI (в localStorage), чтобы считать дельты Δ5m/Δ1h/Δ24h.
// Структура: { [symbol]: [[ts_ms, oi_base], ...] }

const STORAGE_KEY = 'aster_oi_history_v1'
const RETENTION_MS = 25 * 3600 * 1000 // ~25 часов

export type OIPoint = [number, number] // [timestamp_ms, oi_base]
export type OIHistory = Record<string, OIPoint[]>

export const DELTA_WINDOWS: { label: string; ms: number }[] = [
  { label: '5m', ms: 5 * 60 * 1000 },
  { label: '1h', ms: 60 * 60 * 1000 },
  { label: '24h', ms: 24 * 60 * 60 * 1000 },
]

export function loadHistory(): OIHistory {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') return parsed as OIHistory
    return {}
  } catch {
    return {}
  }
}

export function saveHistory(history: OIHistory): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
  } catch {
    // localStorage может быть переполнен / недоступен — молча пропускаем
  }
}

export function clearHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* noop */
  }
}

export function appendSnapshot(
  history: OIHistory,
  symbol: string,
  oi: number,
  nowMs: number,
): void {
  const series = history[symbol] ?? (history[symbol] = [])
  series.push([nowMs, oi])
  const cutoff = nowMs - RETENTION_MS
  let drop = 0
  while (drop < series.length && series[drop][0] < cutoff) drop++
  if (drop > 0) series.splice(0, drop)
}

export function deltaPct(
  series: OIPoint[] | undefined,
  currentOI: number,
  windowMs: number,
  nowMs: number,
): number | null {
  if (!series || series.length === 0) return null
  const target = nowMs - windowMs
  let best: OIPoint | null = null
  let bestDist = Infinity
  for (const point of series) {
    const dist = Math.abs(point[0] - target)
    if (dist < bestDist) {
      bestDist = dist
      best = point
    }
  }
  if (!best) return null
  // tolerance: половина окна, минимум 1 минута
  const tolerance = Math.max(windowMs / 2, 60_000)
  if (bestDist > tolerance) return null
  const past = best[1]
  if (past <= 0) return null
  return ((currentOI - past) / past) * 100
}

export function totalSnapshotCount(history: OIHistory): number {
  let n = 0
  for (const sym in history) n += history[sym].length
  return n
}

export function oldestSnapshotMs(history: OIHistory): number | null {
  let oldest = Infinity
  for (const sym in history) {
    for (const p of history[sym]) {
      if (p[0] < oldest) oldest = p[0]
    }
  }
  return oldest === Infinity ? null : oldest
}
