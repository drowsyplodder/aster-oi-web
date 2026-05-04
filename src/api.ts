// AsterDex futures API client (browser).
// Public, CORS-enabled endpoints — see https://asterdex.github.io/aster-api-website/futures/general-info/

const BASE_URL = 'https://fapi.asterdex.com'

export interface SymbolInfo {
  symbol: string
  baseAsset: string
  quoteAsset: string
}

export interface PriceMap {
  [symbol: string]: number
}

interface ExchangeInfoSymbol {
  symbol: string
  baseAsset?: string
  quoteAsset?: string
  status?: string
  contractType?: string
}

interface ExchangeInfoResponse {
  symbols?: ExchangeInfoSymbol[]
}

interface TickerPriceItem {
  symbol: string
  price: string
}

interface OpenInterestResponse {
  symbol: string
  openInterest: string
  time?: number
}

async function getJson<T>(
  path: string,
  params?: Record<string, string>,
  retries = 0,
): Promise<T> {
  const url = new URL(BASE_URL + path)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }
  let lastErr: unknown = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const resp = await fetch(url.toString())
      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} on ${path}`)
      }
      return (await resp.json()) as T
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        // короткий экспоненциальный бэк-офф
        const wait = 250 * 2 ** attempt
        await new Promise((r) => setTimeout(r, wait))
      }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(String(lastErr))
}

export async function fetchPerpetualSymbols(quote = 'USDT'): Promise<SymbolInfo[]> {
  const data = await getJson<ExchangeInfoResponse>('/fapi/v1/exchangeInfo', undefined, 2)
  return (data.symbols ?? [])
    .filter((s) => s.status === 'TRADING' && s.contractType === 'PERPETUAL')
    .filter((s) => (s.quoteAsset ?? '').toUpperCase() === quote.toUpperCase())
    .map((s) => ({
      symbol: s.symbol,
      baseAsset: s.baseAsset ?? '',
      quoteAsset: s.quoteAsset ?? '',
    }))
}

export async function fetchPrices(): Promise<PriceMap> {
  const data = await getJson<TickerPriceItem[]>('/fapi/v1/ticker/price', undefined, 2)
  const out: PriceMap = {}
  for (const item of data) {
    const v = parseFloat(item.price)
    if (Number.isFinite(v)) out[item.symbol] = v
  }
  return out
}

export async function fetchOpenInterest(symbol: string): Promise<number | null> {
  try {
    const data = await getJson<OpenInterestResponse>(
      '/fapi/v1/openInterest',
      { symbol },
      1, // одна повторная попытка на индивидуальный запрос
    )
    const v = parseFloat(data.openInterest)
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

// Batch OI requests with bounded concurrency.
export async function fetchOpenInterestBatch(
  symbols: string[],
  concurrency = 12,
): Promise<Map<string, number>> {
  const out = new Map<string, number>()
  let i = 0
  async function worker() {
    while (i < symbols.length) {
      const idx = i++
      const sym = symbols[idx]
      const oi = await fetchOpenInterest(sym)
      if (oi != null) out.set(sym, oi)
    }
  }
  const workers = Array.from({ length: Math.min(concurrency, symbols.length) }, worker)
  await Promise.all(workers)
  return out
}
