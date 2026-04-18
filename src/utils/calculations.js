/**
 * 종목 통계 계산
 * @param {Array} transactions - [{type, quantity, price}, ...]
 * @param {number|null} currentPrice - 현재가
 */
export function calcStockStats(transactions = [], currentPrice = null) {
  const ordered = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));

  let totalQty = 0;
  let totalInvested = 0;
  let realizedPL = 0;

  ordered.forEach((tx) => {
    const type = (tx.type || 'BUY').toUpperCase();
    const qty = Number(tx.quantity) || 0;
    const price = Number(tx.price) || 0;

    if (type === 'SELL') {
      if (totalQty <= 0) return;
      const sellQty = Math.min(qty, totalQty);
      const avgBeforeSell = totalQty > 0 ? totalInvested / totalQty : 0;
      realizedPL += sellQty * (price - avgBeforeSell);
      totalQty -= sellQty;
      totalInvested -= sellQty * avgBeforeSell;
      return;
    }

    totalQty += qty;
    totalInvested += qty * price;
  });

  if (Math.abs(totalInvested) < 0.000001) totalInvested = 0;

  const avgPrice = totalQty > 0 ? totalInvested / totalQty : 0;
  const price = currentPrice ?? avgPrice;
  const currentValue = totalQty * price;
  const pl = currentValue - totalInvested;
  const totalPL = pl + realizedPL;
  const plPct = totalInvested > 0 ? (pl / totalInvested) * 100 : 0;

  return { totalQty, totalInvested, avgPrice, currentValue, pl, realizedPL, totalPL, plPct };
}

/**
 * 전체 포트폴리오 요약
 * @param {Array} stocks - Firestore 종목 배열
 * @param {Object} prices - { yahooSymbol: { price } }
 */
export function calcPortfolioSummary(stocks = [], prices = {}) {
  let totalInvested = 0;
  let totalValue = 0;
  let totalRealizedPL = 0;
  let totalCombinedPL = 0;

  const enriched = stocks.map((stock) => {
    const yahooSymbol = toYahooSymbol(stock.symbol, stock.market);
    const currentPrice = prices[yahooSymbol]?.price ?? stock.currentPrice ?? null;
    const stats = calcStockStats(stock.transactions, currentPrice);
    totalInvested += stats.totalInvested;
    totalValue += stats.currentValue;
    totalRealizedPL += stats.realizedPL;
    totalCombinedPL += stats.totalPL;
    return { ...stock, ...stats, currentPrice };
  });

  const totalPL = totalValue - totalInvested;
  const totalPlPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  return { enriched, totalInvested, totalValue, totalPL, totalPlPct, totalRealizedPL, totalCombinedPL };
}

export function buildAverageCostReturnSeries(stocks = [], mode = 'current') {
  const allDates = Array.from(
    new Set(
      stocks.flatMap((stock) =>
        (stock.transactions || []).map((tx) => tx.date).filter(Boolean)
      )
    )
  ).sort((a, b) => new Date(a) - new Date(b));

  if (allDates.length < 2) return [];

  const stockStates = stocks.map((stock) => {
    const transactions = [...(stock.transactions || [])].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
    return {
      transactions,
      currentPrice: Number(stock.currentPrice ?? stock.avgPrice ?? 0),
      finalAvgPrice: Number(stock.avgPrice ?? 0),
      pointer: 0,
      qty: 0,
      invested: 0,
    };
  });

  return allDates.map((date) => {
    let costBasis = 0;
    let marketValue = 0;

    stockStates.forEach((state) => {
      while (state.pointer < state.transactions.length && state.transactions[state.pointer].date <= date) {
        const tx = state.transactions[state.pointer];
        const type = (tx.type || 'BUY').toUpperCase();
        const qty = Number(tx.quantity) || 0;
        const price = Number(tx.price) || 0;

        if (type === 'SELL') {
          const sellQty = Math.min(qty, state.qty);
          const avgBeforeSell = state.qty > 0 ? state.invested / state.qty : 0;
          state.qty -= sellQty;
          state.invested -= sellQty * avgBeforeSell;
        } else {
          state.qty += qty;
          state.invested += qty * price;
        }
        state.pointer += 1;
      }

      if (state.qty <= 0 || state.currentPrice <= 0) return;

      marketValue += state.qty * state.currentPrice;

      if (mode === 'recalculated') {
        costBasis += state.invested;
        return;
      }

      const baselineAvg = state.finalAvgPrice > 0
        ? state.finalAvgPrice
        : state.qty > 0
          ? state.invested / state.qty
          : 0;
      costBasis += state.qty * baselineAvg;
    });

    const returnPct = costBasis > 0 ? ((marketValue - costBasis) / costBasis) * 100 : 0;

    return {
      date,
      label: date.slice(5),
      returnPct: Number(returnPct.toFixed(2)),
    };
  });
}

