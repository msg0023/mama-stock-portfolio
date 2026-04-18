import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer, Legend,
} from 'recharts';

/**
 * 거래일 기준 누적 원금 vs 현재 평가금액 추이
 * (현재가 고정 기준 – 과거 시세가 없으므로 근사치)
 */
export default function PortfolioLineChart({ enrichedStocks }) {
  const txByDate = {};

  enrichedStocks.forEach((stock) => {
    const pricePerShare = stock.currentPrice ?? stock.avgPrice ?? 0;
    (stock.transactions || []).forEach((tx) => {
      const date = tx.date;
      const direction = (tx.type || 'BUY').toUpperCase() === 'SELL' ? -1 : 1;
      if (!txByDate[date]) txByDate[date] = { invested: 0, qty: 0 };
      txByDate[date].invested += direction * tx.quantity * tx.price;
      txByDate[date].qty += direction * tx.quantity * pricePerShare;
    });
  });

  const sorted = Object.entries(txByDate).sort((a, b) => new Date(a[0]) - new Date(b[0]));
  if (sorted.length < 2) return null;

  let cumInvested = 0;
  let cumValue = 0;

  const chartData = sorted.map(([date, { invested, qty }]) => {
    cumInvested += invested;
    cumValue += qty;
    return {
      date: date.slice(5),
      투자원금: Math.round(cumInvested),
      평가금액: Math.round(cumValue),
    };
  });

  const fmt = (v) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(0) + '백만';
    if (v >= 1_000) return (v / 1_000).toFixed(0) + '천';
    return v;
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
        📈 투자 추이
      </h3>
      <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
        거래일 기준 누적 원금 vs 현재가 기준 평가금액
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid stroke="#f1f5f9" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
          <Tooltip
            formatter={(v, name) => [v.toLocaleString('ko-KR') + '원', name]}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <Legend wrapperStyle={{ fontSize: 13, fontFamily: 'Noto Sans KR' }} />
          <Line type="monotone" dataKey="투자원금" stroke="#94a3b8" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="평가금액" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
