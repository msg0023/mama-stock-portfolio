// Vercel 서버리스 함수: 한국 주식은 네이버 금융, 미국 주식/코인은 Yahoo Finance

async function fetchKoreanPrice(code) {
  const res = await fetch(`https://m.stock.naver.com/api/stock/${code}/basic`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      'Accept': 'application/json, text/plain, */*',
      'Referer': 'https://m.stock.naver.com/',
    },
  })
  if (!res.ok) throw new Error(`네이버 금융 오류: ${res.status}`)
  const data  = await res.json()
  const price = parseFloat((data.closePrice || '').replace(/,/g, ''))
  if (!price) throw new Error('현재가 없음')
  return {
    price,
    currency: 'KRW',
    name: data.stockName || code,
  }
}

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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { symbol } = req.query
  if (!symbol) return res.status(400).json({ error: '종목 코드가 필요합니다.' })

  try {
    let result
    if (symbol.endsWith('.KS') || symbol.endsWith('.KQ')) {
      const code = symbol.split('.')[0]
      result = await fetchKoreanPrice(code)
    } else {
      result = await fetchUSPrice(symbol)
    }
    return res.status(200).json({ symbol, ...result })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