/** Yahoo Finance 심볼 변환 */
export function toYahooSymbol(symbol, market) {
  if (market === 'KS') return `${symbol}.KS`;
  if (market === 'KQ') return `${symbol}.KQ`;
  if (market === 'COIN') {
    const normalized = String(symbol || '').toUpperCase().trim();
    return normalized.includes('-') ? normalized : `${normalized}-USD`;
  }
  return symbol;
}

export function getAssetUnit(market) {
  return market === 'COIN' ? '개' : '주';
}

export function getAssetGroupMeta(market) {
  if (market === 'COIN') {
    return { key: 'COIN', label: '코인', color: '#f59e0b' };
  }
  if (market === 'US') {
    return { key: 'US', label: '미국주식', color: '#2563eb' };
  }
  return { key: 'KR', label: '국내주식', color: '#16a34a' };
}

export function summarizeByAssetGroup(stocks = []) {
  const groups = new Map();

  stocks.forEach((stock) => {
    const meta = getAssetGroupMeta(stock.market);
    const current = groups.get(meta.key) || {
      ...meta,
      invested: 0,
      value: 0,
      realizedPL: 0,
      totalPL: 0,
      count: 0,
    };

    current.invested += Number(stock.totalInvested || 0);
    current.value += Number(stock.currentValue || 0);
    current.realizedPL += Number(stock.realizedPL || 0);
    current.totalPL += Number(stock.totalPL || 0);
    current.count += 1;

    groups.set(meta.key, current);
  });

  return Array.from(groups.values()).map((group) => ({
    ...group,
    unrealizedPL: group.value - group.invested,
    plPct: group.invested > 0 ? ((group.value - group.invested) / group.invested) * 100 : 0,
  }));
}

export function buildAssetGroupTrendSeries(stocks = []) {
  const allDates = Array.from(
    new Set(
      stocks.flatMap((stock) =>
        (stock.transactions || []).map((tx) => tx.date).filter(Boolean)
      )
    )
  ).sort((a, b) => new Date(a) - new Date(b));

  if (allDates.length < 2) return [];

  const states = stocks.map((stock) => ({
    groupKey: getAssetGroupMeta(stock.market).key,
    transactions: [...(stock.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date)),
    currentPrice: Number(stock.currentPrice ?? stock.avgPrice ?? 0),
    pointer: 0,
    qty: 0,
    invested: 0,
  }));

  return allDates.map((date) => {
    const row = {
      date,
      label: date.slice(5),
      COIN: 0,
      KR: 0,
      US: 0,
      total: 0,
    };

    states.forEach((state) => {
      while (state.pointer < state.transactions.length && state.transactions[state.pointer].date <= date) {
        const tx = state.transactions[state.pointer];
        const type = (tx.type || 'BUY').toUpperCase();
        const qty = Number(tx.quantity) || 0;
        const price = Number(tx.price) || 0;

        if (type === 'SELL') {
          const sellQty = Math.min(qty, state.qty);
          const avgBeforeSell = state.qty > 0 ? state.invested / state.qty : 0;
          state.qty -= sellQty;
          state.invested -= sellQty * avgBeforeSell;
        } else {
          state.qty += qty;
          state.invested += qty * price;
        }
        state.pointer += 1;
      }

      if (state.qty <= 0 || state.currentPrice <= 0) return;

      const value = state.qty * state.currentPrice;
      row[state.groupKey] += value;
      row.total += value;
    });

    row.COIN = Math.round(row.COIN);
    row.KR = Math.round(row.KR);
    row.US = Math.round(row.US);
    row.total = Math.round(row.total);

    return row;
  });
}

export function buildAssetGroupRealizedSeries(stocks = []) {
  const allDates = Array.from(
    new Set(
      stocks.flatMap((stock) =>
        (stock.transactions || []).map((tx) => tx.date).filter(Boolean)
      )
    )
  ).sort((a, b) => new Date(a) - new Date(b));

  if (allDates.length < 2) return [];

  const groupedTx = stocks.map((stock) => ({
    groupKey: getAssetGroupMeta(stock.market).key,
    transactions: [...(stock.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date)),
    pointer: 0,
    qty: 0,
    invested: 0,
    realizedPL: 0,
  }));

  return allDates.map((date) => {
    const row = { date, label: date.slice(5), COIN: 0, KR: 0, US: 0 };

    groupedTx.forEach((state) => {
      while (state.pointer < state.transactions.length && state.transactions[state.pointer].date <= date) {
        const tx = state.transactions[state.pointer];
        const type = (tx.type || 'BUY').toUpperCase();
        const qty = Number(tx.quantity) || 0;
        const price = Number(tx.price) || 0;

        if (type === 'SELL') {
          const sellQty = Math.min(qty, state.qty);
          const avgBeforeSell = state.qty > 0 ? state.invested / state.qty : 0;
          state.realizedPL += sellQty * (price - avgBeforeSell);
          state.qty -= sellQty;
          state.invested -= sellQty * avgBeforeSell;
        } else {
          state.qty += qty;
          state.invested += qty * price;
        }

        state.pointer += 1;
      }

      row[state.groupKey] += state.realizedPL;
    });

    row.COIN = Math.round(row.COIN);
    row.KR = Math.round(row.KR);
    row.US = Math.round(row.US);

    return row;
  });
}

