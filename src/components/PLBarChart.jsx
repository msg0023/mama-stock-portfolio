import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  Cell, ReferenceLine, ResponsiveContainer,
} from 'recharts';

export default function PLBarChart({ enrichedStocks }) {
  const data = enrichedStocks
    .filter((s) => s.totalQty > 0)
    .map((s) => ({
      name:  s.name.length > 5 ? s.name.slice(0, 5) + '…' : s.name,
      pl:    Math.round(s.pl),
      color: s.pl >= 0 ? '#16a34a' : '#dc2626',
    }));

  if (!data.length) return null;

  const fmt = (v) => {
    if (Math.abs(v) >= 1_000_000) return (v / 1_000_000).toFixed(1) + '백만';
    if (Math.abs(v) >= 1_000)    return (v / 1_000).toFixed(0) + '천';
    return v.toString();
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12, color: '#1e293b' }}>
        💰 종목별 손익
      </h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="name"
            tick={{ fontSize: 12, fontFamily: 'Noto Sans KR' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={fmt}
            tick={{ fontSize: 11, fontFamily: 'Noto Sans KR' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            formatter={(v) => [v.toLocaleString('ko-KR') + '원', '손익']}
            contentStyle={{ fontFamily: 'Noto Sans KR', fontSize: 13, borderRadius: 10 }}
          />
          <ReferenceLine y={0} stroke="#e2e8f0" />
          <Bar dataKey="pl" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
