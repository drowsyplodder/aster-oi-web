interface Props {
  query: string
  onQueryChange: (v: string) => void
  minOiInput: string
  onMinOiInputChange: (v: string) => void
  autoRefreshSec: number
  onAutoRefreshChange: (v: number) => void
  showOnlyTop: number | null
  onShowOnlyTopChange: (v: number | null) => void
  onClearHistory: () => void
}

const REFRESH_OPTIONS = [
  { label: 'Off', value: 0 },
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '60s', value: 60 },
  { label: '5m', value: 300 },
]

const TOP_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Top 10', value: 10 },
  { label: 'Top 30', value: 30 },
  { label: 'Top 100', value: 100 },
  { label: 'All', value: null },
]

export default function Controls(props: Props) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur">
      <Field label="Поиск">
        <input
          type="text"
          placeholder="BTC, ETH, SOL..."
          value={props.query}
          onChange={(e) => props.onQueryChange(e.target.value)}
          className="w-44 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition placeholder:text-white/30 focus:border-indigo-400/60 focus:bg-black/50"
        />
      </Field>

      <Field label="Мин. OI (USDT)">
        <input
          type="text"
          placeholder="напр. 1M"
          value={props.minOiInput}
          onChange={(e) => props.onMinOiInputChange(e.target.value)}
          className="w-32 rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm outline-none transition placeholder:text-white/30 focus:border-indigo-400/60 focus:bg-black/50"
        />
      </Field>

      <Field label="Показ">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
          {TOP_OPTIONS.map((opt) => {
            const active = opt.value === props.showOnlyTop
            return (
              <button
                key={opt.label}
                onClick={() => props.onShowOnlyTopChange(opt.value)}
                className={`rounded-md px-3 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-500/30 text-indigo-100 shadow-inner shadow-indigo-500/10'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </Field>

      <Field label="Авто-обновление">
        <div className="flex gap-1 rounded-lg border border-white/10 bg-black/30 p-1">
          {REFRESH_OPTIONS.map((opt) => {
            const active = opt.value === props.autoRefreshSec
            return (
              <button
                key={opt.label}
                onClick={() => props.onAutoRefreshChange(opt.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  active
                    ? 'bg-indigo-500/30 text-indigo-100 shadow-inner shadow-indigo-500/10'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </Field>

      <div className="ml-auto flex items-end">
        <button
          onClick={props.onClearHistory}
          className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-medium text-white/60 transition hover:border-rose-400/40 hover:text-rose-200"
          title="Очистить локальную историю снапшотов (дельты сбросятся)"
        >
          Очистить историю
        </button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </span>
      {children}
    </label>
  )
}
