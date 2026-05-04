import { useMemo, useState } from 'react'
import type { OIRow } from '../useOpenInterest'
import { formatCompact, formatPct, formatPrice } from '../format'

type SortKey = 'rank' | 'symbol' | 'oi' | 'price' | 'notional' | 'd5m' | 'd1h' | 'd24h'
type SortDir = 'asc' | 'desc'

interface Props {
  rows: OIRow[]
}

const COLS: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
  { key: 'rank', label: '#', align: 'left' },
  { key: 'symbol', label: 'Symbol', align: 'left' },
  { key: 'oi', label: 'OI (base)', align: 'right' },
  { key: 'price', label: 'Price', align: 'right' },
  { key: 'notional', label: 'OI (USDT)', align: 'right' },
  { key: 'd5m', label: 'Δ 5m', align: 'right' },
  { key: 'd1h', label: 'Δ 1h', align: 'right' },
  { key: 'd24h', label: 'Δ 24h', align: 'right' },
]

export default function OITable({ rows }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('notional')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const sorted = useMemo(() => {
    const copy = [...rows]
    const sign = sortDir === 'asc' ? 1 : -1
    copy.sort((a, b) => {
      const va = sortValue(a, sortKey)
      const vb = sortValue(b, sortKey)
      if (typeof va === 'string' && typeof vb === 'string') {
        return sign * va.localeCompare(vb)
      }
      const na = typeof va === 'number' ? va : Number.NEGATIVE_INFINITY
      const nb = typeof vb === 'number' ? vb : Number.NEGATIVE_INFINITY
      return sign * (na - nb)
    })
    return copy
  }, [rows, sortKey, sortDir])

  const onSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir(key === 'symbol' ? 'asc' : 'desc')
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 bg-white/[0.02] text-[11px] uppercase tracking-wider text-white/40">
              {COLS.map((c) => {
                const active = sortKey === c.key
                return (
                  <th
                    key={c.key}
                    className={`select-none px-4 py-3 font-semibold ${
                      c.align === 'right' ? 'text-right' : 'text-left'
                    } cursor-pointer transition hover:text-white/80 ${
                      active ? 'text-indigo-200' : ''
                    }`}
                    onClick={() => onSort(c.key)}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {active && (
                        <span className="text-[9px]">
                          {sortDir === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row, i) => (
              <Row key={row.symbol} row={row} rank={i + 1} />
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={COLS.length} className="px-4 py-12 text-center text-white/40">
                  Нет данных под текущие фильтры.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Row({ row, rank }: { row: OIRow; rank: number }) {
  return (
    <tr className="border-b border-white/[0.03] last:border-0 transition hover:bg-white/[0.03]">
      <td className="px-4 py-3 text-white/40 tabular-nums">{rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-semibold text-white">
            {row.baseAsset || row.symbol.replace(/USDT$/, '')}
          </span>
          <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] uppercase text-white/40">
            {row.quoteAsset}
          </span>
        </div>
      </td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white/80">
        {formatCompact(row.openInterest)}
      </td>
      <td className="px-4 py-3 text-right font-mono tabular-nums text-white/70">
        ${formatPrice(row.price)}
      </td>
      <td className="px-4 py-3 text-right font-mono font-semibold tabular-nums text-white">
        ${formatCompact(row.notionalUsdt)}
      </td>
      <DeltaCell value={row.deltas['5m']} />
      <DeltaCell value={row.deltas['1h']} />
      <DeltaCell value={row.deltas['24h']} />
    </tr>
  )
}

function DeltaCell({ value }: { value: number | null }) {
  if (value == null) {
    return <td className="px-4 py-3 text-right font-mono text-white/25">—</td>
  }
  const cls =
    value > 0
      ? 'text-emerald-300'
      : value < 0
        ? 'text-rose-300'
        : 'text-white/60'
  return (
    <td className={`px-4 py-3 text-right font-mono tabular-nums ${cls}`}>
      {formatPct(value)}
    </td>
  )
}

function sortValue(r: OIRow, key: SortKey): number | string {
  switch (key) {
    case 'rank':
    case 'notional':
      return r.notionalUsdt
    case 'symbol':
      return r.symbol
    case 'oi':
      return r.openInterest
    case 'price':
      return r.price
    case 'd5m':
      return r.deltas['5m'] ?? Number.NEGATIVE_INFINITY
    case 'd1h':
      return r.deltas['1h'] ?? Number.NEGATIVE_INFINITY
    case 'd24h':
      return r.deltas['24h'] ?? Number.NEGATIVE_INFINITY
  }
}
