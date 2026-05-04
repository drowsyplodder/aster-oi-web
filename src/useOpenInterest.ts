import { useCallback, useEffect, useRef, useState } from 'react'
import {
  fetchOpenInterestBatch,
  fetchPerpetualSymbols,
  fetchPrices,
  type PriceMap,
  type SymbolInfo,
} from './api'
import {
  appendSnapshot,
  deltaPct,
  DELTA_WINDOWS,
  loadHistory,
  oldestSnapshotMs,
  saveHistory,
  totalSnapshotCount,
  type OIHistory,
} from './history'

// AsterDex web UI показывает Open Interest как сумму long + short notional,
// то есть в 2× от величины из API (которая возвращает количество контрактов одной стороны).
// Удваиваем, чтобы числа совпадали с тем, что видит пользователь на бирже.
const OI_NOTIONAL_MULTIPLIER = 2

function errMsg(err: unknown): string {
  return err instanceof Error ? err.message : String(err)
}

export interface OIRow {
  symbol: string
  baseAsset: string
  quoteAsset: string
  openInterest: number
  price: number
  notionalUsdt: number
  deltas: Record<string, number | null>
}

export interface OIData {
  rows: OIRow[]
  fetchedAt: number      // ms
  durationMs: number
  symbolsCount: number
  snapshotCount: number
  historySpanMs: number  // от самого старого снапшота до сейчас
}

export interface UseOpenInterestState {
  data: OIData | null
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useOpenInterest(autoRefreshSec: number): UseOpenInterestState {
  const [data, setData] = useState<OIData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const symbolsCacheRef = useRef<{ ts: number; symbols: SymbolInfo[] } | null>(null)
  const pricesCacheRef = useRef<PriceMap | null>(null)
  const inFlightRef = useRef(false)

  const load = useCallback(async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true
    setLoading(true)
    const started = Date.now()
    let stepError: string | null = null

    try {
      // exchangeInfo меняется редко — кэшируем на 10 минут.
      const SYMBOLS_TTL = 10 * 60 * 1000
      const cached = symbolsCacheRef.current
      let symbols: SymbolInfo[]
      if (cached && Date.now() - cached.ts < SYMBOLS_TTL) {
        symbols = cached.symbols
      } else {
        try {
          symbols = await fetchPerpetualSymbols('USDT')
          symbolsCacheRef.current = { ts: Date.now(), symbols }
        } catch (err) {
          if (cached) {
            symbols = cached.symbols
            stepError = `Не удалось обновить список символов (${errMsg(err)}), показываю кэш.`
          } else {
            throw err
          }
        }
      }

      // Цены — если упали, используем последние удачные.
      let prices: PriceMap
      try {
        prices = await fetchPrices()
        pricesCacheRef.current = prices
      } catch (err) {
        if (pricesCacheRef.current) {
          prices = pricesCacheRef.current
          stepError = `Не удалось обновить цены (${errMsg(err)}), использую предыдущие.`
        } else {
          throw err
        }
      }

      const oiMap = await fetchOpenInterestBatch(
        symbols.map((s) => s.symbol),
        8,
      )

      const nowMs = Date.now()
      const history: OIHistory = loadHistory()

      const rows: OIRow[] = []
      for (const s of symbols) {
        const oi = oiMap.get(s.symbol)
        if (oi == null || oi <= 0) continue
        const price = prices[s.symbol] ?? 0
        const series = history[s.symbol]
        const deltas: Record<string, number | null> = {}
        for (const w of DELTA_WINDOWS) {
          deltas[w.label] = deltaPct(series, oi, w.ms, nowMs)
        }
        rows.push({
          symbol: s.symbol,
          baseAsset: s.baseAsset,
          quoteAsset: s.quoteAsset,
          openInterest: oi,
          price,
          notionalUsdt: oi * price * OI_NOTIONAL_MULTIPLIER,
          deltas,
        })
      }

      // Обновляем историю и сохраняем — после расчёта дельт, чтобы они были «по прошлым».
      for (const r of rows) {
        appendSnapshot(history, r.symbol, r.openInterest, nowMs)
      }
      saveHistory(history)

      const oldest = oldestSnapshotMs(history)
      setData({
        rows,
        fetchedAt: nowMs,
        durationMs: Date.now() - started,
        symbolsCount: symbols.length,
        snapshotCount: totalSnapshotCount(history),
        historySpanMs: oldest != null ? nowMs - oldest : 0,
      })
      setError(stepError)
    } catch (err) {
      // Полный провал. Не очищаем data — пусть видна предыдущая, ошибка отдельно.
      setError(errMsg(err))
    } finally {
      setLoading(false)
      inFlightRef.current = false
    }
  }, [])

  // первичная загрузка
  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // авто-обновление
  useEffect(() => {
    if (autoRefreshSec <= 0) return
    const id = window.setInterval(() => {
      void load()
    }, autoRefreshSec * 1000)
    return () => window.clearInterval(id)
  }, [autoRefreshSec, load])

  return { data, loading, error, refresh: load }
}