export function buildAssetGroupProfitSeries(stocks = []) {
  const allDates = Array.from(
    new Set(
      stocks.flatMap((stock) =>
        (stock.transactions || []).map((tx) => tx.date).filter(Boolean)
      )
    )
  ).sort((a, b) => new Date(a) - new Date(b));

  if (allDates.length < 1) return [];

  const states = stocks.map((stock) => ({
    groupKey: getAssetGroupMeta(stock.market).key,
    transactions: [...(stock.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date)),
    currentPrice: Number(stock.currentPrice ?? stock.avgPrice ?? 0),
    pointer: 0,
    qty: 0,
    invested: 0,
    realizedPL: 0,
  }));

  return allDates.map((date) => {
    const row = { date, label: date.slice(5), COIN: 0, KR: 0, US: 0 };

    states.forEach((state) => {
      while (state.pointer < state.transactions.length && state.transactions[state.pointer].date <= date) {
        const tx = state.transactions[state.pointer];
        const type = (tx.type || 'BUY').toUpperCase();
        const qty = Number(tx.quantity) || 0;
        const price = Number(tx.price) || 0;

        if (type === 'SELL') {
          const sellQty = Math.min(qty, state.qty);
          const avgBeforeSell = state.qty > 0 ? state.invested / state.qty : 0;
          state.realizedPL += sellQty * (price - avgBeforeSell);
          state.qty -= sellQty;
          state.invested -= sellQty * avgBeforeSell;
        } else {
          state.qty += qty;
          state.invested += qty * price;
        }

        state.pointer += 1;
      }

      const value = state.qty > 0 && state.currentPrice > 0 ? state.qty * state.currentPrice : 0;
      const unrealizedPL = value - state.invested;
      row[state.groupKey] += unrealizedPL + state.realizedPL;
    });

    row.COIN = Math.round(row.COIN);
    row.KR = Math.round(row.KR);
    row.US = Math.round(row.US);

    return row;
  });
}

export function buildSingleAssetTrendSeries(stock, currentPrice = null) {
  const transactions = [...(stock?.transactions || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (transactions.length < 2) return [];

  let qty = 0;
  let invested = 0;
  let realizedPL = 0;
  const fallbackPrice = Number(currentPrice ?? stock?.currentPrice ?? stock?.avgPrice ?? 0);

  return transactions.map((tx) => {
    const type = (tx.type || 'BUY').toUpperCase();
    const txQty = Number(tx.quantity) || 0;
    const txPrice = Number(tx.price) || 0;

    if (type === 'SELL') {
      const sellQty = Math.min(txQty, qty);
      const avgBeforeSell = qty > 0 ? invested / qty : 0;
      realizedPL += sellQty * (txPrice - avgBeforeSell);
      qty -= sellQty;
      invested -= sellQty * avgBeforeSell;
    } else {
      qty += txQty;
      invested += txQty * txPrice;
    }

    const avgPrice = qty > 0 ? invested / qty : 0;
    const price = fallbackPrice || avgPrice;
    const value = qty * price;
    const unrealizedPL = value - invested;

    return {
      date: tx.date,
      label: tx.date.slice(5),
      invested: Math.round(invested),
      value: Math.round(value),
      realizedPL: Math.round(realizedPL),
      totalPL: Math.round(unrealizedPL + realizedPL),
    };
  });
}

/** 원화 포맷 */
export function fmtKRW(num) {
  if (num == null || isNaN(num)) return '-';
  return Math.round(num).toLocaleString('ko-KR') + '원';
}

/** 달러 포맷 */
export function fmtUSD(num) {
  if (num == null || isNaN(num)) return '-';
  return '$' + Number(num).toFixed(2);
}

/** 퍼센트 포맷 */
export function fmtPct(num) {
  if (num == null || isNaN(num)) return '-';
  const sign = num >= 0 ? '+' : '';
  return `${sign}${Number(num).toFixed(2)}%`;
}

/** 통화에 맞는 가격 포맷 */
export function fmtPrice(num, currency = 'KRW') {
  if (currency === 'USD') return fmtUSD(num);
  return fmtKRW(num);
}

/** 증권사 목록 */
export const BROKERS = [
  '키움증권', '미래에셋증권', '삼성증권', 'NH투자증권',
  'KB증권', '신한투자증권', '한국투자증권', '대신증권',
  '하나증권', '토스증권', '카카오페이증권', '직접입력',
];

/** 시장 목록 */
export const MARKETS = [
  { value: 'KS', label: '코스피 (KOSPI)' },
  { value: 'KQ', label: '코스닥 (KOSDAQ)' },
  { value: 'US', label: '미국 주식 (US)' },
  { value: 'COIN', label: '코인 (Crypto)' },
];

/** 파이차트용 색상 팔레트 */
export const CHART_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed',
  '#0891b2', '#be185d', '#059669', '#b45309', '#4338ca',
];
