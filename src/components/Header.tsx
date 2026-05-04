import { formatCompact, formatRelativeAge } from '../format'

interface Props {
  fetchedAt: number | null
  durationMs: number | null
  symbolsCount: number
  rowsShown: number
  totalNotional: number
  snapshotCount: number
  historySpanMs: number
  loading: boolean
  error: string | null
  nowMs: number
  onRefresh: () => void
}

export default function Header(props: Props) {
  const ageMs = props.fetchedAt ? Math.max(0, props.nowMs - props.fetchedAt) : 0

  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-mono text-3xl font-bold tracking-tight text-white">
            AsterDex <span className="text-indigo-300">Open Interest</span>
          </h1>
          <p className="mt-1 max-w-xl text-sm text-white/50">
            Открытый интерес по бессрочным фьючерсам AsterDex с дельтами 5m / 1h / 24h.
            Сумма long + short в USDT — как на{' '}
            <a
              className="text-indigo-300 underline-offset-2 hover:underline"
              href="https://www.asterdex.com"
              target="_blank"
              rel="noreferrer"
            >
              самой бирже
            </a>
            . Данные напрямую с{' '}
            <a
              className="text-indigo-300 underline-offset-2 hover:underline"
              href="https://fapi.asterdex.com"
              target="_blank"
              rel="noreferrer"
            >
              fapi.asterdex.com
            </a>
            .
          </p>
        </div>

        <button
          onClick={props.onRefresh}
          disabled={props.loading}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/80 backdrop-blur transition hover:bg-white/[0.08] disabled:opacity-50"
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              props.loading
                ? 'animate-pulse bg-amber-300'
                : props.error
                  ? 'bg-rose-400'
                  : 'bg-emerald-400'
            }`}
          />
          {props.loading ? 'Обновляю…' : 'Обновить'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Total OI"
          value={`$${formatCompact(props.totalNotional)}`}
          accent
        />
        <Stat
          label="Видно символов"
          value={`${props.rowsShown} / ${props.symbolsCount}`}
        />
        <Stat
          label="Снапшотов"
          value={formatCompact(props.snapshotCount)}
          hint={
            props.historySpanMs > 0
              ? `охват ${formatRelativeAge(props.historySpanMs)}`
              : 'история пуста'
          }
        />
        <Stat
          label="Обновлено"
          value={
            props.fetchedAt
              ? `${formatRelativeAge(ageMs)}`
              : '—'
          }
          hint={
            props.durationMs != null
              ? `за ${(props.durationMs / 1000).toFixed(1)}s`
              : undefined
          }
        />
      </div>

      {props.error && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            props.fetchedAt
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
          }`}
        >
          {props.fetchedAt
            ? 'Свежие данные не пришли — '
            : 'Ошибка загрузки: '}
          <span className="font-mono">{props.error}</span>
        </div>
      )}
    </header>
  )
}

function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: boolean
}) {
  return (
    <div
      className={`rounded-xl border px-4 py-3 backdrop-blur ${
        accent
          ? 'border-indigo-400/20 bg-indigo-500/[0.08]'
          : 'border-white/5 bg-white/[0.02]'
      }`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </div>
      <div
        className={`mt-1 font-mono text-xl font-semibold ${
          accent ? 'text-indigo-100' : 'text-white'
        }`}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-white/30">{hint}</div>}
    </div>
  )
}
