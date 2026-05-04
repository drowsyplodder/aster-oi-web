import { useEffect, useMemo, useState } from 'react'
import Header from './components/Header'
import Controls from './components/Controls'
import OITable from './components/OITable'
import { useOpenInterest } from './useOpenInterest'
import { parseAmount } from './format'
import { clearHistory } from './history'

export default function App() {
  const [autoRefreshSec, setAutoRefreshSec] = useState(30)
  const [query, setQuery] = useState('')
  const [minOiInput, setMinOiInput] = useState('')
  const [showOnlyTop, setShowOnlyTop] = useState<number | null>(30)
  const [nowMs, setNowMs] = useState(() => Date.now())

  const { data, loading, error, refresh } = useOpenInterest(autoRefreshSec)

  // Обновляем "now" каждые 5 секунд, чтобы "обновлено N сек назад" было свежим.
  useEffect(() => {
    const id = window.setInterval(() => setNowMs(Date.now()), 5_000)
    return () => window.clearInterval(id)
  }, [])

  const minOi = useMemo(() => parseAmount(minOiInput), [minOiInput])

  const filteredRows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toUpperCase()
    let rows = data.rows.filter((r) => {
      if (q) {
        const inSymbol = r.symbol.toUpperCase().includes(q)
        const inBase = r.baseAsset.toUpperCase().includes(q)
        if (!inSymbol && !inBase) return false
      }
      if (minOi > 0 && r.notionalUsdt < minOi) return false
      return true
    })
    if (showOnlyTop != null && !q) {
      rows = [...rows].sort((a, b) => b.notionalUsdt - a.notionalUsdt).slice(0, showOnlyTop)
    }
    return rows
  }, [data, query, minOi, showOnlyTop])

  const totalNotional = useMemo(
    () => filteredRows.reduce((acc, r) => acc + r.notionalUsdt, 0),
    [filteredRows],
  )

  return (
    <div className="relative min-h-full overflow-hidden">
      <BackgroundFx />
      <div className="relative mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <Header
          fetchedAt={data?.fetchedAt ?? null}
          durationMs={data?.durationMs ?? null}
          symbolsCount={data?.symbolsCount ?? 0}
          rowsShown={filteredRows.length}
          totalNotional={totalNotional}
          snapshotCount={data?.snapshotCount ?? 0}
          historySpanMs={data?.historySpanMs ?? 0}
          loading={loading}
          error={error}
          nowMs={nowMs}
          onRefresh={refresh}
        />

        <div className="mt-6 space-y-4">
          <Controls
            query={query}
            onQueryChange={setQuery}
            minOiInput={minOiInput}
            onMinOiInputChange={setMinOiInput}
            autoRefreshSec={autoRefreshSec}
            onAutoRefreshChange={setAutoRefreshSec}
            showOnlyTop={showOnlyTop}
            onShowOnlyTopChange={setShowOnlyTop}
            onClearHistory={() => {
              clearHistory()
              refresh()
            }}
          />

          <OITable rows={filteredRows} />

          <p className="text-xs text-white/30">
            История OI хранится локально в твоём браузере (localStorage). Дельты Δ5m / Δ1h / Δ24h
            заполняются по мере накопления снапшотов — оставь вкладку открытой с включённым авто-обновлением.
            AsterDex не отдаёт исторический OI через API, поэтому общей истории на сервере нет.
            OI в USDT суммирует обе стороны (long + short), как на самой бирже —
            это в 2× больше «голого» количества контрактов из API.
          </p>
        </div>
      </div>
    </div>
  )
}

function BackgroundFx() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute -top-32 left-1/2 h-[480px] w-[820px] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(99,102,241,0.55), rgba(2,6,23,0))',
        }}
      />
      <div
        className="absolute right-[-200px] top-[300px] h-[420px] w-[620px] rounded-full opacity-20 blur-3xl"
        style={{
          background:
            'radial-gradient(closest-side, rgba(45,212,191,0.55), rgba(2,6,23,0))',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(to right, rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  )
}
