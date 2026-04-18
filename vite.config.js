import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** 한국 주식: 네이버 금융 API */
async function fetchKoreanPrice(code) {
  const res = await fetch(`https://m.stock.naver.com/api/stock/${code}/basic`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://m.stock.naver.com/',
    },
  })
  if (!res.ok) throw new Error(`네이버 금융 오류: ${res.status}`)
  const data = await res.json()
  const price = parseFloat((data.closePrice || '').replace(/,/g, ''))
  if (!price) throw new Error('현재가 없음')
  return {
    price,
    currency: 'KRW',
    name: data.stockName || code,
  }
}

/** 미국 주식: Yahoo Finance */
async function fetchUSPrice(symbol) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
    {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    }
  )
  if (!res.ok) throw new Error(`Yahoo Finance 오류: ${res.status}`)
  const data   = await res.json()
  const result = data.chart?.result?.[0]
  const price  = result?.meta?.regularMarketPrice ?? result?.meta?.chartPreviousClose
  if (!price) throw new Error('현재가 없음')
  return {
    price,
    currency: result?.meta?.currency || 'USD',
    name: result?.meta?.longName || result?.meta?.shortName || symbol,
  }
}

/** 로컬 개발용 /api/stock-price 미들웨어 */
function stockPriceDevPlugin() {
  return {
    name: 'stock-price-dev-api',
    configureServer(server) {
      server.middlewares.use('/api/stock-price', async (req, res) => {
        const url    = new URL(req.url, 'http://localhost:3000')
        const symbol = url.searchParams.get('symbol')

        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Access-Control-Allow-Origin', '*')

        if (!symbol) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: '종목 코드가 필요합니다.' }))
          return
        }

        try {
          let result
          if (symbol.endsWith('.KS') || symbol.endsWith('.KQ')) {
            const code = symbol.split('.')[0]
            result = await fetchKoreanPrice(code)
          } else {
            result = await fetchUSPrice(symbol)
          }
          res.end(JSON.stringify({ symbol, ...result }))
        } catch (err) {
          console.error('[stock-price]', symbol, err.message)
          res.statusCode = 500
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), stockPriceDevPlugin()],
  server: { port: 3000 },
})
